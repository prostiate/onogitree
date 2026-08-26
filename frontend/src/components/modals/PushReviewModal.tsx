import { Component, createSignal, For, Show } from 'solid-js';
import { X, ArrowUpFromLine, GitBranch, Check, AlertCircle } from 'lucide-solid';
import { repoStore } from '../../store/repoStore';
import { batchStore } from '../../store/batchStore';

export const PushReviewModal: Component = () => {
  const aheadRepos = () => repoStore.repositories().filter((r) => r.aheadCount > 0);
  const [selectedToPush, setSelectedToPush] = createSignal<Set<string>>(new Set());

  // Initialize selected when opened
  const initSelection = () => {
    const s = new Set<string>();
    for (const r of aheadRepos()) {
      s.add(r.id);
    }
    setSelectedToPush(s);
  };

  if (!batchStore.isPushModalOpen()) return null;
  initSelection();

  const handleToggle = (id: string) => {
    const s = new Set(selectedToPush());
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setSelectedToPush(s);
  };

  return (
    <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div class="w-full max-w-lg bg-carbon-surface border border-carbon-border rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh] text-xs">
        {/* Header */}
        <div class="px-4 py-3 bg-carbon-elevated border-b border-carbon-border flex items-center justify-between">
          <div class="flex items-center gap-2">
            <ArrowUpFromLine class="w-4 h-4 text-git-indigo" />
            <span class="font-semibold text-gray-200 text-sm">Batch Push Review (Zero Blind Pushes)</span>
          </div>
          <button
            onClick={() => batchStore.setIsPushModalOpen(false)}
            class="p-1 hover:bg-carbon-hover rounded text-gray-400 hover:text-gray-200 cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div class="p-4 space-y-3 flex-1 overflow-y-auto">
          <Show
            when={aheadRepos().length > 0}
            fallback={
              <div class="py-8 text-center text-gray-400 flex flex-col items-center gap-2">
                <Check class="w-8 h-8 text-git-emerald opacity-60" />
                <p>All repositories are up to date with remote tracking branches. No unpushed commits.</p>
              </div>
            }
          >
            <p class="text-gray-300">
              The following repositories have unpushed commits. Review and confirm which repositories to push:
            </p>

            <div class="border border-carbon-border rounded divide-y divide-carbon-border bg-carbon-base">
              <For each={aheadRepos()}>
                {(repo) => {
                  const isChecked = () => selectedToPush().has(repo.id);
                  return (
                    <div
                      onClick={() => handleToggle(repo.id)}
                      class="px-3 py-2 hover:bg-carbon-hover flex items-center justify-between cursor-pointer"
                    >
                      <div class="flex items-center gap-2.5">
                        <div
                          class={`w-4 h-4 rounded border flex items-center justify-center ${
                            isChecked()
                              ? 'bg-git-indigo border-git-indigo text-white'
                              : 'border-carbon-border bg-carbon-surface'
                          }`}
                        >
                          <Show when={isChecked()}>
                            <Check class="w-3 h-3 stroke-[3]" />
                          </Show>
                        </div>

                        <div>
                          <span class="font-medium text-gray-200">{repo.name}</span>
                          <div class="flex items-center gap-1.5 text-[11px] text-gray-400 font-mono mt-0.5">
                            <GitBranch class="w-3 h-3 text-git-indigo" />
                            <span>{repo.currentBranch}</span>
                          </div>
                        </div>
                      </div>

                      <span class="px-2 py-0.5 bg-git-emerald/20 border border-git-emerald/40 text-git-emerald rounded font-mono font-bold text-[11px] tabular-nums">
                        +{repo.aheadCount} commits
                      </span>
                    </div>
                  );
                }}
              </For>
            </div>

            <div class="flex items-center gap-2 text-gray-500 text-[11px] bg-carbon-base p-2.5 rounded border border-carbon-border">
              <AlertCircle class="w-4 h-4 text-git-amber flex-shrink-0" />
              <span>Force push is strictly disabled in batch mode to protect remote history.</span>
            </div>
          </Show>
        </div>

        {/* Footer */}
        <div class="px-4 py-3 bg-carbon-elevated border-t border-carbon-border flex items-center justify-end gap-2">
          <button
            onClick={() => batchStore.setIsPushModalOpen(false)}
            class="px-3 py-1.5 bg-carbon-hover hover:bg-carbon-border text-gray-300 rounded font-medium cursor-pointer"
          >
            Cancel
          </button>
          <Show when={aheadRepos().length > 0}>
            <button
              onClick={() => {
                // Execute push for selected
                batchStore.setIsPushModalOpen(false);
              }}
              disabled={selectedToPush().size === 0}
              class="px-4 py-1.5 bg-git-indigo hover:bg-git-indigo/90 disabled:opacity-40 text-white font-semibold rounded cursor-pointer"
            >
              Push ({selectedToPush().size} Repositories)
            </button>
          </Show>
        </div>
      </div>
    </div>
  );
};
