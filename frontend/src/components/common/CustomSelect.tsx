import { Component, createSignal, For, Show, onCleanup, onMount } from 'solid-js';
import { ChevronDown, Check } from 'lucide-solid';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface CustomSelectProps {
  value: string;
  options: SelectOption[];
  onChange: (val: string) => void;
  placeholder?: string;
  class?: string;
}

export const CustomSelect: Component<CustomSelectProps> = (props) => {
  const [isOpen, setIsOpen] = createSignal<boolean>(false);
  let containerRef: HTMLDivElement | undefined;

  const selectedOption = () => props.options.find((o) => o.value === props.value);

  const handleOutsideClick = (e: MouseEvent) => {
    if (containerRef && !containerRef.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };

  onMount(() => {
    document.addEventListener('click', handleOutsideClick);
  });

  onCleanup(() => {
    document.removeEventListener('click', handleOutsideClick);
  });

  return (
    <div ref={containerRef} class={`relative select-none ${props.class || 'w-full'}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen())}
        class="w-full px-3 py-2 bg-[#12151D] hover:bg-[#181C26] border border-carbon-border focus:border-git-indigo rounded text-gray-200 text-xs flex items-center justify-between transition-colors cursor-pointer text-left shadow-inner"
      >
        <span class="font-medium truncate text-gray-100">
          {selectedOption()?.label || props.placeholder || 'Select option...'}
        </span>
        <ChevronDown
          class={`w-3.5 h-3.5 text-gray-400 ml-2 transition-transform duration-150 flex-shrink-0 ${
            isOpen() ? 'rotate-180 text-git-indigo' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <Show when={isOpen()}>
        <div class="absolute left-0 right-0 top-full mt-1 bg-[#161924] border border-carbon-border rounded shadow-2xl z-50 py-1 max-h-56 overflow-y-auto divide-y divide-carbon-border/30 animate-in fade-in-50 duration-100">
          <For each={props.options}>
            {(opt) => {
              const isSelected = () => opt.value === props.value;
              return (
                <div
                  onClick={() => {
                    props.onChange(opt.value);
                    setIsOpen(false);
                  }}
                  class={`px-3 py-2 flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected()
                      ? 'bg-git-indigo/20 text-git-indigo font-semibold'
                      : 'text-gray-200 hover:bg-carbon-hover hover:text-white'
                  }`}
                >
                  <div class="flex flex-col min-w-0 pr-2">
                    <span class="text-xs truncate">{opt.label}</span>
                    <Show when={opt.description}>
                      <span class="text-[10.5px] text-gray-400 truncate">{opt.description}</span>
                    </Show>
                  </div>
                  <Show when={isSelected()}>
                    <Check class="w-3.5 h-3.5 text-git-indigo flex-shrink-0 stroke-[2.5]" />
                  </Show>
                </div>
              );
            }}
          </For>
        </div>
      </Show>
    </div>
  );
};
