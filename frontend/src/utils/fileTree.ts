import { FileStatus } from '../types/git';

export interface FileTreeNode {
  id: string;
  name: string;
  fullPath: string;
  isFolder: boolean;
  file?: FileStatus;
  children: FileTreeNode[];
}

export function buildFileTree(files: FileStatus[]): FileTreeNode[] {
  interface MutableNode {
    id: string;
    name: string;
    fullPath: string;
    isFolder: boolean;
    file?: FileStatus;
    children: Map<string, MutableNode>;
  }

  const rootMap = new Map<string, MutableNode>();

  for (const file of files) {
    const parts = file.path.split('/');
    let currentMap = rootMap;
    let accumulatedPath = '';

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
          file: isLeaf ? file : undefined,
          children: new Map<string, MutableNode>(),
        };
        currentMap.set(part, existing);
      }

      if (!isLeaf) {
        currentMap = existing.children;
      }
    }
  }

  function convertNode(node: MutableNode): FileTreeNode {
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
      file: node.file,
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

export function sortFiles(
  files: FileStatus[],
  sortBy: 'path' | 'name' | 'status'
): FileStatus[] {
  return [...files].sort((a, b) => {
    if (sortBy === 'name') {
      const nameA = a.path.split('/').pop() || '';
      const nameB = b.path.split('/').pop() || '';
      return nameA.localeCompare(nameB);
    }
    if (sortBy === 'status') {
      return a.status.localeCompare(b.status);
    }
    return a.path.localeCompare(b.path);
  });
}
