# OnoGitTree Documentation 🌳

**OnoGitTree** is a dedicated, ultra-lightweight desktop GUI application for Linux (and cross-platform) designed to bring the powerful **multi-repository visualization and management** capabilities of VS Code's GitLens into a standalone, blazing-fast, and memory-optimized tool.

---

## 📌 Project Vision & Core Capabilities

Engineering teams and power developers frequently work with polyrepos and microservices architectures (10 to 30+ repositories active simultaneously). Managing them through terminals or standard single-repository GUIs leads to repetitive manual work and high cognitive overhead.

**OnoGitTree** delivers a consolidated command center:
1. **Multi-Repo Dashboard**: View all your project repositories in a single unified, hierarchical tree.
2. **One-Click Batch Operations**: *Pull All*, *Fetch All*, *Push All*, and *Refresh All* with non-blocking concurrency via Go goroutines.
3. **Deep Git Control per Repository**: Instant branch switching, upstream tracking (`+ahead / -behind`), working tree diffs, stashes, tags, remotes, and worktrees.
4. **Interactive Git Controls**: *Merge from...*, *Pull from...*, *Create branch from...*, *Rebase...*, and *Cherry-pick*.
5. **Built-in Diff Visualizer**: Side-by-Side (Split) and Unified diff views with syntax highlighting and hunk-level staging (Monaco Diff Editor).
6. **Interactive Git Commit Graph**: 60 FPS topological DAG visualizer for branch lanes, forks, merges, and commit inspection.
7. **Visual 3-Way Merge Conflict Resolver**: Interactive 3-pane conflict resolution editor (*Ours / Base / Theirs / Result*).
8. **Ultra-Low Memory Footprint**: **~40 MB idle RAM** (compared to 250 MB+ in Electron) powered by Go and SolidJS.

---

## 🏗️ Definitive Architecture Decision

| Layer | Technology | Key Decision Rationale |
| :--- | :--- | :--- |
| **Desktop Shell** | **Wails v2** | Native WebKitGTK webview, ultra-low RAM (~40 MB), compiles to a single Linux binary. |
| **Backend Core** | **Go 1.25** | High-performance goroutines for batch operations, `os/exec` context timeouts, and memory safety. |
| **Frontend Framework** | **SolidJS + TypeScript** | **Zero Virtual DOM**, **zero component re-renders** (components run once), no `useEffect` dependency hell. |
| **Styling & Theme** | **Tailwind CSS + Lucide Icons** | Pixel-perfect dark theme matching VS Code / GitLens. |
| **UI Primitives** | **`@kobalte/core`** | Accessible Context Menus, Dialogs, Tooltips, and Dropdowns. |
| **Tree Virtualization** | **`@tanstack/solid-virtual`** | Smooth 60 FPS scrolling for 50+ repositories and thousands of tree nodes. |
| **Layout & Panes** | **`solid-resizable-panels`** | Draggable split panels (Sidebar / Graph / Diff Drawer). |
| **Diff Engine** | **Monaco Diff Editor** | VS Code-grade Side-by-Side & Unified diffs with syntax highlighting. |
| **Git Graph** | **Canvas / `@gitgraph/js` + `d3-dag`** | Fast topological commit DAG rendering. |
| **Terminal Output** | **`@xterm/xterm`** | Real-time ANSI colored streaming output for Git CLI operations. |
| **File Watcher** | **`fsnotify` (Go)** | Sub-millisecond Linux `inotify` watcher for `.git/HEAD` & `.git/refs`. |
| **Local Cache DB** | **`modernc.org/sqlite` (Go)** | Pure Go embedded SQLite for workspace and metadata persistence without CGO. |

---

## 📚 Documentation Index

1. [**`docs/tech_stack_recommendation.md`**](./tech_stack_recommendation.md)
   - Comprehensive comparison: Go (Wails) vs. Electron vs. Tauri.
   - Frontend comparison: SolidJS vs. Svelte 5 vs. React.
   - Why SolidJS and Go were chosen, full package manifest, pros & cons matrix.

2. [**`docs/feature_specifications.md`**](./feature_specifications.md)
   - GitLens multi-repo tree view blueprint.
   - Batch operations (*Pull All*, *Fetch All*, *Push All*, *Refresh All*).
   - Detailed specifications for Diff Viewer, Git Graph, and 3-Way Conflict Resolver.
   - Context menus and command controls.

3. [**`docs/technical_challenges_and_considerations.md`**](./technical_challenges_and_considerations.md)
   - Concurrency throttling & worker pool management.
   - Git locking (`index.lock`) race condition prevention.
   - SSH/HTTPS non-interactive batch authentication.
   - Linux `inotify` watcher limits and debouncing.
   - Batch error isolation and conflict handling.

4. [**`docs/architecture_design.md`**](./architecture_design.md)
   - End-to-end system architecture & Go-to-SolidJS IPC bridge.
   - Go backend services design (`GitCommandRunner`, `BatchWorkerPool`, `DiffService`, `GraphService`, `ConflictService`).
   - Phased implementation roadmap (MVP to full release).
