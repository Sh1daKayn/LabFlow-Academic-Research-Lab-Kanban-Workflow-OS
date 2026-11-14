'use client';

import React from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import { AccentColor, BgTheme, FontSize } from '@/types';
import { Check, Moon, Palette, Pipette, Sun } from 'lucide-react';

const ACCENT_OPTIONS: { id: AccentColor; nameZh: string; nameEn: string; color: string }[] = [
  { id: 'purdue', nameZh: '黑金', nameEn: 'Black Gold', color: '#C28E0E' },
  { id: 'oxford', nameZh: '深蓝', nameEn: 'Deep Blue', color: '#1e40af' },
  { id: 'cardinal', nameZh: '深红', nameEn: 'Deep Red', color: '#8c1515' },
  { id: 'cambridge', nameZh: '青绿', nameEn: 'Teal Green', color: '#0f766e' },
  { id: 'crimson', nameZh: '酒红', nameEn: 'Crimson', color: '#991b1b' },
  { id: 'indigo', nameZh: '经典蓝紫', nameEn: 'Classic Indigo', color: '#6366f1' },
  { id: 'cyan', nameZh: '计算青', nameEn: 'Cyan', color: '#06b6d4' },
  { id: 'emerald', nameZh: '翠绿', nameEn: 'Emerald Green', color: '#10b981' },
  { id: 'amber', nameZh: '琥珀金', nameEn: 'Amber Gold', color: '#f59e0b' },
  { id: 'rose', nameZh: '玫瑰红', nameEn: 'Rose Red', color: '#f43f5e' },
  { id: 'violet', nameZh: '深紫', nameEn: 'Deep Violet', color: '#8b5cf6' },
];

const COLOR_SWATCHES = [
  { hex: '#C28E0E', nameZh: '黑金', nameEn: 'Black Gold' },
  { hex: '#002147', nameZh: '深蓝', nameEn: 'Deep Blue' },
  { hex: '#8C1515', nameZh: '深红', nameEn: 'Deep Red' },
  { hex: '#A51C30', nameZh: '酒红', nameEn: 'Wine Red' },
  { hex: '#00356B', nameZh: '藏青', nameEn: 'Navy Blue' },
  { hex: '#E77500', nameZh: '暖橙', nameEn: 'Warm Orange' },
  { hex: '#003262', nameZh: '宝石蓝', nameEn: 'Sapphire Blue' },
  { hex: '#0F766E', nameZh: '松青', nameEn: 'Teal' },
  { hex: '#6366F1', nameZh: '蓝紫', nameEn: 'Indigo' },
  { hex: '#06B6D4', nameZh: '青色', nameEn: 'Cyan' },
  { hex: '#059669', nameZh: '翠绿', nameEn: 'Emerald' },
  { hex: '#D97706', nameZh: '琥珀', nameEn: 'Amber' },
  { hex: '#E11D48', nameZh: '茜红', nameEn: 'Rose' },
  { hex: '#7C3AED', nameZh: '深紫', nameEn: 'Violet' },
];

const BG_OPTIONS: { id: BgTheme; nameZh: string; nameEn: string; descZh: string; descEn: string }[] = [
  {
    id: 'default',
    nameZh: '科研深灰',
    nameEn: 'Slate Scientific',
    descZh: '经典学术高阶灰度，沉浸护眼',
    descEn: 'High-contrast subtle dark slate',
  },
  {
    id: 'oled',
    nameZh: '极客纯黑',
    nameEn: 'Pure OLED Black',
    descZh: '深邃纯黑底色，硬件原色对比极高',
    descEn: 'Zero backlight deep black',
  },
  {
    id: 'warm',
    nameZh: '素雅微暖',
    nameEn: 'Warm Paper Tone',
    descZh: '柔和纸本微温色调，舒适耐读',
    descEn: 'Soft organic paper warmth',
  },
];

export const AppearanceTab: React.FC = () => {
  const {
    theme,
    setTheme,
    accentColor,
    setAccentColor,
    bgStyle,
    setBgStyle,
    fontSize,
    setFontSize,
    language,
    t,
  } = useLabFlow();

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
          {t.themeMode}
        </h3>
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
              theme === 'light'
                ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-600 ring-2 ring-indigo-500/30'
                : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold block">{t.themeLight}</span>
              <span className="text-[11px] text-slate-500">Notion 优雅白昼基调</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
              theme === 'dark'
                ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-600 ring-2 ring-indigo-500/30'
                : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold block">{t.themeDark}</span>
              <span className="text-[11px] text-slate-500">Linear 极客沉浸深色</span>
            </div>
          </button>
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {t.accentColor}
          </h3>
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
            {language === 'zh' ? '即时全局生效' : 'Applies Instantly'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {ACCENT_OPTIONS.map((opt) => {
            const isSelected = accentColor === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setAccentColor(opt.id)}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-sm'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                  style={{ backgroundColor: opt.color }}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <span className="text-xs font-medium truncate">
                  {language === 'zh' ? opt.nameZh : opt.nameEn}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-indigo-500" />
              {language === 'zh' ? '经典色卡直接点选' : 'Color Palette Swatches'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">{accentColor}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {COLOR_SWATCHES.map((swatch) => {
              const isMatch = accentColor.toLowerCase() === swatch.hex.toLowerCase();
              return (
                <button
                  key={swatch.hex}
                  type="button"
                  onClick={() => setAccentColor(swatch.hex)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                    isMatch
                      ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-900 scale-110 shadow-sm'
                      : 'hover:scale-105 opacity-90 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: swatch.hex }}
                  title={`${language === 'zh' ? swatch.nameZh : swatch.nameEn} (${swatch.hex})`}
                >
                  {isMatch && <Check className="w-3 h-3 text-white drop-shadow" />}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
            <div className="relative flex items-center">
              <input
                type="color"
                id="custom-accent-color-picker"
                value={accentColor.startsWith('#') ? accentColor : '#6366f1'}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
              />
            </div>
            <label
              htmlFor="custom-accent-color-picker"
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer flex items-center gap-1 font-medium"
            >
              <Pipette className="w-3.5 h-3.5" />
              <span>{language === 'zh' ? '打开拾色器自定义' : 'Custom Color Dropper'}</span>
            </label>
            <input
              type="text"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              placeholder="#C28E0E"
              className="w-24 ml-auto text-xs font-mono uppercase bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
          {t.bgStyle}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {BG_OPTIONS.map((bg) => {
            const isSelected = bgStyle === bg.id;
            return (
              <button
                key={bg.id}
                type="button"
                onClick={() => setBgStyle(bg.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-sm'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">
                    {language === 'zh' ? bg.nameZh : bg.nameEn}
                  </span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500">
                  {language === 'zh' ? bg.descZh : bg.descEn}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {t.fontSize}
          </h3>
          <span className="text-[11px] text-slate-500 font-serif">
            Times New Roman · Publication Standard
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2.5 max-w-md">
          {(['compact', 'standard', 'large'] as FontSize[]).map((size) => {
            const isSelected = fontSize === size;
            const labels = {
              compact: 'Compact',
              standard: 'Standard',
              large: 'Large',
            };
            return (
              <button
                key={size}
                type="button"
                onClick={() => setFontSize(size)}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-950/20 font-bold'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <span className="text-xs block">
                  {language === 'zh'
                    ? size === 'compact'
                      ? '紧凑'
                      : size === 'standard'
                      ? '标准'
                      : '大号'
                    : labels[size]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
