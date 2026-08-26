import { Component, Show } from "solid-js";
import { Trash2 } from "lucide-solid";
import { repoStore } from "../../../store/repoStore";
import { ResourceStats } from "../../../types/git";

interface DiagnosticsSectionProps {
  stats: ResourceStats | null;
  onSavedToast: () => void;
}

export const DiagnosticsSection: Component<DiagnosticsSectionProps> = (props) => {
  const handleClearCache = () => {
    repoStore.invalidateDiffCache();
    props.onSavedToast();
  };

  return (
    <div class="space-y-6 select-none">
      <div>
        <h3 class="text-sm font-bold text-gray-100 mb-1">
          Diagnostics & Engine Telemetry
        </h3>
        <p class="text-[11.5px] text-gray-400">
          Inspect backend Go runtime memory allocations and performance stats.
        </p>
      </div>

      <Show
        when={props.stats}
        fallback={
          <div class="p-6 text-center text-gray-500 font-mono text-xs">
            Loading diagnostics...
          </div>
        }
      >
        {(s) => (
          <div class="space-y-4">
            {/* Live Metrics Grid */}
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
              <div class="bg-carbon-base border border-carbon-border rounded-xl p-3.5 space-y-1">
                <span class="text-[10px] text-gray-400 font-sans block">
                  Active Heap Memory
                </span>
                <span class="text-base font-extrabold text-git-emerald">
                  {s().allocRamMb.toFixed(1)} MB
                </span>
              </div>

              <div class="bg-carbon-base border border-carbon-border rounded-xl p-3.5 space-y-1">
                <span class="text-[10px] text-gray-400 font-sans block">
                  Total Process RAM
                </span>
                <span class="text-base font-extrabold text-git-cyan">
                  {s().sysRamMb.toFixed(1)} MB
                </span>
              </div>

              <div class="bg-carbon-base border border-carbon-border rounded-xl p-3.5 space-y-1">
                <span class="text-[10px] text-gray-400 font-sans block">
                  Background Goroutines
                </span>
                <span class="text-base font-extrabold text-git-indigo">
                  {s().numGoroutine}
                </span>
              </div>
            </div>

            {/* In-Memory Caches & Actions */}
            <div class="bg-carbon-base border border-carbon-border rounded-xl p-4 space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <span class="font-semibold text-gray-200 block text-xs">
                    In-Memory Diffs & Commits Cache
                  </span>
                  <span class="text-[11px] text-gray-400 block">
                    Fast client-side cache for instantaneous diff and log navigation.
                  </span>
                </div>
                <button
                  onClick={handleClearCache}
                  class="px-3 py-1.5 bg-carbon-elevated hover:bg-carbon-hover border border-carbon-border text-gray-300 hover:text-white rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Trash2 class="w-3.5 h-3.5 text-rose-400" />
                  <span>Purge Diff Cache</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </Show>
    </div>
  );
};
