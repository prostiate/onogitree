package db

import (
	"os"
	"path/filepath"
	"testing"
)

func TestStore_CRUD(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "onogitree-db-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	dbPath := filepath.Join(tempDir, "test.db")
	store, err := NewStore(dbPath)
	if err != nil {
		t.Fatalf("failed to init store: %v", err)
	}
	defer store.Close()

	// Active workspace test
	ws, err := store.GetActiveWorkspace()
	if err != nil {
		t.Fatalf("failed to get active workspace: %v", err)
	}
	if ws.ID != "default" {
		t.Errorf("expected default workspace id, got: %s", ws.ID)
	}

	// Add repository
	repo := RepositoryRecord{
		ID:        "/path/to/repo1",
		Path:      "/path/to/repo1",
		Name:      "repo1",
		IsPinned:  true,
		SortOrder: 0,
		AutoFetch: true,
	}
	if err := store.AddRepository(ws.ID, &repo); err != nil {
		t.Fatalf("failed to add repo: %v", err)
	}

	// Verify repo
	repos, err := store.GetRepositories(ws.ID)
	if err != nil {
		t.Fatalf("failed to list repos: %v", err)
	}
	if len(repos) != 1 || repos[0].Name != "repo1" || !repos[0].IsPinned {
		t.Fatalf("expected 1 pinned repo 'repo1', got: %v", repos)
	}

	// Setting test
	_ = store.SetSetting("auto_fetch_interval", "10m")
	val := store.GetSetting("auto_fetch_interval", "5m")
	if val != "10m" {
		t.Errorf("expected setting '10m', got: '%s'", val)
	}
}
