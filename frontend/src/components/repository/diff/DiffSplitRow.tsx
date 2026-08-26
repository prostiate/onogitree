import { Component, createMemo } from "solid-js";
import { ParsedLine } from "./DiffInlineRow";
import { highlightCode } from "../../../utils/syntaxHighlight";

interface DiffSplitRowProps {
  item: ParsedLine;
  filePath: string;
}

export const DiffSplitRow: Component<DiffSplitRowProps> = (props) => {
  const item = () => props.item;

  const highlightedOld = createMemo(() => {
    if (item().type === "deletion") {
      return highlightCode(item().line.slice(1), props.filePath);
    }
    if (item().type === "context") {
      return highlightCode(item().line, props.filePath);
    }
    return "";
  });

  const highlightedNew = createMemo(() => {
    if (item().type === "addition") {
      return highlightCode(item().line.slice(1), props.filePath);
    }
    if (item().type === "context") {
      return highlightCode(item().line, props.filePath);
    }
    return "";
  });

  if (item().type === "hunk") {
    return (
      <div
        data-hunk={item().id}
        class="px-4 py-1.5 bg-[#161B2B] text-indigo-300 font-bold border-y border-indigo-500/20 text-[11px] select-none font-mono"
      >
        {item().line}
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
    <div class="grid grid-cols-2 divide-x divide-gray-800 font-mono text-[12px] leading-5">
      {/* Left Column: Old Version */}
      <div
        class={`px-3 py-0.5 flex items-start ${
          item().type === "deletion"
            ? "bg-[#481e28]/40 text-gray-100 hover:bg-[#481e28]/60"
            : item().type === "addition"
              ? "bg-[repeating-linear-gradient(-45deg,#0c0e14,#0c0e14_4px,#131620_4px,#131620_8px)] opacity-50 select-none"
              : "text-gray-300 hover:bg-[#131722]"
        }`}
      >
        <span class="w-8 text-right text-gray-600 select-none mr-2 text-[10.5px]">
          {item().oldLineNo || ""}
        </span>
        <span class="mr-2 select-none flex-shrink-0">
          {item().type === "deletion" ? (
            <span class="text-rose-400 font-bold">-</span>
          ) : (
            " "
          )}
        </span>
        <pre
          class="flex-1 whitespace-pre-wrap font-mono break-all text-gray-200"
          innerHTML={highlightedOld()}
        />
      </div>

      {/* Right Column: New Version */}
      <div
        class={`px-3 py-0.5 flex items-start ${
          item().type === "addition"
            ? "bg-[#1b3d2f]/35 text-gray-100 hover:bg-[#1b3d2f]/55"
            : item().type === "deletion"
              ? "bg-[repeating-linear-gradient(-45deg,#0c0e14,#0c0e14_4px,#131620_4px,#131620_8px)] opacity-50 select-none"
              : "text-gray-300 hover:bg-[#131722]"
        }`}
      >
        <span class="w-8 text-right text-gray-600 select-none mr-2 text-[10.5px]">
          {item().newLineNo || ""}
        </span>
        <span class="mr-2 select-none flex-shrink-0">
          {item().type === "addition" ? (
            <span class="text-emerald-400 font-bold">+</span>
          ) : (
            " "
          )}
        </span>
        <pre
          class="flex-1 whitespace-pre-wrap font-mono break-all text-gray-200"
          innerHTML={highlightedNew()}
        />
      </div>
    </div>
  );
};
