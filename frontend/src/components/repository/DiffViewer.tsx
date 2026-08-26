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
  ChevronDown,
  ChevronRight,
  FoldVertical,
  UnfoldVertical,
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

interface FileDiffSection {
  id: string;
  filePath: string;
  lines: ParsedLine[];
  additions: number;
  deletions: number;
}

export const DiffViewer: Component = () => {
  const [diffContent, setDiffContent] = createSignal<string>("");
  const [isLoadingDiff, setIsLoadingDiff] = createSignal<boolean>(false);
  const [copied, setCopied] = createSignal<boolean>(false);
  const [showMoreMenu, setShowMoreMenu] = createSignal<boolean>(false);
  const [currentHunkIndex, setCurrentHunkIndex] = createSignal<number>(0);
  const [collapsedFileIds, setCollapsedFileIds] = createSignal<Set<string>>(
    new Set<string>(),
  );

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
      const content = await repoStore.getDiff(
        repo.path,
        diff.filePath,
        diff.staged,
        diff.commitHash,
      );
      setDiffContent(content);
      // Reset collapsed files on new diff load (all expanded by default)
      setCollapsedFileIds(new Set<string>());
    } catch (err) {
      console.error("Failed to load diff:", err);
      setDiffContent("Error loading diff.");
    } finally {
      setIsLoadingDiff(false);
    }
  });

  // Parse raw git diff stream into distinct FileDiffSection[]
  const fileSections = createMemo<FileDiffSection[]>(() => {
    const raw = diffContent();
    if (!raw) return [];

    const lines = raw.split("\n");
    const sections: FileDiffSection[] = [];
    let currentSection: FileDiffSection | null = null;
    let oldLine = 0;
    let newLine = 0;
    let lineCounter = 0;

    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];

      // Detect start of a new file diff: "diff --git a/... b/..."
      if (line.startsWith("diff --git")) {
        if (currentSection) {
          sections.push(currentSection);
        }

        // Extract filePath from "diff --git a/... b/..."
        const match = line.match(/diff --git a\/(.*) b\/(.*)/);
        const path = match ? match[2] : `file-${sections.length + 1}`;

        currentSection = {
          id: `file-${sections.length}-${path}`,
          filePath: path,
          lines: [],
          additions: 0,
          deletions: 0,
        };
        oldLine = 0;
        newLine = 0;
      }

      if (!currentSection) {
        // Fallback for single file diffs without diff --git header
        const fallbackPath =
          selectedDiff()?.filePath && selectedDiff()?.filePath !== "__ALL__"
            ? selectedDiff()!.filePath
            : "diff-output";
        currentSection = {
          id: `file-0-${fallbackPath}`,
          filePath: fallbackPath,
          lines: [],
          additions: 0,
          deletions: 0,
        };
      }

      lineCounter++;
      let type: ParsedLine["type"] = "context";

      if (
        line.startsWith("diff --git") ||
        line.startsWith("index ") ||
        line.startsWith("---") ||
        line.startsWith("+++")
      ) {
        type = "header";
        currentSection.lines.push({ id: lineCounter, line, type });
      } else if (line.startsWith("@@")) {
        type = "hunk";
        const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
        if (match) {
          oldLine = parseInt(match[1], 10) - 1;
          newLine = parseInt(match[2], 10) - 1;
        }
        currentSection.lines.push({ id: lineCounter, line, type });
      } else if (line.startsWith("+")) {
        type = "addition";
        newLine++;
        currentSection.additions++;
        currentSection.lines.push({
          id: lineCounter,
          line,
          type,
          newLineNo: newLine,
        });
      } else if (line.startsWith("-")) {
        type = "deletion";
        oldLine++;
        currentSection.deletions++;
        currentSection.lines.push({
          id: lineCounter,
          line,
          type,
          oldLineNo: oldLine,
        });
      } else {
        type = "context";
        oldLine++;
        newLine++;
        currentSection.lines.push({
          id: lineCounter,
          line,
          type,
          oldLineNo: oldLine,
          newLineNo: newLine,
        });
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  });

  const toggleFileCollapse = (fileId: string) => {
    setCollapsedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  };

  const expandAllFiles = () => {
    setCollapsedFileIds(new Set<string>());
  };

  const collapseAllFiles = () => {
    setCollapsedFileIds(new Set(fileSections().map((f) => f.id)));
  };

  const scrollToNextHunk = () => {
    const list = document.querySelectorAll("[data-hunk]");
    if (list.length === 0) return;
    const nextIdx = (currentHunkIndex() + 1) % list.length;
    setCurrentHunkIndex(nextIdx);
    list[nextIdx]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToPrevHunk = () => {
    const list = document.querySelectorAll("[data-hunk]");
    if (list.length === 0) return;
    const prevIdx = (currentHunkIndex() - 1 + list.length) % list.length;
    setCurrentHunkIndex(prevIdx);
    list[prevIdx]?.scrollIntoView({ behavior: "smooth", block: "start" });
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
            {/* Left side: File Path / Scope & Status Pill */}
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
                    {diff().filePath && diff().filePath !== "__ALL__"
                      ? diff().filePath
                      : `Entire Commit Diff (${diff().commitHash?.slice(0, 7)})`}
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
                      {diff().filePath && diff().filePath !== "__ALL__"
                        ? `Commit ${diff().commitHash?.slice(0, 7)}`
                        : `${fileSections().length} Files in Commit`}
                    </span>
                  </Show>
                </div>
                <p class="text-[11px] text-gray-500 font-mono truncate">
                  {diff().filePath && diff().filePath !== "__ALL__"
                    ? `${activeRepo()?.path}/${diff().filePath}`
                    : `${activeRepo()?.name} • All modified hunks across this commit`}
                </p>
              </div>
            </div>

            {/* Right side: Control Actions & Expand/Collapse All Buttons */}
            <div class="flex items-center gap-1.5 flex-shrink-0">
              {/* Expand All / Collapse All Files in Diff Accordion */}
              <div class="flex items-center bg-[#181D2B] border border-gray-700/60 rounded-lg p-0.5">
                <button
                  onClick={expandAllFiles}
                  class="px-2 py-1 hover:bg-[#22293D] text-gray-400 hover:text-white rounded text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  title="Expand All Files"
                >
                  <UnfoldVertical class="w-3.5 h-3.5 text-indigo-400" />
                  <span class="hidden sm:inline">Expand All</span>
                </button>
                <button
                  onClick={collapseAllFiles}
                  class="px-2 py-1 hover:bg-[#22293D] text-gray-400 hover:text-white rounded text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  title="Collapse All Files"
                >
                  <FoldVertical class="w-3.5 h-3.5 text-gray-400" />
                  <span class="hidden sm:inline">Collapse All</span>
                </button>
              </div>

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

              {/* Stage / Unstage Quick Action (Only for single uncommitted file) */}
              <Show
                when={
                  !diff().commitHash &&
                  diff().filePath &&
                  diff().filePath !== "__ALL__"
                }
              >
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
                        expandAllFiles();
                        setShowMoreMenu(false);
                      }}
                      class="w-full text-left px-3 py-1.5 hover:bg-[#1E2436] flex items-center gap-2 text-gray-200 cursor-pointer"
                    >
                      <UnfoldVertical class="w-3.5 h-3.5 text-indigo-400" />
                      <span>Expand All Files</span>
                    </button>

                    <button
                      onClick={() => {
                        collapseAllFiles();
                        setShowMoreMenu(false);
                      }}
                      class="w-full text-left px-3 py-1.5 hover:bg-[#1E2436] flex items-center gap-2 text-gray-200 cursor-pointer"
                    >
                      <FoldVertical class="w-3.5 h-3.5 text-gray-400" />
                      <span>Collapse All Files</span>
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

                    <Show
                      when={diff().filePath && diff().filePath !== "__ALL__"}
                    >
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
                    </Show>

                    <Show
                      when={
                        !diff().commitHash &&
                        diff().filePath &&
                        diff().filePath !== "__ALL__"
                      }
                    >
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

          {/* Diff Content Body with File Accordion Cards */}
          <div class="flex-1 overflow-auto p-4 space-y-4 font-mono text-xs select-text leading-relaxed">
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
                when={fileSections().length > 0}
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
                <For each={fileSections()}>
                  {(section) => {
                    const isCollapsed = () =>
                      collapsedFileIds().has(section.id);
                    const hunks = () =>
                      section.lines.filter((l) => l.type === "hunk");

                    return (
                      <div class="rounded-xl border border-gray-800/80 overflow-hidden bg-[#0A0D14] shadow-xl">
                        {/* File Accordion Header */}
                        <div
                          onClick={() => toggleFileCollapse(section.id)}
                          class="px-4 py-2 bg-[#121622] hover:bg-[#161B2B] border-b border-gray-800/80 flex items-center justify-between gap-3 cursor-pointer select-none transition-colors"
                        >
                          <div class="flex items-center gap-2.5 min-w-0">
                            <Show
                              when={!isCollapsed()}
                              fallback={
                                <ChevronRight class="w-4 h-4 text-gray-400" />
                              }
                            >
                              <ChevronDown class="w-4 h-4 text-indigo-400" />
                            </Show>
                            <FileCode class="w-4 h-4 text-indigo-400/80 flex-shrink-0" />
                            <span class="font-bold text-white text-xs font-mono truncate">
                              {section.filePath}
                            </span>
                          </div>

                          <div class="flex items-center gap-2 font-mono text-[11px] tabular-nums flex-shrink-0">
                            <Show when={section.additions > 0}>
                              <span class="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 font-bold rounded border border-emerald-500/30">
                                +{section.additions}
                              </span>
                            </Show>
                            <Show when={section.deletions > 0}>
                              <span class="px-1.5 py-0.5 bg-rose-500/15 text-rose-400 font-bold rounded border border-rose-500/30">
                                -{section.deletions}
                              </span>
                            </Show>
                          </div>
                        </div>

                        {/* File Diff Content (Collapsible) */}
                        <Show when={!isCollapsed()}>
                          {/* Inline Layout */}
                          <Show when={viewLayout() === "inline"}>
                            <For each={section.lines}>
                              {(item) => {
                                let hunkNum = -1;
                                if (item.type === "hunk") {
                                  hunkNum = hunks().findIndex(
                                    (h) => h.id === item.id,
                                  );
                                }

                                if (item.type === "hunk") {
                                  return (
                                    <div
                                      data-hunk={item.id}
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
                                    <span class="select-none mr-2 opacity-20">
                                      {" "}
                                    </span>
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
                              <For each={section.lines}>
                                {(item) => {
                                  if (item.type === "hunk") {
                                    return (
                                      <div
                                        data-hunk={item.id}
                                        class="px-4 py-1.5 bg-[#161B2B] text-indigo-300 font-bold border-y border-indigo-500/20 text-[11px] select-none"
                                      >
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
                        </Show>
                      </div>
                    );
                  }}
                </For>
              </Show>
            </Show>
          </div>
        </div>
      )}
    </Show>
  );
};
