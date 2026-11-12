'use client';

import React, { useState, useRef } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import {
  Settings,
  X,
  Palette,
  Users,
  Server,
  Layers,
  Bookmark,
  Database,
  Sun,
  Moon,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  Download,
  Upload,
  UserPlus,
  CheckCircle,
  Cpu,
  Monitor,
  Lock,
  KeyRound,
  Sparkles,
  Pipette,
} from 'lucide-react';
import {
  AccentColor,
  AccessRole,
  BgTheme,
  SettingsTab,
  LabMember,
  ResourceType,
  FontSize,
} from '@/types';

const ACCENT_OPTIONS: { id: AccentColor; nameZh: string; nameEn: string; color: string; border: string; bg: string }[] = [
  { id: 'purdue', nameZh: '黑金', nameEn: 'Black Gold', color: '#C28E0E', border: 'border-amber-600', bg: 'bg-[#C28E0E]' },
  { id: 'oxford', nameZh: '深蓝', nameEn: 'Deep Blue', color: '#1e40af', border: 'border-blue-700', bg: 'bg-blue-800' },
  { id: 'cardinal', nameZh: '深红', nameEn: 'Deep Red', color: '#8c1515', border: 'border-red-800', bg: 'bg-[#8c1515]' },
  { id: 'cambridge', nameZh: '青绿', nameEn: 'Teal Green', color: '#0f766e', border: 'border-teal-700', bg: 'bg-teal-700' },
  { id: 'crimson', nameZh: '酒红', nameEn: 'Crimson', color: '#991b1b', border: 'border-red-900', bg: 'bg-[#991b1b]' },
  { id: 'indigo', nameZh: '经典蓝紫', nameEn: 'Classic Indigo', color: '#6366f1', border: 'border-indigo-500', bg: 'bg-indigo-600' },
  { id: 'cyan', nameZh: '计算青', nameEn: 'Cyan', color: '#06b6d4', border: 'border-cyan-500', bg: 'bg-cyan-600' },
  { id: 'emerald', nameZh: '翠绿', nameEn: 'Emerald Green', color: '#10b981', border: 'border-emerald-500', bg: 'bg-emerald-600' },
  { id: 'amber', nameZh: '琥珀金', nameEn: 'Amber Gold', color: '#f59e0b', border: 'border-amber-500', bg: 'bg-amber-600' },
  { id: 'rose', nameZh: '玫瑰红', nameEn: 'Rose Red', color: '#f43f5e', border: 'border-rose-500', bg: 'bg-rose-600' },
  { id: 'violet', nameZh: '深紫', nameEn: 'Deep Violet', color: '#8b5cf6', border: 'border-violet-500', bg: 'bg-violet-600' },
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
  { id: 'default', nameZh: '科研深灰', nameEn: 'Slate Scientific', descZh: '经典学术高阶灰度，沉浸护眼', descEn: 'High-contrast subtle dark slate' },
  { id: 'oled', nameZh: '极客纯黑', nameEn: 'Pure OLED Black', descZh: '深邃纯黑底色，硬件原色对比极高', descEn: 'Zero backlight deep black' },
  { id: 'warm', nameZh: '素雅微暖', nameEn: 'Warm Paper Tone', descZh: '柔和纸本微温色调，舒适耐读', descEn: 'Soft organic paper warmth' },
];

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    setIsAIImportOpen,
    activeSettingsTab,
    setActiveSettingsTab,
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
    members,
    currentUserId,
    setCurrentUserId,
    addMember,
    updateMember,
    deleteMember,
    effectiveIsAdmin,
    requireAdminAuth,
    updateAdminPassword,
    resources,
    addResource,
    deleteResource,
    updateResource,
    stages,
    addStage,
    deleteStage,
    restoreDefaultStages,
    venues,
    deleteVenue,
    exportDataBackup,
    importDataBackup,
    resetToMockData,
    cleanSlateWipe,
    language,
    t,
  } = useLabFlow();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Member Form State
  const [newMemberNameZh, setNewMemberNameZh] = useState('');
  const [newMemberNameEn, setNewMemberNameEn] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<LabMember['role']>('PHD_CANDIDATE');
  const [newMemberTitle, setNewMemberTitle] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');

  // New Resource Form State
  const [newResNameZh, setNewResNameZh] = useState('');
  const [newResNameEn, setNewResNameEn] = useState('');
  const [newResType, setNewResType] = useState<ResourceType>('GPU');
  const [newResSpecs, setNewResSpecs] = useState('');

  // New Stage Form State
  const [newStageNameZh, setNewStageNameZh] = useState('');
  const [newStageNameEn, setNewStageNameEn] = useState('');

  // Admin password change state
  const [newAdminPass, setNewAdminPass] = useState('');

  if (!isSettingsOpen) return null;

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberNameZh.trim() && !newMemberNameEn.trim()) return;
    const newId = `member-${Date.now()}`;
    addMember({
      id: newId,
      nameZh: newMemberNameZh.trim() || newMemberNameEn.trim(),
      nameEn: newMemberNameEn.trim() || newMemberNameZh.trim(),
      role: newMemberRole,
      titleZh: newMemberTitle.trim() || '课题组成员',
      titleEn: newMemberTitle.trim() || 'Researcher',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      email: newMemberEmail.trim() || `${newId}@labflow.edu`,
    });
    setNewMemberNameZh('');
    setNewMemberNameEn('');
    setNewMemberTitle('');
    setNewMemberEmail('');
  };

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResNameZh.trim() && !newResNameEn.trim()) return;
    const newId = `res-${Date.now()}`;
    addResource({
      id: newId,
      nameZh: newResNameZh.trim() || newResNameEn.trim(),
      nameEn: newResNameEn.trim() || newResNameZh.trim(),
      type: newResType,
      specs: newResSpecs.trim() || 'Shared Lab Instrument / Server',
      status: 'IDLE',
    });
    setNewResNameZh('');
    setNewResNameEn('');
    setNewResSpecs('');
  };

  const handleAddStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageNameZh.trim() && !newStageNameEn.trim()) return;
    const newId = `STAGE_${Date.now()}`;
    addStage({
      id: newId,
      labelZh: newStageNameZh.trim() || newStageNameEn.trim(),
      labelEn: newStageNameEn.trim() || newStageNameZh.trim(),
      color: 'text-indigo-400',
      badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      borderColor: 'border-indigo-500/30',
    });
    setNewStageNameZh('');
    setNewStageNameEn('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importDataBackup(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'appearance', label: t.tabAppearance, icon: <Palette className="w-4 h-4" /> },
    { id: 'members', label: t.tabMembers, icon: <Users className="w-4 h-4" /> },
    { id: 'resources', label: t.tabResources, icon: <Server className="w-4 h-4" /> },
    { id: 'stages', label: t.tabStages, icon: <Layers className="w-4 h-4" /> },
    { id: 'venues', label: t.tabVenues, icon: <Bookmark className="w-4 h-4" /> },
    { id: 'backup', label: t.tabBackup, icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[88vh] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {t.settingsCenter}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.settingsCenterDesc}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Left Sidebar Tabs + Right Content Panel */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* Left Tab Sidebar */}
          <div className="w-full sm:w-56 shrink-0 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-800 p-2.5 sm:p-4 space-y-1 bg-slate-50/60 dark:bg-slate-950/50 overflow-x-auto sm:overflow-y-auto flex sm:flex-col gap-1 sm:gap-0">
            {tabs.map((tab) => {
              const isActive = activeSettingsTab === tab.id;
              const isRestricted = tab.id !== 'appearance' && !effectiveIsAdmin;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (isRestricted) {
                      requireAdminAuth(() => setActiveSettingsTab(tab.id));
                    } else {
                      setActiveSettingsTab(tab.id);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 text-left ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {tab.icon}
                    <span>{tab.label}</span>
                  </div>
                  {isRestricted && (
                    <span className="p-1 rounded text-amber-500 opacity-80" title={t.requireAdminNotice}>
                      <Lock className="w-3 h-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Content Panel */}
          <div className="flex-1 p-5 sm:p-7 overflow-y-auto space-y-6">
            {/* ================================================================= */}
            {/* TAB 1: APPEARANCE & THEMES */}
            {/* ================================================================= */}
            {activeSettingsTab === 'appearance' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Display Mode */}
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

                {/* Accent Colors Palette */}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {t.accentColor}
                    </h3>
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                      即时全局生效
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

                  {/* Direct Color Swatches Palette (色卡选择与自定义拾色器) */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-indigo-500" />
                        {language === 'zh' ? '经典色卡直接点选' : 'Color Palette Swatches'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {accentColor}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {COLOR_SWATCHES.map((swatch) => {
                        const isMatch =
                          accentColor.toLowerCase() === swatch.hex.toLowerCase();
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

                    {/* Custom Hex Color Dropper / Picker */}
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

                {/* Background Tone Styling */}
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
                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                          </div>
                          <p className="text-[10px] text-slate-500">
                            {language === 'zh' ? bg.descZh : bg.descEn}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Font Size & Typography */}
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
                        compact: { zh: '紧凑版 (Compact)', en: 'Compact' },
                        standard: { zh: '标准版 (Standard)', en: 'Standard' },
                        large: { zh: '大号 (Large)', en: 'Large' },
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
                            {language === 'zh' ? (size === 'compact' ? '紧凑' : size === 'standard' ? '标准' : '大号') : labels[size].en}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* TAB 2: MEMBERS & USERS */}
            {/* ================================================================= */}
            {activeSettingsTab === 'members' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {t.allMembers} ({members.length})
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{t.memberManagerDesc}</p>
                  </div>
                </div>

                {/* Members List */}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {members.map((m) => {
                    const isCurrent = currentUserId === m.id;
                    const displayName = language === 'zh' ? m.nameZh : m.nameEn;
                    const displayTitle = language === 'zh' ? m.titleZh : m.titleEn;

                    return (
                      <div
                        key={m.id}
                        className={`flex items-center justify-between gap-3 p-3 rounded-xl border text-xs transition-all ${
                          isCurrent
                            ? 'bg-cyan-50/50 dark:bg-cyan-950/30 border-cyan-500/50 shadow-sm'
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-cyan-600 dark:text-cyan-400 shrink-0">
                            {displayName.slice(0, 2)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                {displayName}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono">
                                [{m.role}]
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40 font-semibold flex items-center gap-0.5">
                                  <CheckCircle className="w-2.5 h-2.5" />
                                  {language === 'zh' ? '我本人' : 'Active User'}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 truncate">
                              {displayTitle} · {m.email}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Access Role Selector */}
                          <select
                            value={m.accessRole || (m.role === 'PI' ? 'ADMIN_PI' : 'STUDENT_RA')}
                            onChange={(e) => updateMember(m.id, { accessRole: e.target.value as AccessRole })}
                            className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-800 dark:text-slate-200 font-semibold focus:outline-none"
                          >
                            <option value="ADMIN_PI">👑 {t.roleAdminPI}</option>
                            <option value="PROJECT_LEAD">🔬 {t.roleProjectLead}</option>
                            <option value="STUDENT_RA">🧑‍💻 {t.roleStudentRA}</option>
                            <option value="AUDITOR_GUEST">👁️ {t.roleAuditorGuest}</option>
                          </select>

                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => setCurrentUserId(m.id)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-cyan-700 dark:text-cyan-300 text-[11px] font-medium transition-colors"
                            >
                              {t.setAsActiveUser}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(language === 'zh' ? `确认移除 ${displayName} 吗？` : `Remove ${displayName}?`)) {
                                deleteMember(m.id);
                              }
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                            title={language === 'zh' ? '删除成员' : 'Delete Member'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Member Form */}
                <form
                  onSubmit={handleAddMember}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs"
                >
                  <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    {t.addNewMember}
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={newMemberNameZh}
                      onChange={(e) => setNewMemberNameZh(e.target.value)}
                      placeholder="姓名 (中文，如 Student 4)"
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={newMemberNameEn}
                      onChange={(e) => setNewMemberNameEn(e.target.value)}
                      placeholder="Name (English)"
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value as LabMember['role'])}
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                    >
                      <option value="PI">{language === 'zh' ? '课题组负责人 (PI)' : 'Principal Investigator (PI)'}</option>
                      <option value="POSTDOC">{language === 'zh' ? '博士后研究员 (Postdoc)' : 'Postdoc'}</option>
                      <option value="SENIOR_PHD">{language === 'zh' ? '高年级博士生' : 'Senior PhD'}</option>
                      <option value="PHD_CANDIDATE">{language === 'zh' ? '博士研究生' : 'PhD Student'}</option>
                      <option value="RA">{language === 'zh' ? '科研助理 (RA)' : 'Research Assistant'}</option>
                      <option value="VISITING_SCHOLAR">{language === 'zh' ? '访问学者' : 'Visiting Scholar'}</option>
                    </select>

                    <input
                      type="text"
                      value={newMemberTitle}
                      onChange={(e) => setNewMemberTitle(e.target.value)}
                      placeholder="研究方向或职务代号"
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-sm"
                    >
                      {language === 'zh' ? '录入课题组成员' : 'Add Member'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ================================================================= */}
            {/* TAB 3: COMPUTE & FACILITIES */}
            {/* ================================================================= */}
            {activeSettingsTab === 'resources' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t.tabResources} ({resources.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {language === 'zh'
                      ? '自由增减 GPU 算力节点、计量经济服务器、高性能集群或专业实验设备。'
                      : 'Manage GPU clusters, servers, and laboratory scientific instruments.'}
                  </p>
                </div>

                {/* Enable/Disable Strip Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      {language === 'zh' ? '在主界面显示公共算力与设施栏' : 'Show Compute & Facilities Strip on Main View'}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {language === 'zh' ? '若课题组偏重纯理论或人文学科、无需算力监控，可关闭此栏' : 'Hide the top compute status strip if your lab does not track GPU/HPC nodes'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnableComputeStrip(!enableComputeStrip)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      enableComputeStrip ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        enableComputeStrip ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Resource Nodes List */}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {resources.map((res) => {
                    const isBusy = res.status === 'OCCUPIED';
                    const resName = language === 'zh' ? res.nameZh : res.nameEn;

                    return (
                      <div
                        key={res.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`p-2 rounded-lg border shrink-0 ${
                              res.type === 'GPU'
                                ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30'
                                : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
                            }`}
                          >
                            {res.type === 'GPU' ? <Cpu className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                {resName}
                              </span>
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold border ${
                                  isBusy
                                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                }`}
                              >
                                {isBusy ? t.busyNodes : t.idleNodes}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 truncate block">
                              {res.specs} {isBusy && res.currentUser && `· @${res.currentUser} (${res.remainingHours || 0}h)`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              updateResource(res.id, {
                                status: isBusy ? 'IDLE' : 'OCCUPIED',
                                currentUser: isBusy ? undefined : 'Current User',
                                remainingHours: isBusy ? 0 : 8,
                              })
                            }
                            className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] text-slate-600 dark:text-slate-300 font-medium transition-colors"
                          >
                            {isBusy ? (language === 'zh' ? '设为空闲' : 'Set Idle') : (language === 'zh' ? '设为占用' : 'Set Busy')}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(t.deleteResourceConfirm)) {
                                deleteResource(res.id);
                              }
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Resource Form */}
                <form
                  onSubmit={handleAddResource}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs"
                >
                  <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    {t.addResource}
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={newResNameZh}
                      onChange={(e) => setNewResNameZh(e.target.value)}
                      placeholder="设施名称 (如 GPU Node-03 / 质谱仪)"
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                    />
                    <select
                      value={newResType}
                      onChange={(e) => setNewResType(e.target.value as ResourceType)}
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                    >
                      <option value="GPU">GPU 深度学习加速节点</option>
                      <option value="SERVER">计算/实证服务器 (Server)</option>
                      <option value="CLUSTER">高性能计算集群 (HPC Cluster)</option>
                      <option value="EQUIPMENT">专业实验仪器设备 (Equipment)</option>
                    </select>
                  </div>

                  <input
                    type="text"
                    value={newResSpecs}
                    onChange={(e) => setNewResSpecs(e.target.value)}
                    placeholder="硬件与系统规格描述 (如 8x RTX 4090 24GB, CUDA 12.2)"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  />

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm"
                    >
                      {language === 'zh' ? '添加并纳入调度' : 'Add Facility'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ================================================================= */}
            {/* TAB 4: ACADEMIC STAGES */}
            {/* ================================================================= */}
            {activeSettingsTab === 'stages' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {t.settingsTitle} ({stages.length})
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{t.settingsDesc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={restoreDefaultStages}
                    className="text-[11px] font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{t.restoreDefaults}</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {stages.map((st, idx) => {
                    const stName = language === 'zh' ? st.labelZh : st.labelEn;
                    return (
                      <div
                        key={st.id}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-400">#{idx + 1}</span>
                          <div className={`w-2.5 h-2.5 rounded-full ${st.color.replace('text-', 'bg-')}`} />
                          <span className="font-bold text-slate-800 dark:text-slate-200">{stName}</span>
                        </div>

                        {stages.length > 3 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(t.deleteStageConfirm)) {
                                deleteStage(st.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add Stage Form */}
                <form
                  onSubmit={handleAddStage}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs"
                >
                  <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    {t.addNewStage}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={newStageNameZh}
                      onChange={(e) => setNewStageNameZh(e.target.value)}
                      placeholder="阶段中文名称 (如 伦理审查/IRB)"
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                    />
                    <input
                      type="text"
                      value={newStageNameEn}
                      onChange={(e) => setNewStageNameEn(e.target.value)}
                      placeholder="Stage Name (English)"
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm"
                    >
                      {t.addNewStage}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ================================================================= */}
            {/* TAB 5: TARGET VENUES */}
            {/* ================================================================= */}
            {activeSettingsTab === 'venues' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t.customVenues} ({venues.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {language === 'zh'
                      ? '在投稿倒排期生成器中可直接选用的顶会与权威期刊库。'
                      : 'Target venues and journal presets for reverse milestone derivation.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
                  {venues.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between p-3 rounded-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{v.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-mono">
                            {v.tag}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {v.milestones.length} {language === 'zh' ? '个预设里程碑步骤' : 'milestone steps'}
                        </span>
                      </div>

                      {venues.length > 3 && (
                        <button
                          type="button"
                          onClick={() => deleteVenue(v.id)}
                          className="p-1 text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* TAB 6: DATA & BACKUP */}
            {/* ================================================================= */}
            {activeSettingsTab === 'backup' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t.tabBackup}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {language === 'zh'
                      ? '完整导出或恢复您的课题组全量数据（包含全部任务、课题、成员、算力与自定义阶段）。'
                      : 'Export and restore complete JSON snapshot of all lab data and state.'}
                  </p>
                </div>

                {/* AI Smart Document Importer Fast Track */}
                <div className="p-4 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-transparent flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-sm">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                        {t.aiImportTitle}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {t.aiImportDesc}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingsOpen(false);
                      setIsAIImportOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-sm shrink-0"
                  >
                    {language === 'zh' ? '打开 AI 导入' : 'Open AI Importer'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                  <button
                    type="button"
                    onClick={exportDataBackup}
                    className="flex items-center gap-3 p-4 rounded-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-left transition-all group"
                  >
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 group-hover:bg-indigo-500/20">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block">{t.exportBackup}</span>
                      <span className="text-[10px] text-slate-500">下载当前全部数据 JSON</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-3 p-4 rounded-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-left transition-all group"
                  >
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 group-hover:bg-cyan-500/20">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block">{t.importBackup}</span>
                      <span className="text-[10px] text-slate-500">选择文件导入并覆盖</span>
                    </div>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".json"
                    className="hidden"
                  />
                </div>

                {/* Admin Password Setting */}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {t.changeAdminPassword}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {language === 'zh' ? '当前密码有效' : 'Password Active'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 max-w-md">
                      <input
                        type="password"
                        value={newAdminPass}
                        onChange={(e) => setNewAdminPass(e.target.value)}
                        placeholder={language === 'zh' ? '输入新密码（默认: admin888）' : 'New password (default: admin888)'}
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newAdminPass.trim()) {
                            updateAdminPassword(newAdminPass.trim());
                            setNewAdminPass('');
                          }
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shrink-0"
                      >
                        {t.save}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Reset to Mock */}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        {t.resetDemo}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {language === 'zh'
                          ? '恢复初始的国际高水平论文、阶段及卡点示例数据'
                          : 'Restore default sample papers, pipelines, and blocker mock state'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={resetToMockData}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{t.resetDemo}</span>
                    </button>
                  </div>
                </div>

                {/* Clean Slate Wipe (一键初始化空白实验室) */}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
                    <div>
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block">
                        {language === 'zh' ? '一键初始化空白实验室' : 'Clean Slate (Wipe All to Blank)'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {language === 'zh'
                          ? '清空全部任务、项目、算力与预设人员，从零开始搭建属于自己的课题组'
                          : 'Wipe all tasks, projects, resources, and members to build your lab from scratch'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(language === 'zh' ? '确定要清空所有数据并从零初始化吗？此操作将删除所有现有任务和人员！' : 'Wipe all data and start completely fresh? This cannot be undone!')) {
                          cleanSlateWipe();
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{language === 'zh' ? '清空并初始化' : 'Wipe & Initialize'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
