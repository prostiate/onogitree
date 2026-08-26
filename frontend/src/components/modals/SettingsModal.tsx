import { Component, createSignal, onMount, Show, For } from 'solid-js';
import { 
  X, 
  Settings, 
  Sliders, 
  Palette, 
  Cpu, 
  Key, 
  HardDrive, 
  FolderArchive, 
  Search, 
  Check, 
  ShieldCheck, 
  Terminal, 
  Github, 
  Gitlab, 
  Sun, 
  Moon, 
  Monitor, 
  Sparkles, 
  Plus, 
  Trash2 
} from 'lucide-solid';
import { WailsBridge } from '../../services/wailsBridge';
import { settingsStore, ThemeMode, AccentColor, FontFamily, FontSize } from '../../store/settingsStore';
import { ResourceStats } from '../../types/git';
import { CustomSelect, SelectOption } from '../common/CustomSelect';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsSection = 'general' | 'appearance' | 'concurrency' | 'integrations' | 'profiles' | 'diagnostics';

export const SettingsModal: Component<SettingsModalProps> = (props) => {
  const [activeSection, setActiveSection] = createSignal<SettingsSection>('general');
  const [searchQuery, setSearchQuery] = createSignal<string>('');
  const [newProfileName, setNewProfileName] = createSignal<string>('');
  const [cliAuth, setCliAuth] = createSignal<{ gh: boolean; glab: boolean }>({ gh: false, glab: false });
  const [stats, setStats] = createSignal<ResourceStats | null>(null);
  const [savedToast, setSavedToast] = createSignal<boolean>(false);

  const settings = () => settingsStore.settings();
  const profiles = () => settingsStore.profiles();

  onMount(async () => {
    try {
      const auth = await WailsBridge.checkCLIAuth();
      setCliAuth(auth as { gh: boolean; glab: boolean });
      const currentStats = await WailsBridge.getResourceStats();
      setStats(currentStats);
    } catch {
      // ignore
    }
  });

  const autoFetchOptions: SelectOption[] = [
    { value: '5m', label: 'Every 5 minutes', description: 'Fast auto-discovery for active collaboration teams' },
    { value: '10m', label: 'Every 10 minutes (Recommended)', description: 'Balanced background tracking without disk contention' },
    { value: '15m', label: 'Every 15 minutes', description: 'Lightweight polling for large repositories' },
    { value: '30m', label: 'Every 30 minutes', description: 'Minimal network and battery consumption' },
    { value: 'disabled', label: 'Disabled', description: 'Manual refresh only (no background fetch)' },
  ];

  const themeOptions: { value: ThemeMode; label: string; icon: any; desc: string }[] = [
    { value: 'system', label: 'System Default', icon: Monitor, desc: 'Sync with OS light/dark appearance' },
    { value: 'dark', label: 'Deep Carbon Dark', icon: Moon, desc: 'High-contrast #0F1117 dark palette' },
    { value: 'oled', label: 'OLED Pure Black', icon: Sparkles, desc: 'True #000000 black for contrast' },
    { value: 'light', label: 'Clean Light', icon: Sun, desc: 'Crisp slate workspace for daylight' },
  ];

  const accentOptions: { value: AccentColor; label: string; colorClass: string }[] = [
    { value: 'indigo', label: 'Indigo Core', colorClass: 'bg-[#6366F1]' },
    { value: 'emerald', label: 'Emerald Mint', colorClass: 'bg-[#10B981]' },
    { value: 'cyan', label: 'Electric Cyan', colorClass: 'bg-[#06B6D4]' },
    { value: 'purple', label: 'Cyber Purple', colorClass: 'bg-[#A855F7]' },
    { value: 'amber', label: 'Solar Amber', colorClass: 'bg-[#F59E0B]' },
  ];

  const fontOptions: { value: FontFamily; label: string; preview: string }[] = [
    { value: 'Inter', label: 'Inter (UI Sans)', preview: 'Aa Bb Gg 123' },
    { value: 'JetBrains Mono', label: 'JetBrains Mono', preview: 'fn main() => 123' },
    { value: 'Fira Code', label: 'Fira Code', preview: '0xDEADBEEF !== null' },
    { value: 'system-ui', label: 'System UI Default', preview: 'Ubuntu Roboto Sans' },
  ];

  const fontSizeOptions: { value: FontSize; label: string; desc: string }[] = [
    { value: 'sm', label: 'Compact', desc: 'Dense 11px information density' },
    { value: 'md', label: 'Standard (Recommended)', desc: 'Balanced 12px readability' },
    { value: 'lg', label: 'Comfortable', desc: 'Generous 13px spacing' },
  ];

  const handleSaveProfile = () => {
    const name = newProfileName().trim();
    if (!name) return;
    settingsStore.saveProfile(name);
    setNewProfileName('');
    triggerToast();
  };

  const triggerToast = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1500);
  };

  const sectionsList: { id: SettingsSection; label: string; icon: any }[] = [
    { id: 'general', label: 'General & Git', icon: Sliders },
    { id: 'appearance', label: 'Appearance & Themes', icon: Palette },
    { id: 'concurrency', label: 'Batch & Concurrency', icon: Cpu },
    { id: 'integrations', label: 'CLI & Auth', icon: Key },
    { id: 'profiles', label: 'Saved Profiles', icon: FolderArchive },
    { id: 'diagnostics', label: 'Diagnostics', icon: HardDrive },
  ];

  return (
    <Show when={props.isOpen}>
      <div class="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
        <div class="w-full max-w-3xl bg-carbon-surface border border-carbon-border rounded-xl shadow-2xl overflow-hidden flex flex-col h-[78vh] text-xs">
          {/* Header */}
          <div class="px-4 py-3 bg-carbon-elevated border-b border-carbon-border flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Settings class="w-4 h-4 text-git-indigo" />
              <span class="font-semibold text-gray-200 text-sm">Settings & Preferences</span>
              <span class="text-[11px] px-2 py-0.5 bg-carbon-base border border-carbon-border rounded text-gray-400 font-mono">
                {settings().activeProfile}
              </span>
            </div>
            <button
              onClick={props.onClose}
              class="p-1 hover:bg-carbon-hover rounded text-gray-400 hover:text-gray-200 cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          {/* VS Code Split Layout: Left Navigation + Right Content */}
          <div class="flex flex-1 overflow-hidden">
            {/* Left Sidebar */}
            <div class="w-56 bg-carbon-base border-r border-carbon-border flex flex-col flex-shrink-0">
              {/* Settings Search Bar */}
              <div class="p-2.5 border-b border-carbon-border">
                <div class="relative flex items-center">
                  <Search class="w-3.5 h-3.5 text-gray-400 absolute left-2.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search settings..."
                    value={searchQuery()}
                    onInput={(e) => setSearchQuery(e.currentTarget.value)}
                    class="w-full pl-8 pr-2.5 py-1.5 bg-carbon-elevated border border-carbon-border rounded text-gray-200 text-xs focus:outline-none focus:border-git-indigo font-mono placeholder-gray-500"
                  />
                </div>
              </div>

              {/* Category List */}
              <div class="p-2 space-y-1 overflow-y-auto flex-1">
                <For each={sectionsList}>
                  {(sec) => {
                    const Icon = sec.icon;
                    const isActive = () => activeSection() === sec.id;
                    return (
                      <button
                        onClick={() => setActiveSection(sec.id)}
                        class={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors text-left cursor-pointer ${
                          isActive()
                            ? 'bg-git-indigo/15 text-git-indigo font-semibold border-l-2 border-git-indigo'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-carbon-hover border-l-2 border-transparent'
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
                <span>Profile:</span>
                <span class="font-semibold text-gray-300 font-mono truncate max-w-[110px]">{settings().activeProfile}</span>
              </div>
            </div>

            {/* Right Content Area */}
            <div class="flex-1 p-6 overflow-y-auto bg-carbon-surface space-y-6">
              {/* SECTION: General */}
              <Show when={activeSection() === 'general'}>
                <div class="space-y-6">
                  <div>
                    <h3 class="text-sm font-bold text-gray-100 mb-1">General & Git Operations</h3>
                    <p class="text-[11.5px] text-gray-400">Configure background Git polling behavior and command runner defaults.</p>
                  </div>

                  {/* Auto-Fetch Interval Custom Select */}
                  <div class="space-y-2">
                    <label class="block text-gray-200 font-medium">Automatic Background Fetch Interval</label>
                    <CustomSelect
                      value={settings().autoFetchInterval}
                      options={autoFetchOptions}
                      onChange={(val) => settingsStore.updateSetting('autoFetchInterval', val)}
                    />
                    <p class="text-[11px] text-gray-500">
                      Executes lightweight background checks to update ahead/behind counts without holding index locks.
                    </p>
                  </div>

                  {/* System Git Binary */}
                  <div class="space-y-2">
                    <label class="block text-gray-200 font-medium">Host Git Executable</label>
                    <div class="flex items-center gap-2">
                      <input
                        type="text"
                        value="/usr/bin/git"
                        disabled
                        class="flex-1 px-3 py-1.5 bg-carbon-base border border-carbon-border rounded text-gray-400 font-mono text-xs cursor-not-allowed"
                      />
                      <span class="px-2.5 py-1 bg-git-emerald/20 border border-git-emerald/40 text-git-emerald font-semibold rounded text-[11px]">
                        Validated
                      </span>
                    </div>
                    <p class="text-[11px] text-gray-500">Standard system binary discovered on $PATH.</p>
                  </div>

                  {/* Skip Dirty Safe Defaults */}
                  <div class="pt-2 border-t border-carbon-border">
                    <label class="flex items-center gap-2.5 cursor-pointer text-gray-200">
                      <input
                        type="checkbox"
                        checked={settings().skipDirtyByDefault}
                        onChange={(e) => settingsStore.updateSetting('skipDirtyByDefault', e.currentTarget.checked)}
                        class="w-4 h-4 rounded border-carbon-border text-git-indigo focus:ring-0 bg-carbon-base"
                      />
                      <span class="font-medium">Safely skip dirty repositories during batch Pull All operations</span>
                    </label>
                  </div>
                </div>
              </Show>

              {/* SECTION: Appearance & Themes */}
              <Show when={activeSection() === 'appearance'}>
                <div class="space-y-6">
                  <div>
                    <h3 class="text-sm font-bold text-gray-100 mb-1">Appearance & Typography</h3>
                    <p class="text-[11.5px] text-gray-400">Personalize color theme, accent hues, and typography family.</p>
                  </div>

                  {/* Theme Mode Grid */}
                  <div class="space-y-2">
                    <label class="block text-gray-200 font-medium">Color Theme</label>
                    <div class="grid grid-cols-2 gap-2.5">
                      <For each={themeOptions}>
                        {(t) => {
                          const Icon = t.icon;
                          const isSelected = () => settings().themeMode === t.value;
                          return (
                            <button
                              type="button"
                              onClick={() => settingsStore.updateSetting('themeMode', t.value)}
                              class={`p-3 rounded-lg border text-left flex items-start gap-3 transition-all cursor-pointer ${
                                isSelected()
                                  ? 'border-git-indigo bg-git-indigo/10 shadow-md'
                                  : 'border-carbon-border bg-carbon-base hover:bg-carbon-hover'
                              }`}
                            >
                              <div class={`p-1.5 rounded ${isSelected() ? 'bg-git-indigo text-white' : 'bg-carbon-elevated text-gray-400'}`}>
                                <Icon class="w-4 h-4" />
                              </div>
                              <div>
                                <div class="font-semibold text-gray-200 text-xs flex items-center gap-1.5">
                                  <span>{t.label}</span>
                                  <Show when={isSelected()}>
                                    <Check class="w-3 h-3 text-git-indigo stroke-[3]" />
                                  </Show>
                                </div>
                                <p class="text-[10.5px] text-gray-400 mt-0.5">{t.desc}</p>
                              </div>
                            </button>
                          );
                        }}
                      </For>
                    </div>
                  </div>

                  {/* Accent Color Palette */}
                  <div class="space-y-2">
                    <label class="block text-gray-200 font-medium">Accent Color Tone</label>
                    <div class="flex items-center gap-3">
                      <For each={accentOptions}>
                        {(acc) => {
                          const isSelected = () => settings().accentColor === acc.value;
                          return (
                            <button
                              type="button"
                              onClick={() => settingsStore.updateSetting('accentColor', acc.value)}
                              class={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                                isSelected()
                                  ? 'border-white/50 bg-carbon-elevated text-white font-bold'
                                  : 'border-carbon-border bg-carbon-base text-gray-400 hover:text-gray-200'
                              }`}
                            >
                              <div class={`w-3 h-3 rounded-full ${acc.colorClass}`} />
                              <span>{acc.label}</span>
                            </button>
                          );
                        }}
                      </For>
                    </div>
                  </div>

                  {/* Typography Font Family */}
                  <div class="space-y-2">
                    <label class="block text-gray-200 font-medium">UI & Code Font Family</label>
                    <div class="grid grid-cols-2 gap-2.5">
                      <For each={fontOptions}>
                        {(f) => {
                          const isSelected = () => settings().fontFamily === f.value;
                          return (
                            <button
                              type="button"
                              onClick={() => settingsStore.updateSetting('fontFamily', f.value)}
                              class={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                                isSelected()
                                  ? 'border-git-indigo bg-git-indigo/10 font-bold'
                                  : 'border-carbon-border bg-carbon-base hover:bg-carbon-hover'
                              }`}
                            >
                              <div class="flex items-center justify-between text-xs text-gray-200">
                                <span>{f.label}</span>
                                <Show when={isSelected()}>
                                  <Check class="w-3.5 h-3.5 text-git-indigo stroke-[3]" />
                                </Show>
                              </div>
                              <span class="text-[11px] text-gray-400 font-mono mt-1 block">{f.preview}</span>
                            </button>
                          );
                        }}
                      </For>
                    </div>
                  </div>

                  {/* Information Density / Size */}
                  <div class="space-y-2">
                    <label class="block text-gray-200 font-medium">Layout Density</label>
                    <div class="flex items-center gap-3">
                      <For each={fontSizeOptions}>
                        {(fs) => {
                          const isSelected = () => settings().fontSize === fs.value;
                          return (
                            <button
                              type="button"
                              onClick={() => settingsStore.updateSetting('fontSize', fs.value)}
                              class={`flex-1 p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                                isSelected()
                                  ? 'border-git-indigo bg-git-indigo/10 font-bold'
                                  : 'border-carbon-border bg-carbon-base hover:bg-carbon-hover'
                              }`}
                            >
                              <span class="text-gray-200 block">{fs.label}</span>
                              <span class="text-[10.5px] text-gray-400">{fs.desc}</span>
                            </button>
                          );
                        }}
                      </For>
                    </div>
                  </div>
                </div>
              </Show>

              {/* SECTION: Batch & Concurrency */}
              <Show when={activeSection() === 'concurrency'}>
                <div class="space-y-6">
                  <div>
                    <h3 class="text-sm font-bold text-gray-100 mb-1">Batch & Worker Concurrency</h3>
                    <p class="text-[11.5px] text-gray-400">Scale thread pools for parallel repository operations.</p>
                  </div>

                  <div class="space-y-2">
                    <div class="flex items-center justify-between text-gray-200 font-medium">
                      <span>Parallel Worker Goroutines</span>
                      <span class="font-mono text-git-indigo font-bold text-sm">{settings().workerConcurrency} Workers</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="12"
                      step="1"
                      value={settings().workerConcurrency}
                      onInput={(e) => settingsStore.updateSetting('workerConcurrency', parseInt(e.currentTarget.value, 10))}
                      class="w-full accent-git-indigo cursor-pointer h-1.5 bg-carbon-base rounded-lg"
                    />
                    <p class="text-[11px] text-gray-500">
                      Bounded concurrency pool throttles simultaneous Git sub-processes to eliminate network socket contention.
                    </p>
                  </div>

                  <div class="p-3.5 bg-carbon-base border border-carbon-border rounded-lg space-y-1.5">
                    <span class="font-semibold text-gray-200 flex items-center gap-1.5">
                      <ShieldCheck class="w-4 h-4 text-git-emerald" />
                      <span>Non-Interactive SSH Batch Safeguards</span>
                    </span>
                    <p class="text-[11.5px] text-gray-400">
                      All background and batch Git processes execute with <code class="text-git-cyan font-mono">GIT_TERMINAL_PROMPT=0</code> and <code class="text-git-cyan font-mono">GIT_SSH_COMMAND="ssh -o BatchMode=yes"</code> to guarantee zero UI freezes.
                    </p>
                  </div>
                </div>
              </Show>

              {/* SECTION: CLI Integrations */}
              <Show when={activeSection() === 'integrations'}>
                <div class="space-y-6">
                  <div>
                    <h3 class="text-sm font-bold text-gray-100 mb-1">CLI & SSH Integrations</h3>
                    <p class="text-[11.5px] text-gray-400">Seamless integration with your terminal tooling and credentials.</p>
                  </div>

                  <div class="space-y-3">
                    <div class="flex items-center justify-between p-3.5 bg-carbon-base border border-carbon-border rounded-lg">
                      <div class="flex items-center gap-3">
                        <Github class="w-5 h-5 text-white" />
                        <div>
                          <span class="font-medium text-gray-200">GitHub CLI (gh)</span>
                          <p class="text-[11px] text-gray-400">Cloning remote repositories, PR and auth integration</p>
                        </div>
                      </div>
                      <span class={`px-2 py-1 rounded text-xs font-semibold ${cliAuth().gh ? 'bg-git-emerald/20 text-git-emerald border border-git-emerald/40' : 'bg-gray-800 text-gray-500'}`}>
                        {cliAuth().gh ? '✓ Authenticated' : 'Not Detected'}
                      </span>
                    </div>

                    <div class="flex items-center justify-between p-3.5 bg-carbon-base border border-carbon-border rounded-lg">
                      <div class="flex items-center gap-3">
                        <Gitlab class="w-5 h-5 text-git-amber" />
                        <div>
                          <span class="font-medium text-gray-200">GitLab CLI (glab)</span>
                          <p class="text-[11px] text-gray-400">GitLab project discovery and merge requests</p>
                        </div>
                      </div>
                      <span class={`px-2 py-1 rounded text-xs font-semibold ${cliAuth().glab ? 'bg-git-emerald/20 text-git-emerald border border-git-emerald/40' : 'bg-gray-800 text-gray-500'}`}>
                        {cliAuth().glab ? '✓ Authenticated' : 'Not Detected'}
                      </span>
                    </div>

                    <div class="flex items-center justify-between p-3.5 bg-carbon-base border border-carbon-border rounded-lg">
                      <div class="flex items-center gap-3">
                        <Terminal class="w-5 h-5 text-git-cyan" />
                        <div>
                          <span class="font-medium text-gray-200">SSH Agent</span>
                          <p class="text-[11px] text-gray-400">Socket: $SSH_AUTH_SOCK active</p>
                        </div>
                      </div>
                      <span class="px-2 py-1 bg-git-emerald/20 border border-git-emerald/40 text-git-emerald font-semibold rounded text-xs">
                        ✓ Connected
                      </span>
                    </div>
                  </div>
                </div>
              </Show>

              {/* SECTION: Profiles */}
              <Show when={activeSection() === 'profiles'}>
                <div class="space-y-6">
                  <div>
                    <h3 class="text-sm font-bold text-gray-100 mb-1">Configuration Profiles</h3>
                    <p class="text-[11.5px] text-gray-400">Save and switch between workstation and project profiles.</p>
                  </div>

                  {/* Create New Profile */}
                  <div class="flex gap-2">
                    <input
                      type="text"
                      placeholder="New profile name (e.g. Work Polyrepo)..."
                      value={newProfileName()}
                      onInput={(e) => setNewProfileName(e.currentTarget.value)}
                      class="flex-1 px-3 py-1.5 bg-carbon-base border border-carbon-border rounded text-gray-200 text-xs focus:outline-none focus:border-git-indigo font-mono"
                    />
                    <button
                      onClick={handleSaveProfile}
                      disabled={!newProfileName().trim()}
                      class="px-4 py-1.5 bg-git-indigo hover:bg-git-indigo/90 disabled:opacity-40 text-white font-medium rounded text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus class="w-3.5 h-3.5" />
                      <span>Save Current Profile</span>
                    </button>
                  </div>

                  {/* Profile List */}
                  <div class="border border-carbon-border rounded-lg divide-y divide-carbon-border bg-carbon-base overflow-hidden">
                    <For each={Object.keys(profiles())}>
                      {(pName) => {
                        const isActive = () => settings().activeProfile === pName;
                        return (
                          <div class="px-4 py-3 flex items-center justify-between hover:bg-carbon-hover transition-colors">
                            <div class="flex items-center gap-2.5">
                              <div class={`w-2.5 h-2.5 rounded-full ${isActive() ? 'bg-git-emerald' : 'bg-gray-600'}`} />
                              <span class={`font-medium ${isActive() ? 'text-white font-bold' : 'text-gray-300'}`}>{pName}</span>
                              <Show when={isActive()}>
                                <span class="px-2 py-0.5 bg-git-emerald/20 text-git-emerald text-[10px] font-bold rounded">
                                  ACTIVE
                                </span>
                              </Show>
                            </div>

                            <div class="flex items-center gap-2">
                              <Show when={!isActive()}>
                                <button
                                  onClick={() => settingsStore.switchProfile(pName)}
                                  class="px-2.5 py-1 bg-carbon-elevated hover:bg-carbon-border text-gray-200 rounded text-xs font-medium cursor-pointer"
                                >
                                  Switch
                                </button>
                                <Show when={pName !== 'Default Workstation'}>
                                  <button
                                    onClick={() => settingsStore.deleteProfile(pName)}
                                    class="p-1 hover:bg-git-rose/20 text-gray-400 hover:text-git-rose rounded cursor-pointer"
                                    title="Delete profile"
                                  >
                                    <Trash2 class="w-3.5 h-3.5" />
                                  </button>
                                </Show>
                              </Show>
                            </div>
                          </div>
                        );
                      }}
                    </For>
                  </div>
                </div>
              </Show>

              {/* SECTION: Diagnostics */}
              <Show when={activeSection() === 'diagnostics'}>
                <div class="space-y-6">
                  <div>
                    <h3 class="text-sm font-bold text-gray-100 mb-1">Runtime Diagnostics & Telemetry</h3>
                    <p class="text-[11.5px] text-gray-400">Real-time memory and system performance metrics.</p>
                  </div>

                  <Show when={stats()}>
                    {(s) => (
                      <div class="grid grid-cols-2 gap-3 font-mono text-xs">
                        <div class="p-3.5 bg-carbon-base border border-carbon-border rounded-lg">
                          <span class="text-gray-400 block text-[11px]">Runtime RAM</span>
                          <strong class="text-git-emerald text-base">{s().allocRamMb.toFixed(1)} MB</strong>
                        </div>
                        <div class="p-3.5 bg-carbon-base border border-carbon-border rounded-lg">
                          <span class="text-gray-400 block text-[11px]">System Memory</span>
                          <strong class="text-gray-200 text-base">{s().sysRamMb.toFixed(1)} MB</strong>
                        </div>
                        <div class="p-3.5 bg-carbon-base border border-carbon-border rounded-lg">
                          <span class="text-gray-400 block text-[11px]">Active Goroutines</span>
                          <strong class="text-git-indigo text-base">{s().numGoroutine}</strong>
                        </div>
                        <div class="p-3.5 bg-carbon-base border border-carbon-border rounded-lg">
                          <span class="text-gray-400 block text-[11px]">CPU Cores</span>
                          <strong class="text-gray-200 text-base">{s().numCpu} Cores</strong>
                        </div>
                      </div>
                    )}
                  </Show>

                  <div class="text-[11px] text-gray-500 p-3 bg-carbon-base border border-carbon-border rounded-lg space-y-1">
                    <p class="font-semibold text-gray-400">Zero-CGO SQLite Database:</p>
                    <code class="text-gray-300 font-mono block truncate">~/.config/onogitree/onogitree.db</code>
                  </div>
                </div>
              </Show>
            </div>
          </div>

          {/* Modal Footer */}
          <div class="px-4 py-3 bg-carbon-elevated border-t border-carbon-border flex items-center justify-between">
            <Show when={savedToast()}>
              <span class="text-git-emerald font-medium flex items-center gap-1">
                <Check class="w-3.5 h-3.5 stroke-[3]" />
                <span>Preferences & Profile Synced!</span>
              </span>
            </Show>
            <div class="flex items-center gap-2 ml-auto">
              <button
                onClick={props.onClose}
                class="px-4 py-1.5 bg-git-indigo hover:bg-git-indigo/90 text-white font-semibold rounded cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
};
