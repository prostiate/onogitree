import { Component, JSX } from "solid-js";
import { FileChangeStatus } from "../../types/git";

export type StatusBadgeVariant = "badge" | "letter" | "compact";

interface StatusBadgeProps {
  status: FileChangeStatus | "added" | string;
  variant?: StatusBadgeVariant;
  class?: string;
}

export const StatusBadge: Component<StatusBadgeProps> = (props) => {
  const variant = () => props.variant || "badge";
  const normalizedStatus = () => (props.status || "modified").toLowerCase();

  const getBadgeContent = (): JSX.Element => {
    const s = normalizedStatus();
    const v = variant();

    if (v === "letter") {
      switch (s) {
        case "modified":
        case "staged":
          return (
            <span class={`font-mono text-xs font-bold text-amber-600 dark:text-amber-400 ${props.class || ""}`}>
              M
            </span>
          );
        case "added":
        case "untracked":
          return (
            <span class={`font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 ${props.class || ""}`}>
              A
            </span>
          );
        case "deleted":
          return (
            <span class={`font-mono text-xs font-bold text-rose-600 dark:text-rose-400 ${props.class || ""}`}>
              D
            </span>
          );
        case "renamed":
          return (
            <span class={`font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400 ${props.class || ""}`}>
              R
            </span>
          );
        case "conflicted":
          return (
            <span class={`font-mono text-xs font-bold text-rose-600 dark:text-rose-400 animate-pulse ${props.class || ""}`}>
              !
            </span>
          );
        default:
          return (
            <span class={`font-mono text-xs font-bold text-amber-600 dark:text-amber-400 ${props.class || ""}`}>
              M
            </span>
          );
      }
    }

    if (v === "compact") {
      switch (s) {
        case "modified":
          return (
            <span class={`px-1 py-0.2 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded text-[9.5px] font-mono font-bold ${props.class || ""}`}>
              M
            </span>
          );
        case "staged":
          return (
            <span class={`px-1 py-0.2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded text-[9.5px] font-mono font-bold ${props.class || ""}`}>
              A
            </span>
          );
        case "deleted":
          return (
            <span class={`px-1 py-0.2 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded text-[9.5px] font-mono font-bold ${props.class || ""}`}>
              D
            </span>
          );
        case "untracked":
          return (
            <span class={`px-1 py-0.2 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 rounded text-[9.5px] font-mono font-bold ${props.class || ""}`}>
              U
            </span>
          );
        case "conflicted":
          return (
            <span class={`px-1 py-0.2 bg-rose-500/25 border border-rose-500/50 text-rose-300 rounded text-[9.5px] font-mono font-bold animate-pulse ${props.class || ""}`}>
              !
            </span>
          );
        default:
          return (
            <span class={`px-1 py-0.2 bg-gray-500/15 border border-gray-500/30 text-gray-300 rounded text-[9.5px] font-mono font-bold ${props.class || ""}`}>
              M
            </span>
          );
      }
    }

    // Default: full badge
    switch (s) {
      case "modified":
        return (
          <span class={`px-1.5 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded text-[10px] font-mono font-bold ${props.class || ""}`}>
            MODIFIED
          </span>
        );
      case "staged":
        return (
          <span class={`px-1.5 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded text-[10px] font-mono font-bold ${props.class || ""}`}>
            STAGED
          </span>
        );
      case "added":
        return (
          <span class={`px-1.5 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded text-[10px] font-mono font-bold ${props.class || ""}`}>
            ADDED
          </span>
        );
      case "deleted":
        return (
          <span class={`px-1.5 py-0.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded text-[10px] font-mono font-bold ${props.class || ""}`}>
            DELETED
          </span>
        );
      case "untracked":
        return (
          <span class={`px-1.5 py-0.5 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 rounded text-[10px] font-mono font-bold ${props.class || ""}`}>
            UNTRACKED
          </span>
        );
      case "renamed":
        return (
          <span class={`px-1.5 py-0.5 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 rounded text-[10px] font-mono font-bold ${props.class || ""}`}>
            RENAMED
          </span>
        );
      case "conflicted":
        return (
          <span class={`px-1.5 py-0.5 bg-rose-500/25 border border-rose-500/50 text-rose-300 rounded text-[10px] font-mono font-bold animate-pulse ${props.class || ""}`}>
            CONFLICT
          </span>
        );
      default:
        return (
          <span class={`px-1.5 py-0.5 bg-gray-500/15 border border-gray-500/30 text-gray-300 rounded text-[10px] font-mono font-bold ${props.class || ""}`}>
            {s.toUpperCase()}
          </span>
        );
    }
  };

  return getBadgeContent();
};
