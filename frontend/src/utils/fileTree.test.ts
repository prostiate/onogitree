import { describe, it, expect } from "vitest";
import { buildGenericTree, sortFiles } from "./fileTree";
import { FileStatus } from "../types/git";

describe("fileTree utility", () => {
  it("builds empty tree when no files provided", () => {
    const tree = buildGenericTree([]);
    expect(tree).toEqual([]);
  });

  it("builds a single level flat tree", () => {
    const items: FileStatus[] = [
      { path: "README.md", status: "modified", staged: false },
      { path: "package.json", status: "staged", staged: true },
    ];
    const tree = buildGenericTree(items);
    expect(tree.length).toBe(2);
    expect(tree[0].name).toBe("package.json");
    expect(tree[0].isFolder).toBe(false);
    expect(tree[0].item).toBe(items[1]);
    expect(tree[1].name).toBe("README.md");
    expect(tree[1].isFolder).toBe(false);
  });

  it("builds a nested hierarchical tree with folders sorted first", () => {
    const items: FileStatus[] = [
      { path: "src/components/Button.tsx", status: "modified", staged: false },
      { path: "src/index.ts", status: "modified", staged: false },
      { path: "README.md", status: "untracked", staged: false },
    ];
    const tree = buildGenericTree(items);

    // Top level: folder "src" first, then "README.md"
    expect(tree.length).toBe(2);
    expect(tree[0].name).toBe("src");
    expect(tree[0].isFolder).toBe(true);
    expect(tree[1].name).toBe("README.md");
    expect(tree[1].isFolder).toBe(false);

    // Inside "src": folder "components" first, then "index.ts"
    const srcNode = tree[0];
    expect(srcNode.children.length).toBe(2);
    expect(srcNode.children[0].name).toBe("components");
    expect(srcNode.children[0].isFolder).toBe(true);
    expect(srcNode.children[1].name).toBe("index.ts");
    expect(srcNode.children[1].isFolder).toBe(false);

    // Inside "components": "Button.tsx"
    const componentsNode = srcNode.children[0];
    expect(componentsNode.children.length).toBe(1);
    expect(componentsNode.children[0].name).toBe("Button.tsx");
    expect(componentsNode.children[0].isFolder).toBe(false);
  });

  it("sorts files by path, name and status correctly", () => {
    const files: FileStatus[] = [
      { path: "src/utils.ts", status: "untracked", staged: false },
      { path: "app/main.go", status: "modified", staged: false },
      { path: "config.json", status: "staged", staged: true },
    ];

    const byPath = sortFiles(files, "path");
    expect(byPath.map((f) => f.path)).toEqual([
      "app/main.go",
      "config.json",
      "src/utils.ts",
    ]);

    const byName = sortFiles(files, "name");
    expect(byName.map((f) => f.path)).toEqual([
      "config.json",
      "app/main.go",
      "src/utils.ts",
    ]);

    const byStatus = sortFiles(files, "status");
    expect(byStatus.map((f) => f.status)).toEqual([
      "modified",
      "staged",
      "untracked",
    ]);
  });
});
