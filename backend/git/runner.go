package git

import (
	"bytes"
	"context"
	"fmt"
	"os/exec"
	"strings"
	"sync"
	"time"

	"onogitree/backend/system"
)

// GitCommandLog records executed Git CLI command metadata and outputs for developer debugging.
type GitCommandLog struct {
	ID         string `json:"id"`
	Timestamp  string `json:"timestamp"`
	RepoPath   string `json:"repoPath"`
	Command    string `json:"command"`
	DurationMs int64  `json:"durationMs"`
	Success    bool   `json:"success"`
	Stdout     string `json:"stdout"`
	Stderr     string `json:"stderr"`
	Error      string `json:"error,omitempty"`
}

// Runner defines the interface for executing Git commands.
type Runner interface {
	Run(ctx context.Context, repoPath string, args ...string) (string, error)
	RunBatch(ctx context.Context, repoPath string, args ...string) (string, error)
}

// CommandRunner executes system Git CLI commands with mutex protection and timeout management.
type CommandRunner struct {
	gitBinary string
	locksMu   sync.Mutex
	repoLocks map[string]*sync.Mutex

	logsMu sync.RWMutex
	logs   []GitCommandLog
}

const maxCommandLogs = 150

// NewCommandRunner initializes a new Git CommandRunner.
func NewCommandRunner(gitBinary string) *CommandRunner {
	if gitBinary == "" {
		gitBinary = "git"
	}
	return &CommandRunner{
		gitBinary: gitBinary,
		repoLocks: make(map[string]*sync.Mutex),
		logs:      make([]GitCommandLog, 0, maxCommandLogs),
	}
}

func (r *CommandRunner) getRepoLock(repoPath string) *sync.Mutex {
	r.locksMu.Lock()
	defer r.locksMu.Unlock()

	lock, exists := r.repoLocks[repoPath]
	if !exists {
		lock = &sync.Mutex{}
		r.repoLocks[repoPath] = lock
	}
	return lock
}

// Run executes a standard Git command on a repository.
func (r *CommandRunner) Run(ctx context.Context, repoPath string, args ...string) (string, error) {
	return r.execute(ctx, repoPath, false, args...)
}

// RunBatch executes a Git command with non-interactive batch environment variables.
func (r *CommandRunner) RunBatch(ctx context.Context, repoPath string, args ...string) (string, error) {
	return r.execute(ctx, repoPath, true, args...)
}

func (r *CommandRunner) execute(ctx context.Context, repoPath string, isBatch bool, args ...string) (string, error) {
	startTime := time.Now()
	cmdStr := fmt.Sprintf("git %s", strings.Join(args, " "))

	lock := r.getRepoLock(repoPath)
	lock.Lock()
	defer lock.Unlock()

	// Default 30s timeout if context has no deadline
	var cancel context.CancelFunc
	if _, hasDeadline := ctx.Deadline(); !hasDeadline {
		ctx, cancel = context.WithTimeout(ctx, 30*time.Second)
		defer cancel()
	}

	cmd := exec.CommandContext(ctx, r.gitBinary, args...)
	if repoPath != "" {
		cmd.Dir = repoPath
	}

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	// Environment setup
	env := cmd.Environ()
	if isBatch {
		env = append(env,
			"GIT_TERMINAL_PROMPT=0",
			"GIT_SSH_COMMAND=ssh -o BatchMode=yes",
		)
	}
	cmd.Env = env

	err := cmd.Run()
	duration := time.Since(startTime).Milliseconds()
	outStr := strings.TrimSpace(stdout.String())
	errStr := strings.TrimSpace(stderr.String())

	var finalErr error
	if err != nil {
		if ctx.Err() == context.DeadlineExceeded {
			finalErr = fmt.Errorf("git command timed out: %s", cmdStr)
		} else if errStr != "" {
			finalErr = fmt.Errorf("%s failed: %s (%w)", cmdStr, errStr, err)
		} else {
			finalErr = fmt.Errorf("%s failed: %w", cmdStr, err)
		}
	}

	// Record execution log in in-memory ring buffer
	r.recordLog(GitCommandLog{
		ID:         fmt.Sprintf("log-%d", time.Now().UnixNano()),
		Timestamp:  startTime.Format(time.RFC3339),
		RepoPath:   repoPath,
		Command:    cmdStr,
		DurationMs: duration,
		Success:    finalErr == nil,
		Stdout:     outStr,
		Stderr:     errStr,
		Error: func() string {
			if finalErr != nil {
				return finalErr.Error()
			}
			return ""
		}(),
	})

	if finalErr != nil {
		return outStr, finalErr
	}

	return outStr, nil
}

func (r *CommandRunner) recordLog(entry GitCommandLog) {
	// 1. Write to persistent disk log file
	fileLogger := system.GetDefaultLogger()
	if entry.Success {
		fileLogger.Log("INFO", entry.RepoPath, fmt.Sprintf("%s (%dms)", entry.Command, entry.DurationMs))
	} else {
		fileLogger.Log("ERROR", entry.RepoPath, fmt.Sprintf("%s (%dms) -> %s", entry.Command, entry.DurationMs, entry.Error))
	}

	// 2. In-memory ring buffer for UI console
	r.logsMu.Lock()
	defer r.logsMu.Unlock()

	// Prepend newest log first
	r.logs = append([]GitCommandLog{entry}, r.logs...)
	if len(r.logs) > maxCommandLogs {
		r.logs = r.logs[:maxCommandLogs]
	}
}

// GetLogs returns the most recent Git command logs.
func (r *CommandRunner) GetLogs(limit int) []GitCommandLog {
	r.logsMu.RLock()
	defer r.logsMu.RUnlock()

	if limit <= 0 || limit > len(r.logs) {
		limit = len(r.logs)
	}
	result := make([]GitCommandLog, limit)
	copy(result, r.logs[:limit])
	return result
}

// ClearLogs clears all command history.
func (r *CommandRunner) ClearLogs() {
	r.logsMu.Lock()
	defer r.logsMu.Unlock()
	r.logs = make([]GitCommandLog, 0, maxCommandLogs)
}
