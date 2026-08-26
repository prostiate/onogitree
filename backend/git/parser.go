package git

import (
	"bufio"
	"fmt"
	"path/filepath"
	"strconv"
	"strings"
)

// PorcelainParser parses git status --porcelain=v2 output.
type PorcelainParser struct{}

// NewPorcelainParser initializes a new PorcelainParser.
func NewPorcelainParser() *PorcelainParser {
	return &PorcelainParser{}
}

// ParseStatus parses raw output from `git status --porcelain=v2 --branch`.
func (p *PorcelainParser) ParseStatus(repoPath string, rawOutput string) (*RepoStatus, error) {
	status := &RepoStatus{
		ID:                repoPath,
		Name:              filepath.Base(repoPath),
		Path:              repoPath,
		CurrentBranch:     "HEAD",
		Files:             make([]FileStatus, 0),
		AutoFetchEnabled:  true,
	}

	scanner := bufio.NewScanner(strings.NewReader(rawOutput))
	for scanner.Scan() {
		line := scanner.Text()
		if len(line) == 0 {
			continue
		}

		if strings.HasPrefix(line, "# ") {
			p.parseHeader(line[2:], status)
			continue
		}

		// Parse file lines
		switch line[0] {
		case '1': // Ordinary changed entry
			file := p.parseOrdinaryEntry(line)
			status.Files = append(status.Files, file)
		case '2': // Renamed/copied entry
			file := p.parseRenamedEntry(line)
			status.Files = append(status.Files, file)
		case 'u': // Unmerged / Conflicted entry
			file := p.parseUnmergedEntry(line)
			status.Files = append(status.Files, file)
			status.HasConflicts = true
		case '?': // Untracked file
			path := strings.TrimSpace(line[1:])
			status.Files = append(status.Files, FileStatus{
				Path:   path,
				Status: "untracked",
				Staged: false,
			})
		}
	}

	status.ChangedFilesCount = len(status.Files)
	status.IsDirty = status.ChangedFilesCount > 0

	return status, nil
}

func (p *PorcelainParser) parseHeader(header string, status *RepoStatus) {
	parts := strings.SplitN(header, " ", 2)
	if len(parts) < 2 {
		return
	}
	key := parts[0]
	val := parts[1]

	switch key {
	case "branch.head":
		status.CurrentBranch = val
	case "branch.upstream":
		status.UpstreamBranch = val
	case "branch.ab":
		// Format: "+<ahead> -<behind>"
		abParts := strings.Split(val, " ")
		for _, ab := range abParts {
			if strings.HasPrefix(ab, "+") {
				if n, err := strconv.Atoi(ab[1:]); err == nil {
					status.AheadCount = n
				}
			} else if strings.HasPrefix(ab, "-") {
				if n, err := strconv.Atoi(ab[1:]); err == nil {
					status.BehindCount = n
				}
			}
		}
	}
}

func (p *PorcelainParser) parseOrdinaryEntry(line string) FileStatus {
	// Format: 1 <XY> <sub> <mH> <mI> <mW> <hH> <hI> <path>
	fields := strings.SplitN(line, " ", 9)
	if len(fields) < 9 {
		return FileStatus{Path: line, Status: "modified"}
	}
	xy := fields[1]
	path := fields[8]

	staged := false
	stagedChar := xy[0]
	unstagedChar := xy[1]

	statusStr := "modified"
	if stagedChar != '.' && unstagedChar == '.' {
		staged = true
		if stagedChar == 'A' {
			statusStr = "staged"
		} else if stagedChar == 'D' {
			statusStr = "deleted"
		}
	} else if unstagedChar == 'D' {
		statusStr = "deleted"
	}

	return FileStatus{
		Path:   path,
		Status: statusStr,
		Staged: staged,
	}
}

func (p *PorcelainParser) parseRenamedEntry(line string) FileStatus {
	// Format: 2 <XY> <sub> <mH> <mI> <mW> <hH> <hI> <Xscore> <path>\t<origPath>
	fields := strings.SplitN(line, " ", 10)
	if len(fields) < 10 {
		return FileStatus{Path: line, Status: "renamed"}
	}
	pathParts := strings.Split(fields[9], "\t")
	path := pathParts[0]
	oldPath := ""
	if len(pathParts) > 1 {
		oldPath = pathParts[1]
	}

	return FileStatus{
		Path:    path,
		OldPath: oldPath,
		Status:  "renamed",
		Staged:  fields[1][0] != '.',
	}
}

func (p *PorcelainParser) parseUnmergedEntry(line string) FileStatus {
	// Format: u <XY> <sub> <m1> <m2> <m3> <mW> <h1> <h2> <h3> <path>
	fields := strings.SplitN(line, " ", 11)
	path := line
	if len(fields) >= 11 {
		path = fields[10]
	}

	return FileStatus{
		Path:   path,
		Status: "conflicted",
		Staged: false,
	}
}

// ParseBranches parses `git branch -a -vv` output.
func (p *PorcelainParser) ParseBranches(rawOutput string) ([]BranchInfo, error) {
	branches := make([]BranchInfo, 0)
	scanner := bufio.NewScanner(strings.NewReader(rawOutput))

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if len(line) == 0 {
			continue
		}

		isCurrent := strings.HasPrefix(line, "* ")
		if isCurrent {
			line = strings.TrimSpace(line[2:])
		}

		parts := strings.Fields(line)
		if len(parts) == 0 {
			continue
		}

		name := parts[0]
		isRemote := strings.HasPrefix(name, "remotes/")
		if isRemote {
			name = strings.TrimPrefix(name, "remotes/")
		}

		branch := BranchInfo{
			Name:      name,
			IsCurrent: isCurrent,
			IsRemote:  isRemote,
		}

		if isRemote {
			remoteParts := strings.SplitN(name, "/", 2)
			if len(remoteParts) == 2 {
				branch.RemoteName = remoteParts[0]
			}
		}

		// Extract ahead/behind if present in brackets [origin/main: ahead 1, behind 2]
		if idx := strings.Index(line, "["); idx != -1 {
			if endIdx := strings.Index(line[idx:], "]"); endIdx != -1 {
				bracketContent := line[idx+1 : idx+endIdx]
				p.parseBranchTracking(bracketContent, &branch)
			}
		}

		branches = append(branches, branch)
	}

	return branches, nil
}

func (p *BranchInfo) String() string {
	return fmt.Sprintf("Branch(%s, current=%v, remote=%v)", p.Name, p.IsCurrent, p.IsRemote)
}

func (p *PorcelainParser) parseBranchTracking(content string, branch *BranchInfo) {
	parts := strings.Split(content, ": ")
	branch.Upstream = parts[0]
	if len(parts) > 1 {
		trackInfo := parts[1]
		if strings.Contains(trackInfo, "ahead") {
			var ahead int
			if n, err := fmt.Sscanf(trackInfo, "ahead %d", &ahead); n == 1 && err == nil {
				branch.AheadCount = ahead
			}
		}
		if strings.Contains(trackInfo, "behind") {
			var behind int
			if n, err := fmt.Sscanf(trackInfo, "behind %d", &behind); n == 1 && err == nil {
				branch.BehindCount = behind
			}
		}
	}
}
