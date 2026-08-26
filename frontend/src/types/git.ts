export type FileChangeStatus =
  "modified" | "staged" | "untracked" | "deleted" | "renamed" | "conflicted";

export interface FileStatus {
  path: string;
  oldPath?: string;
  status: FileChangeStatus;
  staged: boolean;
  additions?: number;
  deletions?: number;
}

export interface BranchInfo {
  name: string;
  isCurrent: boolean;
  isRemote: boolean;
  remoteName?: string;
  upstream?: string;
  aheadCount: number;
  behindCount: number;
  lastCommit?: string;
}

export interface RepoStatus {
  id: string;
  name: string;
  path: string;
  currentBranch: string;
  upstreamBranch?: string;
  aheadCount: number;
  behindCount: number;
  lastFetchedAt: string;
  isDirty: boolean;
  changedFilesCount: number;
  hasConflicts: boolean;
  isPinned: boolean;
  autoFetchEnabled: boolean;
  files?: FileStatus[];
}

export type BatchActionStatus =
  | "pending"
  | "running"
  | "success"
  | "skipped"
  | "conflict"
  | "error"
  | "auth_required";

export interface BatchProgressEvent {
  repoId: string;
  repoPath: string;
  repoName: string;
  action: "pull" | "fetch" | "push" | "refresh";
  status: BatchActionStatus;
  message: string;
  aheadCount: number;
  behindCount: number;
}

export interface DiscoveredRepo {
  name: string;
  path: string;
}

export interface RepositoryRecord {
  id: string;
  path: string;
  name: string;
  isPinned: boolean;
  sortOrder: number;
  autoFetch: boolean;
}

export interface WorkspaceRecord {
  id: string;
  name: string;
  isActive: boolean;
  repos?: RepositoryRecord[];
}

export interface ResourceStats {
  allocRamMb: number;
  totalAllocMb: number;
  sysRamMb: number;
  numGoroutine: number;
  numCpu: number;
  timestamp: number;
}

export interface CommitSummary {
  hash: string;
  shortHash: string;
  authorName: string;
  authorEmail: string;
  date: string;
  relativeDate: string;
  subject: string;
  refs?: string;
  parents?: string[];
}

export interface CommitFileChange {
  path: string;
  status: "modified" | "added" | "deleted" | "renamed";
  additions: number;
  deletions: number;
}

export interface CommitDetail {
  hash: string;
  shortHash: string;
  authorName: string;
  authorEmail: string;
  date: string;
  relativeDate: string;
  subject: string;
  body: string;
  parents: string[];
  files: CommitFileChange[];
  totalAdditions: number;
  totalDeletions: number;
}

export interface GitCommandLog {
  id: string;
  timestamp: string;
  repoPath: string;
  command: string;
  durationMs: number;
  success: boolean;
  stdout: string;
  stderr: string;
  error?: string;
}

export interface LogFileInfo {
  logPath: string;
  logDir: string;
  logSize: number;
}

