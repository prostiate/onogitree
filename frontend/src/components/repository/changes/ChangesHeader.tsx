import { Component, createSignal, Show, onMount, onCleanup } from "solid-js";
import {
  List,
  FolderTree,
  ChevronsUpDown,
  Plus,
  Minus,
  MoreHorizontal,
  GitBranch,
  FolderGit2,
  FileCode2,
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
  activeTab: "workingTree" | "commit";
  onTabChange: (tab: "workingTree" | "commit") => void;
  activeCommitHash?: string | null;
  totalWorkingChanges: number;
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
    <div class="bg-carbon-elevated border-b border-carbon-border select-none">
      {/* Top Bar: Title & Action Controls */}
      <div class="px-3.5 py-2.5 flex items-center justify-between border-b border-carbon-border/50">
        <div class="flex items-center gap-2">
          <FolderGit2 class="w-4 h-4 text-indigo-400" />
          <span class="font-bold text-gray-200 tracking-wider text-xs uppercase">
            Source Control
          </span>
        </div>

        <Show when={props.repo}>
          <div class="flex items-center gap-1.5">
            {/* Toggle Tree / List View */}
            <button
              onClick={() =>
                props.onViewModeChange(
                  props.viewMode === "tree" ? "list" : "tree",
                )
              }
              class={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                props.viewMode === "tree"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
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
                class="p-1.5 hover:bg-carbon-hover rounded-lg text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
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

            {/* Stage / Unstage All (Only in working tree mode) */}
            <Show when={props.activeTab === "workingTree"}>
              <button
                onClick={props.onStageAll}
                class="p-1.5 hover:bg-carbon-hover rounded-lg text-gray-400 hover:text-emerald-400 transition-colors cursor-pointer"
                title="Stage All Changes"
              >
                <Plus class="w-3.5 h-3.5" />
              </button>

              <button
                onClick={props.onUnstageAll}
                class="p-1.5 hover:bg-carbon-hover rounded-lg text-gray-400 hover:text-amber-400 transition-colors cursor-pointer"
                title="Unstage All Changes"
              >
                <Minus class="w-3.5 h-3.5" />
              </button>
            </Show>

            {/* More Options Dropdown */}
            <div ref={optionsMenuRef} class="relative">
              <button
                onClick={() => setShowOptionsMenu(!showOptionsMenu())}
                class="p-1.5 hover:bg-carbon-hover rounded-lg text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
                title="View & Sort Options"
              >
                <MoreHorizontal class="w-3.5 h-3.5" />
              </button>

              <Show when={showOptionsMenu()}>
                <div class="absolute right-0 top-8 w-48 bg-carbon-surface border border-carbon-border rounded-xl shadow-2xl py-1 z-40 text-xs backdrop-blur-md">
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
                      if (props.repo)
                        void repoStore.refreshRepo(props.repo.path);
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

      {/* Middle Row: Active Repository Hero Banner */}
      <Show when={props.repo}>
        {(repo) => (
          <div class="px-3.5 py-2 flex items-center justify-between gap-2 bg-carbon-base/40">
            <div class="flex items-center gap-2 min-w-0">
              <span class="font-bold text-gray-100 text-xs truncate">
                {repo().name}
              </span>
              <Show when={repo().isDirty}>
                <span
                  class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0"
                  title="Uncommitted changes"
                />
              </Show>
            </div>

            <div class="flex items-center gap-1.5 flex-shrink-0">
              {/* Branch Pill styled like Repository List */}
              <div class="flex items-center gap-1 px-2 py-0.5 bg-indigo-500/15 border border-indigo-500/40 rounded-full text-indigo-300 font-mono text-[10.5px] font-bold">
                <GitBranch class="w-3 h-3 text-indigo-400" />
                <span class="truncate max-w-[120px]">
                  {repo().currentBranch}
                </span>
              </div>

              {/* Ahead / Behind status */}
              <Show when={repo().aheadCount > 0 || repo().behindCount > 0}>
                <div class="flex items-center gap-1 font-mono text-[10px] font-bold px-1.5 py-0.5 bg-carbon-surface border border-carbon-border rounded">
                  <Show when={repo().aheadCount > 0}>
                    <span class="text-emerald-400">+{repo().aheadCount}↑</span>
                  </Show>
                  <Show when={repo().behindCount > 0}>
                    <span class="text-amber-400">~{repo().behindCount}↓</span>
                  </Show>
                </div>
              </Show>
            </div>
          </div>
        )}
      </Show>

      {/* Bottom Row: Context Switcher Tabs (Working Tree vs Active Commit) */}
      <Show when={props.activeCommitHash}>
        <div class="px-3.5 py-1.5 bg-carbon-surface border-t border-carbon-border/60 flex items-center gap-1.5">
          <button
            onClick={() => props.onTabChange("workingTree")}
            class={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              props.activeTab === "workingTree"
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-xs font-bold"
                : "text-gray-400 hover:text-gray-200 hover:bg-carbon-hover"
            }`}
          >
            <FolderGit2 class="w-3.5 h-3.5" />
            <span>Working Tree</span>
            <span class="text-[10px] opacity-80">
              ({props.totalWorkingChanges})
            </span>
          </button>

          <button
            onClick={() => props.onTabChange("commit")}
            class={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              props.activeTab === "commit"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs font-bold"
                : "text-gray-400 hover:text-gray-200 hover:bg-carbon-hover"
            }`}
          >
            <FileCode2 class="w-3.5 h-3.5 text-cyan-400" />
            <span>Commit: {props.activeCommitHash?.slice(0, 7)}</span>
          </button>
        </div>
      </Show>
    </div>
  );
};
