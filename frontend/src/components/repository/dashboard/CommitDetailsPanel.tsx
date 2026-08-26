import { Component, createSignal, createMemo, For, Show } from "solid-js";
import {
  RefreshCw,
  FileDiff,
  Copy,
  Check,
  ChevronsUpDown,
  FolderTree,
  List,
  ExternalLink,
} from "lucide-solid";
import { repoStore } from "../../../store/repoStore";
import { settingsStore } from "../../../store/settingsStore";
import { CommitSummary, CommitFileChange } from "../../../types/git";
import { buildGenericTree, GenericTreeNode } from "../../../utils/fileTree";
import { GenericFileTree } from "../../common/GenericFileTree";
import { StatusBadge } from "../../common/StatusBadge";

interface CommitDetailsPanelProps {
  commit: CommitSummary;
  copiedHash: string | null;
  onCopyText: (text: string, id: string) => void;
}

export const CommitDetailsPanel: Component<CommitDetailsPanelProps> = (props) => {
  const [collapsedFolders, setCollapsedFolders] = createSignal<Set<string>>(
    new Set<string>(),
  );

  const detail = () => repoStore.getCommitDetail(props.commit.hash);
  const viewMode = () =>
    settingsStore.settings().commitFilesViewMode || "tree";

  const filesTree = createMemo(() =>
    buildGenericTree(detail()?.files || []),
  );

  const allFolderIds = createMemo(() => {
    const ids: string[] = [];
    const traverse = (list: GenericTreeNode<CommitFileChange>[]) => {
      for (const node of list) {
        if (node.isFolder) {
          ids.push(node.id);
          traverse(node.children);
        }
      }
    };
    traverse(filesTree());
    return ids;
  });

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

  const isFolderExpanded = (folderId: string) =>
    !collapsedFolders().has(folderId);

  return (
    <div class="px-4 pb-4 pt-1 border-t border-gray-800/80 mt-1 space-y-3">
      <Show
        when={detail()}
        fallback={
          <div class="py-4 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
            <RefreshCw class="w-3.5 h-3.5 animate-spin text-indigo-400" />
            <span>Loading commit details and file list...</span>
          </div>
        }
      >
        {(d) => (
          <div class="space-y-3 pt-2">
            {/* Full Commit Body / SHA Card */}
            <div class="bg-[#0A0C13] p-3.5 rounded-xl border border-gray-800 space-y-3 text-xs shadow-inner">
              <div class="flex items-center justify-between text-gray-400 font-mono text-[11px] gap-2 flex-wrap">
                <span class="truncate">Commit SHA: {d().hash}</span>

                <div class="flex items-center gap-2">
                  <button
                    onClick={() =>
                      repoStore.selectFileForDiff("__ALL__", false, d().hash)
                    }
                    class="px-2.5 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                    title="View full unified diff of all changed files in this commit"
                  >
                    <FileDiff class="w-3.5 h-3.5 text-indigo-400" />
                    <span>View Entire Commit Diff</span>
                  </button>

                  <button
                    onClick={() =>
                      props.onCopyText(d().hash, `sha-${d().hash}`)
                    }
                    class="px-2 py-1 bg-[#151926] hover:bg-[#1E2436] border border-gray-700/60 text-gray-300 hover:text-white rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Show
                      when={props.copiedHash === `sha-${d().hash}`}
                      fallback={<Copy class="w-3 h-3" />}
                    >
                      <Check class="w-3 h-3 text-emerald-400" />
                    </Show>
                    <span>
                      {props.copiedHash === `sha-${d().hash}`
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

            {/* Changed Files List Header with Tree/List Switcher and Expand/Collapse */}
            <div class="space-y-1.5">
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <span class="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider block">
                  Files Changed in This Commit ({d().files.length})
                </span>

                <div class="flex items-center gap-2">
                  <Show when={viewMode() === "tree"}>
                    <button
                      onClick={toggleExpandAll}
                      class="px-2.5 py-1 bg-[#151926] hover:bg-[#1E2436] border border-gray-700/60 rounded-lg text-xs font-medium text-gray-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                      title={
                        isAllExpanded()
                          ? "Collapse all folders"
                          : "Expand all folders"
                      }
                    >
                      <Show
                        when={isAllExpanded()}
                        fallback={
                          <ChevronsUpDown class="w-3.5 h-3.5 text-indigo-400" />
                        }
                      >
                        <ChevronsUpDown class="w-3.5 h-3.5 text-amber-400 rotate-90" />
                      </Show>
                      <span>
                        {isAllExpanded() ? "Collapse All" : "Expand All"}
                      </span>
                    </button>
                  </Show>

                  <div class="flex items-center bg-[#151926] border border-gray-700/60 rounded-lg p-0.5">
                    <button
                      onClick={() =>
                        settingsStore.updateSetting(
                          "commitFilesViewMode",
                          "tree",
                        )
                      }
                      class={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                        viewMode() === "tree"
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
                        viewMode() === "list"
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
                <Show
                  when={viewMode() === "tree"}
                  fallback={
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
                              <StatusBadge status={file.status} />
                              <span class="font-mono text-xs text-gray-200 truncate group-hover:text-indigo-300">
                                {file.path}
                              </span>
                            </div>

                            <div class="flex items-center gap-2 font-mono text-[11px] tabular-nums flex-shrink-0">
                              <Show when={file.additions > 0}>
                                <span class="text-emerald-400">
                                  +{file.additions}
                                </span>
                              </Show>
                              <Show when={file.deletions > 0}>
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
                    <GenericFileTree
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
                          class="group flex items-center justify-between px-3 py-1.5 hover:bg-[#151926] text-gray-300 hover:text-white cursor-pointer text-xs font-mono transition-colors"
                          style={{ "padding-left": `${depth * 14 + 26}px` }}
                        >
                          <div class="flex items-center gap-2 min-w-0">
                            <StatusBadge status={file.status} />
                            <span class="truncate text-gray-200 group-hover:text-indigo-300">
                              {node.name}
                            </span>
                          </div>

                          <div class="flex items-center gap-2 text-[11px] tabular-nums flex-shrink-0 mr-1">
                            <Show when={file.additions > 0}>
                              <span class="text-emerald-400">
                                +{file.additions}
                              </span>
                            </Show>
                            <Show when={file.deletions > 0}>
                              <span class="text-rose-400">
                                -{file.deletions}
                              </span>
                            </Show>
                            <ExternalLink class="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                          </div>
                        </div>
                      )}
                    />
                  </div>
                </Show>
              </div>
            </div>
          </div>
        )}
      </Show>
    </div>
  );
};
