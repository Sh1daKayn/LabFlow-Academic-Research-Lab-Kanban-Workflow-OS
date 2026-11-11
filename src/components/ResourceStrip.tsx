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
  const { resources, setIsResourceModalOpen } = useLabFlow();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const occupiedCount = resources.filter((r) => r.status === 'OCCUPIED').length;
  const idleCount = resources.filter((r) => r.status === 'IDLE').length;

  return (
    <div className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-sm transition-all duration-200">
      <div className="max-w-[1720px] mx-auto px-4 lg:px-6 py-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Left summary & toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors group"
            >
              <div className="p-1 rounded-md bg-slate-900 border border-slate-800 group-hover:border-slate-700">
                <Server className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <span className="tracking-tight">Lab Compute & Infrastructure</span>
              <span className="text-[10px] text-slate-400 font-normal">
                ({occupiedCount} busy, {idleCount} idle)
              </span>
              {isCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>

            {/* Quick claim action button */}
            <button
              onClick={() => setIsResourceModalOpen(true)}
              className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-2 py-0.5 rounded-md border border-cyan-500/30 transition-all"
            >
              <Cpu className="w-3 h-3" />
              <span>Claim / Manage Compute</span>
            </button>
          </div>

          {/* Right resource pills */}
          {!isCollapsed && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {resources.map((res) => {
                const isOccupied = res.status === 'OCCUPIED';
                const isIdle = res.status === 'IDLE';

                return (
                  <button
                    key={res.id}
                    onClick={() => setIsResourceModalOpen(true)}
                    className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs text-left shrink-0 transition-all duration-150 hover:scale-[1.01] ${
                      isOccupied
                        ? 'bg-slate-900/90 border-cyan-500/30 hover:border-cyan-500/50'
                        : isIdle
                        ? 'bg-slate-900/60 border-emerald-500/30 hover:border-emerald-500/50'
                        : 'bg-slate-900/60 border-purple-500/30 hover:border-purple-500/50'
                    }`}
                  >
                    {/* Status dot / pulse */}
                    <div className="relative flex h-2 w-2">
                      {isOccupied && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      )}
                      <span
                        className={`relative inline-flex rounded-full h-2 w-2 ${
                          isOccupied
                            ? 'bg-cyan-500'
                            : isIdle
                            ? 'bg-emerald-500'
                            : 'bg-purple-500'
                        }`}
                      ></span>
                    </div>

                    {/* Name */}
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-200 text-[11px]">
                          {res.name.split('(')[0].trim()}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1 rounded uppercase ${
                            isOccupied
                              ? 'bg-cyan-500/20 text-cyan-300'
                              : isIdle
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-purple-500/20 text-purple-300'
                          }`}
                        >
                          {res.status}
                        </span>
                      </div>

                      {/* Detail string */}
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 truncate max-w-[210px]">
                        {isOccupied ? (
                          <>
                            <span className="text-slate-300 font-medium">@{res.currentUser}</span>
                            <span>·</span>
                            <span className="truncate">{res.currentJob}</span>
                            {res.remainingHours && (
                              <span className="text-cyan-400 font-mono">
                                ({res.remainingHours}h)
                              </span>
                            )}
                          </>
                        ) : isIdle ? (
                          <span className="text-emerald-400/90 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Ready for batch runs
                          </span>
                        ) : (
                          <span className="text-purple-300 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {res.currentUser ? `Queued: @${res.currentUser}` : 'Reserved'}
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
