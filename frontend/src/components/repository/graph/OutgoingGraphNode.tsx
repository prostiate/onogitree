import { Component, createSignal, createMemo, Show } from "solid-js";
import {
  ChevronRight,
  ChevronDown,
  ChevronsUpDown,
  Plus,
  Minus,
  FileDiff,
} from "lucide-solid";
import { repoStore } from "../../../store/repoStore";
import { RepoStatus, FileStatus } from "../../../types/git";
import { buildGenericTree, GenericTreeNode } from "../../../utils/fileTree";
import { GenericFileTree } from "../../common/GenericFileTree";
import { FileTypeBadge } from "../../common/FileTypeBadge";
import { StatusBadge } from "../../common/StatusBadge";
import { ROW_HEIGHT, NODE_CY, OFFSET_X } from "./GraphSvgSpine";

interface OutgoingGraphNodeProps {
  repo: RepoStatus;
  gutterWidth: number;
}

export const OutgoingGraphNode: Component<OutgoingGraphNodeProps> = (props) => {
  // Expanded by default
  const [isExpanded, setIsExpanded] = createSignal(true);
  const [collapsedFolders, setCollapsedFolders] = createSignal<Set<string>>(
    new Set<string>(),
  );

  const files = () => props.repo.files || [];
  const outgoingFilesTree = createMemo(() => buildGenericTree(files()));

  const allFolderIds = createMemo(() => {
    const ids: string[] = [];
    const traverse = (items: GenericTreeNode<FileStatus>[]) => {
      for (const item of items) {
        if (item.isFolder) {
          ids.push(item.id);
          traverse(item.children);
        }
      }
    };
    traverse(outgoingFilesTree());
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

  const isSelected = (path: string, staged: boolean) => {
    const diff = repoStore.selectedFileDiff();
    return !!diff && diff.staged === staged && !diff.commitHash && diff.filePath === path;
  };

  return (
    <div
      class={`group flex items-stretch transition-colors select-none ${
        isExpanded()
          ? "bg-sky-50/70 dark:bg-[#121624]/90"
          : "bg-sky-50/30 dark:bg-sky-950/10 hover:bg-sky-50/60 dark:hover:bg-sky-950/20"
      }`}
    >
      {/* Left Graph Spine column matching width */}
      <div
        class="flex-shrink-0 relative flex flex-col items-center select-none"
        style={{ width: `${props.gutterWidth}px` }}
      >
        <svg
          width={props.gutterWidth}
          height={ROW_HEIGHT}
          class="overflow-visible block"
        >
          {/* Outgoing Dashed Ring Node */}
          <circle
            cx={OFFSET_X}
            cy={NODE_CY}
            r="6.5"
            fill="none"
            stroke="#0098FF"
            stroke-width="2"
            stroke-dasharray="3,2.5"
          />
          <circle cx={OFFSET_X} cy={NODE_CY} r="2.5" fill="#0098FF" />
          {/* Dashed Vertical Line Connecting to HEAD Commit */}
          <line
            x1={OFFSET_X}
            y1={NODE_CY + 6}
            x2={OFFSET_X}
            y2={ROW_HEIGHT}
            stroke="#0098FF"
            stroke-width="2.5"
            stroke-dasharray="3,2.5"
          />
        </svg>

        {/* Continuous Vertical Spine when Outgoing is Expanded */}
        <Show when={isExpanded()}>
          <div
            class="absolute top-[36px] bottom-0 w-0.5 border-l-2 border-dashed border-sky-500/80"
            style={{ left: `${OFFSET_X - 1}px` }}
          />
        </Show>
      </div>

      {/* Outgoing Changes Row Content */}
      <div class="flex-1 min-w-0 py-2.5 pr-4 border-b border-gray-100/80 dark:border-gray-800/30">
        <div
          onClick={() => setIsExpanded(!isExpanded())}
          class="flex items-center justify-between gap-3 cursor-pointer"
        >
          <div class="flex items-center gap-2.5 truncate">
            <span class="font-bold text-xs text-sky-800 dark:text-sky-300 font-mono tracking-tight">
              Outgoing Changes
            </span>
            <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">
              {props.repo.currentBranch}
            </span>

            <Show when={props.repo.aheadCount > 0}>
              <span class="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 rounded-full font-mono text-[10px] font-bold">
                +{props.repo.aheadCount} to push
              </span>
            </Show>

            <Show when={props.repo.changedFilesCount > 0}>
              <span class="px-2 py-0.5 bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 rounded-full font-mono text-[10px] font-bold">
                {props.repo.changedFilesCount} uncommitted
              </span>
            </Show>
          </div>

          <button class="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-white transition-transform">
            <Show
              when={isExpanded()}
              fallback={<ChevronRight class="w-3.5 h-3.5" />}
            >
              <ChevronDown class="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            </Show>
          </button>
        </div>

        {/* Expanded Outgoing Changes Files Tree */}
        <Show when={isExpanded()}>
          <div class="mt-2.5 pt-2 border-t border-sky-200 dark:border-gray-800/80 space-y-2">
            <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1 font-mono">
              <span>
                WORKING TREE FILES ({files().length})
              </span>
              <div class="flex items-center gap-2">
                {/* Expand / Collapse All Folders Button */}
                <Show when={allFolderIds().length > 0}>
                  <button
                    onClick={toggleExpandAll}
                    class="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 dark:bg-[#151926] dark:hover:bg-[#1E2436] border border-gray-200 dark:border-gray-700/60 rounded text-[10px] font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                    title={
                      isAllExpanded()
                        ? "Collapse all folders"
                        : "Expand all folders"
                    }
                  >
                    <Show
                      when={isAllExpanded()}
                      fallback={
                        <ChevronsUpDown class="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                      }
                    >
                      <ChevronsUpDown class="w-3 h-3 text-amber-600 dark:text-amber-400 rotate-90" />
                    </Show>
                    <span>{isAllExpanded() ? "Collapse All" : "Expand All"}</span>
                  </button>
                </Show>

                <button
                  onClick={() => repoStore.selectFileForDiff("__ALL__", false)}
                  class="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/15 dark:hover:bg-indigo-500/25 border border-indigo-300 dark:border-indigo-500/30 text-indigo-800 dark:text-indigo-300 rounded font-semibold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                  title="View combined diff of all uncommitted changes"
                >
                  <FileDiff class="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                  <span>View All Changes</span>
                </button>

                <button
                  onClick={() => repoStore.stageFiles(props.repo.path, [])}
                  class="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded font-semibold text-[10px] cursor-pointer transition-colors"
                >
                  Stage All
                </button>
                <button
                  onClick={() => repoStore.unstageFiles(props.repo.path, [])}
                  class="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/15 dark:hover:bg-amber-500/25 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 rounded font-semibold text-[10px] cursor-pointer transition-colors"
                >
                  Unstage All
                </button>
              </div>
            </div>

            <div class="bg-white dark:bg-[#0D1017] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden py-1 shadow-xs">
              <GenericFileTree<FileStatus>
                nodes={outgoingFilesTree()}
                isExpanded={isFolderExpanded}
                onToggleFolder={toggleFolder}
                renderItem={(file, node, depth) => (
                  <div
                    onClick={() =>
                      repoStore.selectFileForDiff(file.path, file.staged)
                    }
                    class={`group flex items-center justify-between px-3 py-1.5 cursor-pointer text-xs font-mono transition-all ${
                      isSelected(file.path, file.staged)
                        ? "bg-indigo-500/20 text-white font-semibold"
                        : "hover:bg-[#F7F5F0] dark:hover:bg-[#161B26] text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    }`}
                    style={{ "padding-left": `${depth * 14 + 20}px` }}
                  >
                    <div class="flex items-center gap-2 min-w-0">
                      <FileTypeBadge filePath={file.path} />
                      <span class={`truncate ${
                        isSelected(file.path, file.staged)
                          ? "text-sky-600 dark:text-sky-300 font-bold"
                          : "text-gray-800 dark:text-gray-200 group-hover:text-sky-600 dark:group-hover:text-sky-300"
                      }`}>
                        {node.name}
                      </span>
                    </div>

                    <div class="flex items-center gap-2 flex-shrink-0 mr-1">
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
                            class="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-gray-500 hover:text-emerald-700 dark:hover:text-emerald-400 rounded transition-all cursor-pointer"
                            title="Stage file"
                          >
                            <Plus class="w-3 h-3" />
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
                          class="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-gray-500 hover:text-amber-700 dark:hover:text-amber-400 rounded transition-all cursor-pointer"
                          title="Unstage file"
                        >
                          <Minus class="w-3 h-3" />
                        </button>
                      </Show>
                      <StatusBadge status={file.status} variant="letter" />
                    </div>
                  </div>
                )}
              />
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
};
