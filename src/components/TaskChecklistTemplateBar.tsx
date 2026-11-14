'use client';

import React, { useEffect, useState } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import { ChecklistItem, TaskItem } from '@/types';
import { BookmarkPlus, ListPlus, Settings2, Sparkles } from 'lucide-react';

interface TaskChecklistTemplateBarProps {
  task: TaskItem;
  currentChecklist: ChecklistItem[];
  editable: boolean;
  compact?: boolean;
}

/**
 * Shared toolbar for selecting saved checklist/acceptance templates,
 * one-click injecting them into a task (optionally pushing weekly acceptance todos),
 * or saving a task's current checklist as a reusable custom template.
 */
export const TaskChecklistTemplateBar: React.FC<TaskChecklistTemplateBarProps> = ({
  task,
  currentChecklist,
  editable,
  compact = false,
}) => {
  const {
    checklistTemplates,
    injectTemplateToTask,
    openTemplateModal,
    language,
  } = useLabFlow();

  const isZh = language === 'zh';
  const [selectedTplId, setSelectedTplId] = useState<string>(
    checklistTemplates[0]?.id || ''
  );

  useEffect(() => {
    if (
      checklistTemplates.length > 0 &&
      !checklistTemplates.some((tpl) => tpl.id === selectedTplId)
    ) {
      setSelectedTplId(checklistTemplates[0].id);
    }
  }, [checklistTemplates, selectedTplId]);

  if (!editable) return null;

  const activeTemplate =
    checklistTemplates.find((tpl) => tpl.id === selectedTplId) || checklistTemplates[0];

  const handleSaveCurrentAsTemplate = () => {
    openTemplateModal({
      name: `${task.projectTag} ${isZh ? '执行清单模板' : 'Checklist Template'}`,
      category: isZh ? '自定义' : 'Custom',
      description: task.title,
      targetTaskId: task.id,
      items:
        currentChecklist.length > 0
          ? currentChecklist.map((c) => ({
              text: c.text,
              acceptanceCriteria: isZh
                ? `完成「${task.projectTag}」执行清单核验`
                : `Verify ${task.projectTag} checklist item`,
              priority: task.priority,
            }))
          : [{ text: '', acceptanceCriteria: '', priority: task.priority }],
    });
  };

  return (
    <div
      className={`rounded-xl border border-amber-500/25 bg-amber-500/5 dark:bg-amber-950/20 ${
        compact ? 'p-2 space-y-1.5' : 'p-2.5 space-y-2'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
          <Sparkles className="w-3 h-3 shrink-0" />
          <span>{isZh ? '模板一键注入（执行清单 & 验收标准）' : 'Template Quick Inject'}</span>
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleSaveCurrentAsTemplate}
            disabled={currentChecklist.length === 0}
            className="px-1.5 py-0.5 rounded text-[10px] font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 disabled:opacity-40 flex items-center gap-0.5 transition-colors"
            title={
              isZh
                ? '把当前任务的执行清单保存为可复用模板'
                : 'Save current checklist as a reusable template'
            }
          >
            <BookmarkPlus className="w-3 h-3" />
            <span>{isZh ? '存为模板' : 'Save'}</span>
          </button>
          <button
            type="button"
            onClick={() => openTemplateModal({ targetTaskId: task.id })}
            className="px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 flex items-center gap-0.5 transition-colors"
            title={isZh ? '管理、新建或编辑全部模板' : 'Manage templates'}
          >
            <Settings2 className="w-3 h-3" />
            <span>{isZh ? '管理' : 'Manage'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <select
          value={activeTemplate?.id || ''}
          onChange={(e) => setSelectedTplId(e.target.value)}
          disabled={checklistTemplates.length === 0}
          className="flex-1 min-w-[135px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
        >
          {checklistTemplates.length === 0 ? (
            <option value="">{isZh ? '暂无模板，点击上方管理新建' : 'No templates'}</option>
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
          disabled={!activeTemplate}
          onClick={() =>
            activeTemplate &&
            injectTemplateToTask({
              taskId: task.id,
              templateId: activeTemplate.id,
              alsoPushWeeklyTodos: false,
            })
          }
          className="px-2 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-45 text-white text-[10px] font-semibold transition-colors shrink-0"
          title={isZh ? '仅将模板条目追加到当前任务的执行清单' : 'Append template items to task checklist'}
        >
          {isZh ? '注入清单' : '+ Checklist'}
        </button>

        <button
          type="button"
          disabled={!activeTemplate}
          onClick={() =>
            activeTemplate &&
            injectTemplateToTask({
              taskId: task.id,
              templateId: activeTemplate.id,
              alsoPushWeeklyTodos: true,
            })
          }
          className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-45 text-white text-[10px] font-semibold flex items-center gap-0.5 transition-colors shrink-0"
          title={
            isZh
              ? '注入执行清单并同时生成带验收标准的本周待办'
              : 'Inject checklist and generate linked Weekly To-Dos with acceptance criteria'
          }
        >
          <ListPlus className="w-3 h-3" />
          <span>{isZh ? '注入+周待办' : '+ Weekly'}</span>
        </button>
      </div>
    </div>
  );
};
