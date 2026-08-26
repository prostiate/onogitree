package system

import (
	"runtime"
	"time"
)

// ResourceStats represents live memory and concurrency telemetry.
type ResourceStats struct {
	AllocRAMMB    float64 `json:"allocRamMb"`
	TotalAllocMB  float64 `json:"totalAllocMb"`
	SysRAMMB      float64 `json:"sysRamMb"`
	NumGoroutine  int     `json:"numGoroutine"`
	NumCPU        int     `json:"numCpu"`
	Timestamp     int64   `json:"timestamp"`
}

// TelemetryService provides lightweight runtime performance metrics.
type TelemetryService struct{}

// NewTelemetryService initializes a new TelemetryService.
func NewTelemetryService() *TelemetryService {
	return &TelemetryService{}
}

// GetStats returns current memory allocation and active goroutines.
func (s *TelemetryService) GetStats() ResourceStats {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	return ResourceStats{
		AllocRAMMB:   float64(m.Alloc) / 1024 / 1024,
		TotalAllocMB: float64(m.TotalAlloc) / 1024 / 1024,
		SysRAMMB:     float64(m.Sys) / 1024 / 1024,
		NumGoroutine: runtime.NumGoroutine(),
		NumCPU:       runtime.NumCPU(),
		Timestamp:    time.Now().Unix(),
	}
}
