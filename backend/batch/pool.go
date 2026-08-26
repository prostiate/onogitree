package batch

import (
	"context"
	"fmt"
	"strings"
	"sync"

	"onogitree/backend/git"
)

// ProgressCallback is invoked on real-time batch task updates.
type ProgressCallback func(event git.BatchProgressEvent)

// Pool executes Git batch operations concurrently with bounded concurrency.
type Pool struct {
	runner     git.Runner
	parser     *git.PorcelainParser
	maxWorkers int
}

// NewPool initializes a new BatchWorkerPool.
func NewPool(runner git.Runner, parser *git.PorcelainParser, maxWorkers int) *Pool {
	if maxWorkers <= 0 {
		maxWorkers = 6
	}
	return &Pool{
		runner:     runner,
		parser:     parser,
		maxWorkers: maxWorkers,
	}
}

// PullAll pulls multiple repositories in parallel with dirty repo protection.
func (p *Pool) PullAll(ctx context.Context, repos []git.RepoStatus, skipDirty bool, onProgress ProgressCallback) {
	p.runParallel(ctx, repos, func(ctx context.Context, repo git.RepoStatus) git.BatchProgressEvent {
		event := git.BatchProgressEvent{
			RepoID:   repo.ID,
			RepoPath: repo.Path,
			RepoName: repo.Name,
			Action:   "pull",
			Status:   "running",
			Message:  "Pulling changes...",
		}
		if onProgress != nil {
			onProgress(event)
		}

		// Safeguard: Check if repo is dirty
		if repo.IsDirty && skipDirty {
			event.Status = "skipped"
			event.Message = "Skipped (uncommitted changes present)"
			return event
		}

		// Run git pull batch
		out, err := p.runner.RunBatch(ctx, repo.Path, "pull")
		if err != nil {
			errStr := err.Error()
			if strings.Contains(errStr, "CONFLICT") || strings.Contains(out, "CONFLICT") {
				event.Status = "conflict"
				event.Message = "Merge conflict detected"
			} else if strings.Contains(errStr, "Permission denied") || strings.Contains(errStr, "Authentication failed") {
				event.Status = "auth_required"
				event.Message = "Authentication required"
			} else {
				event.Status = "error"
				event.Message = errStr
			}
			return event
		}

		// Refresh status
		if statusOut, sErr := p.runner.Run(ctx, repo.Path, "status", "--porcelain=v2", "--branch"); sErr == nil {
			if updatedStatus, pErr := p.parser.ParseStatus(repo.Path, statusOut); pErr == nil {
				event.AheadCount = updatedStatus.AheadCount
				event.BehindCount = updatedStatus.BehindCount
			}
		}

		event.Status = "success"
		event.Message = "Pull completed successfully"
		return event
	}, onProgress)
}

// FetchAll fetches all remotes for multiple repositories in parallel.
func (p *Pool) FetchAll(ctx context.Context, repos []git.RepoStatus, onProgress ProgressCallback) {
	p.runParallel(ctx, repos, func(ctx context.Context, repo git.RepoStatus) git.BatchProgressEvent {
		event := git.BatchProgressEvent{
			RepoID:   repo.ID,
			RepoPath: repo.Path,
			RepoName: repo.Name,
			Action:   "fetch",
			Status:   "running",
			Message:  "Fetching remotes...",
		}
		if onProgress != nil {
			onProgress(event)
		}

		out, err := p.runner.RunBatch(ctx, repo.Path, "fetch", "--all", "--prune")
		if err != nil {
			errStr := err.Error()
			if strings.Contains(errStr, "Permission denied") || strings.Contains(errStr, "Authentication failed") {
				event.Status = "auth_required"
				event.Message = "Authentication required"
			} else {
				event.Status = "error"
				event.Message = errStr
			}
			return event
		}
		_ = out

		// Refresh status
		if statusOut, sErr := p.runner.Run(ctx, repo.Path, "status", "--porcelain=v2", "--branch"); sErr == nil {
			if updatedStatus, pErr := p.parser.ParseStatus(repo.Path, statusOut); pErr == nil {
				event.AheadCount = updatedStatus.AheadCount
				event.BehindCount = updatedStatus.BehindCount
			}
		}

		event.Status = "success"
		event.Message = "Fetch completed"
		return event
	}, onProgress)
}

func (p *Pool) runParallel(ctx context.Context, repos []git.RepoStatus, task func(ctx context.Context, repo git.RepoStatus) git.BatchProgressEvent, onProgress ProgressCallback) {
	jobs := make(chan git.RepoStatus, len(repos))
	for _, repo := range repos {
		jobs <- repo
	}
	close(jobs)

	numWorkers := p.maxWorkers
	if len(repos) < numWorkers {
		numWorkers = len(repos)
	}
	if numWorkers == 0 {
		return
	}

	var wg sync.WaitGroup
	for i := 0; i < numWorkers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			defer func() {
				if r := recover(); r != nil {
					// Isolate worker crash
					fmt.Printf("Worker recovered from panic: %v\n", r)
				}
			}()

			for repo := range jobs {
				select {
				case <-ctx.Done():
					if onProgress != nil {
						onProgress(git.BatchProgressEvent{
							RepoID:   repo.ID,
							RepoPath: repo.Path,
							RepoName: repo.Name,
							Status:   "error",
							Message:  "Operation cancelled",
						})
					}
					return
				default:
					event := task(ctx, repo)
					if onProgress != nil {
						onProgress(event)
					}
				}
			}
		}()
	}

	wg.Wait()
}
