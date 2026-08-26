import { Component, JSX } from "solid-js";
import { FileText } from "lucide-solid";

interface FileIconProps {
  filePath: string;
  class?: string;
  size?: number;
}

export const FileIcon: Component<FileIconProps> = (props) => {
  const size = () => props.size || 14;

  const getExtension = () => {
    const name = props.filePath.split("/").pop() || "";
    return name.toLowerCase();
  };

  const renderIcon = (): JSX.Element => {
    const filename = getExtension();
    const ext = filename.split(".").pop() || "";

    // Specific Filenames
    if (filename === "dockerfile" || filename.startsWith("dockerfile.")) {
      return (
        <svg class={props.class} width={size()} height={size()} viewBox="0 0 24 24" fill="none">
          <path d="M22 12.5C21.4 12.1 20.6 12 19.8 12.2C19.2 11.2 18.2 10.5 17 10.3C16.8 7.5 14.5 5.5 11.5 5.5C11.1 5.5 10.7 5.6 10.3 5.7V3H8.3V6.3C7.5 6.9 6.8 7.7 6.3 8.7H2V14.5C2 18.1 4.9 21 8.5 21C14.3 21 19.3 17.5 21.2 12.2C21.5 12.4 21.7 12.5 22 12.5Z" fill="#2496ED"/>
          <path d="M6 10H8V12H6V10ZM9 10H11V12H9V10ZM12 10H14V12H12V10ZM6 13H8V15H6V13ZM9 13H11V15H9V13ZM12 13H14V15H12V13ZM15 13H17V15H15V13ZM15 10H17V12H15V10Z" fill="#FFFFFF"/>
        </svg>
      );
    }

    if (filename === ".gitignore" || filename === ".gitmodules" || filename.startsWith(".git")) {
      return (
        <svg class={props.class} width={size()} height={size()} viewBox="0 0 24 24" fill="none">
          <path d="M21.6 10.9L13.1 2.4C12.3 1.6 11 1.6 10.2 2.4L8.3 4.3L10.7 6.7C11.5 6.4 12.5 6.6 13.1 7.2C13.8 7.9 13.9 8.9 13.6 9.7L16 12.1C16.8 11.8 17.8 11.9 18.5 12.6C19.4 13.5 19.4 14.9 18.5 15.8C17.6 16.7 16.2 16.7 15.3 15.8C14.7 15.1 14.5 14.2 14.8 13.4L12.5 11.1V16.3C12.8 16.6 13 17 13 17.5C13 18.9 11.9 20 10.5 20C9.1 20 8 18.9 8 17.5C8 16.4 8.7 15.4 9.8 15.1V9.7C8.7 9.4 8 8.4 8 7.3C8 6.8 8.2 6.4 8.5 6.1L6.6 4.2L2.4 8.4C1.6 9.2 1.6 10.5 2.4 11.3L10.9 19.8C11.7 20.6 13 20.6 13.8 19.8L21.6 12C22.4 11.7 22.4 11.3 21.6 10.9Z" fill="#F05032"/>
        </svg>
      );
    }

    if (filename.startsWith(".env")) {
      return (
        <svg class={props.class} width={size()} height={size()} viewBox="0 0 24 24" fill="none">
          <circle cx="9" cy="12" r="5" stroke="#FACC15" stroke-width="2"/>
          <path d="M14 12H21M18 12V15M21 12V15" stroke="#FACC15" stroke-width="2" stroke-linecap="round"/>
        </svg>
      );
    }

    if (filename.includes("lock")) {
      return (
        <svg class={props.class} width={size()} height={size()} viewBox="0 0 24 24" fill="none">
          <rect x="5" y="11" width="14" height="10" rx="2" fill="#EAB308"/>
          <path d="M8 11V7C8 4.79 9.79 3 12 3C14.21 3 16 4.79 16 7V11" stroke="#EAB308" stroke-width="2"/>
        </svg>
      );
    }

    // Extensions
    switch (ext) {
      // React / TSX
      case "tsx":
      case "jsx":
        return (
          <svg class={props.class} width={size()} height={size()} viewBox="0 0 24 24" fill="none">
            <ellipse cx="12" cy="12" rx="4" ry="10" transform="rotate(30 12 12)" stroke="#61DAFB" stroke-width="1.5"/>
            <ellipse cx="12" cy="12" rx="4" ry="10" transform="rotate(90 12 12)" stroke="#61DAFB" stroke-width="1.5"/>
            <ellipse cx="12" cy="12" rx="4" ry="10" transform="rotate(150 12 12)" stroke="#61DAFB" stroke-width="1.5"/>
            <circle cx="12" cy="12" r="2" fill="#61DAFB"/>
          </svg>
        );

      // TypeScript
      case "ts":
      case "mts":
      case "cts":
        return (
          <svg class={props.class} width={size()} height={size()} viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="4" fill="#3178C6"/>
            <path d="M4 8H12M8 8V18M13 15.5C13.5 16.8 15 17.5 16.5 17.5C18.2 17.5 19.5 16.5 19.5 15C19.5 12.8 13.5 13.5 13.5 10.5C13.5 9 14.8 8 16.8 8C18.2 8 19.3 8.6 19.8 9.8" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
          </svg>
        );

      // JavaScript
      case "js":
      case "mjs":
      case "cjs":
        return (
          <svg class={props.class} width={size()} height={size()} viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="4" fill="#F7DF1E"/>
            <path d="M8 11V16C8 17.5 7 18 5.5 17.5M13 16C13.5 17 14.8 17.5 16.2 17.5C17.8 17.5 19 16.7 19 15.2C19 13.2 13.8 13.8 13.8 11C13.8 9.5 15 8.5 16.8 8.5C18 8.5 19 9 19.5 10" stroke="#000000" stroke-width="2" stroke-linecap="round"/>
          </svg>
        );

      // Vue
      case "vue":
        return (
          <svg class={props.class} width={size()} height={size()} viewBox="0 0 24 24" fill="none">
            <path d="M2 3H6.5L12 12.5L17.5 3H22L12 21L2 3Z" fill="#42B883"/>
            <path d="M6.5 3H10L12 6.5L14 3H17.5L12 12.5L6.5 3Z" fill="#35495E"/>
          </svg>
        );

      // Go
      case "go":
        return (
          <svg class={props.class} width={size()} height={size()} viewBox="0 0 24 24" fill="none">
            <path d="M3 13.5H9M3 10.5H12M3 16.5H7" stroke="#00ADD8" stroke-width="2" stroke-linecap="round"/>
            <circle cx="16" cy="13.5" r="4.5" stroke="#00ADD8" stroke-width="2"/>
            <path d="M16 13.5H20.5V16" stroke="#00ADD8" stroke-width="2" stroke-linecap="round"/>
          </svg>
        );

      // Rust
      case "rs":
        return (
          <svg class={props.class} width={size()} height={size()} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="8" stroke="#DEA584" stroke-width="2"/>
            <circle cx="12" cy="12" r="3" fill="#DEA584"/>
            <path d="M12 2V6M12 18V22M2 12H6M18 12H22" stroke="#DEA584" stroke-width="2"/>
          </svg>
        );

      // Python
      case "py":
      case "pyw":
        return (
          <svg class={props.class} width={size()} height={size()} viewBox="0 0 24 24" fill="none">
            <path d="M11.5 2C7.5 2 7.5 3.8 7.5 3.8V6H12.5V7H5.5C5.5 7 2 6.8 2 11C2 15.2 5 15 5 15H6.5V13C6.5 11 8.5 11 8.5 11H13.5C15.2 11 16.5 9.8 16.5 8V4C16.5 4 16.8 2 11.5 2ZM9.8 3.5C10.3 3.5 10.8 4 10.8 4.5C10.8 5 10.3 5.5 9.8 5.5C9.2 5.5 8.8 5 8.8 4.5C8.8 4 9.2 3.5 9.8 3.5Z" fill="#3776AB"/>
            <path d="M12.5 22C16.5 22 16.5 20.2 16.5 20.2V18H11.5V17H18.5C18.5 17 22 17.2 22 13C22 8.8 19 9 19 9H17.5V11C17.5 13 15.5 13 15.5 13H10.5C8.8 13 7.5 14.2 7.5 16V20C7.5 20 7.2 22 12.5 22ZM14.2 20.5C13.7 20.5 13.2 20 13.2 19.5C13.2 19 13.7 18.5 14.2 18.5C14.8 18.5 15.2 19 15.2 19.5C15.2 20 14.8 20.5 14.2 20.5Z" fill="#FFD43B"/>
          </svg>
        );

      // JSON
      case "json":
      case "jsonc":
      case "json5":
        return (
          <svg class={props.class} width={size()} height={size()} viewBox="0 0 24 24" fill="none">
            <path d="M7 5C5.5 5 4 6.5 4 8V10C4 11 3 12 2 12C3 12 4 13 4 14V16C4 17.5 5.5 19 7 19M17 5C18.5 5 20 6.5 20 8V10C20 11 21 12 22 12C21 12 20 13 20 14V16C20 17.5 18.5 19 17 19" stroke="#CBCB41" stroke-width="2" stroke-linecap="round"/>
          </svg>
        );

      // HTML
      case "html":
      case "htm":
        return (
          <svg class={props.class} width={size()} height={size()} viewBox="0 0 24 24" fill="none">
            <path d="M3 2L5 19L12 21L19 19L21 2H3Z" fill="#E34F26"/>
            <path d="M12 4V19.2L17.5 17.6L19.2 4H12Z" fill="#EF652A"/>
            <path d="M7.5 7H16.5M7.5 10.5H15.5L15 15L12 16L9 15L8.8 12.5" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        );

      // CSS / SCSS
      case "css":
      case "scss":
      case "sass":
      case "less":
        return (
          <svg class={props.class} width={size()} height={size()} viewBox="0 0 24 24" fill="none">
            <path d="M3 2L5 19L12 21L19 19L21 2H3Z" fill="#1572B6"/>
            <path d="M12 4V19.2L17.5 17.6L19.2 4H12Z" fill="#33A9DC"/>
            <path d="M8 8H16M8 12H16M10 16H14" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
          </svg>
        );

      // Markdown
      case "md":
      case "mdx":
      case "markdown":
        return (
          <svg class={props.class} width={size()} height={size()} viewBox="0 0 24 24" fill="none">
            <rect x="2" y="4" width="20" height="16" rx="2" stroke="#4B9CD3" stroke-width="2"/>
            <path d="M6 15V9L8.5 12L11 9V15M17 15L14.5 12H16V9H18V12H19.5L17 15Z" fill="#4B9CD3"/>
          </svg>
        );

      // YAML / TOML
      case "yaml":
      case "yml":
      case "toml":
        return (
          <svg class={props.class} width={size()} height={size()} viewBox="0 0 24 24" fill="none">
            <path d="M5 4L12 13V20M19 4L12 13" stroke="#CB171E" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        );

      // Shell
      case "sh":
      case "bash":
      case "zsh":
        return (
          <svg class={props.class} width={size()} height={size()} viewBox="0 0 24 24" fill="none">
            <rect x="2" y="4" width="20" height="16" rx="3" fill="#1E293B" stroke="#4ADE80" stroke-width="1.5"/>
            <path d="M6 9L9 12L6 15M11 15H15" stroke="#4ADE80" stroke-width="2" stroke-linecap="round"/>
          </svg>
        );

      // SQL / Prisma / Database
      case "sql":
      case "prisma":
      case "db":
        return (
          <svg class={props.class} width={size()} height={size()} viewBox="0 0 24 24" fill="none">
            <ellipse cx="12" cy="6" rx="8" ry="3" stroke="#38BDF8" stroke-width="2"/>
            <path d="M4 6V12C4 13.66 7.58 15 12 15C16.42 15 20 13.66 20 12V6M4 12V18C4 19.66 7.58 21 12 21C16.42 21 20 19.66 20 18V12" stroke="#38BDF8" stroke-width="2"/>
          </svg>
        );

      // Images
      case "png":
      case "jpg":
      case "jpeg":
      case "gif":
      case "webp":
      case "ico":
      case "svg":
        return (
          <svg class={props.class} width={size()} height={size()} viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="3" stroke="#EC4899" stroke-width="2"/>
            <circle cx="8.5" cy="8.5" r="1.5" fill="#EC4899"/>
            <path d="M21 15L16 10L5 21" stroke="#EC4899" stroke-width="2"/>
          </svg>
        );

      default:
        return <FileText class={`text-gray-400 ${props.class || ""}`} size={size()} />;
    }
  };

  return renderIcon();
};

// Backwards compatibility alias
export const FileTypeBadge = FileIcon;
