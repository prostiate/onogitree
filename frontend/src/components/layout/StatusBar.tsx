import { Component, createSignal, onMount, onCleanup, Show } from 'solid-js';
import { Cpu, GitBranch, HardDrive, ShieldCheck } from 'lucide-solid';
import { WailsBridge } from '../../services/wailsBridge';
import { repoStore } from '../../store/repoStore';
import { ResourceStats } from '../../types/git';

export const StatusBar: Component = () => {
  const [stats, setStats] = createSignal<ResourceStats>({
    allocRamMb: 45.2,
    totalAllocMb: 120.0,
    sysRamMb: 58.0,
    numGoroutine: 8,
    numCpu: 8,
    timestamp: Date.now(),
  });

  let timer: number | undefined;

  onMount(() => {
    const updateStats = async () => {
      try {
        const data = await WailsBridge.getResourceStats();
        setStats(data);
      } catch {
        // ignore in mock mode
      }
    };

    void updateStats();
    timer = window.setInterval(updateStats, 2500);
  });

  onCleanup(() => {
    if (timer) clearInterval(timer);
  });

  return (
    <footer class="h-6 bg-carbon-base border-t border-carbon-border px-3 flex items-center justify-between text-[11px] font-mono select-none text-gray-400">
      {/* Left: App and active repo state */}
      <div class="flex items-center gap-3">
        <span class="flex items-center gap-1 text-gray-300">
          <span class="text-git-emerald">⚡</span> OnoGitTree
        </span>

        <Show when={repoStore.selectedRepo()}>
          {(repo) => (
            <span class="flex items-center gap-1 text-gray-300 border-l border-carbon-border pl-3">
              <GitBranch class="w-3 h-3 text-git-indigo" />
              <span class="text-git-indigo font-medium">{repo().currentBranch}</span>
              <span class="text-gray-500">({repo().name})</span>
            </span>
          )}
        </Show>
      </div>

      {/* Right: Live Telemetry Metrics */}
      <div class="flex items-center gap-4 text-[10.5px]">
        <div class="flex items-center gap-1 text-gray-300" title="Resident Go Runtime RAM">
          <HardDrive class="w-3 h-3 text-git-cyan" />
          <span>RAM: <strong class="text-git-emerald font-bold tabular-nums">{stats().allocRamMb.toFixed(1)} MB</strong></span>
        </div>

        <div class="flex items-center gap-1 text-gray-400" title="Active Background Goroutines">
          <Cpu class="w-3 h-3 text-git-indigo" />
          <span>Goroutines: <strong class="text-gray-200 tabular-nums">{stats().numGoroutine}</strong></span>
        </div>

        <div class="flex items-center gap-1 text-gray-400">
          <span>Repos: <strong class="text-gray-200 tabular-nums">{repoStore.repositories().length} Active</strong></span>
        </div>

        <div class="flex items-center gap-1 text-gray-500 border-l border-carbon-border pl-3">
          <ShieldCheck class="w-3 h-3 text-gray-400" />
          <span>Engine: /usr/bin/git</span>
        </div>
      </div>
    </footer>
  );
};
