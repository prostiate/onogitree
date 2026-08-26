import { Component, createSignal, Show, onMount, onCleanup } from "solid-js";
import {
  FileCode,
  GitCommit,
  ChevronsUpDown,
  ArrowUp,
  ArrowDown,
  FoldHorizontal,
  Rows,
  Columns,
  Plus,
  Minus,
  MoreHorizontal,
  UnfoldVertical,
  FoldVertical,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  X,
} from "lucide-solid";
import { repoStore, DiffSelection } from "../../../store/repoStore";
import { settingsStore } from "../../../store/settingsStore";
import { RepoStatus } from "../../../types/git";

interface DiffHeaderProps {
  diff: DiffSelection;
  activeRepo: RepoStatus | null;
  filesCount: number;
  isAllExpanded: boolean;
  onToggleExpandAll: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onScrollToPrevHunk: () => void;
  onScrollToNextHunk: () => void;
  onCopyDiff: () => void;
  isCopied: boolean;
  onClose: () => void;
}

export const DiffHeader: Component<DiffHeaderProps> = (props) => {
  const [showMoreMenu, setShowMoreMenu] = createSignal<boolean>(false);
  let moreMenuContainerRef: HTMLDivElement | undefined;

  const handleOutsideClick = (e: MouseEvent) => {
    if (
      showMoreMenu() &&
      moreMenuContainerRef &&
      !moreMenuContainerRef.contains(e.target as Node)
    ) {
      setShowMoreMenu(false);
    }
  };

  onMount(() => {
    document.addEventListener("mousedown", handleOutsideClick);
  });

  onCleanup(() => {
    document.removeEventListener("mousedown", handleOutsideClick);
  });

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

  return (
    <div class="px-4 py-2.5 bg-[#121622] border-b border-gray-800/80 flex items-center justify-between gap-4 flex-shrink-0 shadow-md select-none">
      {/* Left side: File Path / Scope & Status Pill */}
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
          <Show
            when={props.diff.commitHash}
            fallback={<FileCode class="w-4 h-4" />}
          >
            <GitCommit class="w-4 h-4 text-cyan-400" />
          </Show>
        </div>

        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-bold text-white text-sm font-mono truncate">
              {props.diff.filePath && props.diff.filePath !== "__ALL__"
                ? props.diff.filePath
                : `Entire Commit Diff (${props.diff.commitHash?.slice(0, 7)})`}
            </span>

            <Show
              when={props.diff.commitHash}
              fallback={
                <span
                  class={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                    props.diff.staged
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  }`}
                >
                  {props.diff.staged ? "Staged" : "Working Tree"}
                </span>
              }
            >
              <span class="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded text-[10px] font-mono font-bold">
                {props.diff.filePath && props.diff.filePath !== "__ALL__"
                  ? `Commit ${props.diff.commitHash?.slice(0, 7)}`
                  : `${props.filesCount} Files in Commit`}
              </span>
            </Show>
          </div>
          <p class="text-[11px] text-gray-500 font-mono truncate">
            {props.diff.filePath && props.diff.filePath !== "__ALL__"
              ? `${props.activeRepo?.path}/${props.diff.filePath}`
              : `${props.activeRepo?.name} • All modified hunks across this commit`}
          </p>
        </div>
      </div>

      {/* Right side: Control Actions & Expand/Collapse All Buttons */}
      <div class="flex items-center gap-1.5 flex-shrink-0">
        {/* Expand All / Collapse All */}
        <button
          onClick={props.onToggleExpandAll}
          class="px-2.5 py-1 bg-[#181D2B] hover:bg-[#22293D] border border-gray-700/60 rounded-lg text-xs font-medium text-gray-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
          title={
            props.isAllExpanded
              ? "Collapse all files in diff"
              : "Expand all files in diff"
          }
        >
          <Show
            when={props.isAllExpanded}
            fallback={<ChevronsUpDown class="w-3.5 h-3.5 text-indigo-400" />}
          >
            <ChevronsUpDown class="w-3.5 h-3.5 text-amber-400 rotate-90" />
          </Show>
          <span>{props.isAllExpanded ? "Collapse All" : "Expand All"}</span>
        </button>

        {/* Hunk Navigation */}
        <div class="flex items-center bg-[#181D2B] border border-gray-700/60 rounded-lg p-0.5">
          <button
            onClick={props.onScrollToPrevHunk}
            class="p-1 hover:bg-[#22293D] text-gray-400 hover:text-white rounded transition-colors cursor-pointer"
            title="Previous Change (Hunk)"
          >
            <ArrowUp class="w-3.5 h-3.5" />
          </button>
          <button
            onClick={props.onScrollToNextHunk}
            class="p-1 hover:bg-[#22293D] text-gray-400 hover:text-white rounded transition-colors cursor-pointer"
            title="Next Change (Hunk)"
          >
            <ArrowDown class="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Collapse Unchanged */}
        <button
          onClick={toggleCollapseUnchanged}
          class={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
            collapseUnchanged()
              ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
              : "bg-[#181D2B] border-gray-700/60 text-gray-400 hover:text-white"
          }`}
          title="Toggle Collapse Unchanged Regions"
        >
          <FoldHorizontal class="w-3.5 h-3.5" />
        </button>

        {/* View Layout (Inline vs Split) */}
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
        <Show
          when={
            !props.diff.commitHash &&
            props.diff.filePath &&
            props.diff.filePath !== "__ALL__"
          }
        >
          <Show
            when={props.diff.staged}
            fallback={
              <button
                onClick={() => {
                  if (props.activeRepo)
                    void repoStore.stageFiles(props.activeRepo.path, [
                      props.diff.filePath,
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
                if (props.activeRepo)
                  void repoStore.unstageFiles(props.activeRepo.path, [
                    props.diff.filePath,
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
        <div ref={moreMenuContainerRef} class="relative">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu())}
            class="p-1.5 bg-[#181D2B] hover:bg-[#22293D] border border-gray-700/60 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="More Diff Actions"
          >
            <MoreHorizontal class="w-3.5 h-3.5" />
          </button>

          <Show when={showMoreMenu()}>
            <div class="absolute right-0 top-8 w-52 bg-carbon-surface border border-carbon-border rounded-xl shadow-2xl py-1 z-40 text-xs backdrop-blur-md">
              <button
                onClick={() => {
                  toggleViewLayout();
                  setShowMoreMenu(false);
                }}
                class="w-full text-left px-3 py-1.5 hover:bg-carbon-hover flex items-center justify-between text-gray-200 cursor-pointer"
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
                class="w-full text-left px-3 py-1.5 hover:bg-carbon-hover flex items-center justify-between text-gray-200 cursor-pointer"
              >
                <span>Collapse Unchanged</span>
                <Show when={collapseUnchanged()}>
                  <span class="text-indigo-400">✓</span>
                </Show>
              </button>

              <div class="my-1 border-t border-carbon-border" />

              <button
                onClick={() => {
                  props.onExpandAll();
                  setShowMoreMenu(false);
                }}
                class="w-full text-left px-3 py-1.5 hover:bg-carbon-hover flex items-center gap-2 text-gray-200 cursor-pointer"
              >
                <UnfoldVertical class="w-3.5 h-3.5 text-indigo-400" />
                <span>Expand All Files</span>
              </button>

              <button
                onClick={() => {
                  props.onCollapseAll();
                  setShowMoreMenu(false);
                }}
                class="w-full text-left px-3 py-1.5 hover:bg-carbon-hover flex items-center gap-2 text-gray-200 cursor-pointer"
              >
                <FoldVertical class="w-3.5 h-3.5 text-gray-400" />
                <span>Collapse All Files</span>
              </button>

              <div class="my-1 border-t border-carbon-border" />

              <button
                onClick={() => {
                  props.onCopyDiff();
                  setShowMoreMenu(false);
                }}
                class="w-full text-left px-3 py-1.5 hover:bg-carbon-hover flex items-center gap-2 text-gray-200 cursor-pointer"
              >
                <Show
                  when={props.isCopied}
                  fallback={<Copy class="w-3.5 h-3.5 text-gray-400" />}
                >
                  <Check class="w-3.5 h-3.5 text-emerald-400" />
                </Show>
                <span>{props.isCopied ? "Copied Diff!" : "Copy Raw Diff"}</span>
              </button>

              <Show
                when={
                  props.diff.filePath && props.diff.filePath !== "__ALL__"
                }
              >
                <button
                  onClick={() => {
                    if (props.activeRepo)
                      void repoStore.openPath(
                        `${props.activeRepo.path}/${props.diff.filePath}`,
                      );
                    setShowMoreMenu(false);
                  }}
                  class="w-full text-left px-3 py-1.5 hover:bg-carbon-hover flex items-center gap-2 text-gray-200 cursor-pointer"
                >
                  <ExternalLink class="w-3.5 h-3.5 text-gray-400" />
                  <span>Open File in System Editor</span>
                </button>
              </Show>

              <Show
                when={
                  !props.diff.commitHash &&
                  props.diff.filePath &&
                  props.diff.filePath !== "__ALL__"
                }
              >
                <div class="my-1 border-t border-carbon-border" />

                <button
                  onClick={() => {
                    if (
                      props.activeRepo &&
                      confirm(
                        `Discard changes to "${props.diff.filePath}"? This cannot be undone.`,
                      )
                    ) {
                      void repoStore.discardFiles(props.activeRepo.path, [
                        props.diff.filePath,
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

        {/* Close Button */}
        <button
          onClick={props.onClose}
          class="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          title="Close Diff Viewer (Esc)"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
