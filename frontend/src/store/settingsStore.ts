import { createSignal, createRoot } from 'solid-js';

export type ThemeMode = 'system' | 'dark' | 'light' | 'oled';
export type AccentColor = 'indigo' | 'emerald' | 'cyan' | 'purple' | 'amber';
export type FontFamily = 'JetBrains Mono' | 'Fira Code' | 'Inter' | 'system-ui';
export type FontSize = 'sm' | 'md' | 'lg';

export interface AppSettings {
  themeMode: ThemeMode;
  accentColor: AccentColor;
  fontFamily: FontFamily;
  fontSize: FontSize;
  autoFetchInterval: string;
  workerConcurrency: number;
  skipDirtyByDefault: boolean;
  activeProfile: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  themeMode: 'system',
  accentColor: 'indigo',
  fontFamily: 'Inter',
  fontSize: 'md',
  autoFetchInterval: '10m',
  workerConcurrency: 6,
  skipDirtyByDefault: true,
  activeProfile: 'Default Workstation',
};

const STORAGE_KEY = 'onogitree_settings_v1';
const PROFILES_KEY = 'onogitree_profiles_v1';

function createSettingsStore() {
  const loadSavedSettings = (): AppSettings => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  };

  const loadSavedProfiles = (): Record<string, AppSettings> => {
    try {
      const data = localStorage.getItem(PROFILES_KEY);
      if (data) return JSON.parse(data);
    } catch {
      // ignore
    }
    return {
      'Default Workstation': DEFAULT_SETTINGS,
      'High-Concurrency Polyrepo': {
        ...DEFAULT_SETTINGS,
        workerConcurrency: 10,
        autoFetchInterval: '5m',
        accentColor: 'emerald',
      },
      'Minimalist OLED': {
        ...DEFAULT_SETTINGS,
        themeMode: 'oled',
        accentColor: 'cyan',
        fontFamily: 'JetBrains Mono',
      },
    };
  };

  const initial = loadSavedSettings();
  const [settings, setSettings] = createSignal<AppSettings>(initial);
  const [profiles, setProfiles] = createSignal<Record<string, AppSettings>>(loadSavedProfiles());

  const applyThemeToDOM = (s: AppSettings) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove('theme-dark', 'theme-light', 'theme-oled');

    let effectiveTheme = s.themeMode;
    if (effectiveTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = prefersDark ? 'dark' : 'light';
    }

    root.classList.add(`theme-${effectiveTheme}`);
    root.setAttribute('data-accent', s.accentColor);
    root.setAttribute('data-font', s.fontFamily);
    root.setAttribute('data-size', s.fontSize);
  };

  // Initial apply
  applyThemeToDOM(initial);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      applyThemeToDOM(next);
      return next;
    });
  };

  const saveProfile = (name: string) => {
    if (!name.trim()) return;
    const current = { ...settings(), activeProfile: name.trim() };
    setProfiles((prev) => {
      const next = { ...prev, [name.trim()]: current };
      try {
        localStorage.setItem(PROFILES_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    updateSetting('activeProfile', name.trim());
  };

  const switchProfile = (name: string) => {
    const p = profiles()[name];
    if (p) {
      setSettings(p);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
      } catch {
        // ignore
      }
      applyThemeToDOM(p);
    }
  };

  const deleteProfile = (name: string) => {
    if (name === 'Default Workstation') return;
    setProfiles((prev) => {
      const next = { ...prev };
      delete next[name];
      try {
        localStorage.setItem(PROFILES_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  return {
    settings,
    profiles,
    updateSetting,
    saveProfile,
    switchProfile,
    deleteProfile,
    applyThemeToDOM,
  };
}

export const settingsStore = createRoot(createSettingsStore);
