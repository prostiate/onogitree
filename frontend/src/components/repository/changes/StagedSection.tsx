import { Component, For, Show } from "solid-js";
import { Minus } from "lucide-solid";
import { repoStore } from "../../../store/repoStore";
import { FileStatus } from "../../../types/git";
import { FileTreeNode } from "../../../utils/fileTree";
import { GenericFileTree } from "../../common/GenericFileTree";
import { StatusBadge } from "../../common/StatusBadge";
import { FileIcon } from "../../common/FileIcon";

interface StagedSectionProps {
  repoPath: string;
  files: FileStatus[];
  tree: FileTreeNode[];
  viewMode: "list" | "tree";
  isFolderCollapsed: (folderId: string) => boolean;
  onToggleFolder: (folderId: string) => void;
  onContextMenu: (e: MouseEvent, file: FileStatus) => void;
}

export const StagedSection: Component<StagedSectionProps> = (props) => {
  const isSelected = (path: string) => {
    const diff = repoStore.selectedFileDiff();
    return !!diff && diff.staged === true && !diff.commitHash && diff.filePath === path;
  };

  return (
    <Show when={props.files.length > 0}>
      <div class="select-none">
        <div class="flex items-center justify-between text-[11px] text-gray-400 font-semibold mb-1">
          <span>STAGED CHANGES ({props.files.length})</span>
          <button
            onClick={() => repoStore.unstageFiles(props.repoPath, [])}
            class="text-gray-500 hover:text-gray-300 text-[10px] font-mono cursor-pointer"
          >
            Unstage All
          </button>
        </div>

        <Show
          when={props.viewMode === "tree"}
          fallback={
            <div class="space-y-0.5">
              <For each={props.files}>
                {(file) => (
                  <div
                    onClick={() =>
                      repoStore.selectFileForDiff(file.path, true)
                    }
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      props.onContextMenu(e, file);
                    }}
                    onDblClick={() =>
                      repoStore.openPath(`${props.repoPath}/${file.path}`)
                    }
                    class={`group flex items-center justify-between px-2 py-1.5 border rounded font-mono text-[11.5px] cursor-pointer transition-all ${
                      isSelected(file.path)
                        ? "bg-indigo-500/20 text-white border-indigo-500/60 ring-1 ring-indigo-500/40 shadow-xs font-semibold"
                        : "bg-carbon-base hover:bg-[#1A1F2C] border-carbon-border/50 text-gray-200"
                    }`}
                  >
                    <div class="flex items-center gap-2 truncate">
                      <FileIcon filePath={file.path} size={14} class="flex-shrink-0" />
                      <StatusBadge status={file.status} variant="compact" />
                      <span class={`truncate ${isSelected(file.path) ? "text-indigo-300 font-bold" : "text-gray-200"}`}>
                        {file.path}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void repoStore.unstageFiles(props.repoPath, [
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
            <GenericFileTree<FileStatus>
              nodes={props.tree}
              isExpanded={(folderId) => !props.isFolderCollapsed(folderId)}
              onToggleFolder={props.onToggleFolder}
              renderItem={(file, node, depth) => (
                <div
                  onClick={() =>
                    repoStore.selectFileForDiff(file.path, true)
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
                  class={`group flex items-center justify-between py-1 pr-2 border-b rounded font-mono text-[11.5px] cursor-pointer transition-all ${
                    isSelected(file.path)
                      ? "bg-indigo-500/20 text-white border-indigo-500/60 ring-1 ring-indigo-500/40 font-semibold"
                      : "border-carbon-border/30 hover:bg-[#1A1F2C] text-gray-200"
                  }`}
                >
                  <div class="flex items-center gap-1.5 truncate">
                    <FileIcon filePath={file.path} size={14} class="flex-shrink-0" />
                    <StatusBadge status={file.status} variant="compact" />
                    <span class={`truncate ${isSelected(file.path) ? "text-indigo-300 font-bold" : "text-gray-200"}`}>
                      {node.name}
                    </span>
                  </div>

                  <div class="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void repoStore.unstageFiles(props.repoPath, [
                          file.path,
                        ]);
                      }}
                      class="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-carbon-elevated rounded text-gray-400 hover:text-amber-400"
                      title="Unstage file"
                    >
                      <Minus class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            />
          </div>
        </Show>
      </div>
    </Show>
  );
};
