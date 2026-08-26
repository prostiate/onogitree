import { Component, Show } from "solid-js";
import { FileDiff, ChevronRight } from "lucide-solid";
import { repoStore } from "../../../store/repoStore";
import { CommitSummary } from "../../../types/git";
import { RefBadgePills } from "../../common/RefBadgePills";
import { GraphSvgSpine, ProcessedGraphNode } from "./GraphSvgSpine";
import { CommitInspectorPanel } from "./CommitInspectorPanel";

interface GraphNodeRowProps {
  node: ProcessedGraphNode;
  index: number;
  gutterWidth: number;
  hasOutgoing: boolean;
  copiedHash: string | null;
  onCopyText: (text: string, id: string) => void;
  onContextMenu: (e: MouseEvent, commit: CommitSummary) => void;
}

export const GraphNodeRow: Component<GraphNodeRowProps> = (props) => {
  const commit = () => props.node.commit;
  const isExpanded = () =>
    repoStore.expandedCommitHashes().has(commit().hash);

  return (
    <div
      class={`group flex items-stretch transition-colors select-none ${
        isExpanded()
          ? "bg-[#EEF2FF] dark:bg-[#121624]"
          : "hover:bg-[#F4F1EA] dark:hover:bg-[#161B26]"
      }`}
    >
      {/* SVG Spine */}
      <GraphSvgSpine
        node={props.node}
        index={props.index}
        gutterWidth={props.gutterWidth}
        isExpanded={isExpanded()}
        hasOutgoing={props.hasOutgoing}
      />

      {/* Commit Content Body */}
      <div class="flex-1 min-w-0 py-2.5 pr-4 flex flex-col justify-center border-b border-gray-100/80 dark:border-gray-800/30">
        <div
          onClick={() => repoStore.toggleCommitExpanded(commit().hash)}
          onContextMenu={(e) => props.onContextMenu(e, commit())}
          class="flex items-center justify-between gap-3 cursor-pointer"
        >
          {/* Subject, Author & Ref Pills */}
          <div class="flex items-center gap-2.5 min-w-0 flex-1 flex-wrap">
            <span class="font-medium text-xs text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 truncate">
              {commit().subject}
            </span>

            <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">
              {commit().authorName}
            </span>

            <RefBadgePills refs={commit().refs} />
          </div>

          {/* Right Action Icons & Date */}
          <div class="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 font-mono flex-shrink-0">
            <span class="hidden md:inline">{commit().relativeDate}</span>

            {/* Quick Diff Action Icon */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                void repoStore.selectFileForDiff(
                  "__ALL__",
                  false,
                  commit().hash,
                );
              }}
              class="p-1 hover:bg-gray-200 dark:hover:bg-carbon-hover text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-300 rounded opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
              title="Inspect commit diff"
            >
              <FileDiff class="w-3.5 h-3.5" />
            </button>

            <button
              class={`p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-transform ${
                isExpanded()
                  ? "rotate-90 text-indigo-600 dark:text-indigo-400"
                  : ""
              }`}
            >
              <ChevronRight class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Expanded Commit Details */}
        <Show when={isExpanded()}>
          <CommitInspectorPanel
            commit={commit()}
            copiedHash={props.copiedHash}
            onCopyText={props.onCopyText}
          />
        </Show>
      </div>
    </div>
  );
};
