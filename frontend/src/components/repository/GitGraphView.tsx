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

// VS Code Git Graph style palette: Lane 0 is main branch color (Cobalt / Cyan Blue)
const LANE_COLORS = [
  "#0098FF", // Main Branch Sky Blue
  "#34C759", // Emerald Green
  "#AF52DE", // Royal Purple
  "#FF9500", // Solar Amber
  "#FF2D55", // Crimson Rose
  "#5856D6", // Indigo
  "#00C7BE", // Teal
  "#FF3B30", // Bright Red
];

const ROW_HEIGHT = 36;
const NODE_CY = 18;
const LANE_WIDTH = 20;
const OFFSET_X = 16;

interface RailPass {
  lane: number;
  color: string;
}

interface GraphCurve {
  fromLane: number;
  toLane: number;
  color: string;
  type: "top-to-node" | "node-to-bottom";
}

interface ProcessedGraphNode {
  commit: CommitSummary;
  lane: number;
  color: string;
  hasTopLine: boolean;
  hasBottomLine: boolean;
  passingRails: RailPass[];
  curves: GraphCurve[];
}

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

  // Robust Multi-Lane Topological Graph Computation
  const graphData = createMemo(() => {
    const list = props.commits;
    const activeLanes: (string | null)[] = [];
    let maxLaneIndex = 0;

    const matchesHash = (a: string | null, b: string | null) => {
      if (!a || !b) return false;
      return a === b || a.startsWith(b) || b.startsWith(a);
    };

    const nodes: ProcessedGraphNode[] = list.map((commit) => {
      // 1. Allocate or retrieve lane for this commit
      let laneIndex = activeLanes.findIndex((h) => matchesHash(h, commit.hash));
      if (laneIndex === -1) {
        laneIndex = activeLanes.indexOf(null);
        if (laneIndex === -1) {
          laneIndex = activeLanes.length;
          activeLanes.push(commit.hash);
        } else {
          activeLanes[laneIndex] = commit.hash;
        }
      }

      if (laneIndex > maxLaneIndex) {
        maxLaneIndex = laneIndex;
      }

      const color = LANE_COLORS[laneIndex % LANE_COLORS.length];
      const parents = commit.parents || [];
      const curves: GraphCurve[] = [];
      let hasBottomLine = false;

      // 2. Identify passing rails for other active branches in this row
      const passingRails: RailPass[] = [];
      for (let l = 0; l < activeLanes.length; l++) {
        if (l !== laneIndex && activeLanes[l] !== null) {
          passingRails.push({
            lane: l,
            color: LANE_COLORS[l % LANE_COLORS.length],
          });
        }
      }

      // 3. Connect parents for subsequent rows
      if (parents.length === 0) {
        // Root commit (branch terminates)
        activeLanes[laneIndex] = null;
        hasBottomLine = false;
      } else if (parents.length === 1) {
        const p0 = parents[0];
        const existingLane = activeLanes.findIndex((h) => matchesHash(h, p0));

        if (existingLane === -1 || existingLane === laneIndex) {
          // Parent continues in current lane
          activeLanes[laneIndex] = p0;
          hasBottomLine = true;
        } else {
          // Merge to existing parent lane
          activeLanes[laneIndex] = null;
          curves.push({
            fromLane: laneIndex,
            toLane: existingLane,
            color: LANE_COLORS[existingLane % LANE_COLORS.length],
            type: "node-to-bottom",
          });
        }
      } else {
        // Merge commit with multiple parents
        const p0 = parents[0];
        activeLanes[laneIndex] = p0;
        hasBottomLine = true;

        for (let p = 1; p < parents.length; p++) {
          const parentHash = parents[p];
          let pLane = activeLanes.findIndex((h) => matchesHash(h, parentHash));
          if (pLane === -1) {
            pLane = activeLanes.indexOf(null);
            if (pLane === -1) {
              pLane = activeLanes.length;
              activeLanes.push(parentHash);
            } else {
              activeLanes[pLane] = parentHash;
            }
          }
          if (pLane > maxLaneIndex) {
            maxLaneIndex = pLane;
          }
          curves.push({
            fromLane: laneIndex,
            toLane: pLane,
            color: LANE_COLORS[pLane % LANE_COLORS.length],
            type: "node-to-bottom",
          });
        }
      }

      return {
        commit,
        lane: laneIndex,
        color,
        hasTopLine: true,
        hasBottomLine,
        passingRails,
        curves,
      };
    });

    const gutterWidth = Math.max(1, maxLaneIndex + 1) * LANE_WIDTH + OFFSET_X;
    return { nodes, gutterWidth };
  });

  const getLaneX = (lane: number) => lane * LANE_WIDTH + OFFSET_X;

  const getFileBadge = (filePath: string) => {
    const ext = filePath.split(".").pop()?.toLowerCase() || "";
    switch (ext) {
      case "go":
        return (
          <span class="px-1.5 py-0.5 bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 font-mono text-[10px] font-black rounded border border-cyan-300 dark:border-cyan-500/40">
            go
          </span>
        );
      case "ts":
        return (
          <span class="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 font-mono text-[10px] font-black rounded border border-blue-300 dark:border-blue-500/40">
            TS
          </span>
        );
      case "tsx":
        return (
          <span class="px-1.5 py-0.5 bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 font-mono text-[10px] font-black rounded border border-sky-300 dark:border-sky-500/40">
            TSX
          </span>
        );
      case "js":
      case "jsx":
        return (
          <span class="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono text-[10px] font-black rounded border border-amber-300 dark:border-amber-500/40">
            JS
          </span>
        );
      case "css":
      case "scss":
        return (
          <span class="px-1.5 py-0.5 bg-pink-100 dark:bg-pink-500/20 text-pink-800 dark:text-pink-300 font-mono text-[10px] font-black rounded border border-pink-300 dark:border-pink-500/40">
            CSS
          </span>
        );
      case "json":
        return (
          <span class="px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 font-mono text-[10px] font-black rounded border border-yellow-300 dark:border-yellow-500/40">
            JSON
          </span>
        );
      case "md":
        return (
          <span class="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 font-mono text-[10px] font-black rounded border border-indigo-300 dark:border-indigo-500/40">
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
          <span class="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
            M
          </span>
        );
      case "added":
      case "untracked":
        return (
          <span class="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
            A
          </span>
        );
      case "deleted":
        return (
          <span class="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
            D
          </span>
        );
      case "renamed":
        return (
          <span class="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">
            R
          </span>
        );
      default:
        return (
          <span class="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
            M
          </span>
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
                <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-50 dark:bg-sky-500/15 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-500/40 rounded-full font-mono text-[10px] font-bold shadow-xs">
                  <CircleDot class="w-3 h-3 text-sky-600 dark:text-sky-400" />
                  <span>{branch}</span>
                </span>
              );
            }
            if (ref.startsWith("tag: ")) {
              const tag = ref.replace("tag: ", "");
              return (
                <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 rounded-full font-mono text-[10px] font-bold shadow-xs">
                  <Tag class="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>{tag}</span>
                </span>
              );
            }
            if (ref.includes("origin/") || ref.includes("upstream/")) {
              return (
                <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 dark:bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-500/40 rounded-full font-mono text-[10px] font-bold shadow-xs">
                  <Cloud class="w-3 h-3 text-purple-600 dark:text-purple-400" />
                  <span>{ref}</span>
                </span>
              );
            }
            return (
              <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/40 rounded-full font-mono text-[10px] font-bold shadow-xs">
                <GitBranch class="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
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
            class="flex items-center gap-1.5 px-3 py-1.5 hover:bg-[#F7F5F0] dark:hover:bg-[#161B26] text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white cursor-pointer text-xs font-mono transition-colors"
            style={{ "padding-left": `${depth * 14 + 8}px` }}
          >
            <Show
              when={isExpanded()}
              fallback={
                <ChevronRight class="w-3 h-3 text-gray-400 dark:text-gray-500" />
              }
            >
              <ChevronDown class="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            </Show>
            <Show
              when={isExpanded()}
              fallback={<Folder class="w-3.5 h-3.5 text-amber-500/80" />}
            >
              <FolderOpen class="w-3.5 h-3.5 text-amber-500" />
            </Show>
            <span class="font-semibold text-gray-800 dark:text-gray-200">
              {node.name}
            </span>
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
        class="group flex items-center justify-between px-3 py-1.5 hover:bg-[#F7F5F0] dark:hover:bg-[#161B26] text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white cursor-pointer text-xs font-mono transition-colors"
        style={{ "padding-left": `${depth * 14 + 20}px` }}
      >
        <div class="flex items-center gap-2 min-w-0">
          {getFileBadge(file.path)}
          <span class="truncate text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
            {node.name}
          </span>
        </div>

        <div class="flex items-center gap-3 text-[11px] tabular-nums flex-shrink-0 mr-1">
          <Show when={file.additions > 0}>
            <span class="text-emerald-600 dark:text-emerald-400 font-bold">
              +{file.additions}
            </span>
          </Show>
          <Show when={file.deletions > 0}>
            <span class="text-rose-600 dark:text-rose-400 font-bold">
              -{file.deletions}
            </span>
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
            class="flex items-center gap-1.5 px-3 py-1.5 hover:bg-[#F7F5F0] dark:hover:bg-[#161B26] text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white cursor-pointer text-xs font-mono transition-colors"
            style={{ "padding-left": `${depth * 14 + 8}px` }}
          >
            <Show
              when={isExpanded()}
              fallback={
                <ChevronRight class="w-3 h-3 text-gray-400 dark:text-gray-500" />
              }
            >
              <ChevronDown class="w-3 h-3 text-sky-600 dark:text-sky-400" />
            </Show>
            <Show
              when={isExpanded()}
              fallback={<Folder class="w-3.5 h-3.5 text-amber-500/80" />}
            >
              <FolderOpen class="w-3.5 h-3.5 text-amber-500" />
            </Show>
            <span class="font-semibold text-gray-800 dark:text-gray-200">
              {node.name}
            </span>
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
        class="group flex items-center justify-between px-3 py-1.5 hover:bg-[#F7F5F0] dark:hover:bg-[#161B26] text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white cursor-pointer text-xs font-mono transition-colors"
        style={{ "padding-left": `${depth * 14 + 20}px` }}
      >
        <div class="flex items-center gap-2 min-w-0">
          {getFileBadge(file.path)}
          <span class="truncate text-gray-800 dark:text-gray-200 group-hover:text-sky-600 dark:group-hover:text-sky-300">
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
                class="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-gray-500 hover:text-emerald-700 dark:hover:text-emerald-400 rounded transition-all cursor-pointer"
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
              class="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-gray-500 hover:text-amber-700 dark:hover:text-amber-400 rounded transition-all cursor-pointer"
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
    <div class="font-sans select-none overflow-x-hidden">
      {/* 1. Top Outgoing Changes / Uncommitted Changes Node */}
      <Show when={hasOutgoingOrUncommitted()}>
        <div
          class={`group flex items-stretch transition-colors ${
            isOutgoingExpanded()
              ? "bg-sky-50/70 dark:bg-[#121624]/90"
              : "bg-sky-50/30 dark:bg-sky-950/10 hover:bg-sky-50/60 dark:hover:bg-sky-950/20"
          }`}
        >
          {/* Left Graph Spine column matching width - NO bottom border to keep rail unbroken */}
          <div
            class="flex-shrink-0 relative flex flex-col items-center select-none"
            style={{ width: `${graphData().gutterWidth}px` }}
          >
            <svg
              width={graphData().gutterWidth}
              height={ROW_HEIGHT}
              class="overflow-visible block"
            >
              {/* Outgoing Dashed Ring Node */}
              <circle
                cx={OFFSET_X}
                cy={NODE_CY}
                r="6.5"
                fill="none"
                stroke="#0098FF"
                stroke-width="2"
                stroke-dasharray="3,2.5"
              />
              <circle cx={OFFSET_X} cy={NODE_CY} r="2.5" fill="#0098FF" />
              {/* Dashed Vertical Line Connecting to HEAD Commit */}
              <line
                x1={OFFSET_X}
                y1={NODE_CY + 6}
                x2={OFFSET_X}
                y2={ROW_HEIGHT}
                stroke="#0098FF"
                stroke-width="2.5"
                stroke-dasharray="3,2.5"
              />
            </svg>

            {/* Continuous Vertical Spine when Outgoing is Expanded */}
            <Show when={isOutgoingExpanded()}>
              <div
                class="absolute top-[36px] bottom-0 w-0.5 border-l-2 border-dashed border-sky-500/80"
                style={{ left: `${OFFSET_X - 1}px` }}
              />
            </Show>
          </div>

          {/* Outgoing Changes Row Content */}
          <div class="flex-1 min-w-0 py-2.5 pr-4 border-b border-gray-100/80 dark:border-gray-800/30">
            <div
              onClick={() => setIsOutgoingExpanded(!isOutgoingExpanded())}
              class="flex items-center justify-between gap-3 cursor-pointer"
            >
              <div class="flex items-center gap-2.5 truncate">
                <span class="font-bold text-xs text-sky-800 dark:text-sky-300 font-mono tracking-tight">
                  Outgoing Changes
                </span>
                <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  {props.repo.currentBranch}
                </span>

                <Show when={props.repo.aheadCount > 0}>
                  <span class="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 rounded-full font-mono text-[10px] font-bold">
                    +{props.repo.aheadCount} to push
                  </span>
                </Show>

                <Show when={props.repo.changedFilesCount > 0}>
                  <span class="px-2 py-0.5 bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 rounded-full font-mono text-[10px] font-bold">
                    {props.repo.changedFilesCount} uncommitted
                  </span>
                </Show>
              </div>

              <button class="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-white transition-transform">
                <Show
                  when={isOutgoingExpanded()}
                  fallback={<ChevronRight class="w-3.5 h-3.5" />}
                >
                  <ChevronDown class="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                </Show>
              </button>
            </div>

            {/* Expanded Outgoing Changes Files Tree */}
            <Show when={isOutgoingExpanded()}>
              <div class="mt-2.5 pt-2 border-t border-sky-200 dark:border-gray-800/80 space-y-2">
                <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1 font-mono">
                  <span>
                    WORKING TREE FILES ({props.repo.files?.length || 0})
                  </span>
                  <div class="flex items-center gap-2">
                    <button
                      onClick={() => repoStore.stageFiles(props.repo.path, [])}
                      class="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded font-semibold text-[10px] cursor-pointer transition-colors"
                    >
                      Stage All
                    </button>
                    <button
                      onClick={() =>
                        repoStore.unstageFiles(props.repo.path, [])
                      }
                      class="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/15 dark:hover:bg-amber-500/25 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 rounded font-semibold text-[10px] cursor-pointer transition-colors"
                    >
                      Unstage All
                    </button>
                  </div>
                </div>

                <div class="bg-white dark:bg-[#0D1017] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden py-1 shadow-xs">
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
      <For each={graphData().nodes}>
        {(node, idx) => {
          const commit = node.commit;
          const isExpanded = () => expandedCommitHashes().has(commit.hash);
          const detail = () => repoStore.getCommitDetail(commit.hash);
          const nodeX = getLaneX(node.lane);

          return (
            <div
              class={`group flex items-stretch transition-colors ${
                isExpanded()
                  ? "bg-[#EEF2FF] dark:bg-[#121624]"
                  : "hover:bg-[#F4F1EA] dark:hover:bg-[#161B26]"
              }`}
            >
              {/* Left Graph Spine Column with uniform width - NO bottom border to keep rail seamless */}
              <div
                class="flex-shrink-0 relative flex flex-col items-center select-none"
                style={{ width: `${graphData().gutterWidth}px` }}
              >
                {/* SVG for node, connectors, and passing rails */}
                <svg
                  width={graphData().gutterWidth}
                  height={ROW_HEIGHT}
                  class="overflow-visible block"
                >
                  {/* Passing Rails for other parallel branches */}
                  <For each={node.passingRails}>
                    {(rail) => (
                      <line
                        x1={getLaneX(rail.lane)}
                        y1="0"
                        x2={getLaneX(rail.lane)}
                        y2={ROW_HEIGHT}
                        stroke={rail.color}
                        stroke-width="2.5"
                        stroke-linecap="round"
                      />
                    )}
                  </For>

                  {/* Top vertical connector from previous commit */}
                  <Show
                    when={
                      node.hasTopLine &&
                      (idx() > 0 || hasOutgoingOrUncommitted())
                    }
                  >
                    <line
                      x1={nodeX}
                      y1="0"
                      x2={nodeX}
                      y2={NODE_CY}
                      stroke={node.color}
                      stroke-width="2.5"
                      stroke-dasharray={
                        idx() === 0 && hasOutgoingOrUncommitted()
                          ? "3,2.5"
                          : undefined
                      }
                      stroke-linecap="round"
                    />
                  </Show>

                  {/* Bottom vertical connector to next commit */}
                  <Show when={node.hasBottomLine}>
                    <line
                      x1={nodeX}
                      y1={NODE_CY}
                      x2={nodeX}
                      y2={ROW_HEIGHT}
                      stroke={node.color}
                      stroke-width="2.5"
                      stroke-linecap="round"
                    />
                  </Show>

                  {/* Bezier Merge Curves */}
                  <For each={node.curves}>
                    {(curve) => {
                      const x1 = getLaneX(curve.fromLane);
                      const x2 = getLaneX(curve.toLane);
                      const y1 = NODE_CY;
                      const y2 = ROW_HEIGHT;
                      const midY = (y1 + y2) / 2;
                      const pathData = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

                      return (
                        <path
                          d={pathData}
                          fill="none"
                          stroke={curve.color}
                          stroke-width="2.5"
                          stroke-linecap="round"
                        />
                      );
                    }}
                  </For>

                  {/* Commit Node Circle */}
                  <circle
                    cx={nodeX}
                    cy={NODE_CY}
                    r="5"
                    fill={isExpanded() ? node.color : "#ffffff"}
                    class="dark:fill-[#0D1017] transition-all"
                    stroke={node.color}
                    stroke-width="2.5"
                  />
                  <Show when={isExpanded()}>
                    <circle cx={nodeX} cy={NODE_CY} r="2" fill="#ffffff" />
                  </Show>
                </svg>

                {/* Continuous Graph Vertical Spine for Expanded Commit */}
                <Show when={isExpanded()}>
                  <div
                    class="absolute top-[36px] bottom-0 w-0.5"
                    style={{
                      left: `${nodeX - 1}px`,
                      "background-color": node.color,
                    }}
                  />
                </Show>
              </div>

              {/* Commit Content Body - subtle bottom border only on text column */}
              <div class="flex-1 min-w-0 py-2.5 pr-4 flex flex-col justify-center border-b border-gray-100/80 dark:border-gray-800/30">
                {/* Commit Row Header */}
                <div
                  onClick={() => repoStore.toggleCommitExpanded(commit.hash)}
                  onContextMenu={(e) => props.onCommitContextMenu(e, commit)}
                  class="flex items-center justify-between gap-3 cursor-pointer"
                >
                  {/* Subject, Author & Ref Pills */}
                  <div class="flex items-center gap-2.5 min-w-0 flex-1 flex-wrap">
                    {/* Commit Subject */}
                    <span class="font-medium text-xs text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 truncate">
                      {commit.subject}
                    </span>

                    {/* Commit Author */}
                    <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {commit.authorName}
                    </span>

                    {/* Ref Pills (Local, Remote, Tags) */}
                    {renderRefPills(commit.refs)}
                  </div>

                  {/* Right Action Icons & Date */}
                  <div class="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 font-mono flex-shrink-0">
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
                      class="p-1 hover:bg-gray-200 dark:hover:bg-carbon-hover text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-300 rounded opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      title="Inspect commit diff"
                    >
                      <FileDiff class="w-3.5 h-3.5" />
                    </button>

                    <button
                      class={`p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-transform ${
                        isExpanded()
                          ? "rotate-90 text-indigo-600 dark:text-indigo-400"
                          : ""
                      }`}
                    >
                      <ChevronRight class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Commit Details & Modified Files Tree */}
                <Show when={isExpanded()}>
                  <div class="mt-2.5 pt-2.5 border-t border-gray-200/80 dark:border-gray-800/80 space-y-3">
                    <Show
                      when={detail()}
                      fallback={
                        <div class="py-3 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                          <RefreshCw class="w-3.5 h-3.5 animate-spin text-indigo-500" />
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
                            <div class="bg-white dark:bg-[#121624] p-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 text-xs font-mono space-y-2.5 shadow-sm">
                              <div class="flex items-center justify-between text-gray-600 dark:text-gray-400 text-[11px] gap-2 flex-wrap">
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
                                    class="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/30 border border-indigo-200 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-300 font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                                    title="View entire commit diff"
                                  >
                                    <FileDiff class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                    <span>View Entire Diff</span>
                                  </button>

                                  <button
                                    onClick={() =>
                                      copyText(d().hash, `sha-${d().hash}`)
                                    }
                                    class="px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-carbon-surface dark:hover:bg-carbon-hover border border-gray-200 dark:border-carbon-border text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                                  >
                                    <Show
                                      when={copiedHash() === `sha-${d().hash}`}
                                      fallback={<Copy class="w-3 h-3" />}
                                    >
                                      <Check class="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
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
                                <pre class="text-gray-800 dark:text-gray-200 bg-[#F7F5F0] dark:bg-[#0D1017] p-3 rounded-xl whitespace-pre-wrap text-[11px] border border-gray-200 dark:border-gray-800 font-mono leading-relaxed">
                                  {d().body}
                                </pre>
                              </Show>

                              <div class="flex items-center gap-3 text-[11px] font-mono font-bold pt-0.5">
                                <span class="text-gray-600 dark:text-gray-400">
                                  {d().files.length} files
                                </span>
                                <span class="text-emerald-600 dark:text-emerald-400">
                                  +{d().totalAdditions}
                                </span>
                                <span class="text-rose-600 dark:text-rose-400">
                                  -{d().totalDeletions}
                                </span>
                              </div>
                            </div>

                            {/* Files Tree Section */}
                            <div class="space-y-1.5">
                              <div class="flex items-center justify-between text-[11px] text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider px-1">
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
                                      class="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-[#151926] dark:hover:bg-[#1E2436] border border-gray-200 dark:border-gray-700/60 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                                      title={
                                        isAllExp()
                                          ? "Collapse all folders"
                                          : "Expand all folders"
                                      }
                                    >
                                      <Show
                                        when={isAllExp()}
                                        fallback={
                                          <ChevronsUpDown class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                        }
                                      >
                                        <ChevronsUpDown class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 rotate-90" />
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

                              <div class="bg-white dark:bg-[#0D1017] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden py-1 shadow-xs">
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
