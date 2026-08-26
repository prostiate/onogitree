import { Component, Show } from "solid-js";
import { Github, Gitlab, Check, X, Key } from "lucide-solid";

interface IntegrationsSectionProps {
  cliAuth: { gh: boolean; glab: boolean };
}

export const IntegrationsSection: Component<IntegrationsSectionProps> = (props) => {
  return (
    <div class="space-y-6 select-none">
      <div>
        <h3 class="text-sm font-bold text-gray-100 mb-1">
          CLI & Provider Authentication
        </h3>
        <p class="text-[11.5px] text-gray-400">
          OnoGitTree automatically leverages system CLI credentials for zero-setup private repository operations.
        </p>
      </div>

      <div class="space-y-3">
        {/* GitHub CLI */}
        <div class="bg-carbon-base border border-carbon-border rounded-xl p-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-white">
              <Github class="w-4 h-4" />
            </div>
            <div>
              <span class="font-bold text-gray-200 block text-xs">
                GitHub CLI (gh)
              </span>
              <span class="text-[11px] text-gray-400 font-mono">
                {props.cliAuth.gh
                  ? "Authenticated via gh auth status"
                  : "Not logged in (Run gh auth login)"}
              </span>
            </div>
          </div>

          <Show
            when={props.cliAuth.gh}
            fallback={
              <span class="flex items-center gap-1 text-[11px] text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full">
                <X class="w-3.5 h-3.5" />
                <span>Unauthenticated</span>
              </span>
            }
          >
            <span class="flex items-center gap-1 text-[11px] text-git-emerald font-semibold bg-git-emerald/10 border border-git-emerald/30 px-2.5 py-1 rounded-full">
              <Check class="w-3.5 h-3.5" />
              <span>Connected</span>
            </span>
          </Show>
        </div>

        {/* GitLab CLI */}
        <div class="bg-carbon-base border border-carbon-border rounded-xl p-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-orange-950/40 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Gitlab class="w-4 h-4" />
            </div>
            <div>
              <span class="font-bold text-gray-200 block text-xs">
                GitLab CLI (glab)
              </span>
              <span class="text-[11px] text-gray-400 font-mono">
                {props.cliAuth.glab
                  ? "Authenticated via glab auth status"
                  : "Not logged in (Run glab auth login)"}
              </span>
            </div>
          </div>

          <Show
            when={props.cliAuth.glab}
            fallback={
              <span class="flex items-center gap-1 text-[11px] text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full">
                <X class="w-3.5 h-3.5" />
                <span>Unauthenticated</span>
              </span>
            }
          >
            <span class="flex items-center gap-1 text-[11px] text-git-emerald font-semibold bg-git-emerald/10 border border-git-emerald/30 px-2.5 py-1 rounded-full">
              <Check class="w-3.5 h-3.5" />
              <span>Connected</span>
            </span>
          </Show>
        </div>

        {/* SSH / Credential Helper Info */}
        <div class="bg-carbon-base border border-carbon-border rounded-xl p-4 flex items-center gap-3 text-[11px] text-gray-400">
          <Key class="w-4 h-4 text-git-indigo flex-shrink-0" />
          <span>
            Standard Git SSH keys (<code class="text-git-indigo">~/.ssh/id_*</code>) and Git Credential Helpers are automatically supported for all HTTPS push/pull operations.
          </span>
        </div>
      </div>
    </div>
  );
};
