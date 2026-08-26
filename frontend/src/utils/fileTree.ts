import { FileStatus } from "../types/git";

export interface GenericTreeNode<T> {
  id: string;
  name: string;
  fullPath: string;
  isFolder: boolean;
  item?: T;
  file?: T;
  children: GenericTreeNode<T>[];
}

export function buildGenericTree<T extends { path: string }>(
  items: T[],
): GenericTreeNode<T>[] {
  interface MutableNode<T> {
    id: string;
    name: string;
    fullPath: string;
    isFolder: boolean;
    item?: T;
    children: Map<string, MutableNode<T>>;
  }

  const rootMap = new Map<string, MutableNode<T>>();

  for (const item of items) {
    const parts = item.path.split("/");
    let currentMap = rootMap;
    let accumulatedPath = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      accumulatedPath = accumulatedPath ? `${accumulatedPath}/${part}` : part;
      const isLeaf = i === parts.length - 1;

      let existing = currentMap.get(part);
      if (!existing) {
        existing = {
          id: accumulatedPath,
          name: part,
          fullPath: accumulatedPath,
          isFolder: !isLeaf,
          item: isLeaf ? item : undefined,
          children: new Map<string, MutableNode<T>>(),
        };
        currentMap.set(part, existing);
      }

      if (!isLeaf) {
        currentMap = existing.children;
      }
    }
  }

  function convertNode(node: MutableNode<T>): GenericTreeNode<T> {
    const sortedChildren = Array.from(node.children.values())
      .sort((a, b) => {
        if (a.isFolder === b.isFolder) {
          return a.name.localeCompare(b.name);
        }
        return a.isFolder ? -1 : 1;
      })
      .map(convertNode);

    return {
      id: node.id,
      name: node.name,
      fullPath: node.fullPath,
      isFolder: node.isFolder,
      item: node.item,
      file: node.item,
      children: sortedChildren,
    };
  }

  return Array.from(rootMap.values())
    .sort((a, b) => {
      if (a.isFolder === b.isFolder) {
        return a.name.localeCompare(b.name);
      }
      return a.isFolder ? -1 : 1;
    })
    .map(convertNode);
}

// Backward compatibility alias for ChangesView
export type FileTreeNode = GenericTreeNode<FileStatus>;
export function buildFileTree<T extends { path: string }>(files: T[]) {
  return buildGenericTree<T>(files);
}

export function sortFiles<T extends { path: string; status: string }>(
  files: T[],
  sortBy: "path" | "name" | "status",
): T[] {
  return [...files].sort((a, b) => {
    if (sortBy === "name") {
      const nameA = a.path.split("/").pop() || "";
      const nameB = b.path.split("/").pop() || "";
      return nameA.localeCompare(nameB);
    }
    if (sortBy === "status") {
      return a.status.localeCompare(b.status);
    }
    return a.path.localeCompare(b.path);
  });
}
