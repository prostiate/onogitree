import {
  Component,
  createSignal,
  createEffect,
  createMemo,
  Show,
  For,
} from "solid-js";
import {
  FileCode,
  X,
  Plus,
  Minus,
  Trash2,
  Copy,
  ExternalLink,
  Check,
  RotateCcw,
  FoldHorizontal,
  Columns,
  Rows,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  GitCommit,
} from "lucide-solid";
import { repoStore } from "../../store/repoStore";
import { settingsStore } from "../../store/settingsStore";

interface ParsedLine {
  id: number;
  line: string;
  type: "header" | "hunk" | "addition" | "deletion" | "context";
  oldLineNo?: number;
  newLineNo?: number;
}

export const DiffViewer: Component = () => {
  const [diffContent, setDiffContent] = createSignal<string>("");
  const [isLoadingDiff, setIsLoadingDiff] = createSignal<boolean>(false);
  const [copied, setCopied] = createSignal<boolean>(false);
  const [showMoreMenu, setShowMoreMenu] = createSignal<boolean>(false);
  const [currentHunkIndex, setCurrentHunkIndex] = createSignal<number>(0);

  const selectedDiff = () => repoStore.selectedFileDiff();
  const activeRepo = () => repoStore.selectedRepo();
  const viewLayout = () => settingsStore.settings().diffViewLayout || "inline";
  const collapseUnchanged = () =>
    settingsStore.settings().diffCollapseUnchanged ?? true;

  const toggleViewLayout = () => {
    const next = viewLayout() === "inline" ? "split" : "inline";
    settingsStore.updateSetting("diffViewLayout", next);
  };

  const toggleCollapseUnchanged = () => {
    const next = !collapseUnchanged();
    settingsStore.updateSetting("diffCollapseUnchanged", next);
  };

  createEffect(async () => {
    const diff = selectedDiff();
    const repo = activeRepo();
    if (!diff || !repo) {
      setDiffContent("");
      return;
    }

    try {
      // Use cached fast diff loader to prevent flashing
      const content = await repoStore.getDiff(
        repo.path,
        diff.filePath,
        diff.staged,
        diff.commitHash,
      );
      setDiffContent(content);
    } catch (err) {
      console.error("Failed to load diff:", err);
      setDiffContent("Error loading diff.");
    } finally {
      setIsLoadingDiff(false);
    }
  });

  const parsedLines = createMemo<ParsedLine[]>(() => {
    const raw = diffContent();
    if (!raw) return [];

    const lines = raw.split("\n");
    const result: ParsedLine[] = [];
    let oldLine = 0;
    let newLine = 0;

    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      let type: ParsedLine["type"] = "context";

      if (
        line.startsWith("diff --git") ||
        line.startsWith("index ") ||
        line.startsWith("---") ||
        line.startsWith("+++")
      ) {
        type = "header";
        result.push({ id: idx, line, type });
      } else if (line.startsWith("@@")) {
        type = "hunk";
        const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
        if (match) {
          oldLine = parseInt(match[1], 10) - 1;
          newLine = parseInt(match[2], 10) - 1;
        }
        result.push({ id: idx, line, type });
      } else if (line.startsWith("+")) {
        type = "addition";
        newLine++;
        result.push({ id: idx, line, type, newLineNo: newLine });
      } else if (line.startsWith("-")) {
        type = "deletion";
        oldLine++;
        result.push({ id: idx, line, type, oldLineNo: oldLine });
      } else {
        type = "context";
        oldLine++;
        newLine++;
        result.push({
          id: idx,
          line,
          type,
          oldLineNo: oldLine,
          newLineNo: newLine,
        });
      }
    }
    return result;
  });

  const hunks = createMemo(() =>
    parsedLines().filter((l) => l.type === "hunk"),
  );

  const scrollToNextHunk = () => {
    const hunkList = hunks();
    if (hunkList.length === 0) return;
    const nextIdx = (currentHunkIndex() + 1) % hunkList.length;
    setCurrentHunkIndex(nextIdx);
    const target = document.getElementById(`hunk-${nextIdx}`);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToPrevHunk = () => {
    const hunkList = hunks();
    if (hunkList.length === 0) return;
    const prevIdx =
      (currentHunkIndex() - 1 + hunkList.length) % hunkList.length;
    setCurrentHunkIndex(prevIdx);
    const target = document.getElementById(`hunk-${prevIdx}`);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const copyDiff = () => {
    void navigator.clipboard.writeText(diffContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Show when={selectedDiff()}>
      {(diff) => (
        <div class="flex-1 flex flex-col h-full bg-[#0B0E14] text-gray-200 overflow-hidden select-none">
          {/* Top Diff Header Bar */}
          <div class="px-4 py-2.5 bg-[#121622] border-b border-gray-800/80 flex items-center justify-between gap-4 flex-shrink-0 shadow-md">
            {/* Left side: File Path & Status Pill */}
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
                <Show
                  when={diff().commitHash}
                  fallback={<FileCode class="w-4 h-4" />}
                >
                  <GitCommit class="w-4 h-4 text-cyan-400" />
                </Show>
              </div>

              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-white text-sm font-mono truncate">
                    {diff().filePath}
                  </span>

                  <Show
                    when={diff().commitHash}
                    fallback={
                      <span
                        class={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                          diff().staged
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        }`}
                      >
                        {diff().staged ? "Staged" : "Working Tree"}
                      </span>
                    }
                  >
                    <span class="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded text-[10px] font-mono font-bold">
                      Commit {diff().commitHash?.slice(0, 7)}
                    </span>
                  </Show>
                </div>
                <p class="text-[11px] text-gray-500 font-mono truncate">
                  {activeRepo()?.path}/{diff().filePath}
                </p>
              </div>
            </div>

            {/* Right side: Persistent Control Actions matching Screenshots */}
            <div class="flex items-center gap-1.5 flex-shrink-0">
              {/* Previous / Next Hunk Navigation */}
              <div class="flex items-center bg-[#181D2B] border border-gray-700/60 rounded-lg p-0.5">
                <button
                  onClick={scrollToPrevHunk}
                  class="p-1 hover:bg-[#22293D] text-gray-400 hover:text-white rounded transition-colors cursor-pointer"
                  title="Previous Change (Hunk)"
                >
                  <ArrowUp class="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={scrollToNextHunk}
                  class="p-1 hover:bg-[#22293D] text-gray-400 hover:text-white rounded transition-colors cursor-pointer"
                  title="Next Change (Hunk)"
                >
                  <ArrowDown class="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Toggle Collapse Unchanged Regions Button */}
              <button
                onClick={toggleCollapseUnchanged}
                class={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  collapseUnchanged()
                    ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                    : "bg-[#181D2B] border-gray-700/60 text-gray-400 hover:text-white"
                }`}
                title="Toggle Collapse Unchanged Regions (Saved)"
              >
                <FoldHorizontal class="w-3.5 h-3.5" />
              </button>

              {/* Toggle Inline vs Split View */}
              <button
                onClick={toggleViewLayout}
                class="p-1.5 bg-[#181D2B] hover:bg-[#22293D] border border-gray-700/60 rounded-lg text-gray-300 hover:text-white transition-colors cursor-pointer"
                title={
                  viewLayout() === "inline"
                    ? "Switch to Side-by-Side (Split) View"
                    : "Switch to Inline View"
                }
              >
                <Show
                  when={viewLayout() === "inline"}
                  fallback={<Rows class="w-3.5 h-3.5 text-indigo-400" />}
                >
                  <Columns class="w-3.5 h-3.5 text-indigo-400" />
                </Show>
              </button>

              {/* Stage / Unstage Quick Action */}
              <Show when={!diff().commitHash}>
                <Show
                  when={diff().staged}
                  fallback={
                    <button
                      onClick={() => {
                        const repo = activeRepo();
                        if (repo)
                          void repoStore.stageFiles(repo.path, [
                            diff().filePath,
                          ]);
                      }}
                      class="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                    >
                      <Plus class="w-3 h-3 stroke-[3]" />
                      <span>Stage</span>
                    </button>
                  }
                >
                  <button
                    onClick={() => {
                      const repo = activeRepo();
                      if (repo)
                        void repoStore.unstageFiles(repo.path, [
                          diff().filePath,
                        ]);
                    }}
                    class="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Minus class="w-3 h-3 stroke-[3]" />
                    <span>Unstage</span>
                  </button>
                </Show>
              </Show>

              {/* More Options Dropdown */}
              <div class="relative">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu())}
                  class="p-1.5 bg-[#181D2B] hover:bg-[#22293D] border border-gray-700/60 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
                  title="More Diff Actions"
                >
                  <MoreHorizontal class="w-3.5 h-3.5" />
                </button>

                <Show when={showMoreMenu()}>
                  <div class="absolute right-0 top-8 w-52 bg-[#141824] border border-gray-700/80 rounded-xl shadow-2xl py-1 z-40 text-xs backdrop-blur-md">
                    <button
                      onClick={() => {
                        toggleViewLayout();
                        setShowMoreMenu(false);
                      }}
                      class="w-full text-left px-3 py-1.5 hover:bg-[#1E2436] flex items-center justify-between text-gray-200 cursor-pointer"
                    >
                      <span>
                        {viewLayout() === "inline"
                          ? "Side-by-Side View"
                          : "Inline View"}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        toggleCollapseUnchanged();
                        setShowMoreMenu(false);
                      }}
                      class="w-full text-left px-3 py-1.5 hover:bg-[#1E2436] flex items-center justify-between text-gray-200 cursor-pointer"
                    >
                      <span>Collapse Unchanged</span>
                      <Show when={collapseUnchanged()}>
                        <span class="text-indigo-400">✓</span>
                      </Show>
                    </button>

                    <div class="my-1 border-t border-gray-800" />

                    <button
                      onClick={() => {
                        copyDiff();
                        setShowMoreMenu(false);
                      }}
                      class="w-full text-left px-3 py-1.5 hover:bg-[#1E2436] flex items-center gap-2 text-gray-200 cursor-pointer"
                    >
                      <Show
                        when={copied()}
                        fallback={<Copy class="w-3.5 h-3.5 text-gray-400" />}
                      >
                        <Check class="w-3.5 h-3.5 text-emerald-400" />
                      </Show>
                      <span>{copied() ? "Copied Diff!" : "Copy Raw Diff"}</span>
                    </button>

                    <button
                      onClick={() => {
                        const repo = activeRepo();
                        if (repo)
                          void repoStore.openPath(
                            `${repo.path}/${diff().filePath}`,
                          );
                        setShowMoreMenu(false);
                      }}
                      class="w-full text-left px-3 py-1.5 hover:bg-[#1E2436] flex items-center gap-2 text-gray-200 cursor-pointer"
                    >
                      <ExternalLink class="w-3.5 h-3.5 text-gray-400" />
                      <span>Open File in System Editor</span>
                    </button>

                    <Show when={!diff().commitHash}>
                      <div class="my-1 border-t border-gray-800" />

                      <button
                        onClick={() => {
                          const repo = activeRepo();
                          if (
                            repo &&
                            confirm(
                              `Discard changes to "${diff().filePath}"? This cannot be undone.`,
                            )
                          ) {
                            void repoStore.discardFiles(repo.path, [
                              diff().filePath,
                            ]);
                          }
                          setShowMoreMenu(false);
                        }}
                        class="w-full text-left px-3 py-1.5 hover:bg-rose-500/20 flex items-center gap-2 text-rose-400 cursor-pointer"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                        <span>Discard Changes...</span>
                      </button>
                    </Show>
                  </div>
                </Show>
              </div>

              <div class="h-4 w-px bg-gray-700 mx-1" />

              {/* Close Diff Button */}
              <button
                onClick={() => repoStore.clearFileDiff()}
                class="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Close Diff Viewer (Esc)"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Diff Content Body */}
          <div class="flex-1 overflow-auto p-4 font-mono text-xs select-text leading-relaxed">
            <Show
              when={!isLoadingDiff()}
              fallback={
                <div class="flex items-center justify-center h-full text-gray-500 gap-2 font-sans">
                  <RotateCcw class="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Loading diff stream...</span>
                </div>
              }
            >
              <Show
                when={parsedLines().length > 0}
                fallback={
                  <div class="flex flex-col items-center justify-center h-full text-gray-500 gap-2 font-sans">
                    <Check class="w-8 h-8 text-emerald-400 opacity-60" />
                    <p class="font-semibold text-gray-300">
                      No differences detected
                    </p>
                    <p class="text-xs">
                      File content matches the Git index or HEAD.
                    </p>
                  </div>
                }
              >
                <div class="rounded-xl border border-gray-800/80 overflow-hidden bg-[#0A0D14] shadow-xl">
                  {/* Inline Layout */}
                  <Show when={viewLayout() === "inline"}>
                    <For each={parsedLines()}>
                      {(item) => {
                        let hunkNum = -1;
                        if (item.type === "hunk") {
                          hunkNum = hunks().findIndex((h) => h.id === item.id);
                        }

                        if (item.type === "hunk") {
                          return (
                            <div
                              id={`hunk-${hunkNum}`}
                              class="px-4 py-1.5 bg-[#161B2B] text-indigo-300 font-bold border-y border-indigo-500/20 text-[11px] select-none flex items-center justify-between"
                            >
                              <span>{item.line}</span>
                              <span class="text-[10px] text-gray-500 font-normal">
                                Hunk {hunkNum + 1} of {hunks().length}
                              </span>
                            </div>
                          );
                        }
                        if (item.type === "addition") {
                          return (
                            <div class="px-3 py-0.5 bg-emerald-500/15 text-emerald-200 border-l-2 border-l-emerald-500 flex items-start hover:bg-emerald-500/20 transition-colors">
                              <span class="w-8 text-right text-gray-600 select-none mr-2 text-[10.5px]"></span>
                              <span class="w-8 text-right text-emerald-400/80 select-none mr-3 text-[10.5px] font-bold">
                                {item.newLineNo}
                              </span>
                              <span class="text-emerald-400 select-none mr-2 font-bold">
                                +
                              </span>
                              <pre class="flex-1 whitespace-pre-wrap font-mono break-all">
                                {item.line.slice(1)}
                              </pre>
                            </div>
                          );
                        }
                        if (item.type === "deletion") {
                          return (
                            <div class="px-3 py-0.5 bg-rose-500/15 text-rose-300 border-l-2 border-l-rose-500 flex items-start hover:bg-rose-500/20 transition-colors">
                              <span class="w-8 text-right text-rose-400/80 select-none mr-2 text-[10.5px] font-bold">
                                {item.oldLineNo}
                              </span>
                              <span class="w-8 text-right text-gray-600 select-none mr-3 text-[10.5px]"></span>
                              <span class="text-rose-400 select-none mr-2 font-bold">
                                -
                              </span>
                              <pre class="flex-1 whitespace-pre-wrap font-mono break-all line-through opacity-80">
                                {item.line.slice(1)}
                              </pre>
                            </div>
                          );
                        }
                        if (item.type === "header") {
                          return (
                            <div class="px-4 py-0.5 text-gray-500 bg-[#0E121B] text-[11px]">
                              {item.line}
                            </div>
                          );
                        }
                        return (
                          <div class="px-3 py-0.5 text-gray-300 hover:bg-[#111522] flex items-start">
                            <span class="w-8 text-right text-gray-600 select-none mr-2 text-[10.5px]">
                              {item.oldLineNo}
                            </span>
                            <span class="w-8 text-right text-gray-600 select-none mr-3 text-[10.5px]">
                              {item.newLineNo}
                            </span>
                            <span class="select-none mr-2 opacity-20"> </span>
                            <pre class="flex-1 whitespace-pre-wrap font-mono break-all">
                              {item.line}
                            </pre>
                          </div>
                        );
                      }}
                    </For>
                  </Show>

                  {/* Side-by-Side (Split) Layout */}
                  <Show when={viewLayout() === "split"}>
                    <div class="divide-y divide-gray-800/40">
                      <For each={parsedLines()}>
                        {(item) => {
                          if (item.type === "hunk") {
                            return (
                              <div class="px-4 py-1.5 bg-[#161B2B] text-indigo-300 font-bold border-y border-indigo-500/20 text-[11px] select-none">
                                {item.line}
                              </div>
                            );
                          }
                          if (item.type === "header") {
                            return (
                              <div class="px-4 py-0.5 text-gray-500 bg-[#0E121B] text-[11px]">
                                {item.line}
                              </div>
                            );
                          }
                          return (
                            <div class="grid grid-cols-2 divide-x divide-gray-800 text-[11.5px]">
                              {/* Left Column: Old Version */}
                              <div
                                class={`px-3 py-0.5 flex items-start ${
                                  item.type === "deletion"
                                    ? "bg-rose-500/15 text-rose-300"
                                    : item.type === "addition"
                                      ? "bg-transparent text-transparent"
                                      : "text-gray-300"
                                }`}
                              >
                                <span class="w-7 text-right text-gray-600 select-none mr-2 text-[10px]">
                                  {item.oldLineNo || ""}
                                </span>
                                <span class="mr-2 select-none">
                                  {item.type === "deletion" ? "-" : " "}
                                </span>
                                <pre class="flex-1 whitespace-pre-wrap font-mono break-all">
                                  {item.type === "deletion"
                                    ? item.line.slice(1)
                                    : item.type === "addition"
                                      ? ""
                                      : item.line}
                                </pre>
                              </div>

                              {/* Right Column: New Version */}
                              <div
                                class={`px-3 py-0.5 flex items-start ${
                                  item.type === "addition"
                                    ? "bg-emerald-500/15 text-emerald-200"
                                    : item.type === "deletion"
                                      ? "bg-transparent text-transparent"
                                      : "text-gray-300"
                                }`}
                              >
                                <span class="w-7 text-right text-gray-600 select-none mr-2 text-[10px]">
                                  {item.newLineNo || ""}
                                </span>
                                <span class="mr-2 select-none">
                                  {item.type === "addition" ? "+" : " "}
                                </span>
                                <pre class="flex-1 whitespace-pre-wrap font-mono break-all">
                                  {item.type === "addition"
                                    ? item.line.slice(1)
                                    : item.type === "deletion"
                                      ? ""
                                      : item.line}
                                </pre>
                              </div>
                            </div>
                          );
                        }}
                      </For>
                    </div>
                  </Show>
                </div>
              </Show>
            </Show>
          </div>
        </div>
      )}
    </Show>
  );
};
