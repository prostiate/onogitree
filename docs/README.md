# OnoGitTree Documentation 🌳

**OnoGitTree** is a dedicated, lightweight desktop GUI application for Linux (and cross-platform) designed to bring the powerful **multi-repository visualization and management** capabilities of VS Code's GitLens into a standalone, ultra-responsive tool.

---

## 📌 Context & Objectives

Modern engineering workflows (microservices, polyrepos, backend + frontend + shared packages) often require developers to have 5 to 30+ repositories open simultaneously. Managing them individually via terminal or standard single-repo Git GUIs is slow and repetitive.

While **VS Code GitLens** offers a great "Repositories" sidebar view, it is locked inside VS Code and heavily coupled with the IDE's editor model.

**OnoGitTree** bridges this gap as a standalone tool focusing on:
1. **Multi-Repo Dashboard**: View all your project repositories in a single unified, hierarchical tree.
2. **One-Click Batch Operations**: *Pull All*, *Fetch All*, *Push All*, and *Refresh All* with real-time status and non-blocking concurrency.
3. **Deep Git Control per Repository**: Instant branch switching, upstream tracking (`+ahead / -behind`), working tree diffs, stashes, tags, remotes, and worktrees.
4. **Rich Contextual Actions**: *Merge from...*, *Pull from...*, *Create branch from...*, *Rebase...*, *Cherry-pick*, and stash management.
5. **Blazing Fast & Low Memory**: Snappy startup and low idle resource footprint on Ubuntu / Linux.

---

## 📚 Documentation Index

1. [**Tech Stack Evaluation & Recommendation**](./tech_stack_recommendation.md)
   - Comprehensive analysis of Electron vs. Tauri vs. Wails vs. Web.
   - Git integration strategies (Git CLI spawn vs. Dugite vs. libgit2/git2-rs vs. simple-git).
   - Recommended stack, pros & cons matrix, and runtime comparison.

2. [**Feature Specifications & UI Blueprint**](./feature_specifications.md)
   - Detailed mapping of the GitLens Repositories Tree View based on UI references.
   - Batch operations, repository node layout, and expandable sub-trees.
   - Command controls: Merge, Pull from, Create Branch from, Stashes, Worktrees.

3. [**Technical Challenges & Architecture Considerations**](./technical_challenges_and_considerations.md)
   - Concurrency & worker throttling for multi-repo operations.
   - Git locking (`index.lock`) race conditions and queue management.
   - SSH and HTTPS authentication handling during batch jobs.
   - Linux file watching (`inotify` limits) and debounced status polling.
   - Error isolation and merge conflict UX in batch flows.

4. [**System Architecture & Roadmap**](./architecture_design.md)
   - Backend IPC bridge, Git process runner, Repo State Cache, and Frontend Store.
   - Phased execution plan (MVP to full feature set).
