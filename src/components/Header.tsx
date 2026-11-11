'use client';

import React from 'react';
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
    members,
    setIsReverseDDLOpen,
    setIsNewTaskOpen,
    resetToMockData,
  } = useLabFlow();

  const totalBlockers = tasks.filter((t) => t.isBlocked).length;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-[1720px] mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Left: Branding & Lab Indicator */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-md shadow-indigo-500/25 text-white">
                <FlaskConical className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                    Lab<span className="text-cyan-400 font-extrabold">Flow</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                    Academic OS
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 -mt-0.5">
                  <span className="font-medium text-slate-300">SCAEL Lab</span>
                  <span className="text-slate-600">/</span>
                  <span className="text-slate-400 truncate max-w-[140px]">Prof. Malone Group</span>
                </div>
              </div>
            </div>

            {/* Separator */}
            <div className="hidden lg:block h-6 w-px bg-slate-800" />

            {/* View Mode Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800/90 text-xs">
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all duration-150 ${
                  viewMode === 'kanban'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title="Paper-First Academic Pipeline Board"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Kanban Board</span>
                <span className="hidden xl:inline text-[10px] text-indigo-200/80">(看板)</span>
              </button>

              <button
                onClick={() => setViewMode('meeting')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all duration-150 ${
                  viewMode === 'meeting'
                    ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title="Group Meeting Standup Mode (Presenter Dashboard)"
              >
                <Presentation className="w-3.5 h-3.5" />
                <span>Group Meeting</span>
                <span className="hidden xl:inline text-[10px] text-cyan-200/80">(组会投屏)</span>
              </button>
            </div>
          </div>

          {/* Middle: Search & Member Filter */}
          <div className="hidden md:flex items-center gap-2.5 flex-1 max-w-md mx-2">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search paper title, tag (e.g. AAAI), or lead author... (/)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Member Filter */}
            <div className="relative shrink-0">
              <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={filterMemberId}
                  onChange={(e) => setFilterMemberId(e.target.value)}
                  className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer appearance-none pr-4"
                >
                  <option value="all" className="bg-slate-900 text-slate-200">
                    All Members (全员)
                  </option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Right: Feature Toggles & Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Feature B: Only Show Blockers Toggle */}
            <button
              onClick={() => setFilterOnlyBlockers(!filterOnlyBlockers)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                filterOnlyBlockers
                  ? 'bg-rose-500/20 border-rose-500/70 text-rose-300 shadow-lg shadow-rose-500/20 ring-1 ring-rose-500/50'
                  : totalBlockers > 0
                  ? 'bg-slate-900 border-rose-500/40 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/60'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle to view only blocked tasks requiring intervention"
            >
              <Flame
                className={`w-3.5 h-3.5 ${
                  totalBlockers > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-500'
                }`}
              />
              <span className="hidden sm:inline">Only Blockers</span>
              <span className="text-[10px] text-rose-300 sm:hidden">Blockers</span>
              <span
                className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  filterOnlyBlockers
                    ? 'bg-rose-500 text-white'
                    : totalBlockers > 0
                    ? 'bg-rose-500/30 text-rose-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {totalBlockers}
              </span>
            </button>

            {/* Feature C: Reverse DDL Planner Launch Button */}
            <button
              onClick={() => setIsReverseDDLOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 hover:border-amber-500/70 text-xs font-semibold transition-all duration-150 shadow-sm shadow-amber-500/10"
              title="Launch Reverse DDL Scheduler (T-45, T-30, T-14, T-3 automatic milestones)"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
              <span className="hidden sm:inline">Reverse DDL</span>
              <span className="text-[10px] text-amber-400 sm:hidden">DDL</span>
            </button>

            {/* Quick New Task Button */}
            <button
              onClick={() => setIsNewTaskOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all duration-150 shadow-md shadow-indigo-600/30"
              title="Create new paper task or milestone"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Task</span>
            </button>

            {/* Demo Reset Button */}
            <button
              onClick={resetToMockData}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
              title="Reset to pristine academic demo state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-slate-300" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
