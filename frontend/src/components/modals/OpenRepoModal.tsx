import { Component, createSignal, For, onMount, Show } from "solid-js";
import {
  X,
  FolderPlus,
  FolderOpen,
  Search,
  FolderGit2,
  CloudDownload,
  History,
  Check,
  Loader2,
  Github,
  Gitlab,
} from "lucide-solid";
import { WailsBridge } from "../../services/wailsBridge";
import { repoStore } from "../../store/repoStore";
import { DiscoveredRepo } from "../../types/git";

interface OpenRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OpenRepoModal: Component<OpenRepoModalProps> = (props) => {
  const [activeTab, setActiveTab] = createSignal<
    "local" | "scan" | "clone" | "recent"
  >("scan");

  // Local input
  const [localPath, setLocalPath] = createSignal<string>("");

  // Scan input
  const [scanPath, setScanPath] = createSignal<string>("");
  const [scanDepth] = createSignal<number>(3);
  const [isScanning, setIsScanning] = createSignal<boolean>(false);

  const [discoveredRepos, setDiscoveredRepos] = createSignal<DiscoveredRepo[]>(
    [],
  );
  const [selectedPaths, setSelectedPaths] = createSignal<Set<string>>(
    new Set(),
  );

  // Clone input
  const [cloneUrl, setCloneUrl] = createSignal<string>("");
  const [targetDir, setTargetDir] = createSignal<string>("");
  const [cliAuth, setCliAuth] = createSignal<{ gh: boolean; glab: boolean }>({
    gh: false,
    glab: false,
  });

  onMount(async () => {
    try {
      const auth = await WailsBridge.checkCLIAuth();
      setCliAuth(auth as { gh: boolean; glab: boolean });
    } catch {
      // ignore
    }
  });

  const handleBrowseScan = async () => {
    const selected = await WailsBridge.selectDirectory(
      "Select Workspace Directory to Scan",
    );
    if (selected) {
      setScanPath(selected);
      // Auto trigger scan
      setIsScanning(true);
      try {
        const repos = await WailsBridge.scanDirectory(selected, scanDepth());
        setDiscoveredRepos(repos);
        const allPaths = new Set<string>();
        for (const r of repos) {
          allPaths.add(r.path);
        }
        setSelectedPaths(allPaths);
      } catch (err) {
        console.error("Scan failed:", err);
      } finally {
        setIsScanning(false);
      }
    }
  };

  const handleBrowseLocal = async () => {
    const selected = await WailsBridge.selectDirectory(
      "Select Local Git Repository Folder",
    );
    if (selected) {
      setLocalPath(selected);
    }
  };

  const handleScan = async () => {
    const path = scanPath().trim();
    if (!path) return;
    setIsScanning(true);
    try {
      const repos = await WailsBridge.scanDirectory(path, scanDepth());
      setDiscoveredRepos(repos);
      // Select all by default
      const allPaths = new Set<string>();
      for (const r of repos) {
        allPaths.add(r.path);
      }
      setSelectedPaths(allPaths);
    } catch (err) {
      console.error("Scan failed:", err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleToggleSelect = (path: string) => {
    const next = new Set(selectedPaths());
    if (next.has(path)) {
      next.delete(path);
    } else {
      next.add(path);
    }
    setSelectedPaths(next);
  };

  const handleAddSelected = async () => {
    const paths = Array.from(selectedPaths());
    for (const p of paths) {
      try {
        await repoStore.addRepository(p);
      } catch (err) {
        console.error("Failed to add repo:", p, err);
      }
    }
    props.onClose();
  };

  const handleAddSingleLocal = async () => {
    const path = localPath().trim();
    if (!path) return;
    try {
      await repoStore.addRepository(path);
      props.onClose();
    } catch (err) {
      console.error("Failed to add single local repo:", err);
    }
  };

  return (
    <Show when={props.isOpen}>
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
        <div class="w-full max-w-2xl bg-carbon-surface border border-carbon-border rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-xs">
          {/* Modal Header */}
          <div class="px-4 py-3 bg-carbon-elevated border-b border-carbon-border flex items-center justify-between">
            <div class="flex items-center gap-2">
              <FolderGit2 class="w-4 h-4 text-git-indigo" />
              <span class="font-semibold text-gray-200 text-sm">
                Open or Discover Repositories
              </span>
            </div>
            <button
              onClick={props.onClose}
              class="p-1 hover:bg-carbon-hover rounded text-gray-400 hover:text-gray-200 cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div class="flex border-b border-carbon-border bg-carbon-base px-3 pt-2 gap-2 text-xs">
            <button
              onClick={() => setActiveTab("scan")}
              class={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors cursor-pointer ${
                activeTab() === "scan"
                  ? "border-git-indigo text-git-indigo"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              <Search class="w-3.5 h-3.5" />
              <span>Scan Workspace</span>
            </button>

            <button
              onClick={() => setActiveTab("local")}
              class={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors cursor-pointer ${
                activeTab() === "local"
                  ? "border-git-indigo text-git-indigo"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              <FolderPlus class="w-3.5 h-3.5" />
              <span>Open Local Folder</span>
            </button>

            <button
              onClick={() => setActiveTab("clone")}
              class={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors cursor-pointer ${
                activeTab() === "clone"
                  ? "border-git-indigo text-git-indigo"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              <CloudDownload class="w-3.5 h-3.5" />
              <span>Clone Remote</span>
            </button>

            <button
              onClick={() => setActiveTab("recent")}
              class={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors cursor-pointer ${
                activeTab() === "recent"
                  ? "border-git-indigo text-git-indigo"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              <History class="w-3.5 h-3.5" />
              <span>Recent Workspaces</span>
            </button>
          </div>

          {/* Tab Body */}
          <div class="p-4 flex-1 overflow-y-auto">
            {/* TAB 1: Scan Workspace */}
            <Show when={activeTab() === "scan"}>
              <div class="space-y-4">
                <p class="text-gray-400 text-xs">
                  Select a parent workspace directory to automatically detect
                  all nested Git repositories.
                </p>

                <div class="flex gap-2">
                  <input
                    type="text"
                    placeholder="/home/user/workspaces/my-projects"
                    value={scanPath()}
                    onInput={(e) => setScanPath(e.currentTarget.value)}
                    class="flex-1 px-3 py-1.5 bg-carbon-base border border-carbon-border rounded text-gray-200 font-mono text-xs focus:outline-none focus:border-git-indigo"
                  />
                  <button
                    onClick={handleBrowseScan}
                    class="px-3 py-1.5 bg-carbon-elevated hover:bg-carbon-hover border border-carbon-border text-gray-200 font-medium rounded text-xs flex items-center gap-1.5 cursor-pointer"
                    title="Browse directory on computer"
                  >
                    <FolderOpen class="w-3.5 h-3.5 text-git-indigo" />
                    <span>Browse...</span>
                  </button>
                  <button
                    onClick={handleScan}
                    disabled={isScanning() || !scanPath().trim()}
                    class="px-4 py-1.5 bg-git-indigo hover:bg-git-indigo/90 disabled:opacity-40 text-white font-medium rounded text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Show
                      when={isScanning()}
                      fallback={<Search class="w-3.5 h-3.5" />}
                    >
                      <Loader2 class="w-3.5 h-3.5 animate-spin" />
                    </Show>
                    <span>Scan Folder</span>
                  </button>
                </div>

                {/* Discovered List */}
                <Show when={discoveredRepos().length > 0}>
                  <div class="space-y-2">
                    <div class="flex items-center justify-between text-gray-400 font-medium">
                      <span>
                        Discovered Repositories ({discoveredRepos().length})
                      </span>
                      <span class="text-git-indigo">
                        {selectedPaths().size} selected
                      </span>
                    </div>

                    <div class="max-h-56 overflow-y-auto border border-carbon-border rounded divide-y divide-carbon-border bg-carbon-base">
                      <For each={discoveredRepos()}>
                        {(repo) => {
                          const isChecked = () =>
                            selectedPaths().has(repo.path);
                          return (
                            <div
                              onClick={() => handleToggleSelect(repo.path)}
                              class="px-3 py-2 hover:bg-carbon-hover flex items-center justify-between cursor-pointer"
                            >
                              <div class="flex items-center gap-2">
                                <div
                                  class={`w-4 h-4 rounded border flex items-center justify-center ${
                                    isChecked()
                                      ? "bg-git-indigo border-git-indigo text-white"
                                      : "border-carbon-border bg-carbon-surface"
                                  }`}
                                >
                                  <Show when={isChecked()}>
                                    <Check class="w-3 h-3 stroke-[3]" />
                                  </Show>
                                </div>
                                <span class="font-medium text-gray-200">
                                  {repo.name}
                                </span>
                              </div>
                              <span class="text-gray-500 font-mono text-[11px] truncate max-w-xs">
                                {repo.path}
                              </span>
                            </div>
                          );
                        }}
                      </For>
                    </div>
                  </div>
                </Show>
              </div>
            </Show>

            {/* TAB 2: Open Local Folder */}
            <Show when={activeTab() === "local"}>
              <div class="space-y-4">
                <p class="text-gray-400">
                  Specify or browse for a Git repository folder on your
                  computer:
                </p>
                <div class="flex gap-2">
                  <input
                    type="text"
                    placeholder="/home/user/my-repo"
                    value={localPath()}
                    onInput={(e) => setLocalPath(e.currentTarget.value)}
                    class="flex-1 px-3 py-1.5 bg-carbon-base border border-carbon-border rounded text-gray-200 font-mono text-xs focus:outline-none focus:border-git-indigo"
                  />
                  <button
                    onClick={handleBrowseLocal}
                    class="px-3 py-1.5 bg-carbon-elevated hover:bg-carbon-hover border border-carbon-border text-gray-200 font-medium rounded text-xs flex items-center gap-1.5 cursor-pointer"
                    title="Browse directory on computer"
                  >
                    <FolderOpen class="w-3.5 h-3.5 text-git-indigo" />
                    <span>Browse...</span>
                  </button>
                  <button
                    onClick={handleAddSingleLocal}
                    disabled={!localPath().trim()}
                    class="px-4 py-1.5 bg-git-indigo hover:bg-git-indigo/90 disabled:opacity-40 text-white font-medium rounded cursor-pointer"
                  >
                    Add Repository
                  </button>
                </div>
              </div>
            </Show>

            {/* TAB 3: Clone Remote */}
            <Show when={activeTab() === "clone"}>
              <div class="space-y-4">
                <div class="flex items-center gap-4 bg-carbon-base p-3 border border-carbon-border rounded">
                  <span class="text-gray-400 font-medium">
                    CLI Integrations:
                  </span>
                  <div class="flex items-center gap-1 text-xs">
                    <Github class="w-3.5 h-3.5 text-gray-300" />
                    <span>GitHub CLI:</span>
                    <span
                      class={
                        cliAuth().gh
                          ? "text-git-emerald font-bold"
                          : "text-gray-500"
                      }
                    >
                      {cliAuth().gh ? "✓ Logged in" : "Not detected"}
                    </span>
                  </div>
                  <div class="flex items-center gap-1 text-xs">
                    <Gitlab class="w-3.5 h-3.5 text-git-amber" />
                    <span>GitLab CLI:</span>
                    <span
                      class={
                        cliAuth().glab
                          ? "text-git-emerald font-bold"
                          : "text-gray-500"
                      }
                    >
                      {cliAuth().glab ? "✓ Logged in" : "Not detected"}
                    </span>
                  </div>
                </div>

                <div class="space-y-2">
                  <label class="block text-gray-300 font-medium">
                    Repository Remote URL (HTTPS / SSH):
                  </label>
                  <input
                    type="text"
                    placeholder="https://gitlab.com/org/repo.git or git@github.com:org/repo.git"
                    value={cloneUrl()}
                    onInput={(e) => setCloneUrl(e.currentTarget.value)}
                    class="w-full px-3 py-1.5 bg-carbon-base border border-carbon-border rounded text-gray-200 font-mono text-xs focus:outline-none focus:border-git-indigo"
                  />
                </div>

                <div class="space-y-2">
                  <label class="block text-gray-300 font-medium">
                    Destination Directory:
                  </label>
                  <input
                    type="text"
                    placeholder="/home/user/workspaces/personal/"
                    value={targetDir()}
                    onInput={(e) => setTargetDir(e.currentTarget.value)}
                    class="w-full px-3 py-1.5 bg-carbon-base border border-carbon-border rounded text-gray-200 font-mono text-xs focus:outline-none focus:border-git-indigo"
                  />
                </div>
              </div>
            </Show>

            {/* TAB 4: Recent Workspaces */}
            <Show when={activeTab() === "recent"}>
              <div class="text-center py-6 text-gray-500">
                <History class="w-6 h-6 mx-auto mb-2 opacity-40" />
                <p>
                  Default Workspace active (contains{" "}
                  {repoStore.repositories().length} repositories).
                </p>
              </div>
            </Show>
          </div>

          {/* Modal Footer */}
          <div class="px-4 py-3 bg-carbon-elevated border-t border-carbon-border flex items-center justify-end gap-2">
            <button
              onClick={props.onClose}
              class="px-3 py-1.5 bg-carbon-hover hover:bg-carbon-border text-gray-300 rounded font-medium cursor-pointer"
            >
              Cancel
            </button>
            <Show when={activeTab() === "scan" && discoveredRepos().length > 0}>
              <button
                onClick={handleAddSelected}
                disabled={selectedPaths().size === 0}
                class="px-4 py-1.5 bg-git-emerald hover:bg-git-emerald/90 text-gray-950 font-semibold rounded cursor-pointer"
              >
                Add {selectedPaths().size} Repositories
              </button>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  );
};
