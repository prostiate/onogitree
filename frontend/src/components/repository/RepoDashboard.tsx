import { Component, For, Show } from 'solid-js';
import { 
  GitBranch, 
  RefreshCw, 
  ArrowUpFromLine, 
  Folder, 
  Plus, 
  Minus, 
  History, 
  CheckCircle2,
  Layers,
  FileCode
} from 'lucide-solid';
import { repoStore } from '../../store/repoStore';
import { batchStore } from '../../store/batchStore';
import { RepoStatus, FileStatus } from '../../types/git';

interface RepoDashboardProps {
  repo: RepoStatus;
  onBranchPickerOpen: () => void;
}

export const RepoDashboard: Component<RepoDashboardProps> = (props) => {
  const commits = () => repoStore.recentCommits();
  const files = () => props.repo.files || [];

  const getStatusBadge = (status: FileStatus['status']) => {
    switch (status) {
      case 'modified':
        return <span class="px-1.5 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded text-[10px] font-mono font-bold">MODIFIED</span>;
      case 'staged':
        return <span class="px-1.5 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded text-[10px] font-mono font-bold">STAGED</span>;
      case 'deleted':
        return <span class="px-1.5 py-0.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded text-[10px] font-mono font-bold">DELETED</span>;
      case 'untracked':
        return <span class="px-1.5 py-0.5 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 rounded text-[10px] font-mono font-bold">UNTRACKED</span>;
      default:
        return <span class="px-1.5 py-0.5 bg-gray-500/15 border border-gray-500/30 text-gray-300 rounded text-[10px] font-mono font-bold">MODIFIED</span>;
    }
  };

  return (
    <div class="flex-1 flex flex-col overflow-y-auto p-6 space-y-6 text-gray-200 select-none">
      
      {/* 1. Repository Hero Header Card */}
      <div class="bg-[#11141D] border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="space-y-2">
          <div class="flex items-center gap-3">
            <h1 class="text-xl font-black text-white tracking-tight">{props.repo.name}</h1>
            
            {/* Noticeable Branch Switcher Button */}
            <button
              onClick={props.onBranchPickerOpen}
              class="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/50 rounded-lg text-xs font-mono text-indigo-300 font-bold cursor-pointer transition-all shadow-sm hover:scale-[1.02]"
              title="Click to switch or create branch"
            >
              <GitBranch class="w-3.5 h-3.5 text-indigo-400 stroke-[2.5]" />
              <span>{props.repo.currentBranch}</span>
              <Show when={props.repo.isDirty}>
                <span class="text-amber-400 font-black text-sm" title="Uncommitted changes">*</span>
              </Show>
            </button>
          </div>

          <p class="text-xs text-gray-400 font-mono flex items-center gap-2">
            <span>{props.repo.path}</span>
          </p>
        </div>

        {/* Global Quick Action Toolbar for Repository */}
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
              onClick={() => batchStore.setIsPushModalOpen(true)}
              class="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <ArrowUpFromLine class="w-3.5 h-3.5" />
              <span>Push {props.repo.aheadCount} Commits</span>
            </button>
          </Show>

          <button
            onClick={() => repoStore.refreshRepo(props.repo.path)}
            class="px-3 py-1.5 bg-[#171B26] hover:bg-[#202534] border border-gray-700/60 rounded-xl text-xs font-medium text-gray-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw class="w-3.5 h-3.5 text-cyan-400" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics & Status Bar */}
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Upstream Divergence */}
        <div class="bg-[#11141D] border border-gray-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <div class="flex items-center justify-between">
            <span class="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Upstream Sync</span>
            <span class="text-xs text-gray-500 font-mono truncate">{props.repo.upstreamBranch || 'Local branch'}</span>
          </div>
          <div class="flex items-baseline gap-3 font-mono">
            <span class={`text-base font-extrabold ${props.repo.aheadCount > 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
              +{props.repo.aheadCount} ahead
            </span>
            <span class={`text-base font-extrabold ${props.repo.behindCount > 0 ? 'text-amber-400' : 'text-gray-400'}`}>
              ~{props.repo.behindCount} behind
            </span>
          </div>
          <p class="text-[11px] text-gray-400">
            {props.repo.aheadCount === 0 && props.repo.behindCount === 0 ? 'In sync with remote upstream' : 'Pending commits to sync'}
          </p>
        </div>

        {/* Working Tree Changes */}
        <div class="bg-[#11141D] border border-gray-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <span class="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">Working Tree</span>
          <div class="text-base font-extrabold text-white font-mono flex items-center gap-2">
            <span>{props.repo.changedFilesCount} Files Changed</span>
            <Show when={props.repo.isDirty}>
              <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            </Show>
          </div>
          <p class="text-[11px] text-gray-400">
            {props.repo.isDirty ? 'Uncommitted modifications in workspace' : 'Clean working directory'}
          </p>
        </div>

        {/* Remote Fetch Info */}
        <div class="bg-[#11141D] border border-gray-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <span class="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">Last Fetched</span>
          <div class="text-base font-extrabold text-gray-200 font-mono">
            {props.repo.lastFetchedAt}
          </div>
          <p class="text-[11px] text-gray-400">
            Auto-fetch: {props.repo.autoFetchEnabled ? 'Active (Background)' : 'Disabled'}
          </p>
        </div>
      </div>

      {/* 3. Active Working Tree Changes Breakdown */}
      <div class="bg-[#11141D] border border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Layers class="w-4 h-4 text-indigo-400" />
            <h2 class="text-xs font-bold uppercase tracking-wider text-gray-200">
              Active Uncommitted Changes ({files().length})
            </h2>
          </div>

          <Show when={files().length > 0}>
            <div class="flex items-center gap-2">
              <button
                onClick={() => repoStore.stageFiles(props.repo.path, [])}
                class="px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Stage All
              </button>
              <button
                onClick={() => repoStore.unstageFiles(props.repo.path, [])}
                class="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Unstage All
              </button>
            </div>
          </Show>
        </div>

        <Show
          when={files().length > 0}
          fallback={
            <div class="p-8 text-center text-xs text-gray-500 flex flex-col items-center gap-2">
              <CheckCircle2 class="w-8 h-8 text-emerald-400 opacity-60" />
              <p class="font-bold text-gray-300">Clean Working Tree</p>
              <p class="text-xs text-gray-500">There are no uncommitted modifications in this repository.</p>
            </div>
          }
        >
          <div class="divide-y divide-gray-800 border border-gray-800 rounded-xl overflow-hidden bg-[#0D1017]">
            <For each={files()}>
              {(file) => (
                <div
                  onClick={() => repoStore.selectFileForDiff(file.path, file.staged)}
                  class="group px-4 py-2.5 hover:bg-[#161B26] flex items-center justify-between gap-4 cursor-pointer transition-colors"
                >
                  <div class="flex items-center gap-3 min-w-0">
                    {getStatusBadge(file.status)}
                    <span class="font-mono text-xs text-gray-200 truncate group-hover:text-indigo-300 transition-colors">
                      {file.path}
                    </span>
                  </div>

                  <div class="flex items-center gap-2 flex-shrink-0">
                    <span class="text-[11px] text-gray-500 font-mono opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <FileCode class="w-3 h-3 text-indigo-400" />
                      <span>Inspect Diff</span>
                    </span>

                    <Show
                      when={file.staged}
                      fallback={
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            void repoStore.stageFiles(props.repo.path, [file.path]);
                          }}
                          class="p-1 hover:bg-emerald-500/20 text-gray-400 hover:text-emerald-400 rounded transition-colors"
                          title="Stage File"
                        >
                          <Plus class="w-3.5 h-3.5" />
                        </button>
                      }
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void repoStore.unstageFiles(props.repo.path, [file.path]);
                        }}
                        class="p-1 hover:bg-amber-500/20 text-gray-400 hover:text-amber-400 rounded transition-colors"
                        title="Unstage File"
                      >
                        <Minus class="w-3.5 h-3.5" />
                      </button>
                    </Show>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>

      {/* 4. Recent Commit History Timeline */}
      <div class="bg-[#11141D] border border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <History class="w-4 h-4 text-cyan-400" />
            <h2 class="text-xs font-bold uppercase tracking-wider text-gray-200">
              Recent Commit History
            </h2>
          </div>
          <span class="text-xs font-mono text-gray-500">{commits().length} commits loaded</span>
        </div>

        <Show
          when={commits().length > 0}
          fallback={
            <div class="p-6 text-center text-xs text-gray-500">
              No commit history found on active branch.
            </div>
          }
        >
          <div class="space-y-2">
            <For each={commits()}>
              {(commit) => (
                <div class="p-3.5 bg-[#0D1017] hover:bg-[#141824] border border-gray-800/80 rounded-xl flex items-start justify-between gap-4 transition-all">
                  <div class="space-y-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-mono font-bold text-xs text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                        {commit.shortHash}
                      </span>
                      <span class="font-semibold text-xs text-white truncate">{commit.subject}</span>
                    </div>

                    <div class="flex items-center gap-3 text-[11px] text-gray-500 font-mono">
                      <span class="text-gray-400">{commit.authorName}</span>
                      <span>•</span>
                      <span>{commit.relativeDate}</span>
                    </div>
                  </div>

                  <Show when={commit.refs}>
                    <span class="px-2 py-0.5 bg-gray-800 text-gray-300 font-mono text-[10px] rounded-full border border-gray-700 flex-shrink-0">
                      {commit.refs}
                    </span>
                  </Show>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>

    </div>
  );
};
