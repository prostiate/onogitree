import {
  Component,
  createSignal,
  onCleanup,
  onMount,
  Show,
  For,
  JSX,
} from "solid-js";

export interface MenuItem {
  id: string;
  label: string;
  icon?: JSX.Element;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
  onClick?: () => void;
  subItems?: MenuItem[];
}

interface ContextMenuProps {
  x: number;
  y: number;
  isOpen: boolean;
  items: MenuItem[];
  onClose: () => void;
}

export const ContextMenu: Component<ContextMenuProps> = (props) => {
  let menuRef: HTMLDivElement | undefined;
  const [activeSubmenu, setActiveSubmenu] = createSignal<string | null>(null);

  const handleClickOutside = (e: MouseEvent) => {
    if (menuRef && !menuRef.contains(e.target as Node)) {
      props.onClose();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      props.onClose();
    }
  };

  onMount(() => {
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
  });

  onCleanup(() => {
    document.removeEventListener("mousedown", handleClickOutside);
    document.removeEventListener("keydown", handleKeyDown);
  });

  // Keep menu within viewport bounds
  const getPosition = () => {
    const margin = 10;
    const menuWidth = 230;
    const menuHeight = props.items.length * 28 + 20;

    let posX = props.x;
    let posY = props.y;

    if (posX + menuWidth > window.innerWidth - margin) {
      posX = window.innerWidth - menuWidth - margin;
    }
    if (posY + menuHeight > window.innerHeight - margin) {
      posY = Math.max(margin, window.innerHeight - menuHeight - margin);
    }

    return { x: posX, y: posY };
  };

  return (
    <Show when={props.isOpen}>
      <div
        ref={menuRef}
        style={{
          top: `${getPosition().y}px`,
          left: `${getPosition().x}px`,
        }}
        class="fixed z-50 min-w-[210px] bg-carbon-surface border border-carbon-border rounded-xl shadow-2xl py-1.5 text-xs text-gray-200 select-none backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
      >
        <For each={props.items}>
          {(item) => (
            <Show
              when={!item.divider}
              fallback={<div class="my-1 border-t border-carbon-border" />}
            >
              <div
                class="relative group"
                onMouseEnter={() => item.subItems && setActiveSubmenu(item.id)}
                onMouseLeave={() => item.subItems && setActiveSubmenu(null)}
              >
                <button
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    if (item.disabled) return;
                    if (item.onClick) {
                      item.onClick();
                      props.onClose();
                    }
                  }}
                  class={`w-full px-3 py-1.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                    item.disabled
                      ? "opacity-40 cursor-not-allowed text-gray-500"
                      : item.danger
                        ? "hover:bg-rose-500/20 text-rose-400 hover:text-rose-300"
                        : "hover:bg-carbon-hover hover:text-white text-gray-300"
                  }`}
                >
                  <div class="flex items-center gap-2 truncate">
                    <Show when={item.icon}>
                      <span class="w-4 h-4 flex items-center justify-center flex-shrink-0 opacity-80 group-hover:opacity-100">
                        {item.icon}
                      </span>
                    </Show>
                    <span class="truncate font-medium">{item.label}</span>
                  </div>

                  <div class="flex items-center gap-1.5">
                    <Show when={item.shortcut}>
                      <span class="text-[10px] text-gray-500 font-mono group-hover:text-gray-400">
                        {item.shortcut}
                      </span>
                    </Show>
                    <Show when={item.subItems}>
                      <span class="text-[10px] text-gray-500">▶</span>
                    </Show>
                  </div>
                </button>

                {/* Submenu flyout */}
                <Show when={item.subItems && activeSubmenu() === item.id}>
                  <div class="absolute left-full top-0 ml-1 min-w-[190px] bg-carbon-surface border border-carbon-border rounded-xl shadow-2xl py-1.5 text-xs text-gray-200 z-50">
                    <For each={item.subItems}>
                      {(sub) => (
                        <Show
                          when={!sub.divider}
                          fallback={
                            <div class="my-1 border-t border-carbon-border" />
                          }
                        >
                          <button
                            type="button"
                            disabled={sub.disabled}
                            onClick={() => {
                              if (sub.disabled) return;
                              if (sub.onClick) {
                                sub.onClick();
                                props.onClose();
                              }
                            }}
                            class="w-full px-3 py-1.5 flex items-center justify-between text-left hover:bg-carbon-hover hover:text-white text-gray-300 transition-colors cursor-pointer"
                          >
                            <span class="truncate font-medium">
                              {sub.label}
                            </span>
                          </button>
                        </Show>
                      )}
                    </For>
                  </div>
                </Show>
              </div>
            </Show>
          )}
        </For>
      </div>
    </Show>
  );
};
