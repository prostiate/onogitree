package git

import (
	"bytes"
	"context"
	"fmt"
	"os/exec"
	"strings"
	"sync"
	"time"
)

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
}

// NewCommandRunner initializes a new Git CommandRunner.
func NewCommandRunner(gitBinary string) *CommandRunner {
	if gitBinary == "" {
		gitBinary = "git"
	}
	return &CommandRunner{
		gitBinary: gitBinary,
		repoLocks: make(map[string]*sync.Mutex),
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
	outStr := strings.TrimSpace(stdout.String())
	errStr := strings.TrimSpace(stderr.String())

	if err != nil {
		if ctx.Err() == context.DeadlineExceeded {
			return "", fmt.Errorf("git command timed out: git %s", strings.Join(args, " "))
		}
		if errStr != "" {
			return outStr, fmt.Errorf("git %s failed: %s (%w)", strings.Join(args, " "), errStr, err)
		}
		return outStr, fmt.Errorf("git %s failed: %w", strings.Join(args, " "), err)
	}

	return outStr, nil
}
