import { Component, For } from "solid-js";
import { Search } from "lucide-solid";
import { settingsStore } from "../../../store/settingsStore";

export type SettingsSection =
  | "general"
  | "appearance"
  | "concurrency"
  | "integrations"
  | "diagnostics";

export interface SettingsSectionItem {
  id: SettingsSection;
  label: string;
  icon: Component<{ class?: string }>;
}

interface SettingsSidebarProps {
  sections: SettingsSectionItem[];
  activeSection: SettingsSection;
  onSelectSection: (section: SettingsSection) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const SettingsSidebar: Component<SettingsSidebarProps> = (props) => {
  const settings = () => settingsStore.settings();

  return (
    <div class="w-56 bg-carbon-base border-r border-carbon-border flex flex-col flex-shrink-0 select-none">
      {/* Settings Search Bar */}
      <div class="p-2.5 border-b border-carbon-border">
        <div class="relative flex items-center">
          <Search class="w-3.5 h-3.5 text-gray-400 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search settings..."
            value={props.searchQuery}
            onInput={(e) => props.onSearchChange(e.currentTarget.value)}
            class="w-full pl-8 pr-2.5 py-1.5 bg-carbon-elevated border border-carbon-border rounded text-gray-200 text-xs focus:outline-none focus:border-git-indigo font-mono placeholder-gray-500"
          />
        </div>
      </div>

      {/* Category List */}
      <div class="p-2 space-y-1 overflow-y-auto flex-1">
        <For each={props.sections}>
          {(sec) => {
            const Icon = sec.icon;
            const isActive = () => props.activeSection === sec.id;
            return (
              <button
                onClick={() => props.onSelectSection(sec.id)}
                class={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors text-left cursor-pointer ${
                  isActive()
                    ? "bg-git-indigo/15 text-git-indigo font-semibold border-l-2 border-git-indigo"
                    : "text-gray-400 hover:text-gray-200 hover:bg-carbon-hover border-l-2 border-transparent"
                }`}
              >
                <Icon class="w-4 h-4 flex-shrink-0" />
                <span>{sec.label}</span>
              </button>
            );
          }}
        </For>
      </div>

      {/* Profile Pill bottom */}
      <div class="p-2.5 border-t border-carbon-border bg-carbon-surface/60 text-[11px] text-gray-400 flex items-center justify-between">
        <span>Theme:</span>
        <span class="font-semibold text-gray-300 font-mono truncate max-w-[110px]">
          {settings().activeAppearanceProfile}
        </span>
      </div>
    </div>
  );
};
