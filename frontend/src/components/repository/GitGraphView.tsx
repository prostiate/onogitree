import { Component, createSignal, createMemo, For, Show } from "solid-js";
import { RepoStatus, CommitSummary } from "../../types/git";
import {
  ProcessedGraphNode,
  RailPass,
  GraphCurve,
  LANE_WIDTH,
  OFFSET_X,
} from "./graph/GraphSvgSpine";
import { OutgoingGraphNode } from "./graph/OutgoingGraphNode";
import { GraphNodeRow } from "./graph/GraphNodeRow";

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

export const GitGraphView: Component<GitGraphViewProps> = (props) => {
  const [copiedHash, setCopiedHash] = createSignal<string | null>(null);

  const copyText = (text: string, id: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
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

  const hasOutgoingOrUncommitted = () =>
    (props.repo.files && props.repo.files.length > 0) ||
    props.repo.aheadCount > 0;

  return (
    <div class="font-sans select-none overflow-x-hidden">
      {/* 1. Top Outgoing Changes / Uncommitted Changes Node */}
      <Show when={hasOutgoingOrUncommitted()}>
        <OutgoingGraphNode
          repo={props.repo}
          gutterWidth={graphData().gutterWidth}
        />
      </Show>

      {/* 2. Main Commits Graph Timeline */}
      <For each={graphData().nodes}>
        {(node, idx) => (
          <GraphNodeRow
            node={node}
            index={idx()}
            gutterWidth={graphData().gutterWidth}
            hasOutgoing={hasOutgoingOrUncommitted()}
            copiedHash={copiedHash()}
            onCopyText={copyText}
            onContextMenu={props.onCommitContextMenu}
          />
        )}
      </For>
    </div>
  );
};
