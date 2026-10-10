import React, { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = [
  {
    id: 'blue',
    name: 'Uniserve Blue',
    tagline: 'Classic Academic Cobalt & Sapphire',
    category: 'Institutional',
    primary: '#2563eb', // blue-600
    primaryHover: '#1d4ed8', // blue-700
    primaryLight: '#eff6ff', // blue-50
    primaryText: '#1d4ed8',
    primaryBorder: '#bfdbfe', // blue-200
    accent: '#38bdf8', // sky-400
    gradientFrom: '#1e40af', // blue-800
    gradientTo: '#4338ca', // indigo-700
    glow: 'rgba(37, 99, 235, 0.35)',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    swatches: ['#1e40af', '#2563eb', '#60a5fa'],
    accentRing: 'ring-blue-500/30',
  },
  {
    id: 'emerald',
    name: 'Emerald Horizon',
    tagline: 'Deep Forest Green & Fresh Botanical Mint',
    category: 'Growth & Nature',
    primary: '#059669', // emerald-600
    primaryHover: '#047857', // emerald-700
    primaryLight: '#ecfdf5', // emerald-50
    primaryText: '#047857',
    primaryBorder: '#a7f3d0', // emerald-200
    accent: '#34d399', // emerald-400
    gradientFrom: '#064e3b', // emerald-900
    gradientTo: '#0f766e', // teal-700
    glow: 'rgba(5, 150, 105, 0.35)',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    swatches: ['#064e3b', '#059669', '#34d399'],
    accentRing: 'ring-emerald-500/30',
  },
  {
    id: 'violet',
    name: 'Royal Violet',
    tagline: 'Regal Amethyst Purple & Ultraviolet Hues',
    category: 'Prestige & Innovation',
    primary: '#7c3aed', // violet-600
    primaryHover: '#6d28d9', // violet-700
    primaryLight: '#f5f3ff', // violet-50
    primaryText: '#6d28d9',
    primaryBorder: '#ddd6fe', // violet-200
    accent: '#c084fc', // purple-400
    gradientFrom: '#581c87', // purple-900
    gradientTo: '#7e22ce', // purple-700
    glow: 'rgba(124, 58, 237, 0.35)',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
    swatches: ['#581c87', '#7c3aed', '#c084fc'],
    accentRing: 'ring-purple-500/30',
  },
  {
    id: 'crimson',
    name: 'Crimson Ruby',
    tagline: 'Passionate Scarlet Red & Rose Highlights',
    category: 'Bold & Dynamic',
    primary: '#e11d48', // rose-600
    primaryHover: '#be123c', // rose-700
    primaryLight: '#fff1f2', // rose-50
    primaryText: '#be123c',
    primaryBorder: '#fecdd3', // rose-200
    accent: '#fb7185', // rose-400
    gradientFrom: '#881337', // rose-900
    gradientTo: '#e11d48', // rose-600
    glow: 'rgba(225, 29, 72, 0.35)',
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
    swatches: ['#881337', '#e11d48', '#fb7185'],
    accentRing: 'ring-rose-500/30',
  },
  {
    id: 'amber',
    name: 'Amber Sunset',
    tagline: 'Warm Radiant Honey Gold & Scorched Amber',
    category: 'Warmth & Executive',
    primary: '#d97706', // amber-600
    primaryHover: '#b45309', // amber-700
    primaryLight: '#fffbeb', // amber-50
    primaryText: '#b45309',
    primaryBorder: '#fde68a', // amber-200
    accent: '#fbbf24', // amber-400
    gradientFrom: '#78350f', // amber-900
    gradientTo: '#ea580c', // orange-600
    glow: 'rgba(217, 119, 6, 0.35)',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    swatches: ['#78350f', '#d97706', '#fcd34d'],
    accentRing: 'ring-amber-500/30',
  },
  {
    id: 'cyber',
    name: 'Cyber Slate',
    tagline: 'Futuristic Metallic Slate & Electric Cyan',
    category: 'High-Tech Precision',
    primary: '#0284c7', // sky-600
    primaryHover: '#0369a1', // sky-700
    primaryLight: '#f0f9ff', // sky-50
    primaryText: '#0369a1',
    primaryBorder: '#bae6fd', // sky-200
    accent: '#38bdf8', // sky-400
    gradientFrom: '#0f172a', // slate-900
    gradientTo: '#0369a1', // sky-700
    glow: 'rgba(2, 132, 199, 0.35)',
    badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
    swatches: ['#0f172a', '#0284c7', '#38bdf8'],
    accentRing: 'ring-sky-500/30',
  },
  {
    id: 'nordic',
    name: 'Nordic Indigo',
    tagline: 'Deep Midnight Sky & Radiant Periwinkle',
    category: 'Minimalist Focus',
    primary: '#4338ca', // indigo-700
    primaryHover: '#3730a3', // indigo-800
    primaryLight: '#eef2ff', // indigo-50
    primaryText: '#3730a3',
    primaryBorder: '#c7d2fe', // indigo-200
    accent: '#818cf8', // indigo-400
    gradientFrom: '#1e1b4b', // indigo-950
    gradientTo: '#4338ca', // indigo-700
    glow: 'rgba(67, 56, 202, 0.35)',
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    swatches: ['#1e1b4b', '#4338ca', '#818cf8'],
    accentRing: 'ring-indigo-500/30',
  },
];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [currentThemeId, setCurrentThemeId] = useState(() => {
    try {
      return localStorage.getItem('uniserve_theme') || 'blue';
    } catch {
      return 'blue';
    }
  });

  const currentTheme = THEMES.find((t) => t.id === currentThemeId) || THEMES[0];

  useEffect(() => {
    try {
      localStorage.setItem('uniserve_theme', currentTheme.id);
    } catch (e) {
      console.warn('Could not persist theme to localStorage', e);
    }

    const root = document.documentElement;
    root.setAttribute('data-theme', currentTheme.id);
    root.style.setProperty('--theme-primary', currentTheme.primary);
    root.style.setProperty('--theme-primary-hover', currentTheme.primaryHover);
    root.style.setProperty('--theme-primary-light', currentTheme.primaryLight);
    root.style.setProperty('--theme-primary-text', currentTheme.primaryText);
    root.style.setProperty('--theme-primary-border', currentTheme.primaryBorder);
    root.style.setProperty('--theme-gradient-from', currentTheme.gradientFrom);
    root.style.setProperty('--theme-gradient-to', currentTheme.gradientTo);
    root.style.setProperty('--theme-accent', currentTheme.accent);
    root.style.setProperty('--theme-glow', currentTheme.glow);
  }, [currentTheme]);

  const setTheme = (themeId) => {
    if (THEMES.some((t) => t.id === themeId)) {
      setCurrentThemeId(themeId);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        setTheme,
        themes: THEMES,
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
