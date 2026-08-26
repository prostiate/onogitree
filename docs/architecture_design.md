# System Architecture & Implementation Roadmap (Go + SolidJS)

This document outlines the software architecture, Go backend services, IPC communication patterns, and phased development roadmap for **OnoGitTree** using **Go (Wails v2) + SolidJS**.

---

## 1. High-Level System Architecture

```mermaid
graph TB
    subgraph Frontend_Layer ["Frontend Layer (SolidJS + Tailwind + Kobalte)"]
        Toolbar["Global Batch Toolbar (Pull All, Fetch All, Refresh)"]
        VirtualTree["Virtualized Multi-Repo Tree (@tanstack/solid-virtual)"]
        Panes["Resizable Split Panes (solid-resizable-panels)"]
        DiffViewer["Monaco Diff Viewer (Split / Unified)"]
        GraphViewer["Git Commit Graph Visualizer (Canvas / @gitgraph/js)"]
        ConflictResolver["3-Way Visual Conflict Resolver"]
        TerminalDrawer["Live Terminal Drawer (@xterm/xterm)"]
        SignalStore["SolidJS Signals (Zero Re-render State)"]
    end

    subgraph Wails_Bridge ["Wails Go-to-TS Auto-Generated IPC Bridge"]
        Bindings["Auto-generated TS Bindings (wailsjs/go/...)"]
        EventBus["Wails Event Stream (runtime.EventsEmit)"]
    end

    subgraph Go_Backend ["Go Core Backend Services (Go 1.25)"]
        WorkspaceSvc["WorkspaceService (Folder Discovery & Persistence)"]
        BatchPool["BatchWorkerPool (Goroutine Worker Pool & Rate Limiter)"]
        GitCmdRunner["GitCommandRunner (os/exec + context.WithTimeout)"]
        DiffSvc["DiffService (Unified & Chunk Parsers)"]
        GraphSvc["GraphService (Topological Commit DAG Builder)"]
        ConflictSvc["ConflictService (3-Way Buffer Extractor & Resolvers)"]
        RefWatcher["RefWatcher (fsnotify on .git/HEAD & .git/refs)"]
        PTYSvc["PTYService (creack/pty Unix Terminal Runner)"]
        SqliteCache["SqliteCache (modernc.org/sqlite Zero-CGO Database)"]
    end

    subgraph Host_OS ["Ubuntu Linux Host"]
        GitBinary["/usr/bin/git"]
        SSHKey["SSH Agent / ~/.ssh/config"]
        FileSystem["File System & .git Data"]
    end

    Frontend_Layer <--> Wails_Bridge
    Wails_Bridge <--> Go_Backend
    GitCmdRunner --> GitBinary
    BatchPool --> GitCmdRunner
    DiffSvc --> GitCmdRunner
    GraphSvc --> GitCmdRunner
    ConflictSvc --> GitCmdRunner
    PTYSvc --> GitBinary
    RefWatcher --> FileSystem
    SqliteCache --> FileSystem
    GitBinary --> SSHKey
```

---

## 2. Core Go Backend Services

### 1. `GitCommandRunner` (`backend/git/runner.go`)
- Executes system Git CLI with cancellation context and safe timeout protection:
  ```go
  func (r *GitCommandRunner) Run(ctx context.Context, repoPath string, args ...string) (string, error)
  ```
- Protects against hangings on batch commands by injecting `GIT_TERMINAL_PROMPT=0` and `GIT_SSH_COMMAND=ssh -o BatchMode=yes`.
- Enforces per-repo execution Mutex (`sync.Mutex`) to prevent `.git/index.lock` collisions.

### 2. `BatchWorkerPool` (`backend/batch/pool.go`)
- Spawns a pool of worker goroutines (default: 5 concurrent workers) communicating via channels:
  ```go
  type BatchJob struct {
      RepoPath string
      Action   string // "pull", "fetch", "push", "status"
  }
  ```
- Emits real-time progress events to the frontend via `runtime.EventsEmit(ctx, "batch:progress", status)`.

### 3. `DiffService` (`backend/git/diff.go`)
- Computes working tree diffs, staged diffs, commit diffs, and branch comparisons:
  ```go
  func (s *DiffService) GetFileDiff(repoPath, filePath string, staged bool) (*DiffFile, error)
  ```
- Parses unified diff chunks into structured line objects for Monaco Diff Editor and `diff2html`.

### 4. `GraphService` (`backend/git/graph.go`)
- Reads commit logs via `git log --all --topo-order --pretty=format:"%H|%P|%an|%ae|%at|%s|%D"`:
  ```go
  type CommitNode struct {
      Hash      string       `json:"hash"`
      Parents   []string     `json:"parents"`
      Author    string       `json:"author"`
      Date      int64        `json:"date"`
      Subject   string       `json:"subject"`
      Refs      []string     `json:"refs"`
      RailIndex int          `json:"railIndex"`
  }
  ```
- Calculates topological branch lanes and merge connections for Canvas rendering.

### 5. `ConflictService` (`backend/git/conflict.go`)
- Detects files with merge/rebase conflicts.
- Extracts `:1:base`, `:2:ours`, `:3:theirs` contents using `git show :<stage>:<filepath>`.
- Provides atomic resolution methods (`ResolveWithOurs`, `ResolveWithTheirs`, `ResolveWithContent`).

### 6. `SqliteCache` (`backend/db/cache.go`)
- Uses `modernc.org/sqlite` (Pure Go, Zero CGO) to cache:
  - Discovered repository paths and aliases.
  - Pinned repository order.
  - Last fetched timestamps and commit metadata.
  - Workspace presets.

---

## 3. Implementation Roadmap

### 🚀 Phase 1: MVP - Multi-Repo Discovery & Batch Operations (Target: 1–2 Weeks)
- [x] Tech stack selection & architecture documentation.
- [ ] Initialize Wails v2 project with Go backend + SolidJS/Vite/Tailwind frontend.
- [ ] Implement `WorkspaceService` & `SqliteCache` (Add/scan repository folders, SQLite persistence).
- [ ] Implement `BatchWorkerPool` (Goroutine worker pool for *Pull All*, *Fetch All*, *Refresh All*).
- [ ] Build multi-repo tree view mirroring GitLens using `@tanstack/solid-virtual` and `lucide-solid`.
- [ ] Integrate `@kobalte/core` for right-click repository and branch context menus.

### 📝 Phase 2: Git Diff & Interactive Branch Controls (Target: 1–2 Weeks)
- [ ] Working tree changed files list with staged/unstaged toggles.
- [ ] Monaco Diff Editor integration (Side-by-Side & Unified modes with syntax highlighting).
- [ ] Branch management (Checkout, Create branch from..., Merge into current, Pull from).
- [ ] Stashes, Tags, and Remotes subtrees.

### 📊 Phase 3: Git Graph & 3-Way Merge Conflict Resolver (Target: 1–2 Weeks)
- [ ] Interactive commit DAG graph visualizer with branch lanes and commit inspection.
- [ ] 3-Way Merge Conflict Resolver (Ours / Base / Theirs / Live resolution buffer).
- [ ] Terminal drawer with `@xterm/xterm` and Go `creack/pty`.

### ⚡ Phase 4: Performance Optimization & Linux Packaging (Target: 1 Week)
- [ ] Real-time `fsnotify` file watching for `.git/refs` with 300ms debouncing.
- [ ] Build & package standalone Linux executable (`.deb`, `AppImage`, standalone binary).
