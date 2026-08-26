import { Component, createSignal, Show } from "solid-js";
import {
  Pin,
  GitBranch,
  Radio,
  RefreshCw,
  X,
  AlertTriangle,
  Key,
  FolderOpen,
  Trash2,
  Copy,
} from "lucide-solid";
import { RepoStatus } from "../../types/git";
import { repoStore } from "../../store/repoStore";
import { batchStore } from "../../store/batchStore";
import { ContextMenu, MenuItem } from "../common/ContextMenu";

interface RepoRowProps {
  repo: RepoStatus;
  isSelected: boolean;
  onSelect: () => void;
  onBranchClick: () => void;
}

export const RepoRow: Component<RepoRowProps> = (props) => {
  const [contextMenuPos, setContextMenuPos] = createSignal<{
    x: number;
    y: number;
  } | null>(null);

  const batchEvent = () => batchStore.progressEvents()[props.repo.id];

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  const menuItems = (): MenuItem[] => [
    {
      id: "open-folder",
      label: "Open in File Manager",
      icon: <FolderOpen class="w-3.5 h-3.5 text-amber-400" />,
      onClick: () => repoStore.openPath(props.repo.path),
    },
    {
      id: "copy-path",
      label: "Copy Path",
      icon: <Copy class="w-3.5 h-3.5 text-gray-400" />,
      onClick: () => navigator.clipboard.writeText(props.repo.path),
    },
    { id: "div-1", label: "", divider: true },
    {
      id: "refresh",
      label: "Refresh Status",
      icon: <RefreshCw class="w-3.5 h-3.5 text-indigo-400" />,
      onClick: () => repoStore.refreshRepo(props.repo.path),
    },
    {
      id: "pin",
      label: props.repo.isPinned ? "Unpin Repository" : "Pin Repository to Top",
      icon: <Pin class="w-3.5 h-3.5 text-indigo-400" />,
      onClick: () => repoStore.togglePin(props.repo.id),
    },
    {
      id: "autofetch",
      label: props.repo.autoFetchEnabled
        ? "Disable Auto-Fetch"
        : "Enable Auto-Fetch",
      icon: <Radio class="w-3.5 h-3.5 text-cyan-400" />,
      onClick: () => repoStore.toggleAutoFetch(props.repo.id),
    },
    { id: "div-3", label: "", divider: true },
    {
      id: "remove",
      label: "Remove from Workspace",
      icon: <Trash2 class="w-3.5 h-3.5 text-rose-400" />,
      danger: true,
      onClick: () => repoStore.removeRepository(props.repo.id),
    },
  ];

  return (
    <>
      <div
        onClick={props.onSelect}
        onContextMenu={handleContextMenu}
        class={`group px-3 py-2.5 border-b border-carbon-border/70 cursor-pointer select-none transition-all flex flex-col gap-1.5 text-xs ${
          props.isSelected
            ? "bg-[#161B2B] border-l-2 border-l-indigo-400 shadow-sm"
            : "hover:bg-[#151924] bg-carbon-base"
        }`}
      >
        {/* Line 1: Main Header (Pin, Repo Name, Status Indicators, Actions) */}
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                void repoStore.togglePin(props.repo.id);
              }}
              class={`p-0.5 rounded transition-opacity ${
                props.repo.isPinned
                  ? "text-indigo-400 opacity-100"
                  : "text-gray-500 opacity-0 group-hover:opacity-100 hover:text-gray-300"
              }`}
              title={
                props.repo.isPinned
                  ? "Unpin repository"
                  : "Pin repository to top"
              }
            >
              <Pin class="w-3.5 h-3.5 rotate-45" />
            </button>

            <span
              class="font-bold text-gray-100 truncate text-[13px] tracking-tight"
              title={props.repo.path}
            >
              {props.repo.name}
            </span>

            {/* Dirty indicator */}
            <Show when={props.repo.isDirty}>
              <span
                class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0"
                title="Uncommitted changes"
              />
            </Show>
          </div>

          {/* Right side of Line 1: Conflict / Auth Badges / Hover Action Buttons */}
          <div class="flex items-center gap-1.5 flex-shrink-0">
            {/* Real-time batch progress state */}
            <Show when={batchEvent()}>
              {(event) => (
                <Show when={event().status === "running"}>
                  <span title={event().message}>
                    <RefreshCw class="w-3 h-3 text-cyan-400 animate-spin" />
                  </span>
                </Show>
              )}
            </Show>

            {/* Conflict Badge */}
            <Show
              when={
                props.repo.hasConflicts || batchEvent()?.status === "conflict"
              }
            >
              <span class="flex items-center gap-0.5 px-1.5 py-0.2 bg-rose-500/20 border border-rose-500/40 text-rose-400 rounded text-[9.5px] font-bold animate-pulse">
                <AlertTriangle class="w-2.5 h-2.5" />
                <span>Conflict</span>
              </span>
            </Show>

            {/* Auth Required Badge */}
            <Show when={batchEvent()?.status === "auth_required"}>
              <span class="flex items-center gap-0.5 px-1.5 py-0.2 bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded text-[9.5px] font-bold">
                <Key class="w-2.5 h-2.5" />
                <span>Auth</span>
              </span>
            </Show>

            {/* Quick action buttons on hover */}
            <div class="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  void repoStore.refreshRepo(props.repo.path);
                }}
                class="p-1 hover:bg-carbon-border rounded text-gray-400 hover:text-gray-200"
                title="Refresh repository status"
              >
                <RefreshCw
                  class={`w-3 h-3 ${
                    repoStore.isRefreshingRepo(props.repo.path)
                      ? "animate-spin text-cyan-400"
                      : ""
                  }`}
                />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  void repoStore.removeRepository(props.repo.id);
                }}
                class="p-1 hover:bg-carbon-border rounded text-gray-500 hover:text-rose-400"
                title="Remove repository"
              >
                <X class="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Line 2: Branch Badge + Ahead/Behind Counters (Left) + Last Fetch & AutoFetch (Right) */}
        <div class="flex items-center justify-between gap-2 pl-5">
          {/* Branch Pill & Repositioned Sync Indicators */}
          <div class="flex items-center gap-1.5 min-w-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                props.onBranchClick();
              }}
              class="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/35 rounded text-[11px] font-mono text-indigo-300 font-bold transition-all cursor-pointer shadow-xs truncate max-w-[155px]"
              title="Click to switch branch"
            >
              <GitBranch class="w-3 h-3 text-indigo-400 flex-shrink-0 stroke-[2.5]" />
              <span class="truncate">{props.repo.currentBranch}</span>
            </button>

            {/* Repositioned Ahead Counter (+3↑) */}
            <Show when={props.repo.aheadCount > 0}>
              <span
                class="px-1.5 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded font-mono text-[10px] font-bold tabular-nums flex-shrink-0 shadow-xs"
                title={`${props.repo.aheadCount} unpushed commits`}
              >
                +{props.repo.aheadCount}↑
              </span>
            </Show>

            {/* Repositioned Behind Counter (~1↓) */}
            <Show when={props.repo.behindCount > 0}>
              <span
                class="px-1.5 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded font-mono text-[10px] font-bold tabular-nums flex-shrink-0 shadow-xs"
                title={`${props.repo.behindCount} commits behind`}
              >
                ~{props.repo.behindCount}↓
              </span>
            </Show>
          </div>

          {/* Metadata: Last Fetched & Auto-Fetch */}
          <div class="flex items-center gap-1.5 text-[10px] font-mono text-gray-400 flex-shrink-0">
            <span class="truncate opacity-75">{props.repo.lastFetchedAt}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                void repoStore.toggleAutoFetch(props.repo.id);
              }}
              class={`p-0.5 rounded transition-colors cursor-pointer ${
                props.repo.autoFetchEnabled
                  ? "text-cyan-400 opacity-90 hover:opacity-100"
                  : "text-gray-600 opacity-40 hover:opacity-80"
              }`}
              title={
                props.repo.autoFetchEnabled
                  ? "Auto-fetch enabled"
                  : "Auto-fetch disabled"
              }
            >
              <Radio class="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      <Show when={contextMenuPos()}>
        {(pos) => (
          <ContextMenu
            x={pos().x}
            y={pos().y}
            isOpen={true}
            items={menuItems()}
            onClose={() => setContextMenuPos(null)}
          />
        )}
      </Show>
    </>
  );
};
