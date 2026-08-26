import { Component, createSignal, Show } from "solid-js";
import { Check, ChevronDown, RefreshCw } from "lucide-solid";
import { repoStore } from "../../../store/repoStore";
import { batchStore } from "../../../store/batchStore";
import { RepoStatus } from "../../../types/git";

interface CommitComposerProps {
  repo: RepoStatus;
  stagedCount: number;
}

export const CommitComposer: Component<CommitComposerProps> = (props) => {
  const [commitMessage, setCommitMessage] = createSignal<string>("");
  const [isAmending, setIsAmending] = createSignal<boolean>(false);
  const [showCommitMenu, setShowCommitMenu] = createSignal<boolean>(false);
  let commitMenuRef: HTMLDivElement | undefined;

  const handleCommit = async (amend: boolean = false) => {
    const msg = commitMessage().trim();
    if (!msg && !amend) return;

    try {
      await repoStore.commit(props.repo.path, msg, amend);
      setCommitMessage("");
      setIsAmending(false);
      setShowCommitMenu(false);
    } catch (err) {
      console.error("Commit failed:", err);
    }
  };

  return (
    <div class="flex flex-col gap-2 select-none">
      {/* Sync Changes Banner if unpushed/unpulled commits */}
      <Show when={props.repo.aheadCount > 0 || props.repo.behindCount > 0}>
        <button
          onClick={() => batchStore.setIsPushModalOpen(true)}
          class="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-semibold rounded text-xs transition-colors cursor-pointer shadow-sm"
          title="Synchronize and push outgoing commits"
        >
          <RefreshCw class="w-3.5 h-3.5" />
          <span>
            Sync Changes{" "}
            {props.repo.aheadCount > 0 ? `${props.repo.aheadCount}↑` : ""}{" "}
            {props.repo.behindCount > 0 ? `${props.repo.behindCount}↓` : ""}
          </span>
        </button>
      </Show>

      {/* Commit Message Box */}
      <div class="flex flex-col gap-1.5">
        <div class="relative">
          <textarea
            placeholder={`Message (Ctrl+Enter to commit on "${props.repo.currentBranch}")`}
            value={commitMessage()}
            onInput={(e) => setCommitMessage(e.currentTarget.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                void handleCommit(isAmending());
              }
            }}
            rows={2}
            class="w-full px-2.5 py-1.5 bg-carbon-base border border-carbon-border rounded text-gray-200 placeholder-gray-500 font-mono text-xs focus:outline-none focus:border-indigo-400 resize-none"
          />
        </div>

        {/* Commit Button & Dropdown */}
        <div class="flex items-center gap-1">
          <button
            onClick={() => handleCommit(isAmending())}
            disabled={props.stagedCount === 0 && !isAmending()}
            class="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-gray-950 font-bold rounded text-xs transition-colors cursor-pointer shadow-sm"
          >
            <Check class="w-4 h-4 stroke-[3]" />
            <span>{isAmending() ? "Amend Commit" : "Commit"}</span>
            <span class="text-[10px] opacity-80 font-normal">
              ({props.stagedCount} staged)
            </span>
          </button>

          <div ref={commitMenuRef} class="relative">
            <button
              onClick={() => setShowCommitMenu(!showCommitMenu())}
              class="p-1.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 rounded cursor-pointer"
            >
              <ChevronDown class="w-4 h-4" />
            </button>

            <Show when={showCommitMenu()}>
              <div class="absolute right-0 bottom-8 w-44 bg-carbon-elevated border border-carbon-border rounded shadow-xl py-1 z-30 text-xs">
                <button
                  onClick={() => {
                    setIsAmending(!isAmending());
                    setShowCommitMenu(false);
                  }}
                  class="w-full text-left px-3 py-1.5 hover:bg-carbon-hover text-gray-200"
                >
                  {isAmending()
                    ? "✓ Amend Mode Active"
                    : "Toggle Amend Mode"}
                </button>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
};
