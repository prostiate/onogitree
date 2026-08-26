import { Component, createSignal, createMemo, For, Show } from "solid-js";
import {
  Layers,
  FolderTree,
  List,
  ChevronsUpDown,
  CheckCircle2,
  FileCode,
  Plus,
  Minus,
} from "lucide-solid";
import { repoStore } from "../../../store/repoStore";
import { settingsStore } from "../../../store/settingsStore";
import { RepoStatus, FileStatus } from "../../../types/git";
import { buildGenericTree, GenericTreeNode } from "../../../utils/fileTree";
import { GenericFileTree } from "../../common/GenericFileTree";
import { StatusBadge } from "../../common/StatusBadge";

interface UncommittedChangesCardProps {
  repo: RepoStatus;
}

export const UncommittedChangesCard: Component<UncommittedChangesCardProps> = (props) => {
  const [collapsedFolders, setCollapsedFolders] = createSignal<Set<string>>(
    new Set<string>(),
  );

  const files = () => props.repo.files || [];
  const viewMode = () =>
    settingsStore.settings().uncommittedChangesViewMode || "tree";

  const filesTree = createMemo(() => buildGenericTree(files()));

  const allFolderIds = createMemo(() => {
    const ids: string[] = [];
    const traverse = (list: GenericTreeNode<FileStatus>[]) => {
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
    <div class="bg-[#11141D] border border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl select-none">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div class="flex items-center gap-2">
          <Layers class="w-4 h-4 text-indigo-400" />
          <h2 class="text-xs font-bold uppercase tracking-wider text-gray-200">
            Active Uncommitted Changes ({files().length})
          </h2>
        </div>

        <div class="flex items-center gap-2">
          <Show when={files().length > 0}>
            {/* Expand/Collapse All (Tree Mode only) */}
            <Show when={viewMode() === "tree"}>
              <button
                onClick={toggleExpandAll}
                class="px-2.5 py-1 bg-[#151926] hover:bg-[#1E2436] border border-gray-700/60 rounded-lg text-xs font-medium text-gray-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                title={
                  isAllExpanded()
                    ? "Collapse all uncommitted folders"
                    : "Expand all uncommitted folders"
                }
              >
                <Show
                  when={isAllExpanded()}
                  fallback={<ChevronsUpDown class="w-3.5 h-3.5 text-indigo-400" />}
                >
                  <ChevronsUpDown class="w-3.5 h-3.5 text-amber-400 rotate-90" />
                </Show>
                <span>{isAllExpanded() ? "Collapse All" : "Expand All"}</span>
              </button>
            </Show>

            {/* Tree vs List View Mode Switcher */}
            <div class="flex items-center bg-[#151926] border border-gray-700/60 rounded-lg p-0.5">
              <button
                onClick={() =>
                  settingsStore.updateSetting(
                    "uncommittedChangesViewMode",
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
                    "uncommittedChangesViewMode",
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
          <Show
            when={viewMode() === "tree"}
            fallback={
              /* Flat List View Mode */
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
                        <StatusBadge status={file.status} />
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
            {/* Tree View Mode using GenericFileTree */}
            <div class="py-1 divide-y divide-gray-800/40">
              <GenericFileTree
                nodes={filesTree()}
                isExpanded={isFolderExpanded}
                onToggleFolder={toggleFolder}
                renderItem={(file, node, depth) => (
                  <div
                    onClick={() =>
                      repoStore.selectFileForDiff(file.path, file.staged)
                    }
                    class="group flex items-center justify-between px-3 py-1.5 hover:bg-[#161B26] text-gray-300 hover:text-white cursor-pointer text-xs font-mono transition-colors"
                    style={{ "padding-left": `${depth * 14 + 26}px` }}
                  >
                    <div class="flex items-center gap-2.5 min-w-0">
                      <StatusBadge status={file.status} />
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
              />
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
};
