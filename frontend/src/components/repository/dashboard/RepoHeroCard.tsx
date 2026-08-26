import { Component, Show } from "solid-js";
import { GitBranch, RefreshCw, ArrowUpFromLine, Folder } from "lucide-solid";
import { repoStore } from "../../../store/repoStore";
import { RepoStatus } from "../../../types/git";

interface RepoHeroCardProps {
  repo: RepoStatus;
  onBranchPickerOpen: () => void;
}

export const RepoHeroCard: Component<RepoHeroCardProps> = (props) => {
  const isRefreshing = () => repoStore.isRefreshingRepo(props.repo.path);

  return (
    <div class="bg-[#11141D] border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
      <div class="space-y-2">
        <div class="flex items-center gap-3">
          <h1 class="text-xl font-black text-white tracking-tight">
            {props.repo.name}
          </h1>

          {/* Branch Switcher Button */}
          <button
            onClick={props.onBranchPickerOpen}
            class="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/50 rounded-lg text-xs font-mono text-indigo-300 font-bold cursor-pointer transition-all shadow-sm hover:scale-[1.02]"
            title="Click to switch or create branch"
          >
            <GitBranch class="w-3.5 h-3.5 text-indigo-400 stroke-[2.5]" />
            <span>{props.repo.currentBranch}</span>
            <Show when={props.repo.isDirty}>
              <span
                class="text-amber-400 font-black text-sm"
                title="Uncommitted changes"
              >
                *
              </span>
            </Show>
          </button>
        </div>

        <p class="text-xs text-gray-400 font-mono flex items-center gap-2">
          <span>{props.repo.path}</span>
        </p>
      </div>

      {/* Quick Actions Toolbar */}
      <div class="flex flex-wrap items-center gap-2">
        <button
          onClick={() => repoStore.openPath(props.repo.path)}
          class="px-3 py-1.5 bg-[#171B26] hover:bg-[#202534] border border-gray-700/60 rounded-xl text-xs font-medium text-gray-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Open folder in system file manager"
        >
          <Folder class="w-3.5 h-3.5 text-amber-400" />
          <span>Open Directory</span>
        </button>

        <Show when={props.repo.aheadCount > 0}>
          <button
            onClick={async () => {
              try {
                await repoStore.pushRepo(props.repo.path);
              } catch (err) {
                console.error("Push error:", err);
              }
            }}
            disabled={repoStore.isLoading()}
            class="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            title={`Push ${props.repo.aheadCount} outgoing commits to upstream`}
          >
            <Show
              when={repoStore.isLoading()}
              fallback={<ArrowUpFromLine class="w-3.5 h-3.5" />}
            >
              <RefreshCw class="w-3.5 h-3.5 animate-spin" />
            </Show>
            <span>
              {repoStore.isLoading()
                ? "Pushing..."
                : `Push ${props.repo.aheadCount} Commits`}
            </span>
          </button>
        </Show>

        <button
          onClick={() => repoStore.refreshRepo(props.repo.path)}
          class="px-3 py-1.5 bg-[#171B26] hover:bg-[#202534] border border-gray-700/60 rounded-xl text-xs font-medium text-gray-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Scan working tree and reload commit history"
        >
          <RefreshCw
            class={`w-3.5 h-3.5 text-cyan-400 ${
              isRefreshing() ? "animate-spin" : ""
            }`}
          />
          <span>
            {isRefreshing() ? "Refreshing..." : "Refresh"}
          </span>
        </button>
      </div>
    </div>
  );
};
