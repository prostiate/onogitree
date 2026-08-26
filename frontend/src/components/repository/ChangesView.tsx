import { Component, createSignal, createMemo, Show } from "solid-js";
import {
  Plus,
  Minus,
  FileCode,
  FolderOpen,
  Copy,
  Trash2,
  EyeOff,
} from "lucide-solid";
import { repoStore } from "../../store/repoStore";
import { FileStatus } from "../../types/git";
import { ContextMenu, MenuItem } from "../common/ContextMenu";
import { buildFileTree, sortFiles, FileTreeNode } from "../../utils/fileTree";
import { ChangesHeader } from "./changes/ChangesHeader";
import { CommitComposer } from "./changes/CommitComposer";
import { StagedSection } from "./changes/StagedSection";
import { UnstagedSection } from "./changes/UnstagedSection";

export const ChangesView: Component = () => {
  const [viewMode, setViewMode] = createSignal<"list" | "tree">("tree");
  const [sortBy, setSortBy] = createSignal<"path" | "name" | "status">("path");
  const [collapsedFolders, setCollapsedFolders] = createSignal<
    Record<string, boolean>
  >({});
  const [selectedContextMenu, setSelectedContextMenu] = createSignal<{
    x: number;
    y: number;
    file: FileStatus;
  } | null>(null);

  const activeRepo = () => repoStore.selectedRepo();
  const rawFiles = () => activeRepo()?.files || [];

  const sortedFiles = createMemo(() => sortFiles(rawFiles(), sortBy()));
  const stagedFiles = createMemo(() => sortedFiles().filter((f) => f.staged));
  const unstagedFiles = createMemo(() =>
    sortedFiles().filter((f) => !f.staged),
  );

  const stagedTree = createMemo(() => buildFileTree(stagedFiles()));
  const unstagedTree = createMemo(() => buildFileTree(unstagedFiles()));

  const getAllTreeFolderIds = (nodes: FileTreeNode[]): string[] => {
    const ids: string[] = [];
    const traverse = (items: FileTreeNode[]) => {
      for (const item of items) {
        if (item.isFolder) {
          ids.push(item.id);
          traverse(item.children);
        }
      }
    };
    traverse(nodes);
    return ids;
  };

  const isAllTreeFoldersCollapsed = () => {
    const allIds = [
      ...getAllTreeFolderIds(stagedTree()),
      ...getAllTreeFolderIds(unstagedTree()),
    ];
    if (allIds.length === 0) return false;
    const collapsed = collapsedFolders();
    return allIds.every((id) => collapsed[id]);
  };

  const toggleExpandAllTreeFolders = () => {
    const allIds = [
      ...getAllTreeFolderIds(stagedTree()),
      ...getAllTreeFolderIds(unstagedTree()),
    ];
    const isCollapsed = isAllTreeFoldersCollapsed();
    const next: Record<string, boolean> = {};
    for (const id of allIds) {
      next[id] = !isCollapsed;
    }
    setCollapsedFolders(next);
  };

  const toggleFolder = (folderId: string) => {
    setCollapsedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const getFileMenuItems = (file: FileStatus): MenuItem[] => {
    const repo = activeRepo();
    if (!repo) return [];

    const fullPath = `${repo.path}/${file.path}`;
    const dirPath =
      fullPath.substring(0, fullPath.lastIndexOf("/")) || repo.path;

    return [
      {
        id: "open-file",
        label: "Open File",
        icon: <FileCode class="w-3.5 h-3.5 text-indigo-400" />,
        onClick: () => repoStore.openPath(fullPath),
      },
      {
        id: "open-folder",
        label: "Open Containing Folder",
        icon: <FolderOpen class="w-3.5 h-3.5 text-amber-400" />,
        onClick: () => repoStore.openPath(dirPath),
      },
      { id: "div-1", label: "", divider: true },
      {
        id: "stage-toggle",
        label: file.staged ? "Unstage Changes" : "Stage Changes",
        icon: file.staged ? (
          <Minus class="w-3.5 h-3.5 text-amber-400" />
        ) : (
          <Plus class="w-3.5 h-3.5 text-emerald-400" />
        ),
        onClick: () => {
          if (file.staged) {
            void repoStore.unstageFiles(repo.path, [file.path]);
          } else {
            void repoStore.stageFiles(repo.path, [file.path]);
          }
        },
      },
      {
        id: "discard",
        label: "Discard Changes...",
        icon: <Trash2 class="w-3.5 h-3.5 text-rose-400" />,
        danger: true,
        onClick: () => {
          if (
            confirm(`Discard changes to "${file.path}"? This cannot be undone.`)
          ) {
            void repoStore.discardFiles(repo.path, [file.path]);
          }
        },
      },
      {
        id: "gitignore",
        label: "Add to .gitignore",
        icon: <EyeOff class="w-3.5 h-3.5 text-gray-400" />,
        onClick: () => {
          void repoStore.addToGitignore(repo.path, file.path);
        },
      },
      { id: "div-2", label: "", divider: true },
      {
        id: "copy-rel",
        label: "Copy Relative Path",
        icon: <Copy class="w-3.5 h-3.5 text-gray-400" />,
        onClick: () => navigator.clipboard.writeText(file.path),
      },
      {
        id: "copy-full",
        label: "Copy Full Path",
        icon: <Copy class="w-3.5 h-3.5 text-gray-400" />,
        onClick: () => navigator.clipboard.writeText(fullPath),
      },
    ];
  };

  const handleContextMenu = (e: MouseEvent, file: FileStatus) => {
    setSelectedContextMenu({ x: e.clientX, y: e.clientY, file });
  };

  return (
    <div class="flex flex-col h-full bg-carbon-surface border-t border-carbon-border select-none text-xs">
      <ChangesHeader
        repo={activeRepo()}
        viewMode={viewMode()}
        onViewModeChange={setViewMode}
        sortBy={sortBy()}
        onSortByChange={setSortBy}
        isAllCollapsed={isAllTreeFoldersCollapsed()}
        onToggleExpandAll={toggleExpandAllTreeFolders}
        onStageAll={() => activeRepo() && repoStore.stageFiles(activeRepo()!.path, [])}
        onUnstageAll={() => activeRepo() && repoStore.unstageFiles(activeRepo()!.path, [])}
      />

      <Show
        when={activeRepo()}
        fallback={
          <div class="p-4 text-center text-xs text-gray-500">
            Select a repository to view working tree changes.
          </div>
        }
      >
        {(repo) => (
          <div class="flex flex-col flex-1 overflow-hidden p-3 gap-2">
            <CommitComposer
              repo={repo()}
              stagedCount={stagedFiles().length}
            />

            <div class="flex-1 overflow-y-auto space-y-3 mt-1 pr-1">
              <StagedSection
                repoPath={repo().path}
                files={stagedFiles()}
                tree={stagedTree()}
                viewMode={viewMode()}
                isFolderCollapsed={(id) => collapsedFolders()[id] || false}
                onToggleFolder={toggleFolder}
                onContextMenu={handleContextMenu}
              />

              <UnstagedSection
                repoPath={repo().path}
                files={unstagedFiles()}
                tree={unstagedTree()}
                viewMode={viewMode()}
                isFolderCollapsed={(id) => collapsedFolders()[id] || false}
                onToggleFolder={toggleFolder}
                onContextMenu={handleContextMenu}
              />
            </div>
          </div>
        )}
      </Show>

      {/* Right Click File Context Menu */}
      <Show when={selectedContextMenu()}>
        {(menu) => (
          <ContextMenu
            x={menu().x}
            y={menu().y}
            isOpen={true}
            items={getFileMenuItems(menu().file)}
            onClose={() => setSelectedContextMenu(null)}
          />
        )}
      </Show>
    </div>
  );
};
