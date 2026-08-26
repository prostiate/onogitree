package git

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"testing"
)

func createTestGitRepo(t *testing.T) string {
	tempDir, err := os.MkdirTemp("", "onogitree-branch-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}

	cmd := exec.Command("git", "init", "-b", "main")
	cmd.Dir = tempDir
	if err := cmd.Run(); err != nil {
		t.Fatalf("failed to git init: %v", err)
	}

	_ = exec.Command("git", "-C", tempDir, "config", "user.name", "Test User").Run()
	_ = exec.Command("git", "-C", tempDir, "config", "user.email", "test@example.com").Run()

	// Initial commit
	testFile := filepath.Join(tempDir, "README.md")
	_ = os.WriteFile(testFile, []byte("# Test Repo\n"), 0644)
	_ = exec.Command("git", "-C", tempDir, "add", ".").Run()
	_ = exec.Command("git", "-C", tempDir, "commit", "-m", "Initial commit").Run()

	return tempDir
}

func TestBranchService_Lifecycle(t *testing.T) {
	repoDir := createTestGitRepo(t)
	defer os.RemoveAll(repoDir)

	runner := NewCommandRunner("git")
	parser := NewPorcelainParser()
	svc := NewBranchService(runner, parser)
	ctx := context.Background()

	// 1. List branches
	branches, err := svc.ListBranches(ctx, repoDir)
	if err != nil {
		t.Fatalf("failed to list branches: %v", err)
	}
	if len(branches) == 0 {
		t.Fatal("expected at least 1 branch")
	}

	// 2. Create new branch
	if err := svc.CreateBranch(ctx, repoDir, "feature/test-branch", "main", true); err != nil {
		t.Fatalf("failed to create branch: %v", err)
	}

	// 3. Stage and commit new file
	newFile := filepath.Join(repoDir, "test.txt")
	_ = os.WriteFile(newFile, []byte("hello world"), 0644)

	if err := svc.StageFiles(ctx, repoDir, "test.txt"); err != nil {
		t.Fatalf("failed to stage file: %v", err)
	}

	if err := svc.Commit(ctx, repoDir, "feat: add test file", false); err != nil {
		t.Fatalf("failed to commit: %v", err)
	}

	// 4. Switch back to main
	if err := svc.Checkout(ctx, repoDir, "main"); err != nil {
		t.Fatalf("failed to checkout main: %v", err)
	}
}
