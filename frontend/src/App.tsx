import { Component, createSignal, onMount, onCleanup, Show } from 'solid-js';
import { 
  FolderGit2, 
  Plus
} from 'lucide-solid';

import { TopToolbar } from './components/layout/TopToolbar';
import { LoadingScreen } from './components/layout/LoadingScreen';
import { StatusBar } from './components/layout/StatusBar';
import { RepoTree } from './components/repository/RepoTree';
import { ChangesView } from './components/repository/ChangesView';
import { RepoDashboard } from './components/repository/RepoDashboard';
import { DiffViewer } from './components/repository/DiffViewer';
import { OpenRepoModal } from './components/modals/OpenRepoModal';
import { BranchPicker } from './components/modals/BranchPicker';
import { PullAllModal } from './components/modals/PullAllModal';
import { PushReviewModal } from './components/modals/PushReviewModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { repoStore } from './store/repoStore';
import { RepoStatus } from './types/git';


const DEFAULT_SIDEBAR_WIDTH = 380;
const DEFAULT_CHANGES_VIEW_HEIGHT = 260;

export const App: Component = () => {
  const [isLoadingApp, setIsLoadingApp] = createSignal<boolean>(true);
  const [loadingStatus, setLoadingStatus] = createSignal<string>('Initializing Polyrepo Engine...');
  const [isOpenRepoOpen, setIsOpenRepoOpen] = createSignal<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = createSignal<boolean>(false);
  const [branchPickerRepo, setBranchPickerRepo] = createSignal<RepoStatus | null>(null);
  
  // Resizers
  const [sidebarWidth, setSidebarWidth] = createSignal<number>(DEFAULT_SIDEBAR_WIDTH);
  const [changesViewHeight, setChangesViewHeight] = createSignal<number>(DEFAULT_CHANGES_VIEW_HEIGHT);
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

    // Auto refresh on window focus
    const handleFocus = () => {
      void repoStore.refreshAll();
    };
    window.addEventListener('focus', handleFocus);


    // Periodic live state polling (every 4 seconds)
    const pollTimer = setInterval(() => {
      if (document.visibilityState === 'visible' && !repoStore.isLoading()) {
        void repoStore.refreshAll();
      }
    }, 4000);

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

    onCleanup(() => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(pollTimer);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    });
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
            onDblClick={() => setChangesViewHeight(DEFAULT_CHANGES_VIEW_HEIGHT)}
            class="h-1 hover:h-1.5 bg-carbon-border hover:bg-git-indigo cursor-row-resize transition-all z-10 flex-shrink-0 flex items-center justify-center group"
            title="Drag to resize Source Control view (Double-click to reset)"
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
          onDblClick={() => setSidebarWidth(DEFAULT_SIDEBAR_WIDTH)}
          class="w-1 hover:w-1.5 bg-carbon-border hover:bg-git-indigo cursor-col-resize transition-all z-10 flex-shrink-0"
          title="Drag to resize sidebar width (Double-click to reset)"
        />


        {/* Right Workspace Main Panel */}
        <main class="flex-1 bg-carbon-base flex flex-col overflow-hidden">
          <Show
            when={repoStore.selectedFileDiff()}
            fallback={
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
                  <RepoDashboard
                    repo={repo()}
                    onBranchPickerOpen={() => setBranchPickerRepo(repo())}
                  />
                )}
              </Show>
            }
          >
            <DiffViewer />
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
