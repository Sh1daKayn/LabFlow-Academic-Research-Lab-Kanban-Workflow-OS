'use client';

// Gantt View
import React, { useState } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import { formatDate, formatCountdownBadge } from '@/utils/date';

export const GanttView: React.FC = () => {
  const {
    tasks,
    language,
    t,
    filterMemberId,
    filterOnlyBlockers,
    searchQuery,
    updateTaskProgress,
    updateTaskDates,
    setSelectedTask,
    setActiveBlockerTask,
  } = useLabFlow();

  const [timeScale, setTimeScale] = useState<'weekly' | 'monthly'>('weekly');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Reference timeline window: 2026-10-01 to 2027-02-28 (150 days)
  const timelineStart = new Date('2026-10-01').getTime();
  const timelineEnd = new Date('2027-02-28').getTime();
  const totalDays = Math.ceil((timelineEnd - timelineStart) / (1000 * 60 * 60 * 24));

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (filterOnlyBlockers && !task.isBlocked) return false;
    if (filterMemberId !== 'all' && task.leadAuthor.id !== filterMemberId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchTag = task.projectTag.toLowerCase().includes(q);
      const matchVenue = task.targetVenue.toLowerCase().includes(q);
      if (!matchTitle && !matchTag && !matchVenue) return false;
    }
    return true;
  });

  // Generate date columns for header ticks
  const generateTicks = () => {
    const ticks: { label: string; date: Date; leftPercent: number }[] = [];
    const stepDays = timeScale === 'weekly' ? 7 : 30;

    for (let day = 0; day < totalDays; day += stepDays) {
      const d = new Date(timelineStart + day * 24 * 60 * 60 * 1000);
      const leftPercent = (day / totalDays) * 100;
      const label =
        language === 'zh'
          ? `${d.getMonth() + 1}月${d.getDate()}日`
          : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      ticks.push({ label, date: d, leftPercent });
    }
    return ticks;
  };

  const ticks = generateTicks();

  // Helper to compute horizontal position of task bar
  const getTaskBarCoords = (startDateStr?: string, deadlineStr?: string) => {
    const defaultStart = startDateStr
      ? new Date(startDateStr).getTime()
      : new Date(deadlineStr || '2026-11-01').getTime() - 25 * 24 * 60 * 60 * 1000;
    const defaultEnd = deadlineStr
      ? new Date(deadlineStr).getTime()
      : defaultStart + 20 * 24 * 60 * 60 * 1000;

    const clampedStart = Math.max(timelineStart, defaultStart);
    const clampedEnd = Math.min(timelineEnd, Math.max(clampedStart + 24 * 60 * 60 * 1000, defaultEnd));

    const left = ((clampedStart - timelineStart) / (timelineEnd - timelineStart)) * 100;
    const width = Math.max(2, ((clampedEnd - clampedStart) / (timelineEnd - timelineStart)) * 100);

    return { left: Math.max(0, Math.min(left, 98)), width: Math.min(width, 100 - left) };
  };

  const shiftTaskDays = (taskId: string, days: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const curDeadline = new Date(task.deadline);
    curDeadline.setDate(curDeadline.getDate() + days);
    const newDeadline = curDeadline.toISOString().split('T')[0];

    let newStart = task.startDate;
    if (task.startDate) {
      const curStart = new Date(task.startDate);
      curStart.setDate(curStart.getDate() + days);
      newStart = curStart.toISOString().split('T')[0];
    }

    updateTaskDates(taskId, newStart, newDeadline);
  };

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 max-w-[1720px] mx-auto w-full overflow-hidden">
      {/* Top Gantt Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              {t.gantt}
            </span>
            <span className="text-xs text-slate-400">
              {language === 'zh' ? '2026年10月 - 2027年2月' : 'Oct 2026 - Feb 2027'}
            </span>
          </div>
          <h1 className="text-base font-bold text-slate-100 mt-0.5">{t.ganttTitle}</h1>
          <p className="text-xs text-slate-400">{t.ganttDesc}</p>
        </div>

        {/* View scale toggles */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <button
              onClick={() => setTimeScale('weekly')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                timeScale === 'weekly'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.weekly}
            </button>
            <button
              onClick={() => setTimeScale('monthly')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                timeScale === 'monthly'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.monthly}
            </button>
          </div>
        </div>
      </div>

      {/* Main Gantt Canvas */}
      <div className="flex-1 flex flex-col rounded-2xl bg-slate-950/80 border border-slate-800 overflow-hidden shadow-xl">
        {/* Header Ticks Bar */}
        <div className="flex border-b border-slate-800 bg-slate-900/80 select-none">
          {/* Left label column */}
          <div className="w-80 shrink-0 p-3 text-xs font-bold text-slate-300 border-r border-slate-800">
            {language === 'zh' ? '课题任务 / 负责人' : 'Paper Tasks / Assignee'}
          </div>

          {/* Right timeline grid header */}
          <div className="flex-1 relative h-10 overflow-hidden">
            {ticks.map((tick, idx) => (
              <div
                key={idx}
                className="absolute top-0 bottom-0 border-l border-slate-800/80 text-[10px] text-slate-400 pl-1.5 pt-2"
                style={{ left: `${tick.leftPercent}%` }}
              >
                {tick.label}
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
          {filteredTasks.map((task) => {
            const coords = getTaskBarCoords(task.startDate, task.deadline);
            const ddlBadge = formatCountdownBadge(task.deadline, language);
            const isEditing = editingTaskId === task.id;

            // Bar background color
            const barBg = task.isBlocked
              ? 'bg-red-600/90 border-red-400 ring-2 ring-red-500/50'
              : task.stage === 'ACCEPTED'
              ? 'bg-emerald-600/90 border-emerald-400'
              : task.stage === 'DATA_EXP'
              ? 'bg-cyan-600/90 border-cyan-400'
              : task.stage === 'DRAFTING'
              ? 'bg-amber-600/90 border-amber-400'
              : task.stage === 'PI_REVIEW'
              ? 'bg-blue-600/90 border-blue-400'
              : 'bg-purple-600/90 border-purple-400';

            return (
              <div
                key={task.id}
                className={`flex hover:bg-slate-900/40 transition-colors ${
                  isEditing ? 'bg-slate-900/60' : ''
                }`}
              >
                {/* Left Task Metadata */}
                <div className="w-80 shrink-0 p-3 border-r border-slate-800 flex flex-col justify-center space-y-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 truncate">
                      {task.projectTag}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full border ${ddlBadge.className}`}>
                      {ddlBadge.text}
                    </span>
                  </div>

                  <h4
                    onClick={() => setSelectedTask(task)}
                    className="text-xs font-semibold text-slate-100 hover:text-cyan-300 cursor-pointer truncate transition-colors"
                    title={task.title}
                  >
                    {task.title}
                  </h4>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                    <span className="truncate">
                      {language === 'zh' ? task.leadAuthor.nameZh : task.leadAuthor.nameEn}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-cyan-400">{task.progress || 0}%</span>
                      <button
                        onClick={() => setEditingTaskId(isEditing ? null : task.id)}
                        className="text-slate-500 hover:text-slate-300 text-[10px] underline"
                      >
                        {isEditing ? (language === 'zh' ? '收起' : 'Close') : (language === 'zh' ? '调整' : 'Edit')}
                      </button>
                    </div>
                  </div>

                  {/* Inline quick adjustment drawer when clicked */}
                  {isEditing && (
                    <div className="mt-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs">
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>{t.progress}</span>
                          <span className="font-mono text-cyan-400">{task.progress || 0}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={task.progress || 0}
                          onChange={(e) => updateTaskProgress(task.id, parseInt(e.target.value))}
                          className="w-full accent-cyan-500 h-1 bg-slate-800 rounded cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-1 pt-1 text-[10px]">
                        <span className="text-slate-400">{language === 'zh' ? '平移工期:' : 'Shift Days:'}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => shiftTaskDays(task.id, -7)}
                            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                          >
                            -7d
                          </button>
                          <button
                            onClick={() => shiftTaskDays(task.id, 7)}
                            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                          >
                            +7d
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Timeline Bar Track */}
                <div className="flex-1 relative h-16 flex items-center overflow-hidden">
                  {/* Vertical grid lines */}
                  {ticks.map((tick, idx) => (
                    <div
                      key={idx}
                      className="absolute top-0 bottom-0 border-l border-slate-900 pointer-events-none"
                      style={{ left: `${tick.leftPercent}%` }}
                    />
                  ))}

                  {/* Task Bar */}
                  <div
                    onClick={() => {
                      if (task.isBlocked) {
                        setActiveBlockerTask(task);
                      } else {
                        setSelectedTask(task);
                      }
                    }}
                    className={`absolute h-8 rounded-lg border shadow-md cursor-pointer transition-all hover:scale-[1.01] hover:brightness-110 flex items-center px-2.5 overflow-hidden ${barBg}`}
                    style={{
                      left: `${coords.left}%`,
                      width: `${coords.width}%`,
                    }}
                    title={`${task.title} (${formatDate(task.startDate, language)} - ${formatDate(task.deadline, language)})`}
                  >
                    {/* Progress dark shading */}
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-black/25 pointer-events-none transition-all"
                      style={{ width: `${task.progress || 0}%` }}
                    />

                    {/* Bar Text */}
                    <div className="relative z-10 flex items-center justify-between w-full min-w-0 text-white text-[11px] font-medium gap-1.5 drop-shadow">
                      <div className="flex items-center gap-1 min-w-0">
                        {task.isBlocked && (
                          <span className="flex h-2 w-2 relative shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                          </span>
                        )}
                        <span className="truncate font-semibold">{task.title}</span>
                      </div>

                      <span className="text-[10px] font-mono shrink-0 opacity-90 hidden sm:inline">
                        {task.progress || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredTasks.length === 0 && (
            <div className="p-12 text-center text-slate-500 text-xs">
              {t.noTasksInStage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
