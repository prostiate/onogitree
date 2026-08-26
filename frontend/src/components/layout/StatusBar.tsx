import { Component, createSignal, onMount, onCleanup, Show } from "solid-js";
import { Cpu, GitBranch, HardDrive, ShieldCheck } from "lucide-solid";
import { WailsBridge } from "../../services/wailsBridge";
import { repoStore } from "../../store/repoStore";
import { ResourceStats, RepoStatus } from "../../types/git";

interface StatusBarProps {
  onBranchClick?: (repo: RepoStatus) => void;
  onDiagnosticsClick?: () => void;
}

export const StatusBar: Component<StatusBarProps> = (props) => {
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

  const activeRepo = () => repoStore.selectedRepo();

  return (
    <footer class="h-6 bg-carbon-base border-t border-carbon-border px-3 flex items-center justify-between text-[11px] font-mono select-none text-gray-400">
      {/* Left: App and active repo branch switcher */}
      <div class="flex items-center gap-3 min-w-0">
        <span class="flex items-center gap-1 text-gray-300 flex-shrink-0">
          <span class="text-git-emerald">⚡</span> OnoGitTree
        </span>

        <Show when={activeRepo()}>
          {(repo) => (
            <button
              onClick={() => props.onBranchClick && props.onBranchClick(repo())}
              class="flex items-center gap-1.5 text-gray-300 border-l border-carbon-border pl-3 pr-2 py-0.5 hover:bg-carbon-hover hover:text-white rounded transition-colors cursor-pointer min-w-0"
              title="Click to switch or create branch"
            >
              <GitBranch class="w-3 h-3 text-indigo-400 flex-shrink-0 stroke-[2.5]" />
              <span class="text-indigo-300 font-bold truncate">
                {repo().currentBranch}
              </span>
              <span class="text-gray-500 truncate">({repo().name})</span>
            </button>
          )}
        </Show>
      </div>

      {/* Right: Live Telemetry Metrics (Clickable for Diagnostics Modal) */}
      <div class="flex items-center gap-2 sm:gap-4 text-[10.5px] flex-shrink-0">
        <button
          onClick={props.onDiagnosticsClick}
          class="flex items-center gap-1 text-gray-300 px-1.5 py-0.5 hover:bg-carbon-hover hover:text-white rounded transition-colors cursor-pointer"
          title="Click to open Go Runtime Diagnostics"
        >
          <HardDrive class="w-3 h-3 text-git-cyan flex-shrink-0" />
          <span>
            RAM:{" "}
            <strong class="text-git-emerald font-bold tabular-nums">
              {stats().allocRamMb.toFixed(1)} MB
            </strong>
          </span>
        </button>

        <button
          onClick={props.onDiagnosticsClick}
          class="hidden sm:flex items-center gap-1 text-gray-400 px-1.5 py-0.5 hover:bg-carbon-hover hover:text-white rounded transition-colors cursor-pointer"
          title="Click to open Go Runtime Diagnostics"
        >
          <Cpu class="w-3 h-3 text-git-indigo flex-shrink-0" />
          <span>
            Goroutines:{" "}
            <strong class="text-gray-200 tabular-nums">
              {stats().numGoroutine}
            </strong>
          </span>
        </button>

        <div class="hidden md:flex items-center gap-1 text-gray-400">
          <span>
            Repos:{" "}
            <strong class="text-gray-200 tabular-nums">
              {repoStore.repositories().length} Active
            </strong>
          </span>
        </div>

        <button
          onClick={props.onDiagnosticsClick}
          class="hidden lg:flex items-center gap-1 text-gray-500 border-l border-carbon-border pl-3 pr-1 py-0.5 hover:bg-carbon-hover hover:text-gray-300 rounded transition-colors cursor-pointer"
          title="Git Execution Binary Engine"
        >
          <ShieldCheck class="w-3 h-3 text-gray-400 flex-shrink-0" />
          <span>Engine: /usr/bin/git</span>
        </button>
      </div>
    </footer>
  );
};
