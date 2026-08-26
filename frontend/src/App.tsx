import { Component, createSignal, onMount, Show } from 'solid-js';
import { 
  GitBranch, 
  RefreshCw, 
  FolderGit2, 
  Layers, 
  Plus
} from 'lucide-solid';
import { TopToolbar } from './components/layout/TopToolbar';
import { LoadingScreen } from './components/layout/LoadingScreen';
import { StatusBar } from './components/layout/StatusBar';
import { RepoTree } from './components/repository/RepoTree';
import { ChangesView } from './components/repository/ChangesView';
import { OpenRepoModal } from './components/modals/OpenRepoModal';
import { BranchPicker } from './components/modals/BranchPicker';
import { PullAllModal } from './components/modals/PullAllModal';
import { PushReviewModal } from './components/modals/PushReviewModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { repoStore } from './store/repoStore';
import { RepoStatus } from './types/git';

export const App: Component = () => {
  const [isLoadingApp, setIsLoadingApp] = createSignal<boolean>(true);
  const [loadingStatus, setLoadingStatus] = createSignal<string>('Initializing Polyrepo Engine...');
  const [isOpenRepoOpen, setIsOpenRepoOpen] = createSignal<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = createSignal<boolean>(false);
  const [branchPickerRepo, setBranchPickerRepo] = createSignal<RepoStatus | null>(null);
  
  // Resizers
  const [sidebarWidth, setSidebarWidth] = createSignal<number>(380);
  const [changesViewHeight, setChangesViewHeight] = createSignal<number>(260);
  const [isDraggingSidebar, setIsDraggingSidebar] = createSignal<boolean>(false);
  const [isDraggingVertical, setIsDraggingVertical] = createSignal<boolean>(false);

  onMount(async () => {
    try {
      setLoadingStatus('Discovering configured repositories...');
      await repoStore.loadWorkspace();
      setLoadingStatus('Ready');
    } catch (err) {
      console.error('Initialization error:', err);
    } finally {
      // Intentional smooth minimum 600ms display to eliminate fast-system white/layout flicker
      setTimeout(() => {
        setIsLoadingApp(false);
      }, 650);
    }

    // Global keyboard shortcut: Ctrl+O to open repo
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        setIsOpenRepoOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Global mouse movements for resizers
    const handleMouseUp = () => {
      setIsDraggingSidebar(false);
      setIsDraggingVertical(false);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSidebar()) {
        const newWidth = Math.max(260, Math.min(650, e.clientX));
        setSidebarWidth(newWidth);
      }
      if (isDraggingVertical()) {
        const windowHeight = window.innerHeight;
        const newHeight = Math.max(120, Math.min(550, windowHeight - e.clientY - 24));
        setChangesViewHeight(newHeight);
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
  });

  const selectedRepo = () => repoStore.selectedRepo();

  return (
    <div class="flex flex-col h-screen w-screen bg-carbon-base text-gray-100 font-sans overflow-hidden select-none">
      {/* Animated Loading Screen */}
      <LoadingScreen isVisible={isLoadingApp()} statusText={loadingStatus()} />

      {/* Top Global Toolbar */}
      <TopToolbar 
        onOpenRepoClick={() => setIsOpenRepoOpen(true)} 
        onSettingsClick={() => setIsSettingsOpen(true)}
      />

      {/* Main Split Layout */}
      <div class="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div 
          style={{ width: `${sidebarWidth()}px` }}
          class="flex flex-col border-r border-carbon-border bg-carbon-base flex-shrink-0 select-none overflow-hidden"
        >
          {/* Top Half: Repositories List */}
          <div class="flex-1 overflow-hidden min-h-[120px]">
            <RepoTree
              onOpenRepoModal={() => setIsOpenRepoOpen(true)}
              onBranchPickerOpen={(repo) => setBranchPickerRepo(repo)}
            />
          </div>

          {/* Vertical Resizer Divider */}
          <div
            onMouseDown={() => setIsDraggingVertical(true)}
            class="h-1 hover:h-1.5 bg-carbon-border hover:bg-git-indigo cursor-row-resize transition-all z-10 flex-shrink-0 flex items-center justify-center group"
            title="Drag to resize Source Control view"
          >
            <div class="w-8 h-0.5 bg-gray-600 group-hover:bg-git-indigo rounded-full opacity-60" />
          </div>

          {/* Bottom Half: Changes View */}
          <div 
            style={{ height: `${changesViewHeight()}px` }}
            class="flex-shrink-0 overflow-hidden"
          >
            <ChangesView />
          </div>
        </div>

        {/* Horizontal Resizer Divider */}
        <div
          onMouseDown={() => setIsDraggingSidebar(true)}
          class="w-1 hover:w-1.5 bg-carbon-border hover:bg-git-indigo cursor-col-resize transition-all z-10 flex-shrink-0"
          title="Drag to resize sidebar width"
        />

        {/* Right Workspace Main Panel */}
        <main class="flex-1 bg-carbon-base flex flex-col overflow-hidden">
          <Show
            when={selectedRepo()}
            fallback={
              <div class="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
                <FolderGit2 class="w-12 h-12 text-gray-600 mb-3 opacity-40" />
                <h2 class="text-sm font-semibold text-gray-300 mb-1">No Repository Selected</h2>
                <p class="text-xs max-w-sm mb-4">
                  Open a repository from the left panel or click Open Repo to scan a folder containing multiple Git projects.
                </p>
                <button
                  onClick={() => setIsOpenRepoOpen(true)}
                  class="px-4 py-2 bg-git-indigo hover:bg-git-indigo/90 text-white font-medium rounded text-xs flex items-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <Plus class="w-4 h-4" />
                  <span>Open or Scan Repositories</span>
                </button>
              </div>
            }
          >
            {(repo) => (
              <div class="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
                {/* Repository Header Card */}
                <div class="bg-carbon-surface border border-carbon-border rounded-lg p-5 flex items-start justify-between">
                  <div class="space-y-1.5">
                    <div class="flex items-center gap-2.5">
                      <h1 class="text-base font-bold text-white tracking-wide">{repo().name}</h1>
                      <button
                        onClick={() => setBranchPickerRepo(repo())}
                        class="flex items-center gap-1.5 px-2 py-0.5 bg-carbon-elevated hover:bg-carbon-hover border border-carbon-border rounded text-xs font-mono text-git-indigo font-semibold cursor-pointer"
                        title="Switch Branch"
                      >
                        <GitBranch class="w-3.5 h-3.5" />
                        <span>{repo().currentBranch}</span>
                      </button>
                    </div>
                    <p class="text-xs text-gray-400 font-mono">{repo().path}</p>
                  </div>

                  <div class="flex items-center gap-2">
                    <button
                      onClick={() => repoStore.refreshRepo(repo().path)}
                      class="flex items-center gap-1.5 px-3 py-1.5 bg-carbon-elevated hover:bg-carbon-hover border border-carbon-border rounded text-xs font-medium text-gray-200 cursor-pointer"
                    >
                      <RefreshCw class="w-3.5 h-3.5 text-git-cyan" />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>

                {/* Status Grid */}
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div class="bg-carbon-surface border border-carbon-border rounded-lg p-4 space-y-1">
                    <span class="text-[11px] text-gray-400 uppercase font-semibold tracking-wider">Upstream Status</span>
                    <div class="flex items-baseline gap-2 font-mono">
                      <span class="text-sm font-bold text-git-emerald">+{repo().aheadCount} ahead</span>
                      <span class="text-sm font-bold text-git-amber">~{repo().behindCount} behind</span>
                    </div>
                    <p class="text-[11px] text-gray-500 truncate">{repo().upstreamBranch || 'No upstream configured'}</p>
                  </div>

                  <div class="bg-carbon-surface border border-carbon-border rounded-lg p-4 space-y-1">
                    <span class="text-[11px] text-gray-400 uppercase font-semibold tracking-wider">Working Tree</span>
                    <div class="text-sm font-bold text-white font-mono">
                      {repo().changedFilesCount} Files Changed
                    </div>
                    <p class="text-[11px] text-gray-500">{repo().isDirty ? 'Uncommitted modifications' : 'Clean working directory'}</p>
                  </div>

                  <div class="bg-carbon-surface border border-carbon-border rounded-lg p-4 space-y-1">
                    <span class="text-[11px] text-gray-400 uppercase font-semibold tracking-wider">Last Fetched</span>
                    <div class="text-sm font-bold text-gray-200 font-mono">
                      {repo().lastFetchedAt}
                    </div>
                    <p class="text-[11px] text-gray-500">Auto-fetch: {repo().autoFetchEnabled ? 'Enabled' : 'Disabled'}</p>
                  </div>
                </div>

                {/* Quick Action Bar */}
                <div class="bg-carbon-surface border border-carbon-border rounded-lg p-4">
                  <h3 class="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Layers class="w-3.5 h-3.5 text-git-indigo" />
                    <span>Repository Actions</span>
                  </h3>
                  <div class="flex flex-wrap gap-2 text-xs">
                    <button
                      onClick={() => setBranchPickerRepo(repo())}
                      class="flex items-center gap-1.5 px-3 py-1.5 bg-carbon-elevated hover:bg-carbon-hover border border-carbon-border rounded text-gray-200 cursor-pointer"
                    >
                      <GitBranch class="w-3.5 h-3.5 text-git-indigo" />
                      <span>Switch / Create Branch...</span>
                    </button>

                    <button
                      onClick={() => repoStore.stageFiles(repo().path, [])}
                      class="flex items-center gap-1.5 px-3 py-1.5 bg-carbon-elevated hover:bg-carbon-hover border border-carbon-border rounded text-gray-200 cursor-pointer"
                    >
                      <Plus class="w-3.5 h-3.5 text-git-emerald" />
                      <span>Stage All Changes</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </Show>
        </main>
      </div>

      {/* Persistent Resource Status Bar */}
      <StatusBar />

      {/* Modals */}
      <OpenRepoModal
        isOpen={isOpenRepoOpen()}
        onClose={() => setIsOpenRepoOpen(false)}
      />

      <BranchPicker
        repo={branchPickerRepo()}
        isOpen={branchPickerRepo() !== null}
        onClose={() => setBranchPickerRepo(null)}
      />

      <SettingsModal
        isOpen={isSettingsOpen()}
        onClose={() => setIsSettingsOpen(false)}
      />

      <PullAllModal />
      <PushReviewModal />
    </div>
  );
};
