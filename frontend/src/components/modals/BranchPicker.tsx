import { Component, createSignal, createEffect, For, Show } from 'solid-js';
import { 
  X, 
  GitBranch, 
  Search, 
  Check, 
  Plus, 
  Loader2, 
  Globe 
} from 'lucide-solid';
import { WailsBridge } from '../../services/wailsBridge';
import { repoStore } from '../../store/repoStore';
import { BranchInfo, RepoStatus } from '../../types/git';

interface BranchPickerProps {
  repo: RepoStatus | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BranchPicker: Component<BranchPickerProps> = (props) => {
  const [branches, setBranches] = createSignal<BranchInfo[]>([]);
  const [search, setSearch] = createSignal<string>('');
  const [newBranchName, setNewBranchName] = createSignal<string>('');
  const [isCreating, setIsCreating] = createSignal<boolean>(false);
  const [isLoading, setIsLoading] = createSignal<boolean>(false);

  createEffect(() => {
    const r = props.repo;
    if (props.isOpen && r) {
      setIsLoading(true);
      void WailsBridge.listBranches(r.path)
        .then((list) => setBranches(list))
        .catch((err) => console.error('Failed to list branches:', err))
        .finally(() => setIsLoading(false));
    }
  });

  const filteredBranches = () => {
    const q = search().toLowerCase().trim();
    const list = branches();
    if (!q) return list;
    return list.filter((b) => b.name.toLowerCase().includes(q));
  };

  const handleCheckout = async (branchName: string) => {
    if (!props.repo) return;
    try {
      await repoStore.checkoutBranch(props.repo.path, branchName);
      props.onClose();
    } catch (err) {
      console.error('Checkout failed:', err);
    }
  };

  const handleCreateBranch = async () => {
    const name = newBranchName().trim();
    if (!props.repo || !name) return;
    try {
      await WailsBridge.createBranch(props.repo.path, name, '', true);
      await repoStore.refreshRepo(props.repo.path);
      props.onClose();
    } catch (err) {
      console.error('Create branch failed:', err);
    }
  };

  return (
    <Show when={props.isOpen && props.repo}>
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
        <div class="w-full max-w-md bg-carbon-surface border border-carbon-border rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh] text-xs">
          {/* Header */}
          <div class="px-4 py-3 bg-carbon-elevated border-b border-carbon-border flex items-center justify-between">
            <div class="flex items-center gap-2">
              <GitBranch class="w-4 h-4 text-git-indigo" />
              <span class="font-semibold text-gray-200 text-sm">
                Switch Branch <span class="text-git-indigo font-mono">({props.repo?.name})</span>
              </span>
            </div>
            <button
              onClick={props.onClose}
              class="p-1 hover:bg-carbon-hover rounded text-gray-400 hover:text-gray-200 cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
          </div>


        {/* Search Bar */}
        <div class="p-3 border-b border-carbon-border bg-carbon-base">
          <div class="relative flex items-center">
            <Search class="w-3.5 h-3.5 text-gray-400 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search or filter branches..."
              value={search()}
              onInput={(e) => setSearch(e.currentTarget.value)}
              class="w-full pl-8 pr-3 py-1.5 bg-carbon-elevated border border-carbon-border rounded text-gray-200 text-xs focus:outline-none focus:border-git-indigo font-mono"
            />
          </div>
        </div>

        {/* Create Branch Accordion */}
        <div class="px-3 py-2 bg-carbon-surface border-b border-carbon-border">
          <Show
            when={isCreating()}
            fallback={
              <button
                onClick={() => setIsCreating(true)}
                class="flex items-center gap-1.5 text-git-indigo hover:text-git-indigo/80 font-medium py-1 cursor-pointer"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>Create new branch from HEAD...</span>
              </button>
            }
          >
            <div class="flex gap-2 py-1">
              <input
                type="text"
                placeholder="branch-name"
                value={newBranchName()}
                onInput={(e) => setNewBranchName(e.currentTarget.value)}
                class="flex-1 px-2.5 py-1 bg-carbon-base border border-carbon-border rounded text-gray-200 font-mono text-xs focus:outline-none focus:border-git-indigo"
              />
              <button
                onClick={handleCreateBranch}
                disabled={!newBranchName().trim()}
                class="px-3 py-1 bg-git-emerald hover:bg-git-emerald/90 disabled:opacity-40 text-gray-950 font-semibold rounded cursor-pointer"
              >
                Create
              </button>
              <button
                onClick={() => setIsCreating(false)}
                class="p-1 hover:bg-carbon-hover text-gray-400 rounded cursor-pointer"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
          </Show>
        </div>

        {/* Branch List */}
        <div class="flex-1 overflow-y-auto p-1 divide-y divide-carbon-border/40 bg-carbon-base">
          <Show
            when={!isLoading()}
            fallback={
              <div class="p-6 text-center text-gray-400 flex items-center justify-center gap-2">
                <Loader2 class="w-4 h-4 animate-spin text-git-indigo" />
                <span>Loading branches...</span>
              </div>
            }
          >
            <For each={filteredBranches()}>
              {(branch) => (
                <div
                  onClick={() => handleCheckout(branch.name)}
                  class="px-3 py-2 hover:bg-carbon-hover flex items-center justify-between cursor-pointer rounded transition-colors group"
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <Show
                      when={branch.isRemote}
                      fallback={<GitBranch class="w-3.5 h-3.5 text-git-indigo flex-shrink-0" />}
                    >
                      <Globe class="w-3.5 h-3.5 text-git-cyan flex-shrink-0" />
                    </Show>

                    <span
                      class={`font-mono truncate ${
                        branch.isCurrent ? 'text-git-emerald font-bold' : 'text-gray-300'
                      }`}
                    >
                      {branch.name}
                    </span>
                  </div>

                  <div class="flex items-center gap-2">
                    <Show when={branch.isCurrent}>
                      <span class="flex items-center gap-1 text-[10px] text-git-emerald font-bold">
                        <Check class="w-3 h-3 stroke-[3]" />
                        <span>current</span>
                      </span>
                    </Show>
                  </div>
                </div>
              )}
            </For>
          </Show>
        </div>
      </div>
    </div>
  </Show>
  );
};

