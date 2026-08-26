import { Component, For, Show } from "solid-js";
import { CommitSummary } from "../../../types/git";

export interface RailPass {
  lane: number;
  color: string;
}

export interface GraphCurve {
  fromLane: number;
  toLane: number;
  color: string;
  type: "top-to-node" | "node-to-bottom";
}

export interface ProcessedGraphNode {
  commit: CommitSummary;
  lane: number;
  color: string;
  hasTopLine: boolean;
  hasBottomLine: boolean;
  passingRails: RailPass[];
  curves: GraphCurve[];
}

export const ROW_HEIGHT = 36;
export const NODE_CY = 18;
export const LANE_WIDTH = 20;
export const OFFSET_X = 16;

export const getLaneX = (lane: number) => lane * LANE_WIDTH + OFFSET_X;

interface GraphSvgSpineProps {
  node: ProcessedGraphNode;
  index: number;
  gutterWidth: number;
  isExpanded: boolean;
  hasOutgoing: boolean;
}

export const GraphSvgSpine: Component<GraphSvgSpineProps> = (props) => {
  const nodeX = () => getLaneX(props.node.lane);

  return (
    <div
      class="flex-shrink-0 relative flex flex-col items-center select-none"
      style={{ width: `${props.gutterWidth}px` }}
    >
      <svg
        width={props.gutterWidth}
        height={ROW_HEIGHT}
        class="overflow-visible block"
      >
        {/* Passing Rails for other parallel branches */}
        <For each={props.node.passingRails}>
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
            props.node.hasTopLine &&
            (props.index > 0 || props.hasOutgoing)
          }
        >
          <line
            x1={nodeX()}
            y1="0"
            x2={nodeX()}
            y2={NODE_CY}
            stroke={props.node.color}
            stroke-width="2.5"
            stroke-dasharray={
              props.index === 0 && props.hasOutgoing
                ? "3,2.5"
                : undefined
            }
            stroke-linecap="round"
          />
        </Show>

        {/* Bottom vertical connector to next commit */}
        <Show when={props.node.hasBottomLine}>
          <line
            x1={nodeX()}
            y1={NODE_CY}
            x2={nodeX()}
            y2={ROW_HEIGHT}
            stroke={props.node.color}
            stroke-width="2.5"
            stroke-linecap="round"
          />
        </Show>

        {/* Bezier Merge Curves */}
        <For each={props.node.curves}>
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
          cx={nodeX()}
          cy={NODE_CY}
          r="5"
          fill={props.isExpanded ? props.node.color : "#ffffff"}
          class="dark:fill-[#0D1017] transition-all"
          stroke={props.node.color}
          stroke-width="2.5"
        />
        <Show when={props.isExpanded}>
          <circle cx={nodeX()} cy={NODE_CY} r="2" fill="#ffffff" />
        </Show>
      </svg>

      {/* Continuous Graph Vertical Spine for Expanded Commit */}
      <Show when={props.isExpanded}>
        <div
          class="absolute top-[36px] bottom-0 w-0.5"
          style={{
            left: `${nodeX() - 1}px`,
            "background-color": props.node.color,
          }}
        />
      </Show>
    </div>
  );
};
