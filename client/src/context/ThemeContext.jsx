import React, { createContext, useContext, useState, useEffect } from 'react';

export const LIGHT_CHART_COLORS = ['#171717', '#525252', '#737373', '#a1a1a1', '#d4d4d4'];
export const DARK_CHART_COLORS = ['#fafafa', '#d4d4d4', '#a1a1a1', '#737373', '#525252'];

export const THEMES = [
  {
    id: 'monochrome',
    name: 'Neutral Monochrome',
    tagline: 'Minimalist Black, White & Neutral Gray',
    category: 'Minimal',
    primary: '#171717',
    primaryHover: '#262626',
    primaryLight: '#f5f5f5',
    primaryText: '#0a0a0a',
    primaryBorder: '#e5e5e5',
    accent: '#737373',
    gradientFrom: '#171717',
    gradientTo: '#262626',
    glow: 'rgba(0, 0, 0, 0.08)',
    badgeBg: 'bg-neutral-100 text-neutral-900 border-neutral-300',
    swatches: ['#0a0a0a', '#525252', '#a1a1a1'],
    accentRing: 'ring-neutral-400/30',
  },
  {
    id: 'charcoal',
    name: 'Charcoal Minimal',
    tagline: 'Refined Dark Carbon & Pure White',
    category: 'Minimal',
    primary: '#171717',
    primaryHover: '#262626',
    primaryLight: '#f5f5f5',
    primaryText: '#0a0a0a',
    primaryBorder: '#e5e5e5',
    accent: '#525252',
    gradientFrom: '#171717',
    gradientTo: '#262626',
    glow: 'rgba(0, 0, 0, 0.08)',
    badgeBg: 'bg-neutral-100 text-neutral-900 border-neutral-300',
    swatches: ['#171717', '#404040', '#737373'],
    accentRing: 'ring-neutral-400/30',
  },
];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [currentThemeId, setCurrentThemeId] = useState(() => {
    try {
      return localStorage.getItem('campuscorp_theme') || 'monochrome';
    } catch {
      return 'monochrome';
    }
  });

  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem('campuscorp_theme_mode');
      if (saved) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  const currentTheme = THEMES.find((t) => t.id === currentThemeId) || THEMES[0];

  useEffect(() => {
    try {
      localStorage.setItem('campuscorp_theme', currentTheme.id);
    } catch (e) {
      console.warn('Could not persist theme to localStorage', e);
    }

    const root = document.documentElement;
    root.setAttribute('data-theme', currentTheme.id);
    root.style.setProperty('--theme-primary', isDark ? '#fafafa' : '#171717');
    root.style.setProperty('--theme-primary-hover', isDark ? '#e5e5e5' : '#262626');
    root.style.setProperty('--theme-primary-light', isDark ? '#262626' : '#f5f5f5');
    root.style.setProperty('--theme-primary-text', isDark ? '#fafafa' : '#0a0a0a');
    root.style.setProperty('--theme-primary-border', isDark ? 'rgba(255,255,255,0.10)' : '#e5e5e5');
    root.style.setProperty('--theme-gradient-from', '#171717');
    root.style.setProperty('--theme-gradient-to', '#262626');
    root.style.setProperty('--theme-accent', isDark ? '#a1a1a1' : '#737373');
    root.style.setProperty('--theme-glow', isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)');
  }, [currentTheme, isDark]);

  useEffect(() => {
    try {
      localStorage.setItem('campuscorp_theme_mode', isDark ? 'dark' : 'light');
    } catch (e) {
      console.warn('Could not persist theme mode to localStorage', e);
    }

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const setTheme = (themeId) => {
    if (THEMES.some((t) => t.id === themeId)) {
      setCurrentThemeId(themeId);
    }
  };

  const toggleDarkMode = () => {
    setIsDark((prev) => !prev);
  };

  const setDarkMode = (val) => {
    setIsDark(Boolean(val));
  };

  const chartColors = isDark ? DARK_CHART_COLORS : LIGHT_CHART_COLORS;

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        setTheme,
        themes: THEMES,
        isDark,
        darkMode: isDark,
        toggleDarkMode,
        setDarkMode,
        chartColors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
