package git

import (
	"context"
	"fmt"
	"strings"
)

// BranchService manages branch and staging operations.
type BranchService struct {
	runner Runner
	parser *PorcelainParser
}

// NewBranchService initializes a new BranchService.
func NewBranchService(runner Runner, parser *PorcelainParser) *BranchService {
	return &BranchService{
		runner: runner,
		parser: parser,
	}
}

// ListBranches lists all local and remote branches.
func (s *BranchService) ListBranches(ctx context.Context, repoPath string) ([]BranchInfo, error) {
	out, err := s.runner.Run(ctx, repoPath, "branch", "-a", "-vv")
	if err != nil {
		return nil, fmt.Errorf("failed to list branches: %w", err)
	}
	return s.parser.ParseBranches(out)
}

// Checkout switches the active branch or creates a tracking branch if remote.
func (s *BranchService) Checkout(ctx context.Context, repoPath string, branchName string) error {
	// If branch starts with origin/, create local tracking branch or switch to it
	if strings.HasPrefix(branchName, "origin/") {
		localName := strings.TrimPrefix(branchName, "origin/")
		_, err := s.runner.Run(ctx, repoPath, "checkout", "-B", localName, branchName)
		return err
	}
	_, err := s.runner.Run(ctx, repoPath, "checkout", branchName)
	return err
}

// CreateBranch creates a new branch from a starting ref.
func (s *BranchService) CreateBranch(ctx context.Context, repoPath string, branchName string, startPoint string, checkout bool) error {
	args := []string{"branch", branchName}
	if startPoint != "" {
		args = append(args, startPoint)
	}
	if checkout {
		args = []string{"checkout", "-b", branchName}
		if startPoint != "" {
			args = append(args, startPoint)
		}
	}

	_, err := s.runner.Run(ctx, repoPath, args...)
	return err
}

// StageFiles stages specified files or all if empty.
func (s *BranchService) StageFiles(ctx context.Context, repoPath string, files ...string) error {
	args := []string{"add"}
	if len(files) == 0 {
		args = append(args, "-A")
	} else {
		args = append(args, files...)
	}
	_, err := s.runner.Run(ctx, repoPath, args...)
	return err
}

// UnstageFiles unstages files using git restore --staged.
func (s *BranchService) UnstageFiles(ctx context.Context, repoPath string, files ...string) error {
	args := []string{"restore", "--staged"}
	if len(files) == 0 {
		args = append(args, ".")
	} else {
		args = append(args, files...)
	}
	_, err := s.runner.Run(ctx, repoPath, args...)
	return err
}

// Commit creates a new commit on HEAD.
func (s *BranchService) Commit(ctx context.Context, repoPath string, message string, amend bool) error {
	if strings.TrimSpace(message) == "" && !amend {
		return fmt.Errorf("commit message cannot be empty")
	}
	args := []string{"commit"}
	if amend {
		args = append(args, "--amend")
	}
	if message != "" {
		args = append(args, "-m", message)
	}
	_, err := s.runner.Run(ctx, repoPath, args...)
	return err
}

// DiscardFiles discards uncommitted modifications or deletes untracked files.
func (s *BranchService) DiscardFiles(ctx context.Context, repoPath string, files ...string) error {
	if len(files) == 0 {
		return nil
	}
	for _, f := range files {
		// Restore tracked changes
		_, _ = s.runner.Run(ctx, repoPath, "restore", "--staged", "--worktree", f)
		// Clean untracked if still exists
		_, _ = s.runner.Run(ctx, repoPath, "clean", "-fd", f)
	}
	return nil
}

// GetFileDiff returns unified diff output for a specified file, or all files if filePath is empty or "__ALL__".
func (s *BranchService) GetFileDiff(ctx context.Context, repoPath string, filePath string, staged bool) (string, error) {
	if filePath == "" || filePath == "__ALL__" {
		if staged {
			return s.runner.Run(ctx, repoPath, "diff", "--cached")
		}
		out, err := s.runner.Run(ctx, repoPath, "diff", "HEAD")
		if err != nil || strings.TrimSpace(out) == "" {
			return s.runner.Run(ctx, repoPath, "diff")
		}
		return out, nil
	}
	if staged {
		out, err := s.runner.Run(ctx, repoPath, "diff", "--cached", "--", filePath)
		return out, err
	}
	out, err := s.runner.Run(ctx, repoPath, "diff", "--", filePath)
	if err == nil && len(strings.TrimSpace(out)) > 0 {
		return out, nil
	}
	// For untracked files, show diff against /dev/null
	out, _ = s.runner.Run(ctx, repoPath, "diff", "--no-index", "/dev/null", filePath)
	return out, nil
}

// GetRecentCommits returns the most recent commits on HEAD. If limit <= 0, defaults to 25.
func (s *BranchService) GetRecentCommits(ctx context.Context, repoPath string, limit int) ([]CommitSummary, error) {
	if limit <= 0 {
		limit = 25
	}
	out, err := s.runner.Run(ctx, repoPath, "log", fmt.Sprintf("-n%d", limit), "--pretty=format:%H%x00%h%x00%an%x00%ae%x00%cr%x00%s%x00%D%x00%P")
	if err != nil {
		return []CommitSummary{}, nil
	}

	commits := make([]CommitSummary, 0)
	lines := strings.Split(out, "\n")
	for _, line := range lines {
		parts := strings.Split(line, "\x00")
		if len(parts) >= 6 {
			refs := ""
			if len(parts) >= 7 {
				refs = parts[6]
			}
			var parents []string
			if len(parts) >= 8 && strings.TrimSpace(parts[7]) != "" {
				parents = strings.Fields(strings.TrimSpace(parts[7]))
			}
			commits = append(commits, CommitSummary{
				Hash:         parts[0],
				ShortHash:    parts[1],
				AuthorName:   parts[2],
				AuthorEmail:  parts[3],
				RelativeDate: parts[4],
				Subject:      parts[5],
				Refs:         refs,
				Parents:      parents,
			})
		}
	}
	return commits, nil
}

// Push pushes the current branch to origin.
func (s *BranchService) Push(ctx context.Context, repoPath string) error {
	out, err := s.runner.Run(ctx, repoPath, "push")
	if err != nil {
		// If upstream is not configured, get current branch and try setting upstream
		if strings.Contains(out, "--set-upstream") || strings.Contains(out, "no upstream branch") {
			branchOut, bErr := s.runner.Run(ctx, repoPath, "branch", "--show-current")
			branch := strings.TrimSpace(branchOut)
			if bErr == nil && branch != "" {
				_, pushErr := s.runner.Run(ctx, repoPath, "push", "-u", "origin", branch)
				return pushErr
			}
		}
		return fmt.Errorf("push failed: %s (%w)", strings.TrimSpace(out), err)
	}
	return nil
}

// GetCommitDetails returns comprehensive commit metadata and numstat files.
func (s *BranchService) GetCommitDetails(ctx context.Context, repoPath string, commitHash string) (*CommitDetail, error) {
	format := "HASH:%H%nSHORT:%h%nAUTHOR:%an%nEMAIL:%ae%nDATE:%ad%nRELDATE:%cr%nSUBJ:%s%nBODY:%b%nPARENTS:%p%n---END_META---"
	out, err := s.runner.Run(ctx, repoPath, "show", "--numstat", fmt.Sprintf("--pretty=format:%s", format), commitHash)
	if err != nil {
		return nil, fmt.Errorf("failed to get commit details: %w", err)
	}

	detail := &CommitDetail{
		Hash:      commitHash,
		ShortHash: commitHash,
		Parents:   []string{},
		Files:     []CommitFileChange{},
	}

	parts := strings.Split(out, "---END_META---")
	if len(parts) > 0 {
		metaLines := strings.Split(parts[0], "\n")
		isBody := false
		var bodyLines []string

		for _, line := range metaLines {
			if strings.HasPrefix(line, "HASH:") {
				detail.Hash = strings.TrimPrefix(line, "HASH:")
			} else if strings.HasPrefix(line, "SHORT:") {
				detail.ShortHash = strings.TrimPrefix(line, "SHORT:")
			} else if strings.HasPrefix(line, "AUTHOR:") {
				detail.AuthorName = strings.TrimPrefix(line, "AUTHOR:")
			} else if strings.HasPrefix(line, "EMAIL:") {
				detail.AuthorEmail = strings.TrimPrefix(line, "EMAIL:")
			} else if strings.HasPrefix(line, "DATE:") {
				detail.Date = strings.TrimPrefix(line, "DATE:")
			} else if strings.HasPrefix(line, "RELDATE:") {
				detail.RelativeDate = strings.TrimPrefix(line, "RELDATE:")
			} else if strings.HasPrefix(line, "SUBJ:") {
				detail.Subject = strings.TrimPrefix(line, "SUBJ:")
			} else if strings.HasPrefix(line, "PARENTS:") {
				p := strings.TrimSpace(strings.TrimPrefix(line, "PARENTS:"))
				if p != "" {
					detail.Parents = strings.Fields(p)
				}
			} else if strings.HasPrefix(line, "BODY:") {
				isBody = true
				firstBody := strings.TrimPrefix(line, "BODY:")
				if strings.TrimSpace(firstBody) != "" {
					bodyLines = append(bodyLines, firstBody)
				}
			} else if isBody {
				bodyLines = append(bodyLines, line)
			}
		}
		detail.Body = strings.TrimSpace(strings.Join(bodyLines, "\n"))
	}

	if len(parts) > 1 {
		numstatLines := strings.Split(parts[1], "\n")
		for _, line := range numstatLines {
			line = strings.TrimSpace(line)
			if line == "" {
				continue
			}
			cols := strings.Split(line, "\t")
			if len(cols) >= 3 {
				var adds, dels int
				fmt.Sscanf(cols[0], "%d", &adds)
				fmt.Sscanf(cols[1], "%d", &dels)
				filePath := cols[2]

				status := "modified"
				if dels == 0 && adds > 0 {
					status = "added"
				} else if adds == 0 && dels > 0 {
					status = "deleted"
				}

				detail.Files = append(detail.Files, CommitFileChange{
					Path:      filePath,
					Status:    status,
					Additions: adds,
					Deletions: dels,
				})
				detail.TotalAdditions += adds
				detail.TotalDeletions += dels
			}
		}
	}

	return detail, nil
}

// GetCommitFileDiff returns unified diff for a file in a specific commit, or entire commit diff if filePath is empty or "__ALL__".
func (s *BranchService) GetCommitFileDiff(ctx context.Context, repoPath string, commitHash string, filePath string) (string, error) {
	if filePath == "" || filePath == "__ALL__" {
		return s.runner.Run(ctx, repoPath, "show", commitHash)
	}
	out, err := s.runner.Run(ctx, repoPath, "show", commitHash, "--", filePath)
	return out, err
}




