import { Component, Show, For } from "solid-js";
import {
  History,
  GitBranch,
  List,
  ChevronsUpDown,
  Search,
  X,
} from "lucide-solid";
import { repoStore } from "../../../store/repoStore";
import { settingsStore } from "../../../store/settingsStore";
import { RepoStatus, CommitSummary } from "../../../types/git";
import { CommitCard } from "./CommitCard";
import { GitGraphView } from "../GitGraphView";

interface CommitHistoryTimelineProps {
  repo: RepoStatus;
  commits: CommitSummary[];
  filteredCommits: CommitSummary[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  copiedHash: string | null;
  onCopyText: (text: string, id: string) => void;
  onContextMenu: (e: MouseEvent, commit: CommitSummary) => void;
}

export const CommitHistoryTimeline: Component<CommitHistoryTimelineProps> = (
  props,
) => {
  const viewMode = () =>
    settingsStore.settings().commitHistoryViewMode || "graph";

  const expandedCommitHashes = () => repoStore.expandedCommitHashes();

  const isAllExpanded = () => {
    const visible = props.filteredCommits;
    if (visible.length === 0) return false;
    const expanded = expandedCommitHashes();
    return visible.every((c) => expanded.has(c.hash));
  };

  const toggleExpandAll = () => {
    const visible = props.filteredCommits;
    if (isAllExpanded()) {
      repoStore.collapseAllCommits();
    } else {
      void repoStore.expandAllCommits(visible.map((c) => c.hash));
    }
  };

  return (
    <div class="bg-white dark:bg-[#11141D] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-4 shadow-sm select-none">
      {/* Header with Controls */}
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <History class="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <h2 class="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
            Commit History
          </h2>
          <span class="px-2 py-0.5 bg-gray-100 dark:bg-[#181D2B] border border-gray-200 dark:border-gray-700/60 rounded-full text-[10px] font-mono font-bold text-gray-700 dark:text-gray-300">
            {props.filteredCommits.length} / {props.commits.length} Loaded
          </span>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          {/* View Mode Switcher: Git Graph vs List */}
          <div class="flex items-center bg-gray-100 dark:bg-[#151926] border border-gray-200 dark:border-gray-700/60 rounded-lg p-0.5">
            <button
              onClick={() =>
                settingsStore.updateSetting("commitHistoryViewMode", "graph")
              }
              class={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                viewMode() === "graph"
                  ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-500/40"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
              title="View as Interactive Git Graph"
            >
              <GitBranch class="w-3 h-3" />
              <span>Graph</span>
            </button>
            <button
              onClick={() =>
                settingsStore.updateSetting("commitHistoryViewMode", "list")
              }
              class={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                viewMode() === "list"
                  ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-500/40"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
              title="View as Flat Cards List"
            >
              <List class="w-3 h-3" />
              <span>List</span>
            </button>
          </div>

          <div class="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-0.5" />

          {/* Expand / Collapse All Commits */}
          <button
            onClick={toggleExpandAll}
            class="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-[#151926] dark:hover:bg-[#1E2436] border border-gray-200 dark:border-gray-700/60 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
            title={
              isAllExpanded()
                ? "Collapse all expanded commits"
                : "Expand all visible commits"
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

          {/* Commit Limit Preset Switcher */}
          <div class="flex items-center bg-gray-100 dark:bg-[#151926] border border-gray-200 dark:border-gray-700/60 rounded-lg p-0.5 text-[10px] font-mono">
            <button
              onClick={() => repoStore.setCommitLimit(25)}
              class={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                repoStore.commitLimit() === 25
                  ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-500/40"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              25
            </button>
            <button
              onClick={() => repoStore.setCommitLimit(50)}
              class={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                repoStore.commitLimit() === 50
                  ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-500/40"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              50
            </button>
            <button
              onClick={() => repoStore.setCommitLimit(100)}
              class={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                repoStore.commitLimit() === 100
                  ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-500/40"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              100
            </button>
            <button
              onClick={() => repoStore.setCommitLimit(10000)}
              class={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                repoStore.commitLimit() >= 10000
                  ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-500/40"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
              title="Load all historical commits on this branch"
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Live Search Filter Bar */}
      <div class="relative flex items-center">
        <Search class="w-3.5 h-3.5 text-gray-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          placeholder="Filter commits by message, author, or SHA..."
          value={props.searchQuery}
          onInput={(e) => props.onSearchChange(e.currentTarget.value)}
          class="w-full pl-9 pr-8 py-1.5 bg-white dark:bg-[#0D1017] border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 text-xs font-mono focus:outline-none focus:border-indigo-400 transition-colors"
        />
        <Show when={props.searchQuery}>
          <button
            onClick={() => props.onSearchChange("")}
            class="p-1 text-gray-500 hover:text-gray-300 absolute right-2.5 cursor-pointer"
            title="Clear search"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </Show>
      </div>

      {/* Commit List / Graph */}
      <Show
        when={props.filteredCommits.length > 0}
        fallback={
          <div class="p-8 text-center text-xs text-gray-500 space-y-2">
            <Show
              when={props.searchQuery}
              fallback={<p>No commit history found on active branch.</p>}
            >
              <p>No commits match filter "{props.searchQuery}".</p>
              <button
                onClick={() => props.onSearchChange("")}
                class="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg text-xs cursor-pointer hover:bg-indigo-500/30"
              >
                Clear Filter
              </button>
            </Show>
          </div>
        }
      >
        <Show
          when={viewMode() === "graph"}
          fallback={
            <div class="space-y-2.5">
              <For each={props.filteredCommits}>
                {(commit) => (
                  <CommitCard
                    commit={commit}
                    copiedHash={props.copiedHash}
                    onCopyText={props.onCopyText}
                    onContextMenu={props.onContextMenu}
                  />
                )}
              </For>
            </div>
          }
        >
          <div class="border border-gray-200 dark:border-gray-800/80 rounded-2xl overflow-hidden bg-white dark:bg-[#0D1017] shadow-xs">
            <GitGraphView
              repo={props.repo}
              commits={props.filteredCommits}
              onCommitContextMenu={props.onContextMenu}
            />
          </div>
        </Show>

        {/* Load More Footer */}
        <Show when={repoStore.commitLimit() < 10000}>
          <div class="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => repoStore.loadMoreCommits(props.repo.path, 25)}
              class="px-4 py-2 bg-[#151926] hover:bg-[#1E2436] border border-gray-700/60 rounded-xl text-xs font-semibold text-gray-200 hover:text-white flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              <History class="w-3.5 h-3.5 text-indigo-400" />
              <span>Load More Commits (+25)</span>
            </button>

            <button
              onClick={() => repoStore.setCommitLimit(10000)}
              class="px-4 py-2 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 rounded-xl text-xs font-semibold text-indigo-300 hover:text-white flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              <span>Load All Commits on Branch</span>
            </button>
          </div>
        </Show>
      </Show>
    </div>
  );
};
