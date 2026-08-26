# Tech Stack Evaluation: Go (Wails) Backend & Reactive Frontend Ecosystem

This document provides a comprehensive evaluation of **SolidJS vs. Svelte 5** for **OnoGitTree**, alongside an exhaustive catalog of specialized libraries for Git diffing, commit graphs, 3-way merge conflict resolution, context menus, resizable panes, terminal output, and Go backend persistence.

---

## 1. Frontend Framework Showdown: SolidJS vs. Svelte 5

Both SolidJS and Svelte 5 completely eliminate React's Virtual DOM, component re-render cascades, and `useEffect` dependency array bugs.

```
+----------------------------------------------------------------------------------------------------+
|                                      FRAMEWORK BENCHMARK & FIT                                     |
+--------------------------+------------------------------------+------------------------------------+
| Feature                  | SolidJS (Signals + JSX)            | Svelte 5 (Runes + Templates)       |
+--------------------------+------------------------------------+------------------------------------+
| Reactivity Engine        | Fine-grained runtime Signals       | Fine-grained compiler Runes        |
| Component Execution      | Runs EXACTLY ONCE (No re-renders)  | Runs EXACTLY ONCE (No re-renders)  |
| Virtual DOM Overhead     | 0% (None)                          | 0% (None)                          |
| Syntax Style             | JSX + TypeScript functions         | Single-file HTML-like templates    |
| Monaco / Canvas Glue     | Natural (Passes DOM refs cleanly)  | Simple (Uses onMount / $effect)    |
| Context Menu Composability| Extremely flexible (JSX children)  | Clean (Slots / Snippets)           |
| Memory Footprint         | ~25–35 MB                          | ~25–35 MB                          |
| Wails Project Template   | Community template / Vite setup    | Official out-of-the-box template   |
+--------------------------+------------------------------------+------------------------------------+
```

### Which should you choose?
- **Choose SolidJS** if: You love **TypeScript / JSX**, want zero learning curve coming from React-style components, and desire absolute granular control over signal updates.
- **Choose Svelte 5** if: You love **concise single-file templates** (`.svelte`), want zero JSX syntax boilerplate, and want official first-class Wails CLI template integration.

---

## 2. Complete Specialized Library Stack (Frontend & Backend)

Below is the complete catalog of specialized packages and tools recommended for **OnoGitTree** to support all advanced Git features:

### A. Git Diff & 3-Way Merge Conflict Resolution
1. **`monaco-editor` / `@monaco-editor/loader`** *(Recommended for Pro Diffing)*:
   - The exact diff engine powering VS Code.
   - Built-in side-by-side (split) and inline unified diff viewers, syntax highlighting for 100+ languages, minimap, and diff navigation.
2. **`diff2html` / `diff-match-patch`**:
   - Lightweight, ultra-fast static HTML diff chunk renderer for previewing modified files directly in the repository tree without launching a full editor.
3. **`@codemirror/merge`**:
   - Fast, lightweight modern 2-way diff editor alternative when Monaco's bundle size is too heavy.

---

### B. Git Graph / DAG Visualization
1. **`@gitgraph/js`** or **Custom HTML5 Canvas / WebGL Renderer**:
   - Renders interactive commit graphs, branch lanes, merge arcs, and tag badges at 60 FPS with pan and zoom capabilities.
2. **`d3-dag` / `d3-hierarchy`**:
   - Graph theory layout algorithms for topological commit sorting, branch lane index calculations, and ancestor path tracing.

---

### C. UI Primitives, Context Menus & Command Palette
| Category | **SolidJS Choice** | **Svelte 5 Choice** |
| :--- | :--- | :--- |
| **Accessible Context Menus & Dialogs** | **`@kobalte/core`** / **`corvu`** | **`bits-ui`** / **`shadcn-svelte`** |
| **`Ctrl+K` Command Palette** | **`cmdk-solid`** | **`cmdk-sv`** |
| **Tree & List Virtualization** | **`@tanstack/solid-virtual`** | **`@tanstack/svelte-virtual`** |
| **Resizable Split Panes** | **`solid-resizable-panels`** | **`paneforge`** |
| **Icons** | **`lucide-solid`** | **`lucide-svelte`** |

---

### D. Interactive Terminal & Git Output Streaming
1. **`@xterm/xterm` + `@xterm/addon-fit` + `@xterm/addon-webgl`**:
   - Embeds a high-performance, dark-themed terminal drawer at the bottom of the window.
   - Streams live colored Git CLI output (`git pull`, `git push`, `git fetch`, interactive rebase prompts) with full ANSI escape color support.

---

### E. Backend Go Packages (`go.mod`)
1. **`github.com/fsnotify/fsnotify`**:
   - Cross-platform native Linux `inotify` watcher to monitor `.git/HEAD`, `.git/refs/heads/**`, and `.git/index` with sub-millisecond latency.
2. **`modernc.org/sqlite`** (Pure Go, Zero CGO):
   - Embedded SQLite database storing workspace directories, pinned repositories, commit metadata cache, and user preferences locally at `~/.config/onogitree/data.db` without requiring C compiler toolchains.
3. **`github.com/creack/pty`**:
   - Unix pseudo-terminal (PTY) in Go for executing interactive Git CLI commands and streaming ANSI outputs directly to xterm.js.
4. **`github.com/alessio/shellescape`**:
   - Sanitizes and safely escapes shell arguments when constructing Git commands.
