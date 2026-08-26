import { For, Show, JSX } from "solid-js";
import { ChevronRight, ChevronDown, Folder, FolderOpen } from "lucide-solid";
import { GenericTreeNode } from "../../utils/fileTree";

interface GenericFileTreeProps<T extends { path: string }> {
  nodes: GenericTreeNode<T>[];
  isExpanded: (folderId: string, depth: number) => boolean;
  onToggleFolder: (folderId: string) => void;
  renderItem: (item: T, node: GenericTreeNode<T>, depth: number) => JSX.Element;
  depth?: number;
}

export function GenericFileTreeNode<T extends { path: string }>(props: {
  node: GenericTreeNode<T>;
  isExpanded: (folderId: string, depth: number) => boolean;
  onToggleFolder: (folderId: string) => void;
  renderItem: (item: T, node: GenericTreeNode<T>, depth: number) => JSX.Element;
  depth: number;
}): JSX.Element {
  const isFolder = () => props.node.isFolder;
  const isFolderExpanded = () =>
    props.isExpanded(props.node.id, props.depth);

  return (
    <Show
      when={isFolder()}
      fallback={
        props.node.item ? props.renderItem(props.node.item, props.node, props.depth) : null
      }
    >
      <div class="select-none">
        <div
          onClick={() => props.onToggleFolder(props.node.id)}
          class="flex items-center gap-1.5 px-3 py-1.5 hover:bg-[#151926] text-gray-300 hover:text-white cursor-pointer text-xs font-mono transition-colors"
          style={{ "padding-left": `${props.depth * 14 + 12}px` }}
        >
          <Show
            when={isFolderExpanded()}
            fallback={<ChevronRight class="w-3.5 h-3.5 text-gray-500" />}
          >
            <ChevronDown class="w-3.5 h-3.5 text-indigo-400" />
          </Show>
          <Show
            when={isFolderExpanded()}
            fallback={<Folder class="w-3.5 h-3.5 text-amber-400/80" />}
          >
            <FolderOpen class="w-3.5 h-3.5 text-amber-400" />
          </Show>
          <span class="font-semibold text-gray-300">{props.node.name}</span>
        </div>

        <Show when={isFolderExpanded()}>
          <For each={props.node.children}>
            {(child) => (
              <GenericFileTreeNode
                node={child}
                isExpanded={props.isExpanded}
                onToggleFolder={props.onToggleFolder}
                renderItem={props.renderItem}
                depth={props.depth + 1}
              />
            )}
          </For>
        </Show>
      </div>
    </Show>
  );
}

export function GenericFileTree<T extends { path: string }>(
  props: GenericFileTreeProps<T>,
): JSX.Element {
  const depth = () => props.depth || 0;

  return (
    <div class="py-1">
      <For each={props.nodes}>
        {(node) => (
          <GenericFileTreeNode
            node={node}
            isExpanded={props.isExpanded}
            onToggleFolder={props.onToggleFolder}
            renderItem={props.renderItem}
            depth={depth()}
          />
        )}
      </For>
    </div>
  );
}
