'use client';

import React from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import {
  Flame,
  Zap,
  Plus,
  Search,
  Users,
  Sun,
  Moon,
  LayoutDashboard,
  Presentation,
  FlaskConical,
  ChevronDown,
  BarChart2,
  Settings,
  Globe,
  Lock,
  Unlock,
  Sparkles,
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
    currentMember,
    currentAccessRole,
    isAdminUnlocked,
    lockAdmin,
    setIsPasswordModalOpen,
    setIsRegisterModalOpen,
    setCurrentUserId,
    setIsReverseDDLOpen,
    setIsNewTaskOpen,
    setIsAIImportOpen,
    setIsSettingsOpen,
  } = useLabFlow();

  const totalBlockers = tasks.filter((t) => t.isBlocked).length;

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
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1">
                Lab<span className="text-cyan-500 dark:text-cyan-400 font-extrabold">Flow</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300">
                {t.academicOS}
              </span>
            </div>

            <div className="hidden lg:block h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

            {/* View Mode Switcher (Kanban | Gantt | Meeting) */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
                  viewMode === 'kanban'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
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
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
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
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
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
                className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-7 py-1 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Member Filter Dropdown */}
            <div className="relative shrink-0">
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-600 dark:text-slate-300">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={filterMemberId}
                  onChange={(e) => setFilterMemberId(e.target.value)}
                  className="bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer appearance-none pr-3"
                >
                  <option value="all" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                    {t.allMembers}
                  </option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                      {language === 'zh' ? m.nameZh : m.nameEn}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Only Blockers Toggle */}
            <button
              onClick={() => setFilterOnlyBlockers(!filterOnlyBlockers)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                filterOnlyBlockers
                  ? 'bg-rose-500/20 border-rose-500 text-rose-600 dark:text-rose-300 shadow-sm'
                  : totalBlockers > 0
                  ? 'bg-rose-50 dark:bg-slate-900 border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/10'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Flame className={`w-3.5 h-3.5 ${totalBlockers > 0 ? 'text-rose-500 dark:text-rose-400 animate-pulse' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">{t.onlyBlockers}</span>
              <span className={`px-1 py-0.2 rounded-full text-[10px] font-bold ${filterOnlyBlockers ? 'bg-rose-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                {totalBlockers}
              </span>
            </button>

            {/* Reverse DDL Launch Button */}
            <button
              onClick={() => setIsReverseDDLOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-300 hover:bg-amber-500/25 text-xs font-semibold transition-all"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 fill-amber-400/20" />
              <span className="hidden sm:inline">{t.reverseDDL}</span>
            </button>

            {/* AI Document Importer Launch Button */}
            <button
              onClick={() => setIsAIImportOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-500/15 to-indigo-500/15 border border-cyan-500/40 text-cyan-700 dark:text-cyan-300 hover:from-cyan-500/25 hover:to-indigo-500/25 text-xs font-bold transition-all shadow-sm"
              title={t.aiImportTitle}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400 fill-cyan-400/20" />
              <span className="hidden sm:inline">{t.aiImport}</span>
            </button>

            {/* User Identity & Role Capsule */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              <select
                value={currentMember.id}
                onChange={(e) => {
                  if (e.target.value === '__NEW__') {
                    setIsRegisterModalOpen(true);
                  } else {
                    setCurrentUserId(e.target.value);
                  }
                }}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pl-1 pr-1.5"
              >
                {members.map((m) => {
                  const roleLabel =
                    m.accessRole === 'ADMIN_PI' || m.role === 'PI'
                      ? '👑'
                      : m.accessRole === 'PROJECT_LEAD' || m.role === 'POSTDOC' || m.role === 'SENIOR_PHD'
                      ? '🔬'
                      : m.accessRole === 'AUDITOR_GUEST' || m.role === 'VISITING_SCHOLAR'
                      ? '👁️'
                      : '🧑‍💻';
                  return (
                    <option key={m.id} value={m.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                      {roleLabel} {language === 'zh' ? m.nameZh : m.nameEn}
                    </option>
                  );
                })}
                <option value="__NEW__" className="bg-white dark:bg-slate-900 text-cyan-600 font-bold">
                  + {t.quickRegisterMember}
                </option>
              </select>

              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${
                  currentAccessRole === 'ADMIN_PI'
                    ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30'
                    : currentAccessRole === 'PROJECT_LEAD'
                    ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30'
                    : currentAccessRole === 'STUDENT_RA'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                    : 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30'
                }`}
              >
                {currentAccessRole === 'ADMIN_PI'
                  ? (language === 'zh' ? '导师' : 'PI')
                  : currentAccessRole === 'PROJECT_LEAD'
                  ? (language === 'zh' ? '骨干' : 'Lead')
                  : currentAccessRole === 'STUDENT_RA'
                  ? (language === 'zh' ? '组员' : 'Member')
                  : (language === 'zh' ? '访客' : 'Guest')}
              </span>

              {currentAccessRole === 'ADMIN_PI' && (
                <button
                  type="button"
                  onClick={() => {
                    if (isAdminUnlocked) {
                      lockAdmin();
                    } else {
                      setIsPasswordModalOpen(true);
                    }
                  }}
                  className={`p-1 rounded-md transition-colors ${
                    isAdminUnlocked
                      ? 'text-emerald-600 hover:text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20'
                      : 'text-amber-500 hover:text-amber-600 bg-amber-500/10 hover:bg-amber-500/20'
                  }`}
                  title={isAdminUnlocked ? t.lockAdminAction : t.enterAdminPassword}
                >
                  {isAdminUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            {/* Quick New Task */}
            <button
              onClick={() => setIsNewTaskOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.newTask}</span>
            </button>

            {/* Unified Settings Center Button (系统整体设置) */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold transition-colors shadow-sm"
              title={t.settingsCenter}
            >
              <Settings className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden lg:inline">{t.settingsCenter}</span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 transition-colors"
            >
              <Globe className="w-3 h-3" />
              <span>{t.switchLang}</span>
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
              title={t.toggleTheme}
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
