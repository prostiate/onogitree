import { Component, createSignal, createMemo, Show } from "solid-js";
import {
  FileDiff,
  Copy,
  Check,
  ChevronsUpDown,
  RefreshCw,
} from "lucide-solid";
import { repoStore } from "../../../store/repoStore";
import { CommitSummary, CommitFileChange } from "../../../types/git";
import { buildGenericTree, GenericTreeNode } from "../../../utils/fileTree";
import { GenericFileTree } from "../../common/GenericFileTree";
import { FileTypeBadge } from "../../common/FileTypeBadge";
import { StatusBadge } from "../../common/StatusBadge";

interface CommitInspectorPanelProps {
  commit: CommitSummary;
  copiedHash: string | null;
  onCopyText: (text: string, id: string) => void;
}

export const CommitInspectorPanel: Component<CommitInspectorPanelProps> = (
  props,
) => {
  const [expandedFolders, setExpandedFolders] = createSignal<Set<string>>(
    new Set<string>(),
  );

  const detail = () => repoStore.getCommitDetail(props.commit.hash);
  const commitFilesTree = createMemo(() =>
    buildGenericTree(detail()?.files || []),
  );

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
    traverse(commitFilesTree());
    return ids;
  });

  const isAllExpanded = () => {
    const ids = allFolderIds();
    if (ids.length === 0) return false;
    const cur = expandedFolders();
    return ids.every((id) => cur.has(id));
  };

  const toggleExpandAll = () => {
    const ids = allFolderIds();
    if (isAllExpanded()) {
      setExpandedFolders(new Set<string>());
    } else {
      setExpandedFolders(new Set<string>(ids));
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const isFolderExpanded = (folderId: string, depth: number) =>
    expandedFolders().has(folderId) ||
    (expandedFolders().size === 0 && depth === 0);

  return (
    <div class="mt-2.5 pt-2.5 border-t border-gray-200/80 dark:border-gray-800/80 space-y-3 select-none">
      <Show
        when={detail()}
        fallback={
          <div class="py-3 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
            <RefreshCw class="w-3.5 h-3.5 animate-spin text-indigo-500" />
            <span>Loading commit details...</span>
          </div>
        }
      >
        {(d) => (
          <div class="space-y-3">
            {/* Metadata / Actions Bar */}
            <div class="bg-white dark:bg-[#121624] p-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 text-xs font-mono space-y-2.5 shadow-sm">
              <div class="flex items-center justify-between text-gray-600 dark:text-gray-400 text-[11px] gap-2 flex-wrap">
                <span class="truncate">SHA: {d().hash}</span>

                <div class="flex items-center gap-2">
                  <button
                    onClick={() =>
                      repoStore.selectFileForDiff("__ALL__", false, d().hash)
                    }
                    class="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/30 border border-indigo-200 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-300 font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                    title="View entire commit diff"
                  >
                    <FileDiff class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>View Entire Diff</span>
                  </button>

                  <button
                    onClick={() =>
                      props.onCopyText(d().hash, `sha-${d().hash}`)
                    }
                    class="px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-carbon-surface dark:hover:bg-carbon-hover border border-gray-200 dark:border-carbon-border text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Show
                      when={props.copiedHash === `sha-${d().hash}`}
                      fallback={<Copy class="w-3 h-3" />}
                    >
                      <Check class="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
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
                <pre class="text-gray-800 dark:text-gray-200 bg-[#F7F5F0] dark:bg-[#0D1017] p-3 rounded-xl whitespace-pre-wrap text-[11px] border border-gray-200 dark:border-gray-800 font-mono leading-relaxed">
                  {d().body}
                </pre>
              </Show>

              <div class="flex items-center gap-3 text-[11px] font-mono font-bold pt-0.5">
                <span class="text-gray-600 dark:text-gray-400">
                  {d().files.length} files
                </span>
                <span class="text-emerald-600 dark:text-emerald-400">
                  +{d().totalAdditions}
                </span>
                <span class="text-rose-600 dark:text-rose-400">
                  -{d().totalDeletions}
                </span>
              </div>
            </div>

            {/* Files Tree Section */}
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-[11px] text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider px-1">
                <span>FILES CHANGED ({d().files.length})</span>
                <button
                  onClick={toggleExpandAll}
                  class="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-[#151926] dark:hover:bg-[#1E2436] border border-gray-200 dark:border-gray-700/60 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                  title={
                    isAllExpanded()
                      ? "Collapse all folders"
                      : "Expand all folders"
                  }
                >
                  <Show
                    when={isAllExpanded()}
                    fallback={
                      <ChevronsUpDown class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    }
                  >
                    <ChevronsUpDown class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 rotate-90" />
                  </Show>
                  <span>{isAllExpanded() ? "Collapse All" : "Expand All"}</span>
                </button>
              </div>

              <div class="bg-white dark:bg-[#0D1017] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden py-1 shadow-xs">
                <GenericFileTree<CommitFileChange>
                  nodes={commitFilesTree()}
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
                      class="group flex items-center justify-between px-3 py-1.5 hover:bg-[#F7F5F0] dark:hover:bg-[#161B26] text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white cursor-pointer text-xs font-mono transition-colors"
                      style={{ "padding-left": `${depth * 14 + 20}px` }}
                    >
                      <div class="flex items-center gap-2 min-w-0">
                        <FileTypeBadge filePath={file.path} />
                        <span class="truncate text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                          {node.name}
                        </span>
                      </div>

                      <div class="flex items-center gap-3 text-[11px] tabular-nums flex-shrink-0 mr-1">
                        <Show when={file.additions > 0}>
                          <span class="text-emerald-600 dark:text-emerald-400 font-bold">
                            +{file.additions}
                          </span>
                        </Show>
                        <Show when={file.deletions > 0}>
                          <span class="text-rose-600 dark:text-rose-400 font-bold">
                            -{file.deletions}
                          </span>
                        </Show>
                        <StatusBadge status={file.status} variant="letter" />
                      </div>
                    </div>
                  )}
                />
              </div>
            </div>
          </div>
        )}
      </Show>
    </div>
  );
};
