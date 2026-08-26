import Prism from "prismjs";

// Load common Prism languages
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-json";
import "prismjs/components/prism-css";
import "prismjs/components/prism-scss";
import "prismjs/components/prism-markup"; // html / xml / svg
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-python";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-docker";
import "prismjs/components/prism-toml";
import "prismjs/components/prism-ini";

/**
 * Maps a file extension or filename to a registered Prism language ID
 */
export function getLanguageForFile(filePath: string): string {
  if (!filePath) return "javascript";

  const lower = filePath.toLowerCase();
  const basename = lower.split("/").pop() || "";

  // Special full filenames
  if (basename === "dockerfile" || basename.startsWith("dockerfile."))
    return "docker";
  if (basename === ".gitignore" || basename === ".gitmodules") return "bash";
  if (basename.startsWith(".env")) return "ini";

  const ext = basename.split(".").pop() || "";

  switch (ext) {
    case "ts":
    case "d.ts":
    case "mts":
    case "cts":
      return "typescript";
    case "tsx":
      return "tsx";
    case "js":
    case "mjs":
    case "cjs":
      return "javascript";
    case "jsx":
      return "jsx";
    case "vue":
    case "svelte":
    case "html":
    case "htm":
    case "svg":
      return "markup";
    case "css":
      return "css";
    case "scss":
    case "sass":
    case "less":
      return "scss";
    case "json":
    case "jsonc":
    case "json5":
      return "json";
    case "go":
      return "go";
    case "rs":
      return "rust";
    case "py":
    case "pyw":
      return "python";
    case "yaml":
    case "yml":
      return "yaml";
    case "toml":
      return "toml";
    case "md":
    case "mdx":
      return "markdown";
    case "sh":
    case "bash":
    case "zsh":
      return "bash";
    case "sql":
    case "prisma":
      return "sql";
    case "ini":
    case "env":
    case "conf":
      return "ini";
    default:
      return "javascript";
  }
}

/**
 * Highlights a code snippet with VS Code Dark+ compatible tokenization
 */
export function highlightCode(code: string, filePath: string): string {
  if (!code) return "";

  const lang = getLanguageForFile(filePath);
  const grammar = Prism.languages[lang] || Prism.languages.javascript;

  try {
    return Prism.highlight(code, grammar, lang);
  } catch {
    // Fallback: safe HTML escape
    return escapeHtml(code);
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
