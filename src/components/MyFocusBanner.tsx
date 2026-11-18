'use client';

import React, { useMemo } from 'react';
import {
  CheckCircle2,
  Flame,
  ListTodo,
  MessageSquare,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import { useLabFlow } from '@/context/LabFlowContext';
import { getWeekKey } from '@/utils/weeklyTodos';

/**
 * Compact first-screen focus summary bar helping students & members immediately see
 * their 3 daily priorities (Weekly To-Dos, Pending 1-on-1 Requests, Blockers)
 * alongside a 1-click Simple vs Full Workspace view toggle.
 */
export const MyFocusBanner: React.FC = () => {
  const {
    language,
    currentMember,
    currentUserId,
    weeklyTodos,
    directRequests,
    tasks,
    pendingRequestsForMeCount,
    setViewMode,
    setFilterOnlyBlockers,
    simpleMode,
    setSimpleMode,
    startTour,
  } = useLabFlow();

  const [dismissed, setDismissed] = React.useState(false);
  const isZh = language === 'zh';

  const weekKey = getWeekKey();
  const { pendingTodosCount, myBlockersCount, myActiveTasksCount } = useMemo(() => {
    const todos = weeklyTodos.filter(
      (w) => w.memberId === currentUserId && w.weekKey === weekKey && !w.done
    ).length;
    const blockers = tasks.filter(
      (t) => t.isBlocked && (t.leadAuthor?.id === currentUserId || t.pi?.id === currentUserId)
    ).length;
    const activeTasks = tasks.filter(
      (t) =>
        t.stage !== 'ACCEPTED' &&
        (t.leadAuthor?.id === currentUserId || t.pi?.id === currentUserId)
    ).length;
    return {
      pendingTodosCount: todos,
      myBlockersCount: blockers,
      myActiveTasksCount: activeTasks,
    };
  }, [weeklyTodos, tasks, currentUserId, weekKey]);

  const unreadRepliedCount = useMemo(
    () =>
      directRequests.filter(
        (r) => r.senderId === currentUserId && r.status === 'REPLIED'
      ).length,
    [directRequests, currentUserId]
  );

  if (dismissed) return null;

  const firstName =
    (isZh ? currentMember.nameZh : currentMember.nameEn).split(/\s+/)[0] ||
    currentMember.nameEn;

  return (
    <div
      data-tour="focus-banner"
      className="mb-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/75 px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs shadow-xs shrink-0"
    >
      <div className="flex flex-wrap items-center gap-2 min-w-0">
        <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>{isZh ? `${firstName} 的今日聚焦：` : `${firstName}'s Focus:`}</span>
        </span>

        <button
          type="button"
          onClick={() => setViewMode('todos')}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 font-medium transition-colors"
        >
          <ListTodo className="w-3 h-3" />
          <span>
            {pendingTodosCount > 0
              ? isZh
                ? `本周待办 ${pendingTodosCount} 项`
                : `${pendingTodosCount} Weekly To-Do${pendingTodosCount > 1 ? 's' : ''}`
              : isZh
              ? '本周 To-Do 已清零 ✓'
              : 'Weekly To-Dos Done ✓'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('requests')}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border font-medium transition-colors ${
            pendingRequestsForMeCount + unreadRepliedCount > 0
              ? 'bg-cyan-500/12 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/35'
              : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200/70'
          }`}
        >
          <MessageSquare className="w-3 h-3" />
          <span>
            {pendingRequestsForMeCount > 0
              ? isZh
                ? `${pendingRequestsForMeCount} 条待我回复`
                : `${pendingRequestsForMeCount} Request${pendingRequestsForMeCount > 1 ? 's' : ''}`
              : isZh
              ? '1对1 沟通 (0待处理)'
              : 'Requests (0 pending)'}
          </span>
        </button>

        {myBlockersCount > 0 && (
          <button
            type="button"
            onClick={() => setFilterOnlyBlockers(true)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 border border-rose-500/35 font-semibold transition-colors"
          >
            <Flame className="w-3 h-3" />
            <span>
              {isZh
                ? `${myBlockersCount} 项卡点待解`
                : `${myBlockersCount} Blocker${myBlockersCount > 1 ? 's' : ''}`}
            </span>
          </button>
        )}

        <span className="hidden lg:inline text-[11px] text-slate-400">
          · {myActiveTasksCount} {isZh ? '项进行中任务' : 'active tasks'}
        </span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px]">
          <button
            type="button"
            onClick={() => setSimpleMode(true)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold transition-colors ${
              simpleMode
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title={
              isZh
                ? '简洁日常模式：卡片只留核心标题、截止期与负责人'
                : 'Simple View: clean cards & clutter-free controls'
            }
          >
            <Sparkles className="w-3 h-3" />
            <span>{isZh ? '简洁视图' : 'Simple'}</span>
          </button>
          <button
            type="button"
            onClick={() => setSimpleMode(false)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold transition-colors ${
              !simpleMode
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title={
              isZh
                ? '完整统筹模式：展开卡片外链、逻辑树图标及全部高级筛选器'
                : 'Full Coordinator View: expose all links, badges, and filter bars'
            }
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>{isZh ? '完整统筹' : 'Full'}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={startTour}
          className="hidden sm:inline-flex px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {isZh ? '分步引导' : 'Guided Tour'}
        </button>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          title={isZh ? '本次隐藏焦点条' : 'Dismiss for now'}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
