# Tech Stack Evaluation: Go (Wails) Backend & Reactive Frontend Alternatives

This document evaluates the architectural choices for **OnoGitTree**, focusing on **Go (Wails)** for the backend and modern **zero-re-render, non-VDOM frontend alternatives** to React (SolidJS, Svelte 5, Vue 3).

---

## 1. Why Move Beyond React? (The Re-render & `useEffect` Problem)

In real-time developer desktop tools (where Git status streams, batch progress updates, and file watchers fire dozens of events per second), **React's Virtual DOM architecture presents well-known friction**:

| React Pain Point | Technical Reason | Impact on Desktop Git Clients |
| :--- | :--- | :--- |
| **Component Re-render Cascades** | Whenever state changes, the entire component function re-executes top-to-bottom. | Typing in a filter bar or receiving a git status event can trigger re-renders across 20+ repo tree nodes. |
| **`useEffect` Dependency Hell** | Requires manual dependency arrays `[depA, depB]`. Missing a dependency creates stale closures; adding objects causes infinite loops. | Complex Git background polling and IPC event listeners become fragile and bug-prone. |
| **`useMemo` / `useCallback` Boilerplate** | Required everywhere to prevent child components from re-rendering on parent state changes. | High mental overhead and cluttered code. |
| **Virtual DOM Diffing Overhead** | React creates an in-memory JS tree and diffs it against the real DOM on every tick. | Wastes CPU cycles and increases battery/RAM usage on Linux. |

---

## 2. Modern High-Performance Alternatives: SolidJS vs. Svelte 5

```
+----------------------------------------------------------------------------------------------------+
|                                 REACTIVITY COMPARISON MATRIX                                       |
+----------------------+--------------------+--------------------+-----------------------------------+
| Feature              | React 19           | SolidJS (Signals)  | Svelte 5 (Runes)                  |
+----------------------+--------------------+--------------------+-----------------------------------+
| Component Execution  | Runs on EVERY tick | Runs EXACTLY ONCE  | Runs EXACTLY ONCE                 |
| Virtual DOM          | YES (Heavy diffs)  | NO (0% VDOM)       | NO (0% VDOM)                      |
| Dependency Arrays    | Required in hooks  | NONE (Auto-track)  | NONE (Auto-track)                 |
| Reactivity Engine    | State snapshot     | Fine-grained Signal| Fine-grained Compiler Runes       |
| Idle Memory / CPU    | Moderate           | Minimal            | Minimal                           |
| Syntax Style         | JSX + Hooks        | JSX + Signals      | HTML Templates + Runes            |
| Benchmarks           | ~1.7x Baseline     | ~1.05x (Near C/JS) | ~1.10x (Near C/JS)                |
+----------------------+--------------------+--------------------+-----------------------------------+
```

---

## 3. Code Comparison: Multi-Repo Item with Real-Time Status

### ❌ React (Frequent re-renders, `useEffect` dependencies, `useCallback`):
```tsx
// React: Entire component function runs again whenever `status` or `isExpanded` changes
function RepoRow({ repo, onPull }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Fragile dependency array
  useEffect(() => {
    const unsub = window.runtime.EventsOn(`repo:${repo.id}:status`, (newStatus) => {
      // triggers full re-render of RepoRow and all its children
    });
    return () => unsub();
  }, [repo.id]);

  const handlePull = useCallback(() => onPull(repo.id), [repo.id, onPull]);

  return (
    <div>
      <span>{repo.name}</span>
      <span>{repo.branch}</span>
      <button onClick={handlePull}>Pull</button>
    </div>
  );
}
```

### ⚡ SolidJS (Component runs ONCE. ZERO re-renders. Fine-grained Signals):
```tsx
// SolidJS: Function executes ONCE on mount like a constructor.
// When repo.status() updates, ONLY the single text node inside the span is modified in the DOM!
function RepoRow(props: { repo: Repo; onPull: (id: string) => void }) {
  const [isExpanded, setIsExpanded] = createSignal(false);

  // Auto-tracked effect without dependency arrays
  createEffect(() => {
    console.log("Active branch is now:", props.repo.branch());
  });

  return (
    <div>
      <span>{props.repo.name}</span>
      <span>{props.repo.branch()}</span>
      <button onClick={() => props.onPull(props.repo.id)}>Pull</button>
    </div>
  );
}
```

### 🪄 Svelte 5 (Compiler Runes, Zero Boilerplate):
```svelte
<!-- Svelte 5: Clean, compiled reactive state -->
<script lang="ts">
  let { repo, onPull } = $props<{ repo: Repo; onPull: (id: string) => void }>();
  let isExpanded = $state(false);

  // Derived state automatically tracks dependencies
  let statusText = $derived(`${repo.ahead} ahead, ${repo.behind} behind`);
</script>

<div class="repo-row">
  <span>{repo.name}</span>
  <span>{statusText}</span>
  <button onclick={() => onPull(repo.id)}>Pull</button>
</div>
```

---

## 4. Final Recommendation for OnoGitTree Frontend

### 🥇 Choice 1: **SolidJS + TypeScript + Tailwind CSS**
- **Why**:
  1. Uses **JSX and TypeScript**, so existing React libraries and knowledge (Tailwind, Lucide icons, Monaco editor, Canvas graphs) work with minimal learning curve.
  2. **Components run once**. Fine-grained signals guarantee that when a background `git status` or `git fetch` completes for repository #4, **only repository #4's badge updates** in the DOM—zero impact on the other 19 repositories.
  3. No `useEffect` dependency arrays, no stale closures, no `useCallback`/`useMemo` noise.

### 🥈 Choice 2: **Svelte 5 + TypeScript + Tailwind CSS**
- **Why**:
  1. Most concise and readable syntax with `$state`, `$derived`, and `$effect`.
  2. Tiny compiled bundle, no runtime overhead, native Wails project template available out of the box (`wails init -t svelte-ts`).
