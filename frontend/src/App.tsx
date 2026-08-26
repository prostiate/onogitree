import { Component, createSignal, onMount, onCleanup, Show } from "solid-js";
import { FolderGit2, Plus } from "lucide-solid";

import { TopToolbar } from "./components/layout/TopToolbar";
import { LoadingScreen } from "./components/layout/LoadingScreen";
import { StatusBar } from "./components/layout/StatusBar";
import { RepoTree } from "./components/repository/RepoTree";
import { ChangesView } from "./components/repository/ChangesView";
import { RepoDashboard } from "./components/repository/RepoDashboard";
import { DiffViewer } from "./components/repository/DiffViewer";
import { OpenRepoModal } from "./components/modals/OpenRepoModal";
import { BranchPicker } from "./components/modals/BranchPicker";
import { PullAllModal } from "./components/modals/PullAllModal";
import { PushReviewModal } from "./components/modals/PushReviewModal";
import { SettingsModal } from "./components/modals/SettingsModal";
import { repoStore } from "./store/repoStore";
import { RepoStatus } from "./types/git";

const DEFAULT_SIDEBAR_WIDTH = 380;
const DEFAULT_CHANGES_VIEW_HEIGHT = 280;

export const App: Component = () => {
  const [isLoadingApp, setIsLoadingApp] = createSignal<boolean>(true);
  const [loadingStatus, setLoadingStatus] = createSignal<string>(
    "Initializing Polyrepo Engine...",
  );
  const [isOpenRepoOpen, setIsOpenRepoOpen] = createSignal<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = createSignal<boolean>(false);
  const [branchPickerRepo, setBranchPickerRepo] =
    createSignal<RepoStatus | null>(null);

  // Sidebar visibility & Accordion state (enforcing min 1 expanded)
  const [isSidebarCollapsed, setIsSidebarCollapsed] =
    createSignal<boolean>(false);
  const [isReposExpanded, setIsReposExpanded] = createSignal<boolean>(true);
  const [isChangesExpanded, setIsChangesExpanded] = createSignal<boolean>(true);

  // Resizers
  const [sidebarWidth, setSidebarWidth] = createSignal<number>(
    DEFAULT_SIDEBAR_WIDTH,
  );
  const [changesViewHeight, setChangesViewHeight] = createSignal<number>(
    DEFAULT_CHANGES_VIEW_HEIGHT,
  );
  const [isDraggingSidebar, setIsDraggingSidebar] =
    createSignal<boolean>(false);
  const [isDraggingVertical, setIsDraggingVertical] =
    createSignal<boolean>(false);

  const toggleReposAccordion = () => {
    if (isReposExpanded()) {
      if (!isChangesExpanded()) {
        setIsChangesExpanded(true);
      }
      setIsReposExpanded(false);
    } else {
      setIsReposExpanded(true);
    }
  };

  const toggleChangesAccordion = () => {
    if (isChangesExpanded()) {
      if (!isReposExpanded()) {
        setIsReposExpanded(true);
      }
      setIsChangesExpanded(false);
    } else {
      setIsChangesExpanded(true);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed());
  };

  onMount(async () => {
    try {
      setLoadingStatus("Discovering configured repositories...");
      await repoStore.loadWorkspace();
      setLoadingStatus("Ready");
    } catch (err) {
      console.error("Initialization error:", err);
    } finally {
      // Smooth minimum display to eliminate initial layout flicker
      setTimeout(() => {
        setIsLoadingApp(false);
      }, 650);
    }

    // Auto refresh on window focus (quiet background check)
    const handleFocus = () => {
      void repoStore.refreshAll(true);
    };
    window.addEventListener("focus", handleFocus);

    // Periodic live state polling (every 4 seconds, quiet background check)
    const pollTimer = setInterval(() => {
      if (document.visibilityState === "visible" && !repoStore.isLoading()) {
        void repoStore.refreshAll(true);
      }
    }, 4000);

    // Global keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      if (isCmdOrCtrl && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === "o") {
        e.preventDefault();
        setIsOpenRepoOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

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
        const newHeight = Math.max(
          120,
          Math.min(550, windowHeight - e.clientY - 24),
        );
        setChangesViewHeight(newHeight);
      }
    };

    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousemove", handleMouseMove);

    onCleanup(() => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(pollTimer);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMove);
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
        isSidebarCollapsed={isSidebarCollapsed()}
        onToggleSidebar={toggleSidebar}
      />

      {/* Main Split Layout */}
      <div class="flex flex-1 overflow-hidden">
        {/* Left Collapsible Sidebar */}
        <Show when={!isSidebarCollapsed()}>
          <div
            style={{ width: `${sidebarWidth()}px` }}
            class="flex flex-col border-r border-carbon-border bg-carbon-base flex-shrink-0 select-none overflow-hidden transition-all"
          >
            {/* Repositories Accordion Section */}
            <div
              class={`overflow-hidden transition-all ${
                isReposExpanded()
                  ? isChangesExpanded()
                    ? "flex-1 min-h-[120px]"
                    : "flex-1"
                  : "flex-shrink-0"
              }`}
            >
              <RepoTree
                onOpenRepoModal={() => setIsOpenRepoOpen(true)}
                onBranchPickerOpen={(repo) => setBranchPickerRepo(repo)}
                isExpanded={isReposExpanded()}
                onToggleExpand={toggleReposAccordion}
              />
            </div>

            {/* Vertical Resizer Divider (Only active when both accordions are open) */}
            <Show when={isReposExpanded() && isChangesExpanded()}>
              <div
                onMouseDown={() => setIsDraggingVertical(true)}
                onDblClick={() =>
                  setChangesViewHeight(DEFAULT_CHANGES_VIEW_HEIGHT)
                }
                class="h-1 hover:h-1.5 bg-carbon-border hover:bg-git-indigo cursor-row-resize transition-all z-10 flex-shrink-0 flex items-center justify-center group"
                title="Drag to resize Source Control view (Double-click to reset)"
              >
                <div class="w-8 h-0.5 bg-gray-600 group-hover:bg-git-indigo rounded-full opacity-60" />
              </div>
            </Show>

            {/* Source Control Changes Accordion Section */}
            <div
              style={
                isReposExpanded() && isChangesExpanded()
                  ? { height: `${changesViewHeight()}px` }
                  : undefined
              }
              class={`overflow-hidden transition-all ${
                isChangesExpanded()
                  ? isReposExpanded()
                    ? "flex-shrink-0"
                    : "flex-1"
                  : "flex-shrink-0"
              }`}
            >
              <ChangesView
                isExpanded={isChangesExpanded()}
                onToggleAccordion={toggleChangesAccordion}
              />
            </div>
          </div>

          {/* Horizontal Resizer Divider */}
          <div
            onMouseDown={() => setIsDraggingSidebar(true)}
            onDblClick={() => setSidebarWidth(DEFAULT_SIDEBAR_WIDTH)}
            class="w-1 hover:w-1.5 bg-carbon-border hover:bg-git-indigo cursor-col-resize transition-all z-10 flex-shrink-0"
            title="Drag to resize sidebar width (Double-click to reset)"
          />
        </Show>

        {/* Right Workspace Main Panel */}
        <main class="flex-1 bg-carbon-base flex flex-col overflow-hidden relative">
          <Show
            when={selectedRepo()}
            fallback={
              <div class="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
                <FolderGit2 class="w-12 h-12 text-gray-600 mb-3 opacity-40" />
                <h2 class="text-sm font-semibold text-gray-300 mb-1">
                  No Repository Selected
                </h2>
                <p class="text-xs max-w-sm mb-4">
                  Open a repository from the left panel or click Open Repo to
                  scan a folder containing multiple Git projects.
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
              <div
                class={`flex-1 flex flex-col overflow-hidden ${
                  repoStore.selectedFileDiff() ? "hidden" : "flex"
                }`}
              >
                <RepoDashboard
                  repo={repo()}
                  onBranchPickerOpen={() => setBranchPickerRepo(repo())}
                />
              </div>
            )}
          </Show>

          {/* High-Performance Diff Viewer */}
          <Show when={repoStore.selectedFileDiff()}>
            <div class="flex-1 flex flex-col overflow-hidden absolute inset-0 z-20 bg-[#0B0E14]">
              <DiffViewer />
            </div>
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
