package db

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

// RepositoryRecord represents a persistent repository row.
type RepositoryRecord struct {
	ID        string `json:"id"`
	Path      string `json:"path"`
	Name      string `json:"name"`
	IsPinned  bool   `json:"isPinned"`
	SortOrder int    `json:"sortOrder"`
	AutoFetch bool   `json:"autoFetch"`
}

// WorkspaceRecord represents a workspace preset row.
type WorkspaceRecord struct {
	ID        string             `json:"id"`
	Name      string             `json:"name"`
	IsActive  bool               `json:"isActive"`
	Repos     []RepositoryRecord `json:"repos,omitempty"`
}

// Store provides SQLite persistence for workspaces and settings.
type Store struct {
	db *sql.DB
}

// NewStore initializes an embedded SQLite database at dbPath.
func NewStore(dbPath string) (*Store, error) {
	if dbPath == "" {
		homeDir, err := os.UserHomeDir()
		if err != nil {
			return nil, fmt.Errorf("failed to get user home dir: %w", err)
		}
		configDir := filepath.Join(homeDir, ".config", "onogitree")
		if err := os.MkdirAll(configDir, 0755); err != nil {
			return nil, fmt.Errorf("failed to create config dir: %w", err)
		}
		dbPath = filepath.Join(configDir, "onogitree.db")
	}

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open sqlite db: %w", err)
	}

	// Set connection limits
	db.SetMaxOpenConns(1)

	store := &Store{db: db}
	if err := store.migrate(); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("failed to run sqlite migrations: %w", err)
	}

	return store, nil
}

// Close closes the database connection.
func (s *Store) Close() error {
	return s.db.Close()
}

func (s *Store) migrate() error {
	query := `
	CREATE TABLE IF NOT EXISTS workspaces (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		is_active INTEGER NOT NULL DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS repositories (
		id TEXT PRIMARY KEY,
		workspace_id TEXT NOT NULL,
		path TEXT NOT NULL,
		name TEXT NOT NULL,
		is_pinned INTEGER NOT NULL DEFAULT 0,
		sort_order INTEGER NOT NULL DEFAULT 0,
		auto_fetch INTEGER NOT NULL DEFAULT 1,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS settings (
		key TEXT PRIMARY KEY,
		value TEXT NOT NULL
	);
	`
	_, err := s.db.Exec(query)
	return err
}

// GetActiveWorkspace retrieves the active workspace with its repositories.
func (s *Store) GetActiveWorkspace() (*WorkspaceRecord, error) {
	var ws WorkspaceRecord
	var isActive int
	err := s.db.QueryRow("SELECT id, name, is_active FROM workspaces WHERE is_active = 1 LIMIT 1").
		Scan(&ws.ID, &ws.Name, &isActive)

	if err == sql.ErrNoRows {
		// Initialize default workspace
		defaultWs := WorkspaceRecord{
			ID:       "default",
			Name:     "Default Workspace",
			IsActive: true,
			Repos:    make([]RepositoryRecord, 0),
		}
		if err := s.SaveWorkspace(&defaultWs); err != nil {
			return nil, err
		}
		return &defaultWs, nil
	} else if err != nil {
		return nil, fmt.Errorf("failed to get active workspace: %w", err)
	}
	ws.IsActive = isActive == 1

	// Load repos
	repos, err := s.GetRepositories(ws.ID)
	if err != nil {
		return nil, err
	}
	ws.Repos = repos
	return &ws, nil
}

// GetRepositories returns all repositories for a given workspace.
func (s *Store) GetRepositories(workspaceID string) ([]RepositoryRecord, error) {
	rows, err := s.db.Query("SELECT id, path, name, is_pinned, sort_order, auto_fetch FROM repositories WHERE workspace_id = ? ORDER BY is_pinned DESC, sort_order ASC, name ASC", workspaceID)
	if err != nil {
		return nil, fmt.Errorf("failed to query repositories: %w", err)
	}
	defer rows.Close()

	repos := make([]RepositoryRecord, 0)
	for rows.Next() {
		var r RepositoryRecord
		var isPinned, autoFetch int
		if err := rows.Scan(&r.ID, &r.Path, &r.Name, &isPinned, &r.SortOrder, &autoFetch); err != nil {
			return nil, err
		}
		r.IsPinned = isPinned == 1
		r.AutoFetch = autoFetch == 1
		repos = append(repos, r)
	}
	return repos, nil
}

// SaveWorkspace inserts or updates a workspace record.
func (s *Store) SaveWorkspace(ws *WorkspaceRecord) error {
	isActiveInt := 0
	if ws.IsActive {
		isActiveInt = 1
		// Deactivate others
		_, _ = s.db.Exec("UPDATE workspaces SET is_active = 0")
	}

	_, err := s.db.Exec("INSERT INTO workspaces (id, name, is_active) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, is_active=excluded.is_active",
		ws.ID, ws.Name, isActiveInt)
	return err
}

// AddRepository adds or updates a repository in a workspace.
func (s *Store) AddRepository(workspaceID string, repo *RepositoryRecord) error {
	isPinnedInt := 0
	if repo.IsPinned {
		isPinnedInt = 1
	}
	autoFetchInt := 1
	if !repo.AutoFetch {
		autoFetchInt = 0
	}

	_, err := s.db.Exec("INSERT INTO repositories (id, workspace_id, path, name, is_pinned, sort_order, auto_fetch) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET path=excluded.path, name=excluded.name, is_pinned=excluded.is_pinned, auto_fetch=excluded.auto_fetch",
		repo.ID, workspaceID, repo.Path, repo.Name, isPinnedInt, repo.SortOrder, autoFetchInt)
	return err
}

// RemoveRepository removes a repository from the database.
func (s *Store) RemoveRepository(repoID string) error {
	_, err := s.db.Exec("DELETE FROM repositories WHERE id = ?", repoID)
	return err
}

// GetSetting retrieves a configuration value by key.
func (s *Store) GetSetting(key string, defaultValue string) string {
	var val string
	err := s.db.QueryRow("SELECT value FROM settings WHERE key = ?", key).Scan(&val)
	if err != nil {
		return defaultValue
	}
	return val
}

// SetSetting stores a configuration key-value pair.
func (s *Store) SetSetting(key, value string) error {
	_, err := s.db.Exec("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", key, value)
	return err
}
