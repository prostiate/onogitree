package git

// FileStatus represents the status of a changed file in working tree or index.
type FileStatus struct {
	Path     string `json:"path"`
	OldPath  string `json:"oldPath,omitempty"`
	Status   string `json:"status"` // "modified", "staged", "untracked", "deleted", "renamed", "conflicted"
	Staged   bool   `json:"staged"`
	Additions int    `json:"additions"`
	Deletions int    `json:"deletions"`
}

// BranchInfo represents a Git branch (local or remote tracking).
type BranchInfo struct {
	Name       string `json:"name"`
	IsCurrent  bool   `json:"isCurrent"`
	IsRemote   bool   `json:"isRemote"`
	RemoteName string `json:"remoteName,omitempty"`
	Upstream   string `json:"upstream,omitempty"`
	AheadCount int    `json:"aheadCount"`
	BehindCount int   `json:"behindCount"`
	LastCommit string `json:"lastCommit"`
}

// RepoStatus represents the complete status snapshot of a repository.
type RepoStatus struct {
	ID                string       `json:"id"`
	Name              string       `json:"name"`
	Path              string       `json:"path"`
	CurrentBranch     string       `json:"currentBranch"`
	UpstreamBranch    string       `json:"upstreamBranch,omitempty"`
	AheadCount        int          `json:"aheadCount"`
	BehindCount       int          `json:"behindCount"`
	LastFetchedAt     string       `json:"lastFetchedAt"`
	IsDirty           bool         `json:"isDirty"`
	ChangedFilesCount int          `json:"changedFilesCount"`
	HasConflicts      bool         `json:"hasConflicts"`
	IsPinned          bool         `json:"isPinned"`
	AutoFetchEnabled  bool         `json:"autoFetchEnabled"`
	Files             []FileStatus `json:"files,omitempty"`
}

// BatchProgressEvent represents a real-time progress update during batch operations.
type BatchProgressEvent struct {
	RepoID      string `json:"repoId"`
	RepoPath    string `json:"repoPath"`
	RepoName    string `json:"repoName"`
	Action      string `json:"action"` // "pull", "fetch", "push", "refresh"
	Status      string `json:"status"` // "pending", "running", "success", "skipped", "conflict", "error", "auth_required"
	Message     string `json:"message"`
	AheadCount  int    `json:"aheadCount"`
	BehindCount int    `json:"behindCount"`
}

// CommitSummary represents a lightweight commit item.
type CommitSummary struct {
	Hash         string   `json:"hash"`
	ShortHash    string   `json:"shortHash"`
	AuthorName   string   `json:"authorName"`
	AuthorEmail  string   `json:"authorEmail"`
	Date         string   `json:"date"`
	RelativeDate string   `json:"relativeDate"`
	Subject      string   `json:"subject"`
	Refs         string   `json:"refs,omitempty"`
	Parents      []string `json:"parents"`
}

// CommitFileChange represents a file modified in a specific commit.
type CommitFileChange struct {
	Path      string `json:"path"`
	Status    string `json:"status"` // "modified", "added", "deleted", "renamed"
	Additions int    `json:"additions"`
	Deletions int    `json:"deletions"`
}

// CommitDetail represents full commit metadata and changed files.
type CommitDetail struct {
	Hash           string             `json:"hash"`
	ShortHash      string             `json:"shortHash"`
	AuthorName     string             `json:"authorName"`
	AuthorEmail    string             `json:"authorEmail"`
	Date           string             `json:"date"`
	RelativeDate   string             `json:"relativeDate"`
	Subject        string             `json:"subject"`
	Body           string             `json:"body"`
	Parents        []string           `json:"parents"`
	Files          []CommitFileChange `json:"files"`
	TotalAdditions int                `json:"totalAdditions"`
	TotalDeletions int                `json:"totalDeletions"`
}

