import {
  Component,
  createSignal,
  createMemo,
  createEffect,
  For,
  Show,
} from "solid-js";
import {
  GitCommit,
  FileDiff,
  Copy,
  Check,
  User,
  Calendar,
  X,
  RefreshCw,
  ChevronsUpDown,
} from "lucide-solid";
import { repoStore } from "../../../store/repoStore";
import { CommitDetail, CommitFileChange } from "../../../types/git";
import { buildGenericTree, GenericTreeNode } from "../../../utils/fileTree";
import { GenericFileTree } from "../../common/GenericFileTree";
import { FileTypeBadge } from "../../common/FileTypeBadge";
import { StatusBadge } from "../../common/StatusBadge";

interface CommitChangesSectionProps {
  repoPath: string;
  commitHash: string;
  viewMode: "list" | "tree";
  onClose?: () => void;
}

export const CommitChangesSection: Component<CommitChangesSectionProps> = (
  props,
) => {
  const [detail, setDetail] = createSignal<CommitDetail | null>(null);
  const [isLoading, setIsLoading] = createSignal<boolean>(false);
  const [copiedHash, setCopiedHash] = createSignal<boolean>(false);
  const [collapsedFolders, setCollapsedFolders] = createSignal<Set<string>>(
    new Set<string>(),
  );

  createEffect(async () => {
    const hash = props.commitHash;
    if (!hash || !props.repoPath) return;

    // Check store cache first
    const cached = repoStore.getCommitDetail(hash);
    if (cached) {
      setDetail(cached);
      return;
    }

    setIsLoading(true);
    try {
      const res = await repoStore.fetchAndCacheCommit(props.repoPath, hash);
      if (res) {
        setDetail(res);
      }
    } catch (err) {
      console.error("Failed to load commit details for sidebar:", err);
    } finally {
      setIsLoading(false);
    }
  });

  const commitFiles = () => detail()?.files || [];
  const filesTree = createMemo(() => buildGenericTree(commitFiles()));

  const allFolderIds = createMemo(() => {
    const ids: string[] = [];
    const traverse = (items: GenericTreeNode<CommitFileChange>[]) => {
      for (const item of items) {
        if (item.isFolder) {
          ids.push(item.id);
          traverse(item.children);
        }
      }
    };
    traverse(filesTree());
    return ids;
  });

  const isFolderExpanded = (folderId: string) =>
    !collapsedFolders().has(folderId);

  const isAllExpanded = () => collapsedFolders().size === 0;

  const toggleExpandAll = () => {
    if (isAllExpanded()) {
      setCollapsedFolders(new Set(allFolderIds()));
    } else {
      setCollapsedFolders(new Set<string>());
    }
  };

  const toggleFolder = (folderId: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const isSelected = (filePath: string) => {
    const diff = repoStore.selectedFileDiff();
    return (
      !!diff &&
      diff.commitHash === props.commitHash &&
      diff.filePath === filePath
    );
  };

  const isEntireCommitSelected = () => {
    const diff = repoStore.selectedFileDiff();
    return (
      !!diff &&
      diff.commitHash === props.commitHash &&
      diff.filePath === "__ALL__"
    );
  };

  const copySha = () => {
    void navigator.clipboard.writeText(props.commitHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div class="space-y-3 select-none">
      <Show
        when={!isLoading()}
        fallback={
          <div class="p-6 text-center text-gray-500 font-mono text-xs flex items-center justify-center gap-2">
            <RefreshCw class="w-3.5 h-3.5 animate-spin text-indigo-400" />
            <span>Loading commit changes...</span>
          </div>
        }
      >
        <Show when={detail()}>
          {(d) => (
            <div class="space-y-3">
              {/* Commit Meta Hero Card in Sidebar */}
              <div class="bg-carbon-base border border-carbon-border rounded-xl p-3 space-y-2 shadow-sm">
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-1.5">
                    <GitCommit class="w-3.5 h-3.5 text-cyan-400" />
                    <span class="font-mono font-bold text-xs text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/25">
                      {d().shortHash}
                    </span>
                  </div>

                  <div class="flex items-center gap-1">
                    <button
                      onClick={copySha}
                      class="p-1 hover:bg-carbon-elevated text-gray-400 hover:text-white rounded transition-colors cursor-pointer"
                      title="Copy full SHA"
                    >
                      <Show
                        when={copiedHash()}
                        fallback={<Copy class="w-3 h-3" />}
                      >
                        <Check class="w-3 h-3 text-emerald-400" />
                      </Show>
                    </button>

                    <Show when={props.onClose}>
                      <button
                        onClick={props.onClose}
                        class="p-1 hover:bg-carbon-elevated text-gray-400 hover:text-white rounded transition-colors cursor-pointer"
                        title="Close commit inspector"
                      >
                        <X class="w-3.5 h-3.5" />
                      </button>
                    </Show>
                  </div>
                </div>

                <p class="font-medium text-xs text-gray-200 line-clamp-2 leading-relaxed">
                  {d().subject}
                </p>

                <div class="flex items-center justify-between text-[10.5px] text-gray-400 font-mono pt-1 border-t border-carbon-border/50">
                  <span class="flex items-center gap-1 truncate max-w-[130px]">
                    <User class="w-3 h-3 text-gray-500" />
                    <span class="truncate">{d().authorName}</span>
                  </span>
                  <span class="flex items-center gap-1">
                    <Calendar class="w-3 h-3 text-gray-500" />
                    <span>{d().relativeDate}</span>
                  </span>
                </div>

                {/* Quick Action: View Entire Commit Diff Button */}
                <button
                  onClick={() =>
                    repoStore.selectFileForDiff("__ALL__", false, d().hash)
                  }
                  class={`w-full py-1.5 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer shadow-xs ${
                    isEntireCommitSelected()
                      ? "bg-indigo-500/25 text-white border-indigo-500/60 ring-1 ring-indigo-500/40 shadow-sm"
                      : "bg-[#181D2B] hover:bg-[#22293D] border-gray-700/60 text-indigo-300 hover:text-white"
                  }`}
                  title="View combined diff of all modified files in this commit"
                >
                  <div class="flex items-center gap-1.5">
                    <FileDiff class="w-3.5 h-3.5 text-indigo-400" />
                    <span>View Entire Commit Diff</span>
                  </div>
                  <span class="text-[10px] font-mono opacity-80">
                    ({d().files.length} files)
                  </span>
                </button>
              </div>

              {/* Commit Changed Files List */}
              <div class="space-y-1">
                <div class="flex items-center justify-between text-[11px] text-gray-400 font-semibold px-1">
                  <div class="flex items-center gap-2">
                    <span>
                      FILES CHANGED ({d().files.length})
                    </span>
                    <Show when={props.viewMode === "tree" && allFolderIds().length > 0}>
                      <button
                        onClick={toggleExpandAll}
                        class="p-0.5 hover:bg-carbon-elevated text-gray-400 hover:text-white rounded transition-colors cursor-pointer"
                        title={
                          isAllExpanded()
                            ? "Collapse all folders"
                            : "Expand all folders"
                        }
                      >
                        <Show
                          when={isAllExpanded()}
                          fallback={
                            <ChevronsUpDown class="w-3 h-3 text-indigo-400" />
                          }
                        >
                          <ChevronsUpDown class="w-3 h-3 text-amber-400 rotate-90" />
                        </Show>
                      </button>
                    </Show>
                  </div>
                  <div class="flex items-center gap-2 font-mono text-[10.5px]">
                    <Show when={d().totalAdditions > 0}>
                      <span class="text-emerald-400">
                        +{d().totalAdditions}
                      </span>
                    </Show>
                    <Show when={d().totalDeletions > 0}>
                      <span class="text-rose-400">
                        -{d().totalDeletions}
                      </span>
                    </Show>
                  </div>
                </div>

                <div class="bg-carbon-base/70 border border-carbon-border rounded-xl overflow-hidden py-1">
                  <Show
                    when={props.viewMode === "tree"}
                    fallback={
                      /* Flat list mode */
                      <div class="divide-y divide-carbon-border/40">
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
                              class={`group flex items-center justify-between px-3 py-1.5 text-xs font-mono cursor-pointer transition-all ${
                                isSelected(file.path)
                                  ? "bg-indigo-500/20 text-white font-semibold"
                                  : "hover:bg-[#1A1F2C] text-gray-300 hover:text-white"
                              }`}
                            >
                              <div class="flex items-center gap-2 min-w-0">
                                <FileTypeBadge filePath={file.path} />
                                <span
                                  class={`truncate ${
                                    isSelected(file.path)
                                      ? "text-indigo-300 font-bold"
                                      : "text-gray-200 group-hover:text-indigo-300"
                                  }`}
                                >
                                  {file.path}
                                </span>
                              </div>

                              <div class="flex items-center gap-2 text-[10.5px] tabular-nums flex-shrink-0">
                                <Show when={file.additions > 0}>
                                  <span class="text-emerald-400 font-bold">
                                    +{file.additions}
                                  </span>
                                </Show>
                                <Show when={file.deletions > 0}>
                                  <span class="text-rose-400 font-bold">
                                    -{file.deletions}
                                  </span>
                                </Show>
                                <StatusBadge
                                  status={file.status}
                                  variant="letter"
                                />
                              </div>
                            </div>
                          )}
                        </For>
                      </div>
                    }
                  >
                    {/* Tree mode */}
                    <GenericFileTree<CommitFileChange>
                      nodes={filesTree()}
                      isExpanded={isFolderExpanded}
                      onToggleFolder={toggleFolder}
                      renderItem={(file, node, depth) => (
                        <div
                          onClick={() =>
                            repoStore.selectFileForDiff(
                              file.path,
                              false,
                              d().hash,
                            )
                          }
                          style={{ "padding-left": `${depth * 12 + 18}px` }}
                          class={`group flex items-center justify-between py-1 pr-3 border-b border-carbon-border/30 rounded font-mono text-[11.5px] cursor-pointer transition-all ${
                            isSelected(file.path)
                              ? "bg-indigo-500/20 text-white font-semibold"
                              : "hover:bg-[#1A1F2C] text-gray-300 hover:text-white"
                          }`}
                        >
                          <div class="flex items-center gap-1.5 min-w-0">
                            <FileTypeBadge filePath={file.path} />
                            <span
                              class={`truncate ${
                                isSelected(file.path)
                                  ? "text-indigo-300 font-bold"
                                  : "text-gray-200 group-hover:text-indigo-300"
                              }`}
                            >
                              {node.name}
                            </span>
                          </div>

                          <div class="flex items-center gap-2 text-[10.5px] tabular-nums flex-shrink-0">
                            <Show when={file.additions > 0}>
                              <span class="text-emerald-400 font-bold">
                                +{file.additions}
                              </span>
                            </Show>
                            <Show when={file.deletions > 0}>
                              <span class="text-rose-400 font-bold">
                                -{file.deletions}
                              </span>
                            </Show>
                            <StatusBadge
                              status={file.status}
                              variant="letter"
                            />
                          </div>
                        </div>
                      )}
                    />
                  </Show>
                </div>
              </div>
            </div>
          )}
        </Show>
      </Show>
    </div>
  );
};
