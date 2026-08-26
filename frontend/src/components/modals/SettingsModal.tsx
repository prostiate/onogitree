import { Component, createSignal, onMount, Show } from 'solid-js';
import { 
  X, 
  Settings, 
  Sliders, 
  Cpu, 
  Terminal, 
  Github, 
  Gitlab, 
  Key, 
  HardDrive, 
  Check, 
  ShieldCheck
} from 'lucide-solid';
import { WailsBridge } from '../../services/wailsBridge';
import { ResourceStats } from '../../types/git';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: Component<SettingsModalProps> = (props) => {
  const [activeTab, setActiveTab] = createSignal<'general' | 'concurrency' | 'integrations' | 'performance'>('general');
  const [autoFetchInterval, setAutoFetchInterval] = createSignal<string>('10m');
  const [workerConcurrency, setWorkerConcurrency] = createSignal<number>(6);
  const [skipDirtyByDefault, setSkipDirtyByDefault] = createSignal<boolean>(true);
  const [cliAuth, setCliAuth] = createSignal<{ gh: boolean; glab: boolean }>({ gh: false, glab: false });
  const [stats, setStats] = createSignal<ResourceStats | null>(null);
  const [savedSuccess, setSavedSuccess] = createSignal<boolean>(false);

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

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      props.onClose();
    }, 600);
  };

  return (
    <Show when={props.isOpen}>
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
        <div class="w-full max-w-xl bg-carbon-surface border border-carbon-border rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-xs">
          {/* Header */}
          <div class="px-4 py-3 bg-carbon-elevated border-b border-carbon-border flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Settings class="w-4 h-4 text-git-indigo" />
              <span class="font-semibold text-gray-200 text-sm">Preferences & Settings</span>
            </div>
            <button
              onClick={props.onClose}
              class="p-1 hover:bg-carbon-hover rounded text-gray-400 hover:text-gray-200 cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div class="flex border-b border-carbon-border bg-carbon-base px-3 pt-2 gap-2 text-xs">
            <button
              onClick={() => setActiveTab('general')}
              class={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors cursor-pointer ${
                activeTab() === 'general'
                  ? 'border-git-indigo text-git-indigo'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Sliders class="w-3.5 h-3.5" />
              <span>General</span>
            </button>

            <button
              onClick={() => setActiveTab('concurrency')}
              class={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors cursor-pointer ${
                activeTab() === 'concurrency'
                  ? 'border-git-indigo text-git-indigo'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Cpu class="w-3.5 h-3.5" />
              <span>Batch & Concurrency</span>
            </button>

            <button
              onClick={() => setActiveTab('integrations')}
              class={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors cursor-pointer ${
                activeTab() === 'integrations'
                  ? 'border-git-indigo text-git-indigo'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Key class="w-3.5 h-3.5" />
              <span>CLI Integrations</span>
            </button>

            <button
              onClick={() => setActiveTab('performance')}
              class={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors cursor-pointer ${
                activeTab() === 'performance'
                  ? 'border-git-indigo text-git-indigo'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <HardDrive class="w-3.5 h-3.5" />
              <span>Diagnostics</span>
            </button>
          </div>

          {/* Body */}
          <div class="p-5 flex-1 overflow-y-auto space-y-5">
            {/* TAB: General */}
            <Show when={activeTab() === 'general'}>
              <div class="space-y-4">
                <div class="space-y-1.5">
                  <label class="block text-gray-300 font-medium">Automatic Background Fetch Interval</label>
                  <select
                    value={autoFetchInterval()}
                    onChange={(e) => setAutoFetchInterval(e.currentTarget.value)}
                    class="w-full px-3 py-1.5 bg-carbon-base border border-carbon-border rounded text-gray-200 text-xs focus:outline-none focus:border-git-indigo"
                  >
                    <option value="5m">Every 5 minutes</option>
                    <option value="10m">Every 10 minutes (Recommended)</option>
                    <option value="15m">Every 15 minutes</option>
                    <option value="30m">Every 30 minutes</option>
                    <option value="disabled">Disabled (Manual refresh only)</option>
                  </select>
                  <p class="text-[11px] text-gray-500">
                    Runs lightweight background checks to update ahead/behind badges without locking index files.
                  </p>
                </div>

                <div class="space-y-1.5">
                  <label class="block text-gray-300 font-medium">System Git Binary</label>
                  <div class="flex items-center gap-2">
                    <input
                      type="text"
                      value="/usr/bin/git"
                      disabled
                      class="flex-1 px-3 py-1.5 bg-carbon-base border border-carbon-border rounded text-gray-400 font-mono text-xs cursor-not-allowed"
                    />
                    <span class="px-2 py-1 bg-git-emerald/20 border border-git-emerald/40 text-git-emerald font-semibold rounded text-[11px]">
                      Active
                    </span>
                  </div>
                </div>

                <div class="pt-2">
                  <label class="flex items-center gap-2 cursor-pointer text-gray-300">
                    <input
                      type="checkbox"
                      checked={skipDirtyByDefault()}
                      onChange={(e) => setSkipDirtyByDefault(e.currentTarget.checked)}
                      class="rounded border-carbon-border text-git-indigo focus:ring-0 bg-carbon-base"
                    />
                    <span>Skip dirty repositories during batch Pull All by default</span>
                  </label>
                </div>
              </div>
            </Show>

            {/* TAB: Batch & Concurrency */}
            <Show when={activeTab() === 'concurrency'}>
              <div class="space-y-4">
                <div class="space-y-2">
                  <div class="flex items-center justify-between text-gray-300 font-medium">
                    <span>Concurrent Worker Goroutines</span>
                    <span class="font-mono text-git-indigo font-bold">{workerConcurrency()} Workers</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="12"
                    step="1"
                    value={workerConcurrency()}
                    onInput={(e) => setWorkerConcurrency(parseInt(e.currentTarget.value, 10))}
                    class="w-full accent-git-indigo cursor-pointer"
                  />
                  <p class="text-[11px] text-gray-500">
                    Controls maximum parallel Git processes during batch Fetch All and Pull All operations to prevent network congestion.
                  </p>
                </div>

                <div class="p-3 bg-carbon-base border border-carbon-border rounded space-y-1">
                  <span class="font-semibold text-gray-300 flex items-center gap-1.5">
                    <ShieldCheck class="w-3.5 h-3.5 text-git-emerald" />
                    <span>Non-Interactive SSH Batch Mode Active</span>
                  </span>
                  <p class="text-[11px] text-gray-400">
                    Batch commands automatically run with <code class="text-git-cyan font-mono">GIT_TERMINAL_PROMPT=0</code> and <code class="text-git-cyan font-mono">GIT_SSH_COMMAND="ssh -o BatchMode=yes"</code> to isolate hangs.
                  </p>
                </div>
              </div>
            </Show>

            {/* TAB: CLI Integrations */}
            <Show when={activeTab() === 'integrations'}>
              <div class="space-y-3">
                <div class="flex items-center justify-between p-3 bg-carbon-base border border-carbon-border rounded">
                  <div class="flex items-center gap-2.5">
                    <Github class="w-4 h-4 text-white" />
                    <div>
                      <span class="font-medium text-gray-200">GitHub CLI (gh)</span>
                      <p class="text-[11px] text-gray-400">Enables GitHub repository cloning and branch metadata</p>
                    </div>
                  </div>
                  <span class={cliAuth().gh ? 'text-git-emerald font-bold text-xs' : 'text-gray-500 text-xs'}>
                    {cliAuth().gh ? '✓ Authenticated' : 'Not Detected'}
                  </span>
                </div>

                <div class="flex items-center justify-between p-3 bg-carbon-base border border-carbon-border rounded">
                  <div class="flex items-center gap-2.5">
                    <Gitlab class="w-4 h-4 text-git-amber" />
                    <div>
                      <span class="font-medium text-gray-200">GitLab CLI (glab)</span>
                      <p class="text-[11px] text-gray-400">Enables GitLab remote project discovery</p>
                    </div>
                  </div>
                  <span class={cliAuth().glab ? 'text-git-emerald font-bold text-xs' : 'text-gray-500 text-xs'}>
                    {cliAuth().glab ? '✓ Authenticated' : 'Not Detected'}
                  </span>
                </div>

                <div class="flex items-center justify-between p-3 bg-carbon-base border border-carbon-border rounded">
                  <div class="flex items-center gap-2.5">
                    <Terminal class="w-4 h-4 text-git-cyan" />
                    <div>
                      <span class="font-medium text-gray-200">SSH Agent</span>
                      <p class="text-[11px] text-gray-400">Socket: $SSH_AUTH_SOCK</p>
                    </div>
                  </div>
                  <span class="text-git-emerald font-bold text-xs">✓ Active</span>
                </div>
              </div>
            </Show>

            {/* TAB: Performance & Diagnostics */}
            <Show when={activeTab() === 'performance'}>
              <div class="space-y-3">
                <Show when={stats()}>
                  {(s) => (
                    <div class="grid grid-cols-2 gap-3 font-mono text-xs">
                      <div class="p-3 bg-carbon-base border border-carbon-border rounded">
                        <span class="text-gray-400 block text-[11px]">Runtime RAM</span>
                        <strong class="text-git-emerald text-sm">{s().allocRamMb.toFixed(1)} MB</strong>
                      </div>
                      <div class="p-3 bg-carbon-base border border-carbon-border rounded">
                        <span class="text-gray-400 block text-[11px]">System Memory</span>
                        <strong class="text-gray-200 text-sm">{s().sysRamMb.toFixed(1)} MB</strong>
                      </div>
                      <div class="p-3 bg-carbon-base border border-carbon-border rounded">
                        <span class="text-gray-400 block text-[11px]">Active Goroutines</span>
                        <strong class="text-git-indigo text-sm">{s().numGoroutine}</strong>
                      </div>
                      <div class="p-3 bg-carbon-base border border-carbon-border rounded">
                        <span class="text-gray-400 block text-[11px]">CPU Cores</span>
                        <strong class="text-gray-200 text-sm">{s().numCpu} Cores</strong>
                      </div>
                    </div>
                  )}
                </Show>

                <div class="text-[11px] text-gray-500 p-2">
                  Database location: <code class="text-gray-400">~/.config/onogitree/onogitree.db</code>
                </div>
              </div>
            </Show>
          </div>

          {/* Footer */}
          <div class="px-4 py-3 bg-carbon-elevated border-t border-carbon-border flex items-center justify-between">
            <Show when={savedSuccess()}>
              <span class="text-git-emerald font-medium flex items-center gap-1">
                <Check class="w-3.5 h-3.5 stroke-[3]" />
                <span>Preferences Saved!</span>
              </span>
            </Show>
            <div class="flex items-center gap-2 ml-auto">
              <button
                onClick={props.onClose}
                class="px-3 py-1.5 bg-carbon-hover hover:bg-carbon-border text-gray-300 rounded font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                class="px-4 py-1.5 bg-git-indigo hover:bg-git-indigo/90 text-white font-semibold rounded cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
};
