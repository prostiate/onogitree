import { Component, createSignal, For, Show } from "solid-js";
import {
  Monitor,
  Moon,
  Sparkles,
  Sun,
  Paintbrush,
  Check,
  Type,
  Plus,
  Trash2,
} from "lucide-solid";
import {
  settingsStore,
  ThemeMode,
  AccentColor,
  FontFamily,
} from "../../../store/settingsStore";

interface AppearanceSectionProps {
  onSavedToast: () => void;
}

export const AppearanceSection: Component<AppearanceSectionProps> = (props) => {
  const [newProfileName, setNewProfileName] = createSignal<string>("");

  const settings = () => settingsStore.settings();
  const profiles = () => settingsStore.profiles();

  const themeOptions: {
    value: ThemeMode;
    label: string;
    icon: Component<{ class?: string }>;
    desc: string;
  }[] = [
    {
      value: "system",
      label: "System Default",
      icon: Monitor,
      desc: "Sync with OS light/dark appearance",
    },
    {
      value: "dark",
      label: "Deep Carbon Dark",
      icon: Moon,
      desc: "High-contrast #0F1117 dark palette",
    },
    {
      value: "oled",
      label: "OLED Pure Black",
      icon: Sparkles,
      desc: "True #000000 black for contrast",
    },
    {
      value: "light",
      label: "Clean Light",
      icon: Sun,
      desc: "Crisp slate workspace for daylight",
    },
    {
      value: "custom",
      label: "Custom Palette",
      icon: Paintbrush,
      desc: "Manually customize background & surface",
    },
  ];

  const accentOptions: {
    value: AccentColor;
    label: string;
    colorClass: string;
  }[] = [
    { value: "indigo", label: "Indigo Core", colorClass: "bg-[#6366F1]" },
    { value: "emerald", label: "Emerald Mint", colorClass: "bg-[#10B981]" },
    { value: "cyan", label: "Electric Cyan", colorClass: "bg-[#06B6D4]" },
    { value: "purple", label: "Cyber Purple", colorClass: "bg-[#A855F7]" },
    { value: "amber", label: "Solar Amber", colorClass: "bg-[#F59E0B]" },
  ];

  const fontOptions: { value: FontFamily; label: string; preview: string }[] = [
    { value: "Inter", label: "Inter (UI Sans)", preview: "Aa Bb Gg 123" },
    {
      value: "JetBrains Mono",
      label: "JetBrains Mono",
      preview: "fn main() => 123",
    },
    { value: "Fira Code", label: "Fira Code", preview: "0xDEADBEEF !== null" },
    {
      value: "Ubuntu Mono",
      label: "Ubuntu Mono",
      preview: "git log --oneline",
    },
    {
      value: "Cascadia Code",
      label: "Cascadia Code",
      preview: "const v = [1, 2, 3]",
    },
    { value: "Hack", label: "Hack Mono", preview: "struct Node { id: u64 }" },
    {
      value: "system-ui",
      label: "System UI Default",
      preview: "Ubuntu Roboto Sans",
    },
    {
      value: "custom",
      label: "Custom Installed Font...",
      preview: "Specify system font family",
    },
  ];

  const handleSaveProfile = () => {
    const name = newProfileName().trim();
    if (!name) return;
    settingsStore.saveAppearanceProfile(name);
    setNewProfileName("");
    props.onSavedToast();
  };

  return (
    <div class="space-y-6 select-none">
      <div>
        <h3 class="text-sm font-bold text-gray-100 mb-1">
          Appearance, Themes & Typography
        </h3>
        <p class="text-[11.5px] text-gray-400">
          Personalize colors, contrast, font families, and UI density.
        </p>
      </div>

      {/* 1. Theme Presets Grid */}
      <div class="space-y-3">
        <label class="font-semibold text-gray-200 block text-xs">
          Theme Preset
        </label>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          <For each={themeOptions}>
            {(theme) => {
              const Icon = theme.icon;
              const isSelected = () => settings().themeMode === theme.value;
              return (
                <button
                  type="button"
                  onClick={() => {
                    settingsStore.updateSetting("themeMode", theme.value);
                    props.onSavedToast();
                  }}
                  class={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    isSelected()
                      ? "bg-git-indigo/15 border-git-indigo text-white shadow-md ring-1 ring-git-indigo"
                      : "bg-carbon-base border-carbon-border text-gray-300 hover:bg-carbon-elevated hover:border-gray-600"
                  }`}
                >
                  <div class="flex items-center justify-between mb-2">
                    <Icon class="w-4 h-4 text-git-indigo" />
                    <Show when={isSelected()}>
                      <Check class="w-3.5 h-3.5 text-git-indigo" />
                    </Show>
                  </div>
                  <div>
                    <span class="font-bold text-xs block">{theme.label}</span>
                    <span class="text-[10.5px] text-gray-400 leading-tight block mt-0.5">
                      {theme.desc}
                    </span>
                  </div>
                </button>
              );
            }}
          </For>
        </div>
      </div>

      {/* Custom Theme Color Inputs */}
      <Show when={settings().themeMode === "custom"}>
        <div class="bg-carbon-base border border-carbon-border rounded-xl p-4 space-y-3 animate-in fade-in duration-150">
          <span class="font-semibold text-gray-200 text-xs block">
            Custom Hex Background & Surface
          </span>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-[11px] text-gray-400 block mb-1">
                Background Hex (#0F1117)
              </label>
              <input
                type="text"
                value={settings().customBgHex || "#0F1117"}
                onInput={(e) =>
                  settingsStore.updateSetting(
                    "customBgHex",
                    e.currentTarget.value,
                  )
                }
                class="w-full px-2.5 py-1 bg-carbon-elevated border border-carbon-border rounded text-gray-200 font-mono text-xs focus:outline-none focus:border-git-indigo"
              />
            </div>
            <div>
              <label class="text-[11px] text-gray-400 block mb-1">
                Surface Hex (#161922)
              </label>
              <input
                type="text"
                value={settings().customSurfaceHex || "#161922"}
                onInput={(e) =>
                  settingsStore.updateSetting(
                    "customSurfaceHex",
                    e.currentTarget.value,
                  )
                }
                class="w-full px-2.5 py-1 bg-carbon-elevated border border-carbon-border rounded text-gray-200 font-mono text-xs focus:outline-none focus:border-git-indigo"
              />
            </div>
          </div>
        </div>
      </Show>

      {/* 2. Accent Color */}
      <div class="space-y-3">
        <label class="font-semibold text-gray-200 block text-xs">
          Accent Color
        </label>
        <div class="flex items-center gap-2.5 flex-wrap">
          <For each={accentOptions}>
            {(acc) => {
              const isSelected = () => settings().accentColor === acc.value;
              return (
                <button
                  type="button"
                  onClick={() => {
                    settingsStore.updateSetting("accentColor", acc.value);
                    props.onSavedToast();
                  }}
                  class={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    isSelected()
                      ? "bg-carbon-elevated border-git-indigo text-white shadow-sm font-semibold"
                      : "bg-carbon-base border-carbon-border text-gray-300 hover:bg-carbon-elevated"
                  }`}
                >
                  <span
                    class={`w-3 h-3 rounded-full ${acc.colorClass} flex-shrink-0 shadow-sm`}
                  />
                  <span>{acc.label}</span>
                </button>
              );
            }}
          </For>
        </div>
      </div>

      {/* 3. Typography & Font Family */}
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <label class="font-semibold text-gray-200 block text-xs flex items-center gap-1.5">
            <Type class="w-3.5 h-3.5 text-git-indigo" />
            <span>Workspace Typography</span>
          </label>
          <span class="text-[11px] text-gray-400 font-mono">
            Active: {settings().fontFamily}
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          <For each={fontOptions}>
            {(font) => {
              const isSelected = () => settings().fontFamily === font.value;
              return (
                <button
                  type="button"
                  onClick={() => {
                    settingsStore.updateSetting("fontFamily", font.value);
                    props.onSavedToast();
                  }}
                  class={`p-2.5 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected()
                      ? "bg-git-indigo/15 border-git-indigo text-white shadow-sm"
                      : "bg-carbon-base border-carbon-border text-gray-300 hover:bg-carbon-elevated"
                  }`}
                >
                  <span class="font-bold text-xs block truncate">
                    {font.label}
                  </span>
                  <span class="text-[10px] text-gray-400 font-mono mt-1 opacity-70 truncate block">
                    {font.preview}
                  </span>
                </button>
              );
            }}
          </For>
        </div>

        {/* Custom Font Name Field */}
        <Show when={settings().fontFamily === "custom"}>
          <div class="bg-carbon-base border border-carbon-border rounded-xl p-3 space-y-1.5">
            <label class="text-[11px] text-gray-300 font-semibold block">
              Installed System Font Family Name
            </label>
            <input
              type="text"
              placeholder="e.g. Monaco, SF Mono, Comic Mono..."
              value={settings().customFontName || ""}
              onInput={(e) =>
                settingsStore.updateSetting(
                  "customFontName",
                  e.currentTarget.value,
                )
              }
              class="w-full px-2.5 py-1.5 bg-carbon-elevated border border-carbon-border rounded text-gray-200 font-mono text-xs focus:outline-none focus:border-git-indigo"
            />
          </div>
        </Show>
      </div>

      {/* 4. Density & Base Font Scaling */}
      <div class="bg-carbon-base border border-carbon-border rounded-xl p-4 space-y-3">
        <div class="flex items-center justify-between">
          <span class="font-semibold text-gray-200 text-xs">
            UI Density & Font Size
          </span>
          <span class="font-mono text-xs font-bold text-git-indigo">
            {settings().densityPx}px (Base)
          </span>
        </div>
        <input
          type="range"
          min="10"
          max="16"
          step="1"
          value={settings().densityPx}
          onInput={(e) =>
            settingsStore.updateSetting(
              "densityPx",
              parseInt(e.currentTarget.value, 10),
            )
          }
          class="w-full accent-git-indigo cursor-pointer"
        />
        <div class="flex items-center justify-between text-[10.5px] text-gray-400 font-mono">
          <span>Compact (10px)</span>
          <span>Standard (12px)</span>
          <span>Comfortable (16px)</span>
        </div>
      </div>

      {/* 5. Appearance Profiles Manager */}
      <div class="bg-carbon-base border border-carbon-border rounded-xl p-4 space-y-3">
        <div class="flex items-center justify-between">
          <span class="font-semibold text-gray-200 text-xs">
            Saved Appearance Profiles
          </span>
          <span class="text-[11px] text-gray-400">
            {Object.keys(profiles()).length} Profiles
          </span>
        </div>

        <div class="flex flex-wrap gap-2">
          <For each={Object.keys(profiles())}>
            {(pName) => {
              const isSelected = () =>
                settings().activeAppearanceProfile === pName;
              return (
                <div
                  class={`flex items-center rounded-lg border text-xs overflow-hidden ${
                    isSelected()
                      ? "bg-git-indigo/20 border-git-indigo text-white font-bold"
                      : "bg-carbon-elevated border-carbon-border text-gray-300"
                  }`}
                >
                  <button
                    onClick={() => {
                      settingsStore.loadAppearanceProfile(pName);
                      props.onSavedToast();
                    }}
                    class="px-2.5 py-1 hover:text-white cursor-pointer"
                  >
                    {pName}
                  </button>
                  <Show when={pName !== "Default Dark"}>
                    <button
                      onClick={() =>
                        settingsStore.deleteAppearanceProfile(pName)
                      }
                      class="px-1.5 py-1 text-gray-500 hover:text-rose-400 hover:bg-rose-500/20 cursor-pointer transition-colors"
                      title="Delete profile"
                    >
                      <Trash2 class="w-3 h-3" />
                    </button>
                  </Show>
                </div>
              );
            }}
          </For>
        </div>

        {/* Save Current as New Profile */}
        <div class="flex gap-2 pt-2 border-t border-carbon-border/50">
          <input
            type="text"
            placeholder="Save current setup as profile name..."
            value={newProfileName()}
            onInput={(e) => setNewProfileName(e.currentTarget.value)}
            class="flex-1 px-2.5 py-1 bg-carbon-elevated border border-carbon-border rounded text-gray-200 text-xs focus:outline-none focus:border-git-indigo font-mono placeholder-gray-500"
          />
          <button
            onClick={handleSaveProfile}
            disabled={!newProfileName().trim()}
            class="px-3 py-1 bg-git-indigo hover:bg-git-indigo/90 disabled:opacity-40 text-white font-semibold rounded text-xs flex items-center gap-1 cursor-pointer"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>Save Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};
