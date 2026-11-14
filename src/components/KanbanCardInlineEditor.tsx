'use client';

import React, { useEffect, useState } from 'react';
import { AcademicStage, ChecklistItem, Priority, TaskItem, VisibilityLevel } from '@/types';
import { useLabFlow } from '@/context/LabFlowContext';
import { Flame, Lock, Plus, Save, Sparkles, Trash2, X } from 'lucide-react';

interface KanbanCardInlineEditorProps {
  task: TaskItem;
}

/**
 * Expanded inline task editor rendered inside a Kanban card only while selected,
 * avoiding heavy form hook state across collapsed cards.
 */
export const KanbanCardInlineEditor: React.FC<KanbanCardInlineEditorProps> = ({ task }) => {
  const {
    setSelectedTask,
    setActiveBlockerTask,
    moveTask,
    updateTask,
    deleteTask,
    members,
    stages,
    language,
    t,
    addToast,
    canEditTask,
    canDeleteTask,
  } = useLabFlow();

  const hasEditPermission = canEditTask(task);
  const hasDeletePermission = canDeleteTask(task);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [stage, setStage] = useState<AcademicStage>(task.stage);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [visibility, setVisibility] = useState<VisibilityLevel>(task.visibility || 'PUBLIC');
  const [startDate, setStartDate] = useState(task.startDate || '');
  const [deadline, setDeadline] = useState(task.deadline);
  const [progress, setProgress] = useState(task.progress || 0);
  const [leadAuthorId, setLeadAuthorId] = useState(task.leadAuthor?.id || members[0]?.id || '');
  const [piId, setPiId] = useState(task.pi?.id || members[0]?.id || '');
  const [overleaf, setOverleaf] = useState(task.assets?.overleaf || '');
  const [github, setGithub] = useState(task.assets?.github || '');
  const [dataset, setDataset] = useState(task.assets?.dataset || '');
  const [zotero, setZotero] = useState(task.assets?.zotero || '');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(task.checklist || []);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || '');
    setStage(task.stage);
    setPriority(task.priority);
    setVisibility(task.visibility || 'PUBLIC');
    setStartDate(task.startDate || '');
    setDeadline(task.deadline);
    setProgress(task.progress || 0);
    setLeadAuthorId(task.leadAuthor?.id || members[0]?.id || '');
    setPiId(task.pi?.id || members[0]?.id || '');
    setOverleaf(task.assets?.overleaf || '');
    setGithub(task.assets?.github || '');
    setDataset(task.assets?.dataset || '');
    setZotero(task.assets?.zotero || '');
    setChecklist(task.checklist || []);
  }, [task, members]);

  const handleSaveInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasEditPermission) {
      addToast(t.readOnlyNotice, '', 'warning');
      return;
    }

    const lead = members.find((m) => m.id === leadAuthorId) || task.leadAuthor;
    const pi = members.find((m) => m.id === piId) || task.pi;

    updateTask(task.id, {
      title,
      description,
      stage,
      priority,
      visibility,
      startDate: startDate || undefined,
      deadline,
      progress,
      leadAuthor: lead,
      pi,
      assets: {
        overleaf: overleaf.trim() || undefined,
        github: github.trim() || undefined,
        dataset: dataset.trim() || undefined,
        zotero: zotero.trim() || undefined,
      },
      checklist,
    });

    if (stage !== task.stage) {
      moveTask(task.id, stage);
    }

    addToast(
      language === 'zh' ? '课题细节已保存' : 'Task Details Saved',
      task.projectTag,
      'success'
    );
  };

  const handleDeleteTask = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasDeletePermission) return;
    if (confirm(t.confirmDelete)) {
      deleteTask(task.id);
      setSelectedTask(null);
    }
  };

  const handleAddSubtask = () => {
    if (!hasEditPermission || !newSubtaskText.trim()) return;
    const newId = `sub-${Date.now()}`;
    const updated = [...checklist, { id: newId, text: newSubtaskText.trim(), done: false }];
    setChecklist(updated);
    setNewSubtaskText('');
    updateTask(task.id, { checklist: updated });
  };

  const handleToggleSubtask = (subId: string) => {
    if (!hasEditPermission) return;
    const updated = checklist.map((c) => (c.id === subId ? { ...c, done: !c.done } : c));
    setChecklist(updated);
    updateTask(task.id, { checklist: updated });
  };

  const handleDeleteSubtask = (subId: string) => {
    if (!hasEditPermission) return;
    const updated = checklist.filter((c) => c.id !== subId);
    setChecklist(updated);
    updateTask(task.id, { checklist: updated });
  };

  const handleInsertRubric = () => {
    if (!hasEditPermission) return;
    const isZh = language === 'zh';
    const rubricItems = isZh
      ? [
          '【双盲匿名】清除论文及附录中所有作者姓名、致谢、机构标识与非匿名仓库链接',
          '【可复现性】提供随机数种子配置、超参数网格列表与环境依赖清单 (conda/docker)',
          '【实验统计】核心实验完成至少 5 次不同随机种子运行并报告均值与置信区间 (std/CI)',
          '【理论与伦理】补充引理完整数学推导附录、潜在社会负面影响与合规伦理声明',
        ]
      : [
          '[Double-Blind] Remove all author names, acknowledgments, affiliations, and de-anonymized links',
          '[Reproducibility] Specify random seeds, hyperparameter search grids, and conda/docker environment',
          '[Significance] Run models with >=5 random seeds and report std / confidence intervals',
          '[Ethics & Proofs] Complete supplementary mathematical proofs, limitations, and ethical statements',
        ];

    const newItems = rubricItems.map((text, idx) => ({
      id: `rubric-${Date.now()}-${idx}`,
      text,
      done: false,
    }));

    const updated = [...checklist, ...newItems];
    setChecklist(updated);
    updateTask(task.id, { checklist: updated });
    addToast(t.insertRubricChecklist, t.rubricInserted, 'success');
  };

  const fieldClass =
    'w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200 disabled:opacity-70';

  return (
    <div className="border-t border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/90 dark:bg-slate-950/90 rounded-b-xl space-y-3.5 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
      <form onSubmit={handleSaveInline} className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30">
              {task.projectTag}
            </span>
            <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">
              {t.inspector}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSelectedTask(null)}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
            title={language === 'zh' ? '收起' : 'Close'}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {!hasEditPermission && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>{t.readOnlyNotice}</span>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            {language === 'zh' ? '论文任务标题' : 'Task Title'}
          </label>
          <input
            type="text"
            required
            disabled={!hasEditPermission}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-70"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              {t.academicStage}
            </label>
            <select
              disabled={!hasEditPermission}
              value={stage}
              onChange={(e) => setStage(e.target.value as AcademicStage)}
              className={fieldClass}
            >
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {language === 'zh' ? s.labelZh : s.labelEn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              {t.priority}
            </label>
            <select
              disabled={!hasEditPermission}
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className={fieldClass}
            >
              <option value="LOW">{language === 'zh' ? '低优先级' : 'Low'}</option>
              <option value="MEDIUM">{language === 'zh' ? '中优先级' : 'Medium'}</option>
              <option value="HIGH">{language === 'zh' ? '高优先级' : 'High'}</option>
              <option value="URGENT">
                {language === 'zh' ? '紧急关键 (Urgent)' : 'Urgent'}
              </option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            {t.visibility}
          </label>
          <select
            disabled={!hasEditPermission}
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as VisibilityLevel)}
            className={fieldClass}
          >
            <option value="PUBLIC">{t.visibilityPublic}</option>
            <option value="TEAM_ONLY">{t.visibilityTeamOnly}</option>
            <option value="PI_ONLY">{t.visibilityPIOnly}</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              {t.startDate}
            </label>
            <input
              type="date"
              disabled={!hasEditPermission}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={fieldClass}
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              {t.endDate}
            </label>
            <input
              type="date"
              required
              disabled={!hasEditPermission}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            <span>{t.progress}</span>
            <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
              {progress}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            disabled={!hasEditPermission}
            value={progress}
            onChange={(e) => setProgress(parseInt(e.target.value, 10))}
            className="w-full accent-cyan-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded cursor-pointer"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              {t.leadAuthor}
            </label>
            <select
              disabled={!hasEditPermission}
              value={leadAuthorId}
              onChange={(e) => setLeadAuthorId(e.target.value)}
              className={fieldClass}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {language === 'zh' ? `${m.nameZh} (${m.titleZh})` : `${m.nameEn} (${m.titleEn})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              PI
            </label>
            <select
              disabled={!hasEditPermission}
              value={piId}
              onChange={(e) => setPiId(e.target.value)}
              className={fieldClass}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {language === 'zh' ? m.nameZh : m.nameEn}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            {t.methodologyDesc}
          </label>
          <textarea
            rows={2}
            disabled={!hasEditPermission}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              language === 'zh'
                ? '研究方案、推导步骤与模型架构说明...'
                : 'Methodology notes and hypotheses...'
            }
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 disabled:opacity-70"
          />
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-2.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              {t.checklist}
            </span>
            {hasEditPermission && (
              <button
                type="button"
                onClick={handleInsertRubric}
                className="text-[10px] font-medium text-amber-600 dark:text-amber-400 hover:text-amber-500 flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>{t.insertRubricChecklist}</span>
              </button>
            )}
          </div>

          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
            {checklist.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-1.5 p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px]"
              >
                <div
                  onClick={() => handleToggleSubtask(c.id)}
                  className={`flex items-center gap-1.5 flex-1 min-w-0 ${
                    hasEditPermission ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={c.done}
                    disabled={!hasEditPermission}
                    onChange={() => {}}
                    className="rounded border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-emerald-500"
                  />
                  <span
                    className={`truncate ${
                      c.done ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {c.text}
                  </span>
                </div>
                {hasEditPermission && (
                  <button
                    type="button"
                    onClick={() => handleDeleteSubtask(c.id)}
                    className="text-slate-400 hover:text-rose-500 p-0.5"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {hasEditPermission && (
            <div className="flex gap-1.5 pt-1">
              <input
                type="text"
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder={t.addSubtask}
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-2.5 space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
            {t.assets}
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            <input
              type="url"
              disabled={!hasEditPermission}
              value={overleaf}
              onChange={(e) => setOverleaf(e.target.value)}
              placeholder="Overleaf URL"
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-800 dark:text-slate-200 disabled:opacity-70"
            />
            <input
              type="url"
              disabled={!hasEditPermission}
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              placeholder="GitHub URL"
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-800 dark:text-slate-200 disabled:opacity-70"
            />
            <input
              type="url"
              disabled={!hasEditPermission}
              value={dataset}
              onChange={(e) => setDataset(e.target.value)}
              placeholder="Dataset URL"
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-800 dark:text-slate-200 disabled:opacity-70"
            />
            <input
              type="url"
              disabled={!hasEditPermission}
              value={zotero}
              onChange={(e) => setZotero(e.target.value)}
              placeholder="Zotero URL"
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-800 dark:text-slate-200 disabled:opacity-70"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-1.5 pt-3 border-t border-slate-200 dark:border-slate-800">
          {hasDeletePermission ? (
            <button
              type="button"
              onClick={handleDeleteTask}
              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              title={t.delete}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-1.5">
            {hasEditPermission && (
              <button
                type="button"
                onClick={() => setActiveBlockerTask(task)}
                className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 text-xs font-medium transition-colors"
              >
                <Flame className="w-3.5 h-3.5 inline mr-1" />
                {task.isBlocked
                  ? language === 'zh'
                    ? '解除卡点'
                    : 'Resolve'
                  : language === 'zh'
                  ? '标记卡点'
                  : 'Blocker'}
              </button>
            )}

            <button
              type="button"
              onClick={() => setSelectedTask(null)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium"
            >
              {language === 'zh' ? '收起' : 'Close'}
            </button>

            {hasEditPermission && (
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition-all flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{t.save}</span>
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
