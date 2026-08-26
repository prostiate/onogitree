# Coding Standards, Architecture Principles & Verification Rules 📐

This document establishes the official engineering guidelines, architectural standards, type-safety requirements, package management, and verification policies for **OnoGitTree**.

---

## 1. Core Architectural Philosophy: SOLID + KISS

Every component, service, and module in both the Go Backend and SolidJS Frontend must strictly adhere to **SOLID** and **KISS (Keep It Simple, Stupid)** principles.

### In Go Backend:
1. **Single Responsibility (SRP)**:
   - `GitCommandRunner`: Only responsible for executing `/usr/bin/git` safely with timeouts and mutex locks.
   - `PorcelainParser`: Only responsible for parsing raw Git output into Go structs.
   - `BatchWorkerPool`: Only responsible for concurrent queue scheduling and worker rate limiting.
   - `SqliteStore`: Only responsible for SQL persistence and queries.
2. **Open/Closed & Interface Segregation (OCP & ISP)**:
   - Define small, focused Go interfaces (`Runner`, `Scanner`, `RepositoryStore`) to enable seamless unit test mocking without spawning real OS processes.
3. **Dependency Inversion (DIP)**:
   - Higher-level services receive dependencies via constructors (`NewWorkspaceService(db Store, runner GitRunner)`).
4. **KISS Principle**:
   - Avoid over-engineered reflection or complex meta-programming.
   - Prefer standard explicit Go error checking (`if err != nil { return nil, fmt.Errorf(...) }`).
   - Keep Goroutine lifecycle clear and explicit with contexts (`context.Context`).

### In SolidJS Frontend:
1. **Single Responsibility (SRP)**:
   - Stores (`repoStore.ts`, `batchStore.ts`) manage reactive state and IPC event listeners only.
   - UI Components (`RepoRow.tsx`, `ChangesView.tsx`, `BranchPicker.tsx`) only render DOM elements and bind user actions to store methods.
2. **KISS Principle**:
   - Leverage SolidJS fine-grained Signals directly. Do not introduce complex state machine frameworks where simple Signals suffice.
   - Components execute **once** during initialization—keep effects (`createEffect`) minimal and purposeful.

---

## 2. Package Manager Decision: `pnpm` 🚀

* **Decision**: **`pnpm`** is the mandated package manager for the frontend.
* **Rationale**:
  - **Blazing Fast**: Parallel symlinked package resolution.
  - **Disk & Memory Efficient**: Uses a global content-addressable store across projects.
  - **Strict Dependency Isolation**: Prevents "phantom dependency" bugs by not flattening `node_modules`.

---

## 3. Strict TypeScript & Zero-`any` Type Safety Policy

### Compiler Configuration:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### Type Safety Rules:
1. **Strict Zero-`any` / Zero-`unknown` in Production Code**:
   - Every IPC payload, repository model, diff object, and function signature must have an explicit TypeScript `interface` or `type`.
   - The use of `any` or `unknown` is **strictly prohibited in production source files** (`src/**/*.ts`, `src/**/*.tsx`).
2. **Documented Justification Rule**:
   - If interfacing with an untyped third-party JavaScript library or C WebKit binding forces a type cast, it **MUST include an inline comment justifying why it is unavoidable**:
     ```typescript
     // JUSTIFICATION: Third-party Monaco loader does not export internal MonacoEnvironment type on window
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
     (window as any).MonacoEnvironment = { ... };
     ```
3. **Test Files Exception**:
   - Unit tests (`*.test.ts`, `*.spec.ts`) are allowed to use `any` or loose mocks for fixture simplicity when isolating edge cases.

---

## 4. Linting, Formatting & `.prettierignore` Rules

### Tools:
* **Frontend**: `eslint` with `@typescript-eslint/recommended` + `prettier`.
* **Backend**: `golangci-lint` + `go vet` + `gofmt`.

### Formatter Scope & Markdown Exclusion:
* To protect manual markdown formatting, tables, and documentation aesthetics, **all `.md` files and the `docs/` directory MUST be explicitly excluded from automatic formatters**:

```ini
# .prettierignore
node_modules/
dist/
build/
frontend/wailsjs/
*.md
docs/
docs/**
```

---

## 5. Testing & Verification Standards

### Go Backend Verification:
* Every Go service must have corresponding unit tests in `_test.go` files:
  - `backend/git/parser_test.go`: Tests parsing dirty, staged, ahead/behind status outputs.
  - `backend/batch/pool_test.go`: Tests worker concurrency limits, channel buffering, and cancellation timeouts.
  - `backend/workspace/scanner_test.go`: Tests recursive `.git` directory discovery and edge cases.
* **Test Command**: `go test -v -race ./...`

### Frontend Verification:
* Tested with `vitest` + `@solidjs/testing-library`:
  - Store signal mutations and batch progress event handling.
  - Modal open/close state transitions.
* **Check Commands**:
  - Type checking: `pnpm check` (`tsc --noEmit`)
  - Linting: `pnpm lint`
  - Tests: `pnpm test`
