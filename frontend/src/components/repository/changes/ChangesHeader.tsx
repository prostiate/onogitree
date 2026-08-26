import { Component, createSignal, Show, onMount, onCleanup } from "solid-js";
import {
  List,
  FolderTree,
  ChevronsUpDown,
  Plus,
  Minus,
  MoreHorizontal,
} from "lucide-solid";
import { repoStore } from "../../../store/repoStore";
import { RepoStatus } from "../../../types/git";

interface ChangesHeaderProps {
  repo: RepoStatus | null;
  viewMode: "list" | "tree";
  onViewModeChange: (mode: "list" | "tree") => void;
  sortBy: "path" | "name" | "status";
  onSortByChange: (sort: "path" | "name" | "status") => void;
  isAllCollapsed: boolean;
  onToggleExpandAll: () => void;
  onStageAll: () => void;
  onUnstageAll: () => void;
}

export const ChangesHeader: Component<ChangesHeaderProps> = (props) => {
  const [showOptionsMenu, setShowOptionsMenu] = createSignal<boolean>(false);
  let optionsMenuRef: HTMLDivElement | undefined;

  const handleOutsideClick = (e: MouseEvent) => {
    if (
      showOptionsMenu() &&
      optionsMenuRef &&
      !optionsMenuRef.contains(e.target as Node)
    ) {
      setShowOptionsMenu(false);
    }
  };

  onMount(() => {
    document.addEventListener("mousedown", handleOutsideClick);
  });

  onCleanup(() => {
    document.removeEventListener("mousedown", handleOutsideClick);
  });

  return (
    <div class="px-3 py-2 bg-carbon-elevated border-b border-carbon-border flex items-center justify-between select-none">
      <span class="font-bold text-gray-200 tracking-wider text-[11px] uppercase flex items-center gap-1.5 truncate">
        <span>Source Control</span>
        <Show when={props.repo}>
          <span class="text-indigo-300 font-bold lowercase font-mono">
            ({props.repo!.name})
          </span>
        </Show>
      </span>

      <Show when={props.repo}>
        <div class="flex items-center gap-1">
          {/* Toggle Tree / List View */}
          <button
            onClick={() =>
              props.onViewModeChange(props.viewMode === "tree" ? "list" : "tree")
            }
            class={`p-1 rounded transition-colors cursor-pointer ${
              props.viewMode === "tree"
                ? "bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30"
                : "text-gray-400 hover:text-gray-200 hover:bg-carbon-hover"
            }`}
            title={
              props.viewMode === "tree"
                ? "Switch to List View"
                : "Switch to Tree View"
            }
          >
            <Show
              when={props.viewMode === "tree"}
              fallback={<List class="w-3.5 h-3.5" />}
            >
              <FolderTree class="w-3.5 h-3.5" />
            </Show>
          </button>

          {/* Expand/Collapse All (Tree Mode only) */}
          <Show when={props.viewMode === "tree"}>
            <button
              onClick={props.onToggleExpandAll}
              class="p-1 hover:bg-carbon-hover rounded text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
              title={
                props.isAllCollapsed
                  ? "Expand All Folders"
                  : "Collapse All Folders"
              }
            >
              <Show
                when={props.isAllCollapsed}
                fallback={
                  <ChevronsUpDown class="w-3.5 h-3.5 text-amber-400 rotate-90" />
                }
              >
                <ChevronsUpDown class="w-3.5 h-3.5 text-indigo-400" />
              </Show>
            </button>
          </Show>

          {/* Stage / Unstage All */}
          <button
            onClick={props.onStageAll}
            class="p-1 hover:bg-carbon-hover rounded text-gray-400 hover:text-emerald-400 transition-colors cursor-pointer"
            title="Stage All Changes"
          >
            <Plus class="w-3.5 h-3.5" />
          </button>

          <button
            onClick={props.onUnstageAll}
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
                    props.onViewModeChange("list");
                    setShowOptionsMenu(false);
                  }}
                  class="w-full text-left px-3 py-1.5 hover:bg-carbon-hover flex items-center justify-between text-gray-200 cursor-pointer"
                >
                  <span>View as List</span>
                  <Show when={props.viewMode === "list"}>
                    <span class="text-indigo-400">✓</span>
                  </Show>
                </button>

                <button
                  onClick={() => {
                    props.onViewModeChange("tree");
                    setShowOptionsMenu(false);
                  }}
                  class="w-full text-left px-3 py-1.5 hover:bg-carbon-hover flex items-center justify-between text-gray-200 cursor-pointer"
                >
                  <span>View as Tree</span>
                  <Show when={props.viewMode === "tree"}>
                    <span class="text-indigo-400">✓</span>
                  </Show>
                </button>

                <div class="my-1 border-t border-carbon-border" />

                <button
                  onClick={() => {
                    props.onSortByChange("path");
                    setShowOptionsMenu(false);
                  }}
                  class="w-full text-left px-3 py-1.5 hover:bg-carbon-hover flex items-center justify-between text-gray-200 cursor-pointer"
                >
                  <span>Sort by Path</span>
                  <Show when={props.sortBy === "path"}>
                    <span class="text-indigo-400">✓</span>
                  </Show>
                </button>

                <button
                  onClick={() => {
                    props.onSortByChange("name");
                    setShowOptionsMenu(false);
                  }}
                  class="w-full text-left px-3 py-1.5 hover:bg-carbon-hover flex items-center justify-between text-gray-200 cursor-pointer"
                >
                  <span>Sort by Name</span>
                  <Show when={props.sortBy === "name"}>
                    <span class="text-indigo-400">✓</span>
                  </Show>
                </button>

                <button
                  onClick={() => {
                    props.onSortByChange("status");
                    setShowOptionsMenu(false);
                  }}
                  class="w-full text-left px-3 py-1.5 hover:bg-carbon-hover flex items-center justify-between text-gray-200 cursor-pointer"
                >
                  <span>Sort by Status</span>
                  <Show when={props.sortBy === "status"}>
                    <span class="text-indigo-400">✓</span>
                  </Show>
                </button>

                <div class="my-1 border-t border-carbon-border" />

                <button
                  onClick={() => {
                    if (props.repo) void repoStore.refreshRepo(props.repo.path);
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
      </Show>
    </div>
  );
};
