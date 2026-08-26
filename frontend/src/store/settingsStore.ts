import { createSignal, createRoot } from 'solid-js';

export type ThemeMode = 'system' | 'dark' | 'light' | 'oled' | 'custom';
export type AccentColor = 'indigo' | 'emerald' | 'cyan' | 'purple' | 'amber' | 'custom';
export type FontFamily = 'Inter' | 'JetBrains Mono' | 'Fira Code' | 'Ubuntu Mono' | 'Cascadia Code' | 'Hack' | 'system-ui' | 'custom';

export interface AppearanceProfile {
  name: string;
  themeMode: ThemeMode;
  accentColor: AccentColor;
  customAccentHex?: string;
  customBgHex?: string;
  customSurfaceHex?: string;
  fontFamily: FontFamily;
  customFontName?: string;
  densityPx: number; // 10 to 16px
}

export interface AppSettings extends AppearanceProfile {
  autoFetchInterval: string;
  workerConcurrency: number;
  skipDirtyByDefault: boolean;
  activeAppearanceProfile: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  name: 'Default Dark',
  themeMode: 'system',
  accentColor: 'indigo',
  customAccentHex: '#6366F1',
  customBgHex: '#0F1117',
  customSurfaceHex: '#161922',
  fontFamily: 'Inter',
  customFontName: '',
  densityPx: 12,
  autoFetchInterval: '10m',
  workerConcurrency: 6,
  skipDirtyByDefault: true,
  activeAppearanceProfile: 'Default Dark',
};

const STORAGE_KEY = 'onogitree_settings_v2';
const PROFILES_KEY = 'onogitree_appearance_profiles_v2';

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

  const loadSavedProfiles = (): Record<string, AppearanceProfile> => {
    try {
      const data = localStorage.getItem(PROFILES_KEY);
      if (data) return JSON.parse(data);
    } catch {
      // ignore
    }
    return {
      'Default Dark': {
        name: 'Default Dark',
        themeMode: 'system',
        accentColor: 'indigo',
        customAccentHex: '#6366F1',
        customBgHex: '#0F1117',
        customSurfaceHex: '#161922',
        fontFamily: 'Inter',
        densityPx: 12,
      },
      'JetBrains Carbon': {
        name: 'JetBrains Carbon',
        themeMode: 'dark',
        accentColor: 'emerald',
        customAccentHex: '#10B981',
        customBgHex: '#0B0D13',
        customSurfaceHex: '#141824',
        fontFamily: 'JetBrains Mono',
        densityPx: 11,
      },
      'OLED Midnight': {
        name: 'OLED Midnight',
        themeMode: 'oled',
        accentColor: 'cyan',
        customAccentHex: '#06B6D4',
        customBgHex: '#000000',
        customSurfaceHex: '#0A0A0A',
        fontFamily: 'Fira Code',
        densityPx: 12,
      },
      'Solarized Light': {
        name: 'Solarized Light',
        themeMode: 'light',
        accentColor: 'amber',
        customAccentHex: '#F59E0B',
        customBgHex: '#F8FAFC',
        customSurfaceHex: '#FFFFFF',
        fontFamily: 'Inter',
        densityPx: 13,
      },
    };
  };

  const initial = loadSavedSettings();
  const [settings, setSettings] = createSignal<AppSettings>(initial);
  const [profiles, setProfiles] = createSignal<Record<string, AppearanceProfile>>(loadSavedProfiles());

  const applyThemeToDOM = (s: AppSettings) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Reset theme classes
    root.classList.remove('theme-dark', 'theme-light', 'theme-oled', 'theme-custom');

    let effectiveTheme = s.themeMode;
    if (effectiveTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = prefersDark ? 'dark' : 'light';
    }

    root.classList.add(`theme-${effectiveTheme}`);

    // Font attribute
    const font = s.fontFamily === 'custom' && s.customFontName ? s.customFontName : s.fontFamily;
    root.style.setProperty('--app-font-family', s.fontFamily === 'system-ui' ? 'system-ui, sans-serif' : `'${font}', monospace, sans-serif`);
    root.setAttribute('data-font', font);

    // Font density
    root.style.fontSize = `${s.densityPx}px`;

    // Custom Colors
    if (s.themeMode === 'custom') {
      if (s.customBgHex) root.style.setProperty('--custom-bg', s.customBgHex);
      if (s.customSurfaceHex) root.style.setProperty('--custom-surface', s.customSurfaceHex);
    } else {
      root.style.removeProperty('--custom-bg');
      root.style.removeProperty('--custom-surface');
    }

    if (s.accentColor === 'custom' && s.customAccentHex) {
      root.style.setProperty('--custom-accent', s.customAccentHex);
    } else {
      root.style.removeProperty('--custom-accent');
    }
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

  const saveAppearanceProfile = (name: string) => {
    if (!name.trim()) return;
    const s = settings();
    const newProfile: AppearanceProfile = {
      name: name.trim(),
      themeMode: s.themeMode,
      accentColor: s.accentColor,
      customAccentHex: s.customAccentHex,
      customBgHex: s.customBgHex,
      customSurfaceHex: s.customSurfaceHex,
      fontFamily: s.fontFamily,
      customFontName: s.customFontName,
      densityPx: s.densityPx,
    };

    setProfiles((prev) => {
      const next = { ...prev, [name.trim()]: newProfile };
      try {
        localStorage.setItem(PROFILES_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    updateSetting('activeAppearanceProfile', name.trim());
  };

  const loadAppearanceProfile = (name: string) => {
    const p = profiles()[name];
    if (p) {
      setSettings((prev) => {
        const next: AppSettings = {
          ...prev,
          themeMode: p.themeMode,
          accentColor: p.accentColor,
          customAccentHex: p.customAccentHex || prev.customAccentHex,
          customBgHex: p.customBgHex || prev.customBgHex,
          customSurfaceHex: p.customSurfaceHex || prev.customSurfaceHex,
          fontFamily: p.fontFamily,
          customFontName: p.customFontName || prev.customFontName,
          densityPx: p.densityPx || prev.densityPx,
          activeAppearanceProfile: name,
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        applyThemeToDOM(next);
        return next;
      });
    }
  };

  const deleteAppearanceProfile = (name: string) => {
    if (name === 'Default Dark') return;
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
    saveAppearanceProfile,
    loadAppearanceProfile,
    deleteAppearanceProfile,
    applyThemeToDOM,
  };
}

export const settingsStore = createRoot(createSettingsStore);
