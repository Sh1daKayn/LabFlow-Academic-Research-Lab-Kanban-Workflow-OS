'use client';

import React, { useState } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import { ViewMode } from '@/types';
import { MemberAvatar } from '@/components/MemberAvatar';
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
  ChevronUp,
  BarChart2,
  Settings,
  Globe,
  Lock,
  Unlock,
  Sparkles,
  Database,
  HardDrive,
  RefreshCw,
  WifiOff,
  Network,
  ListChecks,
  UserCog,
  Compass,
  BookmarkPlus,
  SlidersHorizontal,
  FilterX,
  X,
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
    selectedStageFilter,
    setSelectedStageFilter,
    selectedProjectFilter,
    setSelectedProjectFilter,
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
    effectiveIsAdmin,
    storageMode,
    syncStatus,
    lastSyncError,
    retryServerSync,
    isAdminUnlocked,
    lockAdmin,
    setIsPasswordModalOpen,
    setIsRegisterModalOpen,
    setIsMyProfileModalOpen,
    setCurrentUserId,
    setIsReverseDDLOpen,
    setIsNewTaskOpen,
    setIsAIImportOpen,
    setIsSettingsOpen,
    setActiveSettingsTab,
    setIsFeatureGuideOpen,
    openTemplateModal,
  } = useLabFlow();

  const isZh = language === 'zh';
  const [subBarCollapsed, setSubBarCollapsed] = useState(false);
  const [meetingSubBarExpanded, setMeetingSubBarExpanded] = useState(false);

  // Keep Group Meeting screen uncluttered by default while leaving a 1-click expand toggle
  const showSubBar = viewMode === 'meeting' ? meetingSubBarExpanded : !subBarCollapsed;
  const toggleSubBar = () => {
    if (viewMode === 'meeting') {
      setMeetingSubBarExpanded((prev) => !prev);
    } else {
      setSubBarCollapsed((prev) => !prev);
    }
  };

  const totalBlockers = tasks.filter((t) => t.isBlocked).length;
  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      filterMemberId !== 'all' ||
      filterOnlyBlockers ||
      selectedStageFilter !== 'all' ||
      selectedProjectFilter !== 'all'
  );

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterMemberId('all');
    setFilterOnlyBlockers(false);
    setSelectedStageFilter('all');
    setSelectedProjectFilter('all');
  };

  const viewTabs: Array<{
    id: ViewMode;
    label: string;
    icon: React.ReactNode;
    activeClass: string;
  }> = [
    {
      id: 'kanban',
      label: t.kanban,
      icon: <LayoutDashboard className="w-3.5 h-3.5" />,
      activeClass: 'bg-indigo-600 text-white shadow-sm',
    },
    {
      id: 'gantt',
      label: t.gantt,
      icon: <BarChart2 className="w-3.5 h-3.5" />,
      activeClass: 'bg-indigo-600 text-white shadow-sm',
    },
    {
      id: 'architecture',
      label: t.architecture,
      icon: <Network className="w-3.5 h-3.5" />,
      activeClass: 'bg-violet-600 text-white shadow-sm',
    },
    {
      id: 'todos',
      label: t.todos,
      icon: <ListChecks className="w-3.5 h-3.5" />,
      activeClass: 'bg-emerald-600 text-white shadow-sm',
    },
    {
      id: 'meeting',
      label: t.meeting,
      icon: <Presentation className="w-3.5 h-3.5" />,
      activeClass: 'bg-cyan-600 text-white shadow-sm',
    },
  ];

  const syncTitle =
    syncStatus === 'offline'
      ? lastSyncError ||
        (isZh
          ? '当前仅保存在本机浏览器缓存，点击重试同步至服务器'
          : 'Saved in browser cache only; click to retry server sync')
      : storageMode === 'postgres'
      ? isZh
        ? '已连接 PostgreSQL 服务器数据库，跨设备实时持久化'
        : 'Connected to PostgreSQL server database'
      : isZh
      ? '已保存至本机服务端 (.data/labflow-state.json)；如需云端/远程服务器保存，请在 .env 中配置 DATABASE_URL (PostgreSQL)'
      : 'Saved to host server store (.data/labflow-state.json); configure DATABASE_URL for remote PostgreSQL persistence';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/92 backdrop-blur-md transition-colors shadow-sm">
      {/* Tier 1: Primary Brand, 5 Core View Tabs (never squeezed), and Global Identity/System */}
      <div className="max-w-[1780px] mx-auto px-3 lg:px-5">
        <div className="flex flex-wrap lg:flex-nowrap items-center justify-between min-h-12 py-1.5 gap-2 lg:gap-4">
          {/* Left: Brand + Spacious 5-Tab View Switcher */}
          <div className="flex items-center gap-2.5 lg:gap-3 min-w-0 max-w-full lg:shrink-0">
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-sm text-white">
                <FlaskConical className="w-4 h-4" />
              </div>
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100 flex items-center">
                Lab<span className="text-cyan-500 dark:text-cyan-400 font-extrabold">Flow</span>
              </span>
            </div>

            <div className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-slate-800 shrink-0" />

            {/* View Mode Switcher (Kanban | Gantt | Architecture | Todos | Meeting) */}
            <nav
              aria-label={isZh ? '主视图切换' : 'Primary Views'}
              className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs xl:text-[13px] overflow-x-auto scrollbar-none max-w-full"
            >
              {viewTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setViewMode(tab.id)}
                  className={`flex items-center gap-1.5 px-2.5 xl:px-3.5 py-1.5 rounded-lg font-medium whitespace-nowrap shrink-0 transition-all ${
                    viewMode === tab.id
                      ? tab.activeClass
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Right: Core CTA + Identity/RBAC + System Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
            {/* Restore Sub-toolbar Pill when collapsed or in Group Meeting view */}
            {!showSubBar && (
              <button
                type="button"
                onClick={toggleSubBar}
                className={`relative flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  hasActiveFilters || totalBlockers > 0
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-700 dark:text-cyan-300'
                    : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-cyan-500/40'
                }`}
                title={isZh ? '展开筛选与智能工具栏' : 'Expand filters & tools bar'}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isZh ? '筛选与工具' : 'Tools'}</span>
                {(hasActiveFilters || totalBlockers > 0) && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      totalBlockers > 0 ? 'bg-rose-500' : 'bg-cyan-500'
                    }`}
                  />
                )}
              </button>
            )}

            {/* Quick New Task CTA */}
            <button
              type="button"
              onClick={() => setIsNewTaskOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-sm shrink-0"
              title={t.newTask}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline xl:hidden">{isZh ? '新建' : 'New'}</span>
              <span className="hidden xl:inline">{t.newTask}</span>
            </button>

            {/* User Identity & Role Capsule */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setIsMyProfileModalOpen(true)}
                className="rounded-full hover:ring-2 hover:ring-cyan-500/60 transition-all shrink-0"
                title={t.myProfile}
              >
                <MemberAvatar member={currentMember} size="xs" />
              </button>

              <select
                value={currentMember.id}
                onChange={(e) => {
                  if (e.target.value === '__NEW__') {
                    setIsRegisterModalOpen(true);
                  } else {
                    setCurrentUserId(e.target.value);
                  }
                }}
                aria-label={isZh ? '切换当前成员身份' : 'Switch current member'}
                className="bg-transparent max-w-[88px] xl:max-w-[132px] truncate text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pl-0.5 pr-1"
              >
                {members.map((m) => {
                  const roleLabel =
                    m.accessRole === 'ADMIN_PI' || m.role === 'PI'
                      ? '👑'
                      : m.accessRole === 'SYS_ADMIN'
                      ? '🛡️'
                      : m.accessRole === 'PROJECT_LEAD' || m.role === 'POSTDOC' || m.role === 'SENIOR_PHD'
                      ? '🔬'
                      : m.accessRole === 'AUDITOR_GUEST' || m.role === 'VISITING_SCHOLAR'
                      ? '👁️'
                      : '🧑‍💻';
                  return (
                    <option key={m.id} value={m.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                      {roleLabel} {isZh ? m.nameZh : m.nameEn}
                    </option>
                  );
                })}
                <option value="__NEW__" className="bg-white dark:bg-slate-900 text-cyan-600 font-bold">
                  + {t.quickRegisterMember}
                </option>
              </select>

              <button
                type="button"
                onClick={() => setIsMyProfileModalOpen(true)}
                className="p-1 rounded-md text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
                title={t.myProfile}
              >
                <UserCog className="w-3.5 h-3.5" />
              </button>

              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${
                  currentAccessRole === 'ADMIN_PI'
                    ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30'
                    : currentAccessRole === 'SYS_ADMIN'
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/35'
                    : currentAccessRole === 'PROJECT_LEAD'
                    ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30'
                    : currentAccessRole === 'STUDENT_RA'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                    : 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30'
                }`}
              >
                {currentAccessRole === 'ADMIN_PI'
                  ? (isZh ? '导师' : 'PI')
                  : currentAccessRole === 'SYS_ADMIN'
                  ? (isZh ? '系统管理' : 'SysAdmin')
                  : currentAccessRole === 'PROJECT_LEAD'
                  ? (isZh ? '骨干' : 'Lead')
                  : currentAccessRole === 'STUDENT_RA'
                  ? (isZh ? '组员' : 'Member')
                  : (isZh ? '访客' : 'Guest')}
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

            {/* Compact Live Server Sync & Storage Mode Pill */}
            <button
              type="button"
              onClick={() => {
                if (syncStatus === 'offline') {
                  void retryServerSync();
                  return;
                }
                if (effectiveIsAdmin || currentAccessRole === 'SYS_ADMIN') {
                  setActiveSettingsTab('backup');
                  setIsSettingsOpen(true);
                } else {
                  void retryServerSync();
                }
              }}
              title={syncTitle}
              aria-label={syncTitle}
              className={`${
                syncStatus === 'offline' ? 'flex' : 'hidden sm:flex'
              } items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${
                syncStatus === 'offline'
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25'
                  : syncStatus === 'syncing'
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
                  : storageMode === 'postgres'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20'
              }`}
            >
              {syncStatus === 'offline' ? (
                <WifiOff className="w-3.5 h-3.5 shrink-0" />
              ) : syncStatus === 'syncing' ? (
                <RefreshCw className="w-3.5 h-3.5 shrink-0 animate-spin" />
              ) : storageMode === 'postgres' ? (
                <Database className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <HardDrive className="w-3.5 h-3.5 shrink-0" />
              )}
              <span
                className={
                  syncStatus === 'offline' || syncStatus === 'syncing'
                    ? 'inline'
                    : 'hidden 2xl:inline'
                }
              >
                {syncStatus === 'offline'
                  ? isZh
                    ? '仅本机·重试'
                    : 'Local · Retry'
                  : syncStatus === 'syncing'
                  ? isZh
                    ? '保存中...'
                    : 'Saving...'
                  : storageMode === 'postgres'
                  ? isZh
                    ? 'DB已同步'
                    : 'DB Synced'
                  : isZh
                  ? '服务端已保存'
                  : 'Host Saved'}
              </span>
            </button>

            {/* Feature Overview / Quick Start Guide Button */}
            <button
              type="button"
              onClick={() => setIsFeatureGuideOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/35 text-cyan-700 dark:text-cyan-300 text-xs font-semibold transition-colors shadow-sm"
              title={isZh ? '功能一览与上手指南' : 'Feature Overview & Quick Start'}
            >
              <Compass className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span className="hidden xl:inline">{t.featureGuide}</span>
            </button>

            {/* Unified Settings Center Button */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold transition-colors shadow-sm"
              title={t.settingsCenter}
            >
              <Settings className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden 2xl:inline">{t.settingsCenter}</span>
            </button>

            {/* Language Switcher */}
            <button
              type="button"
              onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 transition-colors"
              title={isZh ? 'Switch to English' : '切换为中文'}
            >
              <Globe className="w-3 h-3" />
              <span>{t.switchLang}</span>
            </button>

            {/* Dark / Light Toggle */}
            <button
              type="button"
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

      {/* Tier 2: Workspace Filters & Smart Productivity Tools Sub-bar */}
      {showSubBar && (
        <div className="border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/65">
          <div className="max-w-[1780px] mx-auto px-3 lg:px-5 py-1.5 flex flex-wrap items-center justify-between gap-2">
            {/* Left: Search, Member Filter & Blocker Filter */}
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
              {/* Wide Search Input */}
              <div className="relative flex-1 min-w-[180px] sm:max-w-sm lg:max-w-md">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-7 py-1 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label={isZh ? '清除搜索词' : 'Clear search'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Member Filter Dropdown */}
              <div className="relative shrink-0">
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={filterMemberId}
                    onChange={(e) => setFilterMemberId(e.target.value)}
                    aria-label={t.allMembers}
                    className="bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer appearance-none pr-4"
                  >
                    <option value="all" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                      {t.allMembers}
                    </option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                        {isZh ? m.nameZh : m.nameEn}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
                </div>
              </div>

              {/* Only Blockers Toggle */}
              <button
                type="button"
                onClick={() => setFilterOnlyBlockers(!filterOnlyBlockers)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                  filterOnlyBlockers
                    ? 'bg-rose-500/20 border-rose-500 text-rose-600 dark:text-rose-300 shadow-sm'
                    : totalBlockers > 0
                    ? 'bg-rose-50 dark:bg-slate-950/80 border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/10'
                    : 'bg-white dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Flame
                  className={`w-3.5 h-3.5 ${
                    totalBlockers > 0 ? 'text-rose-500 dark:text-rose-400 animate-pulse' : 'text-slate-400'
                  }`}
                />
                <span>{t.onlyBlockers}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    filterOnlyBlockers
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {totalBlockers}
                </span>
              </button>

              {/* Conditional Clear All Active Filters */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950/80 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-500/40 transition-colors"
                >
                  <FilterX className="w-3 h-3" />
                  <span>{isZh ? '清空筛选' : 'Clear'}</span>
                </button>
              )}
            </div>

            {/* Right: Smart Planning & Template Shortcuts + Collapse Toggle */}
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              {/* Custom Checklist & Acceptance Template Library */}
              <button
                type="button"
                onClick={() => openTemplateModal()}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-300 hover:border-indigo-500/50 hover:bg-indigo-500/5 text-xs font-semibold transition-all"
                title={isZh ? '管理与注入自定义执行清单及验收标准模板' : 'Manage custom checklist & acceptance templates'}
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                <span>{isZh ? '模板库' : 'Templates'}</span>
              </button>

              {/* Reverse DDL Launch Button */}
              <button
                type="button"
                onClick={() => setIsReverseDDLOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 text-xs font-semibold transition-all"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 fill-amber-400/20" />
                <span>{t.reverseDDL}</span>
              </button>

              {/* AI Document Importer Launch Button */}
              <button
                type="button"
                onClick={() => setIsAIImportOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-500/15 to-indigo-500/15 border border-cyan-500/40 text-cyan-700 dark:text-cyan-300 hover:from-cyan-500/25 hover:to-indigo-500/25 text-xs font-bold transition-all shadow-sm"
                title={t.aiImportTitle}
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400 fill-cyan-400/20" />
                <span>{t.aiImport}</span>
              </button>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 hidden sm:block" />

              {/* Collapse Sub-bar Button */}
              <button
                type="button"
                onClick={toggleSubBar}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
                title={isZh ? '收起筛选与工具栏' : 'Collapse filters & tools bar'}
                aria-label={isZh ? '收起筛选与工具栏' : 'Collapse filters & tools bar'}
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
