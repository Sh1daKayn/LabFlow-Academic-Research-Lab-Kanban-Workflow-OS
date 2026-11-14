'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AccentColor, BgTheme, FontSize } from '@/types';
import { computeThemeCssVariables } from '@/utils/theme';

const THEME_STORAGE_KEYS = {
  THEME: 'labflow_theme_v3',
  ACCENT: 'labflow_accent_v3',
  BG_STYLE: 'labflow_bg_style_v3',
  FONT_SIZE: 'labflow_font_size_v3',
  ENABLE_COMPUTE: 'labflow_enable_compute_v3',
};

export interface ThemeContextType {
  theme: 'dark' | 'light';
  setTheme: (val: 'dark' | 'light') => void;
  accentColor: AccentColor;
  setAccentColor: (val: AccentColor) => void;
  bgStyle: BgTheme;
  setBgStyle: (val: BgTheme) => void;
  fontSize: FontSize;
  setFontSize: (val: FontSize) => void;
  enableComputeStrip: boolean;
  setEnableComputeStrip: (val: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Manages theme polarity, accent HSL CSS variables, background style,
 * font scaling, and compute strip visibility independently of domain data.
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [accentColor, setAccentColor] = useState<AccentColor>('indigo');
  const [bgStyle, setBgStyle] = useState<BgTheme>('default');
  const [fontSize, setFontSize] = useState<FontSize>('standard');
  const [enableComputeStrip, setEnableComputeStrip] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEYS.THEME) as 'dark' | 'light' | null;
      const savedAccent = localStorage.getItem(THEME_STORAGE_KEYS.ACCENT) as AccentColor | null;
      const savedBgStyle = localStorage.getItem(THEME_STORAGE_KEYS.BG_STYLE) as BgTheme | null;
      const savedFontSize = localStorage.getItem(THEME_STORAGE_KEYS.FONT_SIZE) as FontSize | null;
      const savedCompute = localStorage.getItem(THEME_STORAGE_KEYS.ENABLE_COMPUTE);

      if (savedTheme === 'dark' || savedTheme === 'light') setTheme(savedTheme);
      if (savedAccent) setAccentColor(savedAccent);
      if (savedBgStyle) setBgStyle(savedBgStyle);
      if (savedFontSize) setFontSize(savedFontSize);
      if (savedCompute !== null) setEnableComputeStrip(savedCompute === 'true');
    } catch (e) {
      console.warn('Could not read theme settings from localStorage', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(THEME_STORAGE_KEYS.THEME, theme);
      localStorage.setItem(THEME_STORAGE_KEYS.ACCENT, accentColor);
      localStorage.setItem(THEME_STORAGE_KEYS.BG_STYLE, bgStyle);
      localStorage.setItem(THEME_STORAGE_KEYS.FONT_SIZE, fontSize);
      localStorage.setItem(
        THEME_STORAGE_KEYS.ENABLE_COMPUTE,
        enableComputeStrip ? 'true' : 'false'
      );
    } catch (e) {
      console.warn('Could not persist theme settings to localStorage', e);
    }
  }, [theme, accentColor, bgStyle, fontSize, enableComputeStrip, isInitialized]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accentColor);
    const vars = computeThemeCssVariables(accentColor);
    for (const [key, value] of Object.entries(vars)) {
      document.documentElement.style.setProperty(key, value);
    }
  }, [accentColor]);

  useEffect(() => {
    document.documentElement.setAttribute('data-bg', bgStyle);
  }, [bgStyle]);

  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize);
  }, [fontSize]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        accentColor,
        setAccentColor,
        bgStyle,
        setBgStyle,
        fontSize,
        setFontSize,
        enableComputeStrip,
        setEnableComputeStrip,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useLabTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useLabTheme must be used within a ThemeProvider');
  return ctx;
};
