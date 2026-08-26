import { Component, createSignal, createMemo, onMount, onCleanup, For, Show } from "solid-js";
import {
  Terminal,
  Activity,
  HardDrive,
  Cpu,
  ShieldCheck,
  FolderGit2,
  Trash2,
  RefreshCw,
  X,
  Zap,
  Copy,
  Check,
  Search,
  ChevronDown,
  ChevronRight,
} from "lucide-solid";
import { WailsBridge } from "../../services/wailsBridge";
import { repoStore } from "../../store/repoStore";
import { ResourceStats, GitCommandLog } from "../../types/git";

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiagnosticsModal: Component<DiagnosticsModalProps> = (props) => {
  const [activeTab, setActiveTab] = createSignal<"console" | "telemetry" | "cache">("console");
  const [stats, setStats] = createSignal<ResourceStats | null>(null);
  const [logs, setLogs] = createSignal<GitCommandLog[]>([]);
  const [searchQuery, setSearchQuery] = createSignal("");
  const [filterMode, setFilterMode] = createSignal<"all" | "errors">("all");
  const [expandedLogIds, setExpandedLogIds] = createSignal<Set<string>>(new Set());
  const [copiedId, setCopiedId] = createSignal<string | null>(null);
  const [isLoading, setIsLoading] = createSignal(false);
  const [purgedMessage, setPurgedMessage] = createSignal<string | null>(null);

  let timer: number | undefined;

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resStats, resLogs] = await Promise.all([
        WailsBridge.getResourceStats(),
        WailsBridge.getGitCommandLogs(100),
      ]);
      setStats(resStats);
      setLogs(resLogs);
    } catch (err) {
      console.error("Failed to fetch diagnostics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  onMount(() => {
    void fetchData();
  });

  onMount(() => {
    timer = window.setInterval(() => {
      if (props.isOpen) {
        void fetchData();
      }
    }, 1500);
  });

  onCleanup(() => {
    if (timer) clearInterval(timer);
  });

  const filteredLogs = createMemo(() => {
    const query = searchQuery().toLowerCase().trim();
    const mode = filterMode();

    return logs().filter((l) => {
      if (mode === "errors" && l.success) return false;
      if (!query) return true;
      return (
        l.command.toLowerCase().includes(query) ||
        l.repoPath.toLowerCase().includes(query) ||
        (l.stderr && l.stderr.toLowerCase().includes(query)) ||
        (l.stdout && l.stdout.toLowerCase().includes(query)) ||
        (l.error && l.error.toLowerCase().includes(query))
      );
    });
  });

  const errorLogCount = createMemo(() => {
    return logs().filter((l) => !l.success).length;
  });

  const toggleExpand = (id: string) => {
    setExpandedLogIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopyLog = (log: GitCommandLog, e: MouseEvent) => {
    e.stopPropagation();
    const text = `Command: ${log.command}\nRepo: ${log.repoPath}\nStatus: ${log.success ? "SUCCESS" : "FAILED"}\nDuration: ${log.durationMs}ms\n\nSTDOUT:\n${log.stdout || "(none)"}\n\nSTDERR:\n${log.stderr || "(none)"}\n${log.error ? `\nERROR:\n${log.error}` : ""}`;
    void navigator.clipboard.writeText(text);
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopySystemReport = () => {
    const s = stats();
    const rep = [
      `=== OnoGitTree Diagnostics Report ===`,
      `Time: ${new Date().toISOString()}`,
      `RAM Heap Allocated: ${s?.allocRamMb.toFixed(1) || "N/A"} MB`,
      `Process Virtual Memory: ${s?.sysRamMb.toFixed(1) || "N/A"} MB`,
      `Goroutines: ${s?.numGoroutine || "N/A"}`,
      `Logical CPUs: ${s?.numCpu || "N/A"}`,
      `Active Repositories: ${repoStore.repositories().length}`,
      `Total Executed Commands: ${logs().length}`,
      `Total Errors: ${errorLogCount()}`,
      `\nRecent Failed Commands:`,
      ...logs()
        .filter((l) => !l.success)
        .slice(0, 5)
        .map((l) => ` - [${new Date(l.timestamp).toLocaleTimeString()}] ${l.command} -> ${l.error || l.stderr}`),
    ].join("\n");

    void navigator.clipboard.writeText(rep);
    setCopiedId("report");
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handlePurgeCache = () => {
    repoStore.invalidateDiffCache(true);
    setPurgedMessage("Diff and commit in-memory caches purged!");
    setTimeout(() => setPurgedMessage(null), 2500);
    void fetchData();
  };

  const handleClearLogs = async () => {
    await WailsBridge.clearGitCommandLogs();
    setLogs([]);
  };

  return (
    <Show when={props.isOpen}>
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-150"
        onClick={props.onClose}
      >
        <div
          class="w-full max-w-3xl bg-[#0C0F17] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[82vh] text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header with Live Tabs */}
          <div class="px-5 py-3 bg-[#111520] border-b border-gray-800 flex items-center justify-between flex-shrink-0">
            <div class="flex items-center gap-3">
              <div class="p-1.5 bg-indigo-500/15 border border-indigo-500/30 rounded-lg text-indigo-400">
                <Terminal class="w-4 h-4" />
              </div>
              <div>
                <h2 class="text-sm font-bold text-gray-100 flex items-center gap-2">
                  <span>Developer Diagnostics & Git Console</span>
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h2>
                <p class="text-[11px] text-gray-400 font-mono">
                  Inspect Git command executions, stderr traces & Go runtime health
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

          {/* Navigation Bar */}
          <div class="px-5 py-2 bg-carbon-surface border-b border-gray-800 flex items-center justify-between gap-2 flex-wrap flex-shrink-0">
            <div class="flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab("console")}
                class={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab() === "console"
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-xs"
                    : "text-gray-400 hover:text-gray-200 hover:bg-carbon-hover"
                }`}
              >
                <Terminal class="w-3.5 h-3.5" />
                <span>Git Console Logs</span>
                <span class="px-1.5 py-0.2 bg-carbon-base rounded-full font-mono text-[10px] text-gray-300">
                  {logs().length}
                </span>
                <Show when={errorLogCount() > 0}>
                  <span class="px-1.5 py-0.2 bg-rose-500/20 text-rose-300 rounded-full font-mono text-[10px] font-bold">
                    {errorLogCount()} err
                  </span>
                </Show>
              </button>

              <button
                onClick={() => setActiveTab("telemetry")}
                class={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab() === "telemetry"
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-xs"
                    : "text-gray-400 hover:text-gray-200 hover:bg-carbon-hover"
                }`}
              >
                <Activity class="w-3.5 h-3.5" />
                <span>Go Engine Telemetry</span>
              </button>

              <button
                onClick={() => setActiveTab("cache")}
                class={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab() === "cache"
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-xs"
                    : "text-gray-400 hover:text-gray-200 hover:bg-carbon-hover"
                }`}
              >
                <HardDrive class="w-3.5 h-3.5" />
                <span>Cache & Storage</span>
              </button>
            </div>

            <div class="flex items-center gap-1.5">
              <button
                onClick={handleCopySystemReport}
                class="px-2.5 py-1 bg-carbon-base hover:bg-carbon-hover border border-carbon-border rounded-lg text-gray-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                title="Copy comprehensive markdown diagnostic report for sharing"
              >
                <Show
                  when={copiedId() === "report"}
                  fallback={<Copy class="w-3 h-3 text-indigo-400" />}
                >
                  <Check class="w-3 h-3 text-emerald-400" />
                </Show>
                <span>{copiedId() === "report" ? "Copied Report" : "Copy Report"}</span>
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div class="flex-1 overflow-hidden flex flex-col p-5">
            {/* TAB 1: GIT COMMAND CONSOLE */}
            <Show when={activeTab() === "console"}>
              <div class="flex flex-col h-full space-y-3 overflow-hidden">
                {/* Console Toolbar */}
                <div class="flex items-center justify-between gap-3 flex-wrap flex-shrink-0">
                  <div class="relative flex items-center flex-1 max-w-sm">
                    <Search class="w-3.5 h-3.5 text-gray-500 absolute left-2.5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Filter Git commands or stderr traces..."
                      value={searchQuery()}
                      onInput={(e) => setSearchQuery(e.currentTarget.value)}
                      class="w-full pl-8 pr-3 py-1 bg-[#151926] border border-gray-700/60 rounded-lg text-gray-200 placeholder-gray-500 font-mono text-xs focus:outline-none focus:border-indigo-400 transition-colors"
                    />
                  </div>

                  <div class="flex items-center gap-2">
                    <div class="flex items-center bg-[#151926] border border-gray-700/60 rounded-lg p-0.5">
                      <button
                        onClick={() => setFilterMode("all")}
                        class={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                          filterMode() === "all"
                            ? "bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/40"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        All ({logs().length})
                      </button>
                      <button
                        onClick={() => setFilterMode("errors")}
                        class={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                          filterMode() === "errors"
                            ? "bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        Errors Only ({errorLogCount()})
                      </button>
                    </div>

                    <button
                      onClick={handleClearLogs}
                      class="px-2.5 py-1 bg-carbon-base hover:bg-carbon-hover border border-carbon-border rounded-lg text-gray-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Clear log history"
                    >
                      <Trash2 class="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  </div>
                </div>

                {/* Command Logs Stream */}
                <div class="flex-1 overflow-y-auto border border-gray-800 rounded-xl bg-[#080A0F] divide-y divide-gray-800/60 font-mono">
                  <Show
                    when={filteredLogs().length > 0}
                    fallback={
                      <div class="p-12 text-center text-gray-500 flex flex-col items-center gap-2">
                        <Terminal class="w-8 h-8 text-gray-600 opacity-40" />
                        <p class="font-bold text-gray-400">No Git logs matching criteria</p>
                        <p class="text-[11px]">Git commands executed by OnoGitTree will stream here in real time.</p>
                      </div>
                    }
                  >
                    <For each={filteredLogs()}>
                      {(log) => {
                        const isExpanded = () => expandedLogIds().has(log.id);
                        const repoName = log.repoPath.split("/").pop() || "global";

                        return (
                          <div class="hover:bg-[#0F131C] transition-colors">
                            {/* Row Header */}
                            <div
                              onClick={() => toggleExpand(log.id)}
                              class="px-3.5 py-2 flex items-center justify-between gap-3 cursor-pointer select-none text-[11px]"
                            >
                              <div class="flex items-center gap-2 min-w-0 flex-1">
                                <Show
                                  when={isExpanded()}
                                  fallback={<ChevronRight class="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />}
                                >
                                  <ChevronDown class="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                                </Show>

                                <span
                                  class={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase flex-shrink-0 ${
                                    log.success
                                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                      : "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
                                  }`}
                                >
                                  {log.success ? "OK" : "ERR"}
                                </span>

                                <span class="text-gray-500 text-[10px] tabular-nums flex-shrink-0">
                                  {new Date(log.timestamp).toLocaleTimeString()}
                                </span>

                                <span class="px-1.5 py-0.2 bg-carbon-elevated text-gray-400 rounded text-[10px] flex-shrink-0 truncate max-w-[110px]">
                                  {repoName}
                                </span>

                                <span
                                  class={`font-bold truncate ${
                                    log.success ? "text-gray-200" : "text-rose-300"
                                  }`}
                                >
                                  $ {log.command}
                                </span>
                              </div>

                              <div class="flex items-center gap-2 flex-shrink-0">
                                <span class="text-[10px] text-gray-500 tabular-nums">
                                  {log.durationMs}ms
                                </span>

                                <button
                                  onClick={(e) => handleCopyLog(log, e)}
                                  class="p-1 hover:bg-carbon-elevated rounded text-gray-400 hover:text-white transition-colors"
                                  title="Copy command and output"
                                >
                                  <Show
                                    when={copiedId() === log.id}
                                    fallback={<Copy class="w-3 h-3" />}
                                  >
                                    <Check class="w-3 h-3 text-emerald-400" />
                                  </Show>
                                </button>
                              </div>
                            </div>

                            {/* Expanded Details: Stdout, Stderr, and Error */}
                            <Show when={isExpanded()}>
                              <div class="px-5 py-3 bg-[#05060A] border-t border-gray-800/80 space-y-2.5 text-[11px] font-mono select-text">
                                <div class="text-gray-400">
                                  <span class="text-gray-500">Working Directory:</span>{" "}
                                  <span class="text-gray-300">{log.repoPath || "(system default)"}</span>
                                </div>

                                <Show when={log.error}>
                                  <div class="space-y-1">
                                    <span class="text-[10px] text-rose-400 font-bold uppercase tracking-wider block">
                                      Error Trace
                                    </span>
                                    <pre class="p-2.5 bg-rose-950/20 border border-rose-900/40 rounded-lg text-rose-300 whitespace-pre-wrap break-all leading-relaxed">
                                      {log.error}
                                    </pre>
                                  </div>
                                </Show>

                                <Show when={log.stderr}>
                                  <div class="space-y-1">
                                    <span class="text-[10px] text-rose-400 font-bold uppercase tracking-wider block">
                                      STDERR Output
                                    </span>
                                    <pre class="p-2.5 bg-[#12070A] border border-rose-900/30 rounded-lg text-rose-300/90 whitespace-pre-wrap break-all leading-relaxed max-h-48 overflow-y-auto">
                                      {log.stderr}
                                    </pre>
                                  </div>
                                </Show>

                                <Show when={log.stdout}>
                                  <div class="space-y-1">
                                    <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                                      STDOUT Output
                                    </span>
                                    <pre class="p-2.5 bg-[#0A0D14] border border-gray-800 rounded-lg text-gray-300 whitespace-pre-wrap break-all leading-relaxed max-h-48 overflow-y-auto">
                                      {log.stdout}
                                    </pre>
                                  </div>
                                </Show>
                              </div>
                            </Show>
                          </div>
                        );
                      }}
                    </For>
                  </Show>
                </div>
              </div>
            </Show>

            {/* TAB 2: GO ENGINE & TELEMETRY */}
            <Show when={activeTab() === "telemetry"}>
              <div class="space-y-4 overflow-y-auto flex-1">
                <Show
                  when={stats()}
                  fallback={
                    <div class="p-8 text-center text-gray-500 flex items-center justify-center gap-2">
                      <RefreshCw class="w-4 h-4 animate-spin text-indigo-400" />
                      <span>Collecting Go runtime telemetry...</span>
                    </div>
                  }
                >
                  {(s) => (
                    <div class="space-y-4">
                      {/* Metric Stat Cards Grid */}
                      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
                        <div class="bg-carbon-base border border-carbon-border/80 rounded-xl p-3.5 space-y-1">
                          <div class="flex items-center gap-1.5 text-[10.5px] text-gray-400 font-sans">
                            <HardDrive class="w-3.5 h-3.5 text-git-emerald" />
                            <span>Active Heap Alloc RAM</span>
                          </div>
                          <span class="text-xl font-black text-git-emerald tabular-nums">
                            {s().allocRamMb.toFixed(1)} MB
                          </span>
                        </div>

                        <div class="bg-carbon-base border border-carbon-border/80 rounded-xl p-3.5 space-y-1">
                          <div class="flex items-center gap-1.5 text-[10.5px] text-gray-400 font-sans">
                            <Zap class="w-3.5 h-3.5 text-git-cyan" />
                            <span>Total Process Virtual RAM</span>
                          </div>
                          <span class="text-xl font-black text-git-cyan tabular-nums">
                            {s().sysRamMb.toFixed(1)} MB
                          </span>
                        </div>

                        <div class="bg-carbon-base border border-carbon-border/80 rounded-xl p-3.5 space-y-1">
                          <div class="flex items-center gap-1.5 text-[10.5px] text-gray-400 font-sans">
                            <Cpu class="w-3.5 h-3.5 text-git-indigo" />
                            <span>Background Goroutines</span>
                          </div>
                          <span class="text-xl font-black text-git-indigo tabular-nums">
                            {s().numGoroutine}
                          </span>
                        </div>

                        <div class="bg-carbon-base border border-carbon-border/80 rounded-xl p-3.5 space-y-1">
                          <div class="flex items-center gap-1.5 text-[10.5px] text-gray-400 font-sans">
                            <FolderGit2 class="w-3.5 h-3.5 text-amber-400" />
                            <span>Active Workspace Repos</span>
                          </div>
                          <span class="text-xl font-black text-amber-300 tabular-nums">
                            {repoStore.repositories().length}
                          </span>
                        </div>

                        <div class="bg-carbon-base border border-carbon-border/80 rounded-xl p-3.5 space-y-1">
                          <div class="flex items-center gap-1.5 text-[10.5px] text-gray-400 font-sans">
                            <Cpu class="w-3.5 h-3.5 text-purple-400" />
                            <span>Logical CPU Cores</span>
                          </div>
                          <span class="text-xl font-black text-purple-300 tabular-nums">
                            {s().numCpu}
                          </span>
                        </div>

                        <div class="bg-carbon-base border border-carbon-border/80 rounded-xl p-3.5 space-y-1">
                          <div class="flex items-center gap-1.5 text-[10.5px] text-gray-400 font-sans">
                            <ShieldCheck class="w-3.5 h-3.5 text-emerald-400" />
                            <span>Git Execution Engine</span>
                          </div>
                          <span class="text-xs font-bold text-gray-200 truncate block">
                            /usr/bin/git
                          </span>
                        </div>
                      </div>

                      {/* Engine Architecture Information */}
                      <div class="bg-carbon-base border border-carbon-border rounded-xl p-4 space-y-2">
                        <h3 class="font-bold text-gray-200 text-xs">Engine Runtime Info</h3>
                        <div class="grid grid-cols-2 gap-2 text-gray-300 font-mono text-[11px]">
                          <div><span class="text-gray-500">Go Runtime:</span> go1.24+ native concurrency</div>
                          <div><span class="text-gray-500">Storage Backend:</span> SQLite embedded DB</div>
                          <div><span class="text-gray-500">Concurrency Pool:</span> 6-Worker parallel batch engine</div>
                          <div><span class="text-gray-500">Telemetry Sampling:</span> Every 2500ms</div>
                        </div>
                      </div>
                    </div>
                  )}
                </Show>
              </div>
            </Show>

            {/* TAB 3: CACHE & STORAGE */}
            <Show when={activeTab() === "cache"}>
              <div class="space-y-4 overflow-y-auto flex-1">
                <div class="bg-carbon-base border border-carbon-border rounded-xl p-4 space-y-3">
                  <div class="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 class="font-bold text-gray-200 text-xs">
                        In-Memory Diff & Commit Cache
                      </h3>
                      <p class="text-[11px] text-gray-400">
                        High-speed client cache for flicker-free diff navigation and live graph rendering.
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
            </Show>
          </div>

          {/* Modal Footer */}
          <div class="px-5 py-3 bg-[#111520] border-t border-gray-800 flex items-center justify-between flex-shrink-0">
            <button
              onClick={() => fetchData()}
              disabled={isLoading()}
              class="px-3 py-1.5 bg-carbon-base hover:bg-carbon-elevated border border-carbon-border rounded-lg text-xs text-gray-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RefreshCw
                class={`w-3.5 h-3.5 ${isLoading() ? "animate-spin text-indigo-400" : ""}`}
              />
              <span>Refresh Telemetry</span>
            </button>

            <button
              onClick={props.onClose}
              class="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-lg text-xs cursor-pointer transition-colors shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};
