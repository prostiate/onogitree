package system

import (
	"testing"
)

func TestTelemetryService_GetStats(t *testing.T) {
	svc := NewTelemetryService()
	stats := svc.GetStats()

	if stats.AllocRAMMB <= 0 {
		t.Errorf("expected positive allocated RAM in MB, got: %f", stats.AllocRAMMB)
	}
	if stats.NumGoroutine <= 0 {
		t.Errorf("expected positive goroutine count, got: %d", stats.NumGoroutine)
	}
	if stats.NumCPU <= 0 {
		t.Errorf("expected positive CPU count, got: %d", stats.NumCPU)
	}
	if stats.Timestamp <= 0 {
		t.Errorf("expected positive timestamp, got: %d", stats.Timestamp)
	}
}
