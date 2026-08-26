import { Component } from "solid-js";
import { ParsedLine } from "./DiffInlineRow";

interface DiffSplitRowProps {
  item: ParsedLine;
}

export const DiffSplitRow: Component<DiffSplitRowProps> = (props) => {
  const item = () => props.item;

  if (item().type === "hunk") {
    return (
      <div
        data-hunk={item().id}
        class="px-4 py-1.5 bg-[#161B2B] text-indigo-300 font-bold border-y border-indigo-500/20 text-[11px] select-none"
      >
        {item().line}
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
    <div class="grid grid-cols-2 divide-x divide-gray-800 text-[11.5px]">
      {/* Left Column: Old Version */}
      <div
        class={`px-3 py-0.5 flex items-start ${
          item().type === "deletion"
            ? "bg-rose-500/15 text-rose-300"
            : item().type === "addition"
              ? "bg-transparent text-transparent"
              : "text-gray-300"
        }`}
      >
        <span class="w-7 text-right text-gray-600 select-none mr-2 text-[10px]">
          {item().oldLineNo || ""}
        </span>
        <span class="mr-2 select-none">
          {item().type === "deletion" ? "-" : " "}
        </span>
        <pre class="flex-1 whitespace-pre-wrap font-mono break-all">
          {item().type === "deletion"
            ? item().line.slice(1)
            : item().type === "addition"
              ? ""
              : item().line}
        </pre>
      </div>

      {/* Right Column: New Version */}
      <div
        class={`px-3 py-0.5 flex items-start ${
          item().type === "addition"
            ? "bg-emerald-500/15 text-emerald-200"
            : item().type === "deletion"
              ? "bg-transparent text-transparent"
              : "text-gray-300"
        }`}
      >
        <span class="w-7 text-right text-gray-600 select-none mr-2 text-[10px]">
          {item().newLineNo || ""}
        </span>
        <span class="mr-2 select-none">
          {item().type === "addition" ? "+" : " "}
        </span>
        <pre class="flex-1 whitespace-pre-wrap font-mono break-all">
          {item().type === "addition"
            ? item().line.slice(1)
            : item().type === "deletion"
              ? ""
              : item().line}
        </pre>
      </div>
    </div>
  );
};
