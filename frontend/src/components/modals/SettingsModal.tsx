import { Component, createSignal, onMount, onCleanup, Show } from "solid-js";
import {
  X,
  Settings,
  Sliders,
  Palette,
  Cpu,
  Key,
  HardDrive,
  Check,
} from "lucide-solid";
import { WailsBridge } from "../../services/wailsBridge";
import { settingsStore } from "../../store/settingsStore";
import { ResourceStats } from "../../types/git";
import {
  SettingsSidebar,
  SettingsSection,
  SettingsSectionItem,
} from "./settings/SettingsSidebar";
import { GeneralSection } from "./settings/GeneralSection";
import { AppearanceSection } from "./settings/AppearanceSection";
import { ConcurrencySection } from "./settings/ConcurrencySection";
import { IntegrationsSection } from "./settings/IntegrationsSection";
import { DiagnosticsSection } from "./settings/DiagnosticsSection";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: Component<SettingsModalProps> = (props) => {
  const [activeSection, setActiveSection] =
    createSignal<SettingsSection>("general");
  const [searchQuery, setSearchQuery] = createSignal<string>("");
  const [cliAuth, setCliAuth] = createSignal<{ gh: boolean; glab: boolean }>({
    gh: false,
    glab: false,
  });
  const [stats, setStats] = createSignal<ResourceStats | null>(null);
  const [savedToast, setSavedToast] = createSignal<boolean>(false);

  // Modal Resizing State
  const [modalWidth, setModalWidth] = createSignal<number>(800);
  const [modalHeight, setModalHeight] = createSignal<number>(580);
  const [isResizing, setIsResizing] = createSignal<boolean>(false);
  let resizeStartPos = { x: 0, y: 0, width: 0, height: 0 };

  const settings = () => settingsStore.settings();

  const handleMouseMove = (e: MouseEvent) => {
    if (isResizing()) {
      const deltaX = e.clientX - resizeStartPos.x;
      const deltaY = e.clientY - resizeStartPos.y;
      const newW = Math.max(580, Math.min(1200, resizeStartPos.width + deltaX));
      const newH = Math.max(420, Math.min(900, resizeStartPos.height + deltaY));
      setModalWidth(newW);
      setModalHeight(newH);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  onMount(async () => {
    try {
      const auth = await WailsBridge.checkCLIAuth();
      setCliAuth(auth as { gh: boolean; glab: boolean });
      const currentStats = await WailsBridge.getResourceStats();
      setStats(currentStats);
    } catch {
      // ignore
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  });

  onCleanup(() => {
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  });

  const handleResizeStart = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartPos = {
      x: e.clientX,
      y: e.clientY,
      width: modalWidth(),
      height: modalHeight(),
    };
  };

  const triggerToast = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1500);
  };

  const sectionsList: SettingsSectionItem[] = [
    { id: "general", label: "General & Git", icon: Sliders },
    { id: "appearance", label: "Appearance & Themes", icon: Palette },
    { id: "concurrency", label: "Batch & Concurrency", icon: Cpu },
    { id: "integrations", label: "CLI & Auth", icon: Key },
    { id: "diagnostics", label: "Diagnostics", icon: HardDrive },
  ];

  const filteredSections = () => {
    const q = searchQuery().toLowerCase().trim();
    if (!q) return sectionsList;
    return sectionsList.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        (s.id === "appearance" &&
          (q.includes("theme") ||
            q.includes("color") ||
            q.includes("font") ||
            q.includes("profile") ||
            q.includes("density"))) ||
        (s.id === "general" &&
          (q.includes("fetch") || q.includes("git") || q.includes("interval"))),
    );
  };

  return (
    <Show when={props.isOpen}>
      <div class="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
        <div
          style={{
            width: `${modalWidth()}px`,
            height: `${modalHeight()}px`,
          }}
          class="bg-carbon-surface border border-carbon-border rounded-xl shadow-2xl overflow-hidden flex flex-col relative text-xs transition-shadow"
        >
          {/* Header */}
          <div class="px-4 py-3 bg-carbon-elevated border-b border-carbon-border flex items-center justify-between flex-shrink-0">
            <div class="flex items-center gap-2">
              <Settings class="w-4 h-4 text-git-indigo" />
              <span class="font-semibold text-gray-200 text-sm">
                Settings & Preferences
              </span>
              <span class="text-[11px] px-2 py-0.5 bg-carbon-base border border-carbon-border rounded text-gray-400 font-mono">
                {settings().activeAppearanceProfile}
              </span>
            </div>
            <button
              onClick={props.onClose}
              class="p-1 hover:bg-carbon-hover rounded text-gray-400 hover:text-gray-200 cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          {/* Split Layout: Left Navigation + Right Content */}
          <div class="flex flex-1 overflow-hidden">
            {/* Left Sidebar */}
            <SettingsSidebar
              sections={filteredSections()}
              activeSection={activeSection()}
              onSelectSection={setActiveSection}
              searchQuery={searchQuery()}
              onSearchChange={setSearchQuery}
            />

            {/* Right Content Area */}
            <div class="flex-1 p-6 overflow-y-auto bg-carbon-surface space-y-6">
              <Show when={activeSection() === "general"}>
                <GeneralSection />
              </Show>

              <Show when={activeSection() === "appearance"}>
                <AppearanceSection onSavedToast={triggerToast} />
              </Show>

              <Show when={activeSection() === "concurrency"}>
                <ConcurrencySection />
              </Show>

              <Show when={activeSection() === "integrations"}>
                <IntegrationsSection cliAuth={cliAuth()} />
              </Show>

              <Show when={activeSection() === "diagnostics"}>
                <DiagnosticsSection stats={stats()} onSavedToast={triggerToast} />
              </Show>
            </div>
          </div>

          {/* Bottom Resize Drag Grip Handle */}
          <div
            onMouseDown={handleResizeStart}
            class="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-50 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity"
            title="Drag to resize settings window"
          >
            <div class="w-1.5 h-1.5 border-r-2 border-b-2 border-gray-400" />
          </div>

          {/* Saved Notification Toast */}
          <Show when={savedToast()}>
            <div class="absolute bottom-4 right-4 bg-git-emerald/20 border border-git-emerald/40 text-git-emerald font-semibold px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-1.5 text-xs animate-in fade-in slide-in-from-bottom-2 duration-150 backdrop-blur-md">
              <Check class="w-3.5 h-3.5" />
              <span>Settings applied & saved</span>
            </div>
          </Show>
        </div>
      </div>
    </Show>
  );
};
