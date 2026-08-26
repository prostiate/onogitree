import { Component, Show } from "solid-js";
import { RepoStatus } from "../../../types/git";

interface RepoMetricsBarProps {
  repo: RepoStatus;
}

export const RepoMetricsBar: Component<RepoMetricsBarProps> = (props) => {
  return (
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 select-none">
      {/* 1. Upstream Divergence */}
      <div class="bg-[#11141D] border border-gray-800 rounded-2xl p-5 space-y-2 shadow-lg">
        <div class="flex items-center justify-between">
          <span class="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
            Upstream Sync
          </span>
          <span class="text-xs text-gray-500 font-mono truncate">
            {props.repo.upstreamBranch || "Local branch"}
          </span>
        </div>
        <div class="flex items-baseline gap-3 font-mono">
          <span
            class={`text-base font-extrabold ${
              props.repo.aheadCount > 0 ? "text-emerald-400" : "text-gray-400"
            }`}
          >
            +{props.repo.aheadCount} ahead
          </span>
          <span
            class={`text-base font-extrabold ${
              props.repo.behindCount > 0 ? "text-amber-400" : "text-gray-400"
            }`}
          >
            ~{props.repo.behindCount} behind
          </span>
        </div>
        <p class="text-[11px] text-gray-400">
          {props.repo.aheadCount === 0 && props.repo.behindCount === 0
            ? "In sync with remote upstream"
            : "Pending commits to sync"}
        </p>
      </div>

      {/* 2. Working Tree Changes */}
      <div class="bg-[#11141D] border border-gray-800 rounded-2xl p-5 space-y-2 shadow-lg">
        <span class="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">
          Working Tree
        </span>
        <div class="text-base font-extrabold text-white font-mono flex items-center gap-2">
          <span>{props.repo.changedFilesCount} Files Changed</span>
          <Show when={props.repo.isDirty}>
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          </Show>
        </div>
        <p class="text-[11px] text-gray-400">
          {props.repo.isDirty
            ? "Uncommitted modifications in workspace"
            : "Clean working directory"}
        </p>
      </div>

      {/* 3. Remote Fetch Info */}
      <div class="bg-[#11141D] border border-gray-800 rounded-2xl p-5 space-y-2 shadow-lg">
        <span class="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">
          Last Fetched
        </span>
        <div class="text-base font-extrabold text-gray-200 font-mono">
          {props.repo.lastFetchedAt}
        </div>
        <p class="text-[11px] text-gray-400">
          Auto-fetch:{" "}
          {props.repo.autoFetchEnabled ? "Active (Background)" : "Disabled"}
        </p>
      </div>
    </div>
  );
};
