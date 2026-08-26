package git

import (
	"context"
	"testing"
	"time"
)

func TestCommandRunner_Version(t *testing.T) {
	runner := NewCommandRunner("git")
	ctx := context.Background()

	out, err := runner.Run(ctx, "", "--version")
	if err != nil {
		t.Fatalf("expected git version to succeed, got: %v", err)
	}
	if len(out) == 0 {
		t.Fatal("expected non-empty git version output")
	}
}

func TestCommandRunner_Timeout(t *testing.T) {
	runner := NewCommandRunner("git")
	// Very short timeout
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Millisecond)
	defer cancel()

	time.Sleep(2 * time.Millisecond)
	_, err := runner.Run(ctx, "", "version")
	if err == nil {
		t.Fatal("expected timeout error, got nil")
	}
}
