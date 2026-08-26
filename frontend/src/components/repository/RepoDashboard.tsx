import { Component, createSignal, createMemo, Show } from "solid-js";
import { GitBranch, Copy, GitCommit, FileDiff } from "lucide-solid";
import { repoStore } from "../../store/repoStore";
import { RepoStatus, CommitSummary } from "../../types/git";
import { ContextMenu, MenuItem } from "../common/ContextMenu";
import { RepoHeroCard } from "./dashboard/RepoHeroCard";
import { RepoMetricsBar } from "./dashboard/RepoMetricsBar";
import { UncommittedChangesCard } from "./dashboard/UncommittedChangesCard";
import { CommitHistoryTimeline } from "./dashboard/CommitHistoryTimeline";

interface RepoDashboardProps {
  repo: RepoStatus;
  onBranchPickerOpen: () => void;
}

export const RepoDashboard: Component<RepoDashboardProps> = (props) => {
  const [contextMenuPos, setContextMenuPos] = createSignal<{
    x: number;
    y: number;
    commit: CommitSummary;
  } | null>(null);
  const [copiedHash, setCopiedHash] = createSignal<string | null>(null);
  const [commitSearch, setCommitSearch] = createSignal<string>("");

  const commits = () => repoStore.recentCommits();

  const copyText = (text: string, id: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleCommitContextMenu = (e: MouseEvent, commit: CommitSummary) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY, commit });
  };

  // Memoized filtered commits
  const filteredCommits = createMemo(() => {
    const q = commitSearch().toLowerCase().trim();
    const list = commits();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.subject.toLowerCase().includes(q) ||
        c.authorName.toLowerCase().includes(q) ||
        c.shortHash.toLowerCase().includes(q) ||
        c.hash.toLowerCase().includes(q) ||
        (c.refs && c.refs.toLowerCase().includes(q)),
    );
  });

  const getContextMenuItems = (commit: CommitSummary): MenuItem[] => [
    {
      id: "inspect",
      label: "Inspect Commit Changes",
      icon: <GitCommit class="w-3.5 h-3.5 text-indigo-400" />,
      onClick: () => repoStore.toggleCommitExpanded(commit.hash),
    },
    {
      id: "view-all-diff",
      label: "View Entire Commit Diff",
      icon: <FileDiff class="w-3.5 h-3.5 text-cyan-400" />,
      onClick: () => repoStore.selectFileForDiff("__ALL__", false, commit.hash),
    },
    { id: "div-1", label: "", divider: true },
    {
      id: "copy-hash",
      label: "Copy Commit Hash (Full SHA)",
      icon: <Copy class="w-3.5 h-3.5 text-gray-400" />,
      onClick: () => copyText(commit.hash, commit.hash),
    },
    {
      id: "copy-short",
      label: "Copy Short Hash",
      icon: <Copy class="w-3.5 h-3.5 text-gray-400" />,
      onClick: () => copyText(commit.shortHash, commit.shortHash),
    },
    {
      id: "copy-subj",
      label: "Copy Commit Message",
      icon: <Copy class="w-3.5 h-3.5 text-gray-400" />,
      onClick: () => copyText(commit.subject, `subj-${commit.hash}`),
    },
    { id: "div-2", label: "", divider: true },
    {
      id: "checkout",
      label: `Checkout Commit ${commit.shortHash}...`,
      icon: <GitBranch class="w-3.5 h-3.5 text-emerald-400" />,
      onClick: () => repoStore.checkoutBranch(props.repo.path, commit.hash),
    },
  ];

  return (
    <div class="flex-1 flex flex-col overflow-y-auto p-6 space-y-6 text-gray-200 select-none">
      {/* 1. Repository Hero Header Card */}
      <RepoHeroCard
        repo={props.repo}
        onBranchPickerOpen={props.onBranchPickerOpen}
      />

      {/* 2. Key Metrics & Status Bar */}
      <RepoMetricsBar repo={props.repo} />

      {/* 3. Active Working Tree Changes Breakdown */}
      <UncommittedChangesCard repo={props.repo} />

      {/* 4. Commit History Timeline */}
      <CommitHistoryTimeline
        repo={props.repo}
        commits={commits()}
        filteredCommits={filteredCommits()}
        searchQuery={commitSearch()}
        onSearchChange={setCommitSearch}
        copiedHash={copiedHash()}
        onCopyText={copyText}
        onContextMenu={handleCommitContextMenu}
      />

      {/* Context Menu for Commit Item */}
      <Show when={contextMenuPos()}>
        {(menu) => (
          <ContextMenu
            x={menu().x}
            y={menu().y}
            isOpen={true}
            items={getContextMenuItems(menu().commit)}
            onClose={() => setContextMenuPos(null)}
          />
        )}
      </Show>
    </div>
  );
};
