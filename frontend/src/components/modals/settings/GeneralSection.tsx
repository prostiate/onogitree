import { Component } from "solid-js";
import { ShieldCheck } from "lucide-solid";
import { settingsStore } from "../../../store/settingsStore";
import { CustomSelect, SelectOption } from "../../common/CustomSelect";

export const GeneralSection: Component = () => {
  const settings = () => settingsStore.settings();

  const autoFetchOptions: SelectOption[] = [
    {
      value: "5m",
      label: "Every 5 minutes",
      description: "Fast auto-discovery for active collaboration teams",
    },
    {
      value: "10m",
      label: "Every 10 minutes (Recommended)",
      description: "Balanced background tracking without disk contention",
    },
    {
      value: "15m",
      label: "Every 15 minutes",
      description: "Lightweight polling for large repositories",
    },
    {
      value: "30m",
      label: "Every 30 minutes",
      description: "Minimal network and battery consumption",
    },
    {
      value: "disabled",
      label: "Disabled",
      description: "Manual refresh only (no background fetch)",
    },
  ];

  return (
    <div class="space-y-6 select-none">
      <div>
        <h3 class="text-sm font-bold text-gray-100 mb-1">
          General & Git Operations
        </h3>
        <p class="text-[11.5px] text-gray-400">
          Configure background Git polling behavior and command runner defaults.
        </p>
      </div>

      <div class="space-y-4">
        {/* Background Auto-Fetch Interval */}
        <div class="bg-carbon-base border border-carbon-border rounded-xl p-4 space-y-2">
          <label class="block font-semibold text-gray-200">
            Background Auto-Fetch Interval
          </label>
          <p class="text-[11px] text-gray-400">
            Controls how frequently OnoGitTree quietly runs{" "}
            <code class="text-git-indigo">git fetch --prune</code> across all
            tracked repositories in your workspace.
          </p>
          <div class="pt-1 max-w-sm">
            <CustomSelect
              value={settings().autoFetchInterval}
              options={autoFetchOptions}
              onChange={(val) =>
                settingsStore.updateSetting("autoFetchInterval", val)
              }
            />
          </div>
        </div>

        {/* Binary Engine Info */}
        <div class="bg-carbon-base border border-carbon-border rounded-xl p-4 flex items-center justify-between">
          <div>
            <span class="font-semibold text-gray-200 block">
              Git Executable Engine
            </span>
            <span class="text-[11px] text-gray-400 font-mono">
              /usr/bin/git (System PATH)
            </span>
          </div>
          <span class="flex items-center gap-1 text-[11px] text-git-emerald font-semibold bg-git-emerald/10 border border-git-emerald/30 px-2.5 py-1 rounded-full">
            <ShieldCheck class="w-3.5 h-3.5" />
            <span>Operational</span>
          </span>
        </div>
      </div>
    </div>
  );
};
