import { Component, createSignal, Show, onMount, onCleanup } from "solid-js";
import {
  List,
  FolderTree,
  ChevronsUpDown,
  MoreHorizontal,
  GitBranch,
  FolderGit2,
  FileCode2,
  FileDiff,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  RefreshCw,
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
  isExpanded?: boolean;
  onToggleAccordion?: () => void;
}

export const ChangesHeader: Component<ChangesHeaderProps> = (props) => {
  const [showOptionsMenu, setShowOptionsMenu] = createSignal<boolean>(false);
  let optionsMenuRef: HTMLDivElement | undefined;

  const isExpanded = () => props.isExpanded ?? true;

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
    <div class="bg-carbon-elevated border-b border-carbon-border select-none flex-shrink-0">
      {/* Top Bar: Title & Clean Compact Controls */}
      <div
        onClick={props.onToggleAccordion}
        class="px-3.5 py-2 flex items-center justify-between border-b border-carbon-border/50 cursor-pointer hover:bg-carbon-surface/80 transition-colors"
      >
        {/* Left: Source Control Title + Changes Counter */}
        <div class="flex items-center gap-2 min-w-0 flex-1">
          <Show
            when={isExpanded()}
            fallback={<ChevronRight class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
          >
            <ChevronDown class="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
          </Show>
          <FolderGit2 class="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
          <span class="font-bold text-gray-200 tracking-wider text-xs uppercase whitespace-nowrap">
            Source Control
          </span>

          <Show when={props.totalWorkingChanges > 0}>
            <span class="px-1.5 py-0.2 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono text-[10px] font-bold rounded-full flex-shrink-0">
              {props.totalWorkingChanges}
            </span>
          </Show>
        </div>

        {/* Right: Uncluttered Essential Icon Actions */}
        <Show when={isExpanded() && props.repo}>
          <div
            class="flex items-center gap-1 flex-shrink-0 ml-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* View All Changes Diff Icon */}
            <Show when={props.totalWorkingChanges > 0 && props.activeTab === "workingTree"}>
              <button
                onClick={() => repoStore.selectFileForDiff("__ALL__", false)}
                class="p-1 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-200 rounded-md transition-colors cursor-pointer"
                title="View All Working Tree Changes Diff"
              >
                <FileDiff class="w-3.5 h-3.5" />
              </button>
            </Show>

            {/* Toggle Tree / List View */}
            <button
              onClick={() =>
                props.onViewModeChange(
                  props.viewMode === "tree" ? "list" : "tree",
                )
              }
              class="p-1 hover:bg-carbon-hover rounded-md text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
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
                class="p-1 hover:bg-carbon-hover rounded-md text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
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

            {/* More Options Dropdown */}
            <div ref={optionsMenuRef} class="relative">
              <button
                onClick={() => setShowOptionsMenu(!showOptionsMenu())}
                class="p-1 hover:bg-carbon-hover rounded-md text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
                title="More Options"
              >
                <MoreHorizontal class="w-3.5 h-3.5" />
              </button>

              <Show when={showOptionsMenu()}>
                <div class="absolute right-0 top-7 w-48 bg-carbon-surface border border-carbon-border rounded-xl shadow-2xl py-1 z-40 text-xs backdrop-blur-md">
                  <Show when={props.totalWorkingChanges > 0}>
                    <button
                      onClick={() => {
                        repoStore.selectFileForDiff("__ALL__", false);
                        setShowOptionsMenu(false);
                      }}
                      class="w-full text-left px-3 py-1.5 hover:bg-carbon-hover flex items-center gap-2 text-indigo-300 hover:text-white cursor-pointer font-semibold"
                    >
                      <FileDiff class="w-3.5 h-3.5 text-indigo-400" />
                      <span>View Entire Diff</span>
                    </button>
                    <div class="my-1 border-t border-carbon-border" />
                  </Show>

                  <Show when={props.activeTab === "workingTree"}>
                    <button
                      onClick={() => {
                        props.onStageAll();
                        setShowOptionsMenu(false);
                      }}
                      class="w-full text-left px-3 py-1.5 hover:bg-carbon-hover flex items-center gap-2 text-gray-200 hover:text-emerald-400 cursor-pointer"
                    >
                      <Plus class="w-3.5 h-3.5 text-emerald-400" />
                      <span>Stage All Changes</span>
                    </button>

                    <button
                      onClick={() => {
                        props.onUnstageAll();
                        setShowOptionsMenu(false);
                      }}
                      class="w-full text-left px-3 py-1.5 hover:bg-carbon-hover flex items-center gap-2 text-gray-200 hover:text-amber-400 cursor-pointer"
                    >
                      <Minus class="w-3.5 h-3.5 text-amber-400" />
                      <span>Unstage All Changes</span>
                    </button>

                    <div class="my-1 border-t border-carbon-border" />
                  </Show>

                  <button
                    onClick={() => {
                      props.onViewModeChange("list");
                      setShowOptionsMenu(false);
                    }}
                    class="w-full text-left px-3 py-1.5 hover:bg-carbon-hover flex items-center justify-between text-gray-200 cursor-pointer"
                  >
                    <span>View as List</span>
                    <Show when={props.viewMode === "list"}>
                      <span class="text-indigo-400 font-bold">✓</span>
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
                      <span class="text-indigo-400 font-bold">✓</span>
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
                      <span class="text-indigo-400 font-bold">✓</span>
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
                      <span class="text-indigo-400 font-bold">✓</span>
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
                      <span class="text-indigo-400 font-bold">✓</span>
                    </Show>
                  </button>

                  <div class="my-1 border-t border-carbon-border" />

                  <button
                    onClick={() => {
                      if (props.repo)
                        void repoStore.refreshRepo(props.repo.path);
                      setShowOptionsMenu(false);
                    }}
                    class="w-full text-left px-3 py-1.5 hover:bg-carbon-hover flex items-center gap-2 text-gray-200 cursor-pointer"
                  >
                    <RefreshCw class="w-3.5 h-3.5 text-gray-400" />
                    <span>Refresh Changes</span>
                  </button>
                </div>
              </Show>
            </div>
          </div>
        </Show>
      </div>

      {/* Middle Row: Active Repository Hero Banner (when expanded) */}
      <Show when={isExpanded()}>
        <Show when={props.repo}>
          {(repo) => (
            <div class="px-3.5 py-1.5 flex items-center justify-between gap-2 bg-[#0E1119] border-b border-carbon-border/40">
              <div class="flex items-center gap-1.5 min-w-0">
                <span class="font-bold text-gray-200 text-xs truncate">
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
                {/* Branch Pill */}
                <div class="flex items-center gap-1 px-2 py-0.5 bg-indigo-500/15 border border-indigo-500/30 rounded-full text-indigo-300 font-mono text-[10.5px] font-bold">
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
      </Show>

      {/* Bottom Row: Context Switcher Tabs (Working Tree vs Active Commit) */}
      <Show when={isExpanded() && props.activeCommitHash}>
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
