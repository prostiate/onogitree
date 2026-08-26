import { Component, For, Show } from "solid-js";
import { CircleDot, Tag, Cloud, GitBranch } from "lucide-solid";

interface RefBadgePillsProps {
  refs?: string;
  class?: string;
}

export const RefBadgePills: Component<RefBadgePillsProps> = (props) => {
  const refList = () => {
    if (!props.refs) return [];
    return props.refs
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);
  };

  return (
    <Show when={refList().length > 0}>
      <div class={`flex items-center gap-1.5 flex-wrap ${props.class || ""}`}>
        <For each={refList()}>
          {(ref) => {
            if (ref.startsWith("HEAD -> ")) {
              const branch = ref.replace("HEAD -> ", "");
              return (
                <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-50 dark:bg-sky-500/15 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-500/40 rounded-full font-mono text-[10px] font-bold shadow-xs">
                  <CircleDot class="w-3 h-3 text-sky-600 dark:text-sky-400" />
                  <span>{branch}</span>
                </span>
              );
            }
            if (ref.startsWith("tag: ")) {
              const tag = ref.replace("tag: ", "");
              return (
                <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 rounded-full font-mono text-[10px] font-bold shadow-xs">
                  <Tag class="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>{tag}</span>
                </span>
              );
            }
            if (ref.includes("origin/") || ref.includes("upstream/")) {
              return (
                <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 dark:bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-500/40 rounded-full font-mono text-[10px] font-bold shadow-xs">
                  <Cloud class="w-3 h-3 text-purple-600 dark:text-purple-400" />
                  <span>{ref}</span>
                </span>
              );
            }
            return (
              <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/40 rounded-full font-mono text-[10px] font-bold shadow-xs">
                <GitBranch class="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                <span>{ref}</span>
              </span>
            );
          }}
        </For>
      </div>
    </Show>
  );
};
