package workspace

import (
	"os"
	"path/filepath"
	"strings"
)

// DiscoveredRepo represents a Git repository found on the filesystem.
type DiscoveredRepo struct {
	Name string `json:"name"`
	Path string `json:"path"`
}

// Scanner scans directories for Git repositories up to a specified depth.
type Scanner struct{}

// NewScanner initializes a new Workspace Scanner.
func NewScanner() *Scanner {
	return &Scanner{}
}

// ScanForRepos searches rootPath for Git repositories up to maxDepth (default: 3).
func (s *Scanner) ScanForRepos(rootPath string, maxDepth int) ([]DiscoveredRepo, error) {
	if maxDepth <= 0 {
		maxDepth = 3
	}

	repos := make([]DiscoveredRepo, 0)
	cleanRoot := filepath.Clean(rootPath)

	// Check if rootPath itself is a Git repository
	if isGitRepo(cleanRoot) {
		repos = append(repos, DiscoveredRepo{
			Name: filepath.Base(cleanRoot),
			Path: cleanRoot,
		})
		return repos, nil
	}

	err := s.walk(cleanRoot, 1, maxDepth, &repos)
	return repos, err
}

func (s *Scanner) walk(dir string, currentDepth, maxDepth int, repos *[]DiscoveredRepo) error {
	if currentDepth > maxDepth {
		return nil
	}

	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil // Skip directories we cannot read
	}

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		name := entry.Name()
		// Skip noisy / heavy directories
		if strings.HasPrefix(name, ".") ||
			name == "node_modules" ||
			name == "vendor" ||
			name == "dist" ||
			name == "target" ||
			name == "build" ||
			name == "cache" {
			continue
		}

		subPath := filepath.Join(dir, name)
		if isGitRepo(subPath) {
			*repos = append(*repos, DiscoveredRepo{
				Name: name,
				Path: subPath,
			})
			// Do not recurse into nested submodules in Phase 1
			continue
		}

		// Recurse into subdirectories
		_ = s.walk(subPath, currentDepth+1, maxDepth, repos)
	}

	return nil
}

func isGitRepo(dir string) bool {
	gitDir := filepath.Join(dir, ".git")
	info, err := os.Stat(gitDir)
	if err != nil {
		return false
	}
	return info.IsDir() || !info.IsDir() // Works for regular repos and worktrees (.git file)
}
