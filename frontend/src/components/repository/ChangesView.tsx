import { Component, createSignal, For, Show } from 'solid-js';
import { 
  Check, 
  Plus, 
  Minus, 
  FileEdit, 
  FilePlus, 
  FileX, 
  AlertCircle,
  Archive,
  ChevronDown
} from 'lucide-solid';

import { repoStore } from '../../store/repoStore';
import { FileStatus } from '../../types/git';

export const ChangesView: Component = () => {
  const [commitMessage, setCommitMessage] = createSignal<string>('');
  const [isAmending, setIsAmending] = createSignal<boolean>(false);
  const [showCommitMenu, setShowCommitMenu] = createSignal<boolean>(false);

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

  const getStatusIcon = (status: FileStatus['status']) => {
    switch (status) {
      case 'modified':
        return <FileEdit class="w-3.5 h-3.5 text-git-amber flex-shrink-0" />;
      case 'staged':
        return <FilePlus class="w-3.5 h-3.5 text-git-emerald flex-shrink-0" />;
      case 'deleted':
        return <FileX class="w-3.5 h-3.5 text-git-crimson flex-shrink-0" />;
      case 'untracked':
        return <Plus class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />;
      case 'conflicted':
        return <AlertCircle class="w-3.5 h-3.5 text-git-crimson animate-pulse flex-shrink-0" />;
      default:
        return <FileEdit class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />;
    }
  };

  return (
    <div class="flex flex-col h-full bg-carbon-surface border-t border-carbon-border select-none text-xs">
      {/* Header */}
      <div class="px-3 py-2 bg-carbon-elevated border-b border-carbon-border flex items-center justify-between">
        <span class="font-semibold text-gray-200 tracking-wider text-[11px] uppercase flex items-center gap-1.5 truncate">
          <span>Source Control</span>
          <Show when={activeRepo()}>
            {(repo) => <span class="text-git-indigo lowercase font-mono">({repo().name})</span>}
          </Show>
        </span>

        <Show when={activeRepo()}>
          {(repo) => (
            <div class="flex items-center gap-1">
              <button
                onClick={() => repoStore.stageFiles(repo().path, [])}
                class="p-1 hover:bg-carbon-hover rounded text-gray-400 hover:text-git-emerald transition-colors cursor-pointer"
                title="Stage All Changes"
              >
                <Plus class="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => repoStore.unstageFiles(repo().path, [])}
                class="p-1 hover:bg-carbon-hover rounded text-gray-400 hover:text-git-amber transition-colors cursor-pointer"
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
                  class="w-full px-2.5 py-1.5 bg-carbon-base border border-carbon-border rounded text-gray-200 placeholder-gray-500 font-mono text-xs focus:outline-none focus:border-git-indigo resize-none"
                />
              </div>

              {/* Commit Button & Dropdown */}
              <div class="flex items-center gap-1">
                <button
                  onClick={() => handleCommit(isAmending())}
                  disabled={stagedFiles().length === 0 && !isAmending()}
                  class="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-git-emerald/90 hover:bg-git-emerald disabled:opacity-40 disabled:cursor-not-allowed text-gray-950 font-semibold rounded text-xs transition-colors cursor-pointer"
                >
                  <Check class="w-4 h-4 stroke-[3]" />
                  <span>{isAmending() ? 'Amend Commit' : 'Commit'}</span>
                  <span class="text-[10px] opacity-75 font-normal">({stagedFiles().length} staged)</span>
                </button>

                <div class="relative">
                  <button
                    onClick={() => setShowCommitMenu(!showCommitMenu())}
                    class="p-1.5 bg-git-emerald/90 hover:bg-git-emerald text-gray-950 rounded cursor-pointer"
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
                  <div class="flex items-center justify-between text-[11px] text-gray-400 font-medium mb-1">
                    <span>STAGED CHANGES ({stagedFiles().length})</span>
                    <button
                      onClick={() => repoStore.unstageFiles(repo().path, [])}
                      class="text-gray-500 hover:text-gray-300 text-[10px]"
                    >
                      Unstage All
                    </button>
                  </div>
                  <div class="space-y-0.5">
                    <For each={stagedFiles()}>
                      {(file) => (
                        <div class="group flex items-center justify-between px-2 py-1 bg-carbon-base hover:bg-carbon-hover border border-carbon-border/50 rounded font-mono text-[11.5px]">
                          <div class="flex items-center gap-1.5 truncate">
                            {getStatusIcon(file.status)}
                            <span class="text-gray-200 truncate">{file.path}</span>
                          </div>
                          <button
                            onClick={() => repoStore.unstageFiles(repo().path, [file.path])}
                            class="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-carbon-elevated rounded text-gray-400 hover:text-git-amber"
                            title="Unstage file"
                          >
                            <Minus class="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </Show>

              {/* Unstaged Section */}
              <div>
                <div class="flex items-center justify-between text-[11px] text-gray-400 font-medium mb-1">
                  <span>CHANGES ({unstagedFiles().length})</span>
                  <Show when={unstagedFiles().length > 0}>
                    <button
                      onClick={() => repoStore.stageFiles(repo().path, [])}
                      class="text-gray-500 hover:text-gray-300 text-[10px]"
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
                        <div class="group flex items-center justify-between px-2 py-1 bg-carbon-base hover:bg-carbon-hover border border-carbon-border/50 rounded font-mono text-[11.5px]">
                          <div class="flex items-center gap-1.5 truncate">
                            {getStatusIcon(file.status)}
                            <span class="text-gray-200 truncate">{file.path}</span>
                          </div>
                          <div class="flex items-center gap-1">
                            <button
                              onClick={() => repoStore.stageFiles(repo().path, [file.path])}
                              class="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-carbon-elevated rounded text-gray-400 hover:text-git-emerald"
                              title="Stage file"
                            >
                              <Plus class="w-3 h-3" />
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
    </div>
  );
};
