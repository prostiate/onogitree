package workspace

import (
	"os"
	"path/filepath"
	"testing"
)

func TestScanner_ScanForRepos(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "onogitree-scan-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Create fake repos: repo1, folderA/repo2, and a non-repo folder
	repo1 := filepath.Join(tempDir, "repo1")
	_ = os.MkdirAll(filepath.Join(repo1, ".git"), 0755)

	repo2 := filepath.Join(tempDir, "nested", "repo2")
	_ = os.MkdirAll(filepath.Join(repo2, ".git"), 0755)

	nonRepo := filepath.Join(tempDir, "regular_folder")
	_ = os.MkdirAll(nonRepo, 0755)

	scanner := NewScanner()
	repos, err := scanner.ScanForRepos(tempDir, 3)
	if err != nil {
		t.Fatalf("unexpected error scanning repos: %v", err)
	}

	if len(repos) != 2 {
		t.Fatalf("expected 2 discovered repos, got %d: %v", len(repos), repos)
	}
}
