# Feature Specifications & UI Blueprint

This document details the complete functional specifications, user interface structure, and operational controls for **OnoGitTree**, matching the GitLens VS Code multi-repository paradigm while providing a fast, memory-optimized standalone experience.

---

## 1. Top-Level Global Toolbar & Multi-Repo Batch Controls

```
+-------------------------------------------------------------------------------------------------------------------------+
| [📂 Add Repos] [🔍 Search / Filter...]  |  [📊 Graph View] [📝 Diff View]  |  [⬇ Pull All] [🔄 Fetch All] [⬆ Push All] [⚡ Refresh] [⚙] |
+-------------------------------------------------------------------------------------------------------------------------+
```

### Global Batch Actions:
1. **Pull All (`↓`)**:
   - Executes `git pull` across all open repositories concurrently using Go goroutine worker pools (throttled to 5–8 parallel workers).
   - Real-time status indicators per repo: `[Pending] ➔ [Pulling...] ➔ [✓ Up-to-date / Updated / ⚠️ Conflict / 🔑 Auth Required]`.
   - Option to pull with rebase (`git pull --rebase`) configurable in settings.
2. **Fetch All (`☁ / 🔄`)**:
   - Runs `git fetch --all --prune` across all open repos concurrently.
   - Refreshes remote tracking references and ahead/behind counts (`+ahead / ~behind`) without touching working directories.
3. **Push All (`↑`)**:
   - Identifies all repositories with unpushed commits (`+ahead > 0`).
   - Presents a safety confirmation modal showing the exact commits to be pushed per repository before executing `git push`.
4. **Refresh All (`⚡`)**:
   - Fast status scan using `git --no-optional-locks status --porcelain=v2` across all open repos.
   - Updates branch names, modified file counts, and untracked files in milliseconds.
5. **Multi-Repo Fuzzy Search & Filter (`🔍` / `Ctrl+K`)**:
   - Global command palette powered by `cmdk-solid`.
   - Filter repos by name, branch name, or status (`is:dirty`, `is:ahead`, `is:behind`, `is:conflicted`).
   - Quickly jump to any file, branch, commit, or repository.

---

## 2. Multi-Repository Tree Hierarchy (GitLens Blueprint)

The left sidebar renders the **Repositories Tree View**, virtualized with `@tanstack/solid-virtual` for 60 FPS scrolling across dozens of repositories:

```
▼ 🗃️ fe-amazone-monorepo   🌿 feat/cashier-card-impl   [+1 ~1]   • Last fetched 1m ago       [⬇] [🔄] [⬆] [⭐] [⋮]
   ├─ ☁️ Up to date with origin on GitLab (2m ago)
   ├─ ▶ 📄 2 files changed working tree
   │    ├─ 🟡 src/components/PaymentCard.tsx (Modified - Click to Open Diff)
   │    └─ 🟢 src/hooks/usePayment.ts (Staged - Click to Open Diff)
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
   ├─ ▶ 👥 Contributors
   └─ ▶ ⚡ Incoming Activity (experimental)
▶ 🗃️ fe-amazone-inventory   🌿 main   • Last fetched 54m ago
▶ 🗃️ fe_amazone_mobile_arcade   🌿 main   • Last fetched 54m ago
▶ 🗃️ be-amazone-auth   🌿 main   • Last fetched 54m ago
▶ 🗃️ be-amazone-auth-login   🌿 main   • Last fetched 54m ago
▶ 🗃️ be-amazone-backoffice   🌿 staging   • Last fetched 54m ago
▶ 🗃️ be-amazone-cashier   🌿 staging   • Last fetched 54m ago
▶ 🗃️ be-amazone-inventory   🌿 staging   • Last fetched 54m ago
▶ 🗃️ support-tools   🌿 main   • Last fetched 54m ago
▶ 🗃️ art-design-pro   🌿 main   [+1]   • Last fetched now
```

### Tree Sections Customization (Matching GitLens View Controls):
Users can customize which sections appear in the tree via the header menu (`...`):
- **Show / Hide Sections**:
  - `Current Branch Status` & `Branch Comparison`
  - `Commits` (Local & Upstream difference)
  - `Branches` (Local & Remote trees)
  - `Remotes` (Fetch URLs & push URLs)
  - `Stashes` (Stash index, message, branch created on)
  - `Tags` (Annotated & lightweight tags)
  - `Worktrees` (Linked worktrees & disk paths)
  - `Contributors` (Commit count, email, avatar)
- **View Options**:
  - `Sort By`: Repository Name, File Path, Last Fetched, or Most Recently Active.
  - `View Files as`: Auto, Flat List, or Directory Tree.
  - `Group / Detach Views`: Option to display Commits or Branches in dedicated detached panels or unified in the repository accordion.
  - `Disable Automatic Refresh`: Toggle background polling on/off.

### Context Menu Actions (Powered by `@kobalte/core`):

#### Right-Click on Repository Root:
- **Pull / Fetch / Push**: Run individual remote operations.
- **Switch Branch...**: Quick picker to switch local or remote tracking branch.
- **Create Branch from HEAD...**: Modal with branch name input and checkout option.
- **Merge... / Rebase...**: Modal to select source branch.
- **Stash All Changes... / Apply Stash...**: Manage working directory stash stack.
- **Open in Terminal**: Open host terminal (`gnome-terminal`, `kitty`, `alacritty`) or embedded xterm drawer.
- **Open in External Editor**: Open repository root in VS Code, Cursor, Neovim, or file manager.
- **Close / Remove Repository from Workspace**.

#### Right-Click on Branch Node:
- **Checkout Branch** (`git checkout <branch>`)
- **Pull from `<branch>` into current**
- **Merge `<branch>` into current** (`git merge <branch>`)
- **Rebase current on `<branch>`** (`git rebase <branch>`)
- **Create Branch from `<branch>`...**
- **Rename Branch...**
- **Delete Branch** (with `-d` or force `-D` confirmation)

#### Right-Click on Commit Node:
- **Inspect Commit**: Show full author, date, parent hashes, commit body, and affected files.
- **Checkout Commit (Detached HEAD)**
- **Create Branch from Commit...**
- **Cherry-Pick Commit into HEAD**
- **Revert Commit**
- **Copy Commit SHA-1 / Message**

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

### Diff Capabilities:
- **Side-by-Side (Split) & Unified modes**: Instant toggle with smooth layout preservation.
- **Full Syntax Highlighting**: TSX, JSX, TypeScript, Go, Python, Rust, C++, JSON, YAML, Markdown, CSS, SQL, etc.
- **Hunk-Level Staging & Discarding**: Stage or revert specific diff hunks directly from the editor gutter.
- **Arbitrary Ref Comparisons**: Compare working tree with HEAD, branch with branch (`main` vs `staging`), or commit with commit.
- **Whitespace Ignore**: Toggle `ignoreTrimWhitespace` for cleaner code reviews.

---

## 4. Interactive Git Graph Visualizer (Commit DAG)

Rendered with high-performance **HTML5 Canvas + SVG overlay** at 60 FPS:

```
+--------------------------------------------------------------------------------------------------------------------+
|  GRAPH        | COMMIT HASH | AUTHOR         | DATE         | COMMIT MESSAGE & REFS                                |
+--------------------------------------------------------------------------------------------------------------------+
|  ●            | a1b2c3d     | Vincent        | 10m ago      | feat: add cashier card token [HEAD -> feat/cashier]  |
|  ●   ●        | e4f5g6h     | Alice          | 1h ago       | fix: handle timeout in auth service [origin/main]   |
|  |\ /         |             |                |              |                                                      |
|  | ●          | 7c8d9e0     | Bob            | 3h ago       | merge branch 'staging' into main                     |
|  ● |          | 1a2b3c4     | Vincent        | 4h ago       | refactor: extract payment interfaces                 |
|  |/           |             |                |              |                                                      |
|  ●            | 5e6f7a8     | Release Bot    | 1d ago       | chore(release): v1.2.0 [tag: v1.2.0]                 |
+--------------------------------------------------------------------------------------------------------------------+
```

### Git Graph Capabilities:
- **Topological Rail Allocation**: Automatic lane assignment that minimizes crossing lines and recycles branch columns.
- **Interactive Commit Selection**: Clicking a commit opens a split inspector panel displaying the author avatar, full commit message, GPG signature status, and modified file list.
- **Ref Badges**: Visual pills for `HEAD`, local branches, remote tracking branches, and tags.
- **Graph Node Context Menu**: Right-click any commit to *Checkout*, *Create Branch*, *Cherry-Pick*, *Rebase*, or *Reset HEAD to here*.

---

## 5. Visual 3-Way Merge Conflict Resolver

When a merge, rebase, or batch pull encounters conflicts, OnoGitTree automatically presents the **3-Way Conflict Resolver**:

```
+----------------------------------------------------------------------------------------------------+
|  ⚠️ Conflicted File: src/config/api.ts   [Accept Ours] [Accept Theirs] [Accept Both] [Abort Merge] |
+----------------------------------------------------------------------------------------------------+
|  OURS (Current Branch)            |  BASE (Common Ancestor)        |  THEIRS (Incoming Branch)     |
|  export const API_URL =           |  export const API_URL =        |  export const API_URL =       |
|    "https://api.v2.internal";     |    "https://api.v1.internal";  |    "https://api.gateway.io";  |
+----------------------------------------------------------------------------------------------------+
|  RESOLVED OUTPUT (Editable Live Buffer):                                                           |
|  export const API_URL = "https://api.gateway.io";                                                  |
+----------------------------------------------------------------------------------------------------+
|  [ ✓ Mark as Resolved & Stage (`git add`) ]                                                        |
+----------------------------------------------------------------------------------------------------+
```

### Conflict Resolver Capabilities:
- **3-Pane Visual Comparison**: Displays *Ours* (Current Branch), *Base* (Common Ancestor), and *Theirs* (Incoming Branch) extracted directly from Git index stages `:1:`, `:2:`, and `:3:`.
- **1-Click Quick Actions**:
  - `Accept Current (Ours)`: Resolves conflict using `git checkout --ours`.
  - `Accept Incoming (Theirs)`: Resolves conflict using `git checkout --theirs`.
  - `Accept Both (Combination)`: Inserts both blocks sequentially.
- **Live Output Buffer**: Full-featured Monaco editor allowing manual edits with real-time syntax checking.
- **Atomic Staging**: Clicking "Mark as Resolved" writes the output buffer to disk and runs `git add <file>`.
- **Merge Abort**: 1-click `git merge --abort` or `git rebase --abort` to return the repository to a clean state.

---

## 6. Active Repository Source Control & Changes View (VS Code Style)

Below the Repositories list, OnoGitTree provides a focused **Changes & Commit Section** for the currently selected active repository (matching VS Code Source Control):

```
+----------------------------------------------------------------------------------------------------+
|  ▼ Changes (fe-amazone-monorepo)                                 [📦 Stash] [🔄 Sync] [✓ Stage All] |
+----------------------------------------------------------------------------------------------------+
|  [ Message (Ctrl+Enter to commit on "feat/cashier-card-implementation")                          ] |
|  [ ✓ Commit  ▼ (Commit & Push | Commit & Sync | Commit Amend)                                    ] |
+----------------------------------------------------------------------------------------------------+
|  ▼ Staged Changes (1)                                                                              |
|    🟢 src/hooks/usePayment.ts                                                     [12+, 4-, M] [ - ]|
|  ▼ Changes / Unstaged (2)                                                                          |
|    🟡 src/components/PaymentCard.tsx                                              [9+, 2-, M]  [ + ]|
|    ⚪ docs/prompt/prompt-20260826.md                                              [3, U]       [ + ]|
+----------------------------------------------------------------------------------------------------+
```

### Key Controls:
- **Instant Commit Input**: Type commit message and press `Ctrl+Enter` to commit to HEAD.
- **Commit Action Dropdown**: Quick actions for `Commit`, `Commit & Push`, `Commit & Sync`, and `Commit Amend`.
- **Hunk / File Staging**: Click `[ + ]` to stage, `[ - ]` to unstage, `[ ↺ ]` to discard (with confirmation).
- **Click to Diff**: Clicking any file opens it immediately in the Monaco Diff Editor.

---

## 7. Open Repository & Workspace Dialog (GitKraken / SourceTree Style)

Accessible via `📂 Open Repo` or `Ctrl+O`:

```
+----------------------------------------------------------------------------------------------------+
|  📂 Open or Clone Repositories                                                                     |
+----------------------------------------------------------------------------------------------------+
|  [ 📁 Open Local ]  [ 🔍 Scan Workspace ]  [ ☁️ Clone Remote ]  [ ⏱️ Recent Workspaces ]              |
+----------------------------------------------------------------------------------------------------+
|  • Open Local: Browse filesystem for a single repository containing .git                           |
|  • Scan Workspace: Select parent folder (e.g. ~/workspaces/) to auto-detect all nested git repos   |
|  • Clone Remote: Auto-detects GitHub (gh) and GitLab (glab) accounts or enter custom HTTPS/SSH URL |
|  • Recent: 1-click reopen of previously saved multi-repo workspace presets                         |
+----------------------------------------------------------------------------------------------------+
```

---

## 8. Live Terminal Drawer & App Resource Monitor Widget

### Live Terminal Drawer (`@xterm/xterm`):
- Expandable bottom drawer powered by `xterm.js` and Go `creack/pty`.
- Streams ANSI-colored output for batch operations or allows direct command execution (`Ctrl+\``).

### Live App Resource Monitor (Footer Status Bar):
- Real-time zero-overhead telemetry powered by Go `runtime.ReadMemStats`:
  ```
  ⚡ OnoGitTree  |  RAM: 45.8 MB  |  Goroutines: 8  |  Repos: 10 Active  |  Engine: /usr/bin/git
  ```
- Instant visibility into memory and concurrency performance.

