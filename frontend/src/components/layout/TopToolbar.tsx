import { Component, Show } from "solid-js";
import {
  FolderPlus,
  Search,
  ArrowDownToLine,
  RefreshCw,
  ArrowUpFromLine,
  Zap,
  Settings,
  Loader2,
  PanelLeft,
} from "lucide-solid";
import { repoStore } from "../../store/repoStore";
import { batchStore } from "../../store/batchStore";

interface TopToolbarProps {
  onOpenRepoClick: () => void;
  onSettingsClick: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const TopToolbar: Component<TopToolbarProps> = (props) => {
  return (
    <header class="h-10 bg-carbon-surface border-b border-carbon-border px-3 flex items-center justify-between select-none text-xs">
      {/* Left controls: Sidebar Toggle, Open Repo & Search */}
      <div class="flex items-center gap-1.5 sm:gap-2 min-w-0">
        <Show when={props.onToggleSidebar}>
          <button
            onClick={props.onToggleSidebar}
            class={`p-1.5 rounded-lg border transition-colors cursor-pointer flex-shrink-0 ${
              props.isSidebarCollapsed
                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/30"
                : "bg-carbon-elevated hover:bg-carbon-hover border-carbon-border text-gray-300 hover:text-white"
            }`}
            title={
              props.isSidebarCollapsed
                ? "Expand Sidebar (Ctrl+B)"
                : "Collapse Sidebar (Ctrl+B)"
            }
          >
            <PanelLeft class="w-3.5 h-3.5" />
          </button>
        </Show>

        <button
          onClick={props.onOpenRepoClick}
          class="flex items-center gap-1.5 px-2.5 py-1 bg-carbon-elevated hover:bg-carbon-hover border border-carbon-border rounded-lg text-gray-200 font-medium transition-colors cursor-pointer flex-shrink-0 shadow-xs"
          title="Open or Scan Git Repositories (Ctrl+O)"
        >
          <FolderPlus class="w-3.5 h-3.5 text-git-indigo" />
          <span class="hidden sm:inline">Open Repo</span>
        </button>

        <div class="relative flex items-center min-w-0">
          <Search class="w-3.5 h-3.5 text-gray-400 absolute left-2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search repos, branches (Ctrl+K)..."
            value={repoStore.searchQuery()}
            onInput={(e) => repoStore.setSearchQuery(e.currentTarget.value)}
            class="w-32 sm:w-44 md:w-56 pl-7 pr-2 py-1 bg-carbon-base border border-carbon-border rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-git-indigo transition-all text-xs"
          />
        </div>
      </div>

      {/* Middle status or Title */}
      <div class="hidden md:flex items-center gap-2">
        <span class="font-semibold text-gray-300 tracking-wide flex items-center gap-1.5">
          <span class="text-git-emerald">🌳</span> OnoGitTree
        </span>
        <Show when={batchStore.isBatchRunning()}>
          <div class="flex items-center gap-1 text-git-indigo bg-carbon-elevated px-2 py-0.5 rounded text-[11px] animate-pulse">
            <Loader2 class="w-3 h-3 animate-spin" />
            <span>Processing batch {batchStore.batchAction()}...</span>
          </div>
        </Show>
      </div>

      {/* Right controls: Batch Actions */}
      <div class="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
        <button
          onClick={() => batchStore.setIsPullModalOpen(true)}
          disabled={
            batchStore.isBatchRunning() || repoStore.repositories().length === 0
          }
          class="flex items-center gap-1 px-2 py-1 bg-carbon-elevated hover:bg-carbon-hover disabled:opacity-40 disabled:cursor-not-allowed border border-carbon-border rounded-lg text-gray-200 transition-colors cursor-pointer shadow-xs"
          title="Pull all repositories (with safeguards)"
        >
          <ArrowDownToLine class="w-3.5 h-3.5 text-git-emerald" />
          <span class="font-medium hidden sm:inline">Pull All</span>
        </button>

        <button
          onClick={() => batchStore.runFetchAll()}
          disabled={
            batchStore.isBatchRunning() || repoStore.repositories().length === 0
          }
          class="flex items-center gap-1 px-2 py-1 bg-carbon-elevated hover:bg-carbon-hover disabled:opacity-40 disabled:cursor-not-allowed border border-carbon-border rounded-lg text-gray-200 transition-colors cursor-pointer shadow-xs"
          title="Fetch all remotes and prune references"
        >
          <RefreshCw
            class={`w-3.5 h-3.5 text-git-cyan ${batchStore.isBatchRunning() && batchStore.batchAction() === "fetch" ? "animate-spin" : ""}`}
          />
          <span class="font-medium hidden sm:inline">Fetch All</span>
        </button>

        <button
          onClick={() => batchStore.setIsPushModalOpen(true)}
          disabled={
            batchStore.isBatchRunning() || repoStore.repositories().length === 0
          }
          class="flex items-center gap-1 px-2 py-1 bg-carbon-elevated hover:bg-carbon-hover disabled:opacity-40 disabled:cursor-not-allowed border border-carbon-border rounded-lg text-gray-200 transition-colors cursor-pointer shadow-xs"
          title="Review and push repositories with unpushed commits"
        >
          <ArrowUpFromLine class="w-3.5 h-3.5 text-git-indigo" />
          <span class="font-medium hidden sm:inline">Push All</span>
        </button>

        <button
          onClick={() => repoStore.refreshAll()}
          disabled={repoStore.isLoading()}
          class="p-1.5 hover:bg-carbon-hover border border-carbon-border rounded-lg text-gray-300 transition-colors cursor-pointer shadow-xs"
          title="Refresh working tree and branch status"
        >
          <Zap
            class={`w-3.5 h-3.5 text-git-amber ${repoStore.isLoading() ? "animate-spin" : ""}`}
          />
        </button>

        <button
          onClick={props.onSettingsClick}
          class="p-1.5 hover:bg-carbon-hover border border-carbon-border rounded-lg text-gray-400 hover:text-gray-200 transition-colors cursor-pointer shadow-xs"
          title="Open Preferences & Settings"
        >
          <Settings class="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
