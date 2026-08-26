import { Component, For, Show } from "solid-js";
import { ChevronRight, ChevronDown, FileCode } from "lucide-solid";
import { ParsedLine } from "./DiffInlineRow";
import { DiffInlineRow } from "./DiffInlineRow";
import { DiffSplitRow } from "./DiffSplitRow";

export interface FileDiffSection {
  id: string;
  filePath: string;
  lines: ParsedLine[];
  additions: number;
  deletions: number;
}

interface DiffFileAccordionProps {
  section: FileDiffSection;
  isCollapsed: boolean;
  viewLayout: "inline" | "split";
  onToggleCollapse: () => void;
}

export const DiffFileAccordion: Component<DiffFileAccordionProps> = (props) => {
  const hunks = () => props.section.lines.filter((l) => l.type === "hunk");

  return (
    <div
      class="rounded-xl border border-gray-800/80 overflow-hidden bg-[#0A0D14] shadow-xl"
      style={{
        "content-visibility": "auto",
        "contain-intrinsic-size": "0 38px",
      }}
    >
      {/* File Accordion Header */}
      <div
        onClick={props.onToggleCollapse}
        class="px-4 py-2 bg-[#121622] hover:bg-[#161B2B] border-b border-gray-800/80 flex items-center justify-between gap-3 cursor-pointer select-none transition-colors"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <Show
            when={!props.isCollapsed}
            fallback={<ChevronRight class="w-4 h-4 text-gray-400" />}
          >
            <ChevronDown class="w-4 h-4 text-indigo-400" />
          </Show>
          <FileCode class="w-4 h-4 text-indigo-400/80 flex-shrink-0" />
          <span class="font-bold text-white text-xs font-mono truncate">
            {props.section.filePath}
          </span>
        </div>

        <div class="flex items-center gap-2 font-mono text-[11px] tabular-nums flex-shrink-0">
          <Show when={props.section.additions > 0}>
            <span class="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 font-bold rounded border border-emerald-500/30">
              +{props.section.additions}
            </span>
          </Show>
          <Show when={props.section.deletions > 0}>
            <span class="px-1.5 py-0.5 bg-rose-500/15 text-rose-400 font-bold rounded border border-rose-500/30">
              -{props.section.deletions}
            </span>
          </Show>
        </div>
      </div>

      {/* File Diff Content */}
      <Show when={!props.isCollapsed}>
        <Show
          when={props.viewLayout === "inline"}
          fallback={
            <div class="divide-y divide-gray-800/40">
              <For each={props.section.lines}>
                {(item) => <DiffSplitRow item={item} />}
              </For>
            </div>
          }
        >
          <For each={props.section.lines}>
            {(item) => {
              let hunkNum = -1;
              if (item.type === "hunk") {
                hunkNum = hunks().findIndex((h) => h.id === item.id);
              }
              return (
                <DiffInlineRow
                  item={item}
                  hunkNum={hunkNum}
                  totalHunks={hunks().length}
                />
              );
            }}
          </For>
        </Show>
      </Show>
    </div>
  );
};
