import { createSignal, createMemo, createRoot } from "solid-js";
import {
  RepoStatus,
  WorkspaceRecord,
  CommitSummary,
  CommitDetail,
} from "../types/git";
import { WailsBridge } from "../services/wailsBridge";

export interface DiffSelection {
  filePath: string;
  staged: boolean;
  commitHash?: string; // If diffing a file from a commit
}

function createRepoStore() {
  const [repositories, setRepositories] = createSignal<RepoStatus[]>([]);
  const [selectedRepoId, setSelectedRepoId] = createSignal<string | null>(null);
  const [searchQuery, setSearchQuery] = createSignal<string>("");
  const [isLoading, setIsLoading] = createSignal<boolean>(false);
  const [activeWorkspace, setActiveWorkspace] =
    createSignal<WorkspaceRecord | null>(null);
  const [selectedFileDiff, setSelectedFileDiff] =
    createSignal<DiffSelection | null>(null);
  const [recentCommits, setRecentCommits] = createSignal<CommitSummary[]>([]);
  const [commitLimit, setCommitLimit] = createSignal<number>(25);
  const [expandedCommitHash, setExpandedCommitHash] = createSignal<
    string | null
  >(null);
  const [expandedCommitHashes, setExpandedCommitHashes] = createSignal<
    Set<string>
  >(new Set<string>());
  const [commitDetailsMap, setCommitDetailsMap] = createSignal<
    Record<string, CommitDetail>
  >({});
  const [selectedCommitDetail, setSelectedCommitDetail] =
    createSignal<CommitDetail | null>(null);
  const [isLoadingCommitDetail, setIsLoadingCommitDetail] =
    createSignal<boolean>(false);
  const [refreshingRepoPaths, setRefreshingRepoPaths] = createSignal<
    Set<string>
  >(new Set<string>());

  // Fast In-Memory Diff & Commit Cache to prevent flash/flicker
  const diffCache = new Map<string, string>();
  const commitCache = new Map<string, CommitDetail>();

  const selectedRepo = createMemo(() => {
    const id = selectedRepoId();
    if (!id) return repositories()[0] || null;
    return repositories().find((r) => r.id === id || r.path === id) || null;
  });

  const filteredRepositories = createMemo(() => {
    const query = searchQuery().toLowerCase().trim();
    const list = repositories();
    if (!query) {
      // Sort pinned to top
      return [...list].sort(
        (a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0),
      );
    }
    return list
      .filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.currentBranch.toLowerCase().includes(query) ||
          r.path.toLowerCase().includes(query),
      )
      .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
  });

  return {
    repositories,
    selectedRepoId,
    searchQuery,
    isLoading,
    activeWorkspace,
    selectedRepo,
    filteredRepositories,
    selectedFileDiff,
    recentCommits,
    commitLimit,
    expandedCommitHash,
    expandedCommitHashes,
    commitDetailsMap,
    selectedCommitDetail,
    isLoadingCommitDetail,
    refreshingRepoPaths,

    setSearchQuery(q: string) {
      setSearchQuery(q);
    },

    setCommitLimit(limit: number) {
      setCommitLimit(limit);
      const repo = selectedRepo();
      if (repo) {
        void this.loadRecentCommits(repo.path, limit);
      }
    },

    isRefreshingRepo(path: string) {
      return refreshingRepoPaths().has(path);
    },

    selectRepo(id: string) {
      setSelectedRepoId(id);
      setSelectedFileDiff(null);
      setExpandedCommitHash(null);
      setExpandedCommitHashes(new Set<string>());
      setSelectedCommitDetail(null);
      const repo = repositories().find((r) => r.id === id || r.path === id);
      if (repo) {
        void this.loadRecentCommits(repo.path);
      } else {
        void this.loadRecentCommits(id);
      }
    },

    selectFileForDiff(filePath: string, staged: boolean, commitHash?: string) {
      setSelectedFileDiff({ filePath, staged, commitHash });
    },

    clearFileDiff() {
      setSelectedFileDiff(null);
    },

    async fetchAndCacheCommit(repoPath: string, commitHash: string) {
      const cacheKey = `${repoPath}::${commitHash}`;
      if (commitCache.has(cacheKey)) {
        const cached = commitCache.get(cacheKey)!;
        setCommitDetailsMap((prev) => ({ ...prev, [commitHash]: cached }));
        setSelectedCommitDetail(cached);
        return cached;
      }

      setIsLoadingCommitDetail(true);
      try {
        const detail = await WailsBridge.getCommitDetails(repoPath, commitHash);
        if (detail) {
          commitCache.set(cacheKey, detail);
          commitCache.set(commitHash, detail);
          setCommitDetailsMap((prev) => ({ ...prev, [commitHash]: detail }));
          setSelectedCommitDetail(detail);
          return detail;
        }
      } catch (err) {
        console.error("Failed to load commit details:", err);
      } finally {
        setIsLoadingCommitDetail(false);
      }
      return undefined;
    },

    getCommitDetail(hash: string): CommitDetail | undefined {
      return commitDetailsMap()[hash] || commitCache.get(hash);
    },

    async toggleCommitExpanded(commitHash: string) {
      const repo = selectedRepo();
      if (!repo) return;
      const isExpanded = expandedCommitHashes().has(commitHash);
      if (isExpanded) {
        setExpandedCommitHashes((prev) => {
          const next = new Set(prev);
          next.delete(commitHash);
          return next;
        });
        if (expandedCommitHash() === commitHash) {
          setExpandedCommitHash(null);
          setSelectedCommitDetail(null);
        }
      } else {
        setExpandedCommitHashes((prev) => new Set(prev).add(commitHash));
        setExpandedCommitHash(commitHash);
        await this.fetchAndCacheCommit(repo.path, commitHash);
      }
    },

    async expandAllCommits(hashes: string[]) {
      const repo = selectedRepo();
      if (!repo) return;
      setExpandedCommitHashes(new Set(hashes));
      if (hashes.length > 0) {
        setExpandedCommitHash(hashes[0]);
      }
      await Promise.all(
        hashes.map((h) => this.fetchAndCacheCommit(repo.path, h)),
      );
    },

    collapseAllCommits() {
      setExpandedCommitHashes(new Set<string>());
      setExpandedCommitHash(null);
      setSelectedCommitDetail(null);
    },

    setExpandedCommit(hash: string | null) {
      setExpandedCommitHash(hash);
      if (!hash) {
        setSelectedCommitDetail(null);
        setExpandedCommitHashes(new Set<string>());
        return;
      }
      setExpandedCommitHashes(new Set<string>([hash]));
      void this.selectCommit(hash);
    },

    async selectCommit(commitHash: string) {
      const repo = selectedRepo();
      if (!repo) return;
      await this.fetchAndCacheCommit(repo.path, commitHash);
    },

    clearSelectedCommit() {
      setSelectedCommitDetail(null);
      setExpandedCommitHash(null);
      setExpandedCommitHashes(new Set<string>());
    },

    async getDiff(
      repoPath: string,
      filePath: string,
      staged: boolean,
      commitHash?: string,
    ): Promise<string> {
      const cacheKey = `${repoPath}::${commitHash || (staged ? "staged" : "unstaged")}::${filePath}`;
      if (diffCache.has(cacheKey)) {
        return diffCache.get(cacheKey)!;
      }

      let diff = "";
      if (commitHash) {
        diff = await WailsBridge.getCommitFileDiff(
          repoPath,
          commitHash,
          filePath,
        );
      } else {
        diff = await WailsBridge.getFileDiff(repoPath, filePath, staged);
      }
      diffCache.set(cacheKey, diff);
      return diff;
    },

    invalidateDiffCache() {
      diffCache.clear();
    },

    async loadRecentCommits(repoPath: string, limit?: number) {
      const l = limit ?? commitLimit();
      try {
        const commits = await WailsBridge.getRecentCommits(repoPath, l);
        setRecentCommits(commits);
      } catch (err) {
        console.error("Failed to load recent commits:", err);
      }
    },

    async loadMoreCommits(repoPath: string, delta: number = 25) {
      const nextLimit = commitLimit() + delta;
      setCommitLimit(nextLimit);
      await this.loadRecentCommits(repoPath, nextLimit);
    },

    async loadWorkspace() {
      setIsLoading(true);
      try {
        const ws = await WailsBridge.getActiveWorkspace();
        setActiveWorkspace(ws);
        const statuses = await WailsBridge.refreshAll();
        setRepositories(statuses);
        if (statuses.length > 0 && !selectedRepoId()) {
          setSelectedRepoId(statuses[0].id);
          void this.loadRecentCommits(statuses[0].path);
        }
      } catch (err) {
        console.error("Failed to load workspace:", err);
      } finally {
        setIsLoading(false);
      }
    },

    async addRepository(path: string) {
      setIsLoading(true);
      try {
        const status = await WailsBridge.addRepository(path);
        setRepositories((prev) => {
          const exists = prev.some(
            (r) => r.id === status.id || r.path === status.path,
          );
          if (exists)
            return prev.map((r) =>
              r.id === status.id || r.path === status.path ? status : r,
            );
          return [...prev, status];
        });
        setSelectedRepoId(status.id);
        void this.loadRecentCommits(status.path);
      } catch (err) {
        console.error("Failed to add repository:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },

    async removeRepository(id: string) {
      try {
        await WailsBridge.removeRepository(id);
        setRepositories((prev) =>
          prev.filter((r) => r.id !== id && r.path !== id),
        );
        if (selectedRepoId() === id) {
          const remaining = repositories();
          setSelectedRepoId(remaining.length > 0 ? remaining[0].id : null);
          if (remaining.length > 0) {
            void this.loadRecentCommits(remaining[0].path);
          }
        }
      } catch (err) {
        console.error("Failed to remove repository:", err);
      }
    },

    async togglePin(id: string) {
      const repo = repositories().find((r) => r.id === id || r.path === id);
      if (!repo) return;
      const newPinned = !repo.isPinned;
      try {
        await WailsBridge.togglePin(id, newPinned);
        setRepositories((prev) =>
          prev.map((r) =>
            r.id === id || r.path === id ? { ...r, isPinned: newPinned } : r,
          ),
        );
      } catch (err) {
        console.error("Failed to toggle pin:", err);
      }
    },

    async toggleAutoFetch(id: string) {
      const repo = repositories().find((r) => r.id === id || r.path === id);
      if (!repo) return;
      const newAutoFetch = !repo.autoFetchEnabled;
      try {
        await WailsBridge.toggleAutoFetch(id, newAutoFetch);
        setRepositories((prev) =>
          prev.map((r) =>
            r.id === id || r.path === id
              ? { ...r, autoFetchEnabled: newAutoFetch }
              : r,
          ),
        );
      } catch (err) {
        console.error("Failed to toggle auto fetch:", err);
      }
    },

    async refreshRepo(path: string) {
      setRefreshingRepoPaths((prev) => new Set(prev).add(path));
      try {
        this.invalidateDiffCache();
        const status = await WailsBridge.getRepoStatus(path);
        setRepositories((prev) =>
          prev.map((r) => (r.id === path || r.path === path ? status : r)),
        );
        await this.loadRecentCommits(path, commitLimit());
      } catch (err) {
        console.error("Failed to refresh repo status:", err);
      } finally {
        setTimeout(() => {
          setRefreshingRepoPaths((prev) => {
            const next = new Set(prev);
            next.delete(path);
            return next;
          });
        }, 500);
      }
    },

    async refreshAll() {
      setIsLoading(true);
      try {
        this.invalidateDiffCache();
        const statuses = await WailsBridge.refreshAll();
        setRepositories(statuses);
        const sel = selectedRepo();
        if (sel) {
          await this.loadRecentCommits(sel.path, commitLimit());
        }
      } catch (err) {
        console.error("Failed to refresh all repos:", err);
      } finally {
        setIsLoading(false);
      }
    },

    async checkoutBranch(repoPath: string, branchName: string) {
      setIsLoading(true);
      try {
        this.invalidateDiffCache();
        await WailsBridge.checkoutBranch(repoPath, branchName);
        await this.refreshRepo(repoPath);
      } catch (err) {
        console.error("Failed to checkout branch:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },

    async stageFiles(repoPath: string, files: string[]) {
      try {
        this.invalidateDiffCache();
        await WailsBridge.stageFiles(repoPath, files);
        await this.refreshRepo(repoPath);
      } catch (err) {
        console.error("Failed to stage files:", err);
      }
    },

    async unstageFiles(repoPath: string, files: string[]) {
      try {
        this.invalidateDiffCache();
        await WailsBridge.unstageFiles(repoPath, files);
        await this.refreshRepo(repoPath);
      } catch (err) {
        console.error("Failed to unstage files:", err);
      }
    },

    async discardFiles(repoPath: string, files: string[]) {
      try {
        this.invalidateDiffCache();
        await WailsBridge.discardFiles(repoPath, files);
        if (
          selectedFileDiff() &&
          files.includes(selectedFileDiff()!.filePath)
        ) {
          setSelectedFileDiff(null);
        }
        await this.refreshRepo(repoPath);
      } catch (err) {
        console.error("Failed to discard files:", err);
      }
    },

    async openPath(targetPath: string) {
      try {
        await WailsBridge.openPathInSystem(targetPath);
      } catch (err) {
        console.error("Failed to open path:", err);
      }
    },

    async addToGitignore(repoPath: string, pattern: string) {
      try {
        this.invalidateDiffCache();
        await WailsBridge.addToGitignore(repoPath, pattern);
        await this.refreshRepo(repoPath);
      } catch (err) {
        console.error("Failed to add to gitignore:", err);
      }
    },

    async commit(repoPath: string, message: string, amend: boolean = false) {
      setIsLoading(true);
      try {
        this.invalidateDiffCache();
        await WailsBridge.commit(repoPath, message, amend);
        await this.refreshRepo(repoPath);
      } catch (err) {
        console.error("Failed to commit:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },

    async pushRepo(repoPath: string) {
      setIsLoading(true);
      try {
        await WailsBridge.pushRepository(repoPath);
        await this.refreshRepo(repoPath);
      } catch (err) {
        console.error("Failed to push:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
  };
}

export const repoStore = createRoot(createRepoStore);
