import {
  Component,
  createSignal,
  createMemo,
  For,
  Show,
  onMount,
  onCleanup,
} from "solid-js";
import {
  Check,
  Plus,
  Minus,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  FileCode,
  Folder,
  FolderOpen,
  Copy,
  Trash2,
  EyeOff,
  List,
  FolderTree,
  MoreHorizontal,
  ChevronsUpDown,
} from "lucide-solid";

import { repoStore } from "../../store/repoStore";
import { batchStore } from "../../store/batchStore";
import { FileStatus } from "../../types/git";
import { ContextMenu, MenuItem } from "../common/ContextMenu";
import { buildFileTree, sortFiles, FileTreeNode } from "../../utils/fileTree";

export const ChangesView: Component = () => {
  const [commitMessage, setCommitMessage] = createSignal<string>("");
  const [isAmending, setIsAmending] = createSignal<boolean>(false);
  const [showCommitMenu, setShowCommitMenu] = createSignal<boolean>(false);
  const [showOptionsMenu, setShowOptionsMenu] = createSignal<boolean>(false);
  const [viewMode, setViewMode] = createSignal<"list" | "tree">("tree");
  const [sortBy, setSortBy] = createSignal<"path" | "name" | "status">("path");
  const [collapsedFolders, setCollapsedFolders] = createSignal<
    Record<string, boolean>
  >({});
  let optionsMenuRef: HTMLDivElement | undefined;
  let commitMenuRef: HTMLDivElement | undefined;

  const handleOutsideClick = (e: MouseEvent) => {
    if (
      showOptionsMenu() &&
      optionsMenuRef &&
      !optionsMenuRef.contains(e.target as Node)
    ) {
      setShowOptionsMenu(false);
    }
    if (
      showCommitMenu() &&
      commitMenuRef &&
      !commitMenuRef.contains(e.target as Node)
    ) {
      setShowCommitMenu(false);
    }
  };

  onMount(() => {
    document.addEventListener("mousedown", handleOutsideClick);
  });

  onCleanup(() => {
    document.removeEventListener("mousedown", handleOutsideClick);
  });

  const [selectedContextMenu, setSelectedContextMenu] = createSignal<{
    x: number;
    y: number;
    file: FileStatus;
  } | null>(null);

  const activeRepo = () => repoStore.selectedRepo();
  const rawFiles = () => activeRepo()?.files || [];

  const sortedFiles = createMemo(() => sortFiles(rawFiles(), sortBy()));
  const stagedFiles = createMemo(() => sortedFiles().filter((f) => f.staged));
  const unstagedFiles = createMemo(() =>
    sortedFiles().filter((f) => !f.staged),
  );

  const stagedTree = createMemo(() => buildFileTree(stagedFiles()));
  const unstagedTree = createMemo(() => buildFileTree(unstagedFiles()));

  const getAllTreeFolderIds = (nodes: FileTreeNode[]): string[] => {
    const ids: string[] = [];
    const traverse = (items: FileTreeNode[]) => {
      for (const item of items) {
        if (item.isFolder) {
          ids.push(item.id);
          traverse(item.children);
        }
      }
    };
    traverse(nodes);
    return ids;
  };

  const isAllTreeFoldersCollapsed = () => {
    const allIds = [
      ...getAllTreeFolderIds(stagedTree()),
      ...getAllTreeFolderIds(unstagedTree()),
    ];
    if (allIds.length === 0) return false;
    const collapsed = collapsedFolders();
    return allIds.every((id) => collapsed[id]);
  };

  const toggleExpandAllTreeFolders = () => {
    const allIds = [
      ...getAllTreeFolderIds(stagedTree()),
      ...getAllTreeFolderIds(unstagedTree()),
    ];
    const isCollapsed = isAllTreeFoldersCollapsed();
    const next: Record<string, boolean> = {};
    for (const id of allIds) {
      next[id] = !isCollapsed;
    }
    setCollapsedFolders(next);
  };

  const toggleFolder = (folderId: string) => {
    setCollapsedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const handleCommit = async (amend: boolean = false) => {
    const repo = activeRepo();
    if (!repo) return;
    const msg = commitMessage().trim();
    if (!msg && !amend) return;

    try {
      await repoStore.commit(repo.path, msg, amend);
      setCommitMessage("");
      setIsAmending(false);
      setShowCommitMenu(false);
    } catch (err) {
      console.error("Commit failed:", err);
    }
  };

  const getStatusBadge = (status: FileStatus["status"]) => {
    switch (status) {
      case "modified":
        return (
          <span class="px-1 py-0.2 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded text-[9.5px] font-mono font-bold">
            M
          </span>
        );
      case "staged":
        return (
          <span class="px-1 py-0.2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded text-[9.5px] font-mono font-bold">
            A
          </span>
        );
      case "deleted":
        return (
          <span class="px-1 py-0.2 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded text-[9.5px] font-mono font-bold">
            D
          </span>
        );
      case "untracked":
        return (
          <span class="px-1 py-0.2 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 rounded text-[9.5px] font-mono font-bold">
            U
          </span>
        );
      case "conflicted":
        return (
          <span class="px-1 py-0.2 bg-rose-500/25 border border-rose-500/50 text-rose-300 rounded text-[9.5px] font-mono font-bold animate-pulse">
            !
          </span>
        );
      default:
        return (
          <span class="px-1 py-0.2 bg-gray-500/15 border border-gray-500/30 text-gray-300 rounded text-[9.5px] font-mono font-bold">
            M
          </span>
        );
    }
  };

  const getFileMenuItems = (file: FileStatus): MenuItem[] => {
    const repo = activeRepo();
    if (!repo) return [];

    const fullPath = `${repo.path}/${file.path}`;
    const dirPath =
      fullPath.substring(0, fullPath.lastIndexOf("/")) || repo.path;

    return [
      {
        id: "open-file",
        label: "Open File",
        icon: <FileCode class="w-3.5 h-3.5 text-indigo-400" />,
        onClick: () => repoStore.openPath(fullPath),
      },
      {
        id: "open-folder",
        label: "Open Containing Folder",
        icon: <FolderOpen class="w-3.5 h-3.5 text-amber-400" />,
        onClick: () => repoStore.openPath(dirPath),
      },
      { id: "div-1", label: "", divider: true },
      {
        id: "stage-toggle",
        label: file.staged ? "Unstage Changes" : "Stage Changes",
        icon: file.staged ? (
          <Minus class="w-3.5 h-3.5 text-amber-400" />
        ) : (
          <Plus class="w-3.5 h-3.5 text-emerald-400" />
        ),
        onClick: () => {
          if (file.staged) {
            void repoStore.unstageFiles(repo.path, [file.path]);
          } else {
            void repoStore.stageFiles(repo.path, [file.path]);
          }
        },
      },
      {
        id: "discard",
        label: "Discard Changes...",
        icon: <Trash2 class="w-3.5 h-3.5 text-rose-400" />,
        danger: true,
        onClick: () => {
          if (
            confirm(`Discard changes to "${file.path}"? This cannot be undone.`)
          ) {
            void repoStore.discardFiles(repo.path, [file.path]);
          }
        },
      },
      {
        id: "gitignore",
        label: "Add to .gitignore",
        icon: <EyeOff class="w-3.5 h-3.5 text-gray-400" />,
        onClick: () => {
          void repoStore.addToGitignore(repo.path, file.path);
        },
      },
      { id: "div-2", label: "", divider: true },
      {
        id: "copy-rel",
        label: "Copy Relative Path",
        icon: <Copy class="w-3.5 h-3.5 text-gray-400" />,
        onClick: () => navigator.clipboard.writeText(file.path),
      },
      {
        id: "copy-full",
        label: "Copy Full Path",
        icon: <Copy class="w-3.5 h-3.5 text-gray-400" />,
        onClick: () => navigator.clipboard.writeText(fullPath),
      },
    ];
  };

  // Render a recursive Tree Node
  const renderTreeNode = (
    node: FileTreeNode,
    isStagedSection: boolean,
    depth: number = 0,
  ) => {
    const isFolderCollapsed = () => collapsedFolders()[node.id] || false;

    if (node.isFolder) {
      return (
        <div class="flex flex-col">
          <div
            onClick={() => toggleFolder(node.id)}
            style={{ "padding-left": `${depth * 12 + 6}px` }}
            class="flex items-center gap-1.5 py-1 hover:bg-[#1A1F2C] rounded text-gray-300 font-mono text-[11.5px] cursor-pointer select-none transition-colors"
          >
            <Show
              when={!isFolderCollapsed()}
              fallback={
                <ChevronRight class="w-3 h-3 text-gray-500 flex-shrink-0" />
              }
            >
              <ChevronDown class="w-3 h-3 text-gray-500 flex-shrink-0" />
            </Show>
            <Folder class="w-3.5 h-3.5 text-indigo-400/80 flex-shrink-0" />
            <span class="truncate font-semibold text-gray-200">
              {node.name}
            </span>
          </div>

          <Show when={!isFolderCollapsed()}>
            <div class="flex flex-col">
              <For each={node.children}>
                {(child) => renderTreeNode(child, isStagedSection, depth + 1)}
              </For>
            </div>
          </Show>
        </div>
      );
    }

    if (!node.file) return null;
    const file = node.file;
    const repo = activeRepo();

    return (
      <div
        onClick={() => repoStore.selectFileForDiff(file.path, isStagedSection)}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setSelectedContextMenu({ x: e.clientX, y: e.clientY, file });
        }}
        onDblClick={() =>
          repo && repoStore.openPath(`${repo.path}/${file.path}`)
        }
        style={{ "padding-left": `${depth * 12 + 18}px` }}
        class="group flex items-center justify-between py-1 pr-2 hover:bg-[#1A1F2C] border-b border-carbon-border/30 rounded font-mono text-[11.5px] cursor-pointer transition-colors"
      >
        <div class="flex items-center gap-1.5 truncate">
          {getStatusBadge(file.status)}
          <span class="text-gray-200 truncate">{node.name}</span>
        </div>

        <div class="flex items-center gap-1">
          <Show
            when={isStagedSection}
            fallback={
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (repo) void repoStore.stageFiles(repo.path, [file.path]);
                }}
                class="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-carbon-elevated rounded text-gray-400 hover:text-emerald-400"
                title="Stage file"
              >
                <Plus class="w-3.5 h-3.5" />
              </button>
            }
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (repo) void repoStore.unstageFiles(repo.path, [file.path]);
              }}
              class="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-carbon-elevated rounded text-gray-400 hover:text-amber-400"
              title="Unstage file"
            >
              <Minus class="w-3.5 h-3.5" />
            </button>
          </Show>
        </div>
      </div>
    );
  };

  return (
    <div class="flex flex-col h-full bg-carbon-surface border-t border-carbon-border select-none text-xs">
      {/* Header */}
      <div class="px-3 py-2 bg-carbon-elevated border-b border-carbon-border flex items-center justify-between">
        <span class="font-bold text-gray-200 tracking-wider text-[11px] uppercase flex items-center gap-1.5 truncate">
          <span>Source Control</span>
          <Show when={activeRepo()}>
            {(repo) => (
              <span class="text-indigo-300 font-bold lowercase font-mono">
                ({repo().name})
              </span>
            )}
          </Show>
        </span>

        <Show when={activeRepo()}>
          {(repo) => (
            <div class="flex items-center gap-1">
              {/* Toggle Tree / List View */}
              <button
                onClick={() =>
                  setViewMode(viewMode() === "tree" ? "list" : "tree")
                }
                class={`p-1 rounded transition-colors cursor-pointer ${
                  viewMode() === "tree"
                    ? "bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30"
                    : "text-gray-400 hover:text-gray-200 hover:bg-carbon-hover"
                }`}
                title={
                  viewMode() === "tree"
                    ? "Switch to List View"
                    : "Switch to Tree View"
                }
              >
                <Show
                  when={viewMode() === "tree"}
                  fallback={<List class="w-3.5 h-3.5" />}
                >
                  <FolderTree class="w-3.5 h-3.5" />
                </Show>
              </button>

              <Show when={viewMode() === "tree"}>
                <button
                  onClick={toggleExpandAllTreeFolders}
                  class="p-1 hover:bg-carbon-hover rounded text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
                  title={
                    isAllTreeFoldersCollapsed()
                      ? "Expand All Folders"
                      : "Collapse All Folders"
                  }
                >
                  <Show
                    when={isAllTreeFoldersCollapsed()}
                    fallback={
                      <ChevronsUpDown class="w-3.5 h-3.5 text-amber-400 rotate-90" />
                    }
                  >
                    <ChevronsUpDown class="w-3.5 h-3.5 text-indigo-400" />
                  </Show>
                </button>
              </Show>

              <button
                onClick={() => repoStore.stageFiles(repo().path, [])}

                class="p-1 hover:bg-carbon-hover rounded text-gray-400 hover:text-emerald-400 transition-colors cursor-pointer"
                title="Stage All Changes"
              >
                <Plus class="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => repoStore.unstageFiles(repo().path, [])}
                class="p-1 hover:bg-carbon-hover rounded text-gray-400 hover:text-amber-400 transition-colors cursor-pointer"
                title="Unstage All Changes"
              >
                <Minus class="w-3.5 h-3.5" />
              </button>

              {/* More Options Dropdown */}
              <div ref={optionsMenuRef} class="relative">
                <button
                  onClick={() => setShowOptionsMenu(!showOptionsMenu())}
                  class="p-1 hover:bg-carbon-hover rounded text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
                  title="View & Sort Options"
                >
                  <MoreHorizontal class="w-3.5 h-3.5" />
                </button>

                <Show when={showOptionsMenu()}>
                  <div class="absolute right-0 top-7 w-48 bg-carbon-surface border border-carbon-border rounded-xl shadow-2xl py-1 z-40 text-xs backdrop-blur-md">
                    <button
                      onClick={() => {
                        setViewMode("list");
                        setShowOptionsMenu(false);
                      }}
                      class="w-full text-left px-3 py-1.5 hover:bg-carbon-hover flex items-center justify-between text-gray-200 cursor-pointer"
                    >
                      <span>View as List</span>
                      <Show when={viewMode() === "list"}>
                        <span class="text-indigo-400">✓</span>
                      </Show>
                    </button>

                    <button
                      onClick={() => {
                        setViewMode("tree");
                        setShowOptionsMenu(false);
                      }}
                      class="w-full text-left px-3 py-1.5 hover:bg-carbon-hover flex items-center justify-between text-gray-200 cursor-pointer"
                    >
                      <span>View as Tree</span>
                      <Show when={viewMode() === "tree"}>
                        <span class="text-indigo-400">✓</span>
                      </Show>
                    </button>

                    <div class="my-1 border-t border-carbon-border" />

                    <button
                      onClick={() => {
                        setSortBy("path");
                        setShowOptionsMenu(false);
                      }}
                      class="w-full text-left px-3 py-1.5 hover:bg-carbon-hover flex items-center justify-between text-gray-200 cursor-pointer"
                    >
                      <span>Sort by Path</span>
                      <Show when={sortBy() === "path"}>
                        <span class="text-indigo-400">✓</span>
                      </Show>
                    </button>

                    <button
                      onClick={() => {
                        setSortBy("name");
                        setShowOptionsMenu(false);
                      }}
                      class="w-full text-left px-3 py-1.5 hover:bg-carbon-hover flex items-center justify-between text-gray-200 cursor-pointer"
                    >
                      <span>Sort by Name</span>
                      <Show when={sortBy() === "name"}>
                        <span class="text-indigo-400">✓</span>
                      </Show>
                    </button>

                    <button
                      onClick={() => {
                        setSortBy("status");
                        setShowOptionsMenu(false);
                      }}
                      class="w-full text-left px-3 py-1.5 hover:bg-carbon-hover flex items-center justify-between text-gray-200 cursor-pointer"
                    >
                      <span>Sort by Status</span>
                      <Show when={sortBy() === "status"}>
                        <span class="text-indigo-400">✓</span>
                      </Show>
                    </button>

                    <div class="my-1 border-t border-carbon-border" />

                    <button
                      onClick={() => {
                        void repoStore.refreshRepo(repo().path);
                        setShowOptionsMenu(false);
                      }}
                      class="w-full text-left px-3 py-1.5 hover:bg-carbon-hover text-gray-200 cursor-pointer"
                    >
                      Refresh Changes
                    </button>
                  </div>
                </Show>
              </div>
            </div>
          )}
        </Show>
      </div>

      <Show
        when={activeRepo()}
        fallback={
          <div class="p-4 text-center text-xs text-gray-500">
            Select a repository to view working tree changes.
          </div>
        }
      >
        {(repo) => (
          <div class="flex flex-col flex-1 overflow-hidden p-3 gap-2">
            {/* Sync Changes Banner if unpushed/unpulled commits */}
            <Show when={repo().aheadCount > 0 || repo().behindCount > 0}>
              <button
                onClick={() => batchStore.setIsPushModalOpen(true)}
                class="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-semibold rounded text-xs transition-colors cursor-pointer shadow-sm"
                title="Synchronize and push outgoing commits"
              >
                <RefreshCw class="w-3.5 h-3.5" />
                <span>
                  Sync Changes{" "}
                  {repo().aheadCount > 0 ? `${repo().aheadCount}↑` : ""}{" "}
                  {repo().behindCount > 0 ? `${repo().behindCount}↓` : ""}
                </span>
              </button>
            </Show>

            {/* Commit Message Box */}
            <div class="flex flex-col gap-1.5">
              <div class="relative">
                <textarea
                  placeholder={`Message (Ctrl+Enter to commit on "${repo().currentBranch}")`}
                  value={commitMessage()}
                  onInput={(e) => setCommitMessage(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                      void handleCommit(isAmending());
                    }
                  }}
                  rows={2}
                  class="w-full px-2.5 py-1.5 bg-carbon-base border border-carbon-border rounded text-gray-200 placeholder-gray-500 font-mono text-xs focus:outline-none focus:border-indigo-400 resize-none"
                />
              </div>

              {/* Commit Button & Dropdown */}
              <div class="flex items-center gap-1">
                <button
                  onClick={() => handleCommit(isAmending())}
                  disabled={stagedFiles().length === 0 && !isAmending()}
                  class="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-gray-950 font-bold rounded text-xs transition-colors cursor-pointer shadow-sm"
                >
                  <Check class="w-4 h-4 stroke-[3]" />
                  <span>{isAmending() ? "Amend Commit" : "Commit"}</span>
                  <span class="text-[10px] opacity-80 font-normal">
                    ({stagedFiles().length} staged)
                  </span>
                </button>

                <div ref={commitMenuRef} class="relative">
                  <button
                    onClick={() => setShowCommitMenu(!showCommitMenu())}
                    class="p-1.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 rounded cursor-pointer"
                  >
                    <ChevronDown class="w-4 h-4" />
                  </button>

                  <Show when={showCommitMenu()}>
                    <div class="absolute right-0 bottom-8 w-44 bg-carbon-elevated border border-carbon-border rounded shadow-xl py-1 z-30 text-xs">
                      <button
                        onClick={() => {
                          setIsAmending(!isAmending());
                          setShowCommitMenu(false);
                        }}
                        class="w-full text-left px-3 py-1.5 hover:bg-carbon-hover text-gray-200"
                      >
                        {isAmending()
                          ? "✓ Amend Mode Active"
                          : "Toggle Amend Mode"}
                      </button>
                    </div>
                  </Show>
                </div>
              </div>
            </div>

            {/* Changed Files Lists (Tree or List Mode) */}
            <div class="flex-1 overflow-y-auto space-y-3 mt-1 pr-1">
              {/* Staged Section */}
              <Show when={stagedFiles().length > 0}>
                <div>
                  <div class="flex items-center justify-between text-[11px] text-gray-400 font-semibold mb-1">
                    <span>STAGED CHANGES ({stagedFiles().length})</span>
                    <button
                      onClick={() => repoStore.unstageFiles(repo().path, [])}
                      class="text-gray-500 hover:text-gray-300 text-[10px] font-mono cursor-pointer"
                    >
                      Unstage All
                    </button>
                  </div>

                  <Show
                    when={viewMode() === "tree"}
                    fallback={
                      <div class="space-y-0.5">
                        <For each={stagedFiles()}>
                          {(file) => (
                            <div
                              onClick={() =>
                                repoStore.selectFileForDiff(file.path, true)
                              }
                              onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedContextMenu({
                                  x: e.clientX,
                                  y: e.clientY,
                                  file,
                                });
                              }}
                              onDblClick={() =>
                                repoStore.openPath(
                                  `${repo().path}/${file.path}`,
                                )
                              }
                              class="group flex items-center justify-between px-2 py-1.5 bg-carbon-base hover:bg-[#1A1F2C] border border-carbon-border/50 rounded font-mono text-[11.5px] cursor-pointer transition-colors"
                            >
                              <div class="flex items-center gap-2 truncate">
                                {getStatusBadge(file.status)}
                                <span class="text-gray-200 truncate">
                                  {file.path}
                                </span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void repoStore.unstageFiles(repo().path, [
                                    file.path,
                                  ]);
                                }}
                                class="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-carbon-elevated rounded text-gray-400 hover:text-amber-400"
                                title="Unstage file"
                              >
                                <Minus class="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </For>
                      </div>
                    }
                  >
                    <div class="space-y-0.5 bg-carbon-base/50 p-1 rounded-lg border border-carbon-border/40">
                      <For each={stagedTree()}>
                        {(node) => renderTreeNode(node, true)}
                      </For>
                    </div>
                  </Show>
                </div>
              </Show>

              {/* Unstaged Section */}
              <div>
                <div class="flex items-center justify-between text-[11px] text-gray-400 font-semibold mb-1">
                  <span>CHANGES ({unstagedFiles().length})</span>
                  <Show when={unstagedFiles().length > 0}>
                    <button
                      onClick={() => repoStore.stageFiles(repo().path, [])}
                      class="text-gray-500 hover:text-gray-300 text-[10px] font-mono cursor-pointer"
                    >
                      Stage All
                    </button>
                  </Show>
                </div>

                <Show
                  when={unstagedFiles().length > 0}
                  fallback={
                    <div class="text-[11px] text-gray-500 py-2 italic">
                      Working tree clean.
                    </div>
                  }
                >
                  <Show
                    when={viewMode() === "tree"}
                    fallback={
                      <div class="space-y-0.5">
                        <For each={unstagedFiles()}>
                          {(file) => (
                            <div
                              onClick={() =>
                                repoStore.selectFileForDiff(file.path, false)
                              }
                              onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedContextMenu({
                                  x: e.clientX,
                                  y: e.clientY,
                                  file,
                                });
                              }}
                              onDblClick={() =>
                                repoStore.openPath(
                                  `${repo().path}/${file.path}`,
                                )
                              }
                              class="group flex items-center justify-between px-2 py-1.5 bg-carbon-base hover:bg-[#1A1F2C] border border-carbon-border/50 rounded font-mono text-[11.5px] cursor-pointer transition-colors"
                            >
                              <div class="flex items-center gap-2 truncate">
                                {getStatusBadge(file.status)}
                                <span class="text-gray-200 truncate">
                                  {file.path}
                                </span>
                              </div>
                              <div class="flex items-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void repoStore.stageFiles(repo().path, [
                                      file.path,
                                    ]);
                                  }}
                                  class="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-carbon-elevated rounded text-gray-400 hover:text-emerald-400"
                                  title="Stage file"
                                >
                                  <Plus class="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </For>
                      </div>
                    }
                  >
                    <div class="space-y-0.5 bg-carbon-base/50 p-1 rounded-lg border border-carbon-border/40">
                      <For each={unstagedTree()}>
                        {(node) => renderTreeNode(node, false)}
                      </For>
                    </div>
                  </Show>
                </Show>
              </div>
            </div>
          </div>
        )}
      </Show>

      {/* Right Click File Context Menu */}
      <Show when={selectedContextMenu()}>
        {(menu) => (
          <ContextMenu
            x={menu().x}
            y={menu().y}
            isOpen={true}
            items={getFileMenuItems(menu().file)}
            onClose={() => setSelectedContextMenu(null)}
          />
        )}
      </Show>
    </div>
  );
};
