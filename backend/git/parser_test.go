package git

import (
	"testing"
)

func TestPorcelainParser_ParseStatus(t *testing.T) {
	sampleOutput := `# branch.oid a1b2c3d4e5f6
# branch.head feat/cashier-card-impl
# branch.upstream origin/feat/cashier-card-impl
# branch.ab +2 -1
1 .M N... 100644 100644 100644 a1b2c3d e4f5g6h src/components/PaymentCard.tsx
1 M. N... 100644 100644 100644 1a2b3c4 5e6f7a8 src/hooks/usePayment.ts
? docs/new-doc.md
`

	parser := NewPorcelainParser()
	status, err := parser.ParseStatus("/path/to/repo", sampleOutput)
	if err != nil {
		t.Fatalf("unexpected error parsing status: %v", err)
	}

	if status.CurrentBranch != "feat/cashier-card-impl" {
		t.Errorf("expected branch 'feat/cashier-card-impl', got '%s'", status.CurrentBranch)
	}
	if status.AheadCount != 2 {
		t.Errorf("expected ahead count 2, got %d", status.AheadCount)
	}
	if status.BehindCount != 1 {
		t.Errorf("expected behind count 1, got %d", status.BehindCount)
	}
	if len(status.Files) != 3 {
		t.Errorf("expected 3 files, got %d", len(status.Files))
	}
	if !status.IsDirty {
		t.Error("expected isDirty to be true")
	}
}

func TestPorcelainParser_ParseBranches(t *testing.T) {
	sampleOutput := `* main                a1b2c3d [origin/main: ahead 1] feat: initial commit
  feature-branch      e4f5g6h [origin/feature-branch] fix: handle error
  remotes/origin/main a1b2c3d feat: initial commit
`

	parser := NewPorcelainParser()
	branches, err := parser.ParseBranches(sampleOutput)
	if err != nil {
		t.Fatalf("unexpected error parsing branches: %v", err)
	}

	if len(branches) != 3 {
		t.Fatalf("expected 3 branches, got %d", len(branches))
	}
	if !branches[0].IsCurrent || branches[0].Name != "main" {
		t.Errorf("expected first branch to be current 'main', got %v", branches[0])
	}
	if !branches[2].IsRemote || branches[2].Name != "origin/main" {
		t.Errorf("expected third branch to be remote 'origin/main', got %v", branches[2])
	}
}
