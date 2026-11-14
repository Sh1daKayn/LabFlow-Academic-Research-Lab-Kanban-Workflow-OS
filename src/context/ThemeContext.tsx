'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  AccentColor,
  BgTheme,
  ChineseFontPreset,
  EnglishFontPreset,
  FontSize,
} from '@/types';
import { buildBilingualFontFamily, computeThemeCssVariables } from '@/utils/theme';

const THEME_STORAGE_KEYS = {
  THEME: 'labflow_theme_v3',
  ACCENT: 'labflow_accent_v3',
  BG_STYLE: 'labflow_bg_style_v3',
  FONT_SIZE: 'labflow_font_size_v3',
  ENGLISH_FONT: 'labflow_en_font_v3',
  ENGLISH_CUSTOM_FONT: 'labflow_en_custom_font_v3',
  CHINESE_FONT: 'labflow_zh_font_v3',
  CHINESE_CUSTOM_FONT: 'labflow_zh_custom_font_v3',
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
  englishFont: EnglishFontPreset;
  setEnglishFont: (val: EnglishFontPreset) => void;
  englishCustomFont: string;
  setEnglishCustomFont: (val: string) => void;
  chineseFont: ChineseFontPreset;
  setChineseFont: (val: ChineseFontPreset) => void;
  chineseCustomFont: string;
  setChineseCustomFont: (val: string) => void;
  resetFonts: () => void;
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
  const [englishFont, setEnglishFont] = useState<EnglishFontPreset>('times');
  const [englishCustomFont, setEnglishCustomFont] = useState<string>('');
  const [chineseFont, setChineseFont] = useState<ChineseFontPreset>('yahei-pingfang');
  const [chineseCustomFont, setChineseCustomFont] = useState<string>('');
  const [enableComputeStrip, setEnableComputeStrip] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const resetFonts = useCallback(() => {
    setEnglishFont('times');
    setEnglishCustomFont('');
    setChineseFont('yahei-pingfang');
    setChineseCustomFont('');
  }, []);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEYS.THEME) as 'dark' | 'light' | null;
      const savedAccent = localStorage.getItem(THEME_STORAGE_KEYS.ACCENT) as AccentColor | null;
      const savedBgStyle = localStorage.getItem(THEME_STORAGE_KEYS.BG_STYLE) as BgTheme | null;
      const savedFontSize = localStorage.getItem(THEME_STORAGE_KEYS.FONT_SIZE) as FontSize | null;
      const savedEnFont = localStorage.getItem(
        THEME_STORAGE_KEYS.ENGLISH_FONT
      ) as EnglishFontPreset | null;
      const savedEnCustom = localStorage.getItem(THEME_STORAGE_KEYS.ENGLISH_CUSTOM_FONT);
      const savedZhFont = localStorage.getItem(
        THEME_STORAGE_KEYS.CHINESE_FONT
      ) as ChineseFontPreset | null;
      const savedZhCustom = localStorage.getItem(THEME_STORAGE_KEYS.CHINESE_CUSTOM_FONT);
      const savedCompute = localStorage.getItem(THEME_STORAGE_KEYS.ENABLE_COMPUTE);

      if (savedTheme === 'dark' || savedTheme === 'light') setTheme(savedTheme);
      if (savedAccent) setAccentColor(savedAccent);
      if (savedBgStyle) setBgStyle(savedBgStyle);
      if (savedFontSize) setFontSize(savedFontSize);
      if (savedEnFont) setEnglishFont(savedEnFont);
      if (savedEnCustom !== null) setEnglishCustomFont(savedEnCustom);
      if (savedZhFont) setChineseFont(savedZhFont);
      if (savedZhCustom !== null) setChineseCustomFont(savedZhCustom);
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
      localStorage.setItem(THEME_STORAGE_KEYS.ENGLISH_FONT, englishFont);
      localStorage.setItem(THEME_STORAGE_KEYS.ENGLISH_CUSTOM_FONT, englishCustomFont);
      localStorage.setItem(THEME_STORAGE_KEYS.CHINESE_FONT, chineseFont);
      localStorage.setItem(THEME_STORAGE_KEYS.CHINESE_CUSTOM_FONT, chineseCustomFont);
      localStorage.setItem(
        THEME_STORAGE_KEYS.ENABLE_COMPUTE,
        enableComputeStrip ? 'true' : 'false'
      );
    } catch (e) {
      console.warn('Could not persist theme settings to localStorage', e);
    }
  }, [
    theme,
    accentColor,
    bgStyle,
    fontSize,
    englishFont,
    englishCustomFont,
    chineseFont,
    chineseCustomFont,
    enableComputeStrip,
    isInitialized,
  ]);

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

  useEffect(() => {
    const family = buildBilingualFontFamily(
      englishFont,
      chineseFont,
      englishCustomFont,
      chineseCustomFont
    );
    document.documentElement.style.setProperty('--lab-font-family', family);
  }, [englishFont, chineseFont, englishCustomFont, chineseCustomFont]);

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
        englishFont,
        setEnglishFont,
        englishCustomFont,
        setEnglishCustomFont,
        chineseFont,
        setChineseFont,
        chineseCustomFont,
        setChineseCustomFont,
        resetFonts,
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
