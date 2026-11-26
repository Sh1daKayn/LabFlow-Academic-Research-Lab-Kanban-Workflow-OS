'use client';

import React, { useState } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import {
  Server,
  Cpu,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

export const ResourceStrip: React.FC = () => {
  const { resources, setIsResourceModalOpen, language, t } = useLabFlow();
  const [isCollapsed, setIsCollapsed] = useState(true); // Default collapsed for clean visual calm!

  const occupiedCount = resources.filter((r) => r.status === 'OCCUPIED').length;
  const idleCount = resources.filter((r) => r.status === 'IDLE').length;

  return (
    <div className="border-b border-slate-200 dark:border-slate-800/80 bg-white/85 dark:bg-slate-950/60 backdrop-blur-sm transition-all duration-200">
      <div className="max-w-[1720px] mx-auto px-4 lg:px-6 py-1.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Left summary & toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors group"
            >
              <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 group-hover:border-indigo-400/50">
                <Server className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="tracking-tight">{t.computeTitle}</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                ({occupiedCount} {t.busyNodes}, {idleCount} {t.idleNodes})
              </span>
              {isCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              )}
            </button>

            {/* Quick claim action button */}
            <button
              onClick={() => setIsResourceModalOpen(true)}
              className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-0.5 rounded-md border border-indigo-500/30 transition-all"
            >
              <Cpu className="w-3 h-3" />
              <span>{t.claimManage}</span>
            </button>
          </div>

          {/* Right resource pills (expandable) */}
          {!isCollapsed && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none animate-in fade-in duration-150">
              {resources.map((res) => {
                const isOccupied = res.status === 'OCCUPIED';
                const isIdle = res.status === 'IDLE';
                const resName = language === 'zh' ? res.nameZh : res.nameEn;

                return (
                  <button
                    key={res.id}
                    onClick={() => setIsResourceModalOpen(true)}
                    className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs text-left shrink-0 transition-all duration-150 hover:scale-[1.01] ${
                      isOccupied
                        ? 'bg-indigo-50/70 dark:bg-slate-900/90 border-indigo-300 dark:border-indigo-500/35 hover:border-indigo-500/60'
                        : isIdle
                        ? 'bg-emerald-50/70 dark:bg-slate-900/60 border-emerald-300 dark:border-emerald-500/35 hover:border-emerald-500/60'
                        : 'bg-amber-50/70 dark:bg-slate-900/60 border-amber-300 dark:border-amber-500/35 hover:border-amber-500/60'
                    }`}
                  >
                    {/* Status dot / pulse */}
                    <div className="relative flex h-2 w-2">
                      {isOccupied && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      )}
                      <span
                        className={`relative inline-flex rounded-full h-2 w-2 ${
                          isOccupied
                            ? 'bg-indigo-500'
                            : isIdle
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                        }`}
                      ></span>
                    </div>

                    {/* Name */}
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                          {resName.split('(')[0].trim()}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1 rounded uppercase ${
                            isOccupied
                              ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                              : isIdle
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                              : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {res.status}
                        </span>
                      </div>

                      {/* Detail string */}
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate max-w-[210px]">
                        {isOccupied ? (
                          <>
                            <span className="text-slate-700 dark:text-slate-300 font-medium">@{res.currentUser}</span>
                            <span>·</span>
                            <span className="truncate">{res.currentJob}</span>
                            {res.remainingHours && (
                              <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                                ({res.remainingHours}{t.hoursRemaining})
                              </span>
                            )}
                          </>
                        ) : isIdle ? (
                          <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            {t.readyForRuns}
                          </span>
                        ) : (
                          <span className="text-amber-700 dark:text-amber-300 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {res.currentUser ? `@${res.currentUser}` : t.reservedFor}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
