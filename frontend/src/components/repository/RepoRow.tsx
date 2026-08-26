import { Component, Show } from 'solid-js';
import { 
  GitBranch, 
  Pin, 
  RefreshCw, 
  AlertTriangle, 
  Key, 
  X,
  Radio
} from 'lucide-solid';
import { RepoStatus } from '../../types/git';
import { repoStore } from '../../store/repoStore';
import { batchStore } from '../../store/batchStore';

interface RepoRowProps {
  repo: RepoStatus;
  isSelected: boolean;
  onSelect: () => void;
  onBranchClick: () => void;
}

export const RepoRow: Component<RepoRowProps> = (props) => {
  const batchEvent = () => batchStore.progressEvents()[props.repo.id];

  return (
    <div
      onClick={props.onSelect}
      class={`group px-3 py-2 border-b border-carbon-border cursor-pointer select-none transition-colors flex items-center justify-between text-xs ${
        props.isSelected
          ? 'bg-carbon-elevated border-l-2 border-l-git-indigo'
          : 'hover:bg-carbon-surface bg-carbon-base'
      }`}
    >
      {/* Left side: Pin, Name, Branch Pill */}
      <div class="flex items-center gap-2 min-w-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            void repoStore.togglePin(props.repo.id);
          }}
          class={`p-0.5 rounded transition-opacity ${
            props.repo.isPinned
              ? 'text-git-indigo opacity-100'
              : 'text-gray-500 opacity-0 group-hover:opacity-100 hover:text-gray-300'
          }`}
          title={props.repo.isPinned ? 'Unpin repository' : 'Pin repository to top'}
        >
          <Pin class="w-3 h-3 rotate-45" />
        </button>

        <span class="font-medium text-gray-200 truncate" title={props.repo.path}>
          {props.repo.name}
        </span>

        {/* Branch Pill (Click to switch branch) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            props.onBranchClick();
          }}
          class="flex items-center gap-1.5 px-2 py-0.5 bg-carbon-elevated hover:bg-carbon-hover border border-carbon-border rounded text-[11px] font-mono text-git-indigo font-medium transition-colors cursor-pointer"
          title="Click to switch or create branch"
        >
          <GitBranch class="w-3 h-3" />
          <span class="truncate max-w-[130px]">{props.repo.currentBranch}</span>
          <Show when={props.repo.isDirty}>
            <span class="text-git-amber font-bold" title="Uncommitted changes">*</span>
          </Show>
        </button>
      </div>

      {/* Right side: Badges, Last Fetch, Actions */}
      <div class="flex items-center gap-2 flex-shrink-0">
        {/* Real-time batch progress state */}
        <Show when={batchEvent()}>
          {(event) => (
            <Show when={event().status === 'running'}>
              <span title={event().message}>
                <RefreshCw class="w-3 h-3 text-git-cyan animate-spin" />
              </span>
            </Show>
          )}
        </Show>


        {/* Conflict Badge */}
        <Show when={props.repo.hasConflicts || batchEvent()?.status === 'conflict'}>
          <span class="flex items-center gap-0.5 px-1.5 py-0.5 bg-git-crimson/20 border border-git-crimson/40 text-git-crimson rounded text-[10px] font-bold animate-pulse">
            <AlertTriangle class="w-2.5 h-2.5" />
            <span>Conflict</span>
          </span>
        </Show>

        {/* Auth Required Badge */}
        <Show when={batchEvent()?.status === 'auth_required'}>
          <span class="flex items-center gap-0.5 px-1.5 py-0.5 bg-git-amber/20 border border-git-amber/40 text-git-amber rounded text-[10px] font-bold">
            <Key class="w-2.5 h-2.5" />
            <span>Auth</span>
          </span>
        </Show>

        {/* Ahead / Behind Counters */}
        <Show when={props.repo.aheadCount > 0 || props.repo.behindCount > 0}>
          <div class="flex items-center gap-1 font-mono text-[10px] font-bold tabular-nums">
            <Show when={props.repo.aheadCount > 0}>
              <span class="text-git-emerald" title={`${props.repo.aheadCount} unpushed commits`}>
                +{props.repo.aheadCount}
              </span>
            </Show>
            <Show when={props.repo.behindCount > 0}>
              <span class="text-git-amber" title={`${props.repo.behindCount} commits behind upstream`}>
                ~{props.repo.behindCount}
              </span>
            </Show>
          </div>
        </Show>

        {/* Last Fetched timestamp */}
        <span class="text-[10px] text-gray-500 font-mono hidden sm:inline" title="Last remote fetch">
          {props.repo.lastFetchedAt}
        </span>

        {/* Auto Fetch Toggle icon */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            void repoStore.toggleAutoFetch(props.repo.id);
          }}
          class={`p-0.5 rounded transition-colors ${
            props.repo.autoFetchEnabled
              ? 'text-git-cyan opacity-80 hover:opacity-100'
              : 'text-gray-600 opacity-40 hover:opacity-80'
          }`}
          title={props.repo.autoFetchEnabled ? 'Auto-fetch enabled' : 'Auto-fetch disabled'}
        >
          <Radio class="w-3 h-3" />
        </button>

        {/* Quick action buttons on hover */}
        <div class="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              void repoStore.refreshRepo(props.repo.path);
            }}
            class="p-0.5 hover:bg-carbon-border rounded text-gray-400 hover:text-gray-200"
            title="Refresh this repository"
          >
            <RefreshCw class="w-3 h-3" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              void repoStore.removeRepository(props.repo.id);
            }}
            class="p-0.5 hover:bg-carbon-border rounded text-gray-500 hover:text-git-crimson"
            title="Remove repository from workspace"
          >
            <X class="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
