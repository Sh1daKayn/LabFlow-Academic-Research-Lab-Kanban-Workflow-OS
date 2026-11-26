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
  MessageSquare,
  LogOut,
  LayoutGrid,
  Send,
  Bell,
  BellOff,
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
    selectedWorkshopFilter,
    setSelectedWorkshopFilter,
    viewMode,
    setViewMode,
    workspaceScope,
    setWorkspaceScope,
    preferredViews,
    pendingRequestsForMeCount,
    theme,
    setTheme,
    language,
    setLanguage,
    t,
    members,
    currentMember,
    currentAccessRole,
    storageMode,
    syncStatus,
    lastSyncError,
    retryServerSync,
    isAdminUnlocked,
    lockAdmin,
    setIsPasswordModalOpen,
    setIsMyProfileModalOpen,
    logoutMember,
    openRequestModal,
    setIsViewCustomizerOpen,
    setIsReverseDDLOpen,
    setIsNewTaskOpen,
    setIsAIImportOpen,
    setIsSettingsOpen,
    setIsFeatureGuideOpen,
    openTemplateModal,
    desktopNotificationsEnabled,
    toggleDesktopNotifications,
    simpleMode,
    setSimpleMode,
    startTour,
  } = useLabFlow();

  const isZh = language === 'zh';
  const [subBarCollapsed, setSubBarCollapsed] = useState(true);
  const [meetingSubBarExpanded, setMeetingSubBarExpanded] = useState(false);
  const [showMoreViewsMenu, setShowMoreViewsMenu] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showNewMenu, setShowNewMenu] = useState(false);

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
      selectedProjectFilter !== 'all' ||
      selectedWorkshopFilter !== 'ALL'
  );

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterMemberId('all');
    setFilterOnlyBlockers(false);
    setSelectedStageFilter('all');
    setSelectedProjectFilter('all');
    setSelectedWorkshopFilter('ALL');
  };

  const viewTabs: Array<{
    id: ViewMode;
    label: string;
    icon: React.ReactNode;
    activeClass: string;
    badge?: number;
  }> = [
    {
      id: 'kanban',
      label: t.kanban,
      icon: <LayoutDashboard className="w-3.5 h-3.5" />,
      activeClass: 'bg-indigo-600 text-white shadow-sm',
    },
    {
      id: 'todos',
      label: t.todos,
      icon: <ListChecks className="w-3.5 h-3.5" />,
      activeClass: 'bg-indigo-600 text-white shadow-sm',
    },
    {
      id: 'requests',
      label: isZh ? '1对1沟通' : 'Requests',
      icon: <MessageSquare className="w-3.5 h-3.5" />,
      activeClass: 'bg-indigo-600 text-white shadow-sm',
      badge: pendingRequestsForMeCount,
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
      activeClass: 'bg-indigo-600 text-white shadow-sm',
    },
    {
      id: 'meeting',
      label: t.meeting,
      icon: <Presentation className="w-3.5 h-3.5" />,
      activeClass: 'bg-indigo-600 text-white shadow-sm',
    },
  ];

  const MAX_INLINE_HEADER_TABS = 3;
  const allPinnedTabs = viewTabs.filter((tab) => preferredViews.includes(tab.id));
  const visibleTabs = allPinnedTabs.slice(0, MAX_INLINE_HEADER_TABS);
  const pinnedOverflowTabs = allPinnedTabs.slice(MAX_INLINE_HEADER_TABS);
  const unpinnedTabs = viewTabs.filter((tab) => !preferredViews.includes(tab.id));
  const extraTabs = [...pinnedOverflowTabs, ...unpinnedTabs];
  const activeExtraTab = extraTabs.find((tab) => tab.id === viewMode) || null;
  const isViewingExtraTab = Boolean(activeExtraTab);

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
      {/* Tier 1: Compact Brand, up to 3 Primary View Tabs + Dynamic More, and Streamlined Actions */}
      <div className="max-w-[1780px] mx-auto px-3 lg:px-5">
        <div className="flex flex-wrap items-center justify-between min-h-12 py-1.5 gap-x-2.5 gap-y-1.5">
          {/* Left: Brand + Core View Switcher */}
          <div className="flex items-center gap-2 min-w-0 max-w-full">
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600 shadow-sm text-white">
                <FlaskConical className="w-4 h-4" />
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100 flex items-center">
                  Lab<span className="text-indigo-600 dark:text-indigo-400 font-extrabold">Flow</span>
                </span>
                <span className="hidden 2xl:block text-[10px] font-medium text-slate-500 dark:text-slate-400 tracking-wide mt-0.5">
                  {t.labTitle}
                </span>
              </div>
            </div>

            <div className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-800 shrink-0" />

            {/* View Mode Switcher (Max 3 Inline Tabs + More Dropdown) */}
            <div className="relative flex items-center gap-1 min-w-0 max-w-full">
              <nav
                data-tour="primary-tabs"
                aria-label={isZh ? '主视图切换' : 'Primary Views'}
                className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs overflow-x-auto scrollbar-none max-w-full"
              >
                {visibleTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setViewMode(tab.id);
                      setShowMoreViewsMenu(false);
                    }}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg font-medium whitespace-nowrap shrink-0 transition-all ${
                      viewMode === tab.id
                        ? tab.activeClass
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    {tab.badge && tab.badge > 0 ? (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                        {tab.badge}
                      </span>
                    ) : null}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setShowMoreViewsMenu((v) => !v);
                    setShowAccountMenu(false);
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg font-medium whitespace-nowrap shrink-0 transition-all ${
                    isViewingExtraTab || showMoreViewsMenu
                      ? activeExtraTab
                        ? activeExtraTab.activeClass
                        : 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {activeExtraTab ? activeExtraTab.icon : null}
                  <span>{activeExtraTab ? activeExtraTab.label : isZh ? '更多' : 'More'}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </nav>

              {showMoreViewsMenu && (
                <div className="absolute left-0 top-full mt-1.5 w-52 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl py-1.5 z-50">
                  {extraTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setViewMode(tab.id);
                        setShowMoreViewsMenu(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors ${
                        viewMode === tab.id
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {tab.icon}
                        {tab.label}
                      </span>
                      {tab.badge && tab.badge > 0 ? (
                        <span className="px-1.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                          {tab.badge}
                        </span>
                      ) : null}
                    </button>
                  ))}
                  {extraTabs.length > 0 && (
                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreViewsMenu(false);
                      setIsViewCustomizerOpen(true);
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium flex items-center gap-2"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    {isZh ? '自定义初始视图' : 'Customize Views'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Compact Scope Switch + Filter Icon + Split New CTA + Account + Settings */}
          <div className="flex flex-wrap items-center gap-1.5 ml-auto max-w-full">
            {/* Compact Workspace Scope Switch: My Isolation vs Group Public */}
            <div
              data-tour="scope-toggle"
              className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px]"
              title={
                isZh
                  ? '默认仅看个人任务与 1 对 1 请求，需要时可切换为全组公开'
                  : 'Switch between My Workspace only and Lab Public items'
              }
            >
              <button
                type="button"
                onClick={() => {
                  setWorkspaceScope('MINE');
                  setFilterMemberId('all');
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                  workspaceScope === 'MINE'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Lock className="w-3 h-3" />
                <span>{isZh ? '我的' : 'Mine'}</span>
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceScope('PUBLIC_LAB')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                  workspaceScope === 'PUBLIC_LAB'
                    ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 font-semibold shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Globe className="w-3 h-3" />
                <span>{isZh ? '全组' : 'Lab'}</span>
              </button>
            </div>

            {/* Expand / Collapse Filters Sub-bar */}
            {!showSubBar && (
              <button
                type="button"
                data-tour="filter-toggle"
                onClick={toggleSubBar}
                className={`relative flex items-center justify-center p-1.5 rounded-lg border text-xs font-medium transition-colors shrink-0 ${
                  hasActiveFilters || totalBlockers > 0
                    ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-700 dark:text-indigo-300'
                    : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-500/40'
                }`}
                title={isZh ? '展开搜索与筛选栏' : 'Search & filters'}
                aria-label={isZh ? '展开搜索与筛选栏' : 'Search & filters'}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {(hasActiveFilters || totalBlockers > 0) && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ml-1 ${
                      totalBlockers > 0 ? 'bg-rose-500' : 'bg-indigo-500'
                    }`}
                  />
                )}
              </button>
            )}

            {/* Unified Split CTA: + New + Dropdown (Requests / Projects / DDL Planner / AI Import / Templates) */}
            <div
              data-tour="new-split-cta"
              className="relative inline-flex items-center rounded-lg bg-indigo-600 text-white shadow-xs shrink-0"
            >
              <button
                type="button"
                onClick={() => {
                  setShowNewMenu(false);
                  setIsNewTaskOpen(true);
                }}
                className="flex items-center gap-1 pl-2 pr-1.5 py-1.5 rounded-l-lg hover:bg-indigo-500 text-xs font-semibold whitespace-nowrap transition-colors"
                title={t.newTask}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isZh ? '新建' : 'New'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewMenu((v) => !v);
                  setShowAccountMenu(false);
                  setShowMoreViewsMenu(false);
                }}
                className="px-1.5 py-1.5 rounded-r-lg border-l border-indigo-500/70 hover:bg-indigo-500 transition-colors"
                title={isZh ? '更多新建与导入工具' : 'More create & planning tools'}
                aria-label={isZh ? '更多新建与导入工具' : 'More create & planning tools'}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showNewMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl py-1.5 z-50 text-slate-800 dark:text-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewMenu(false);
                      setIsNewTaskOpen(true);
                    }}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{t.newTask}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewMenu(false);
                      openRequestModal();
                    }}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{isZh ? '发起 1对1 申请/沟通' : '1-on-1 Request'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewMenu(false);
                      setViewMode('architecture');
                    }}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Network className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{isZh ? '项目管理与转化排期' : 'Projects & Outreach'}</span>
                  </button>
                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewMenu(false);
                      setIsReverseDDLOpen(true);
                    }}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t.reverseDDL}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewMenu(false);
                      setIsAIImportOpen(true);
                    }}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{t.aiImportTitle}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewMenu(false);
                      openTemplateModal();
                    }}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{isZh ? '清单与验收模板库' : 'Checklist Templates'}</span>
                  </button>
                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewMenu(false);
                      startTour();
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-medium"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>{isZh ? '分步箭头引导' : 'Interactive Tour'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewMenu(false);
                      setIsFeatureGuideOpen(true);
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-medium"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>{isZh ? '快速上手指南' : 'Quick Start Guide'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Alert chip ONLY when offline/syncing so normal steady state stays ultra-clean */}
            {(syncStatus === 'offline' || syncStatus === 'syncing') && (
              <button
                type="button"
                onClick={() => {
                  if (syncStatus === 'offline') void retryServerSync();
                }}
                title={syncTitle}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-[11px] font-semibold ${
                  syncStatus === 'offline'
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400'
                    : 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
                }`}
              >
                {syncStatus === 'offline' ? (
                  <WifiOff className="w-3.5 h-3.5" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                )}
                <span className="hidden xl:inline">
                  {syncStatus === 'offline'
                    ? isZh
                      ? '离线·重试'
                      : 'Offline'
                    : isZh
                    ? '保存中'
                    : 'Saving'}
                </span>
              </button>
            )}

            {/* Unified User & Quick-Preferences Capsule */}
            <div
              data-tour="account-capsule"
              className="relative flex items-center gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
            >
              <button
                type="button"
                onClick={() => {
                  setShowAccountMenu((v) => !v);
                  setShowMoreViewsMenu(false);
                  setShowNewMenu(false);
                }}
                className="flex items-center gap-1.5 pl-0.5 pr-1 py-0.5 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
                title={isZh ? '账户、视图与外观设置' : 'Account & preferences'}
              >
                <MemberAvatar member={currentMember} size="xs" />
                <span className="max-w-[72px] truncate font-semibold text-slate-800 dark:text-slate-200">
                  {isZh ? currentMember.nameZh : currentMember.nameEn}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showAccountMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-60 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl py-1.5 z-50">
                  <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2">
                    <span className="truncate">
                      {isZh ? currentMember.titleZh : currentMember.titleEn}
                    </span>
                  </div>

                  {/* Quick toggles folded neatly out of the primary top bar */}
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        {isZh ? '界面模式' : 'Layout'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSimpleMode(!simpleMode)}
                        className={`px-2 py-0.5 rounded-md font-semibold border ${
                          simpleMode
                            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-300'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {simpleMode
                          ? isZh
                            ? '简洁视图 ✓'
                            : 'Simple ✓'
                          : isZh
                          ? '完整统筹'
                          : 'Full'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        {isZh ? '桌面弹窗提醒' : 'Desktop Alerts'}
                      </span>
                      <button
                        type="button"
                        onClick={() => void toggleDesktopNotifications()}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold border ${
                          desktopNotificationsEnabled
                            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-300'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                        }`}
                      >
                        {desktopNotificationsEnabled ? (
                          <Bell className="w-3 h-3" />
                        ) : (
                          <BellOff className="w-3 h-3" />
                        )}
                        <span>
                          {desktopNotificationsEnabled
                            ? isZh
                              ? '已开'
                              : 'ON'
                            : isZh
                            ? '已关'
                            : 'OFF'}
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Globe className="w-3 h-3" />
                        <span>{t.switchLang}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors"
                      >
                        {theme === 'dark' ? (
                          <Sun className="w-3 h-3 text-amber-500" />
                        ) : (
                          <Moon className="w-3 h-3 text-indigo-500" />
                        )}
                        <span>{theme === 'dark' ? (isZh ? '浅色' : 'Light') : (isZh ? '深色' : 'Dark')}</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAccountMenu(false);
                      setIsMyProfileModalOpen(true);
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <UserCog className="w-3.5 h-3.5 text-slate-400" />
                    {t.myProfile}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAccountMenu(false);
                      setIsViewCustomizerOpen(true);
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <LayoutGrid className="w-3.5 h-3.5 text-indigo-500" />
                    {isZh ? '自定义视图与 PIN' : 'Views & Personal PIN'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAccountMenu(false);
                      void retryServerSync();
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between gap-2"
                  >
                    <span className="flex items-center gap-2">
                      {storageMode === 'postgres' ? (
                        <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <HardDrive className="w-3.5 h-3.5 text-indigo-500" />
                      )}
                      <span>
                        {storageMode === 'postgres'
                          ? isZh
                            ? 'DB 已同步'
                            : 'DB Synced'
                          : isZh
                          ? '本机服务端已保存'
                          : 'Host Saved'}
                      </span>
                    </span>
                    <RefreshCw className="w-3 h-3 text-slate-400" />
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                  <button
                    type="button"
                    onClick={() => {
                      setShowAccountMenu(false);
                      logoutMember();
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    {isZh ? '切换账户 / 退出登录' : 'Switch Account / Sign Out'}
                  </button>
                </div>
              )}

              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${
                  currentAccessRole === 'ADMIN_PI'
                    ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/35'
                    : currentAccessRole === 'SYS_ADMIN'
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/35'
                    : currentAccessRole === 'PROJECT_LEAD'
                    ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30'
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

            {/* Unified Settings Center Button */}
            <button
              type="button"
              data-tour="settings-btn"
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm"
              title={t.settingsCenter}
            >
              <Settings className="w-4 h-4 text-indigo-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Tier 2: Workspace Filters & Smart Productivity Tools Sub-bar */}
      {showSubBar && (
        <div
          data-tour="header-subbar"
          className="border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/65"
        >
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
                  className="w-full bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-7 py-1 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
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

              {/* Member Filter Dropdown (Only shown in Group Public scope) */}
              {workspaceScope === 'PUBLIC_LAB' && (
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
              )}

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
                    totalBlockers > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-slate-400'
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

            {/* Right: Smart Planning & Template Shortcuts (only shown inline in Full View; always in "+ New" menu) + Collapse */}
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              {!simpleMode && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsFeatureGuideOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-500/50 text-xs font-medium transition-colors"
                    title={isZh ? '功能一览与上手指南' : 'Feature Overview & Quick Start'}
                  >
                    <Compass className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>{t.featureGuide}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openTemplateModal()}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-300 hover:border-indigo-500/50 hover:bg-indigo-500/5 text-xs font-semibold transition-all"
                    title={isZh ? '管理与注入自定义执行清单及验收标准模板' : 'Manage custom checklist & acceptance templates'}
                  >
                    <BookmarkPlus className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                    <span>{isZh ? '模板库' : 'Templates'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsReverseDDLOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 text-xs font-semibold transition-all"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 fill-amber-400/20" />
                    <span>{t.reverseDDL}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAIImportOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/12 border border-indigo-500/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20 text-xs font-bold transition-all shadow-sm"
                    title={t.aiImportTitle}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 fill-indigo-400/20" />
                    <span>{t.aiImport}</span>
                  </button>

                  <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 hidden sm:block" />
                </>
              )}

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
