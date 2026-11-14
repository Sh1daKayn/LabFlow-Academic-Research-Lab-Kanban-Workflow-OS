'use client';

import React, { useMemo } from 'react';
import { GitBranch, X } from 'lucide-react';
import { useLabFlow } from '@/context/LabFlowContext';
import { TaskLogicTreeEditor } from './TaskLogicTreeEditor';

export const TaskLogicTreeModal: React.FC = () => {
  const { language, t, tasks, logicTreeTaskId, setLogicTreeTaskId, canEditTask } = useLabFlow();

  const task = useMemo(
    () => (logicTreeTaskId ? tasks.find((item) => item.id === logicTreeTaskId) || null : null),
    [tasks, logicTreeTaskId]
  );

  if (!task) return null;

  const isZh = language === 'zh';
  const editable = canEditTask(task);

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm animate-fadeIn"
      onClick={() => setLogicTreeTaskId(null)}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-6xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-slate-50/70 dark:bg-slate-950/60">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold flex items-center gap-1 shrink-0">
                <GitBranch className="w-3 h-3" />
                {t.logicTreeTab}
              </span>
              <span className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 shrink-0">
                {task.projectTag}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white truncate mt-1">
              {task.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setLogicTreeTaskId(null)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors shrink-0"
            title={isZh ? '关闭逻辑树画布' : 'Close Logic Tree'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar flex-1">
          <TaskLogicTreeEditor task={task} editable={editable} compact={false} />
        </div>
      </div>
    </div>
  );
};
