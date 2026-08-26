# Frontend Design System & UI Specification 🎨

Crafted under the **`frontend-design`** skill principles: distinctive visual identity, deliberate dark palette, intentional typography hierarchy, high-density professional dev-tool layout, and active-voice microcopy.

---

## 1. Design Thesis & Grounding

* **The Subject**: Polyrepo and microservices command center.
* **The Audience**: Professional Linux developers managing 10–30+ Git repositories concurrently who care deeply about RAM footprint, speed, and Git correctness.
* **The Single Job**: Provide an instant, clutter-free visual overview of all repository states and enable 1-click batch operations without cognitive overload.
* **The Signature Element**: 
  - **The Polyrepo Heartbeat Bar**: A persistent, high-density status footer combining live memory telemetry (`⚡ OnoGitTree | RAM: 45.8 MB | Goroutines: 8`), real-time batch workers activity indicators, and quick repository count filters.

---

## 2. Color Palette & Token System

Avoids generic flat black (`#000000`) or standard Bootstrap grays in favor of an intentional deep slate & carbon workspace with high contrast for Git status semantics:

```
+----------------------------------------------------------------------------------------------------+
|  Token Name           | Hex Value | Purpose / Usage                                                |
+----------------------------------------------------------------------------------------------------+
|  --bg-carbon-base     | #0F1117   | Master window background & Monaco gutter                       |
|  --bg-surface-slate   | #181B24   | Sidebar, panels, active cards, and modal bodies                |
|  --bg-surface-elevated| #212634   | Hover states, dropdown menus, context menus, tooltips          |
|  --border-subtle      | #282E3E   | 1px hairline panel borders and tree guidelines                 |
|  --text-primary       | #F3F4F6   | Main headings, file names, commit titles                       |
|  --text-muted         | #9CA3AF   | Commit hashes, timestamps, branch metadata, file paths         |
|  --git-emerald        | #10B981   | Staged files, fast-forward pull success, synced status         |
|  --git-amber          | #F59E0B   | Modified working tree, unstaged changes, dirty repo warnings   |
|  --git-crimson        | #EF4444   | Merge conflicts, deleted files, unrecoverable errors           |
|  --git-indigo         | #6366F1   | Active branch pills, primary CTA buttons, graph commit roots   |
+----------------------------------------------------------------------------------------------------+
```

---

## 3. Typography & Numerical Precision

| Role | Font Family | Size / Weight | Usage |
| :--- | :--- | :--- | :--- |
| **Display / Section Headings** | `Geist Sans`, `Inter`, `system-ui` | `13px` / SemiBold (`600`) | Tree section titles (`REPOSITORIES`, `CHANGES`) |
| **UI Body / Labels** | `Geist Sans`, `Inter`, `system-ui` | `12px` / Regular (`400`) | File tree names, context menus, modal text |
| **Code / Diffs / Hashes** | `JetBrains Mono`, `Fira Code`, `monospace` | `11.5px` / Medium (`500`) | Monaco Diff Editor, commit SHA-1, terminal drawer |
| **Status Numbers / Badges** | `JetBrains Mono` (tabular-nums) | `10.5px` / Bold (`700`) | Ahead/Behind badges (`+1 ~2`), file change counts (`9+, 2-`) |

---

## 4. UI Layout & Component Hierarchy

```
+---------------------------------------------------------------------------------------------------------------------------------------+
| TOP GLOBAL TOOLBAR (Height: 38px, --bg-surface-slate)                                                                                 |
| [📂 Open Repo] [🔍 Search / Filter Ctrl+K]  |  [📊 Graph] [📝 Diff]  |  [⬇ Pull All] [🔄 Fetch All] [⬆ Push All] [⚡ Refresh]   [⚙ Settings]|
+---------------------------------------------+-----------------------------------------------------------------------------------------+
| SIDEBAR (Width: 320px–480px, Resizable)     | MAIN WORKSPACE PANEL (Flexible Split / Resizable Panes)                                 |
|                                             |                                                                                         |
| ▼ REPOSITORIES (10)             [🔄] [⋮]    |  [ fe-amazone-monorepo: PaymentCard.tsx ] [ Side-by-Side | Unified ] [Stage] [Discard]  |
|   ▼ 🗃️ fe-amazone-monorepo 🌿 feat* [+1 ~1] | +-------------------------------------------------------------------------------------+ |
|     ├─ ☁️ Synced with GitLab (2m ago)       | | ORIGINAL (HEAD)                       | MODIFIED (Working Tree)                     | |
|     ├─ ▶ 📄 2 files changed                 | | 14 | const handlePay = () => {        | 14 | const handlePay = () => {              | |
|     ├─ ▶ 🌿 Branches (local/remote)         | | 15 |   setIsLoading(true);            | 15 |   setIsLoading(true);                  | |
|     └─ ▶ 📦 Stashes (1)                     | | 16 -   await api.chargeLegacy();      | 16 +   const token = await getToken();      | |
|   ▶ 🗃️ fe-amazone-inventory 🌿 main         | |    |                                  | 17 +   await api.chargeV2(token);           | |
|   ▶ 🗃️ be-amazone-auth 🌿 main              | +-------------------------------------------------------------------------------------+ |
|                                             |                                                                                         |
| ▼ CHANGES (fe-amazone-monorepo)             | COMMIT GRAPH / CONFLICT RESOLVER DRAWER (When Active)                                   |
|   [ Message (Ctrl+Enter to commit)        ] |  ● [a1b2c3d] feat: add cashier card token [HEAD -> feat/cashier] (Vincent, 10m ago)     |
|   [ ✓ Commit  ▼ (Commit & Push)           ] |  ● ● [e4f5g6h] fix: handle timeout in auth [origin/main] (Alice, 1h ago)                |
|   ▼ Staged (1)   🟢 usePayment.ts   [ - ]   |                                                                                         |
|   ▼ Changes (2)  🟡 PaymentCard.tsx [ + ]   |                                                                                         |
+---------------------------------------------+-----------------------------------------------------------------------------------------+
| STATUS BAR & RESOURCE TELEMETRY (Height: 24px, --bg-carbon-base)                                                                      |
| ⚡ OnoGitTree  |  RAM: 45.8 MB  |  Goroutines: 8  |  10 Repositories Active  |  Branch: feat/cashier-card-impl  |  Engine: /usr/bin/git  |
+---------------------------------------------------------------------------------------------------------------------------------------+
```

---

## 5. Micro-Interactions & Copywriting Principles

1. **Active-Voice Control Labels**:
   - `Stage Hunk` (not `Stage`)
   - `Discard 14 lines` (explicit scope in confirmation tooltip)
   - `Pull 10 Repositories` (clear batch count in confirmation)
   - `Mark as Resolved & Stage` (action describes exact side-effect)
2. **Intentional Transitions**:
   - `150ms ease-out` for tree accordion expansion and branch picker popovers.
   - Smooth non-blocking badge pulses during active background worker execution.
3. **Empty States with Clear Direction**:
   - When no repos are open: *"No repositories in workspace — Click 'Open Repo' or press Ctrl+O to select a folder or scan for Git repositories."*
   - When working tree is clean: *"Working tree clean — No unstaged changes on branch main."*
