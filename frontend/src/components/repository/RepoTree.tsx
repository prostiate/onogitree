import { Component, For, Show } from "solid-js";
import { FolderGit2, Plus, RefreshCw } from "lucide-solid";
import { RepoStatus } from "../../types/git";
import { repoStore } from "../../store/repoStore";
import { RepoRow } from "./RepoRow";

interface RepoTreeProps {
  onOpenRepoModal: () => void;
  onBranchPickerOpen: (repo: RepoStatus) => void;
}

export const RepoTree: Component<RepoTreeProps> = (props) => {
  const repos = () => repoStore.filteredRepositories();

  return (
    <div class="flex flex-col h-full bg-carbon-base select-none">
      {/* Header */}
      <div class="px-3 py-2 bg-carbon-surface border-b border-carbon-border flex items-center justify-between text-xs">
        <span class="font-semibold text-gray-300 tracking-wider text-[11px] uppercase flex items-center gap-1.5">
          <FolderGit2 class="w-3.5 h-3.5 text-git-indigo" />
          <span>Repositories ({repos().length})</span>
        </span>

        <div class="flex items-center gap-1">
          <button
            onClick={() => repoStore.refreshAll()}
            class="p-1 hover:bg-carbon-hover rounded text-gray-400 hover:text-gray-200 transition-colors"
            title="Refresh All Repositories"
          >
            <RefreshCw
              class={`w-3 h-3 ${repoStore.isLoading() ? "animate-spin" : ""}`}
            />
          </button>

          <button
            onClick={props.onOpenRepoModal}
            class="p-1 hover:bg-carbon-hover rounded text-gray-400 hover:text-gray-200 transition-colors"
            title="Add Repository"
          >
            <Plus class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* List Container */}
      <div class="flex-1 overflow-y-auto overflow-x-hidden">
        <Show
          when={repos().length > 0}
          fallback={
            <div class="p-6 text-center text-xs text-gray-500 flex flex-col items-center gap-3">
              <FolderGit2 class="w-8 h-8 text-gray-600 opacity-40" />
              <p>No repositories in workspace.</p>
              <button
                onClick={props.onOpenRepoModal}
                class="px-3 py-1.5 bg-carbon-elevated hover:bg-carbon-hover border border-carbon-border rounded text-git-indigo font-medium cursor-pointer"
              >
                + Add or Scan Repositories
              </button>
            </div>
          }
        >
          <For each={repos()}>
            {(repo) => (
              <RepoRow
                repo={repo}
                isSelected={repoStore.selectedRepoId() === repo.id}
                onSelect={() => repoStore.selectRepo(repo.id)}
                onBranchClick={() => props.onBranchPickerOpen(repo)}
              />
            )}
          </For>
        </Show>
      </div>
    </div>
  );
};
