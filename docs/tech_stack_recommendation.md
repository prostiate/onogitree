# Architectural Decisions & Tech Stack Evaluation

This document details the definitive technical stack, architectural decisions, pros & cons analysis, memory profiling considerations, Git engine evaluation, and comprehensive library manifest for **OnoGitTree**.

---

## 1. Executive Summary & Selected Stack Decision

> [!NOTE]
> **Status: Selected & Approved by User**  
> **Chosen Tech Stack: Go (Wails v2) + SolidJS (TypeScript + Tailwind CSS) + System Git CLI**  
> Evaluated against Electron, Tauri (Rust), React, and Svelte 5. Go + SolidJS was selected for optimal idle RAM footprint (~40–60 MB on Linux), Goroutine batch concurrency, and fine-grained zero-VDOM UI updates.

### 🏆 **Go (Wails v2) + SolidJS (TypeScript + Tailwind CSS) + System Git CLI**


```
+---------------------------------------------------------------------------------------------------------+
|                                        FRONTEND LAYER (SolidJS + TS)                                    |
|   • Reactive Engine: SolidJS Signals (Zero VDOM, components run once, surgical DOM node updates)        |
|   • Multi-Repo Tree: @tanstack/solid-virtual (Smooth 60 FPS scrolling for 50+ repositories)             |
|   • Context Menus & Modals: @kobalte/core (Accessible right-click menus, branch dialogs, tooltips)      |
|   • Split Panes: solid-resizable-panels (Draggable sidebar, graph area, and diff drawer)                |
|   • Diff Engine: Monaco Diff Editor (@monaco-editor/loader) + diff2html                                 |
|   • Git Graph Visualizer: Canvas + SVG Hybrid (@gitgraph/js + d3-dag) for 60 FPS interactive DAG        |
|   • Merge Conflict Resolver: 3-Pane visual merge editor (Ours / Base / Theirs + Live Result buffer)     |
|   • Terminal Output: @xterm/xterm + @xterm/addon-fit (ANSI color streaming for Git CLI)                |
|   • Icons: lucide-solid                                                                                 |
+---------------------------------------------------------------------------------------------------------+
                                                     ▲
                                Wails Auto-Generated Type-Safe IPC Bridge
                                                     ▼
+---------------------------------------------------------------------------------------------------------+
|                                           GO BACKEND LAYER (Go 1.25)                                    |
|   • Desktop Runtime: Wails v2 (Native Linux WebKitGTK, ~40-60 MB RAM idle, single static binary)        |
|   • Batch Worker Pool: Goroutines + Channels (Concurrent Pull All / Fetch All with max 5-8 workers)     |
|   • Git Command Runner: /usr/bin/git with context timeouts & per-repo mutex (prevents index.lock)      |
|   • File Watcher: github.com/fsnotify/fsnotify (Sub-millisecond inotify tracking on .git/HEAD & refs)  |
|   • Local Database: modernc.org/sqlite (Pure Go zero-CGO embedded SQLite for metadata persistence)      |
|   • PTY Runner: github.com/creack/pty (Unix pseudo-terminal for interactive CLI streaming)             |
+---------------------------------------------------------------------------------------------------------+
```

---

## 2. Desktop Shell Evaluation: Wails (Go) vs. Electron vs. Tauri (Rust) vs. Native C++/Qt

| Criterion | **Go (Wails v2)** *(Recommended)* | **Rust (Tauri v2)** | **Electron (Node.js)** | **C++ / Qt6 (QML)** |
| :--- | :--- | :--- | :--- | :--- |
| **Idle Memory (RAM)** | 🟢 **~40 MB – 65 MB** | 🟢 **~35 MB – 55 MB** | 🔴 **~250 MB – 400 MB** | 🟢 **~25 MB – 45 MB** |
| **Active 20-Repo Load**| 🟢 **~75 MB – 110 MB** | 🟢 **~70 MB – 100 MB** | 🔴 **~450 MB – 700 MB** | 🟢 **~50 MB – 80 MB** |
| **Cold Startup Time** | 🟢 **< 0.3s** | 🟢 **< 0.25s** | 🔴 **1.5s – 2.8s** | 🟢 **< 0.15s** |
| **Binary Size** | 🟢 **~15 MB** (Single executable)| 🟢 **~10 MB – 15 MB** | 🔴 **~120 MB – 180 MB** | 🟡 **~30 MB + Qt libs** |
| **Concurrency Model** | 🟢 **Goroutines & Channels** | 🟢 Tokio async tasks | 🟡 Node.js child processes / Worker threads | 🟡 QThread / std::thread |
| **Developer Velocity**| 🟢 **Very High** (Go + TS/Web) | 🟡 Medium (Rust borrow checker + TS) | 🟢 Very High (Node + TS) | 🔴 Low (C++ QML / C++ build chains) |
| **UI Ecosystem** | 🟢 **Web/Monaco/Canvas Ecosystem** | 🟢 Web/Monaco/Canvas Ecosystem | 🟢 Web/Monaco/Canvas Ecosystem | 🔴 Limited editor & diff widgets |
| **Host Setup** | 🟢 Go 1.25 ready on Ubuntu | 🟡 Requires Cargo toolchain | 🟢 Node.js installed | 🟡 Requires Qt6 SDK |

### Detailed Analysis:

#### 1. Why Not Electron?
- **High Memory Overhead**: Electron bundles a dedicated Chromium browser instance and V8 engine. Running a background utility that monitors 20+ Git repos will continuously consume 300–600 MB of RAM.
- **Process Spawning Penalty**: Spawning 20 CLI processes in Node.js creates significant V8 event loop serialization overhead.
- **Slow Startup**: Cold start takes 1.5–3 seconds due to browser bundle decompression and Chromium initialization.

#### 2. Why Go (Wails) vs. Tauri (Rust)?
- **Concurrency Ergonomics**: Go was fundamentally designed for I/O concurrency. Goroutines cost only ~2 KB of stack space each, making parallel batch fetches, stream reading, and mutex synchronization straightforward.
- **Compilation Speed & Tooling**: Go compiles in seconds with zero complex type-lifetime annotations, speeding up feature iteration.
- **Memory Footprint**: Both Wails and Tauri leverage Linux's native `WebKitGTK` webview. Memory difference between Go and Rust backend is negligible (~10 MB), whereas developer productivity in Go is significantly higher.

---

## 3. Git Execution Engine Evaluation: Git CLI vs. libgit2 vs. go-git

| Feature / Capability | **System Git CLI (`/usr/bin/git`)** *(Chosen)* | **`libgit2` (C bindings / `git2go`)** | **`go-git` (Pure Go)** |
| :--- | :--- | :--- | :--- |
| **Feature Completeness** | 🟢 **100% Complete** (Every Git command & flag) | 🟡 ~75% (No interactive rebase, sparse-checkout) | 🔴 ~45% (No worktree, no rebase, no submodules v2) |
| **SSH & GPG Keys** | 🟢 **Inherits SSH Agent, GPG, & Credential Helpers** | 🔴 Requires manual C SSH / GPG implementation | 🔴 Complex SSH/GPG custom plumbing |
| **`.gitconfig` Aliases & Hooks** | 🟢 **Native support for all custom configs** | 🔴 Ignores many `.gitconfig` directives | 🔴 Ignores custom config rules |
| **CGO Dependency** | 🟢 **Zero CGO** (Uses `os/exec`) | 🔴 Heavy CGO / Dynamic C library dependencies | 🟢 Zero CGO |
| **Process Isolation** | 🟢 **Crashes in Git CLI do not crash the app** | 🔴 Memory fault in C library crashes host app | 🟢 Pure Go safe memory |
| **Performance for Status/Log** | 🟢 **Sub-millisecond via `--porcelain=v2`** | 🟢 Extremely fast in-memory | 🟡 Slow on large repos (Pure Go object parsing) |

### Strategic Decision:
Spawning `/usr/bin/git` with structured output flags (`git status --porcelain=v2`, `git log --topo-order --format=...`, `git diff --raw`) gives **100% compatibility with the user's existing Git configuration, SSH keys, GPG signing, and custom credentials** without risking CGO segfaults or missing advanced Git features.

---

## 4. Frontend Framework Evaluation: SolidJS vs. Svelte 5 vs. React

```
+---------------------------------------------------------------------------------------------------------+
|                                    FRONTEND REACTIVITY COMPARISON                                       |
+--------------------------+-----------------------+-----------------------------+------------------------+
| Feature                  | React 19              | SolidJS (Signals) *(Chosen)*| Svelte 5 (Runes)       |
+--------------------------+-----------------------+-----------------------------+------------------------+
| Component Execution      | Runs on EVERY tick    | **Runs EXACTLY ONCE**       | **Runs EXACTLY ONCE**  |
| Virtual DOM              | YES (Heavy tree diffs)| **0% (Direct DOM)**         | **0% (Direct DOM)**    |
| Dependency Arrays        | Required in hooks     | **NONE (Auto-tracked)**     | **NONE (Auto-tracked)**|
| JSX / TS Composability   | High                  | **Very High (JSX + TS)**    | Template based (.svelte)|
| Monaco/Canvas Integration| Clunky (Ref syncing)  | **Seamless (Direct DOM ref)**| Good (via onMount)     |
| Benchmark Performance    | ~1.7x Baseline        | **~1.05x (Near Vanilla JS)**| **~1.10x**             |
+--------------------------+-----------------------+-----------------------------+------------------------+
```

### Why SolidJS is Ideal for Multi-Repo Tooling:
1. **Zero Virtual DOM & Zero Re-renders**: SolidJS components execute **exactly once** during initialization. When repository #4 finishes a pull, **only repository #4's status badge updates in the DOM**. The other 19 repositories do zero re-evaluation.
2. **No Stale Closures or `useEffect` Loops**: Signals automatically track dependencies at runtime.
3. **Seamless Imperative Integration**: Integrating Monaco Editor, Canvas DAG graphs, and Kobalte context menus with direct DOM refs is straightforward and bug-free in SolidJS JSX.

---

## 5. Complete Package Manifest

| Layer | Package / Tool | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Desktop Shell** | `wails v2` | `^2.9.x` | Go desktop framework with native Linux WebKitGTK |
| **Backend Language** | `Go` | `1.25+` | Concurrency, process runner, git parsers |
| **File System Watcher** | `github.com/fsnotify/fsnotify` | `^1.8.x` | Inotify watcher for `.git/refs` & `.git/HEAD` |
| **Local Cache DB** | `modernc.org/sqlite` | `^1.34.x`| Pure Go zero-CGO SQLite for workspace persistence |
| **Terminal PTY** | `github.com/creack/pty` | `^1.1.x` | Unix pseudo-terminal for interactive CLI streaming |
| **Shell Utility** | `github.com/alessio/shellescape` | `^1.0.x` | Safe shell argument sanitization |
| **Frontend Framework**| `solid-js` | `^1.9.x` | Zero-VDOM, fine-grained reactive UI |
| **Frontend Compiler** | `vite` + `typescript` | `^6.x` / `^5.7.x` | Lightning-fast HMR and type safety |
| **Styling & Icons** | `tailwindcss` + `lucide-solid` | `^3.4.x` / `latest` | Dark theme & VS Code-style Git icons |
| **UI Primitives** | `@kobalte/core` | `^0.13.x`| Context menus, modals, tooltips, dialogs |
| **Virtualization** | `@tanstack/solid-virtual` | `^3.x` | High-density multi-repo tree rendering (60 FPS) |
| **Layout & Panes** | `solid-resizable-panels` | `latest` | Draggable split panels (Sidebar / Graph / Diff) |
| **Diff Viewer** | `@monaco-editor/loader` | `latest` | VS Code-grade Side-by-Side & Unified diffs |
| **Inline Diff Preview**| `diff2html` + `diff-match-patch` | `latest` | Fast static HTML diff preview for tree rows |
| **Git Graph** | Canvas + `@gitgraph/js` / `d3-dag` | `latest` | 60 FPS interactive commit DAG graph |
| **Terminal Drawer** | `@xterm/xterm` + `@xterm/addon-fit` | `^5.5.x` | Live colored streaming output for Git CLI |

---

## 6. Pros & Cons Summary

### 🟢 Pros:
- **Blazing Fast & Low Memory**: ~40–60 MB RAM idle (versus 300+ MB in Electron), instant startup (< 0.3s).
- **High Concurrency**: Goroutine worker pools handle 20+ repo batch operations effortlessly without UI lag.
- **Zero Component Re-renders**: SolidJS signals update exact DOM nodes surgically.
- **Full Git Feature Parity**: Spawns system `/usr/bin/git`, inheriting SSH keys, GPG signing, and custom aliases seamlessly.
- **Pro Developer Tooling**: Includes Monaco Diffing, interactive Git Graphs, and 3-Way Conflict Resolving.

### 🔴 Cons & Considerations:
- **WebKitGTK on Linux**: Relies on host WebKitGTK (already installed by default on Ubuntu desktop environments).
- **Monaco 3-Way Merge API**: Standalone Monaco only ships with 2-way diffing; 3-way merge is implemented via a coordinated dual-diff/3-pane model or inline conflict decorations (fully specified in our architecture).

