import { Component, For, Show } from "solid-js";
import { Plus } from "lucide-solid";
import { repoStore } from "../../../store/repoStore";
import { FileStatus } from "../../../types/git";
import { FileTreeNode } from "../../../utils/fileTree";
import { GenericFileTree } from "../../common/GenericFileTree";
import { StatusBadge } from "../../common/StatusBadge";

interface UnstagedSectionProps {
  repoPath: string;
  files: FileStatus[];
  tree: FileTreeNode[];
  viewMode: "list" | "tree";
  isFolderCollapsed: (folderId: string) => boolean;
  onToggleFolder: (folderId: string) => void;
  onContextMenu: (e: MouseEvent, file: FileStatus) => void;
}

export const UnstagedSection: Component<UnstagedSectionProps> = (props) => {
  return (
    <div class="select-none">
      <div class="flex items-center justify-between text-[11px] text-gray-400 font-semibold mb-1">
        <span>CHANGES ({props.files.length})</span>
        <Show when={props.files.length > 0}>
          <button
            onClick={() => repoStore.stageFiles(props.repoPath, [])}
            class="text-gray-500 hover:text-gray-300 text-[10px] font-mono cursor-pointer"
          >
            Stage All
          </button>
        </Show>
      </div>

      <Show
        when={props.files.length > 0}
        fallback={
          <div class="text-[11px] text-gray-500 py-2 italic">
            Working tree clean.
          </div>
        }
      >
        <Show
          when={props.viewMode === "tree"}
          fallback={
            <div class="space-y-0.5">
              <For each={props.files}>
                {(file) => (
                  <div
                    onClick={() =>
                      repoStore.selectFileForDiff(file.path, false)
                    }
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      props.onContextMenu(e, file);
                    }}
                    onDblClick={() =>
                      repoStore.openPath(`${props.repoPath}/${file.path}`)
                    }
                    class="group flex items-center justify-between px-2 py-1.5 bg-carbon-base hover:bg-[#1A1F2C] border border-carbon-border/50 rounded font-mono text-[11.5px] cursor-pointer transition-colors"
                  >
                    <div class="flex items-center gap-2 truncate">
                      <StatusBadge status={file.status} variant="compact" />
                      <span class="text-gray-200 truncate">
                        {file.path}
                      </span>
                    </div>
                    <div class="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void repoStore.stageFiles(props.repoPath, [
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
            <GenericFileTree<FileStatus>
              nodes={props.tree}
              isExpanded={(folderId) => !props.isFolderCollapsed(folderId)}
              onToggleFolder={props.onToggleFolder}
              renderItem={(file, node, depth) => (
                <div
                  onClick={() =>
                    repoStore.selectFileForDiff(file.path, false)
                  }
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    props.onContextMenu(e, file);
                  }}
                  onDblClick={() =>
                    repoStore.openPath(`${props.repoPath}/${file.path}`)
                  }
                  style={{ "padding-left": `${depth * 12 + 18}px` }}
                  class="group flex items-center justify-between py-1 pr-2 hover:bg-[#1A1F2C] border-b border-carbon-border/30 rounded font-mono text-[11.5px] cursor-pointer transition-colors"
                >
                  <div class="flex items-center gap-1.5 truncate">
                    <StatusBadge status={file.status} variant="compact" />
                    <span class="text-gray-200 truncate">{node.name}</span>
                  </div>

                  <div class="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void repoStore.stageFiles(props.repoPath, [
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
            />
          </div>
        </Show>
      </Show>
    </div>
  );
};
