import { Component, createSignal, createEffect, createMemo, For, Show } from "solid-js";
import {
  X,
  ArrowUpFromLine,
  GitBranch,
  Check,
  AlertCircle,
  RefreshCw,
  AlertTriangle,
} from "lucide-solid";
import { repoStore } from "../../store/repoStore";
import { batchStore } from "../../store/batchStore";

export const PushReviewModal: Component = () => {
  const aheadRepos = createMemo(() =>
    repoStore.repositories().filter((r) => r.aheadCount > 0),
  );
  const [selectedToPush, setSelectedToPush] = createSignal<Set<string>>(
    new Set(),
  );
  const [isPushing, setIsPushing] = createSignal(false);
  const [pushError, setPushError] = createSignal<string | null>(null);

  createEffect(() => {
    if (batchStore.isPushModalOpen()) {
      const s = new Set<string>();
      for (const r of aheadRepos()) {
        s.add(r.id);
      }
      setSelectedToPush(s);
      setPushError(null);
      setIsPushing(false);
    }
  });

  const handleToggle = (id: string) => {
    if (isPushing()) return;
    const s = new Set(selectedToPush());
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setSelectedToPush(s);
  };

  const handlePushSelected = async () => {
    setIsPushing(true);
    setPushError(null);

    const reposToPush = aheadRepos().filter((r) => selectedToPush().has(r.id));

    const errors: string[] = [];
    for (const repo of reposToPush) {
      try {
        await repoStore.pushRepo(repo.path);
      } catch (err: any) {
        errors.push(`${repo.name}: ${err?.message || "Push failed"}`);
      }
    }

    setIsPushing(false);
    if (errors.length > 0) {
      setPushError(errors.join("\n"));
    } else {
      batchStore.setIsPushModalOpen(false);
    }
  };

  return (
    <Show when={batchStore.isPushModalOpen()}>
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
        <div class="w-full max-w-lg bg-carbon-surface border border-carbon-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] text-xs">
          {/* Header */}
          <div class="px-5 py-3.5 bg-carbon-elevated border-b border-carbon-border flex items-center justify-between">
            <div class="flex items-center gap-2">
              <ArrowUpFromLine class="w-4 h-4 text-git-indigo" />
              <span class="font-bold text-gray-200 text-sm">
                Batch Push Review (Zero Blind Pushes)
              </span>
            </div>
            <button
              onClick={() => {
                if (!isPushing()) batchStore.setIsPushModalOpen(false);
              }}
              disabled={isPushing()}
              class="p-1 hover:bg-carbon-hover rounded-lg text-gray-400 hover:text-gray-200 cursor-pointer disabled:opacity-40 transition-colors"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div class="p-5 space-y-3.5 flex-1 overflow-y-auto">
            <Show when={pushError()}>
              <div class="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 flex items-start gap-2.5">
                <AlertTriangle class="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <pre class="font-mono text-[11px] whitespace-pre-wrap flex-1 break-all">
                  {pushError()}
                </pre>
              </div>
            </Show>

            <Show
              when={aheadRepos().length > 0}
              fallback={
                <div class="py-8 text-center text-gray-400 flex flex-col items-center gap-2">
                  <Check class="w-8 h-8 text-git-emerald opacity-60" />
                  <p>
                    All repositories are up to date with remote tracking
                    branches. No unpushed commits.
                  </p>
                </div>
              }
            >
              <p class="text-gray-300">
                The following repositories have unpushed commits. Review and
                confirm which repositories to push:
              </p>

              <div class="border border-carbon-border rounded-xl divide-y divide-carbon-border bg-carbon-base overflow-hidden">
                <For each={aheadRepos()}>
                  {(repo) => {
                    const isChecked = () => selectedToPush().has(repo.id);
                    return (
                      <div
                        onClick={() => handleToggle(repo.id)}
                        class="px-3.5 py-2.5 hover:bg-carbon-hover flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div class="flex items-center gap-3">
                          <div
                            class={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                              isChecked()
                                ? "bg-git-indigo border-git-indigo text-white"
                                : "border-carbon-border bg-carbon-surface"
                            }`}
                          >
                            <Show when={isChecked()}>
                              <Check class="w-3 h-3 stroke-[3]" />
                            </Show>
                          </div>

                          <div>
                            <span class="font-semibold text-gray-200">
                              {repo.name}
                            </span>
                            <div class="flex items-center gap-1.5 text-[11px] text-gray-400 font-mono mt-0.5">
                              <GitBranch class="w-3 h-3 text-git-indigo" />
                              <span>{repo.currentBranch}</span>
                            </div>
                          </div>
                        </div>

                        <span class="px-2.5 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-full font-mono font-bold text-[11px] tabular-nums">
                          +{repo.aheadCount} commits
                        </span>
                      </div>
                    );
                  }}
                </For>
              </div>

              <div class="flex items-center gap-2 text-gray-400 text-[11px] bg-carbon-base p-2.5 rounded-xl border border-carbon-border">
                <AlertCircle class="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>
                  Force push is strictly disabled in batch mode to protect
                  remote history.
                </span>
              </div>
            </Show>
          </div>

          {/* Footer */}
          <div class="px-5 py-3.5 bg-carbon-elevated border-t border-carbon-border flex items-center justify-end gap-2.5">
            <button
              onClick={() => batchStore.setIsPushModalOpen(false)}
              disabled={isPushing()}
              class="px-3.5 py-1.5 bg-carbon-surface hover:bg-carbon-hover border border-carbon-border text-gray-300 hover:text-white rounded-lg font-medium cursor-pointer transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <Show when={aheadRepos().length > 0}>
              <button
                onClick={handlePushSelected}
                disabled={selectedToPush().size === 0 || isPushing()}
                class="px-4 py-1.5 bg-git-indigo hover:bg-git-indigo/90 disabled:opacity-40 text-white font-semibold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Show when={isPushing()}>
                  <RefreshCw class="w-3.5 h-3.5 animate-spin" />
                </Show>
                <span>
                  {isPushing()
                    ? "Pushing..."
                    : `Push (${selectedToPush().size} Repositor${selectedToPush().size === 1 ? "y" : "ies"})`}
                </span>
              </button>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  );
};
