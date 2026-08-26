import { Component, createSignal, Show } from "solid-js";
import {
  AlertTriangle,
  X,
  Copy,
  Check,
  Terminal,
} from "lucide-solid";
import { repoStore, AppErrorDetail } from "../../store/repoStore";

interface ErrorDialogProps {
  onOpenDiagnostics?: () => void;
}

export const ErrorDialog: Component<ErrorDialogProps> = (props) => {
  const [copied, setCopied] = createSignal(false);
  const error = () => repoStore.activeError();

  const handleCopy = (err: AppErrorDetail) => {
    const fullLog = `[${new Date(err.timestamp).toLocaleTimeString()}] ${err.title}\nRepo: ${err.repoPath || "N/A"}\nCommand: ${err.command || "N/A"}\n\n${err.message}\n${err.stderr ? `\nSTDERR:\n${err.stderr}` : ""}`;
    void navigator.clipboard.writeText(fullLog);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const parseGitLabHints = (text: string): string | null => {
    const lower = text.toLowerCase();
    if (lower.includes("protected branch") || lower.includes("not allowed to push")) {
      return "GitLab Protected Branch: You do not have permission to push directly to this protected branch. Create a feature branch and submit a Merge Request (MR).";
    }
    if (lower.includes("permission denied (publickey)") || lower.includes("access denied")) {
      return "SSH Authentication Error: Your SSH key is missing or not authorized on GitLab/GitHub. Verify ssh-add -l or test with ssh -T git@gitlab.com.";
    }
    if (lower.includes("pre-receive hook declined")) {
      return "GitLab Pre-Receive Hook Declined: The remote GitLab repository rejected this push (e.g., commit message rules, secret detection, or branch rules).";
    }
    if (lower.includes("no upstream branch") || lower.includes("set-upstream")) {
      return "No Upstream Branch: The branch has not been pushed to remote before. OnoGitTree will configure --set-upstream origin automatically.";
    }
    if (lower.includes("authentication failed") || lower.includes("invalid credentials")) {
      return "HTTPS Authentication Failed: Personal Access Token (PAT) or credentials are invalid/expired.";
    }
    return null;
  };

  return (
    <Show when={error()}>
      {(err) => {
        const hint = parseGitLabHints(err().message + " " + (err().stderr || ""));

        return (
          <div
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-150"
            onClick={() => repoStore.clearActiveError()}
          >
            <div
              class="w-full max-w-xl bg-[#0F131C] border border-rose-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div class="px-5 py-3.5 bg-rose-500/10 border-b border-rose-500/20 flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <div class="p-1.5 bg-rose-500/20 border border-rose-500/40 rounded-lg text-rose-400">
                    <AlertTriangle class="w-4 h-4" />
                  </div>
                  <div>
                    <h2 class="text-sm font-bold text-rose-200 flex items-center gap-2">
                      <span>{err().title}</span>
                    </h2>
                    <Show when={err().repoPath}>
                      <p class="text-[11px] text-gray-400 font-mono truncate max-w-sm">
                        {err().repoPath}
                      </p>
                    </Show>
                  </div>
                </div>

                <button
                  onClick={() => repoStore.clearActiveError()}
                  class="p-1.5 hover:bg-rose-500/20 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div class="p-5 space-y-3.5 overflow-y-auto flex-1 font-mono text-xs">
                {/* Context / Hint alert if detected */}
                <Show when={hint}>
                  <div class="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-300 font-sans text-xs flex items-start gap-2.5">
                    <span class="text-base leading-none mt-0.5">💡</span>
                    <div>
                      <strong class="font-bold block text-amber-200 mb-0.5">
                        Developer Guidance
                      </strong>
                      <p class="text-[11.5px] leading-relaxed text-amber-300/90">
                        {hint}
                      </p>
                    </div>
                  </div>
                </Show>

                {/* Command executed */}
                <Show when={err().command}>
                  <div class="space-y-1">
                    <span class="text-[10px] text-gray-400 uppercase tracking-wider font-sans font-bold">
                      Executed Command
                    </span>
                    <div class="px-3 py-1.5 bg-carbon-base border border-carbon-border rounded-lg text-indigo-300 font-bold">
                      $ {err().command}
                    </div>
                  </div>
                </Show>

                {/* Stderr / Error Trace */}
                <div class="space-y-1">
                  <span class="text-[10px] text-gray-400 uppercase tracking-wider font-sans font-bold">
                    Terminal Output (STDERR)
                  </span>
                  <pre class="p-3.5 bg-[#080A0F] border border-gray-800 rounded-xl text-rose-300 text-[11.5px] whitespace-pre-wrap break-all leading-relaxed overflow-x-auto max-h-56 select-text">
                    {err().stderr || err().message}
                  </pre>
                </div>
              </div>

              {/* Footer */}
              <div class="px-5 py-3 bg-carbon-surface border-t border-gray-800/80 flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(err())}
                    class="px-3 py-1.5 bg-carbon-base hover:bg-carbon-elevated border border-carbon-border text-gray-300 hover:text-white rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Show
                      when={copied()}
                      fallback={<Copy class="w-3.5 h-3.5 text-gray-400" />}
                    >
                      <Check class="w-3.5 h-3.5 text-emerald-400" />
                    </Show>
                    <span>{copied() ? "Copied Error" : "Copy Output"}</span>
                  </button>

                  <Show when={props.onOpenDiagnostics}>
                    <button
                      onClick={() => {
                        repoStore.clearActiveError();
                        props.onOpenDiagnostics!();
                      }}
                      class="px-3 py-1.5 bg-carbon-base hover:bg-carbon-elevated border border-carbon-border text-indigo-300 hover:text-white rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Terminal class="w-3.5 h-3.5 text-indigo-400" />
                      <span>Diagnostics Console</span>
                    </button>
                  </Show>
                </div>

                <button
                  onClick={() => repoStore.clearActiveError()}
                  class="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs cursor-pointer transition-colors shadow-sm"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        );
      }}
    </Show>
  );
};
