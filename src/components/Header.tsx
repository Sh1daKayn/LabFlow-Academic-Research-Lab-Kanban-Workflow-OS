'use client';

import React, { useRef } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import {
  Flame,
  Zap,
  Plus,
  Search,
  Users,
  RotateCcw,
  Sun,
  Moon,
  LayoutDashboard,
  Presentation,
  FlaskConical,
  ChevronDown,
  BarChart2,
  Settings,
  Globe,
  Download,
  Upload,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    tasks,
    filterOnlyBlockers,
    setFilterOnlyBlockers,
    searchQuery,
    setSearchQuery,
    filterMemberId,
    setFilterMemberId,
    viewMode,
    setViewMode,
    theme,
    setTheme,
    language,
    setLanguage,
    t,
    members,
    currentUserId,
    setIsReverseDDLOpen,
    setIsNewTaskOpen,
    setIsStageSettingsOpen,
    setIsMemberManagerOpen,
    exportDataBackup,
    importDataBackup,
    resetToMockData,
  } = useLabFlow();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const totalBlockers = tasks.filter((t) => t.isBlocked).length;
  const activeUser = members.find((m) => m.id === currentUserId) || members[0];
  const activeUserName = language === 'zh' ? activeUser.nameZh : activeUser.nameEn;

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

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/90 backdrop-blur-md transition-colors shadow-sm">
      <div className="max-w-[1720px] mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 gap-3">
          {/* Left: Minimal Branding & View Switcher */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-sm text-white">
                <FlaskConical className="w-4 h-4" />
              </div>
              <span className="font-bold text-base tracking-tight text-slate-100 flex items-center gap-1">
                Lab<span className="text-cyan-400 font-extrabold">Flow</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                {t.academicOS}
              </span>
            </div>

            <div className="hidden lg:block h-5 w-px bg-slate-800 mx-1" />

            {/* View Mode Switcher (Kanban | Gantt | Meeting) */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
                  viewMode === 'kanban'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>{t.kanban}</span>
              </button>

              <button
                onClick={() => setViewMode('gantt')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
                  viewMode === 'gantt'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>{t.gantt}</span>
              </button>

              <button
                onClick={() => setViewMode('meeting')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
                  viewMode === 'meeting'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Presentation className="w-3.5 h-3.5" />
                <span>{t.meeting}</span>
              </button>
            </div>
          </div>

          {/* Middle: Compact Search & Member Filter */}
          <div className="hidden md:flex items-center gap-2 flex-1 max-w-sm mx-2">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-lg pl-8 pr-7 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Member Filter Dropdown */}
            <div className="relative shrink-0">
              <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={filterMemberId}
                  onChange={(e) => setFilterMemberId(e.target.value)}
                  className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer appearance-none pr-3"
                >
                  <option value="all" className="bg-slate-900 text-slate-200">
                    {t.allMembers}
                  </option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">
                      {language === 'zh' ? m.nameZh : m.nameEn}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-500 absolute right-1.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Only Blockers Toggle */}
            <button
              onClick={() => setFilterOnlyBlockers(!filterOnlyBlockers)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                filterOnlyBlockers
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                  : totalBlockers > 0
                  ? 'bg-slate-900 border-rose-500/40 text-rose-400 hover:bg-rose-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className={`w-3.5 h-3.5 ${totalBlockers > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">{t.onlyBlockers}</span>
              <span className={`px-1 py-0.2 rounded-full text-[10px] font-bold ${filterOnlyBlockers ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {totalBlockers}
              </span>
            </button>

            {/* Reverse DDL Launch Button */}
            <button
              onClick={() => setIsReverseDDLOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 text-xs font-semibold transition-all"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
              <span className="hidden sm:inline">{t.reverseDDL}</span>
            </button>

            {/* Quick New Task */}
            <button
              onClick={() => setIsNewTaskOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.newTask}</span>
            </button>

            {/* Member Management & User Center Button */}
            <button
              onClick={() => setIsMemberManagerOpen(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 text-xs font-medium transition-colors"
              title={t.memberManagerTitle}
            >
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden xl:inline text-[11px] truncate max-w-[80px]">
                {activeUserName}
              </span>
            </button>

            {/* Stage Settings Button */}
            <button
              onClick={() => setIsStageSettingsOpen(true)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title={t.pipelineSettings}
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            {/* Backup / Export Button */}
            <button
              onClick={exportDataBackup}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors hidden sm:inline-flex"
              title={t.exportBackup}
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* Restore / Import Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors hidden sm:inline-flex"
              title={t.importBackup}
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />

            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <Globe className="w-3 h-3" />
              <span>{t.switchLang}</span>
            </button>

            {/* Demo Reset */}
            <button
              onClick={resetToMockData}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title={t.resetDemo}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title={t.toggleTheme}
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
