package main

import (
	"context"
	"fmt"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"onogitree/backend/batch"
	"onogitree/backend/db"
	"onogitree/backend/git"
	"onogitree/backend/system"
	"onogitree/backend/workspace"
)

// App struct manages the core application lifecycle and frontend bindings.
type App struct {
	ctx       context.Context
	runner    git.Runner
	parser    *git.PorcelainParser
	branchSvc *git.BranchService
	scanner   *workspace.Scanner
	store     *db.Store
	pool      *batch.Pool
	telemetry *system.TelemetryService
}

// NewApp creates a new App application struct.
func NewApp() *App {
	runner := git.NewCommandRunner("git")
	parser := git.NewPorcelainParser()
	branchSvc := git.NewBranchService(runner, parser)
	scanner := workspace.NewScanner()
	pool := batch.NewPool(runner, parser, 6)
	telemetry := system.TelemetryService{}

	store, err := db.NewStore("")
	if err != nil {
		fmt.Printf("Warning: failed to initialize SQLite store: %v\n", err)
	}

	return &App{
		runner:    runner,
		parser:    parser,
		branchSvc: branchSvc,
		scanner:   scanner,
		store:     store,
		pool:      pool,
		telemetry: &telemetry,
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// GetActiveWorkspace returns the active workspace with its configured repositories.
func (a *App) GetActiveWorkspace() (*db.WorkspaceRecord, error) {
	if a.store == nil {
		return &db.WorkspaceRecord{ID: "default", Name: "Default Workspace", IsActive: true}, nil
	}
	return a.store.GetActiveWorkspace()
}

// ScanWorkspaceDirectory searches a directory for nested Git repositories up to depth 3.
func (a *App) ScanWorkspaceDirectory(dirPath string, maxDepth int) ([]workspace.DiscoveredRepo, error) {
	return a.scanner.ScanForRepos(dirPath, maxDepth)
}

// AddRepositoryToWorkspace adds a repository to the current active workspace and returns its initial status.
func (a *App) AddRepositoryToWorkspace(repoPath string) (*git.RepoStatus, error) {
	cleanPath := filepath.Clean(repoPath)
	name := filepath.Base(cleanPath)

	if a.store != nil {
		ws, err := a.store.GetActiveWorkspace()
		if err == nil {
			record := db.RepositoryRecord{
				ID:        cleanPath,
				Path:      cleanPath,
				Name:      name,
				IsPinned:  false,
				AutoFetch: true,
			}
			_ = a.store.AddRepository(ws.ID, &record)
		}
	}

	return a.GetRepoStatus(cleanPath)
}

// RemoveRepository removes a repository from the active workspace.
func (a *App) RemoveRepository(repoID string) error {
	if a.store != nil {
		return a.store.RemoveRepository(repoID)
	}
	return nil
}

// TogglePinRepository pins or unpins a repository at the top of the tree.
func (a *App) TogglePinRepository(repoID string, isPinned bool) error {
	if a.store != nil {
		ws, err := a.store.GetActiveWorkspace()
		if err != nil {
			return err
		}
		repos, err := a.store.GetRepositories(ws.ID)
		if err != nil {
			return err
		}
		for _, r := range repos {
			if r.ID == repoID {
				r.IsPinned = isPinned
				return a.store.AddRepository(ws.ID, &r)
			}
		}
	}
	return nil
}

// ToggleAutoFetchRepository enables or disables automatic background fetch for a repo.
func (a *App) ToggleAutoFetchRepository(repoID string, enabled bool) error {
	if a.store != nil {
		ws, err := a.store.GetActiveWorkspace()
		if err != nil {
			return err
		}
		repos, err := a.store.GetRepositories(ws.ID)
		if err != nil {
			return err
		}
		for _, r := range repos {
			if r.ID == repoID {
				r.AutoFetch = enabled
				return a.store.AddRepository(ws.ID, &r)
			}
		}
	}
	return nil
}

// GetRepoStatus fetches the detailed Git status of a repository.
func (a *App) GetRepoStatus(repoPath string) (*git.RepoStatus, error) {
	out, err := a.runner.Run(a.ctx, repoPath, "status", "--porcelain=v2", "--branch")
	if err != nil {
		return nil, fmt.Errorf("failed to get status for %s: %w", repoPath, err)
	}

	status, err := a.parser.ParseStatus(repoPath, out)
	if err != nil {
		return nil, err
	}

	// Read last fetched relative time
	if lastFetchOut, err := a.runner.Run(a.ctx, repoPath, "log", "-1", "--format=%cr", "FETCH_HEAD"); err == nil && len(lastFetchOut) > 0 {
		status.LastFetchedAt = lastFetchOut
	} else {
		status.LastFetchedAt = "Never"
	}

	return status, nil
}

// RefreshAllRepositories scans and returns current statuses for all open repositories.
func (a *App) RefreshAllRepositories() ([]*git.RepoStatus, error) {
	ws, err := a.GetActiveWorkspace()
	if err != nil {
		return nil, err
	}

	statuses := make([]*git.RepoStatus, 0, len(ws.Repos))
	for _, r := range ws.Repos {
		if s, err := a.GetRepoStatus(r.Path); err == nil {
			s.IsPinned = r.IsPinned
			s.AutoFetchEnabled = r.AutoFetch
			statuses = append(statuses, s)
		}
	}
	return statuses, nil
}

// ListBranches returns all branches for a given repository.
func (a *App) ListBranches(repoPath string) ([]git.BranchInfo, error) {
	return a.branchSvc.ListBranches(a.ctx, repoPath)
}

// CheckoutBranch switches to the specified branch.
func (a *App) CheckoutBranch(repoPath string, branchName string) error {
	return a.branchSvc.Checkout(a.ctx, repoPath, branchName)
}

// CreateBranch creates a new branch.
func (a *App) CreateBranch(repoPath string, branchName string, startPoint string, checkout bool) error {
	return a.branchSvc.CreateBranch(a.ctx, repoPath, branchName, startPoint, checkout)
}

// StageFiles stages files in the working directory.
func (a *App) StageFiles(repoPath string, files []string) error {
	return a.branchSvc.StageFiles(a.ctx, repoPath, files...)
}

// UnstageFiles unstages files from the Git index.
func (a *App) UnstageFiles(repoPath string, files []string) error {
	return a.branchSvc.UnstageFiles(a.ctx, repoPath, files...)
}

// Commit creates a commit on the active branch.
func (a *App) Commit(repoPath string, message string, amend bool) error {
	return a.branchSvc.Commit(a.ctx, repoPath, message, amend)
}

// RunBatchPull triggers parallel pull across all open repositories emitting real-time events.
func (a *App) RunBatchPull(skipDirty bool) error {
	statuses, err := a.RefreshAllRepositories()
	if err != nil {
		return err
	}

	repoList := make([]git.RepoStatus, len(statuses))
	for i, s := range statuses {
		repoList[i] = *s
	}

	go a.pool.PullAll(context.Background(), repoList, skipDirty, func(event git.BatchProgressEvent) {
		runtime.EventsEmit(a.ctx, "batch:progress", event)
	})

	return nil
}

// RunBatchFetch triggers parallel fetch across all open repositories emitting real-time events.
func (a *App) RunBatchFetch() error {
	statuses, err := a.RefreshAllRepositories()
	if err != nil {
		return err
	}

	repoList := make([]git.RepoStatus, len(statuses))
	for i, s := range statuses {
		repoList[i] = *s
	}

	go a.pool.FetchAll(context.Background(), repoList, func(event git.BatchProgressEvent) {
		runtime.EventsEmit(a.ctx, "batch:progress", event)
	})

	return nil
}

// GetResourceStats returns live memory and goroutines performance metrics.
func (a *App) GetResourceStats() system.ResourceStats {
	return a.telemetry.GetStats()
}

// SelectDirectory opens native OS directory chooser dialog and returns the selected directory path.
func (a *App) SelectDirectory(title string) (string, error) {
	if title == "" {
		title = "Select Repository Directory"
	}
	return runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: title,
	})
}

// CheckCLIAuth checks if GitHub (gh) and GitLab (glab) CLIs are authenticated on the host.
func (a *App) CheckCLIAuth() map[string]bool {
	status := map[string]bool{
		"gh":   false,
		"glab": false,
	}

	if out, err := exec.Command("gh", "auth", "status").CombinedOutput(); err == nil || strings.Contains(string(out), "Logged in") {
		status["gh"] = true
	}
	if out, err := exec.Command("glab", "auth", "status").CombinedOutput(); err == nil || strings.Contains(string(out), "Logged in") {
		status["glab"] = true
	}

	return status
}

