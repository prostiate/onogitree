# Architectural Decisions & Tech Stack Evaluation

This document details the definitive technical stack, architectural decisions, pros & cons analysis, and comprehensive library manifest for **OnoGitTree**.

---

## 1. Executive Summary & Final Stack Decision

After evaluating desktop runtimes (Electron vs. Tauri vs. Wails) and reactive UI frameworks (React vs. Svelte 5 vs. SolidJS), the architecture for **OnoGitTree** is chosen as:

### 🏆 **Go (Wails v2) + SolidJS (TypeScript + Tailwind CSS)**

```
+---------------------------------------------------------------------------------------------------------+
|                                        FRONTEND LAYER (SolidJS + TS)                                    |
|   • Reactive Engine: SolidJS Signals (Zero VDOM, components run once, surgical DOM node updates)        |
|   • Multi-Repo Tree: @tanstack/solid-virtual (Smooth 60 FPS scrolling for 50+ repositories)             |
|   • Context Menus & Modals: @kobalte/core (Accessible right-click menus, branch dialogs, tooltips)      |
|   • Split Panes: solid-resizable-panels (Draggable sidebar, graph area, and diff drawer)                |
|   • Diff Engine: Monaco Diff Editor (@monaco-editor/loader) + diff2html                                 |
|   • Git Graph Visualizer: Canvas / @gitgraph/js + d3-dag (Interactive commit DAG at 60 FPS)            |
|   • Merge Conflict Resolver: 3-Pane visual merge editor (Ours / Base / Theirs + Live Result buffer)     |
|   • Terminal Output: @xterm/xterm + @xterm/addon-fit (ANSI color streaming for Git CLI)                |
|   • Icons: lucide-solid                                                                                 |
+---------------------------------------------------------------------------------------------------------+
                                                     ▲
                               Wails Auto-Generated Type-Safe IPC Bridge
                                                     ▼
+---------------------------------------------------------------------------------------------------------+
|                                           GO BACKEND LAYER (Go 1.25)                                    |
|   • Desktop Runtime: Wails v2 (Native Linux WebKitGTK, ~40 MB RAM idle, single static binary)           |
|   • Batch Worker Pool: Goroutines + Channels (Concurrent Pull All / Fetch All with max 5 workers)       |
|   • Git Command Runner: /usr/bin/git with context timeouts & per-repo mutex (prevents index.lock)      |
|   • File Watcher: github.com/fsnotify/fsnotify (Sub-millisecond inotify tracking on .git/HEAD & refs)  |
|   • Local Database: modernc.org/sqlite (Pure Go zero-CGO embedded SQLite for metadata persistence)      |
|   • PTY Runner: github.com/creack/pty (Unix pseudo-terminal for interactive CLI streaming)             |
+---------------------------------------------------------------------------------------------------------+
```

---

## 2. Desktop Shell Evaluation: Go (Wails) vs. Electron vs. Tauri

| Criterion | **Go (Wails v2)** *(Chosen)* | **Electron** | **Rust (Tauri v2)** |
| :--- | :--- | :--- | :--- |
| **Idle Memory (RAM)** | 🟢 **~35 MB – 55 MB** | 🔴 **~200 MB – 350 MB** | 🟢 **~35 MB – 50 MB** |
| **Batch Concurrency** | 🟢 **Goroutines & Channels** (Microsecond scheduling) | 🟡 Node.js process pool (Higher OS process overhead) | 🟢 Tokio async tasks |
| **Cold Startup Time** | 🟢 **< 0.3s** | 🟡 **1.5s – 2.5s** | 🟢 **< 0.3s** |
| **Binary Size** | 🟢 **~15 MB** (Single executable) | 🔴 **~110 MB+** | 🟢 **~12 MB** |
| **System Compatibility** | 🟢 **Go 1.25 already installed on host** | 🟢 Node.js v24 installed | 🟡 Requires Rust toolchain |
| **Process Safety** | 🟢 Native `context.WithTimeout` prevents hanging SSH/Git | 🟡 Manual process signal handling | 🟢 Tokio timeout handling |

### Why Go (Wails) Won:
1. **Dramatically Lower RAM**: Electron's bundled Chromium engine is too heavy for an "always-open" developer utility. Wails utilizes Linux's native `WebKitGTK`, keeping memory usage under 50 MB.
2. **Goroutine Concurrency**: Managing parallel batch operations across 20+ Git repositories is naturally expressible with Go goroutines and buffered channels.
3. **No C/Rust Compilation Friction**: Go compiles cleanly on your current Ubuntu host without CGO dependencies.

---

## 3. Frontend Framework Evaluation: SolidJS vs. Svelte 5 vs. React

### The Problem with React for this Project:
- **Component Re-render Cascades**: React re-executes component functions top-to-bottom on every state change. Typing in a filter bar or receiving a background status update triggers re-renders across 20+ repository tree nodes.
- **`useEffect` Dependency Hell**: Missing dependencies causes stale closures; adding objects causes infinite loops.
- **`useMemo` / `useCallback` Noise**: Required everywhere to prevent child components from re-rendering.

```
+---------------------------------------------------------------------------------------------------------+
|                                    FRONTEND REACTIVITY COMPARISON                                       |
+--------------------------+-----------------------+-----------------------------+------------------------+
| Feature                  | React 19              | SolidJS (Signals) *(Chosen)*| Svelte 5 (Runes)       |
+--------------------------+-----------------------+-----------------------------+------------------------+
| Component Execution      | Runs on EVERY tick    | **Runs EXACTLY ONCE**       | **Runs EXACTLY ONCE**  |
| Virtual DOM              | YES (Heavy diffs)     | **0% (None)**               | **0% (None)**          |
| Dependency Arrays        | Required in hooks     | **NONE (Auto-tracked)**     | **NONE (Auto-tracked)**|
| JSX / TS Composability   | High                  | **Very High (JSX + TS)**    | Template based (.svelte)|
| Third-Party Integration  | High                  | **Excellent (Direct DOM)**  | Good (via onMount)     |
| Benchmark Performance    | ~1.7x Baseline        | **~1.05x (Near Vanilla JS)**| **~1.10x**             |
+--------------------------+-----------------------+-----------------------------+------------------------+
```

### Why SolidJS Won over Svelte 5 & React:
1. **Zero Virtual DOM & Zero Re-renders**: SolidJS components execute **exactly once** during initialization. When repository #4 finishes a pull, **only repository #4's status badge updates in the DOM**. The other repositories and parent views do zero re-evaluation.
2. **No `useEffect` Dependency Arrays**: Signals automatically track dependencies at runtime. No stale closures, no infinite loops.
3. **JSX + TypeScript Advantage**: SolidJS uses standard JSX and TypeScript. Integrating imperative libraries like **Monaco Diff Editor**, **Canvas Git Graphs**, and **Kobalte Context Menus** is simpler and more composable than in template-based frameworks.

---

## 4. Complete Package Manifest

| Layer | Package / Tool | Purpose |
| :--- | :--- | :--- |
| **Desktop Shell** | `wails v2` | Go desktop framework with native Linux WebKitGTK |
| **Backend Language** | `Go 1.25` | Concurrency, process runner, git parsers |
| **File System Watcher** | `github.com/fsnotify/fsnotify` | Inotify watcher for `.git/refs` & `.git/HEAD` |
| **Local Cache DB** | `modernc.org/sqlite` | Pure Go zero-CGO SQLite for workspace persistence |
| **Terminal PTY** | `github.com/creack/pty` | Unix pseudo-terminal for interactive CLI streaming |
| **Shell Utility** | `github.com/alessio/shellescape` | Safe shell argument sanitization |
| **Frontend Framework**| `solid-js` + `typescript` | Zero-VDOM, fine-grained reactive UI |
| **Styling & Icons** | `tailwindcss` + `lucide-solid` | Dark theme & VS Code-style Git icons |
| **UI Primitives** | `@kobalte/core` | Context menus, modals, tooltips, dialogs |
| **Virtualization** | `@tanstack/solid-virtual` | High-density multi-repo tree rendering |
| **Layout & Panes** | `solid-resizable-panels` | Draggable split panels (Sidebar / Graph / Diff) |
| **Diff Viewer** | `@monaco-editor/loader` | VS Code-grade Side-by-Side & Unified diffs |
| **Inline Diff Preview**| `diff2html` + `diff-match-patch` | Fast static HTML diff preview for tree rows |
| **Git Graph** | `@gitgraph/js` + `d3-dag` | 60 FPS interactive commit DAG graph |
| **Terminal Drawer** | `@xterm/xterm` + addons | Live colored streaming output for Git CLI |

---

## 5. Pros & Cons Summary

### 🟢 Pros:
- **Blazing Fast & Low Memory**: ~40 MB RAM idle, instant startup (< 0.3s).
- **High Concurrency**: Goroutine worker pools handle 20+ repo batch operations effortlessly without UI lag.
- **Zero Component Re-renders**: SolidJS signals update exact DOM nodes surgically.
- **Full Git Feature Parity**: Spawns system `/usr/bin/git`, inheriting SSH keys, GPG signing, and custom aliases seamlessly.
- **Pro Developer Tooling**: Includes Monaco Diffing, interactive Git Graphs, and 3-Way Conflict Resolving.

### 🔴 Cons & Considerations:
- **WebKitGTK on Linux**: Relies on host WebKitGTK (already present on Ubuntu).
- **No Native 3-Way Merge in Monaco by Default**: Requires custom 3-pane buffer coordination in the frontend (well-specified in our architecture).
