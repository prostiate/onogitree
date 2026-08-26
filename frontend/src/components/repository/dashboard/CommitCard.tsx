import { Component, Show } from "solid-js";
import { User, Calendar, ChevronRight } from "lucide-solid";
import { repoStore } from "../../../store/repoStore";
import { CommitSummary } from "../../../types/git";
import { CommitDetailsPanel } from "./CommitDetailsPanel";

interface CommitCardProps {
  commit: CommitSummary;
  copiedHash: string | null;
  onCopyText: (text: string, id: string) => void;
  onContextMenu: (e: MouseEvent, commit: CommitSummary) => void;
}

export const CommitCard: Component<CommitCardProps> = (props) => {
  const isExpanded = () =>
    repoStore.expandedCommitHashes().has(props.commit.hash);

  const handleClick = () => {
    void repoStore.toggleCommitExpanded(props.commit.hash);
  };

  return (
    <div
      class={`border rounded-xl transition-all ${
        isExpanded()
          ? "border-indigo-500/60 bg-[#121624] shadow-lg"
          : "border-gray-800/80 bg-[#0D1017] hover:bg-[#141824]"
      }`}
    >
      {/* Commit Row Header */}
      <div
        onClick={handleClick}
        onContextMenu={(e) => props.onContextMenu(e, props.commit)}
        class="p-3.5 flex items-start justify-between gap-4 cursor-pointer"
      >
        <div class="space-y-1.5 min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-mono font-bold text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {props.commit.shortHash}
            </span>
            <span class="font-semibold text-xs text-white truncate">
              {props.commit.subject}
            </span>
          </div>

          <div class="flex items-center gap-3 text-[11px] text-gray-500 font-mono">
            <span class="text-gray-400 flex items-center gap-1">
              <User class="w-3 h-3" />
              <span>{props.commit.authorName}</span>
            </span>
            <span>•</span>
            <span class="flex items-center gap-1">
              <Calendar class="w-3 h-3" />
              <span>{props.commit.relativeDate}</span>
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">
          <Show when={props.commit.refs}>
            <span class="px-2.5 py-0.5 bg-[#181D2B] text-gray-300 font-mono text-[10px] rounded-full border border-gray-700/60 shadow-sm">
              {props.commit.refs}
            </span>
          </Show>

          <button
            class={`p-1 rounded-lg text-gray-400 hover:text-white transition-transform ${
              isExpanded() ? "rotate-90 text-indigo-400" : ""
            }`}
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Commit Details */}
      <Show when={isExpanded()}>
        <CommitDetailsPanel
          commit={props.commit}
          copiedHash={props.copiedHash}
          onCopyText={props.onCopyText}
        />
      </Show>
    </div>
  );
};
