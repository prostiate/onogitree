import { Component, createSignal, onMount, Show } from "solid-js";
import {
  Trash2,
  FileText,
  FolderOpen,
  Copy,
  Check,
  HardDrive,
  Cpu,
  Zap,
} from "lucide-solid";
import { repoStore } from "../../../store/repoStore";
import { WailsBridge } from "../../../services/wailsBridge";
import { ResourceStats, LogFileInfo } from "../../../types/git";

interface DiagnosticsSectionProps {
  stats: ResourceStats | null;
  onSavedToast: () => void;
}

export const DiagnosticsSection: Component<DiagnosticsSectionProps> = (props) => {
  const [logInfo, setLogInfo] = createSignal<LogFileInfo | null>(null);
  const [copiedLogPath, setCopiedLogPath] = createSignal(false);
  const [clearedLog, setClearedLog] = createSignal(false);

  const fetchLogInfo = async () => {
    try {
      const info = await WailsBridge.getLogInfo();
      setLogInfo(info);
    } catch (err) {
      console.error("Failed to fetch log info:", err);
    }
  };

  onMount(() => {
    void fetchLogInfo();
  });

  const handleClearCache = () => {
    repoStore.invalidateDiffCache(true);
    props.onSavedToast();
  };

  const handleCopyPath = () => {
    const p = logInfo()?.logPath;
    if (p) {
      void navigator.clipboard.writeText(p);
      setCopiedLogPath(true);
      setTimeout(() => setCopiedLogPath(false), 2000);
    }
  };

  const handleOpenLogDir = () => {
    const dir = logInfo()?.logDir;
    if (dir) {
      void WailsBridge.openPathInSystem(dir);
    }
  };

  const handleOpenLogFile = () => {
    const p = logInfo()?.logPath;
    if (p) {
      void WailsBridge.openPathInSystem(p);
    }
  };

  const handleClearLog = async () => {
    await WailsBridge.clearLogFile();
    setClearedLog(true);
    setTimeout(() => setClearedLog(false), 2500);
    void fetchLogInfo();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div class="space-y-6 select-none">
      <div>
        <h3 class="text-sm font-bold text-gray-100 mb-1">
          Diagnostics & Log Files
        </h3>
        <p class="text-[11.5px] text-gray-400">
          Persistent Git logs, Go runtime memory allocations and performance stats.
        </p>
      </div>

      {/* Persistent Log File Location Card */}
      <div class="bg-carbon-base border border-carbon-border rounded-xl p-4 space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <FileText class="w-4 h-4 text-indigo-400" />
            <span class="font-semibold text-gray-200 text-xs">
              Persistent Git Execution Log File
            </span>
          </div>
          <Show when={logInfo()}>
            <span class="text-[11px] font-mono text-gray-400 font-bold bg-carbon-surface px-2 py-0.5 rounded border border-carbon-border">
              {formatSize(logInfo()!.logSize)}
            </span>
          </Show>
        </div>

        <p class="text-[11px] text-gray-400">
          All Git commands, timestamps, execution durations, stdout, and stderr error traces are saved to disk:
        </p>

        <div class="flex items-center gap-2 font-mono text-xs bg-[#080A0F] border border-gray-800 rounded-lg p-2.5">
          <span class="text-indigo-300 truncate flex-1 select-all">
            {logInfo()?.logPath || "~/.config/onogitree/logs/onogitree.log"}
          </span>

          <button
            onClick={handleCopyPath}
            class="p-1 hover:bg-carbon-elevated rounded text-gray-400 hover:text-white transition-colors cursor-pointer flex-shrink-0"
            title="Copy absolute log path"
          >
            <Show
              when={copiedLogPath()}
              fallback={<Copy class="w-3.5 h-3.5" />}
            >
              <Check class="w-3.5 h-3.5 text-emerald-400" />
            </Show>
          </button>
        </div>

        <div class="flex items-center gap-2 pt-1 flex-wrap">
          <button
            onClick={handleOpenLogFile}
            class="px-3 py-1.5 bg-carbon-elevated hover:bg-carbon-hover border border-carbon-border text-gray-200 hover:text-white rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <FileText class="w-3.5 h-3.5 text-indigo-400" />
            <span>Open Log File</span>
          </button>

          <button
            onClick={handleOpenLogDir}
            class="px-3 py-1.5 bg-carbon-elevated hover:bg-carbon-hover border border-carbon-border text-gray-200 hover:text-white rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <FolderOpen class="w-3.5 h-3.5 text-amber-400" />
            <span>Open Log Folder</span>
          </button>

          <button
            onClick={handleClearLog}
            class="px-3 py-1.5 bg-carbon-elevated hover:bg-rose-500/20 border border-carbon-border hover:border-rose-500/40 text-gray-400 hover:text-rose-400 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-colors ml-auto"
          >
            <Trash2 class="w-3.5 h-3.5" />
            <span>{clearedLog() ? "Cleared!" : "Clear Log File"}</span>
          </button>
        </div>
      </div>

      {/* Runtime Telemetry */}
      <Show
        when={props.stats}
        fallback={
          <div class="p-6 text-center text-gray-500 font-mono text-xs">
            Loading runtime stats...
          </div>
        }
      >
        {(s) => (
          <div class="space-y-4">
            {/* Live Metrics Grid */}
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
              <div class="bg-carbon-base border border-carbon-border rounded-xl p-3.5 space-y-1">
                <div class="flex items-center gap-1 text-[10px] text-gray-400 font-sans">
                  <HardDrive class="w-3 h-3 text-git-emerald" />
                  <span>Active Heap RAM</span>
                </div>
                <span class="text-base font-extrabold text-git-emerald">
                  {s().allocRamMb.toFixed(1)} MB
                </span>
              </div>

              <div class="bg-carbon-base border border-carbon-border rounded-xl p-3.5 space-y-1">
                <div class="flex items-center gap-1 text-[10px] text-gray-400 font-sans">
                  <Zap class="w-3 h-3 text-git-cyan" />
                  <span>Total Process RAM</span>
                </div>
                <span class="text-base font-extrabold text-git-cyan">
                  {s().sysRamMb.toFixed(1)} MB
                </span>
              </div>

              <div class="bg-carbon-base border border-carbon-border rounded-xl p-3.5 space-y-1">
                <div class="flex items-center gap-1 text-[10px] text-gray-400 font-sans">
                  <Cpu class="w-3 h-3 text-git-indigo" />
                  <span>Background Goroutines</span>
                </div>
                <span class="text-base font-extrabold text-git-indigo">
                  {s().numGoroutine}
                </span>
              </div>
            </div>

            {/* In-Memory Caches & Actions */}
            <div class="bg-carbon-base border border-carbon-border rounded-xl p-4 space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <span class="font-semibold text-gray-200 block text-xs">
                    In-Memory Diffs & Commits Cache
                  </span>
                  <span class="text-[11px] text-gray-400 block">
                    Fast client-side cache for instantaneous diff and log navigation.
                  </span>
                </div>
                <button
                  onClick={handleClearCache}
                  class="px-3 py-1.5 bg-carbon-elevated hover:bg-carbon-hover border border-carbon-border text-gray-300 hover:text-white rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Trash2 class="w-3.5 h-3.5 text-rose-400" />
                  <span>Purge Cache</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </Show>
    </div>
  );
};
