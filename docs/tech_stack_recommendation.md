# Tech Stack Evaluation: Go (Wails) vs. Electron vs. Tauri

This document provides an in-depth evaluation of using **Go (Golang)** with **Wails v2/v3** for building **OnoGitTree**, comparing it directly with Electron and Tauri for memory efficiency, raw execution speed, reliability, and advanced Git capabilities (Diffs, Graphs, and Conflict Resolvers).

---

## 1. Why Go (Wails) is an Exceptional Choice for a Git GUI

Yes, **Golang is not only possible—it is one of the best choices** for a multi-repository Git client on Ubuntu/Linux.

### 🌟 Key Advantages of Go + Wails:
1. **Ultra-Low Memory Footprint (35–60 MB RAM)**:
   - Electron bundles an entire Chromium browser and Node.js runtime, typically consuming **180–350 MB** idle.
   - Wails uses Linux's native `WebKitGTK` for the UI layer and compiles the Go backend directly into native machine code, keeping idle RAM at **~45 MB**.
2. **First-Class Concurrency with Goroutines & Channels**:
   - Spawning 20+ concurrent `git fetch` or `git pull` operations across repositories is trivial in Go using worker pools (`sync.WaitGroup`, buffered channels).
   - Low scheduling overhead compared to Node.js event-loop process spawning or heavy OS threads.
3. **Context-Aware Cancellation & Timeout Safety**:
   - Go's `context.Context` allows instant cancellation of hanging Git processes (e.g. SSH timeout after 10 seconds) without leaking zombie processes.
4. **Single Static Binary Distribution**:
   - Produces a single executable binary (`onogitree`) without massive `node_modules` or runtime packaging bloat.
5. **Seamless Go-to-TypeScript IPC**:
   - Wails automatically generates TypeScript bindings and types for all Go methods in real-time during development.

---

## 2. Framework Comparison: Go (Wails) vs. Electron vs. Tauri

| Criterion | **Go + Wails (v2/v3)** | **Electron + TypeScript** | **Rust + Tauri (v2)** |
| :--- | :--- | :--- | :--- |
| **Idle Memory (RAM)** | 🟢 **~45 MB** | 🔴 **~220 MB** | 🟢 **~40 MB** |
| **Binary Size** | 🟢 **~15 MB** | 🔴 **~110 MB** | 🟢 **~12 MB** |
| **Cold Startup Time** | 🟢 **< 0.3s** | 🟡 **~1.5s - 2.5s** | 🟢 **< 0.3s** |
| **Batch Concurrency** | 🟢 **Goroutines (Ultra-fast)** | 🟡 Node.js Child Process Pool | 🟢 Tokio async tasks |
| **Development Speed** | 🟢 **High** (Go + React/TS) | 🟢 **Very High** (Pure TS) | 🟡 **Moderate** (Rust complexity) |
| **System Prerequisites** | Go `go1.25` (Already installed!) | Node.js `v24` (Already installed!) | Rust toolchain required |
| **Git Engine** | Spawning CLI (`os/exec`) + `go-git` | Spawning CLI (`execa`) + TS | Spawning CLI (`std::process`) + `git2` |

---

## 3. How Core Git Features Are Handled in Go + Wails

```
+-------------------------------------------------------------------------------+
|                             REACT / WEB FRONTEND                             |
|  [Multi-Repo Tree]  |  [Interactive Git Graph]  |  [Diff Viewer / 3-Way Merge] |
+-------------------------------------------------------------------------------+
                                      ▲
                         Wails Auto-Generated IPC Bindings
                                      ▼
+-------------------------------------------------------------------------------+
|                               GO BACKEND CORE                                 |
|  - GitProcessManager (os/exec + context.WithTimeout)                          |
|  - BatchWorkerPool (Goroutines + Semaphore Channels)                         |
|  - Inotify Ref Watcher (fsnotify on .git/HEAD & .git/refs)                    |
|  - GitLogGraphParser (Topological Commit DAG builder)                         |
|  - Diff & MergeConflictService (3-way buffer extractor)                       |
+-------------------------------------------------------------------------------+
                                      ▲
                                      ▼
                        Host Git CLI (/usr/bin/git)
```

### 1. Git Diff Engine
- **Go Backend**: Runs `git diff -U3 --color=never` or `git diff --staged` with streaming output parsing. Parses file headers, line changes, and chunk offsets into structured JSON payloads.
- **Frontend**: Renders responsive Side-by-Side (Split) or Unified Diff views with syntax highlighting (powered by Monaco Editor Diff or `@git-diff-view/react`).

### 2. Git Commit Graph (DAG Visualizer)
- **Go Backend**: Executes `git log --all --topo-order --pretty=format:"%H|%P|%an|%ae|%at|%s|%D"` and calculates branch rail lines and merge coordinates in nanoseconds.
- **Frontend**: Renders an interactive, smooth SVG/Canvas commit graph with clickable commit nodes, branch badges, tag markers, and commit details.

### 3. Git Merge Conflict Resolver (3-Way Merge)
- **Go Backend**: Detects unmerged files (`git status --porcelain`). Extracts the 3 conflict states (`:1:base`, `:2:ours`, `:3:theirs`) using `git show`. Provides atomic commands to resolve (`git checkout --ours`, `git checkout --theirs`, or writing the merged buffer and running `git add`).
- **Frontend**: 3-pane interactive conflict editor (Current / Base / Incoming / Merged Output) with one-click resolution buttons (*"Accept Current"*, *"Accept Incoming"*, *"Accept Both"*).

---

## 4. Final Recommendation: **Go (Wails) + React + Vite + Tailwind**

Since **Go is already installed on your Ubuntu system (`go1.25.14`)** and you prioritize **memory optimization, speed, and reliability**, **Go + Wails** is the optimal architecture for OnoGitTree.
