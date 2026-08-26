import { Component, createSignal, createEffect, Show, For } from 'solid-js';
import { 
  FileCode, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  Copy, 
  ExternalLink,
  Check,
  RotateCcw
} from 'lucide-solid';
import { repoStore } from '../../store/repoStore';
import { WailsBridge } from '../../services/wailsBridge';

export const DiffViewer: Component = () => {
  const [diffContent, setDiffContent] = createSignal<string>('');
  const [isLoadingDiff, setIsLoadingDiff] = createSignal<boolean>(false);
  const [copied, setCopied] = createSignal<boolean>(false);

  const selectedDiff = () => repoStore.selectedFileDiff();
  const activeRepo = () => repoStore.selectedRepo();

  createEffect(async () => {
    const diff = selectedDiff();
    const repo = activeRepo();
    if (!diff || !repo) {
      setDiffContent('');
      return;
    }

    setIsLoadingDiff(true);
    try {
      const content = await WailsBridge.getFileDiff(repo.path, diff.filePath, diff.staged);
      setDiffContent(content);
    } catch (err) {
      console.error('Failed to load diff:', err);
      setDiffContent('Error loading diff.');
    } finally {
      setIsLoadingDiff(false);
    }
  });

  const parsedLines = () => {
    const raw = diffContent();
    if (!raw) return [];
    return raw.split('\n').map((line, idx) => {
      let type: 'header' | 'hunk' | 'addition' | 'deletion' | 'context' = 'context';
      if (line.startsWith('diff --git') || line.startsWith('index ') || line.startsWith('---') || line.startsWith('+++')) {
        type = 'header';
      } else if (line.startsWith('@@')) {
        type = 'hunk';
      } else if (line.startsWith('+')) {
        type = 'addition';
      } else if (line.startsWith('-')) {
        type = 'deletion';
      }
      return { id: idx, line, type };
    });
  };

  const copyFilePath = () => {
    const diff = selectedDiff();
    if (!diff) return;
    void navigator.clipboard.writeText(diff.filePath);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Show when={selectedDiff()}>
      {(diff) => (
        <div class="flex-1 flex flex-col h-full bg-[#0D1017] text-gray-200 overflow-hidden select-none">
          {/* Top Diff Header Bar */}
          <div class="px-5 py-3 bg-[#131722] border-b border-gray-800 flex items-center justify-between gap-4 flex-shrink-0 shadow-md">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
                <FileCode class="w-4 h-4" />
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-white text-sm font-mono truncate">{diff().filePath}</span>
                  <span
                    class={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                      diff().staged
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {diff().staged ? 'Staged in Index' : 'Working Tree Changes'}
                  </span>
                </div>
                <p class="text-xs text-gray-500 font-mono truncate">{activeRepo()?.path}/{diff().filePath}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div class="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={copyFilePath}
                class="px-2.5 py-1.5 bg-[#1C2130] hover:bg-[#252C40] border border-gray-700/60 rounded-lg text-xs text-gray-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Copy relative file path"
              >
                <Show when={copied()} fallback={<Copy class="w-3.5 h-3.5" />}>
                  <Check class="w-3.5 h-3.5 text-emerald-400" />
                </Show>
                <span>{copied() ? 'Copied!' : 'Copy Path'}</span>
              </button>

              <button
                onClick={() => {
                  const repo = activeRepo();
                  if (repo) void repoStore.openPath(`${repo.path}/${diff().filePath}`);
                }}
                class="px-2.5 py-1.5 bg-[#1C2130] hover:bg-[#252C40] border border-gray-700/60 rounded-lg text-xs text-gray-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Open file in default system editor"
              >
                <ExternalLink class="w-3.5 h-3.5" />
                <span>Open File</span>
              </button>

              <Show
                when={diff().staged}
                fallback={
                  <button
                    onClick={() => {
                      const repo = activeRepo();
                      if (repo) void repoStore.stageFiles(repo.path, [diff().filePath]);
                    }}
                    class="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <Plus class="w-3.5 h-3.5 stroke-[3]" />
                    <span>Stage File</span>
                  </button>
                }
              >
                <button
                  onClick={() => {
                    const repo = activeRepo();
                    if (repo) void repoStore.unstageFiles(repo.path, [diff().filePath]);
                  }}
                  class="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Minus class="w-3.5 h-3.5 stroke-[3]" />
                  <span>Unstage File</span>
                </button>
              </Show>

              <button
                onClick={() => {
                  const repo = activeRepo();
                  if (repo && confirm(`Discard changes to "${diff().filePath}"? This cannot be undone.`)) {
                    void repoStore.discardFiles(repo.path, [diff().filePath]);
                  }
                }}
                class="p-1.5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                title="Discard Changes"
              >
                <Trash2 class="w-4 h-4" />
              </button>

              <div class="h-4 w-px bg-gray-700 mx-1" />

              <button
                onClick={() => repoStore.clearFileDiff()}
                class="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Close Diff Viewer"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Diff Content Body */}
          <div class="flex-1 overflow-auto p-4 font-mono text-xs select-text leading-relaxed">
            <Show
              when={!isLoadingDiff()}
              fallback={
                <div class="flex items-center justify-center h-full text-gray-500 gap-2 font-sans">
                  <RotateCcw class="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Generating file diff...</span>
                </div>
              }
            >
              <Show
                when={parsedLines().length > 0}
                fallback={
                  <div class="flex flex-col items-center justify-center h-full text-gray-500 gap-2 font-sans">
                    <Check class="w-8 h-8 text-emerald-400 opacity-60" />
                    <p class="font-semibold text-gray-300">No differences detected</p>
                    <p class="text-xs">File content matches the Git index or HEAD.</p>
                  </div>
                }
              >
                <div class="rounded-xl border border-gray-800/80 overflow-hidden bg-[#0A0C12] shadow-xl">
                  <For each={parsedLines()}>
                    {(item) => {
                      if (item.type === 'hunk') {
                        return (
                          <div class="px-4 py-1.5 bg-[#171C2B] text-indigo-300 font-bold border-y border-indigo-500/20 text-[11px] select-none">
                            {item.line}
                          </div>
                        );
                      }
                      if (item.type === 'addition') {
                        return (
                          <div class="px-4 py-0.5 bg-emerald-500/15 text-emerald-200 border-l-2 border-l-emerald-500 flex items-start hover:bg-emerald-500/20 transition-colors">
                            <span class="text-emerald-400 select-none mr-3 opacity-60">+</span>
                            <pre class="flex-1 whitespace-pre-wrap font-mono break-all">{item.line.slice(1)}</pre>
                          </div>
                        );
                      }
                      if (item.type === 'deletion') {
                        return (
                          <div class="px-4 py-0.5 bg-rose-500/15 text-rose-300 border-l-2 border-l-rose-500 flex items-start hover:bg-rose-500/20 transition-colors">
                            <span class="text-rose-400 select-none mr-3 opacity-60">-</span>
                            <pre class="flex-1 whitespace-pre-wrap font-mono break-all line-through opacity-80">{item.line.slice(1)}</pre>
                          </div>
                        );
                      }
                      if (item.type === 'header') {
                        return (
                          <div class="px-4 py-0.5 text-gray-500 bg-[#0F121A] text-[11px]">
                            {item.line}
                          </div>
                        );
                      }
                      return (
                        <div class="px-4 py-0.5 text-gray-300 hover:bg-[#121622] flex items-start">
                          <span class="select-none mr-3 opacity-30"> </span>
                          <pre class="flex-1 whitespace-pre-wrap font-mono break-all">{item.line}</pre>
                        </div>
                      );
                    }}
                  </For>
                </div>
              </Show>
            </Show>
          </div>
        </div>
      )}
    </Show>
  );
};
