package batch

import (
	"context"
	"sync"
	"testing"
	"time"

	"onogitree/backend/git"
)

type mockRunner struct {
	mu           sync.Mutex
	activeCount  int
	maxActive    int
	delay        time.Duration
}

func (m *mockRunner) Run(ctx context.Context, repoPath string, args ...string) (string, error) {
	return "# branch.head main\n# branch.ab +0 -0\n", nil
}

func (m *mockRunner) RunBatch(ctx context.Context, repoPath string, args ...string) (string, error) {
	m.mu.Lock()
	m.activeCount++
	if m.activeCount > m.maxActive {
		m.maxActive = m.activeCount
	}
	m.mu.Unlock()

	time.Sleep(m.delay)

	m.mu.Lock()
	m.activeCount--
	m.mu.Unlock()

	return "Already up to date.", nil
}

func TestPool_ConcurrencyThrottling(t *testing.T) {
	mock := &mockRunner{delay: 20 * time.Millisecond}
	parser := git.NewPorcelainParser()
	pool := NewPool(mock, parser, 3) // max 3 concurrent workers

	repos := make([]git.RepoStatus, 10)
	for i := 0; i < 10; i++ {
		repos[i] = git.RepoStatus{
			ID:   string(rune('A' + i)),
			Name: string(rune('A' + i)),
			Path: "/fake/path",
		}
	}

	var eventsMu sync.Mutex
	events := make([]git.BatchProgressEvent, 0)

	pool.FetchAll(context.Background(), repos, func(e git.BatchProgressEvent) {
		eventsMu.Lock()
		events = append(events, e)
		eventsMu.Unlock()
	})


	if mock.maxActive > 3 {
		t.Errorf("expected max active workers <= 3, got: %d", mock.maxActive)
	}

	if len(events) == 0 {
		t.Error("expected progress events to be emitted")
	}
}
