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

