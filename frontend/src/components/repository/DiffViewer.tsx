import {
  Component,
  createSignal,
  createEffect,
  createMemo,
  Show,
  For,
} from "solid-js";
import { Check, RotateCcw } from "lucide-solid";
import { repoStore } from "../../store/repoStore";
import { settingsStore } from "../../store/settingsStore";
import { ParsedLine } from "./diff/DiffInlineRow";
import { FileDiffSection, DiffFileAccordion } from "./diff/DiffFileAccordion";
import { DiffHeader } from "./diff/DiffHeader";

export const DiffViewer: Component = () => {
  const [diffContent, setDiffContent] = createSignal<string>("");
  const [isLoadingDiff, setIsLoadingDiff] = createSignal<boolean>(false);
  const [copied, setCopied] = createSignal<boolean>(false);
  const [currentHunkIndex, setCurrentHunkIndex] = createSignal<number>(0);
  const [collapsedFileIds, setCollapsedFileIds] = createSignal<Set<string>>(
    new Set<string>(),
  );

  let requestId = 0;
  let lastLoadedKey = "";

  const selectedDiff = () => repoStore.selectedFileDiff();
  const activeRepo = () => repoStore.selectedRepo();
  const viewLayout = () => settingsStore.settings().diffViewLayout || "inline";

  // Stable memoized diff target key to prevent background poll cascades
  const diffTarget = createMemo(() => {
    const diff = selectedDiff();
    const repo = activeRepo();
    if (!diff || !repo) return null;
    return {
      repoPath: repo.path,
      filePath: diff.filePath,
      staged: diff.staged,
      commitHash: diff.commitHash,
      key: `${repo.path}::${diff.commitHash || (diff.staged ? "staged" : "unstaged")}::${diff.filePath}`,
    };
  });

  // Non-destructive, glitch-free diff loader
  createEffect(async () => {
    const target = diffTarget();
    if (!target) {
      setDiffContent("");
      lastLoadedKey = "";
      return;
    }

    // Stable identity check: If same diff key is already loaded, avoid resetting DOM / scroll
    if (target.key === lastLoadedKey && diffContent().length > 0) {
      return;
    }

    const currentReq = ++requestId;

    // Only set full loader if switching to a completely new diff key with no content yet
    if (target.key !== lastLoadedKey) {
      setIsLoadingDiff(true);
    }

    try {
      const content = await repoStore.getDiff(
        target.repoPath,
        target.filePath,
        target.staged,
        target.commitHash,
      );
      if (currentReq === requestId) {
        setDiffContent(content);
        lastLoadedKey = target.key;
        setCollapsedFileIds(new Set<string>());
      }
    } catch (err) {
      if (currentReq === requestId) {
        console.error("Failed to load diff:", err);
        setDiffContent("Error loading diff.");
      }
    } finally {
      if (currentReq === requestId) {
        setIsLoadingDiff(false);
      }
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
    setCollapsedFileIds(new Set<string>(fileSections().map((f) => f.id)));
  };

  const isAllFilesExpanded = () =>
    collapsedFileIds().size === 0 && fileSections().length > 0;

  const toggleExpandAllFiles = () => {
    if (isAllFilesExpanded()) {
      collapseAllFiles();
    } else {
      expandAllFiles();
    }
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
        <div class="flex-1 flex flex-col h-full bg-[#0B0E14] text-gray-200 overflow-hidden select-none relative">
          {/* Header */}
          <DiffHeader
            diff={diff()}
            activeRepo={activeRepo()}
            filesCount={fileSections().length}
            isAllExpanded={isAllFilesExpanded()}
            onToggleExpandAll={toggleExpandAllFiles}
            onExpandAll={expandAllFiles}
            onCollapseAll={collapseAllFiles}
            onScrollToPrevHunk={scrollToPrevHunk}
            onScrollToNextHunk={scrollToNextHunk}
            onCopyDiff={copyDiff}
            isCopied={copied()}
            onClose={() => repoStore.clearFileDiff()}
          />

          {/* Top Subtle Loading Indicator Bar (does not destroy DOM or scroll) */}
          <Show when={isLoadingDiff() && diffContent().length > 0}>
            <div class="absolute top-[49px] left-0 right-0 h-0.5 bg-indigo-500/20 overflow-hidden z-20">
              <div class="h-full bg-indigo-500 animate-pulse w-full" />
            </div>
          </Show>

          {/* Content Body */}
          <div class="flex-1 overflow-auto p-4 space-y-4 font-mono text-xs select-text leading-relaxed">
            <Show
              when={diffContent().length > 0 || !isLoadingDiff()}
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
                  {(section) => (
                    <DiffFileAccordion
                      section={section}
                      isCollapsed={collapsedFileIds().has(section.id)}
                      viewLayout={viewLayout()}
                      onToggleCollapse={() => toggleFileCollapse(section.id)}
                    />
                  )}
                </For>
              </Show>
            </Show>
          </div>
        </div>
      )}
    </Show>
  );
};
