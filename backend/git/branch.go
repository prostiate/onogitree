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

// GetFileDiff returns unified diff output for a specified file.
func (s *BranchService) GetFileDiff(ctx context.Context, repoPath string, filePath string, staged bool) (string, error) {
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

// GetRecentCommits returns the most recent commits on HEAD.
func (s *BranchService) GetRecentCommits(ctx context.Context, repoPath string, limit int) ([]CommitSummary, error) {
	if limit <= 0 {
		limit = 10
	}
	out, err := s.runner.Run(ctx, repoPath, "log", fmt.Sprintf("-n%d", limit), "--pretty=format:%H%x00%h%x00%an%x00%ae%x00%cr%x00%s%x00%D")
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
			commits = append(commits, CommitSummary{
				Hash:         parts[0],
				ShortHash:    parts[1],
				AuthorName:   parts[2],
				AuthorEmail:  parts[3],
				RelativeDate: parts[4],
				Subject:      parts[5],
				Refs:         refs,
			})
		}
	}
	return commits, nil
}

// Push pushes the current branch to origin.
func (s *BranchService) Push(ctx context.Context, repoPath string) error {
	_, err := s.runner.Run(ctx, repoPath, "push")
	return err
}


