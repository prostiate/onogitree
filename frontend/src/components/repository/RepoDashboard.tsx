import { Component, createSignal, createMemo, For, Show } from "solid-js";
import {
  GitBranch,
  RefreshCw,
  ArrowUpFromLine,
  Folder,
  Plus,
  Minus,
  History,
  CheckCircle2,
  Layers,
  FileCode,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  GitCommit,
  User,
  Calendar,
  ExternalLink,
  List,
  FolderTree,
  FolderOpen,
  ChevronsUpDown,
  FileDiff,
  Search,
  X,
} from "lucide-solid";
import { repoStore } from "../../store/repoStore";
import { settingsStore } from "../../store/settingsStore";
import {
  RepoStatus,
  FileStatus,
  CommitSummary,
  CommitFileChange,
} from "../../types/git";
import { ContextMenu, MenuItem } from "../common/ContextMenu";
import { buildGenericTree, GenericTreeNode } from "../../utils/fileTree";
import { GitGraphView } from "./GitGraphView";

interface RepoDashboardProps {
  repo: RepoStatus;
  onBranchPickerOpen: () => void;
}

export const RepoDashboard: Component<RepoDashboardProps> = (props) => {
  const [contextMenuPos, setContextMenuPos] = createSignal<{
    x: number;
    y: number;
    commit: CommitSummary;
  } | null>(null);
  const [copiedHash, setCopiedHash] = createSignal<string | null>(null);
  const [expandedFolders, setExpandedFolders] = createSignal<Set<string>>(
    new Set<string>(),
  );
  const [uncommittedExpandedFolders, setUncommittedExpandedFolders] =
    createSignal<Set<string>>(new Set<string>());
  const [commitSearch, setCommitSearch] = createSignal<string>("");

  const commits = () => repoStore.recentCommits();
  const files = () => props.repo.files || [];
  const expandedCommitHashes = () => repoStore.expandedCommitHashes();
  const commitFilesViewMode = () =>
    settingsStore.settings().commitFilesViewMode || "tree";

  const uncommittedChangesViewMode = () =>
    settingsStore.settings().uncommittedChangesViewMode || "tree";

  const commitHistoryViewMode = () =>
    settingsStore.settings().commitHistoryViewMode || "graph";

  const handleCommitClick = (commit: CommitSummary) => {
    void repoStore.toggleCommitExpanded(commit.hash);
  };

  const handleCommitContextMenu = (e: MouseEvent, commit: CommitSummary) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY, commit });
  };

  const copyText = (text: string, id: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Filtered Commits
  const filteredCommits = createMemo(() => {
    const q = commitSearch().toLowerCase().trim();
    const list = commits();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.subject.toLowerCase().includes(q) ||
        c.authorName.toLowerCase().includes(q) ||
        c.shortHash.toLowerCase().includes(q) ||
        c.hash.toLowerCase().includes(q) ||
        (c.refs && c.refs.toLowerCase().includes(q)),
    );
  });

  const isAllCommitsExpanded = () => {
    const visible = filteredCommits();
    if (visible.length === 0) return false;
    const expanded = expandedCommitHashes();
    return visible.every((c) => expanded.has(c.hash));
  };

  const toggleExpandAllCommits = () => {
    const visible = filteredCommits();
    if (isAllCommitsExpanded()) {
      repoStore.collapseAllCommits();
    } else {
      void repoStore.expandAllCommits(visible.map((c) => c.hash));
    }
  };

  // Uncommitted tree & folder handling
  const uncommittedFilesTree = createMemo(() => {
    return buildGenericTree(files());
  });

  const toggleUncommittedFolder = (folderId: string) => {
    setUncommittedExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Collect all folder IDs from generic tree
  const getAllFolderIds = <T extends { path: string }>(
    nodes: GenericTreeNode<T>[],
  ): string[] => {
    const ids: string[] = [];
    const traverse = (list: GenericTreeNode<T>[]) => {
      for (const node of list) {
        if (node.isFolder) {
          ids.push(node.id);
          traverse(node.children);
        }
      }
    };
    traverse(nodes);
    return ids;
  };

  const isAllUncommittedFoldersExpanded = () => {
    const allIds = getAllFolderIds(uncommittedFilesTree());
    if (allIds.length === 0) return false;
    const current = uncommittedExpandedFolders();
    return allIds.every((id) => current.has(id));
  };

  const toggleExpandAllUncommittedFolders = () => {
    const allIds = getAllFolderIds(uncommittedFilesTree());
    const current = uncommittedExpandedFolders();
    const allExpanded = allIds.every((id) => current.has(id));

    if (allExpanded) {
      setUncommittedExpandedFolders(new Set<string>());
    } else {
      setUncommittedExpandedFolders(new Set(allIds));
    }
  };

  const isAllCommitFoldersExpanded = (filesList: CommitFileChange[]) => {
    const tree = buildGenericTree(filesList);
    const allIds = getAllFolderIds(tree);
    if (allIds.length === 0) return false;
    const current = expandedFolders();
    return allIds.every((id) => current.has(id));
  };

  const toggleExpandAllCommitFolders = (filesList: CommitFileChange[]) => {
    const tree = buildGenericTree(filesList);
    const allIds = getAllFolderIds(tree);
    const current = expandedFolders();
    const allExpanded = allIds.every((id) => current.has(id));

    if (allExpanded) {
      setExpandedFolders(new Set<string>());
    } else {
      setExpandedFolders(new Set(allIds));
    }
  };

  const getContextMenuItems = (commit: CommitSummary): MenuItem[] => [
    {
      id: "inspect",
      label: "Inspect Commit Changes",
      icon: <GitCommit class="w-3.5 h-3.5 text-indigo-400" />,
      onClick: () => handleCommitClick(commit),
    },
    {
      id: "view-all-diff",
      label: "View Entire Commit Diff",
      icon: <FileDiff class="w-3.5 h-3.5 text-cyan-400" />,
      onClick: () => repoStore.selectFileForDiff("__ALL__", false, commit.hash),
    },
    { id: "div-1", label: "", divider: true },
    {
      id: "copy-hash",
      label: "Copy Commit Hash (Full SHA)",
      icon: <Copy class="w-3.5 h-3.5 text-gray-400" />,
      onClick: () => copyText(commit.hash, commit.hash),
    },
    {
      id: "copy-short",
      label: "Copy Short Hash",
      icon: <Copy class="w-3.5 h-3.5 text-gray-400" />,
      onClick: () => copyText(commit.shortHash, commit.shortHash),
    },
    {
      id: "copy-subj",
      label: "Copy Commit Message",
      icon: <Copy class="w-3.5 h-3.5 text-gray-400" />,
      onClick: () => copyText(commit.subject, `subj-${commit.hash}`),
    },
    { id: "div-2", label: "", divider: true },
    {
      id: "checkout",
      label: `Checkout Commit ${commit.shortHash}...`,
      icon: <GitBranch class="w-3.5 h-3.5 text-emerald-400" />,
      onClick: () => repoStore.checkoutBranch(props.repo.path, commit.hash),
    },
  ];

  const getStatusBadge = (status: FileStatus["status"]) => {
    switch (status) {
      case "modified":
        return (
          <span class="px-1.5 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded text-[10px] font-mono font-bold">
            MODIFIED
          </span>
        );
      case "staged":
        return (
          <span class="px-1.5 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded text-[10px] font-mono font-bold">
            STAGED
          </span>
        );
      case "deleted":
        return (
          <span class="px-1.5 py-0.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded text-[10px] font-mono font-bold">
            DELETED
          </span>
        );
      case "untracked":
        return (
          <span class="px-1.5 py-0.5 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 rounded text-[10px] font-mono font-bold">
            UNTRACKED
          </span>
        );
      default:
        return (
          <span class="px-1.5 py-0.5 bg-gray-500/15 border border-gray-500/30 text-gray-300 rounded text-[10px] font-mono font-bold">
            MODIFIED
          </span>
        );
    }
  };

  const getFileChangeBadge = (status: CommitFileChange["status"]) => {
    switch (status) {
      case "added":
        return (
          <span class="px-1.5 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded text-[9.5px] font-mono font-bold">
            ADDED
          </span>
        );
      case "deleted":
        return (
          <span class="px-1.5 py-0.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded text-[9.5px] font-mono font-bold">
            DELETED
          </span>
        );
      case "renamed":
        return (
          <span class="px-1.5 py-0.5 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 rounded text-[9.5px] font-mono font-bold">
            RENAMED
          </span>
        );
      default:
        return (
          <span class="px-1.5 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded text-[9.5px] font-mono font-bold">
            MODIFIED
          </span>
        );
    }
  };

  // Recursive Tree Node Renderer for Uncommitted Active Changes
  const renderUncommittedTreeNode = (
    node: GenericTreeNode<FileStatus>,
    depth: number = 0,
  ) => {
    const isFolder = node.isFolder;
    const isExpanded = () =>
      uncommittedExpandedFolders().has(node.id) ||
      (uncommittedExpandedFolders().size === 0 && depth === 0);

    if (isFolder) {
      return (
        <div class="select-none">
          <div
            onClick={() => toggleUncommittedFolder(node.id)}
            class="flex items-center gap-1.5 px-3 py-1.5 hover:bg-[#151926] text-gray-300 hover:text-white cursor-pointer text-xs font-mono transition-colors"
            style={{ "padding-left": `${depth * 14 + 12}px` }}
          >
            <Show
              when={isExpanded()}
              fallback={<ChevronRight class="w-3.5 h-3.5 text-gray-500" />}
            >
              <ChevronDown class="w-3.5 h-3.5 text-indigo-400" />
            </Show>
            <Show
              when={isExpanded()}
              fallback={<Folder class="w-3.5 h-3.5 text-amber-400/80" />}
            >
              <FolderOpen class="w-3.5 h-3.5 text-amber-400" />
            </Show>
            <span class="font-semibold text-gray-300">{node.name}</span>
          </div>

          <Show when={isExpanded()}>
            <For each={node.children}>
              {(child) => renderUncommittedTreeNode(child, depth + 1)}
            </For>
          </Show>
        </div>
      );
    }

    const file = node.item!;
    return (
      <div
        onClick={() => repoStore.selectFileForDiff(file.path, file.staged)}
        class="group flex items-center justify-between px-3 py-1.5 hover:bg-[#161B26] text-gray-300 hover:text-white cursor-pointer text-xs font-mono transition-colors"
        style={{ "padding-left": `${depth * 14 + 26}px` }}
      >
        <div class="flex items-center gap-2.5 min-w-0">
          {getStatusBadge(file.status)}
          <span class="truncate text-gray-200 group-hover:text-indigo-300">
            {node.name}
          </span>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0 mr-1">
          <span class="text-[11px] text-gray-500 font-mono opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <FileCode class="w-3 h-3 text-indigo-400" />
            <span>Inspect Diff</span>
          </span>

          <Show
            when={file.staged}
            fallback={
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  void repoStore.stageFiles(props.repo.path, [file.path]);
                }}
                class="p-1 hover:bg-emerald-500/20 text-gray-400 hover:text-emerald-400 rounded transition-colors"
                title="Stage File"
              >
                <Plus class="w-3.5 h-3.5" />
              </button>
            }
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                void repoStore.unstageFiles(props.repo.path, [file.path]);
              }}
              class="p-1 hover:bg-amber-500/20 text-gray-400 hover:text-amber-400 rounded transition-colors"
              title="Unstage File"
            >
              <Minus class="w-3.5 h-3.5" />
            </button>
          </Show>
        </div>
      </div>
    );
  };

  // Recursive Tree Node Renderer for Commit Files
  const renderCommitTreeNode = (
    node: GenericTreeNode<CommitFileChange>,
    commitHash: string,
    depth: number = 0,
  ) => {
    const isFolder = node.isFolder;
    const isExpanded = () =>
      expandedFolders().has(node.id) ||
      (expandedFolders().size === 0 && depth === 0);

    if (isFolder) {
      return (
        <div class="select-none">
          <div
            onClick={() => toggleFolder(node.id)}
            class="flex items-center gap-1.5 px-3 py-1.5 hover:bg-[#151926] text-gray-300 hover:text-white cursor-pointer text-xs font-mono transition-colors"
            style={{ "padding-left": `${depth * 14 + 12}px` }}
          >
            <Show
              when={isExpanded()}
              fallback={<ChevronRight class="w-3.5 h-3.5 text-gray-500" />}
            >
              <ChevronDown class="w-3.5 h-3.5 text-indigo-400" />
            </Show>
            <Show
              when={isExpanded()}
              fallback={<Folder class="w-3.5 h-3.5 text-amber-400/80" />}
            >
              <FolderOpen class="w-3.5 h-3.5 text-amber-400" />
            </Show>
            <span class="font-semibold text-gray-300">{node.name}</span>
          </div>

          <Show when={isExpanded()}>
            <For each={node.children}>
              {(child) => renderCommitTreeNode(child, commitHash, depth + 1)}
            </For>
          </Show>
        </div>
      );
    }

    const file = node.item!;
    return (
      <div
        onClick={() =>
          repoStore.selectFileForDiff(file.path, false, commitHash)
        }
        class="group flex items-center justify-between px-3 py-1.5 hover:bg-[#151926] text-gray-300 hover:text-white cursor-pointer text-xs font-mono transition-colors"
        style={{ "padding-left": `${depth * 14 + 26}px` }}
      >
        <div class="flex items-center gap-2 min-w-0">
          {getFileChangeBadge(file.status)}
          <span class="truncate text-gray-200 group-hover:text-indigo-300">
            {node.name}
          </span>
        </div>

        <div class="flex items-center gap-2 text-[11px] tabular-nums flex-shrink-0 mr-1">
          <Show when={file.additions > 0}>
            <span class="text-emerald-400">+{file.additions}</span>
          </Show>
          <Show when={file.deletions > 0}>
            <span class="text-rose-400">-{file.deletions}</span>
          </Show>
          <ExternalLink class="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
        </div>
      </div>
    );
  };

  return (
    <div class="flex-1 flex flex-col overflow-y-auto p-6 space-y-6 text-gray-200 select-none">
      {/* 1. Repository Hero Header Card */}
      <div class="bg-[#11141D] border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="space-y-2">
          <div class="flex items-center gap-3">
            <h1 class="text-xl font-black text-white tracking-tight">
              {props.repo.name}
            </h1>

            {/* Noticeable Branch Switcher Button */}
            <button
              onClick={props.onBranchPickerOpen}
              class="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/50 rounded-lg text-xs font-mono text-indigo-300 font-bold cursor-pointer transition-all shadow-sm hover:scale-[1.02]"
              title="Click to switch or create branch"
            >
              <GitBranch class="w-3.5 h-3.5 text-indigo-400 stroke-[2.5]" />
              <span>{props.repo.currentBranch}</span>
              <Show when={props.repo.isDirty}>
                <span
                  class="text-amber-400 font-black text-sm"
                  title="Uncommitted changes"
                >
                  *
                </span>
              </Show>
            </button>
          </div>

          <p class="text-xs text-gray-400 font-mono flex items-center gap-2">
            <span>{props.repo.path}</span>
          </p>
        </div>

        {/* Global Quick Action Toolbar for Repository */}
        <div class="flex flex-wrap items-center gap-2">
          <button
            onClick={() => repoStore.openPath(props.repo.path)}
            class="px-3 py-1.5 bg-[#171B26] hover:bg-[#202534] border border-gray-700/60 rounded-xl text-xs font-medium text-gray-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Open folder in system file manager"
          >
            <Folder class="w-3.5 h-3.5 text-amber-400" />
            <span>Open Directory</span>
          </button>

          <Show when={props.repo.aheadCount > 0}>
            <button
              onClick={async () => {
                try {
                  await repoStore.pushRepo(props.repo.path);
                } catch (err) {
                  console.error("Push error:", err);
                }
              }}
              disabled={repoStore.isLoading()}
              class="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
              title={`Push ${props.repo.aheadCount} outgoing commits to upstream`}
            >
              <Show
                when={repoStore.isLoading()}
                fallback={<ArrowUpFromLine class="w-3.5 h-3.5" />}
              >
                <RefreshCw class="w-3.5 h-3.5 animate-spin" />
              </Show>
              <span>
                {repoStore.isLoading()
                  ? "Pushing..."
                  : `Push ${props.repo.aheadCount} Commits`}
              </span>
            </button>
          </Show>

          <button
            onClick={() => repoStore.refreshRepo(props.repo.path)}
            class="px-3 py-1.5 bg-[#171B26] hover:bg-[#202534] border border-gray-700/60 rounded-xl text-xs font-medium text-gray-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Scan working tree and reload commit history"
          >
            <RefreshCw
              class={`w-3.5 h-3.5 text-cyan-400 ${
                repoStore.isRefreshingRepo(props.repo.path)
                  ? "animate-spin"
                  : ""
              }`}
            />
            <span>
              {repoStore.isRefreshingRepo(props.repo.path)
                ? "Refreshing..."
                : "Refresh"}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics & Status Bar */}
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Upstream Divergence */}
        <div class="bg-[#11141D] border border-gray-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <div class="flex items-center justify-between">
            <span class="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
              Upstream Sync
            </span>
            <span class="text-xs text-gray-500 font-mono truncate">
              {props.repo.upstreamBranch || "Local branch"}
            </span>
          </div>
          <div class="flex items-baseline gap-3 font-mono">
            <span
              class={`text-base font-extrabold ${props.repo.aheadCount > 0 ? "text-emerald-400" : "text-gray-400"}`}
            >
              +{props.repo.aheadCount} ahead
            </span>
            <span
              class={`text-base font-extrabold ${props.repo.behindCount > 0 ? "text-amber-400" : "text-gray-400"}`}
            >
              ~{props.repo.behindCount} behind
            </span>
          </div>
          <p class="text-[11px] text-gray-400">
            {props.repo.aheadCount === 0 && props.repo.behindCount === 0
              ? "In sync with remote upstream"
              : "Pending commits to sync"}
          </p>
        </div>

        {/* Working Tree Changes */}
        <div class="bg-[#11141D] border border-gray-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <span class="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">
            Working Tree
          </span>
          <div class="text-base font-extrabold text-white font-mono flex items-center gap-2">
            <span>{props.repo.changedFilesCount} Files Changed</span>
            <Show when={props.repo.isDirty}>
              <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            </Show>
          </div>
          <p class="text-[11px] text-gray-400">
            {props.repo.isDirty
              ? "Uncommitted modifications in workspace"
              : "Clean working directory"}
          </p>
        </div>

        {/* Remote Fetch Info */}
        <div class="bg-[#11141D] border border-gray-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <span class="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">
            Last Fetched
          </span>
          <div class="text-base font-extrabold text-gray-200 font-mono">
            {props.repo.lastFetchedAt}
          </div>
          <p class="text-[11px] text-gray-400">
            Auto-fetch:{" "}
            {props.repo.autoFetchEnabled ? "Active (Background)" : "Disabled"}
          </p>
        </div>
      </div>

      {/* 3. Active Working Tree Changes Breakdown */}
      <div class="bg-[#11141D] border border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center gap-2">
            <Layers class="w-4 h-4 text-indigo-400" />
            <h2 class="text-xs font-bold uppercase tracking-wider text-gray-200">
              Active Uncommitted Changes ({files().length})
            </h2>
          </div>

          <div class="flex items-center gap-2">
            {/* View Mode Switcher: Tree vs List */}
            <Show when={files().length > 0}>
              {/* Expand/Collapse All (Tree Mode only) */}
              <Show when={uncommittedChangesViewMode() === "tree"}>
                <button
                  onClick={toggleExpandAllUncommittedFolders}
                  class="px-2.5 py-1 bg-[#151926] hover:bg-[#1E2436] border border-gray-700/60 rounded-lg text-xs font-medium text-gray-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                  title={
                    isAllUncommittedFoldersExpanded()
                      ? "Collapse all uncommitted folders"
                      : "Expand all uncommitted folders"
                  }
                >
                  <Show
                    when={isAllUncommittedFoldersExpanded()}
                    fallback={
                      <ChevronsUpDown class="w-3.5 h-3.5 text-indigo-400" />
                    }
                  >
                    <ChevronsUpDown class="w-3.5 h-3.5 text-amber-400 rotate-90" />
                  </Show>
                  <span>
                    {isAllUncommittedFoldersExpanded()
                      ? "Collapse All"
                      : "Expand All"}
                  </span>
                </button>
              </Show>

              <div class="flex items-center bg-[#151926] border border-gray-700/60 rounded-lg p-0.5">
                <button
                  onClick={() =>
                    settingsStore.updateSetting(
                      "uncommittedChangesViewMode",
                      "tree",
                    )
                  }
                  class={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                    uncommittedChangesViewMode() === "tree"
                      ? "bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/40"
                      : "text-gray-400 hover:text-white"
                  }`}
                  title="View as Tree"
                >
                  <FolderTree class="w-3 h-3" />
                  <span>Tree</span>
                </button>
                <button
                  onClick={() =>
                    settingsStore.updateSetting(
                      "uncommittedChangesViewMode",
                      "list",
                    )
                  }
                  class={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                    uncommittedChangesViewMode() === "list"
                      ? "bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/40"
                      : "text-gray-400 hover:text-white"
                  }`}
                  title="View as Flat List"
                >
                  <List class="w-3 h-3" />
                  <span>List</span>
                </button>
              </div>

              <div class="h-4 w-px bg-gray-700 mx-0.5" />

              <button
                onClick={() => repoStore.stageFiles(props.repo.path, [])}
                class="px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Stage All
              </button>
              <button
                onClick={() => repoStore.unstageFiles(props.repo.path, [])}
                class="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Unstage All
              </button>
            </Show>
          </div>
        </div>

        <Show
          when={files().length > 0}
          fallback={
            <div class="p-8 text-center text-xs text-gray-500 flex flex-col items-center gap-2">
              <CheckCircle2 class="w-8 h-8 text-emerald-400 opacity-60" />
              <p class="font-bold text-gray-300">Clean Working Tree</p>
              <p class="text-xs text-gray-500">
                There are no uncommitted modifications in this repository.
              </p>
            </div>
          }
        >
          <div class="border border-gray-800 rounded-xl overflow-hidden bg-[#0D1017]">
            {/* 1. Tree View Mode */}
            <Show
              when={uncommittedChangesViewMode() === "tree"}
              fallback={
                /* 2. Flat List View Mode */
                <div class="divide-y divide-gray-800">
                  <For each={files()}>
                    {(file) => (
                      <div
                        onClick={() =>
                          repoStore.selectFileForDiff(file.path, file.staged)
                        }
                        class="group px-4 py-2.5 hover:bg-[#161B26] flex items-center justify-between gap-4 cursor-pointer transition-colors"
                      >
                        <div class="flex items-center gap-3 min-w-0">
                          {getStatusBadge(file.status)}
                          <span class="font-mono text-xs text-gray-200 truncate group-hover:text-indigo-300 transition-colors">
                            {file.path}
                          </span>
                        </div>

                        <div class="flex items-center gap-2 flex-shrink-0">
                          <span class="text-[11px] text-gray-500 font-mono opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            <FileCode class="w-3 h-3 text-indigo-400" />
                            <span>Inspect Diff</span>
                          </span>

                          <Show
                            when={file.staged}
                            fallback={
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void repoStore.stageFiles(props.repo.path, [
                                    file.path,
                                  ]);
                                }}
                                class="p-1 hover:bg-emerald-500/20 text-gray-400 hover:text-emerald-400 rounded transition-colors"
                                title="Stage File"
                              >
                                <Plus class="w-3.5 h-3.5" />
                              </button>
                            }
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                void repoStore.unstageFiles(props.repo.path, [
                                  file.path,
                                ]);
                              }}
                              class="p-1 hover:bg-amber-500/20 text-gray-400 hover:text-amber-400 rounded transition-colors"
                              title="Unstage File"
                            >
                              <Minus class="w-3.5 h-3.5" />
                            </button>
                          </Show>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              }
            >
              <div class="py-1.5 divide-y divide-gray-800/40">
                <For each={uncommittedFilesTree()}>
                  {(node) => renderUncommittedTreeNode(node)}
                </For>
              </div>
            </Show>
          </div>
        </Show>
      </div>

      {/* 4. Recent Commit History Timeline with Persistent Expanded Commits, Search & Full History Controls */}
      <div class="bg-[#11141D] border border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl">
        {/* Header with Title and Control Buttons */}
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <History class="w-4 h-4 text-cyan-400" />
            <h2 class="text-xs font-bold uppercase tracking-wider text-gray-200">
              Commit History
            </h2>
            <span class="px-2 py-0.5 bg-[#181D2B] border border-gray-700/60 rounded-full text-[10px] font-mono font-bold text-gray-300">
              {filteredCommits().length} / {commits().length} Loaded
            </span>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            {/* View Mode Switcher: Git Graph vs List */}
            <div class="flex items-center bg-[#151926] border border-gray-700/60 rounded-lg p-0.5">
              <button
                onClick={() =>
                  settingsStore.updateSetting("commitHistoryViewMode", "graph")
                }
                class={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                  commitHistoryViewMode() === "graph"
                    ? "bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/40"
                    : "text-gray-400 hover:text-white"
                }`}
                title="View as Interactive Git Graph"
              >
                <GitBranch class="w-3 h-3" />
                <span>Graph</span>
              </button>
              <button
                onClick={() =>
                  settingsStore.updateSetting("commitHistoryViewMode", "list")
                }
                class={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                  commitHistoryViewMode() === "list"
                    ? "bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/40"
                    : "text-gray-400 hover:text-white"
                }`}
                title="View as Flat Cards List"
              >
                <List class="w-3 h-3" />
                <span>List</span>
              </button>
            </div>

            <div class="h-4 w-px bg-gray-700 mx-0.5" />

            {/* Expand All / Collapse All Commits */}
            <button
              onClick={toggleExpandAllCommits}
              class="px-2.5 py-1 bg-[#151926] hover:bg-[#1E2436] border border-gray-700/60 rounded-lg text-xs font-medium text-gray-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
              title={
                isAllCommitsExpanded()
                  ? "Collapse all expanded commits"
                  : "Expand all visible commits"
              }
            >
              <Show
                when={isAllCommitsExpanded()}
                fallback={
                  <ChevronsUpDown class="w-3.5 h-3.5 text-indigo-400" />
                }
              >
                <ChevronsUpDown class="w-3.5 h-3.5 text-amber-400 rotate-90" />
              </Show>
              <span>
                {isAllCommitsExpanded() ? "Collapse All" : "Expand All"}
              </span>
            </button>

            {/* Commit Limit Preset Switcher */}
            <div class="flex items-center bg-[#151926] border border-gray-700/60 rounded-lg p-0.5 text-[10px] font-mono">
              <button
                onClick={() => repoStore.setCommitLimit(25)}
                class={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  repoStore.commitLimit() === 25
                    ? "bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/40"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                25
              </button>
              <button
                onClick={() => repoStore.setCommitLimit(50)}
                class={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  repoStore.commitLimit() === 50
                    ? "bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/40"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                50
              </button>
              <button
                onClick={() => repoStore.setCommitLimit(100)}
                class={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  repoStore.commitLimit() === 100
                    ? "bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/40"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                100
              </button>
              <button
                onClick={() => repoStore.setCommitLimit(10000)}
                class={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  repoStore.commitLimit() >= 10000
                    ? "bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/40"
                    : "text-gray-400 hover:text-white"
                }`}
                title="Load all historical commits on this branch"
              >
                All
              </button>
            </div>
          </div>
        </div>

        {/* Live Search Filter Bar */}
        <div class="relative flex items-center">
          <Search class="w-3.5 h-3.5 text-gray-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter commits by message, author, or SHA..."
            value={commitSearch()}
            onInput={(e) => setCommitSearch(e.currentTarget.value)}
            class="w-full pl-9 pr-8 py-1.5 bg-[#0D1017] border border-gray-800 rounded-xl text-gray-200 placeholder-gray-500 text-xs font-mono focus:outline-none focus:border-indigo-400 transition-colors"
          />
          <Show when={commitSearch()}>
            <button
              onClick={() => setCommitSearch("")}
              class="p-1 text-gray-500 hover:text-gray-300 absolute right-2.5 cursor-pointer"
              title="Clear search"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </Show>
        </div>

        <Show
          when={filteredCommits().length > 0}
          fallback={
            <div class="p-8 text-center text-xs text-gray-500 space-y-2">
              <Show
                when={commitSearch()}
                fallback={<p>No commit history found on active branch.</p>}
              >
                <p>No commits match filter "{commitSearch()}".</p>
                <button
                  onClick={() => setCommitSearch("")}
                  class="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg text-xs cursor-pointer hover:bg-indigo-500/30"
                >
                  Clear Filter
                </button>
              </Show>
            </div>
          }
        >
          <Show
            when={commitHistoryViewMode() === "graph"}
            fallback={
              <div class="space-y-2.5">
                <For each={filteredCommits()}>
                  {(commit) => {
                    const isExpanded = () =>
                      expandedCommitHashes().has(commit.hash);
                    const detail = () => repoStore.getCommitDetail(commit.hash);

                    return (
                      <div
                        class={`border rounded-xl transition-all ${
                          isExpanded()
                            ? "border-indigo-500/60 bg-[#121624] shadow-lg"
                            : "border-gray-800/80 bg-[#0D1017] hover:bg-[#141824]"
                        }`}
                      >
                        {/* Commit Row Header */}
                        <div
                          onClick={() => handleCommitClick(commit)}
                          onContextMenu={(e) =>
                            handleCommitContextMenu(e, commit)
                          }
                          class="p-3.5 flex items-start justify-between gap-4 cursor-pointer"
                        >
                          <div class="space-y-1.5 min-w-0 flex-1">
                            <div class="flex items-center gap-2 flex-wrap">
                              <span class="font-mono font-bold text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                {commit.shortHash}
                              </span>
                              <span class="font-semibold text-xs text-white truncate">
                                {commit.subject}
                              </span>
                            </div>

                            <div class="flex items-center gap-3 text-[11px] text-gray-500 font-mono">
                              <span class="text-gray-400 flex items-center gap-1">
                                <User class="w-3 h-3" />
                                <span>{commit.authorName}</span>
                              </span>
                              <span>•</span>
                              <span class="flex items-center gap-1">
                                <Calendar class="w-3 h-3" />
                                <span>{commit.relativeDate}</span>
                              </span>
                            </div>
                          </div>

                          <div class="flex items-center gap-2 flex-shrink-0">
                            <Show when={commit.refs}>
                              <span class="px-2.5 py-0.5 bg-[#181D2B] text-gray-300 font-mono text-[10px] rounded-full border border-gray-700/60 shadow-sm">
                                {commit.refs}
                              </span>
                            </Show>

                            <button
                              class={`p-1 rounded-lg text-gray-400 hover:text-white transition-transform ${
                                isExpanded() ? "rotate-90 text-indigo-400" : ""
                              }`}
                            >
                              <ChevronRight class="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Expanded Commit Details & Modified Files Inspector */}
                        <Show when={isExpanded()}>
                          <div class="px-4 pb-4 pt-1 border-t border-gray-800/80 mt-1 space-y-3">
                            <Show
                              when={detail()}
                              fallback={
                                <div class="py-4 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                                  <RefreshCw class="w-3.5 h-3.5 animate-spin text-indigo-400" />
                                  <span>
                                    Loading commit details and file list...
                                  </span>
                                </div>
                              }
                            >
                              {(d) => {
                                const commitFilesTree = createMemo(() =>
                                  buildGenericTree(d().files || []),
                                );

                                return (
                                  <div class="space-y-3 pt-2">
                                    {/* Full Commit Body / SHA Card */}
                                    <div class="bg-[#0A0C13] p-3.5 rounded-xl border border-gray-800 space-y-3 text-xs shadow-inner">
                                      <div class="flex items-center justify-between text-gray-400 font-mono text-[11px] gap-2 flex-wrap">
                                        <span class="truncate">
                                          Commit SHA: {d().hash}
                                        </span>

                                        <div class="flex items-center gap-2">
                                          {/* View Entire Commit Diff Button */}
                                          <button
                                            onClick={() =>
                                              repoStore.selectFileForDiff(
                                                "__ALL__",
                                                false,
                                                d().hash,
                                              )
                                            }
                                            class="px-2.5 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                                            title="View full unified diff of all changed files in this commit"
                                          >
                                            <FileDiff class="w-3.5 h-3.5 text-indigo-400" />
                                            <span>View Entire Commit Diff</span>
                                          </button>

                                          <button
                                            onClick={() =>
                                              copyText(
                                                d().hash,
                                                `sha-${d().hash}`,
                                              )
                                            }
                                            class="px-2 py-1 bg-[#151926] hover:bg-[#1E2436] border border-gray-700/60 text-gray-300 hover:text-white rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                                          >
                                            <Show
                                              when={
                                                copiedHash() ===
                                                `sha-${d().hash}`
                                              }
                                              fallback={
                                                <Copy class="w-3 h-3" />
                                              }
                                            >
                                              <Check class="w-3 h-3 text-emerald-400" />
                                            </Show>
                                            <span>
                                              {copiedHash() ===
                                              `sha-${d().hash}`
                                                ? "Copied"
                                                : "Copy SHA"}
                                            </span>
                                          </button>
                                        </div>
                                      </div>

                                      <Show when={d().body}>
                                        <pre class="font-mono text-gray-300 whitespace-pre-wrap text-[11.5px] border-t border-gray-800/60 pt-2">
                                          {d().body}
                                        </pre>
                                      </Show>

                                      {/* Stats summary */}
                                      <div class="flex items-center gap-3 text-[11px] font-mono font-bold pt-1">
                                        <span class="text-gray-400">
                                          {d().files.length} changed files
                                        </span>
                                        <span class="text-emerald-400">
                                          +{d().totalAdditions} additions
                                        </span>
                                        <span class="text-rose-400">
                                          -{d().totalDeletions} deletions
                                        </span>
                                      </div>
                                    </div>

                                    {/* Changed Files in Commit List Header with View as Tree / List Switcher and Expand/Collapse */}
                                    <div class="space-y-1.5">
                                      <div class="flex items-center justify-between gap-2 flex-wrap">
                                        <span class="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider block">
                                          Files Changed in This Commit (
                                          {d().files.length})
                                        </span>

                                        <div class="flex items-center gap-2">
                                          {/* Expand All / Collapse All button (only in Tree mode) */}
                                          <Show
                                            when={
                                              commitFilesViewMode() === "tree"
                                            }
                                          >
                                            <button
                                              onClick={() =>
                                                toggleExpandAllCommitFolders(
                                                  d().files,
                                                )
                                              }
                                              class="px-2.5 py-1 bg-[#151926] hover:bg-[#1E2436] border border-gray-700/60 rounded-lg text-xs font-medium text-gray-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                                              title={
                                                isAllCommitFoldersExpanded(
                                                  d().files,
                                                )
                                                  ? "Collapse all folders"
                                                  : "Expand all folders"
                                              }
                                            >
                                              <Show
                                                when={isAllCommitFoldersExpanded(
                                                  d().files,
                                                )}
                                                fallback={
                                                  <ChevronsUpDown class="w-3.5 h-3.5 text-indigo-400" />
                                                }
                                              >
                                                <ChevronsUpDown class="w-3.5 h-3.5 text-amber-400 rotate-90" />
                                              </Show>
                                              <span>
                                                {isAllCommitFoldersExpanded(
                                                  d().files,
                                                )
                                                  ? "Collapse All"
                                                  : "Expand All"}
                                              </span>
                                            </button>
                                          </Show>

                                          {/* Persistent View as Tree / View as List Switcher */}
                                          <div class="flex items-center bg-[#151926] border border-gray-700/60 rounded-lg p-0.5">
                                            <button
                                              onClick={() =>
                                                settingsStore.updateSetting(
                                                  "commitFilesViewMode",
                                                  "tree",
                                                )
                                              }
                                              class={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                                                commitFilesViewMode() === "tree"
                                                  ? "bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/40"
                                                  : "text-gray-400 hover:text-white"
                                              }`}
                                              title="View as Tree"
                                            >
                                              <FolderTree class="w-3 h-3" />
                                              <span>Tree</span>
                                            </button>
                                            <button
                                              onClick={() =>
                                                settingsStore.updateSetting(
                                                  "commitFilesViewMode",
                                                  "list",
                                                )
                                              }
                                              class={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                                                commitFilesViewMode() === "list"
                                                  ? "bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/40"
                                                  : "text-gray-400 hover:text-white"
                                              }`}
                                              title="View as Flat List"
                                            >
                                              <List class="w-3 h-3" />
                                              <span>List</span>
                                            </button>
                                          </div>
                                        </div>
                                      </div>

                                      <div class="border border-gray-800 rounded-lg overflow-hidden bg-[#0A0C13]">
                                        {/* 1. Tree View Mode */}
                                        <Show
                                          when={
                                            commitFilesViewMode() === "tree"
                                          }
                                          fallback={
                                            /* 2. Flat List View Mode */
                                            <div class="divide-y divide-gray-800/60">
                                              <For each={d().files}>
                                                {(file) => (
                                                  <div
                                                    onClick={() =>
                                                      repoStore.selectFileForDiff(
                                                        file.path,
                                                        false,
                                                        d().hash,
                                                      )
                                                    }
                                                    class="group px-3 py-2 hover:bg-[#151926] flex items-center justify-between gap-3 cursor-pointer transition-colors"
                                                  >
                                                    <div class="flex items-center gap-2.5 min-w-0">
                                                      {getFileChangeBadge(
                                                        file.status,
                                                      )}
                                                      <span class="font-mono text-xs text-gray-200 truncate group-hover:text-indigo-300">
                                                        {file.path}
                                                      </span>
                                                    </div>

                                                    <div class="flex items-center gap-2 font-mono text-[11px] tabular-nums flex-shrink-0">
                                                      <Show
                                                        when={
                                                          file.additions > 0
                                                        }
                                                      >
                                                        <span class="text-emerald-400">
                                                          +{file.additions}
                                                        </span>
                                                      </Show>
                                                      <Show
                                                        when={
                                                          file.deletions > 0
                                                        }
                                                      >
                                                        <span class="text-rose-400">
                                                          -{file.deletions}
                                                        </span>
                                                      </Show>
                                                      <ExternalLink class="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                                                    </div>
                                                  </div>
                                                )}
                                              </For>
                                            </div>
                                          }
                                        >
                                          <div class="py-1">
                                            <For each={commitFilesTree()}>
                                              {(node) =>
                                                renderCommitTreeNode(
                                                  node,
                                                  d().hash,
                                                )
                                              }
                                            </For>
                                          </div>
                                        </Show>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }}
                            </Show>
                          </div>
                        </Show>
                      </div>
                    );
                  }}
                </For>
              </div>
            }
          >
            <div class="border border-gray-200 dark:border-gray-800/80 rounded-2xl overflow-hidden bg-white dark:bg-[#0D1017] shadow-xs">
              <GitGraphView
                repo={props.repo}
                commits={filteredCommits()}
                onCommitContextMenu={(e, commit) =>
                  handleCommitContextMenu(e, commit)
                }
              />
            </div>
          </Show>

          {/* Load More Commits & Load All Button Footer */}
          <Show when={repoStore.commitLimit() < 10000}>
            <div class="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => repoStore.loadMoreCommits(props.repo.path, 25)}
                class="px-4 py-2 bg-[#151926] hover:bg-[#1E2436] border border-gray-700/60 rounded-xl text-xs font-semibold text-gray-200 hover:text-white flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
              >
                <History class="w-3.5 h-3.5 text-indigo-400" />
                <span>Load More Commits (+25)</span>
              </button>

              <button
                onClick={() => repoStore.setCommitLimit(10000)}
                class="px-4 py-2 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 rounded-xl text-xs font-semibold text-indigo-300 hover:text-white flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
              >
                <span>Load All Commits on Branch</span>
              </button>
            </div>
          </Show>
        </Show>
      </div>

      {/* Context Menu for Commit Item */}
      <Show when={contextMenuPos()}>
        {(menu) => (
          <ContextMenu
            x={menu().x}
            y={menu().y}
            isOpen={true}
            items={getContextMenuItems(menu().commit)}
            onClose={() => setContextMenuPos(null)}
          />
        )}
      </Show>
    </div>
  );
};
