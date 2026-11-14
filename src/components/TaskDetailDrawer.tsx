'use client';

import React, { useState, useEffect } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import { AcademicStage, Priority, VisibilityLevel } from '@/types';
import { BLOCKER_CATEGORIES } from '@/data/mockData';
import {
  X,
  Flame,
  CheckCircle2,
  Trash2,
  Save,
  FileText,
  Database,
  BookOpen,
  Sparkles,
  Lock,
} from 'lucide-react';
import { GitHubIcon } from '@/components/icons/BrandIcons';

export const TaskDetailDrawer: React.FC = () => {
  const {
    selectedTask,
    setSelectedTask,
    viewMode,
    updateTask,
    deleteTask,
    members,
    stages,
    language,
    t,
    resolveBlocker,
    addToast,
    canEditTask,
    canDeleteTask,
  } = useLabFlow();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stage, setStage] = useState<AcademicStage>('DATA_EXP');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [visibility, setVisibility] = useState<VisibilityLevel>('PUBLIC');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [progress, setProgress] = useState(0);
  const [targetVenue, setTargetVenue] = useState('');
  const [projectTag, setProjectTag] = useState('');
  const [leadAuthorId, setLeadAuthorId] = useState('');
  const [piId, setPiId] = useState('');
  const [overleaf, setOverleaf] = useState('');
  const [github, setGithub] = useState('');
  const [dataset, setDataset] = useState('');
  const [zotero, setZotero] = useState('');
  const [checklist, setChecklist] = useState<{ id: string; text: string; done: boolean }[]>([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  useEffect(() => {
    if (selectedTask) {
      setTitle(selectedTask.title);
      setDescription(selectedTask.description || '');
      setStage(selectedTask.stage);
      setPriority(selectedTask.priority);
      setVisibility(selectedTask.visibility || 'PUBLIC');
      setStartDate(selectedTask.startDate || '');
      setDeadline(selectedTask.deadline ? selectedTask.deadline.split('T')[0] : '');
      setProgress(selectedTask.progress || 0);
      setTargetVenue(selectedTask.targetVenue);
      setProjectTag(selectedTask.projectTag);
      setLeadAuthorId(selectedTask.leadAuthor?.id || members[0]?.id || '');
      setPiId(selectedTask.pi?.id || members[0]?.id || '');
      setOverleaf(selectedTask.assets?.overleaf || '');
      setGithub(selectedTask.assets?.github || '');
      setDataset(selectedTask.assets?.dataset || '');
      setZotero(selectedTask.assets?.zotero || '');
      setChecklist(selectedTask.checklist || []);
    }
  }, [selectedTask, members]);

  if (!selectedTask || viewMode === 'kanban') return null;

  const editable = canEditTask(selectedTask);
  const deletable = canDeleteTask(selectedTask);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editable) {
      addToast(t.readOnlyNotice, '', 'warning');
      return;
    }

    const lead = members.find((m) => m.id === leadAuthorId) || selectedTask.leadAuthor;
    const pi = members.find((m) => m.id === piId) || selectedTask.pi;

    updateTask(selectedTask.id, {
      title,
      description,
      stage,
      priority,
      visibility,
      startDate: startDate || undefined,
      deadline,
      progress,
      targetVenue,
      projectTag,
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
    setSelectedTask(null);
  };

  const handleDelete = () => {
    if (!deletable) {
      addToast(t.cannotDeleteNotice, '', 'error');
      return;
    }
    if (confirm(t.confirmDelete)) {
      deleteTask(selectedTask.id);
    }
  };

  const handleAddSubtask = () => {
    if (!editable || !newSubtaskText.trim()) return;
    const newId = `sub-${Date.now()}`;
    setChecklist([...checklist, { id: newId, text: newSubtaskText.trim(), done: false }]);
    setNewSubtaskText('');
  };

  const handleToggleSubtask = (subId: string) => {
    if (!editable) return;
    setChecklist(checklist.map((c) => (c.id === subId ? { ...c, done: !c.done } : c)));
  };

  const handleDeleteSubtask = (subId: string) => {
    if (!editable) return;
    setChecklist(checklist.filter((c) => c.id !== subId));
  };

  const handleInsertRubric = () => {
    if (!editable) return;
    const isZh = language === 'zh';
    const rubricItems = isZh
      ? [
          '【双盲匿名】彻底清除论文与附录中的作者姓名、致谢、机构标识与非匿名仓库链接',
          '【可复现性】提供随机数种子配置、超参数网格列表与一键复现依赖环境清单 (conda/docker)',
          '【实验统计】核心基线实验完成至少 5 次不同随机种子运行并报告均值与置信区间 (std/CI)',
          '【理论与伦理】补充引理完整数学推导附录、潜在社会负面影响与合规伦理声明',
        ]
      : [
          '[Double-Blind] Remove all author names, acknowledgments, affiliations, and de-anonymized URLs',
          '[Reproducibility] Specify random seeds, hyperparameter search grids, and conda/docker environment',
          '[Significance] Run baseline & proposed models with >=5 random seeds and report std / confidence intervals',
          '[Ethics & Proofs] Complete supplementary mathematical proofs, limitations, and ethical impact statements',
        ];

    const newItems = rubricItems.map((text, idx) => ({
      id: `rubric-${Date.now()}-${idx}`,
      text,
      done: false,
    }));

    setChecklist((prev) => [...prev, ...newItems]);
    addToast(t.insertRubricChecklist, t.rubricInserted, 'success');
  };

  const inputClass =
    'w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-cyan-500/60 disabled:opacity-70';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/15 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
              {projectTag || 'Project'}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{t.inspector}</span>
            {!editable && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                <Lock className="w-3 h-3" />
                {language === 'zh' ? '只读观察' : 'Read-Only'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {deletable && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
                title={t.delete}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedTask(null)}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body Form */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4">
          {selectedTask.isBlocked && selectedTask.blocker && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-500/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5 uppercase">
                  <Flame className="w-4 h-4 text-red-500 animate-pulse" />
                  {t.activeBlockerAlert}
                </span>
                {editable && (
                  <button
                    type="button"
                    onClick={() => resolveBlocker(selectedTask.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t.resolveAction}</span>
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-800 dark:text-slate-200 bg-white/80 dark:bg-slate-900/80 p-3 rounded-lg border border-red-200 dark:border-slate-800 space-y-1">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">
                    {t.blockerCategory}:{' '}
                  </span>
                  <span className="text-red-600 dark:text-red-300 font-medium">
                    {language === 'zh'
                      ? BLOCKER_CATEGORIES[selectedTask.blocker.category]?.labelZh
                      : BLOCKER_CATEGORIES[selectedTask.blocker.category]?.labelEn}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">
                    {t.whereStuck}:{' '}
                  </span>
                  <span>{selectedTask.blocker.details}</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {t.paperTitle} *
            </label>
            <input
              type="text"
              required
              disabled={!editable}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-cyan-500/60 disabled:opacity-70"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                {t.academicStage} *
              </label>
              <select
                disabled={!editable}
                value={stage}
                onChange={(e) => setStage(e.target.value as AcademicStage)}
                className={inputClass}
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900">
                    {language === 'zh' ? s.labelZh : s.labelEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                {t.priority}
              </label>
              <select
                disabled={!editable}
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className={inputClass}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent 🔥</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                {t.visibility}
              </label>
              <select
                disabled={!editable}
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as VisibilityLevel)}
                className={inputClass}
              >
                <option value="PUBLIC">{t.visibilityPublic}</option>
                <option value="TEAM_ONLY">{t.visibilityTeamOnly}</option>
                <option value="PI_ONLY">{t.visibilityPIOnly}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                {t.startDate}
              </label>
              <input
                type="date"
                disabled={!editable}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                {t.endDate}
              </label>
              <input
                type="date"
                disabled={!editable}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                {t.progress} ({progress}%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                disabled={!editable}
                value={progress}
                onChange={(e) => setProgress(parseInt(e.target.value, 10) || 0)}
                className={`${inputClass} font-mono`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                {t.leadAuthor}
              </label>
              <select
                disabled={!editable}
                value={leadAuthorId}
                onChange={(e) => setLeadAuthorId(e.target.value)}
                className={inputClass}
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {language === 'zh'
                      ? `${m.nameZh} (${m.titleZh})`
                      : `${m.nameEn} (${m.titleEn})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                PI
              </label>
              <select
                disabled={!editable}
                value={piId}
                onChange={(e) => setPiId(e.target.value)}
                className={inputClass}
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
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {t.methodologyDesc}
            </label>
            <textarea
              rows={3}
              disabled={!editable}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 leading-relaxed disabled:opacity-70"
            />
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {t.checklist}
              </label>
              {editable && (
                <button
                  type="button"
                  onClick={handleInsertRubric}
                  className="text-[11px] font-medium text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 flex items-center gap-1 transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{t.insertRubricChecklist}</span>
                </button>
              )}
            </div>

            <div className="space-y-1.5 mb-2">
              {checklist.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                >
                  <div
                    onClick={() => handleToggleSubtask(c.id)}
                    className={`flex items-center gap-2 flex-1 min-w-0 ${
                      editable ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={c.done}
                      disabled={!editable}
                      onChange={() => {}}
                      className="rounded border-slate-300 dark:border-slate-700 text-emerald-500"
                    />
                    <span
                      className={`truncate ${
                        c.done
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {c.text}
                    </span>
                  </div>
                  {editable && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(c.id)}
                      className="text-slate-400 hover:text-rose-500 text-xs p-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {editable && (
              <div className="flex gap-2">
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
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-cyan-500/60"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium transition-colors"
                >
                  +
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-2">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
              {t.assets}
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="url"
                  disabled={!editable}
                  value={overleaf}
                  onChange={(e) => setOverleaf(e.target.value)}
                  placeholder="Overleaf URL"
                  className="bg-transparent text-slate-900 dark:text-slate-200 focus:outline-none w-full text-xs placeholder-slate-400 dark:placeholder-slate-600"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5">
                <GitHubIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="url"
                  disabled={!editable}
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="GitHub URL"
                  className="bg-transparent text-slate-900 dark:text-slate-200 focus:outline-none w-full text-xs placeholder-slate-400 dark:placeholder-slate-600"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5">
                <Database className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="url"
                  disabled={!editable}
                  value={dataset}
                  onChange={(e) => setDataset(e.target.value)}
                  placeholder="Dataset URL"
                  className="bg-transparent text-slate-900 dark:text-slate-200 focus:outline-none w-full text-xs placeholder-slate-400 dark:placeholder-slate-600"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="url"
                  disabled={!editable}
                  value={zotero}
                  onChange={(e) => setZotero(e.target.value)}
                  placeholder="Zotero URL"
                  className="bg-transparent text-slate-900 dark:text-slate-200 focus:outline-none w-full text-xs placeholder-slate-400 dark:placeholder-slate-600"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedTask(null)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {t.cancel}
            </button>
            {editable && (
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{t.save}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
