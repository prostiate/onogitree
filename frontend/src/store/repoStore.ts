import { createSignal, createMemo, createRoot } from 'solid-js';
import { RepoStatus, WorkspaceRecord } from '../types/git';
import { WailsBridge } from '../services/wailsBridge';

function createRepoStore() {
  const [repositories, setRepositories] = createSignal<RepoStatus[]>([]);
  const [selectedRepoId, setSelectedRepoId] = createSignal<string | null>(null);
  const [searchQuery, setSearchQuery] = createSignal<string>('');
  const [isLoading, setIsLoading] = createSignal<boolean>(false);
  const [activeWorkspace, setActiveWorkspace] = createSignal<WorkspaceRecord | null>(null);

  const selectedRepo = createMemo(() => {
    const id = selectedRepoId();
    if (!id) return repositories()[0] || null;
    return repositories().find((r) => r.id === id) || null;
  });

  const filteredRepositories = createMemo(() => {
    const query = searchQuery().toLowerCase().trim();
    const list = repositories();
    if (!query) {
      // Sort pinned to top
      return [...list].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
    }
    return list
      .filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.currentBranch.toLowerCase().includes(query) ||
          r.path.toLowerCase().includes(query)
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

    setSearchQuery(q: string) {
      setSearchQuery(q);
    },

    selectRepo(id: string) {
      setSelectedRepoId(id);
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
        }
      } catch (err) {
        console.error('Failed to load workspace:', err);
      } finally {
        setIsLoading(false);
      }
    },

    async addRepository(path: string) {
      setIsLoading(true);
      try {
        const status = await WailsBridge.addRepository(path);
        setRepositories((prev) => {
          const exists = prev.some((r) => r.id === status.id);
          if (exists) return prev.map((r) => (r.id === status.id ? status : r));
          return [...prev, status];
        });
        setSelectedRepoId(status.id);
      } catch (err) {
        console.error('Failed to add repository:', err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },

    async removeRepository(id: string) {
      try {
        await WailsBridge.removeRepository(id);
        setRepositories((prev) => prev.filter((r) => r.id !== id));
        if (selectedRepoId() === id) {
          const remaining = repositories();
          setSelectedRepoId(remaining.length > 0 ? remaining[0].id : null);
        }
      } catch (err) {
        console.error('Failed to remove repository:', err);
      }
    },

    async togglePin(id: string) {
      const repo = repositories().find((r) => r.id === id);
      if (!repo) return;
      const newPinned = !repo.isPinned;
      try {
        await WailsBridge.togglePin(id, newPinned);
        setRepositories((prev) =>
          prev.map((r) => (r.id === id ? { ...r, isPinned: newPinned } : r))
        );
      } catch (err) {
        console.error('Failed to toggle pin:', err);
      }
    },

    async toggleAutoFetch(id: string) {
      const repo = repositories().find((r) => r.id === id);
      if (!repo) return;
      const newAutoFetch = !repo.autoFetchEnabled;
      try {
        await WailsBridge.toggleAutoFetch(id, newAutoFetch);
        setRepositories((prev) =>
          prev.map((r) => (r.id === id ? { ...r, autoFetchEnabled: newAutoFetch } : r))
        );
      } catch (err) {
        console.error('Failed to toggle auto fetch:', err);
      }
    },

    async refreshRepo(path: string) {
      try {
        const status = await WailsBridge.getRepoStatus(path);
        setRepositories((prev) => prev.map((r) => (r.id === path ? status : r)));
      } catch (err) {
        console.error('Failed to refresh repo status:', err);
      }
    },

    async refreshAll() {
      setIsLoading(true);
      try {
        const statuses = await WailsBridge.refreshAll();
        setRepositories(statuses);
      } catch (err) {
        console.error('Failed to refresh all repos:', err);
      } finally {
        setIsLoading(false);
      }
    },

    async checkoutBranch(repoPath: string, branchName: string) {
      setIsLoading(true);
      try {
        await WailsBridge.checkoutBranch(repoPath, branchName);
        await this.refreshRepo(repoPath);
      } catch (err) {
        console.error('Failed to checkout branch:', err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },

    async stageFiles(repoPath: string, files: string[]) {
      try {
        await WailsBridge.stageFiles(repoPath, files);
        await this.refreshRepo(repoPath);
      } catch (err) {
        console.error('Failed to stage files:', err);
      }
    },

    async unstageFiles(repoPath: string, files: string[]) {
      try {
        await WailsBridge.unstageFiles(repoPath, files);
        await this.refreshRepo(repoPath);
      } catch (err) {
        console.error('Failed to unstage files:', err);
      }
    },

    async discardFiles(repoPath: string, files: string[]) {
      try {
        await WailsBridge.discardFiles(repoPath, files);
        await this.refreshRepo(repoPath);
      } catch (err) {
        console.error('Failed to discard files:', err);
      }
    },

    async openPath(targetPath: string) {
      try {
        await WailsBridge.openPathInSystem(targetPath);
      } catch (err) {
        console.error('Failed to open path:', err);
      }
    },

    async addToGitignore(repoPath: string, pattern: string) {
      try {
        await WailsBridge.addToGitignore(repoPath, pattern);
        await this.refreshRepo(repoPath);
      } catch (err) {
        console.error('Failed to add to gitignore:', err);
      }
    },

    async commit(repoPath: string, message: string, amend: boolean = false) {
      setIsLoading(true);
      try {
        await WailsBridge.commit(repoPath, message, amend);
        await this.refreshRepo(repoPath);
      } catch (err) {
        console.error('Failed to commit:', err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
  };
}


export const repoStore = createRoot(createRepoStore);
