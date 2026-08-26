import { Component, createMemo } from "solid-js";
import { highlightCode } from "../../../utils/syntaxHighlight";

export interface ParsedLine {
  id: number;
  line: string;
  type: "header" | "hunk" | "addition" | "deletion" | "context";
  oldLineNo?: number;
  newLineNo?: number;
}

interface DiffInlineRowProps {
  item: ParsedLine;
  hunkNum: number;
  totalHunks: number;
  filePath: string;
}

export const DiffInlineRow: Component<DiffInlineRowProps> = (props) => {
  const item = () => props.item;

  const highlightedContent = createMemo(() => {
    const rawLine = item().line;
    if (item().type === "addition" || item().type === "deletion") {
      return highlightCode(rawLine.slice(1), props.filePath);
    }
    return highlightCode(rawLine, props.filePath);
  });

  if (item().type === "hunk") {
    return (
      <div
        data-hunk={item().id}
        class="px-4 py-1.5 bg-[#161B2B] text-indigo-300 font-bold border-y border-indigo-500/20 text-[11px] select-none flex items-center justify-between font-mono"
      >
        <span>{item().line}</span>
        <span class="text-[10px] text-gray-500 font-normal">
          Hunk {props.hunkNum + 1} of {props.totalHunks}
        </span>
      </div>
    );
  }

  if (item().type === "addition") {
    return (
      <div class="px-3 py-0.5 bg-[#1b3d2f]/35 text-gray-100 border-l-2 border-l-emerald-500 flex items-start hover:bg-[#1b3d2f]/55 transition-colors font-mono text-[12px] leading-5">
        <span class="w-9 text-right text-gray-600 select-none mr-2 text-[10.5px]"></span>
        <span class="w-9 text-right text-emerald-400 select-none mr-3 text-[10.5px] font-bold">
          {item().newLineNo}
        </span>
        <span class="text-emerald-400 select-none mr-2 font-bold flex-shrink-0">+</span>
        <pre
          class="flex-1 whitespace-pre-wrap font-mono break-all text-gray-100"
          innerHTML={highlightedContent()}
        />
      </div>
    );
  }

  if (item().type === "deletion") {
    return (
      <div class="px-3 py-0.5 bg-[#481e28]/40 text-gray-100 border-l-2 border-l-rose-500 flex items-start hover:bg-[#481e28]/60 transition-colors font-mono text-[12px] leading-5">
        <span class="w-9 text-right text-rose-400 select-none mr-2 text-[10.5px] font-bold">
          {item().oldLineNo}
        </span>
        <span class="w-9 text-right text-gray-600 select-none mr-3 text-[10.5px]"></span>
        <span class="text-rose-400 select-none mr-2 font-bold flex-shrink-0">-</span>
        <pre
          class="flex-1 whitespace-pre-wrap font-mono break-all text-gray-300 opacity-90"
          innerHTML={highlightedContent()}
        />
      </div>
    );
  }

  if (item().type === "header") {
    return (
      <div class="px-4 py-0.5 text-gray-500 bg-[#0E121B] text-[11px] font-mono">
        {item().line}
      </div>
    );
  }

  return (
    <div class="px-3 py-0.5 text-gray-300 hover:bg-[#131722] flex items-start font-mono text-[12px] leading-5">
      <span class="w-9 text-right text-gray-600 select-none mr-2 text-[10.5px]">
        {item().oldLineNo}
      </span>
      <span class="w-9 text-right text-gray-600 select-none mr-3 text-[10.5px]">
        {item().newLineNo}
      </span>
      <span class="select-none mr-2 opacity-20 flex-shrink-0"> </span>
      <pre
        class="flex-1 whitespace-pre-wrap font-mono break-all text-gray-200"
        innerHTML={highlightedContent()}
      />
    </div>
  );
};
