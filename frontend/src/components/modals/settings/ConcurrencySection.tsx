import { Component } from "solid-js";
import { settingsStore } from "../../../store/settingsStore";

export const ConcurrencySection: Component = () => {
  const settings = () => settingsStore.settings();

  return (
    <div class="space-y-6 select-none">
      <div>
        <h3 class="text-sm font-bold text-gray-100 mb-1">
          Batch Operations & Worker Concurrency
        </h3>
        <p class="text-[11.5px] text-gray-400">
          Configure high-performance parallel Git workers and thread safety safeguards.
        </p>
      </div>

      <div class="space-y-4">
        {/* Worker Pool Size */}
        <div class="bg-carbon-base border border-carbon-border rounded-xl p-4 space-y-3">
          <div class="flex items-center justify-between">
            <span class="font-semibold text-gray-200 text-xs">
              Parallel Worker Pool Concurrency
            </span>
            <span class="font-mono text-xs font-bold text-git-emerald">
              {settings().workerConcurrency} Workers
            </span>
          </div>
          <p class="text-[11px] text-gray-400">
            Number of simultaneous goroutines used during batch fetch, batch pull, and
            workspace scanning. Recommended: 4–8 workers.
          </p>
          <input
            type="range"
            min="1"
            max="16"
            step="1"
            value={settings().workerConcurrency}
            onInput={(e) =>
              settingsStore.updateSetting(
                "workerConcurrency",
                parseInt(e.currentTarget.value, 10),
              )
            }
            class="w-full accent-git-emerald cursor-pointer"
          />
          <div class="flex items-center justify-between text-[10.5px] text-gray-400 font-mono">
            <span>1 (Sequential)</span>
            <span>6 (Balanced Default)</span>
            <span>16 (Maximum Throughput)</span>
          </div>
        </div>

        {/* Skip Dirty Safeguard */}
        <div class="bg-carbon-base border border-carbon-border rounded-xl p-4 space-y-2">
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings().skipDirtyByDefault}
              onChange={(e) =>
                settingsStore.updateSetting(
                  "skipDirtyByDefault",
                  e.currentTarget.checked,
                )
              }
              class="w-4 h-4 rounded border-carbon-border text-git-indigo focus:ring-0 bg-carbon-elevated"
            />
            <div>
              <span class="font-semibold text-gray-200 block text-xs">
                Safely Skip Dirty Repositories in Batch Pull by Default
              </span>
              <span class="text-[11px] text-gray-400 block">
                Prevents accidental merge conflicts or dirty tree overwrites when
                pulling across 50+ repositories at once.
              </span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
