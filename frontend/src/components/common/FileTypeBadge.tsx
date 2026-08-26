import { Component, JSX } from "solid-js";
import { FileCode } from "lucide-solid";

interface FileTypeBadgeProps {
  filePath: string;
  class?: string;
}

export const FileTypeBadge: Component<FileTypeBadgeProps> = (props) => {
  const getExtension = () =>
    props.filePath.split(".").pop()?.toLowerCase() || "";

  const renderBadge = (): JSX.Element => {
    const ext = getExtension();
    switch (ext) {
      case "go":
        return (
          <span class={`px-1.5 py-0.5 bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 font-mono text-[10px] font-black rounded border border-cyan-300 dark:border-cyan-500/40 ${props.class || ""}`}>
            go
          </span>
        );
      case "ts":
        return (
          <span class={`px-1.5 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 font-mono text-[10px] font-black rounded border border-blue-300 dark:border-blue-500/40 ${props.class || ""}`}>
            TS
          </span>
        );
      case "tsx":
        return (
          <span class={`px-1.5 py-0.5 bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 font-mono text-[10px] font-black rounded border border-sky-300 dark:border-sky-500/40 ${props.class || ""}`}>
            TSX
          </span>
        );
      case "js":
      case "jsx":
        return (
          <span class={`px-1.5 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono text-[10px] font-black rounded border border-amber-300 dark:border-amber-500/40 ${props.class || ""}`}>
            JS
          </span>
        );
      case "css":
      case "scss":
      case "less":
        return (
          <span class={`px-1.5 py-0.5 bg-pink-100 dark:bg-pink-500/20 text-pink-800 dark:text-pink-300 font-mono text-[10px] font-black rounded border border-pink-300 dark:border-pink-500/40 ${props.class || ""}`}>
            CSS
          </span>
        );
      case "json":
        return (
          <span class={`px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 font-mono text-[10px] font-black rounded border border-yellow-300 dark:border-yellow-500/40 ${props.class || ""}`}>
            JSON
          </span>
        );
      case "md":
      case "mdx":
        return (
          <span class={`px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 font-mono text-[10px] font-black rounded border border-indigo-300 dark:border-indigo-500/40 ${props.class || ""}`}>
            MD
          </span>
        );
      case "html":
        return (
          <span class={`px-1.5 py-0.5 bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-300 font-mono text-[10px] font-black rounded border border-orange-300 dark:border-orange-500/40 ${props.class || ""}`}>
            HTML
          </span>
        );
      case "yaml":
      case "yml":
        return (
          <span class={`px-1.5 py-0.5 bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 font-mono text-[10px] font-black rounded border border-rose-300 dark:border-rose-500/40 ${props.class || ""}`}>
            YML
          </span>
        );
      default:
        return <FileCode class={`w-3.5 h-3.5 text-gray-400 ${props.class || ""}`} />;
    }
  };

  return renderBadge();
};
