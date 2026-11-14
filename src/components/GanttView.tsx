'use client';

// Gantt View with Real-time Two-way Kanban Sync, Dynamic Timeline Auto-fitting, and Dual Grouping Modes
import React, { useState, useMemo } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import { formatDate, formatCountdownBadge } from '@/utils/date';
import {
  ChevronDown,
  ChevronRight,
  FolderKanban,
  Layers,
  Maximize2,
  Minimize2,
  Filter,
} from 'lucide-react';
import { TaskItem, ProjectItem, StageConfig, AcademicStage } from '@/types';

export const GanttView: React.FC = () => {
  const {
    tasks,
    stages,
    projects,
    language,
    t,
    filterMemberId,
    filterOnlyBlockers,
    searchQuery,
    selectedStageFilter,
    setSelectedStageFilter,
    selectedProjectFilter,
    setSelectedProjectFilter,
    sortByDDLUrgency,
    updateTaskProgress,
    updateTaskDates,
    moveTask,
    setSelectedTask,
    setActiveBlockerTask,
    canEditTask,
  } = useLabFlow();

  const [timeScale, setTimeScale] = useState<'weekly' | 'monthly'>('weekly');
  const [groupBy, setGroupBy] = useState<'project' | 'stage'>('project');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Collapsed state per group: { [groupId]: boolean }
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const collapseAll = () => {
    const allIds: Record<string, boolean> = {};
    if (groupBy === 'project') {
      projects.forEach((p) => {
        allIds[p.id] = true;
      });
      allIds['other'] = true;
    } else {
      stages.forEach((s) => {
        allIds[s.id] = true;
      });
      allIds['other'] = true;
    }
    setCollapsedGroups(allIds);
  };

  const expandAll = () => {
    setCollapsedGroups({});
  };

  // 1. Dynamic Auto-fitting Timeline Bounds based on real task dates
  const { timelineStart, timelineEnd, totalDays, startDateObj, endDateObj } = useMemo(() => {
    let minTime = Infinity;
    let maxTime = -Infinity;

    tasks.forEach((t) => {
      if (t.startDate) {
        const s = new Date(t.startDate).getTime();
        if (!isNaN(s)) minTime = Math.min(minTime, s);
      }
      if (t.deadline) {
        const e = new Date(t.deadline).getTime();
        if (!isNaN(e)) {
          maxTime = Math.max(maxTime, e);
          if (!t.startDate) minTime = Math.min(minTime, e - 25 * 24 * 60 * 60 * 1000);
        }
      }
    });

    const now = Date.now();
    if (minTime === Infinity) minTime = now - 15 * 24 * 60 * 60 * 1000;
    if (maxTime === -Infinity) maxTime = now + 90 * 24 * 60 * 60 * 1000;

    // Buffer: at least 7 days before earliest, at least 15 days after latest
    const startObj = new Date(minTime - 7 * 24 * 60 * 60 * 1000);
    // Align to the 1st of that month for clear visual tick alignment
    startObj.setDate(1);
    startObj.setHours(0, 0, 0, 0);

    const endObj = new Date(maxTime + 15 * 24 * 60 * 60 * 1000);
    // Align to the end of that month
    endObj.setMonth(endObj.getMonth() + 1, 0);
    endObj.setHours(23, 59, 59, 999);

    const startMs = startObj.getTime();
    const endMs = endObj.getTime();
    const days = Math.max(28, Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24)));

    return {
      timelineStart: startMs,
      timelineEnd: endMs,
      totalDays: days,
      startDateObj: startObj,
      endDateObj: endObj,
    };
  }, [tasks]);

  // 2. Filter tasks based on global search, blockers, member, stage, and selectedProjectFilter
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        if (filterOnlyBlockers && !task.isBlocked) return false;
        if (filterMemberId !== 'all' && task.leadAuthor.id !== filterMemberId) return false;
        if (selectedProjectFilter !== 'all' && task.projectId !== selectedProjectFilter) return false;
        if (selectedStageFilter !== 'all' && task.stage !== selectedStageFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = task.title.toLowerCase().includes(q);
          const matchTag = task.projectTag.toLowerCase().includes(q);
          const matchVenue = task.targetVenue.toLowerCase().includes(q);
          if (!matchTitle && !matchTag && !matchVenue) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortByDDLUrgency) {
          const timeA = new Date(a.deadline).getTime() || 9999999999999;
          const timeB = new Date(b.deadline).getTime() || 9999999999999;
          return timeA - timeB;
        }
        return a.order - b.order;
      });
  }, [
    tasks,
    filterOnlyBlockers,
    filterMemberId,
    selectedProjectFilter,
    selectedStageFilter,
    searchQuery,
    sortByDDLUrgency,
  ]);

  // 3. Dual Grouping Model: by Project or by Academic Stage
  interface GroupViewItem {
    id: string;
    tag: string;
    title: string;
    subtitle?: string;
    color?: string;
    badgeBg?: string;
    tasks: TaskItem[];
    project?: ProjectItem;
    stage?: StageConfig;
  }

  const groupViewItems = useMemo<GroupViewItem[]>(() => {
    if (groupBy === 'stage') {
      // Group by Academic Stage
      const items: GroupViewItem[] = stages.map((s) => {
        const stageTasks = filteredTasks.filter((t) => t.stage === s.id);
        return {
          id: s.id,
          tag: language === 'zh' ? s.labelZh : s.labelEn,
          title: language === 'zh' ? s.labelZh : s.labelEn,
          subtitle: language === 'zh' ? s.subTitleZh : s.subTitleEn,
          color: s.color,
          badgeBg: s.badgeBg,
          tasks: stageTasks,
          stage: s,
        };
      });

      // Leftover tasks with unknown/custom stage
      const knownIds = new Set(stages.map((s) => s.id));
      const orphans = filteredTasks.filter((t) => !knownIds.has(t.stage));
      if (orphans.length > 0) {
        items.push({
          id: 'other',
          tag: language === 'zh' ? '其他阶段' : 'Other Stage',
          title: language === 'zh' ? '未分类阶段任务' : 'Uncategorized Stage Tasks',
          color: 'text-slate-400',
          badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
          tasks: orphans,
        });
      }
      return items;
    }

    // Default: Group by Project
    const items: GroupViewItem[] = [];
    const projectMap = new Map<string, TaskItem[]>();

    filteredTasks.forEach((task) => {
      const pId = task.projectId || 'other';
      if (!projectMap.has(pId)) {
        projectMap.set(pId, []);
      }
      projectMap.get(pId)!.push(task);
    });

    // Insertion for registered projects
    projects.forEach((proj) => {
      const pTasks = projectMap.get(proj.id);
      if (pTasks && pTasks.length > 0) {
        items.push({
          id: proj.id,
          tag: proj.tag,
          title: proj.title,
          subtitle: proj.targetVenue,
          tasks: pTasks,
          project: proj,
        });
        projectMap.delete(proj.id);
      }
    });

    // Leftover unassigned or orphan project tasks
    projectMap.forEach((pTasks, pId) => {
      if (pTasks.length > 0) {
        items.push({
          id: pId,
          tag: pTasks[0]?.projectTag || 'Other',
          title: language === 'zh' ? '独立/其他学术任务' : 'Independent / Other Tasks',
          tasks: pTasks,
        });
      }
    });

    return items;
  }, [groupBy, stages, filteredTasks, projects, language]);

  // 4. Generate dynamic date columns for header ticks across dynamic timeline
  const ticks = useMemo(() => {
    const result: { label: string; date: Date; leftPercent: number }[] = [];
    const stepDays = timeScale === 'weekly' ? 7 : 30;

    for (let day = 0; day < totalDays; day += stepDays) {
      const d = new Date(timelineStart + day * 24 * 60 * 60 * 1000);
      const leftPercent = (day / totalDays) * 100;
      const label =
        language === 'zh'
          ? `${d.getMonth() + 1}月${d.getDate()}日`
          : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      result.push({ label, date: d, leftPercent });
    }
    return result;
  }, [timelineStart, totalDays, timeScale, language]);

  // 5. Helper to compute horizontal position of task bar relative to dynamic window
  const getTaskBarCoords = (startDateStr?: string, deadlineStr?: string) => {
    const defaultStart = startDateStr
      ? new Date(startDateStr).getTime()
      : new Date(deadlineStr || Date.now()).getTime() - 25 * 24 * 60 * 60 * 1000;
    const defaultEnd = deadlineStr
      ? new Date(deadlineStr).getTime()
      : defaultStart + 20 * 24 * 60 * 60 * 1000;

    const clampedStart = Math.max(timelineStart, defaultStart);
    const clampedEnd = Math.min(timelineEnd, Math.max(clampedStart + 24 * 60 * 60 * 1000, defaultEnd));

    const totalSpan = timelineEnd - timelineStart || 1;
    const left = ((clampedStart - timelineStart) / totalSpan) * 100;
    const width = Math.max(2, ((clampedEnd - clampedStart) / totalSpan) * 100);

    return {
      left: Math.max(0, Math.min(left, 98)),
      width: Math.min(width, 100 - left),
    };
  };

  // Helper to map dynamic stage color to vibrant bar background
  const getBarClasses = (task: TaskItem, stageConfig?: StageConfig) => {
    if (task.isBlocked) {
      return 'bg-rose-600/90 border-rose-400 ring-2 ring-rose-500/50 shadow-rose-950/40';
    }
    if (!stageConfig) return 'bg-indigo-600/90 border-indigo-400';

    if (stageConfig.color.includes('emerald') || stageConfig.id === 'ACCEPTED') {
      return 'bg-emerald-600/90 border-emerald-400 shadow-emerald-950/30';
    }
    if (stageConfig.color.includes('cyan') || stageConfig.id === 'DATA_EXP') {
      return 'bg-cyan-600/90 border-cyan-400 shadow-cyan-950/30';
    }
    if (stageConfig.color.includes('amber') || stageConfig.id === 'DRAFTING') {
      return 'bg-amber-600/90 border-amber-400 shadow-amber-950/30';
    }
    if (stageConfig.color.includes('blue') || stageConfig.id === 'PI_REVIEW') {
      return 'bg-blue-600/90 border-blue-400 shadow-blue-950/30';
    }
    if (stageConfig.color.includes('purple') || stageConfig.id === 'TOPIC_SURVEY') {
      return 'bg-purple-600/90 border-purple-400 shadow-purple-950/30';
    }
    if (stageConfig.color.includes('rose')) {
      return 'bg-rose-600/90 border-rose-400 shadow-rose-950/30';
    }
    if (stageConfig.color.includes('orange')) {
      return 'bg-orange-600/90 border-orange-400 shadow-orange-950/30';
    }
    return 'bg-indigo-600/90 border-indigo-400 shadow-indigo-950/30';
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
      {/* Top Gantt Header & Live Sync Indicators */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              {t.gantt}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {language === 'zh'
                ? `${startDateObj.getFullYear()}年${startDateObj.getMonth() + 1}月 - ${endDateObj.getFullYear()}年${endDateObj.getMonth() + 1}月`
                : `${startDateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${endDateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {language === 'zh' ? '看板双向实时同步' : 'Kanban 2-Way Synced'}
            </span>
          </div>
          <h1 className="text-base font-bold text-slate-100 mt-0.5">{t.ganttTitle}</h1>
          <p className="text-xs text-slate-400">{t.ganttDesc}</p>
        </div>

        {/* View Controls: Group By, Filters, and Scale */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dual Grouping Mode Switcher */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-950 border border-slate-800 text-xs shadow-inner">
            <button
              onClick={() => setGroupBy('project')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
                groupBy === 'project'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={language === 'zh' ? '按课题项目分组' : 'Group by Project'}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>{language === 'zh' ? '按项目分组' : 'By Project'}</span>
            </button>
            <button
              onClick={() => setGroupBy('stage')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
                groupBy === 'stage'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={language === 'zh' ? '按学术流转阶段分组' : 'Group by Academic Stage'}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{language === 'zh' ? '按阶段泳道' : 'By Stage'}</span>
            </button>
          </div>

          {/* Project Filter Selector (when in Project mode) */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedProjectFilter}
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer max-w-[150px] truncate"
            >
              <option value="all" className="bg-slate-900 text-slate-200">
                {t.allProjects} ({projects.length})
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                  [{p.tag}] {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Stage Filter Selector */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedStageFilter}
              onChange={(e) => setSelectedStageFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer max-w-[140px] truncate"
            >
              <option value="all" className="bg-slate-900 text-slate-200">
                {t.allStages} ({stages.length})
              </option>
              {stages.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                  {language === 'zh' ? s.labelZh : s.labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Expand/Collapse All Buttons */}
          <div className="flex items-center rounded-xl bg-slate-950 border border-slate-800 p-0.5 text-xs">
            <button
              onClick={expandAll}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title={language === 'zh' ? '全部展开' : 'Expand All'}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={collapseAll}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title={language === 'zh' ? '全部折叠' : 'Collapse All'}
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* View scale toggles (Weekly vs Monthly) */}
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
          <div className="w-84 shrink-0 p-3 text-xs font-bold text-slate-300 border-r border-slate-800 flex items-center justify-between">
            <span>
              {groupBy === 'project'
                ? language === 'zh'
                  ? '课题项目分组 / 任务项'
                  : 'Project Groups & Tasks'
                : language === 'zh'
                ? '学术流转阶段泳道 / 任务项'
                : 'Academic Stage Swimlanes & Tasks'}
            </span>
            <span className="text-[10px] text-slate-500 font-normal">
              {filteredTasks.length} {language === 'zh' ? '个任务' : 'tasks'}
            </span>
          </div>

          {/* Right dynamic timeline grid header */}
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

        {/* Grouped Rows */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
          {groupViewItems.map((group) => {
            const isCollapsed = !!collapsedGroups[group.id];
            const avgProgress =
              group.tasks.length > 0
                ? Math.round(
                    group.tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / group.tasks.length
                  )
                : 0;

            return (
              <div key={group.id} className="flex flex-col">
                {/* Collapsible Group Header */}
                <div
                  onClick={() => toggleGroupCollapse(group.id)}
                  className="flex items-center border-b border-slate-800/80 bg-slate-900/90 hover:bg-slate-900 cursor-pointer select-none transition-colors"
                >
                  <div className="w-84 shrink-0 p-2.5 px-3 border-r border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-indigo-400 shrink-0" />
                      )}
                      {groupBy === 'project' ? (
                        <FolderKanban className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      ) : (
                        <span className={`w-2.5 h-2.5 rounded-full ${group.color?.replace('text-', 'bg-') || 'bg-indigo-400'} shrink-0`} />
                      )}
                      <span className="text-xs font-bold text-slate-100 truncate" title={group.title}>
                        {groupBy === 'project' ? `[${group.tag}] ${group.title}` : group.title}
                      </span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 shrink-0 font-medium">
                      {group.tasks.length}
                    </span>
                  </div>

                  {/* Summary bar on timeline track for this group */}
                  <div className="flex-1 px-4 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-400">
                        {group.subtitle || ''}
                      </span>
                      {group.project?.submissionDeadline && (
                        <span className="text-[10px] text-amber-400/90 font-mono">
                          DDL: {formatDate(group.project.submissionDeadline, language)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {avgProgress}% {language === 'zh' ? '完成' : 'Done'}
                      </span>
                      <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full transition-all"
                          style={{ width: `${avgProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subtask rows when not collapsed */}
                {!isCollapsed &&
                  group.tasks.map((task) => {
                    const coords = getTaskBarCoords(task.startDate, task.deadline);
                    const ddlBadge = formatCountdownBadge(task.deadline, language);
                    const isEditing = editingTaskId === task.id;
                    const stageConfig = stages.find((s) => s.id === task.stage);
                    const barBg = getBarClasses(task, stageConfig);

                    return (
                      <div
                        key={task.id}
                        className={`flex hover:bg-slate-900/40 transition-colors border-b border-slate-800/40 ${
                          isEditing ? 'bg-slate-900/60' : ''
                        }`}
                      >
                        {/* Left Task Metadata */}
                        <div className="w-84 shrink-0 p-3 pl-7 border-r border-slate-800 flex flex-col justify-center space-y-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 truncate">
                                {task.projectTag}
                              </span>
                              {stageConfig && (
                                <span
                                  className={`text-[9px] font-medium px-1.5 py-0.2 rounded-full border truncate ${
                                    stageConfig.badgeBg ||
                                    'bg-slate-800 text-slate-300 border-slate-700'
                                  }`}
                                  title={language === 'zh' ? stageConfig.labelZh : stageConfig.labelEn}
                                >
                                  {language === 'zh' ? stageConfig.labelZh : stageConfig.labelEn}
                                </span>
                              )}
                            </div>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded-full border shrink-0 ${ddlBadge.className}`}
                            >
                              {ddlBadge.text}
                            </span>
                          </div>

                          <h4
                            onClick={() => {
                              if (task.isBlocked) {
                                setActiveBlockerTask(task);
                              } else {
                                setSelectedTask(task);
                              }
                            }}
                            className="text-xs font-semibold text-slate-100 hover:text-cyan-300 cursor-pointer truncate transition-colors flex items-center gap-1.5"
                            title={task.title}
                          >
                            {task.isBlocked && (
                              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-ping" />
                            )}
                            <span className="truncate">{task.title}</span>
                          </h4>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                            <span className="truncate">
                              {language === 'zh' ? task.leadAuthor.nameZh : task.leadAuthor.nameEn}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-cyan-400">{task.progress || 0}%</span>
                              {canEditTask(task) && (
                                <button
                                  onClick={() => setEditingTaskId(isEditing ? null : task.id)}
                                  className="text-slate-500 hover:text-slate-300 text-[10px] underline"
                                >
                                  {isEditing
                                    ? language === 'zh'
                                      ? '收起'
                                      : 'Close'
                                    : language === 'zh'
                                    ? '调整'
                                    : 'Edit'}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Inline quick adjustment drawer when clicked */}
                          {isEditing && canEditTask(task) && (
                            <div className="mt-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs">
                              {/* Stage Selector */}
                              <div className="flex items-center justify-between gap-1 text-[10px]">
                                <span className="text-slate-400">{t.academicStage}:</span>
                                <select
                                  value={task.stage}
                                  onChange={(e) => moveTask(task.id, e.target.value as AcademicStage)}
                                  className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:border-indigo-500 max-w-[170px] truncate"
                                >
                                  {stages.map((s) => (
                                    <option key={s.id} value={s.id}>
                                      {language === 'zh' ? s.labelZh : s.labelEn}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Progress Slider */}
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

                              {/* Shift Days */}
                              <div className="flex items-center justify-between gap-1 pt-1 text-[10px]">
                                <span className="text-slate-400">
                                  {language === 'zh' ? '平移工期:' : 'Shift Days:'}
                                </span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => shiftTaskDays(task.id, -7)}
                                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                                  >
                                    -7d
                                  </button>
                                  <button
                                    onClick={() => shiftTaskDays(task.id, 7)}
                                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
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
                            title={`${task.title} (${formatDate(task.startDate, language)} - ${formatDate(task.deadline, language)}) [${stageConfig?.labelZh || task.stage}]`}
                          >
                            {/* Progress dark shading */}
                            <div
                              className="absolute left-0 top-0 bottom-0 bg-black/25 pointer-events-none transition-all"
                              style={{ width: `${task.progress || 0}%` }}
                            />

                            {/* Bar Text with Stage Tag and Title */}
                            <div className="relative z-10 flex items-center justify-between w-full min-w-0 text-white text-[11px] font-medium gap-1.5 drop-shadow">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {task.isBlocked && (
                                  <span className="flex h-2 w-2 relative shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                  </span>
                                )}
                                <span className="text-[9px] opacity-90 px-1 py-0.2 rounded bg-black/25 shrink-0 hidden md:inline">
                                  {language === 'zh' ? stageConfig?.labelZh : stageConfig?.labelEn}
                                </span>
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
              </div>
            );
          })}

          {groupViewItems.length === 0 && (
            <div className="p-12 text-center text-slate-500 text-xs">
              {t.noTasksInStage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
