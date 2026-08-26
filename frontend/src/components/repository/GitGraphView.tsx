import { Component, createSignal, createMemo, For, Show } from "solid-js";
import {
  GitBranch,
  FileCode,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  ChevronsUpDown,
  FileDiff,
  Cloud,
  Tag,
  CircleDot,
  Plus,
  Minus,
  RefreshCw,
} from "lucide-solid";
import { repoStore } from "../../store/repoStore";
import {
  RepoStatus,
  CommitSummary,
  CommitFileChange,
  FileStatus,
} from "../../types/git";
import { buildGenericTree, GenericTreeNode } from "../../utils/fileTree";

interface GitGraphViewProps {
  repo: RepoStatus;
  commits: CommitSummary[];
  onCommitContextMenu: (e: MouseEvent, commit: CommitSummary) => void;
}

const LANE_COLORS = [
  "#38BDF8", // Sky Blue
  "#34D399", // Emerald Mint
  "#C084FC", // Purple
  "#FBBF24", // Solar Amber
  "#F43F5E", // Rose
  "#A78BFA", // Indigo/Violet
  "#2DD4BF", // Teal
];

export const GitGraphView: Component<GitGraphViewProps> = (props) => {
  const [copiedHash, setCopiedHash] = createSignal<string | null>(null);
  const [expandedFolders, setExpandedFolders] = createSignal<Set<string>>(
    new Set<string>(),
  );
  const [isOutgoingExpanded, setIsOutgoingExpanded] = createSignal(false);

  const expandedCommitHashes = () => repoStore.expandedCommitHashes();

  const copyText = (text: string, id: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  // Lane Allocation Computation
  const graphNodes = createMemo(() => {
    const list = props.commits;
    const activeLanes: (string | null)[] = [];
    const nodes = list.map((commit, idx) => {
      let laneIndex = activeLanes.indexOf(commit.hash);
      if (laneIndex === -1) {
        laneIndex = activeLanes.indexOf(null);
        if (laneIndex === -1) {
          laneIndex = activeLanes.length;
          activeLanes.push(commit.hash);
        } else {
          activeLanes[laneIndex] = commit.hash;
        }
      }

      const color = LANE_COLORS[laneIndex % LANE_COLORS.length];
      const parents = commit.parents || [];

      // Next lanes assignment for subsequent commits
      if (parents.length === 0) {
        activeLanes[laneIndex] = null;
      } else {
        activeLanes[laneIndex] = parents[0];
        for (let p = 1; p < parents.length; p++) {
          const parentHash = parents[p];
          if (!activeLanes.includes(parentHash)) {
            const freeSlot = activeLanes.indexOf(null);
            if (freeSlot === -1) activeLanes.push(parentHash);
            else activeLanes[freeSlot] = parentHash;
          }
        }
      }

      return {
        commit,
        laneIndex,
        color,
        hasTopLine: true,
        hasBottomLine: idx < list.length - 1,
        activeLanesCount: Math.max(
          1,
          activeLanes.filter((l) => l !== null).length,
        ),
      };
    });

    return nodes;
  });

  const getFileBadge = (filePath: string) => {
    const ext = filePath.split(".").pop()?.toLowerCase() || "";
    switch (ext) {
      case "go":
        return (
          <span class="px-1 py-0.5 bg-cyan-500/20 text-cyan-400 font-mono text-[9.5px] font-black rounded border border-cyan-500/40">
            go
          </span>
        );
      case "ts":
        return (
          <span class="px-1 py-0.5 bg-blue-500/20 text-blue-400 font-mono text-[9.5px] font-black rounded border border-blue-500/40">
            TS
          </span>
        );
      case "tsx":
        return (
          <span class="px-1 py-0.5 bg-sky-500/20 text-sky-400 font-mono text-[9.5px] font-black rounded border border-sky-500/40">
            TSX
          </span>
        );
      case "js":
      case "jsx":
        return (
          <span class="px-1 py-0.5 bg-amber-500/20 text-amber-400 font-mono text-[9.5px] font-black rounded border border-amber-500/40">
            JS
          </span>
        );
      case "css":
      case "scss":
        return (
          <span class="px-1 py-0.5 bg-pink-500/20 text-pink-400 font-mono text-[9.5px] font-black rounded border border-pink-500/40">
            CSS
          </span>
        );
      case "json":
        return (
          <span class="px-1 py-0.5 bg-yellow-500/20 text-yellow-400 font-mono text-[9.5px] font-black rounded border border-yellow-500/40">
            JSON
          </span>
        );
      case "md":
        return (
          <span class="px-1 py-0.5 bg-indigo-500/20 text-indigo-400 font-mono text-[9.5px] font-black rounded border border-indigo-500/40">
            MD
          </span>
        );
      default:
        return <FileCode class="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  const getStatusLetter = (status: string) => {
    switch (status) {
      case "modified":
      case "staged":
        return (
          <span class="font-mono text-xs font-bold text-amber-400">M</span>
        );
      case "added":
      case "untracked":
        return (
          <span class="font-mono text-xs font-bold text-emerald-400">A</span>
        );
      case "deleted":
        return <span class="font-mono text-xs font-bold text-rose-400">D</span>;
      case "renamed":
        return <span class="font-mono text-xs font-bold text-cyan-400">R</span>;
      default:
        return (
          <span class="font-mono text-xs font-bold text-amber-400">M</span>
        );
    }
  };

  const renderRefPills = (refsStr?: string) => {
    if (!refsStr) return null;
    const rawRefs = refsStr
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);

    return (
      <div class="flex items-center gap-1.5 flex-wrap">
        <For each={rawRefs}>
          {(ref) => {
            if (ref.startsWith("HEAD -> ")) {
              const branch = ref.replace("HEAD -> ", "");
              return (
                <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/50 rounded-full font-mono text-[10.5px] font-bold shadow-sm">
                  <CircleDot class="w-3 h-3 text-sky-400" />
                  <span>{branch}</span>
                </span>
              );
            }
            if (ref.startsWith("tag: ")) {
              const tag = ref.replace("tag: ", "");
              return (
                <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/50 rounded-full font-mono text-[10.5px] font-bold shadow-sm">
                  <Tag class="w-3 h-3 text-amber-400" />
                  <span>{tag}</span>
                </span>
              );
            }
            if (ref.includes("origin/") || ref.includes("upstream/")) {
              return (
                <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/50 rounded-full font-mono text-[10.5px] font-bold shadow-sm">
                  <Cloud class="w-3 h-3 text-purple-400" />
                  <span>{ref}</span>
                </span>
              );
            }
            return (
              <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 rounded-full font-mono text-[10.5px] font-bold shadow-sm">
                <GitBranch class="w-3 h-3 text-indigo-400" />
                <span>{ref}</span>
              </span>
            );
          }}
        </For>
      </div>
    );
  };

  // Recursive Tree Node Renderer for Commit Files
  const renderCommitTreeNode = (
    node: GenericTreeNode<CommitFileChange>,
    commitHash: string,
    depth: number = 0,
  ) => {
    const isFolder = node.isFolder;
    const isExpanded = () =>
      expandedFolders().has(node.id) ||
      (expandedFolders().size === 0 && depth === 0);

    if (isFolder) {
      return (
        <div class="select-none">
          <div
            onClick={() => toggleFolder(node.id)}
            class="flex items-center gap-1.5 px-3 py-1 hover:bg-[#1A1F2C] text-gray-300 hover:text-white cursor-pointer text-xs font-mono transition-colors"
            style={{ "padding-left": `${depth * 14 + 8}px` }}
          >
            <Show
              when={isExpanded()}
              fallback={<ChevronRight class="w-3 h-3 text-gray-500" />}
            >
              <ChevronDown class="w-3 h-3 text-indigo-400" />
            </Show>
            <Show
              when={isExpanded()}
              fallback={<Folder class="w-3.5 h-3.5 text-amber-400/80" />}
            >
              <FolderOpen class="w-3.5 h-3.5 text-amber-400" />
            </Show>
            <span class="font-semibold text-gray-300">{node.name}</span>
          </div>

          <Show when={isExpanded()}>
            <For each={node.children}>
              {(child) => renderCommitTreeNode(child, commitHash, depth + 1)}
            </For>
          </Show>
        </div>
      );
    }

    const file = node.item!;
    return (
      <div
        onClick={() =>
          repoStore.selectFileForDiff(file.path, false, commitHash)
        }
        class="group flex items-center justify-between px-3 py-1 hover:bg-[#1A1F2C] text-gray-300 hover:text-white cursor-pointer text-xs font-mono transition-colors"
        style={{ "padding-left": `${depth * 14 + 20}px` }}
      >
        <div class="flex items-center gap-2 min-w-0">
          {getFileBadge(file.path)}
          <span class="truncate text-gray-200 group-hover:text-indigo-300">
            {node.name}
          </span>
        </div>

        <div class="flex items-center gap-3 text-[11px] tabular-nums flex-shrink-0 mr-1">
          <Show when={file.additions > 0}>
            <span class="text-emerald-400 font-bold">+{file.additions}</span>
          </Show>
          <Show when={file.deletions > 0}>
            <span class="text-rose-400 font-bold">-{file.deletions}</span>
          </Show>
          {getStatusLetter(file.status)}
        </div>
      </div>
    );
  };

  // Recursive Tree Node Renderer for Outgoing Uncommitted Files
  const renderOutgoingTreeNode = (
    node: GenericTreeNode<FileStatus>,
    depth: number = 0,
  ) => {
    const isFolder = node.isFolder;
    const isExpanded = () =>
      expandedFolders().has(node.id) ||
      (expandedFolders().size === 0 && depth === 0);

    if (isFolder) {
      return (
        <div class="select-none">
          <div
            onClick={() => toggleFolder(node.id)}
            class="flex items-center gap-1.5 px-3 py-1 hover:bg-[#1A1F2C] text-gray-300 hover:text-white cursor-pointer text-xs font-mono transition-colors"
            style={{ "padding-left": `${depth * 14 + 8}px` }}
          >
            <Show
              when={isExpanded()}
              fallback={<ChevronRight class="w-3 h-3 text-gray-500" />}
            >
              <ChevronDown class="w-3 h-3 text-sky-400" />
            </Show>
            <Show
              when={isExpanded()}
              fallback={<Folder class="w-3.5 h-3.5 text-amber-400/80" />}
            >
              <FolderOpen class="w-3.5 h-3.5 text-amber-400" />
            </Show>
            <span class="font-semibold text-gray-300">{node.name}</span>
          </div>

          <Show when={isExpanded()}>
            <For each={node.children}>
              {(child) => renderOutgoingTreeNode(child, depth + 1)}
            </For>
          </Show>
        </div>
      );
    }

    const file = node.item!;
    return (
      <div
        onClick={() => repoStore.selectFileForDiff(file.path, file.staged)}
        class="group flex items-center justify-between px-3 py-1 hover:bg-[#1A1F2C] text-gray-300 hover:text-white cursor-pointer text-xs font-mono transition-colors"
        style={{ "padding-left": `${depth * 14 + 20}px` }}
      >
        <div class="flex items-center gap-2 min-w-0">
          {getFileBadge(file.path)}
          <span class="truncate text-gray-200 group-hover:text-sky-300">
            {node.name}
          </span>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0 mr-1">
          <Show
            when={file.staged}
            fallback={
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  void repoStore.stageFiles(props.repo.path, [file.path]);
                }}
                class="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-emerald-500/20 text-gray-400 hover:text-emerald-400 rounded transition-all"
                title="Stage file"
              >
                <Plus class="w-3 h-3" />
              </button>
            }
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                void repoStore.unstageFiles(props.repo.path, [file.path]);
              }}
              class="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-amber-500/20 text-gray-400 hover:text-amber-400 rounded transition-all"
              title="Unstage file"
            >
              <Minus class="w-3 h-3" />
            </button>
          </Show>
          {getStatusLetter(file.status)}
        </div>
      </div>
    );
  };

  const hasOutgoingOrUncommitted = () =>
    (props.repo.files && props.repo.files.length > 0) ||
    props.repo.aheadCount > 0;

  const outgoingFilesTree = createMemo(() =>
    buildGenericTree(props.repo.files || []),
  );

  return (
    <div class="space-y-0.5 font-sans select-none">
      {/* 1. Top Special Node: Outgoing Changes / Uncommitted Changes */}
      <Show when={hasOutgoingOrUncommitted()}>
        <div
          class={`group flex items-stretch border-b border-gray-800/60 transition-colors ${
            isOutgoingExpanded() ? "bg-[#121624]/80" : "hover:bg-[#141824]/60"
          }`}
        >
          {/* Continuous Left Graph Spine */}
          <div class="w-8 flex-shrink-0 flex flex-col items-center relative">
            {/* Dashed Node Circle */}
            <div class="h-9 flex items-center justify-center relative">
              <svg width="24" height="36" class="overflow-visible">
                {/* Outgoing Dashed Ring Node */}
                <circle
                  cx="12"
                  cy="18"
                  r="6.5"
                  fill="none"
                  stroke="#38BDF8"
                  stroke-width="2"
                  stroke-dasharray="3,2.5"
                />
                <circle cx="12" cy="18" r="2.5" fill="#38BDF8" />
                {/* Dashed Vertical Line Connecting to HEAD Commit */}
                <line
                  x1="12"
                  y1="25"
                  x2="12"
                  y2="36"
                  stroke="#38BDF8"
                  stroke-width="2"
                  stroke-dasharray="3,2.5"
                />
              </svg>
            </div>

            {/* Continuous Vertical Spine when Outgoing is Expanded */}
            <Show when={isOutgoingExpanded()}>
              <div class="flex-1 w-0.5 border-l-2 border-dashed border-sky-400/80 my-1" />
            </Show>
          </div>

          {/* Outgoing Changes Row Content */}
          <div class="flex-1 min-w-0 py-2 pr-3">
            <div
              onClick={() => setIsOutgoingExpanded(!isOutgoingExpanded())}
              class="flex items-center justify-between gap-3 cursor-pointer"
            >
              <div class="flex items-center gap-2 truncate">
                <span class="font-bold text-xs text-sky-300 font-mono tracking-tight">
                  Outgoing Changes
                </span>
                <span class="text-xs text-gray-400 font-mono">
                  {props.repo.currentBranch}
                </span>

                <Show when={props.repo.aheadCount > 0}>
                  <span class="px-2 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full font-mono text-[10px] font-bold">
                    +{props.repo.aheadCount} to push
                  </span>
                </Show>

                <Show when={props.repo.changedFilesCount > 0}>
                  <span class="px-2 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-full font-mono text-[10px] font-bold">
                    {props.repo.changedFilesCount} uncommitted
                  </span>
                </Show>
              </div>

              <button class="p-1 rounded text-gray-400 hover:text-white transition-transform">
                <Show
                  when={isOutgoingExpanded()}
                  fallback={<ChevronRight class="w-3.5 h-3.5" />}
                >
                  <ChevronDown class="w-3.5 h-3.5 text-sky-400" />
                </Show>
              </button>
            </div>

            {/* Expanded Outgoing Changes Files Tree */}
            <Show when={isOutgoingExpanded()}>
              <div class="mt-2.5 pt-2 border-t border-gray-800/80 space-y-2">
                <div class="flex items-center justify-between text-xs text-gray-400 px-1 font-mono">
                  <span>
                    WORKING TREE FILES ({props.repo.files?.length || 0})
                  </span>
                  <div class="flex items-center gap-2">
                    <button
                      onClick={() => repoStore.stageFiles(props.repo.path, [])}
                      class="px-2 py-0.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 rounded font-semibold text-[10px] cursor-pointer"
                    >
                      Stage All
                    </button>
                    <button
                      onClick={() =>
                        repoStore.unstageFiles(props.repo.path, [])
                      }
                      class="px-2 py-0.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded font-semibold text-[10px] cursor-pointer"
                    >
                      Unstage All
                    </button>
                  </div>
                </div>

                <div class="bg-carbon-base/60 border border-carbon-border/60 rounded-xl overflow-hidden py-1">
                  <For each={outgoingFilesTree()}>
                    {(node) => renderOutgoingTreeNode(node)}
                  </For>
                </div>
              </div>
            </Show>
          </div>
        </div>
      </Show>

      {/* 2. Main Commits Graph Timeline */}
      <For each={graphNodes()}>
        {(node, idx) => {
          const commit = node.commit;
          const isExpanded = () => expandedCommitHashes().has(commit.hash);
          const detail = () => repoStore.getCommitDetail(commit.hash);

          const laneX = () => node.laneIndex * 16 + 12;

          return (
            <div
              class={`group flex items-stretch border-b border-gray-800/40 transition-all ${
                isExpanded()
                  ? "bg-[#121624] border-indigo-500/50 shadow-md"
                  : "hover:bg-[#141824]/60"
              }`}
            >
              {/* Left Graph Spine Column */}
              <div
                class="flex-shrink-0 flex flex-col items-center relative"
                style={{
                  width: `${Math.max(2, node.laneIndex + 1) * 16 + 10}px`,
                }}
              >
                {/* SVG Node and Branch Connectors */}
                <div class="h-9 flex items-center justify-center relative w-full">
                  <svg
                    width={`${Math.max(2, node.laneIndex + 1) * 16 + 10}`}
                    height="36"
                    class="overflow-visible"
                  >
                    {/* Top connecting vertical line */}
                    <Show when={node.hasTopLine || idx() > 0}>
                      <line
                        x1={laneX()}
                        y1="0"
                        x2={laneX()}
                        y2="18"
                        stroke={node.color}
                        stroke-width="2"
                      />
                    </Show>

                    {/* Bottom connecting vertical line */}
                    <Show when={node.hasBottomLine}>
                      <line
                        x1={laneX()}
                        y1="18"
                        x2={laneX()}
                        y2="36"
                        stroke={node.color}
                        stroke-width="2"
                      />
                    </Show>

                    {/* Branch Node Ring / Dot */}
                    <circle
                      cx={laneX()}
                      cy="18"
                      r="5.5"
                      fill={isExpanded() ? node.color : "#0B0E14"}
                      stroke={node.color}
                      stroke-width="2.5"
                      class="transition-transform group-hover:scale-110"
                    />
                    <circle
                      cx={laneX()}
                      cy="18"
                      r="2"
                      fill={isExpanded() ? "#ffffff" : node.color}
                    />
                  </svg>
                </div>

                {/* Continuous Graph Vertical Spine for Expanded Commit */}
                <Show when={isExpanded()}>
                  <div
                    class="flex-1 w-0.5 my-1"
                    style={{
                      "background-color": node.color,
                      "margin-left": `${node.laneIndex * 16 + 2}px`,
                    }}
                  />
                </Show>
              </div>

              {/* Commit Content Body */}
              <div class="flex-1 min-w-0 py-2 pr-3">
                {/* Top Commit Row Header */}
                <div
                  onClick={() => repoStore.toggleCommitExpanded(commit.hash)}
                  onContextMenu={(e) => props.onCommitContextMenu(e, commit)}
                  class="flex items-center justify-between gap-3 cursor-pointer"
                >
                  {/* Subject, Author & Ref Pills */}
                  <div class="flex items-center gap-2.5 min-w-0 flex-1 flex-wrap">
                    {/* Commit Subject */}
                    <span class="font-semibold text-xs text-gray-200 group-hover:text-white truncate">
                      {commit.subject}
                    </span>

                    {/* Commit Author */}
                    <span class="text-xs text-gray-500 font-mono">
                      {commit.authorName}
                    </span>

                    {/* Ref Pills (Local, Remote, Tags) */}
                    {renderRefPills(commit.refs)}
                  </div>

                  {/* Right Action Icons & Date */}
                  <div class="flex items-center gap-3 text-xs text-gray-500 font-mono flex-shrink-0">
                    <span class="hidden md:inline">{commit.relativeDate}</span>

                    {/* Quick Diff Action Icon */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void repoStore.selectFileForDiff(
                          "__ALL__",
                          false,
                          commit.hash,
                        );
                      }}
                      class="p-1 hover:bg-carbon-hover text-gray-400 hover:text-indigo-300 rounded opacity-0 group-hover:opacity-100 transition-all"
                      title="Inspect commit diff"
                    >
                      <FileDiff class="w-3.5 h-3.5" />
                    </button>

                    <button
                      class={`p-0.5 text-gray-400 hover:text-white transition-transform ${
                        isExpanded() ? "rotate-90 text-indigo-400" : ""
                      }`}
                    >
                      <ChevronRight class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Commit Details & Modified Files Tree */}
                <Show when={isExpanded()}>
                  <div class="mt-2.5 pt-2 border-t border-gray-800/80 space-y-3">
                    <Show
                      when={detail()}
                      fallback={
                        <div class="py-3 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                          <RefreshCw class="w-3.5 h-3.5 animate-spin text-indigo-400" />
                          <span>Loading commit details...</span>
                        </div>
                      }
                    >
                      {(d) => {
                        const commitFilesTree = createMemo(() =>
                          buildGenericTree(d().files || []),
                        );

                        return (
                          <div class="space-y-3">
                            {/* Metadata / Actions Bar */}
                            <div class="bg-carbon-base/70 p-3 rounded-xl border border-carbon-border/60 text-xs font-mono space-y-2">
                              <div class="flex items-center justify-between text-gray-400 text-[11px] gap-2 flex-wrap">
                                <span class="truncate">SHA: {d().hash}</span>

                                <div class="flex items-center gap-2">
                                  <button
                                    onClick={() =>
                                      repoStore.selectFileForDiff(
                                        "__ALL__",
                                        false,
                                        d().hash,
                                      )
                                    }
                                    class="px-2.5 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                                    title="View entire commit diff"
                                  >
                                    <FileDiff class="w-3.5 h-3.5 text-indigo-400" />
                                    <span>View Entire Diff</span>
                                  </button>

                                  <button
                                    onClick={() =>
                                      copyText(d().hash, `sha-${d().hash}`)
                                    }
                                    class="px-2 py-1 bg-carbon-surface hover:bg-carbon-hover border border-carbon-border text-gray-300 hover:text-white rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                                  >
                                    <Show
                                      when={copiedHash() === `sha-${d().hash}`}
                                      fallback={<Copy class="w-3 h-3" />}
                                    >
                                      <Check class="w-3 h-3 text-emerald-400" />
                                    </Show>
                                    <span>
                                      {copiedHash() === `sha-${d().hash}`
                                        ? "Copied"
                                        : "Copy SHA"}
                                    </span>
                                  </button>
                                </div>
                              </div>

                              <Show when={d().body}>
                                <pre class="text-gray-300 whitespace-pre-wrap text-[11px] border-t border-carbon-border/40 pt-2 font-mono">
                                  {d().body}
                                </pre>
                              </Show>

                              <div class="flex items-center gap-3 text-[11px] font-mono font-bold pt-0.5">
                                <span class="text-gray-400">
                                  {d().files.length} files
                                </span>
                                <span class="text-emerald-400">
                                  +{d().totalAdditions}
                                </span>
                                <span class="text-rose-400">
                                  -{d().totalDeletions}
                                </span>
                              </div>
                            </div>

                            {/* Files Tree Section */}
                            <div class="space-y-1">
                              <div class="flex items-center justify-between text-[11px] text-gray-400 font-bold uppercase tracking-wider px-1">
                                <span>FILES CHANGED ({d().files.length})</span>
                                {(() => {
                                  const tree = createMemo(() =>
                                    buildGenericTree(d().files || []),
                                  );
                                  const allFolderIds = createMemo(() => {
                                    const ids: string[] = [];
                                    const traverse = (
                                      items: GenericTreeNode<CommitFileChange>[],
                                    ) => {
                                      for (const item of items) {
                                        if (item.isFolder) {
                                          ids.push(item.id);
                                          traverse(item.children);
                                        }
                                      }
                                    };
                                    traverse(tree());
                                    return ids;
                                  });
                                  const isAllExp = () => {
                                    const ids = allFolderIds();
                                    if (ids.length === 0) return false;
                                    const cur = expandedFolders();
                                    return ids.every((id) => cur.has(id));
                                  };

                                  return (
                                    <button
                                      onClick={() => {
                                        const ids = allFolderIds();
                                        if (isAllExp()) {
                                          setExpandedFolders(new Set<string>());
                                        } else {
                                          setExpandedFolders(
                                            new Set<string>(ids),
                                          );
                                        }
                                      }}
                                      class="px-2.5 py-1 bg-[#151926] hover:bg-[#1E2436] border border-gray-700/60 rounded-lg text-xs font-medium text-gray-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                                      title={
                                        isAllExp()
                                          ? "Collapse all folders"
                                          : "Expand all folders"
                                      }
                                    >
                                      <Show
                                        when={isAllExp()}
                                        fallback={
                                          <ChevronsUpDown class="w-3.5 h-3.5 text-indigo-400" />
                                        }
                                      >
                                        <ChevronsUpDown class="w-3.5 h-3.5 text-amber-400 rotate-90" />
                                      </Show>
                                      <span>
                                        {isAllExp()
                                          ? "Collapse All"
                                          : "Expand All"}
                                      </span>
                                    </button>
                                  );
                                })()}
                              </div>

                              <div class="bg-carbon-base/70 border border-carbon-border/60 rounded-xl overflow-hidden py-1">
                                <For each={commitFilesTree()}>
                                  {(fileNode) =>
                                    renderCommitTreeNode(fileNode, d().hash)
                                  }
                                </For>
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    </Show>
                  </div>
                </Show>
              </div>
            </div>
          );
        }}
      </For>
    </div>
  );
};
