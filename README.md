# OnoGitTree 🌳

<div align="center">

**The fast, lightweight desktop Git multi-repository manager you always wished existed.**

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Go Version](https://img.shields.io/badge/Go-1.24+-00ADD8.svg?logo=go)](https://golang.org)
[![Wails](https://img.shields.io/badge/Desktop-Wails_v2-DF1A55.svg?logo=wails)](https://wails.io)
[![SolidJS](https://img.shields.io/badge/Frontend-SolidJS-4F88C6.svg?logo=solid)](https://solidjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?logo=typescript)](https://www.typescriptlang.org)
[![Memory Footprint](https://img.shields.io/badge/RAM_Idle-~40--60_MB-brightgreen.svg)]()

</div>

---

## 💡 Why OnoGitTree Was Built

> *"In my daily engineering workflow, I constantly juggle between 10 to 30+ repositories simultaneously — microservices, shared libraries, monorepo packages, backend services, and frontend applications.*
> 
> *I loved the multi-repository visibility concept in tools like VS Code's GitLens, but I needed a **standalone, blazing-fast desktop application** that could perform 1-click parallel batch fetches, pulls, and pushes across all repositories without freezing the UI or eating gigabytes of RAM. I searched everywhere for a tool that could give me seamless, instant accessibility to all my repositories at once — and nowhere had what I wanted. So, I built **OnoGitTree**."*

---

## ✨ Key Features

### 🌲 1. Unified Multi-Repository Command Center
- **All Repositories in One View**: Inspect all workspace repositories in a sleek, collapsible hierarchical sidebar.
- **Instant Status Telemetry**: Live uncommitted change indicators (amber pulses), active branches, ahead/behind tracking counters (`+3↑`, `~1↓`), and synchronization states at a glance.
- **Deep Fast Access**: Switch branches, inspect recent commits, stage/unstage files, and navigate working trees with zero delay.

### ⚡ 2. Non-Blocking Parallel Batch Operations
- **Pull All / Fetch All / Push All**: Run parallel Git operations across 20+ repositories concurrently using Go goroutine worker pools.
- **Real-Time Live Progress**: Track each repository's batch progress, network transfers, ahead/behind counts, and error statuses in real-time.
- **Smart Conflict & Dirty Protection**: Automatically skips or isolates dirty working trees so your uncommitted work is never lost.

### 🛡️ 3. "Zero Blind Pushes" Batch Review
- Never push commits blind. The **Batch Push Review Modal** lets you review unpushed commit summaries, authors, and changed file lists across all repositories before confirming.

### 🎨 4. VS Code-Grade Diff Viewer & Brand File Icons
- **Rich Syntax Highlighting**: Authentic **VS Code Dark+ token themes** powered by PrismJS for TypeScript (`.ts`), React (`.tsx`, `.jsx`), Vue (`.vue`), Go (`.go`), Rust (`.rs`), Python (`.py`), JSON, Markdown, SCSS, SQL, Docker, Shell, and more.
- **Intelligent Diff Tints**: Soft, translucent addition and deletion background highlights that keep syntax coloring crisp and readable (no more monochromatic flat red/green lines).
- **Split & Inline Views**: Toggle between Unified (Inline) and Side-by-Side (Split) diff modes with VS Code diagonal hatch patterns for empty line space.
- **Official Brand SVG Icons**: Clean file brand icons (React atom, Vue chevron, TypeScript badge, Go gopher, Rust gear, Python snake, etc.) across diffs and tree explorers.
- **View All Changes at Once**: 1-click **"All Diff"** mode to view all modified, added, and deleted files across the entire worktree in a unified stream.

### 🖥️ 5. Real-Time Git Console & Developer Diagnostics
- **Live Git Command Console**: Real-time stream of every Git CLI command executed by OnoGitTree with duration timings (`42ms`), status badges (`OK` / `ERR`), and working directory context.
- **Interactive Stderr & Output Inspector**: Expand any command row to view complete `STDOUT` and `STDERR` outputs. Filter by "Errors Only" or search queries.
- **Smart Error Guidance**: Interactive error dialogs with tailored diagnosis for GitLab/GitHub errors (protected branch rejections, missing SSH keys, hook declines, auth tokens).
- **Engine Telemetry**: Live Go runtime memory allocations (Heap RAM, virtual memory, active goroutines, logical CPU cores, and `/usr/bin/git` engine status).

### 📝 6. Persistent On-Disk Logging
- All Git executions, timestamps, and error traces are automatically logged to disk:
  ```
  ~/.config/onogitree/logs/onogitree.log
  ```
- Easily accessible from **Preferences → Diagnostics & Logs** with 1-click "Open Log File", "Open Log Folder", "Copy Path", and "Clear Log File" actions.

### 🪶 7. Ultra-Low Memory Footprint (~40–60 MB)
- Unlike Electron-based tools that easily consume 300–800 MB of RAM, OnoGitTree is compiled with **Go + Wails v2** and **SolidJS** (Zero Virtual DOM, fine-grained reactive signals), staying under **~40–60 MB idle RAM** on Linux.

---

## 🏗️ Tech Stack

| Layer | Technology | Key Advantage |
| :--- | :--- | :--- |
| **Desktop Shell** | **[Wails v2](https://wails.io)** | Native WebKitGTK desktop shell, lightweight standalone binary. |
| **Backend Engine** | **[Go](https://golang.org) 1.24+** | Native concurrency, sub-millisecond Goroutine worker pools, and memory safety. |
| **Frontend** | **[SolidJS](https://solidjs.com) + TypeScript** | Fine-grained reactivity, **Zero Virtual DOM**, zero component re-render overhead. |
| **Styling** | **[Tailwind CSS](https://tailwindcss.com)** | Custom VS Code dark carbon palette tokens. |
| **Syntax Coloring** | **[PrismJS](https://prismjs.com)** | Multi-language VS Code Dark+ tokenization with line diff tinting. |
| **Icons** | **Lucide Icons & Brand SVGs** | Clean brand iconography and responsive symbols. |
| **Persistence** | **Embedded SQLite** | Embedded SQLite database for workspace persistence without external dependencies. |
| **Git Engine** | **Host Git CLI** | 100% native compatibility with host Git configurations, SSH keys, GPG signing, and credential helpers. |

---

## 🚀 Quick Start & Installation

### Prerequisites (Linux / Ubuntu / Debian)
Ensure you have the required GTK3 and WebKit2GTK developer packages installed:

```bash
sudo apt-get update && sudo apt-get install -y \
  pkg-config \
  libgtk-3-dev \
  libwebkit2gtk-4.1-dev \
  git
```

### Build from Source

1. **Clone the repository**:
   ```bash
   git clone https://github.com/prostiate/onogitree.git
   cd onogitree
   ```

2. **Ensure Go and PNPM are installed**:
   - Go 1.24+ ([golang.org](https://golang.org))
   - Node.js 18+ and `pnpm` (`npm i -g pnpm`)
   - Wails CLI v2 (`go install github.com/wailsapp/wails/v2/cmd/wails@latest`)

3. **Development Mode (Live HMR for Go & SolidJS)**:
   ```bash
   make dev
   ```

4. **Build Standalone Production Binary**:
   ```bash
   make build
   ```
   The compiled executable will be located at:
   ```
   build/bin/onogitree
   ```

5. **Run the Application**:
   ```bash
   ./build/bin/onogitree
   ```

---

## ⌨️ Useful Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| **`Ctrl + B`** | Toggle Left Sidebar (Repositories & Source Control) |
| **`Ctrl + Enter`** | Commit staged changes in Source Control composer |
| **`Escape`** | Close open Diff Viewer or active modal |

---

## 📖 Detailed Documentation

Deep architectural specifications, threat analyses, and coding guidelines are available in the [`docs/`](./docs) directory:

- [**Technical Overview & Architecture**](docs/overview.md)
- [**Tech Stack Comparison & Benchmarks**](docs/tech_stack_recommendation.md)
- [**Feature Specifications & Multi-Repo Blueprint**](docs/feature_specifications.md)
- [**Technical Challenges & Concurrency Guardrails**](docs/technical_challenges_and_considerations.md)
- [**Design System & UI Craftsmanship Spec**](docs/design_system_and_ui_spec.md)
- [**Coding Standards & Testing Guidelines**](docs/coding_standards_and_guidelines.md)

---

## 🤝 Contributing

Contributions, bug reports, and feature suggestions are always welcome!
Feel free to open an issue or submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feat/amazing-feature`)
3. Commit your Changes (`git commit -m 'feat: add amazing feature'`)
4. Run Tests & Lint (`make test && make check`)
5. Push to the Branch (`git push origin feat/amazing-feature`)
6. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for more information.
