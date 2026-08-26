package system

import (
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"
)

// FileLogger manages persistent file-based logging for OnoGitTree.
type FileLogger struct {
	mu      sync.Mutex
	logPath string
}

var (
	defaultLogger *FileLogger
	once          sync.Once
)

// GetDefaultLogger initializes or returns the singleton FileLogger.
func GetDefaultLogger() *FileLogger {
	once.Do(func() {
		homeDir, err := os.UserHomeDir()
		if err != nil {
			homeDir = "."
		}
		logDir := filepath.Join(homeDir, ".config", "onogitree", "logs")
		_ = os.MkdirAll(logDir, 0755)
		logPath := filepath.Join(logDir, "onogitree.log")
		defaultLogger = &FileLogger{logPath: logPath}
	})
	return defaultLogger
}

// Log writes a structured log line to the onogitree.log file.
func (l *FileLogger) Log(level string, repoPath string, msg string) {
	l.mu.Lock()
	defer l.mu.Unlock()

	f, err := os.OpenFile(l.logPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return
	}
	defer f.Close()

	timestamp := time.Now().Format("2006-01-02 15:04:05")
	repoTag := ""
	if repoPath != "" {
		repoTag = fmt.Sprintf(" [%s]", filepath.Base(repoPath))
	}
	logLine := fmt.Sprintf("[%s] [%s]%s %s\n", timestamp, level, repoTag, msg)
	_, _ = f.WriteString(logLine)
}

// GetLogPath returns the absolute path to the onogitree.log file.
func (l *FileLogger) GetLogPath() string {
	return l.logPath
}

// GetLogDir returns the directory containing the log file.
func (l *FileLogger) GetLogDir() string {
	return filepath.Dir(l.logPath)
}

// GetLogSize returns the current size of the log file in bytes.
func (l *FileLogger) GetLogSize() int64 {
	info, err := os.Stat(l.logPath)
	if err != nil {
		return 0
	}
	return info.Size()
}

// Clear truncates the onogitree.log file.
func (l *FileLogger) Clear() error {
	l.mu.Lock()
	defer l.mu.Unlock()
	return os.Truncate(l.logPath, 0)
}
