'use client';

import React, { useState, useEffect } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import {
  Presentation,
  Copy,
  Download,
  Flame,
  CheckCircle2,
  Clock,
  Users,
  Timer,
  Calendar,
} from 'lucide-react';
import { generateMeetingMinutesMarkdown, formatDate, formatCountdownBadge } from '@/utils/date';
import { BLOCKER_CATEGORIES } from '@/data/mockData';

export const GroupMeetingView: React.FC = () => {
  const {
    tasks,
    projects,
    members,
    resources,
    filterMemberId,
    setFilterMemberId,
    setActiveBlockerTask,
    resolveBlocker,
    setSelectedTask,
    addToast,
  } = useLabFlow();

  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [meetingSeconds, setMeetingSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [minutesPreview, setMinutesPreview] = useState<string | null>(null);

  // Sync with global filter member if needed
  useEffect(() => {
    if (filterMemberId !== 'all') {
      setSelectedMember(filterMemberId);
    }
  }, [filterMemberId]);

  // Meeting timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTimerRunning) {
      timer = setInterval(() => {
        setMeetingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Filter tasks based on selected presenter
  const filteredTasks = selectedMember === 'all'
    ? tasks
    : tasks.filter((t) => t.leadAuthor.id === selectedMember);

  // 3 Columns:
  // 1. Completed Recently
  const completedTasks = filteredTasks.filter(
    (t) => t.stage === 'ACCEPTED' || !!t.completedAt
  );

  // 2. Active & In Progress
  const activeTasks = filteredTasks.filter(
    (t) => !t.isBlocked && t.stage !== 'ACCEPTED' && !t.completedAt
  );

  // 3. Critical Blockers Requiring PI Decision
  const blockedTasks = filteredTasks.filter((t) => t.isBlocked);

  const handleExportMinutes = () => {
    const md = generateMeetingMinutesMarkdown({
      labName: 'Sloan Computational & Applied Economics Lab (SCAEL)',
      piName: 'Prof. Malone',
      members,
      tasks,
      projects,
      resources,
      selectedMemberId: selectedMember,
    });

    navigator.clipboard
      .writeText(md)
      .then(() => {
        addToast(
          '📋 Meeting Minutes Copied!',
          'Markdown minutes copied to clipboard. Ready to paste into Slack, Notion, or Email.',
          'success'
        );
      })
      .catch(() => {
        // Fallback
        setMinutesPreview(md);
      });
  };

  const handleDownloadMinutes = () => {
    const md = generateMeetingMinutesMarkdown({
      labName: 'Sloan Computational & Applied Economics Lab (SCAEL)',
      piName: 'Prof. Malone',
      members,
      tasks,
      projects,
      resources,
      selectedMemberId: selectedMember,
    });
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LabFlow_Meeting_Minutes_${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('File Downloaded', 'Exported Meeting Minutes Markdown file.', 'info');
  };

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 max-w-[1720px] mx-auto w-full">
      {/* Top Standup Presenter Bar */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-5 mb-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left info */}
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <Presentation className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Presenter Dashboard
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <h1 className="text-lg font-bold text-slate-100 mt-0.5">
                Lab Group Meeting Standup (无PPT组会投屏模式)
              </h1>
              <p className="text-xs text-slate-400">
                Live board projection for sprint review, peer unblocking, and advisor decisions.
              </p>
            </div>
          </div>

          {/* Right actions: Meeting Timer + Export Button */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Live Standup Timer */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
              <Timer className="w-4 h-4 text-cyan-400 animate-spin-slow" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-semibold text-slate-500">
                  Meeting Timer
                </span>
                <span className="font-mono text-xs font-bold text-cyan-300">
                  {formatTimer(meetingSeconds)}
                </span>
              </div>
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="ml-1 text-[10px] text-slate-400 hover:text-white"
              >
                {isTimerRunning ? 'Pause' : 'Resume'}
              </button>
            </div>

            {/* Export Markdown Minutes Button */}
            <button
              onClick={handleExportMinutes}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-cyan-600/20 transition-all"
              title="Generate structured Markdown meeting minutes & copy to clipboard"
            >
              <Copy className="w-4 h-4" />
              <span>Export Markdown Minutes (导出组会纪要)</span>
            </button>

            {/* Download .md */}
            <button
              onClick={handleDownloadMinutes}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Download minutes as .md file"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Presenter / Member Selector Pills */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-semibold text-slate-400 shrink-0 mr-1 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            Presenter:
          </span>

          <button
            onClick={() => {
              setSelectedMember('all');
              setFilterMemberId('all');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border shrink-0 transition-all ${
              selectedMember === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 font-bold shadow-sm'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <span>All Lab Members (全员)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
              {tasks.length}
            </span>
          </button>

          {members.map((m) => {
            const memberTaskCount = tasks.filter((t) => t.leadAuthor.id === m.id).length;
            const hasBlockers = tasks.some((t) => t.leadAuthor.id === m.id && t.isBlocked);
            const isSelected = selectedMember === m.id;

            return (
              <button
                key={m.id}
                onClick={() => {
                  setSelectedMember(m.id);
                  setFilterMemberId(m.id);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border shrink-0 transition-all ${
                  isSelected
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/60 font-bold shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <span>{m.name}</span>
                <span className="text-[10px] text-slate-400">[{m.role}]</span>
                {hasBlockers && (
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" title="Has active blocker" />
                )}
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
                  {memberTaskCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3-Column Executive Summary Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 items-start pb-8">
        {/* Column 1: Completed Recently (近期进展) */}
        <div className="flex flex-col rounded-2xl bg-slate-950/70 border border-slate-800/90 p-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  1. Completed Recently
                </h2>
                <span className="text-[11px] text-emerald-400 font-medium">近期进展与录用</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {completedTasks.length}
            </span>
          </div>

          <div className="space-y-3">
            {completedTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTask(t)}
                className="cursor-pointer p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    {t.projectTag}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {formatDate(t.completedAt || t.deadline)}
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-slate-100 group-hover:text-emerald-300 transition-colors leading-snug">
                  {t.title}
                </h3>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                  <span>Lead: {t.leadAuthor.name}</span>
                  <span className="text-emerald-400/90 font-medium">Stage: Accepted / Archived</span>
                </div>
              </div>
            ))}

            {completedTasks.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                No archived milestones under current presenter filter.
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Active & In Progress (当前推进) */}
        <div className="flex flex-col rounded-2xl bg-slate-950/70 border border-slate-800/90 p-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  2. Active & In Progress
                </h2>
                <span className="text-[11px] text-cyan-400 font-medium">当前实验、建模与撰写</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              {activeTasks.length}
            </span>
          </div>

          <div className="space-y-3">
            {activeTasks.map((t) => {
              const ddl = formatCountdownBadge(t.deadline);
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTask(t)}
                  className="cursor-pointer p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      {t.projectTag}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${ddl.className}`}>
                      {ddl.text}
                    </span>
                  </div>
                  <h3 className="text-xs font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors leading-snug">
                    {t.title}
                  </h3>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                    <span>Lead: {t.leadAuthor.name}</span>
                    <span className="text-cyan-400/90 font-medium">[{t.stage}]</span>
                  </div>
                </div>
              );
            })}

            {activeTasks.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                No active in-progress tasks found.
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Critical Blockers Requiring PI Decision (核心卡点与求助) */}
        <div className="flex flex-col rounded-2xl bg-red-950/20 border-2 border-red-500/50 p-4 shadow-xl shadow-red-950/20">
          <div className="flex items-center justify-between pb-3 border-b border-red-500/30 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400">
                <Flame className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-red-200 uppercase tracking-wider">
                  3. Critical Blockers (PI Decision)
                </h2>
                <span className="text-[11px] text-red-300 font-medium">核心卡点与求助对象</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse">
              {blockedTasks.length} Active
            </span>
          </div>

          <div className="space-y-3">
            {blockedTasks.map((t) => {
              const catMeta = t.blocker
                ? BLOCKER_CATEGORIES[t.blocker.category] || BLOCKER_CATEGORIES.OTHER
                : null;

              return (
                <div
                  key={t.id}
                  className="p-4 rounded-xl bg-slate-900 border border-red-500/50 space-y-2.5 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40">
                      {t.projectTag}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-red-500/20 text-red-300 border border-red-500/40">
                      {catMeta?.labelZh || '卡点'}
                    </span>
                  </div>

                  <h3
                    onClick={() => setSelectedTask(t)}
                    className="text-xs font-bold text-slate-100 hover:text-red-300 cursor-pointer transition-colors leading-snug"
                  >
                    {t.title}
                  </h3>

                  {/* Where stuck */}
                  <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-xs">
                    <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-0.5">
                      Technical Bottleneck:
                    </div>
                    <p className="text-slate-200 leading-relaxed text-[11px]">
                      {t.blocker?.details}
                    </p>
                  </div>

                  {/* What tried */}
                  {t.blocker?.tried && (
                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                        What Has Been Tried:
                      </div>
                      <p className="text-slate-300 leading-relaxed text-[11px]">
                        {t.blocker.tried}
                      </p>
                    </div>
                  )}

                  {/* Decision Needed from PI & Quick Unblock button */}
                  <div className="pt-1 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-slate-300">
                      <span className="text-slate-500">Escalated to: </span>
                      <span className="font-bold text-cyan-300">
                        {t.blocker?.escalatedTo || t.pi.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setActiveBlockerTask(t)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => resolveBlocker(t.id)}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow transition-colors"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Resolve</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {blockedTasks.length === 0 && (
              <div className="p-8 text-center text-emerald-400 text-xs border border-dashed border-emerald-500/30 rounded-xl bg-emerald-950/10">
                🎉 No active blockers reported. Pipeline is clear!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Minutes Preview Modal if clipboard fallback */}
      {minutesPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-800 p-6 text-slate-100 max-h-[85vh] flex flex-col">
            <h3 className="text-sm font-bold text-slate-100 mb-2">Meeting Minutes Markdown</h3>
            <textarea
              readOnly
              value={minutesPreview}
              rows={15}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 leading-relaxed mb-4 flex-1"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setMinutesPreview(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-200 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
