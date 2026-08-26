import { Component } from "solid-js";

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
}

export const DiffInlineRow: Component<DiffInlineRowProps> = (props) => {
  const item = () => props.item;

  if (item().type === "hunk") {
    return (
      <div
        data-hunk={item().id}
        class="px-4 py-1.5 bg-[#161B2B] text-indigo-300 font-bold border-y border-indigo-500/20 text-[11px] select-none flex items-center justify-between"
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
      <div class="px-3 py-0.5 bg-emerald-500/15 text-emerald-200 border-l-2 border-l-emerald-500 flex items-start hover:bg-emerald-500/20 transition-colors">
        <span class="w-8 text-right text-gray-600 select-none mr-2 text-[10.5px]"></span>
        <span class="w-8 text-right text-emerald-400/80 select-none mr-3 text-[10.5px] font-bold">
          {item().newLineNo}
        </span>
        <span class="text-emerald-400 select-none mr-2 font-bold">+</span>
        <pre class="flex-1 whitespace-pre-wrap font-mono break-all">
          {item().line.slice(1)}
        </pre>
      </div>
    );
  }

  if (item().type === "deletion") {
    return (
      <div class="px-3 py-0.5 bg-rose-500/15 text-rose-300 border-l-2 border-l-rose-500 flex items-start hover:bg-rose-500/20 transition-colors">
        <span class="w-8 text-right text-rose-400/80 select-none mr-2 text-[10.5px] font-bold">
          {item().oldLineNo}
        </span>
        <span class="w-8 text-right text-gray-600 select-none mr-3 text-[10.5px]"></span>
        <span class="text-rose-400 select-none mr-2 font-bold">-</span>
        <pre class="flex-1 whitespace-pre-wrap font-mono break-all line-through opacity-80">
          {item().line.slice(1)}
        </pre>
      </div>
    );
  }

  if (item().type === "header") {
    return (
      <div class="px-4 py-0.5 text-gray-500 bg-[#0E121B] text-[11px]">
        {item().line}
      </div>
    );
  }

  return (
    <div class="px-3 py-0.5 text-gray-300 hover:bg-[#111522] flex items-start">
      <span class="w-8 text-right text-gray-600 select-none mr-2 text-[10.5px]">
        {item().oldLineNo}
      </span>
      <span class="w-8 text-right text-gray-600 select-none mr-3 text-[10.5px]">
        {item().newLineNo}
      </span>
      <span class="select-none mr-2 opacity-20"> </span>
      <pre class="flex-1 whitespace-pre-wrap font-mono break-all">
        {item().line}
      </pre>
    </div>
  );
};
