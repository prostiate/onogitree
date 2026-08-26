import { Component, Show } from 'solid-js';
import { GitBranch, HardDrive, ShieldCheck } from 'lucide-solid';

interface LoadingScreenProps {
  isVisible: boolean;
  statusText: string;
}

export const LoadingScreen: Component<LoadingScreenProps> = (props) => {
  return (
    <Show when={props.isVisible}>
      <div class="fixed inset-0 z-[100] bg-[#0A0C10] flex flex-col items-center justify-center select-none transition-opacity duration-500">
        {/* Glow ambient background effect */}
        <div class="absolute w-96 h-96 bg-git-indigo/10 rounded-full blur-3xl pointer-events-none -top-12 animate-pulse" />
        <div class="absolute w-72 h-72 bg-git-emerald/10 rounded-full blur-3xl pointer-events-none -bottom-12" />

        <div class="relative flex flex-col items-center max-w-sm w-full px-6 space-y-6 text-center">
          {/* Logo with animated branch pulse */}
          <div class="relative flex items-center justify-center">
            <div class="w-16 h-16 rounded-2xl bg-carbon-surface border border-carbon-border shadow-2xl flex items-center justify-center relative overflow-hidden">
              <div class="absolute inset-0 bg-gradient-to-tr from-git-indigo/20 via-transparent to-git-emerald/20" />
              <span class="text-2xl transform hover:scale-110 transition-transform">🌳</span>
            </div>
            {/* Orbiting micro indicator */}
            <div class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-git-emerald flex items-center justify-center animate-ping opacity-75">
              <div class="w-2 h-2 rounded-full bg-white" />
            </div>
          </div>

          {/* Title & Tagline */}
          <div class="space-y-1">
            <h1 class="text-xl font-extrabold text-white tracking-wider font-sans">
              OnoGitTree
            </h1>
            <p class="text-[11px] text-gray-400 font-mono">
              High-Performance Polyrepo Command Center
            </p>
          </div>

          {/* Animated Loading Bar */}
          <div class="w-full space-y-2">
            <div class="w-full h-1 bg-carbon-elevated border border-carbon-border rounded-full overflow-hidden relative">
              <div class="h-full bg-gradient-to-r from-git-indigo via-git-cyan to-git-emerald rounded-full animate-[progress_1.2s_ease-in-out_infinite]" />
            </div>
            <div class="flex items-center justify-between text-[10.5px] font-mono text-gray-400">
              <span class="text-gray-300">{props.statusText}</span>
              <span class="text-git-emerald flex items-center gap-1">
                <ShieldCheck class="w-3 h-3" />
                <span>Ready</span>
              </span>
            </div>
          </div>

          {/* Footnote telemetry badge */}
          <div class="pt-4 flex items-center gap-3 text-[10.5px] font-mono text-gray-500 border-t border-carbon-border/50">
            <span class="flex items-center gap-1">
              <GitBranch class="w-3 h-3 text-git-indigo" />
              <span>Multi-Repo Engine</span>
            </span>
            <span>•</span>
            <span class="flex items-center gap-1">
              <HardDrive class="w-3 h-3 text-git-cyan" />
              <span>Linux WebKitGTK</span>
            </span>
          </div>
        </div>
      </div>
    </Show>
  );
};
