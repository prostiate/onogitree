import { Component, createSignal } from 'solid-js';
import { X, ArrowDownToLine, AlertTriangle, CheckCircle2 } from 'lucide-solid';
import { repoStore } from '../../store/repoStore';
import { batchStore } from '../../store/batchStore';

export const PullAllModal: Component = () => {
  const [skipDirty, setSkipDirty] = createSignal<boolean>(true);

  const repos = () => repoStore.repositories();
  const dirtyCount = () => repos().filter((r) => r.isDirty).length;
  const cleanCount = () => repos().length - dirtyCount();

  if (!batchStore.isPullModalOpen()) return null;

  return (
    <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div class="w-full max-w-md bg-carbon-surface border border-carbon-border rounded-lg shadow-2xl overflow-hidden flex flex-col text-xs">
        {/* Header */}
        <div class="px-4 py-3 bg-carbon-elevated border-b border-carbon-border flex items-center justify-between">
          <div class="flex items-center gap-2">
            <ArrowDownToLine class="w-4 h-4 text-git-emerald" />
            <span class="font-semibold text-gray-200 text-sm">Pull All Repositories</span>
          </div>
          <button
            onClick={() => batchStore.setIsPullModalOpen(false)}
            class="p-1 hover:bg-carbon-hover rounded text-gray-400 hover:text-gray-200 cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div class="p-4 space-y-4">
          <p class="text-gray-300">
            You are about to pull latest remote changes for <strong class="text-white">{repos().length} repositories</strong>.
          </p>

          <div class="bg-carbon-base border border-carbon-border rounded p-3 space-y-2">
            <div class="flex items-center justify-between text-gray-300">
              <span class="flex items-center gap-1.5">
                <CheckCircle2 class="w-3.5 h-3.5 text-git-emerald" />
                <span>Clean Repositories:</span>
              </span>
              <strong class="font-mono text-git-emerald">{cleanCount()}</strong>
            </div>

            <div class="flex items-center justify-between text-gray-300">
              <span class="flex items-center gap-1.5">
                <AlertTriangle class="w-3.5 h-3.5 text-git-amber" />
                <span>Repositories with Dirty Changes:</span>
              </span>
              <strong class="font-mono text-git-amber">{dirtyCount()}</strong>
            </div>
          </div>

          <label class="flex items-center gap-2 cursor-pointer text-gray-300">
            <input
              type="checkbox"
              checked={skipDirty()}
              onChange={(e) => setSkipDirty(e.currentTarget.checked)}
              class="rounded border-carbon-border text-git-indigo focus:ring-0 bg-carbon-base"
            />
            <span>Safely skip repositories with uncommitted changes (Recommended)</span>
          </label>
        </div>

        {/* Footer */}
        <div class="px-4 py-3 bg-carbon-elevated border-t border-carbon-border flex items-center justify-end gap-2">
          <button
            onClick={() => batchStore.setIsPullModalOpen(false)}
            class="px-3 py-1.5 bg-carbon-hover hover:bg-carbon-border text-gray-300 rounded font-medium cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => batchStore.runPullAll(skipDirty())}
            class="px-4 py-1.5 bg-git-emerald hover:bg-git-emerald/90 text-gray-950 font-semibold rounded cursor-pointer"
          >
            Start Pull All ({repos().length} repos)
          </button>
        </div>
      </div>
    </div>
  );
};
