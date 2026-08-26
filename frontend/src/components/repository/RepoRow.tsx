import { Component, createSignal, Show } from 'solid-js';
import { 
  GitBranch, 
  Pin, 
  RefreshCw, 
  AlertTriangle, 
  Key, 
  X,
  Radio,
  Folder,
  Copy,
  ArrowDownToLine,
  ArrowUpFromLine,
  Trash2
} from 'lucide-solid';
import { RepoStatus } from '../../types/git';
import { repoStore } from '../../store/repoStore';
import { batchStore } from '../../store/batchStore';
import { ContextMenu, MenuItem } from '../common/ContextMenu';

interface RepoRowProps {
  repo: RepoStatus;
  isSelected: boolean;
  onSelect: () => void;
  onBranchClick: () => void;
}

export const RepoRow: Component<RepoRowProps> = (props) => {
  const batchEvent = () => batchStore.progressEvents()[props.repo.id];
  const [contextMenuPos, setContextMenuPos] = createSignal<{ x: number; y: number } | null>(null);

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  const menuItems: () => MenuItem[] = () => [
    {
      id: 'branch',
      label: `Switch Branch (${props.repo.currentBranch})...`,
      icon: <GitBranch class="w-3.5 h-3.5 text-indigo-400" />,
      onClick: () => props.onBranchClick(),
    },
    {
      id: 'refresh',
      label: 'Refresh Repository',
      icon: <RefreshCw class="w-3.5 h-3.5 text-cyan-400" />,
      onClick: () => repoStore.refreshRepo(props.repo.path),
    },
    {
      id: 'pull',
      label: 'Pull Changes',
      icon: <ArrowDownToLine class="w-3.5 h-3.5 text-emerald-400" />,
      onClick: () => batchStore.runPullAll(),
    },
    {
      id: 'push',
      label: 'Push Commits',
      icon: <ArrowUpFromLine class="w-3.5 h-3.5 text-emerald-400" />,
      onClick: () => batchStore.setIsPushModalOpen(true),
    },
    { id: 'div-1', label: '', divider: true },
    {
      id: 'open-folder',
      label: 'Open in File Manager',
      icon: <Folder class="w-3.5 h-3.5 text-amber-400" />,
      onClick: () => repoStore.openPath(props.repo.path),
    },
    {
      id: 'copy-path',
      label: 'Copy Repository Path',
      icon: <Copy class="w-3.5 h-3.5 text-gray-400" />,
      onClick: () => navigator.clipboard.writeText(props.repo.path),
    },
    { id: 'div-2', label: '', divider: true },
    {
      id: 'pin',
      label: props.repo.isPinned ? 'Unpin Repository' : 'Pin Repository to Top',
      icon: <Pin class="w-3.5 h-3.5 text-indigo-400" />,
      onClick: () => repoStore.togglePin(props.repo.id),
    },
    {
      id: 'autofetch',
      label: props.repo.autoFetchEnabled ? 'Disable Auto-Fetch' : 'Enable Auto-Fetch',
      icon: <Radio class="w-3.5 h-3.5 text-cyan-400" />,
      onClick: () => repoStore.toggleAutoFetch(props.repo.id),
    },
    { id: 'div-3', label: '', divider: true },
    {
      id: 'remove',
      label: 'Remove from Workspace',
      icon: <Trash2 class="w-3.5 h-3.5 text-rose-400" />,
      danger: true,
      onClick: () => repoStore.removeRepository(props.repo.id),
    },
  ];

  return (
    <>
      <div
        onClick={props.onSelect}
        onContextMenu={handleContextMenu}
        class={`group px-3 py-2.5 border-b border-carbon-border cursor-pointer select-none transition-colors flex items-center justify-between text-xs ${
          props.isSelected
            ? 'bg-carbon-elevated border-l-2 border-l-indigo-400'
            : 'hover:bg-carbon-surface bg-carbon-base'
        }`}
      >
        {/* Left side: Pin, Name, Branch Pill */}
        <div class="flex items-center gap-2.5 min-w-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              void repoStore.togglePin(props.repo.id);
            }}
            class={`p-0.5 rounded transition-opacity ${
              props.repo.isPinned
                ? 'text-indigo-400 opacity-100'
                : 'text-gray-500 opacity-0 group-hover:opacity-100 hover:text-gray-300'
            }`}
            title={props.repo.isPinned ? 'Unpin repository' : 'Pin repository to top'}
          >
            <Pin class="w-3.5 h-3.5 rotate-45" />
          </button>

          <span class="font-semibold text-gray-100 truncate text-[12.5px]" title={props.repo.path}>
            {props.repo.name}
          </span>

          {/* High-Contrast, Noticeable Branch Pill */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              props.onBranchClick();
            }}
            class="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 rounded text-[11.5px] font-mono text-indigo-300 font-bold transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
            title="Click to switch or create branch"
          >
            <GitBranch class="w-3.5 h-3.5 text-indigo-400 stroke-[2.5]" />
            <span class="truncate max-w-[130px]">{props.repo.currentBranch}</span>
            <Show when={props.repo.isDirty}>
              <span class="text-amber-400 font-black text-sm" title="Uncommitted changes">*</span>
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
                  <RefreshCw class="w-3.5 h-3.5 text-git-cyan animate-spin" />
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
            <div class="flex items-center gap-1 font-mono text-[10.5px] font-bold tabular-nums">
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
          <span class="text-[10px] text-gray-400 font-mono hidden sm:inline" title="Last remote fetch">
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
                ? 'text-cyan-400 opacity-90 hover:opacity-100'
                : 'text-gray-600 opacity-40 hover:opacity-80'
            }`}
            title={props.repo.autoFetchEnabled ? 'Auto-fetch enabled' : 'Auto-fetch disabled'}
          >
            <Radio class="w-3.5 h-3.5" />
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
              <RefreshCw class="w-3.5 h-3.5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                void repoStore.removeRepository(props.repo.id);
              }}
              class="p-0.5 hover:bg-carbon-border rounded text-gray-500 hover:text-rose-400"
              title="Remove repository from workspace"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      <Show when={contextMenuPos()}>
        {(pos) => (
          <ContextMenu
            x={pos().x}
            y={pos().y}
            isOpen={true}
            items={menuItems()}
            onClose={() => setContextMenuPos(null)}
          />
        )}
      </Show>
    </>
  );
};

