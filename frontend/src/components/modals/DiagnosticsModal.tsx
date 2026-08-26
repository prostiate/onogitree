import { Component, createSignal, onMount, onCleanup, Show } from "solid-js";
import {
  Activity,
  HardDrive,
  Cpu,
  ShieldCheck,
  FolderGit2,
  Trash2,
  RefreshCw,
  X,
  Zap,
} from "lucide-solid";
import { WailsBridge } from "../../services/wailsBridge";
import { repoStore } from "../../store/repoStore";
import { ResourceStats } from "../../types/git";

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiagnosticsModal: Component<DiagnosticsModalProps> = (props) => {
  const [stats, setStats] = createSignal<ResourceStats | null>(null);
  const [isLoading, setIsLoading] = createSignal<boolean>(false);
  const [purgedMessage, setPurgedMessage] = createSignal<string | null>(null);

  let timer: number | undefined;

  const fetchStats = async () => {
    try {
      const data = await WailsBridge.getResourceStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch diagnostics:", err);
    }
  };

  onMount(() => {
    void fetchStats();
  });

  // Poll stats every 1.5s while modal is open
  onMount(() => {
    timer = window.setInterval(() => {
      if (props.isOpen) {
        void fetchStats();
      }
    }, 1500);
  });

  onCleanup(() => {
    if (timer) clearInterval(timer);
  });

  const handlePurgeCache = () => {
    repoStore.invalidateDiffCache(true);
    setPurgedMessage("Diff and commit in-memory caches purged!");
    setTimeout(() => setPurgedMessage(null), 2500);
    void fetchStats();
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await repoStore.refreshAll();
    await fetchStats();
    setIsLoading(false);
  };

  return (
    <Show when={props.isOpen}>
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none animate-in fade-in duration-150"
        onClick={props.onClose}
      >
        <div
          class="w-full max-w-lg bg-[#0F131C] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div class="px-5 py-3.5 bg-carbon-surface border-b border-gray-800/80 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="p-1.5 bg-indigo-500/15 border border-indigo-500/30 rounded-lg text-indigo-400">
                <Activity class="w-4 h-4" />
              </div>
              <div>
                <h2 class="text-sm font-bold text-gray-100 flex items-center gap-2">
                  <span>Go Runtime & System Diagnostics</span>
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h2>
                <p class="text-[11px] text-gray-400 font-mono">
                  Live backend engine metrics & memory statistics
                </p>
              </div>
            </div>

            <button
              onClick={props.onClose}
              class="p-1.5 hover:bg-carbon-hover text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div class="p-5 space-y-4">
            <Show
              when={stats()}
              fallback={
                <div class="p-8 text-center text-gray-500 font-mono text-xs flex items-center justify-center gap-2">
                  <RefreshCw class="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Collecting runtime telemetry...</span>
                </div>
              }
            >
              {(s) => (
                <div class="space-y-4">
                  {/* Metric Stat Cards Grid */}
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono">
                    <div class="bg-carbon-base border border-carbon-border/80 rounded-xl p-3 space-y-1">
                      <div class="flex items-center gap-1.5 text-[10.5px] text-gray-400 font-sans">
                        <HardDrive class="w-3 h-3 text-git-emerald" />
                        <span>Heap Alloc RAM</span>
                      </div>
                      <span class="text-lg font-extrabold text-git-emerald tabular-nums">
                        {s().allocRamMb.toFixed(1)} MB
                      </span>
                    </div>

                    <div class="bg-carbon-base border border-carbon-border/80 rounded-xl p-3 space-y-1">
                      <div class="flex items-center gap-1.5 text-[10.5px] text-gray-400 font-sans">
                        <Zap class="w-3 h-3 text-git-cyan" />
                        <span>Total Process RAM</span>
                      </div>
                      <span class="text-lg font-extrabold text-git-cyan tabular-nums">
                        {s().sysRamMb.toFixed(1)} MB
                      </span>
                    </div>

                    <div class="bg-carbon-base border border-carbon-border/80 rounded-xl p-3 space-y-1">
                      <div class="flex items-center gap-1.5 text-[10.5px] text-gray-400 font-sans">
                        <Cpu class="w-3 h-3 text-git-indigo" />
                        <span>Goroutines</span>
                      </div>
                      <span class="text-lg font-extrabold text-git-indigo tabular-nums">
                        {s().numGoroutine}
                      </span>
                    </div>

                    <div class="bg-carbon-base border border-carbon-border/80 rounded-xl p-3 space-y-1">
                      <div class="flex items-center gap-1.5 text-[10.5px] text-gray-400 font-sans">
                        <FolderGit2 class="w-3 h-3 text-amber-400" />
                        <span>Active Repos</span>
                      </div>
                      <span class="text-lg font-extrabold text-amber-300 tabular-nums">
                        {repoStore.repositories().length}
                      </span>
                    </div>

                    <div class="bg-carbon-base border border-carbon-border/80 rounded-xl p-3 space-y-1">
                      <div class="flex items-center gap-1.5 text-[10.5px] text-gray-400 font-sans">
                        <Cpu class="w-3 h-3 text-purple-400" />
                        <span>CPU Logical Cores</span>
                      </div>
                      <span class="text-lg font-extrabold text-purple-300 tabular-nums">
                        {s().numCpu}
                      </span>
                    </div>

                    <div class="bg-carbon-base border border-carbon-border/80 rounded-xl p-3 space-y-1">
                      <div class="flex items-center gap-1.5 text-[10.5px] text-gray-400 font-sans">
                        <ShieldCheck class="w-3 h-3 text-emerald-400" />
                        <span>Git Binary</span>
                      </div>
                      <span class="text-xs font-bold text-gray-200 truncate block">
                        /usr/bin/git
                      </span>
                    </div>
                  </div>

                  {/* Cache and Maintenance Operations */}
                  <div class="bg-carbon-base border border-carbon-border/80 rounded-xl p-4 space-y-3">
                    <div class="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h3 class="font-bold text-gray-200 text-xs">
                          In-Memory Diff & Commit Cache
                        </h3>
                        <p class="text-[11px] text-gray-400">
                          Fast client-side cache for high-speed multi-file diff rendering.
                        </p>
                      </div>

                      <button
                        onClick={handlePurgeCache}
                        class="px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                        <span>Purge Cache</span>
                      </button>
                    </div>

                    <Show when={purgedMessage()}>
                      <div class="text-[11px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded">
                        ✓ {purgedMessage()}
                      </div>
                    </Show>
                  </div>
                </div>
              )}
            </Show>
          </div>

          {/* Modal Footer */}
          <div class="px-5 py-3 bg-carbon-surface border-t border-gray-800/80 flex items-center justify-between">
            <button
              onClick={handleRefresh}
              disabled={isLoading()}
              class="px-3 py-1.5 bg-carbon-base hover:bg-carbon-elevated border border-carbon-border rounded-lg text-xs text-gray-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RefreshCw
                class={`w-3.5 h-3.5 ${isLoading() ? "animate-spin text-indigo-400" : ""}`}
              />
              <span>Refresh Now</span>
            </button>

            <button
              onClick={props.onClose}
              class="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-lg text-xs cursor-pointer transition-colors shadow-sm"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};
