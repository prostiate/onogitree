# Feature Specifications & UI Blueprint

This document details the functional specifications, user interface structure, and operational controls for **OnoGitTree**, including multi-repository management, batch operations, Git Diffing, Git Graph visualization, and 3-Way Merge Conflict resolution.

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
   - Identifies all repositories with unpushed commits (`+ahead > 0`) and offers a batch push with confirmation review.
4. **Refresh All (`⚡`)**:
   - Re-scans `git status --porcelain=v2`, branch state, and modified file counts.
5. **Multi-Repo Search & Filter (`🔍`)**:
   - Filter repos by name, active branch name, dirty state (`is:dirty`), or unpushed commits (`is:ahead`).

---

## 2. Multi-Repository Tree Hierarchy (GitLens Inspired)

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

---

## 3. Git Diff Visualizer (Side-by-Side & Unified)

When clicking on any modified file in the working tree, or comparing commits/branches:

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
- **Syntax Highlighting** for TypeScript, JavaScript, Go, Python, HTML/CSS, JSON, YAML, Rust, etc.
- **Interactive Hunk / Chunk Staging**: Stage individual hunks or entire files directly from the diff view.
- **Branch / Commit Comparison**: Diff any two branches (`main...feat/branch`) or arbitrary commit hashes.

---

## 4. Interactive Git Graph Visualizer (Commit DAG)

Visualizes the history and branching topology of the selected repository (or combined workspace graph):

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
- **Color-Coded Branch Lanes**: Distinct SVG/Canvas rails for branches, forks, and merges.
- **Ref Badges**: Visual tags for `HEAD`, `local branches`, `remote branches`, and `tags`.
- **Click to Inspect**: Selecting a commit displays full author info, commit message, parent commits, and file changes list with diffs.
- **Direct Context Actions on Graph**:
  - Right-click node to: *Checkout Commit*, *Create Branch Here*, *Cherry-Pick*, *Rebase on this commit*, *Reset HEAD here*.

---

## 5. Visual 3-Way Merge Conflict Resolver

When a merge or pull encounters conflicts, OnoGitTree automatically presents the **Conflict Resolution View**:

```
+----------------------------------------------------------------------------------------------------+
|  ⚠️ 1 Conflicted File: src/config/api.ts   [Accept Ours] [Accept Theirs] [Accept Both] [Abort Merge]|
+----------------------------------------------------------------------------------------------------+
|  OURS (Current Branch)            |  BASE (Common Ancestor)        |  THEIRS (Incoming Branch)     |
|  export const API_URL =           |  export const API_URL =        |  export const API_URL =       |
|    "https://api.v2.internal";     |    "https://api.v1.internal";  |    "https://api.gateway.io";  |
+----------------------------------------------------------------------------------------------------+
|  RESOLVED OUTPUT (Editable):                                                                       |
|  export const API_URL = "https://api.gateway.io";                                                  |
+----------------------------------------------------------------------------------------------------+
|  [ ✓ Mark as Resolved & Stage (`git add`) ]                                                        |
+----------------------------------------------------------------------------------------------------+
```

### Key Conflict Features:
- **3-Way Visual Comparison**: Displays *Ours (Local)*, *Base (Common ancestor)*, and *Theirs (Incoming)* side-by-side.
- **One-Click Resolvers**:
  - *Accept Current (Ours)* (`git checkout --ours`)
  - *Accept Incoming (Theirs)* (`git checkout --theirs`)
  - *Accept Both (Append)*
- **Live Output Editor**: Edit the final resolution buffer directly with syntax check before marking as resolved.
- **Atomic Abort**: Clean `git merge --abort` or `git rebase --abort` with one click.
