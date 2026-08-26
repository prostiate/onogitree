import { Component, createSignal, For, Show } from "solid-js";
import {
  FolderGit2,
  FolderPlus,
  Plus,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from "lucide-solid";
import { RepoStatus } from "../../types/git";
import { repoStore } from "../../store/repoStore";
import { RepoRow } from "./RepoRow";
import { ContextMenu, MenuItem } from "../common/ContextMenu";

interface RepoTreeProps {
  onOpenRepoModal: () => void;
  onBranchPickerOpen: (repo: RepoStatus) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const RepoTree: Component<RepoTreeProps> = (props) => {
  const [emptyContextMenuPos, setEmptyContextMenuPos] = createSignal<{
    x: number;
    y: number;
  } | null>(null);

  const repos = () => repoStore.filteredRepositories();
  const isExpanded = () => props.isExpanded ?? true;

  const handleEmptyContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    setEmptyContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  const emptyMenuItems = (): MenuItem[] => [
    {
      id: "open-repo",
      label: "Open or Scan Repositories...",
      icon: <FolderPlus class="w-3.5 h-3.5 text-git-indigo" />,
      onClick: () => props.onOpenRepoModal(),
    },
    {
      id: "refresh-all",
      label: "Refresh All Repositories",
      icon: <RefreshCw class="w-3.5 h-3.5 text-cyan-400" />,
      onClick: () => repoStore.refreshAll(),
    },
  ];

  return (
    <div class="flex flex-col h-full bg-carbon-base select-none overflow-hidden relative">
      {/* Accordion Header */}
      <div
        onClick={props.onToggleExpand}
        class="px-3.5 py-2.5 bg-carbon-surface hover:bg-carbon-elevated/80 border-b border-carbon-border flex items-center justify-between text-xs cursor-pointer select-none transition-colors"
      >
        <div class="flex items-center gap-2 min-w-0">
          <Show
            when={isExpanded()}
            fallback={<ChevronRight class="w-3.5 h-3.5 text-gray-400" />}
          >
            <ChevronDown class="w-3.5 h-3.5 text-indigo-400" />
          </Show>
          <FolderGit2 class="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
          <span class="font-bold text-gray-200 tracking-wider text-xs uppercase truncate">
            Repositories ({repos().length})
          </span>
        </div>

        <div
          class="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => repoStore.refreshAll()}
            class="p-1 hover:bg-carbon-hover rounded text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
            title="Refresh All Repositories"
          >
            <RefreshCw
              class={`w-3.5 h-3.5 ${repoStore.isLoading() ? "animate-spin" : ""}`}
            />
          </button>

          <button
            onClick={props.onOpenRepoModal}
            class="p-1 hover:bg-carbon-hover rounded text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
            title="Add Repository"
          >
            <Plus class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Repositories List Container */}
      <Show when={isExpanded()}>
        <div
          onContextMenu={handleEmptyContextMenu}
          class="flex-1 overflow-y-auto overflow-x-hidden min-h-[60px]"
        >
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
      </Show>

      {/* Empty Area Right Click Context Menu */}
      <Show when={emptyContextMenuPos()}>
        {(pos) => (
          <ContextMenu
            x={pos().x}
            y={pos().y}
            isOpen={true}
            items={emptyMenuItems()}
            onClose={() => setEmptyContextMenuPos(null)}
          />
        )}
      </Show>
    </div>
  );
};
