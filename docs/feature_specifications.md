# Feature Specifications & UI Blueprint

This document details the functional specifications, user interface structure, and operational controls for **OnoGitTree**, powered by **SolidJS**, **Kobalte**, **Monaco Editor**, and **Go (Wails)**.

---

## 1. Top-Level Global Toolbar & Batch Operations

```
+-------------------------------------------------------------------------------------------------------------------------+
|  [📂 Add Repos] [🔍 Search / Filter...]  |  [📊 Graph View] [📝 Diff View]  |  [⬇ Pull All] [🔄 Fetch All] [⬆ Push All] [⚡ Refresh] |
+-------------------------------------------------------------------------------------------------------------------------+
```

### Global Batch Actions:
1. **Pull All (`↓`)**:
   - Executes `git pull` across all open repositories concurrently using Go goroutine worker pools (throttled to 4–6 parallel workers).
   - Real-time progress indicators per repo: `[Pending] ➔ [Pulling...] ➔ [✓ Up-to-date / Updated / ⚠️ Conflict]`.
2. **Fetch All (`☁ / 🔄`)**:
   - Runs `git fetch --all --prune` across all open repos.
   - Refreshes remote tracking references and ahead/behind counts without touching working directories.
3. **Push All (`↑`)**:
   - Identifies all repositories with unpushed commits (`+ahead > 0`) and presents a review dialog before pushing.
4. **Refresh All (`⚡`)**:
   - Re-scans `git status --porcelain=v2`, branch state, and modified file counts.
5. **Multi-Repo Search & Filter (`🔍`)** (via `cmdk-solid`):
   - Fast `Ctrl+K` command palette to fuzzy search repos, active branches, or filter by dirty status (`is:dirty`).

---

## 2. Multi-Repository Tree Hierarchy (GitLens Inspired)

Rendered with `@tanstack/solid-virtual` for buttery-smooth 60 FPS scrolling even with 50+ repositories:

```
▼ 🗃️ fe-amazone-monorepo   🌿 feat/cashier-card-impl   [+1 ~2]   • Last fetched 2m ago       [⬆] [⬇] [🔄] [⭐] [⋮]
   ├─ ☁️ Up to date with origin on GitLab (2m ago)
   ├─ ▶ 📄 2 files changed in working tree
   │    ├─ 🟡 src/components/PaymentCard.tsx (Modified - Click to Diff)
   │    └─ 🟢 src/hooks/usePayment.ts (Staged - Click to Diff)
   ├─ 🔀 Compare Working Tree with <branch, tag, or ref...>
   ├─ ▶ ⌾ Commits feat/cashier-card-impl ⇄ origin/feat/cashier-card-impl
   │    ├─ ⌾ [a1b2c3d] feat: add cashier card token validation (vincent, 10m ago)
   │    └─ ⌾ [e4f5g6h] refactor: extract payment interfaces (vincent, 1h ago)
   ├─ ▶ 🌿 Branches
   │    ├─ 📁 local
   │    │   ├─ ✔ feat/cashier-card-impl (current)
   │    │   ├─ main
   │    │   └─ staging
   │    └─ 📁 remote (origin)
   │        ├─ origin/main
   │        ├─ origin/staging
   │        └─ origin/feat/cashier-card-impl
   ├─ ▶ ☁️ Remotes (origin)
   ├─ ▶ 📦 Stashes (1)
   ├─ ▶ 🏷️ Tags (v1.2.0, v1.2.1)
   ├─ ▶ 📁 Worktrees (default, feature-hotfix)
   └─ ▶ 👥 Contributors
```

### Context Menus (Powered by `@kobalte/core`):
- **Right-Click on Repository**:
  - *Open in Terminal* (`gnome-terminal`, `kitty`, etc. or embedded xterm drawer)
  - *Open in VS Code / Cursor / Neovim*
  - *Switch Branch...*
  - *Create Branch from HEAD...*
  - *Stash All Changes...*
  - *Discard All Changes...*
- **Right-Click on Branch**:
  - *Checkout Branch*
  - *Pull from `<branch>` into current*
  - *Merge `<branch>` into current*
  - *Rebase current on `<branch>`*
  - *Create Branch from `<branch>`...*
  - *Delete Branch*

---

## 3. Git Diff Visualizer (Side-by-Side & Unified)

Powered by **Monaco Diff Editor** (`@monaco-editor/loader`):

```
+----------------------------------------------------------------------------------------------------+
|  [src/components/PaymentCard.tsx]   [View: Side-by-Side | Unified]  [Stage Chunk] [Discard Chunk] |
+----------------------------------------------------------------------------------------------------+
|  ORIGINAL (HEAD)                           |  MODIFIED (Working Tree)                              |
| 14 | const handlePay = async () => {       | 14 | const handlePay = async () => {                  |
| 15 |   setIsLoading(true);                 | 15 |   setIsLoading(true);                            |
| 16 -   await api.chargeLegacy(cardId);     | 16 +   const token = await generateToken(cardId);     |
|    |                                       | 17 +   await api.chargeV2(token);                     |
| 17 |   setIsLoading(false);                | 18 |   setIsLoading(false);                           |
| 18 | };                                    | 19 | };                                               |
+----------------------------------------------------------------------------------------------------+
```

### Key Diff Features:
- **Side-by-Side (Split) & Unified modes** with instant toggle.
- **Syntax Highlighting** for 100+ languages.
- **Hunk Staging**: Stage individual hunks or entire files directly from diff view.
- **Arbitrary Ref Diffing**: Compare any two branches or commit hashes.

---

## 4. Interactive Git Graph Visualizer (Commit DAG)

Powered by **HTML5 Canvas / `@gitgraph/js` + `d3-dag`**:

```
+----------------------------------------------------------------------------------------------------+
|  GRAPH    | COMMIT HASH | AUTHOR       | DATE       | COMMIT MESSAGE / REFS                        |
+----------------------------------------------------------------------------------------------------+
|  *        | a1b2c3d     | Vincent      | 10m ago    | feat: add cashier card token [HEAD -> feat]  |
|  *   *    | e4f5g6h     | Alice        | 1h ago     | fix: handle timeout in auth service          |
|  |\ /     |             |              |            |                                              |
|  | *      | 7c8d9e0     | Bob          | 3h ago     | merge branch 'staging' into main             |
|  * |      | 1a2b3c4     | Vincent      | 4h ago     | refactor: extract payment interfaces         |
|  |/       |             |              |            |                                              |
|  *        | 5e6f7a8     | Release Bot  | 1d ago     | chore(release): v1.2.0 [tag: v1.2.0]         |
+----------------------------------------------------------------------------------------------------+
```

### Key Graph Features:
- **Color-Coded Branch Rails**: Clear visual graph of forks, branches, and merges at 60 FPS.
- **Ref Badges**: Visual indicators for `HEAD`, local branches, remote tracking branches, and tags.
- **Click to Inspect**: Detailed commit inspection (author, message, parent hashes, modified files list).
- **Interactive Node Actions**: Right-click to *Checkout*, *Create Branch*, *Cherry-Pick*, or *Rebase*.

---

## 5. Visual 3-Way Merge Conflict Resolver

Presented automatically when a merge or batch pull generates conflicts:

```
+----------------------------------------------------------------------------------------------------+
|  ⚠️ Conflicted File: src/config/api.ts   [Accept Ours] [Accept Theirs] [Accept Both] [Abort Merge] |
+----------------------------------------------------------------------------------------------------+
|  OURS (Current Branch)            |  BASE (Common Ancestor)        |  THEIRS (Incoming Branch)     |
|  export const API_URL =           |  export const API_URL =        |  export const API_URL =       |
|    "https://api.v2.internal";     |    "https://api.v1.internal";  |    "https://api.gateway.io";  |
+----------------------------------------------------------------------------------------------------+
|  RESOLVED OUTPUT (Editable Buffer):                                                                |
|  export const API_URL = "https://api.gateway.io";                                                  |
+----------------------------------------------------------------------------------------------------+
|  [ ✓ Mark as Resolved & Stage (`git add`) ]                                                        |
+----------------------------------------------------------------------------------------------------+
```

### Key Conflict Features:
- **3-Way Visual Comparison**: Displays *Ours*, *Base*, and *Theirs* side-by-side.
- **1-Click Resolvers**:
  - *Accept Current (Ours)* (`git checkout --ours`)
  - *Accept Incoming (Theirs)* (`git checkout --theirs`)
  - *Accept Both (Append)*
- **Live Output Editor**: Real-time editable output buffer with syntax validation.
- **Atomic Abort**: 1-click clean `git merge --abort` or `git rebase --abort`.

---

## 6. Live Terminal Drawer (`@xterm/xterm`)

- Expandable bottom drawer powered by `xterm.js` and Go `creack/pty`.
- Streams ANSI-colored output for batch operations or allows direct command execution.
- Can be toggled with `Ctrl+\`` or shortcut button.
