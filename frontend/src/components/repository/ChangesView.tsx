import { Component, createSignal, For, Show } from 'solid-js';
import { 
  Check, 
  Plus, 
  Minus, 
  Archive, 
  ChevronDown,
  RefreshCw,
  FileCode,
  FolderOpen,
  Copy,
  Trash2,
  EyeOff
} from 'lucide-solid';


import { repoStore } from '../../store/repoStore';
import { batchStore } from '../../store/batchStore';
import { FileStatus } from '../../types/git';
import { ContextMenu, MenuItem } from '../common/ContextMenu';

export const ChangesView: Component = () => {
  const [commitMessage, setCommitMessage] = createSignal<string>('');
  const [isAmending, setIsAmending] = createSignal<boolean>(false);
  const [showCommitMenu, setShowCommitMenu] = createSignal<boolean>(false);
  const [selectedContextMenu, setSelectedContextMenu] = createSignal<{
    x: number;
    y: number;
    file: FileStatus;
  } | null>(null);

  const activeRepo = () => repoStore.selectedRepo();
  const files = () => activeRepo()?.files || [];

  const stagedFiles = () => files().filter((f) => f.staged);
  const unstagedFiles = () => files().filter((f) => !f.staged);

  const handleCommit = async (amend: boolean = false) => {
    const repo = activeRepo();
    if (!repo) return;
    const msg = commitMessage().trim();
    if (!msg && !amend) return;

    try {
      await repoStore.commit(repo.path, msg, amend);
      setCommitMessage('');
      setIsAmending(false);
      setShowCommitMenu(false);
    } catch (err) {
      console.error('Commit failed:', err);
    }
  };

  const getStatusBadge = (status: FileStatus['status']) => {
    switch (status) {
      case 'modified':
        return (
          <span class="px-1 py-0.2 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded text-[9.5px] font-mono font-bold">
            M
          </span>
        );
      case 'staged':
        return (
          <span class="px-1 py-0.2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded text-[9.5px] font-mono font-bold">
            A
          </span>
        );
      case 'deleted':
        return (
          <span class="px-1 py-0.2 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded text-[9.5px] font-mono font-bold">
            D
          </span>
        );
      case 'untracked':
        return (
          <span class="px-1 py-0.2 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 rounded text-[9.5px] font-mono font-bold">
            U
          </span>
        );
      case 'conflicted':
        return (
          <span class="px-1 py-0.2 bg-rose-500/25 border border-rose-500/50 text-rose-300 rounded text-[9.5px] font-mono font-bold animate-pulse">
            !
          </span>
        );
      default:
        return (
          <span class="px-1 py-0.2 bg-gray-500/15 border border-gray-500/30 text-gray-300 rounded text-[9.5px] font-mono font-bold">
            M
          </span>
        );
    }
  };

  const getFileMenuItems = (file: FileStatus): MenuItem[] => {
    const repo = activeRepo();
    if (!repo) return [];

    const fullPath = `${repo.path}/${file.path}`;
    const dirPath = fullPath.substring(0, fullPath.lastIndexOf('/')) || repo.path;

    return [
      {
        id: 'open-file',
        label: 'Open File',
        icon: <FileCode class="w-3.5 h-3.5 text-indigo-400" />,
        onClick: () => repoStore.openPath(fullPath),
      },
      {
        id: 'open-folder',
        label: 'Open Containing Folder',
        icon: <FolderOpen class="w-3.5 h-3.5 text-amber-400" />,
        onClick: () => repoStore.openPath(dirPath),
      },
      { id: 'div-1', label: '', divider: true },
      {
        id: 'stage-toggle',
        label: file.staged ? 'Unstage Changes' : 'Stage Changes',
        icon: file.staged ? <Minus class="w-3.5 h-3.5 text-amber-400" /> : <Plus class="w-3.5 h-3.5 text-emerald-400" />,
        onClick: () => {
          if (file.staged) {
            void repoStore.unstageFiles(repo.path, [file.path]);
          } else {
            void repoStore.stageFiles(repo.path, [file.path]);
          }
        },
      },
      {
        id: 'discard',
        label: 'Discard Changes...',
        icon: <Trash2 class="w-3.5 h-3.5 text-rose-400" />,
        danger: true,
        onClick: () => {
          if (confirm(`Discard changes to "${file.path}"? This cannot be undone.`)) {
            void repoStore.discardFiles(repo.path, [file.path]);
          }
        },
      },
      {
        id: 'gitignore',
        label: 'Add to .gitignore',
        icon: <EyeOff class="w-3.5 h-3.5 text-gray-400" />,
        onClick: () => {
          void repoStore.addToGitignore(repo.path, file.path);
        },
      },
      { id: 'div-2', label: '', divider: true },
      {
        id: 'copy-rel',
        label: 'Copy Relative Path',
        icon: <Copy class="w-3.5 h-3.5 text-gray-400" />,
        onClick: () => navigator.clipboard.writeText(file.path),
      },
      {
        id: 'copy-full',
        label: 'Copy Full Path',
        icon: <Copy class="w-3.5 h-3.5 text-gray-400" />,
        onClick: () => navigator.clipboard.writeText(fullPath),
      },
    ];
  };

  return (
    <div class="flex flex-col h-full bg-carbon-surface border-t border-carbon-border select-none text-xs">
      {/* Header */}
      <div class="px-3 py-2 bg-carbon-elevated border-b border-carbon-border flex items-center justify-between">
        <span class="font-semibold text-gray-200 tracking-wider text-[11px] uppercase flex items-center gap-1.5 truncate">
          <span>Source Control</span>
          <Show when={activeRepo()}>
            {(repo) => <span class="text-indigo-300 font-bold lowercase font-mono">({repo().name})</span>}
          </Show>
        </span>

        <Show when={activeRepo()}>
          {(repo) => (
            <div class="flex items-center gap-1">
              <button
                onClick={() => repoStore.stageFiles(repo().path, [])}
                class="p-1 hover:bg-carbon-hover rounded text-gray-400 hover:text-emerald-400 transition-colors cursor-pointer"
                title="Stage All Changes"
              >
                <Plus class="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => repoStore.unstageFiles(repo().path, [])}
                class="p-1 hover:bg-carbon-hover rounded text-gray-400 hover:text-amber-400 transition-colors cursor-pointer"
                title="Unstage All Changes"
              >
                <Minus class="w-3.5 h-3.5" />
              </button>

              <button
                class="p-1 hover:bg-carbon-hover rounded text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
                title="Stash Changes"
              >
                <Archive class="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </Show>
      </div>

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
            {/* Sync Changes Banner if unpushed/unpulled commits */}
            <Show when={repo().aheadCount > 0 || repo().behindCount > 0}>
              <button
                onClick={() => batchStore.setIsPushModalOpen(true)}
                class="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-semibold rounded text-xs transition-colors cursor-pointer"
                title="Synchronize and push outgoing commits"
              >
                <RefreshCw class="w-3.5 h-3.5" />
                <span>
                  Sync Changes {repo().aheadCount > 0 ? `${repo().aheadCount}↑` : ''} {repo().behindCount > 0 ? `${repo().behindCount}↓` : ''}
                </span>
              </button>
            </Show>

            {/* Commit Message Box */}
            <div class="flex flex-col gap-1.5">
              <div class="relative">
                <textarea
                  placeholder={`Message (Ctrl+Enter to commit on "${repo().currentBranch}")`}
                  value={commitMessage()}
                  onInput={(e) => setCommitMessage(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
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
                  disabled={stagedFiles().length === 0 && !isAmending()}
                  class="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-gray-950 font-bold rounded text-xs transition-colors cursor-pointer shadow-sm"
                >
                  <Check class="w-4 h-4 stroke-[3]" />
                  <span>{isAmending() ? 'Amend Commit' : 'Commit'}</span>
                  <span class="text-[10px] opacity-80 font-normal">({stagedFiles().length} staged)</span>
                </button>

                <div class="relative">
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
                        {isAmending() ? '✓ Amend Mode Active' : 'Toggle Amend Mode'}
                      </button>
                    </div>
                  </Show>
                </div>
              </div>
            </div>

            {/* Changed Files Lists */}
            <div class="flex-1 overflow-y-auto space-y-3 mt-1 pr-1">
              {/* Staged Section */}
              <Show when={stagedFiles().length > 0}>
                <div>
                  <div class="flex items-center justify-between text-[11px] text-gray-400 font-semibold mb-1">
                    <span>STAGED CHANGES ({stagedFiles().length})</span>
                    <button
                      onClick={() => repoStore.unstageFiles(repo().path, [])}
                      class="text-gray-500 hover:text-gray-300 text-[10px] font-mono cursor-pointer"
                    >
                      Unstage All
                    </button>
                  </div>
                  <div class="space-y-0.5">
                    <For each={stagedFiles()}>
                      {(file) => (
                        <div
                          onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedContextMenu({ x: e.clientX, y: e.clientY, file });
                          }}
                          onDblClick={() => repoStore.openPath(`${repo().path}/${file.path}`)}
                          class="group flex items-center justify-between px-2 py-1.5 bg-carbon-base hover:bg-[#1A1F2C] border border-carbon-border/50 rounded font-mono text-[11.5px] cursor-pointer transition-colors"
                        >
                          <div class="flex items-center gap-2 truncate">
                            {getStatusBadge(file.status)}
                            <span class="text-gray-200 truncate">{file.path}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              void repoStore.unstageFiles(repo().path, [file.path]);
                            }}
                            class="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-carbon-elevated rounded text-gray-400 hover:text-amber-400"
                            title="Unstage file"
                          >
                            <Minus class="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </Show>

              {/* Unstaged Section */}
              <div>
                <div class="flex items-center justify-between text-[11px] text-gray-400 font-semibold mb-1">
                  <span>CHANGES ({unstagedFiles().length})</span>
                  <Show when={unstagedFiles().length > 0}>
                    <button
                      onClick={() => repoStore.stageFiles(repo().path, [])}
                      class="text-gray-500 hover:text-gray-300 text-[10px] font-mono cursor-pointer"
                    >
                      Stage All
                    </button>
                  </Show>
                </div>
                <Show
                  when={unstagedFiles().length > 0}
                  fallback={
                    <div class="text-[11px] text-gray-500 py-2 italic">
                      Working tree clean.
                    </div>
                  }
                >
                  <div class="space-y-0.5">
                    <For each={unstagedFiles()}>
                      {(file) => (
                        <div
                          onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedContextMenu({ x: e.clientX, y: e.clientY, file });
                          }}
                          onDblClick={() => repoStore.openPath(`${repo().path}/${file.path}`)}
                          class="group flex items-center justify-between px-2 py-1.5 bg-carbon-base hover:bg-[#1A1F2C] border border-carbon-border/50 rounded font-mono text-[11.5px] cursor-pointer transition-colors"
                        >
                          <div class="flex items-center gap-2 truncate">
                            {getStatusBadge(file.status)}
                            <span class="text-gray-200 truncate">{file.path}</span>
                          </div>
                          <div class="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                void repoStore.stageFiles(repo().path, [file.path]);
                              }}
                              class="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-carbon-elevated rounded text-gray-400 hover:text-emerald-400"
                              title="Stage file"
                            >
                              <Plus class="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                </Show>
              </div>
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
