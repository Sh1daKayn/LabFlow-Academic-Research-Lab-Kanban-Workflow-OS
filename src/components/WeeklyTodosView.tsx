'use client';

import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  Plus,
  Send,
  ShieldCheck,
  RotateCcw,
  Trash2,
  GitBranch,
  FolderKanban,
  ListChecks,
  CalendarClock,
  Sparkles,
  ExternalLink,
  AlertCircle,
  BookmarkPlus,
  Settings2,
} from 'lucide-react';
import { useLabFlow } from '@/context/LabFlowContext';
import { Priority, WeeklyTodoAcceptanceStatus, WeeklyTodoItem } from '@/types';
import { MemberAvatar } from './MemberAvatar';
import {
  formatWeekRangeLabel,
  getWeekKey,
  isDateInWeek,
  shiftWeekKey,
} from '@/utils/weeklyTodos';

type TodoStatusFilter = 'ALL' | 'OPEN' | 'SUBMITTED' | 'ACCEPTED' | 'REVISION';

const PRIORITY_BADGES: Record<Priority, { labelZh: string; labelEn: string; cls: string }> = {
  URGENT: {
    labelZh: '紧急',
    labelEn: 'Urgent',
    cls: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  },
  HIGH: {
    labelZh: '高优',
    labelEn: 'High',
    cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  },
  MEDIUM: {
    labelZh: '常规',
    labelEn: 'Medium',
    cls: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
  },
  LOW: {
    labelZh: '低优',
    labelEn: 'Low',
    cls: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  },
};

export const WeeklyTodosView: React.FC = () => {
  const {
    language,
    t,
    members,
    currentUserId,
    projects,
    tasks,
    weeklyTodos,
    checklistTemplates,
    allowPeerAcceptance,
    isAdminUnlocked,
    setWorkspacePeerAcceptance,
    addWeeklyTodo,
    updateWeeklyTodo,
    deleteWeeklyTodo,
    acceptWeeklyTodo,
    canAcceptTodo,
    pushChecklistItemToWeeklyTodo,
    injectTemplateToWeeklyTodos,
    openTemplateModal,
    setSelectedTask,
    setLogicTreeTaskId,
  } = useLabFlow();

  const isZh = language === 'zh';

  const [selectedMemberId, setSelectedMemberId] = useState<string>(currentUserId || members[0]?.id || '');
  const [weekKey, setWeekKey] = useState<string>(() => getWeekKey());
  const [statusFilter, setStatusFilter] = useState<TodoStatusFilter>('ALL');

  // Quick Add state
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('MEDIUM');
  const [newProjectId, setNewProjectId] = useState<string>('');
  const [newTaskId, setNewTaskId] = useState<string>('');
  const [newChecklistItemId, setNewChecklistItemId] = useState<string>('');
  const [newCriteria, setNewCriteria] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [templateFeedback, setTemplateFeedback] = useState<string | null>(null);

  // Inline acceptance review comment state per todo
  const [reviewNotesMap, setReviewNotesMap] = useState<Record<string, string>>({});
  const [activeNoteTodoId, setActiveNoteTodoId] = useState<string | null>(null);

  const activeMember = useMemo(
    () => members.find((m) => m.id === selectedMemberId) || members[0],
    [members, selectedMemberId]
  );
  const resolvedMemberId = activeMember?.id || '';

  const activeTemplate = useMemo(
    () => checklistTemplates.find((tpl) => tpl.id === selectedTemplateId) || checklistTemplates[0],
    [checklistTemplates, selectedTemplateId]
  );

  // Quick member weekly stats for avatar strip cards
  const memberWeekSummary = useMemo(() => {
    const map = new Map<
      string,
      { total: number; done: number; awaiting: number; accepted: number; openPreview: string[] }
    >();
    for (const m of members) {
      map.set(m.id, { total: 0, done: 0, awaiting: 0, accepted: 0, openPreview: [] });
    }
    for (const item of weeklyTodos) {
      if (item.weekKey !== weekKey) continue;
      const stats = map.get(item.memberId);
      if (!stats) continue;
      stats.total += 1;
      if (item.done) stats.done += 1;
      if (item.acceptanceStatus === 'SUBMITTED') stats.awaiting += 1;
      if (item.acceptanceStatus === 'ACCEPTED') stats.accepted += 1;
      if (!item.done && stats.openPreview.length < 2) {
        stats.openPreview.push(item.title);
      }
    }
    return map;
  }, [members, weeklyTodos, weekKey]);

  // Selected member's todos for selected week
  const memberTodos = useMemo(() => {
    return weeklyTodos
      .filter((item) => item.memberId === resolvedMemberId && item.weekKey === weekKey)
      .filter((item) => {
        if (statusFilter === 'OPEN') {
          return item.acceptanceStatus === 'PENDING' && !item.done;
        }
        if (statusFilter === 'SUBMITTED') {
          return item.acceptanceStatus === 'SUBMITTED';
        }
        if (statusFilter === 'ACCEPTED') {
          return item.acceptanceStatus === 'ACCEPTED';
        }
        if (statusFilter === 'REVISION') {
          return item.acceptanceStatus === 'REVISION_REQUESTED';
        }
        return true;
      });
  }, [weeklyTodos, resolvedMemberId, weekKey, statusFilter]);

  const rawWeekCount = useMemo(
    () => weeklyTodos.filter((w) => w.memberId === resolvedMemberId && w.weekKey === weekKey),
    [weeklyTodos, resolvedMemberId, weekKey]
  );

  const selectedMemberTasks = useMemo(() => {
    return tasks.filter(
      (tk) =>
        tk.leadAuthor?.id === resolvedMemberId ||
        tk.pi?.id === resolvedMemberId ||
        projects.some((p) => p.id === tk.projectId && p.memberIds?.includes(resolvedMemberId))
    );
  }, [tasks, projects, resolvedMemberId]);

  const dueThisWeekTasks = useMemo(() => {
    return selectedMemberTasks.filter(
      (tk) => isDateInWeek(tk.deadline, weekKey) || (tk.checklist && tk.checklist.some((c) => !c.done))
    );
  }, [selectedMemberTasks, weekKey]);

  const selectableTasks = useMemo(() => {
    if (!newProjectId) return tasks;
    return tasks.filter((tk) => tk.projectId === newProjectId);
  }, [tasks, newProjectId]);

  const selectedFormTask = useMemo(
    () => tasks.find((tk) => tk.id === newTaskId),
    [tasks, newTaskId]
  );

  const unlockedModeActive = allowPeerAcceptance || isAdminUnlocked;

  const handleProjectChange = (pid: string) => {
    setNewProjectId(pid);
    setNewTaskId('');
    setNewChecklistItemId('');
  };

  const handleTaskChange = (tid: string) => {
    setNewTaskId(tid);
    setNewChecklistItemId('');
    const found = tasks.find((tk) => tk.id === tid);
    if (found && !newProjectId) {
      setNewProjectId(found.projectId);
    }
  };

  const handleChecklistChange = (cid: string) => {
    setNewChecklistItemId(cid);
    const matched = selectedFormTask?.checklist?.find((c) => c.id === cid);
    if (matched && !newTitle.trim()) {
      setNewTitle(matched.text);
    }
  };

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !resolvedMemberId) return;

    addWeeklyTodo({
      memberId: resolvedMemberId,
      weekKey,
      title: newTitle.trim(),
      done: false,
      priority: newPriority,
      projectId: newProjectId || selectedFormTask?.projectId || undefined,
      taskId: newTaskId || undefined,
      checklistItemId: newChecklistItemId || undefined,
      acceptanceCriteria: newCriteria.trim() || undefined,
    });

    setNewTitle('');
    setNewChecklistItemId('');
    setNewCriteria('');
  };

  const renderStatusBadge = (status: WeeklyTodoAcceptanceStatus) => {
    switch (status) {
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            <ShieldCheck className="w-3 h-3" />
            {isZh ? '已通过验收' : 'Accepted'}
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
            <Send className="w-3 h-3" />
            {isZh ? '待验收' : 'Awaiting Review'}
          </span>
        );
      case 'REVISION_REQUESTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
            <RotateCcw className="w-3 h-3" />
            {isZh ? '需补充修改' : 'Needs Revision'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            {isZh ? '推进中' : 'In Progress'}
          </span>
        );
    }
  };

  const alreadySyncedChecklistKeys = useMemo(() => {
    const set = new Set<string>();
    for (const w of weeklyTodos) {
      if (w.memberId === resolvedMemberId && w.weekKey === weekKey && w.taskId && w.checklistItemId) {
        set.add(`${w.taskId}:${w.checklistItemId}`);
      }
    }
    return set;
  }, [weeklyTodos, resolvedMemberId, weekKey]);

  const handleOpenTodoReviewNote = (todo: WeeklyTodoItem) => {
    setActiveNoteTodoId((prev) => (prev === todo.id ? null : todo.id));
    setReviewNotesMap((prev) =>
      prev[todo.id] !== undefined ? prev : { ...prev, [todo.id]: todo.notes || '' }
    );
  };

  return (
    <div className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-5 space-y-5">
      {/* Top Bar: Header + Week Navigation + Unlocked Peer Acceptance Switch */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <span>{t.weeklyTodosTitle}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.weeklyTodosDesc}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Week Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setWeekKey((prev) => shiftWeekKey(prev, -1))}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 transition-colors"
              title={isZh ? '上一周' : 'Previous Week'}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setWeekKey(getWeekKey())}
              className="px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
              title={isZh ? '点击回到本周' : 'Jump to Current Week'}
            >
              {formatWeekRangeLabel(weekKey, language)}
            </button>
            <button
              type="button"
              onClick={() => setWeekKey((prev) => shiftWeekKey(prev, 1))}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 transition-colors"
              title={isZh ? '下一周' : 'Next Week'}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Unlocked / Strict Acceptance Mode Switch */}
          <button
            type="button"
            onClick={() => setWorkspacePeerAcceptance(!allowPeerAcceptance)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
              unlockedModeActive
                ? 'bg-emerald-500/12 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/35 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20'
            }`}
            title={
              isZh
                ? '点击切换：开启非锁模式后，全组所有成员均可互相确认通过「项验收」'
                : 'Toggle peer acceptance mode'
            }
          >
            {unlockedModeActive ? (
              <>
                <Unlock className="w-3.5 h-3.5" />
                <span>{t.peerAcceptanceOpen}</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>{t.peerAcceptanceStrict}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Member Cards Strip: Avatar + Under-Avatar Weekly To-Do Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {members.map((member) => {
          const isSelected = member.id === resolvedMemberId;
          const summary = memberWeekSummary.get(member.id) || {
            total: 0,
            done: 0,
            awaiting: 0,
            accepted: 0,
            openPreview: [],
          };
          const primaryName = isZh ? member.nameZh : member.nameEn;
          const roleText = isZh ? member.titleZh : member.titleEn;

          return (
            <button
              key={member.id}
              type="button"
              onClick={() => setSelectedMemberId(member.id)}
              className={`text-left p-3 rounded-2xl border transition-all flex flex-col gap-2 ${
                isSelected
                  ? 'bg-cyan-500/10 dark:bg-cyan-500/15 border-cyan-500 shadow-sm ring-1 ring-cyan-500/30'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-cyan-400/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MemberAvatar member={member} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1">
                    {member.accessRole === 'ADMIN_PI' || member.role === 'PI' ? (
                      <span title={isZh ? '导师' : 'PI'}>👑</span>
                    ) : member.accessRole === 'SYS_ADMIN' ? (
                      <span title={isZh ? '系统管理员（学生协管）' : 'System Admin'}>🛡️</span>
                    ) : null}
                    <span className="truncate">{primaryName}</span>
                    {member.id === currentUserId && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 shrink-0">
                        {isZh ? '我' : 'Me'}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {roleText}
                  </div>
                </div>
              </div>

              {/* Under-avatar Weekly To-Do Mini Preview */}
              <div className="pt-1.5 border-t border-slate-200/70 dark:border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-medium">
                  <span className="text-slate-600 dark:text-slate-300">
                    {isZh ? '本周待办' : 'To-Do'}:{' '}
                    <strong className="text-slate-900 dark:text-white">
                      {summary.done}/{summary.total}
                    </strong>
                  </span>
                  {summary.awaiting > 0 ? (
                    <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/15 text-cyan-700 dark:text-cyan-300">
                      {isZh ? `待验 ${summary.awaiting}` : `${summary.awaiting} rev`}
                    </span>
                  ) : summary.accepted > 0 ? (
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                      ✓ {summary.accepted}
                    </span>
                  ) : null}
                </div>

                {summary.openPreview.length > 0 ? (
                  <div className="space-y-0.5">
                    {summary.openPreview.map((txt, idx) => (
                      <div
                        key={idx}
                        className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1"
                      >
                        <span className="w-1 h-1 rounded-full bg-cyan-500 shrink-0" />
                        <span className="truncate">{txt}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 italic truncate">
                    {summary.total > 0
                      ? isZh
                        ? '本周待办均已推进完成'
                        : 'All checked off'
                      : isZh
                      ? '暂无排期 To-Do'
                      : 'No To-Dos yet'}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left / Center (8 cols): Member Weekly To-Do List + Quick Add + Acceptance Actions */}
        <div className="lg:col-span-8 space-y-4">
          {/* Quick Add To-Do Form */}
          <form
            onSubmit={handleAddTodo}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MemberAvatar member={activeMember} size="sm" />
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {activeMember ? (isZh ? activeMember.nameZh : activeMember.nameEn) : ''}{' '}
                  <span className="text-slate-400 font-normal">·</span>{' '}
                  <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400">
                    {isZh ? '新增本周 To-Do 与验收项' : 'Add Weekly To-Do & Acceptance Item'}
                  </span>
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                {isZh
                  ? '可关联项目、任务卡及执行清单，勾选将双向实时同步'
                  : 'Optionally link a Project, Task & Checklist item for 2-way sync'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={
                  isZh
                    ? '输入本周需完成的具体工作事项（如：跑完消融实验并补全误差棒图表）...'
                    : 'Describe weekly To-Do item...'
                }
                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500"
              />
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as Priority)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-cyan-500"
              >
                <option value="URGENT">{isZh ? '紧急' : 'Urgent'}</option>
                <option value="HIGH">{isZh ? '高优先级' : 'High'}</option>
                <option value="MEDIUM">{isZh ? '常规' : 'Medium'}</option>
                <option value="LOW">{isZh ? '低优先级' : 'Low'}</option>
              </select>
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-45 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{isZh ? '添加到本周' : 'Add To-Do'}</span>
              </button>
            </div>

            {/* Optional Bindings: Project -> Task -> Checklist + Acceptance Criteria */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
              <select
                value={newProjectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-700 dark:text-slate-300 outline-none focus:border-cyan-500"
              >
                <option value="">{isZh ? '关联项目（可选）' : 'Link Project (optional)'}</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.tag}] {p.title}
                  </option>
                ))}
              </select>

              <select
                value={newTaskId}
                onChange={(e) => handleTaskChange(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-700 dark:text-slate-300 outline-none focus:border-cyan-500"
              >
                <option value="">{isZh ? '关联任务卡（可选）' : 'Link Task (optional)'}</option>
                {selectableTasks.map((tk) => (
                  <option key={tk.id} value={tk.id}>
                    {tk.title}
                  </option>
                ))}
              </select>

              <select
                value={newChecklistItemId}
                onChange={(e) => handleChecklistChange(e.target.value)}
                disabled={!selectedFormTask?.checklist?.length}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-700 dark:text-slate-300 outline-none focus:border-cyan-500 disabled:opacity-50"
              >
                <option value="">
                  {selectedFormTask?.checklist?.length
                    ? isZh
                      ? '绑定执行清单条目（可选）'
                      : 'Bind Checklist Item (optional)'
                    : isZh
                    ? '先选任务即可绑执行项'
                    : 'Select task for checklist'}
                </option>
                {selectedFormTask?.checklist?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.done ? '☑ ' : '☐ '}
                    {c.text}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={newCriteria}
                onChange={(e) => setNewCriteria(e.target.value)}
                placeholder={isZh ? '项验收标准（可选，如：附对比表）' : 'Acceptance criteria (optional)'}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-700 dark:text-slate-300 outline-none focus:border-cyan-500"
              />
            </div>

            {/* 模板一键生成与保存 (Template Injector) */}
            <div className="mt-2.5 pt-2.5 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isZh ? '模板一键生成' : 'Template Injector'}</span>
              </div>

              <select
                value={activeTemplate?.id || ''}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                disabled={checklistTemplates.length === 0}
                className="min-w-[180px] max-w-[280px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 disabled:opacity-50"
              >
                {checklistTemplates.length === 0 ? (
                  <option value="">{isZh ? '暂无模板，请先新建或保存' : 'No templates yet'}</option>
                ) : (
                  checklistTemplates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name} ({tpl.items.length})
                    </option>
                  ))
                )}
              </select>

              <button
                type="button"
                disabled={!activeTemplate || !resolvedMemberId}
                onClick={() => {
                  if (!activeTemplate || !resolvedMemberId) return;
                  const count = injectTemplateToWeeklyTodos({
                    templateId: activeTemplate.id,
                    memberId: resolvedMemberId,
                    weekKey,
                    projectId: newProjectId || undefined,
                    taskId: newTaskId || undefined,
                  });
                  setTemplateFeedback(
                    count > 0
                      ? isZh
                        ? `已注入 ${count} 项本周待办与验收标准`
                        : `Injected ${count} weekly item(s)`
                      : isZh
                      ? '本周已包含该模板全部条目'
                      : 'All template items already exist this week'
                  );
                  setTimeout(() => setTemplateFeedback(null), 3000);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-400 dark:disabled:bg-slate-700 text-white text-[11px] font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <Sparkles className="w-3 h-3" />
                <span>{isZh ? '一键生成本周待办与验收项' : 'Inject into This Week'}</span>
              </button>

              <button
                type="button"
                disabled={rawWeekCount.length === 0}
                onClick={() => {
                  const memberName = activeMember
                    ? isZh
                      ? activeMember.nameZh
                      : activeMember.nameEn
                    : '';
                  openTemplateModal({
                    name: `${memberName ? `${memberName} ` : ''}${isZh ? '周模板' : 'Weekly Template'}`,
                    category: isZh ? '周实验' : 'Weekly',
                    targetMemberId: resolvedMemberId,
                    targetWeekKey: weekKey,
                    items: rawWeekCount.map((w) => ({
                      text: w.title,
                      acceptanceCriteria: w.acceptanceCriteria,
                      priority: w.priority,
                    })),
                  });
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-40 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <BookmarkPlus className="w-3 h-3" />
                <span>{isZh ? '本周待办存为模板' : 'Save Week as Template'}</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  openTemplateModal({
                    targetMemberId: resolvedMemberId,
                    targetWeekKey: weekKey,
                  })
                }
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-500/50 text-slate-600 dark:text-slate-300 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                <Settings2 className="w-3 h-3" />
                <span>{isZh ? '管理模板库' : 'Manage Templates'}</span>
              </button>

              {templateFeedback && (
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                  {templateFeedback}
                </span>
              )}
            </div>
          </form>

          {/* Filter Strip + To-Do Items List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: 'ALL', zh: `全部 (${rawWeekCount.length})`, en: `All (${rawWeekCount.length})` },
                    {
                      id: 'OPEN',
                      zh: `推进中 (${rawWeekCount.filter((x) => x.acceptanceStatus === 'PENDING' && !x.done).length})`,
                      en: `Open (${rawWeekCount.filter((x) => x.acceptanceStatus === 'PENDING' && !x.done).length})`,
                    },
                    {
                      id: 'SUBMITTED',
                      zh: `待验收 (${rawWeekCount.filter((x) => x.acceptanceStatus === 'SUBMITTED').length})`,
                      en: `Awaiting (${rawWeekCount.filter((x) => x.acceptanceStatus === 'SUBMITTED').length})`,
                    },
                    {
                      id: 'ACCEPTED',
                      zh: `已验收 (${rawWeekCount.filter((x) => x.acceptanceStatus === 'ACCEPTED').length})`,
                      en: `Accepted (${rawWeekCount.filter((x) => x.acceptanceStatus === 'ACCEPTED').length})`,
                    },
                    {
                      id: 'REVISION',
                      zh: `需修改 (${rawWeekCount.filter((x) => x.acceptanceStatus === 'REVISION_REQUESTED').length})`,
                      en: `Revision (${rawWeekCount.filter((x) => x.acceptanceStatus === 'REVISION_REQUESTED').length})`,
                    },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      statusFilter === tab.id
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {isZh ? tab.zh : tab.en}
                  </button>
                ))}
              </div>
            </div>

            {memberTodos.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Sparkles className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {isZh
                    ? '当前筛选下暂无周待办条目，可在上方新建或从右侧课题执行清单导入'
                    : 'No weekly To-Do items match this filter yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {memberTodos.map((todo) => {
                  const linkedProject = projects.find((p) => p.id === todo.projectId);
                  const linkedTask = tasks.find((tk) => tk.id === todo.taskId);
                  const linkedChecklistItem = linkedTask?.checklist?.find(
                    (c) => c.id === todo.checklistItemId
                  );
                  const verifier = todo.acceptedById
                    ? members.find((m) => m.id === todo.acceptedById)
                    : undefined;
                  const canVerify = canAcceptTodo(todo);
                  const priorityMeta = PRIORITY_BADGES[todo.priority || 'MEDIUM'];
                  const isNoteOpen = activeNoteTodoId === todo.id;

                  return (
                    <div
                      key={todo.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        todo.acceptanceStatus === 'ACCEPTED'
                          ? 'bg-emerald-500/5 border-emerald-500/25'
                          : todo.acceptanceStatus === 'REVISION_REQUESTED'
                          ? 'bg-rose-500/5 border-rose-500/25'
                          : 'bg-slate-50/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Completion Checkbox */}
                        <button
                          type="button"
                          onClick={() => updateWeeklyTodo(todo.id, { done: !todo.done })}
                          className="mt-0.5 text-slate-400 hover:text-cyan-500 transition-colors shrink-0"
                          title={
                            linkedChecklistItem
                              ? isZh
                                ? '勾选将同步更新关联任务执行清单进度'
                                : 'Toggling syncs with linked task checklist'
                              : undefined
                          }
                        >
                          {todo.done ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>

                        {/* Core Content */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-sm font-semibold ${
                                todo.done
                                  ? 'line-through text-slate-400 dark:text-slate-500'
                                  : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {todo.title}
                            </span>

                            <span
                              className={`px-1.5 py-0.5 rounded border text-[10px] font-medium ${priorityMeta.cls}`}
                            >
                              {isZh ? priorityMeta.labelZh : priorityMeta.labelEn}
                            </span>

                            {renderStatusBadge(todo.acceptanceStatus)}
                          </div>

                          {/* Linked Project / Task / Checklist / Criteria Chips */}
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                            {linkedProject && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                                <FolderKanban className="w-3 h-3 text-cyan-500" />
                                <span className="font-medium">[{linkedProject.tag}]</span>
                                <span className="truncate max-w-[160px]">{linkedProject.title}</span>
                              </span>
                            )}

                            {linkedTask && (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setSelectedTask(linkedTask)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/25 transition-colors"
                                  title={isZh ? '点击打开该任务详情抽屉' : 'Open linked task details'}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span className="truncate max-w-[180px]">{linkedTask.title}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setLogicTreeTaskId(linkedTask.id)}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25 transition-colors"
                                  title={isZh ? '打开该任务的树状逻辑图' : 'Open Task Logic Tree'}
                                >
                                  <GitBranch className="w-3 h-3" />
                                  <span>{isZh ? '逻辑树' : 'Tree'}</span>
                                </button>
                              </div>
                            )}

                            {linkedChecklistItem && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                                <ListChecks className="w-3 h-3" />
                                {isZh ? '双向同步执行项' : 'Synced Checklist'}
                              </span>
                            )}
                          </div>

                          {/* Acceptance Criteria + Verifier Info */}
                          {(todo.acceptanceCriteria || verifier || todo.notes) && (
                            <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 pt-0.5">
                              {todo.acceptanceCriteria && (
                                <div className="flex items-start gap-1.5">
                                  <span className="font-semibold text-slate-500 shrink-0">
                                    {t.acceptanceCriteriaLabel}:
                                  </span>
                                  <span>{todo.acceptanceCriteria}</span>
                                </div>
                              )}
                              {todo.notes && (
                                <div className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-900/70 px-2 py-1 rounded border border-slate-200/80 dark:border-slate-800">
                                  <AlertCircle className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-0.5" />
                                  <span>{todo.notes}</span>
                                </div>
                              )}
                              {verifier && (
                                <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 dark:text-emerald-300">
                                  <span>{isZh ? '验收签名：' : 'Signed off by:'}</span>
                                  <MemberAvatar member={verifier} size="xs" />
                                  <span className="font-semibold">
                                    {isZh ? verifier.nameZh : verifier.nameEn}
                                  </span>
                                  {todo.acceptedAt && (
                                    <span className="text-slate-400">
                                      ({todo.acceptedAt.slice(0, 10)})
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Optional Review Note Box */}
                          {isNoteOpen && (
                            <div className="pt-2 flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                value={reviewNotesMap[todo.id] ?? todo.notes ?? ''}
                                onChange={(e) =>
                                  setReviewNotesMap((prev) => ({ ...prev, [todo.id]: e.target.value }))
                                }
                                placeholder={
                                  isZh
                                    ? '填写验收意见 / 修改建议（可选）...'
                                    : 'Add acceptance review notes (optional)...'
                                }
                                className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                              />
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  disabled={!canVerify}
                                  onClick={() => {
                                    acceptWeeklyTodo(
                                      todo.id,
                                      'ACCEPTED',
                                      reviewNotesMap[todo.id]?.trim() || undefined
                                    );
                                    setActiveNoteTodoId(null);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-[11px] font-semibold"
                                >
                                  {t.confirmAcceptance}
                                </button>
                                <button
                                  type="button"
                                  disabled={!canVerify}
                                  onClick={() => {
                                    acceptWeeklyTodo(
                                      todo.id,
                                      'REVISION_REQUESTED',
                                      reviewNotesMap[todo.id]?.trim() || undefined
                                    );
                                    setActiveNoteTodoId(null);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-[11px] font-semibold"
                                >
                                  {t.requestRevision}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0">
                          {todo.acceptanceStatus !== 'SUBMITTED' &&
                            todo.acceptanceStatus !== 'ACCEPTED' && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateWeeklyTodo(todo.id, {
                                    done: true,
                                    acceptanceStatus: 'SUBMITTED',
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors"
                              >
                                <Send className="w-3 h-3" />
                                <span>{t.submitForAcceptance}</span>
                              </button>
                            )}

                          {todo.acceptanceStatus !== 'ACCEPTED' && (
                            <button
                              type="button"
                              onClick={() => handleOpenTodoReviewNote(todo)}
                              disabled={!canVerify}
                              title={
                                canVerify
                                  ? isZh
                                    ? '点击展开项验收打分与确认栏'
                                    : 'Open Acceptance Controls'
                                  : isZh
                                  ? '当前处于严格模式，开启右上角非锁模式后全员均可验收'
                                  : 'Strict mode: unlock peer acceptance to verify'
                              }
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border flex items-center gap-1 transition-colors ${
                                canVerify
                                  ? 'bg-emerald-500/12 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20'
                                  : 'bg-slate-200/70 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>{isZh ? '项验收' : 'Verify'}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => deleteWeeklyTodo(todo.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                            title={isZh ? '移除此待办' : 'Delete To-Do'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Member's Related Tasks & One-Click Checklist Import */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <CalendarClock className="w-4 h-4 text-cyan-500" />
                <span>
                  {isZh ? '本周相关课题与执行清单导入' : 'Related Tasks & Checklist Import'}
                </span>
              </h3>
              <span className="text-[11px] text-slate-400">{dueThisWeekTasks.length}</span>
            </div>

            {dueThisWeekTasks.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
                {isZh
                  ? '该成员名下暂无需导入的活跃任务执行清单'
                  : 'No active task checklists found for this member'}
              </p>
            ) : (
              <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1 custom-scrollbar">
                {dueThisWeekTasks.map((task) => {
                  const isDueThisWeek = isDateInWeek(task.deadline, weekKey);
                  const checklist = task.checklist || [];

                  return (
                    <div
                      key={task.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-700 dark:text-cyan-300">
                              {task.projectTag}
                            </span>
                            {isDueThisWeek && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300">
                                {isZh ? '本周DDL' : 'Due This Week'}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedTask(task)}
                            className="text-xs font-semibold text-slate-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 text-left mt-1 line-clamp-2"
                          >
                            {task.title}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setLogicTreeTaskId(task.id)}
                          className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0"
                          title={isZh ? '查看/编辑任务树状逻辑图' : 'Open Task Logic Tree'}
                        >
                          <GitBranch className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {checklist.length > 0 && (
                        <div className="space-y-1 pt-1 border-t border-slate-200/70 dark:border-slate-800/80">
                          {checklist.map((item) => {
                            const key = `${task.id}:${item.id}`;
                            const isAdded = alreadySyncedChecklistKeys.has(key);

                            return (
                              <div
                                key={item.id}
                                className="flex items-center justify-between gap-2 text-[11px] py-1"
                              >
                                <span
                                  className={`truncate flex-1 ${
                                    item.done
                                      ? 'line-through text-slate-400'
                                      : 'text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  {item.done ? '☑ ' : '☐ '}
                                  {item.text}
                                </span>
                                <button
                                  type="button"
                                  disabled={isAdded}
                                  onClick={() =>
                                    pushChecklistItemToWeeklyTodo({
                                      task,
                                      checklistItem: item,
                                      memberId: resolvedMemberId,
                                      weekKey,
                                    })
                                  }
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 transition-colors ${
                                    isAdded
                                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 cursor-default'
                                      : 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-700 dark:text-cyan-300'
                                  }`}
                                >
                                  {isAdded
                                    ? isZh
                                      ? '已排入'
                                      : 'Added'
                                    : isZh
                                    ? '+ 排入本周'
                                    : '+ Pull'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
