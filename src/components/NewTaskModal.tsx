'use client';

import React, { useEffect, useState } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import { AcademicStage, Priority, VisibilityLevel } from '@/types';
import { getSafeLeadAuthor, getSafePI } from '@/utils/rbac';
import { FolderPlus, Plus, X } from 'lucide-react';

export const NewTaskModal: React.FC = () => {
  const {
    isNewTaskOpen,
    setIsNewTaskOpen,
    addTask,
    addProject,
    projects,
    members,
    stages,
    currentUserId,
    language,
    t,
  } = useLabFlow();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stage, setStage] = useState<AcademicStage>(stages[1]?.id || stages[0]?.id || 'DATA_EXP');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [visibility, setVisibility] = useState<VisibilityLevel>('PUBLIC');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [deadline, setDeadline] = useState(new Date().toISOString().split('T')[0]);
  const [leadAuthorId, setLeadAuthorId] = useState('');

  // Optional inline project creation when workspace is blank or user creates one inline
  const [creatingInlineProj, setCreatingInlineProj] = useState(false);
  const [inlineProjTitle, setInlineProjTitle] = useState('');
  const [inlineProjTag, setInlineProjTag] = useState('');
  const [inlineProjVenue, setInlineProjVenue] = useState('NeurIPS');

  useEffect(() => {
    if (!isNewTaskOpen) return;
    setProjectId((prev) =>
      projects.some((p) => p.id === prev) ? prev : projects[0]?.id || ''
    );
    setLeadAuthorId((prev) => {
      if (members.some((m) => m.id === prev)) return prev;
      if (members.some((m) => m.id === currentUserId)) return currentUserId;
      return members[0]?.id || '';
    });
    setStage((prev) =>
      stages.some((s) => s.id === prev) ? prev : stages[1]?.id || stages[0]?.id || 'DATA_EXP'
    );
    setCreatingInlineProj(false);
  }, [isNewTaskOpen, projects, members, stages, currentUserId]);

  if (!isNewTaskOpen) return null;

  const currentProject = projects.find((p) => p.id === projectId) || projects[0];
  const fallbackLead = getSafeLeadAuthor(members, leadAuthorId || currentUserId);
  const fallbackPI = getSafePI(members);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !fallbackLead || !fallbackPI) return;

    let resolvedProject = currentProject;
    if ((creatingInlineProj || !resolvedProject) && inlineProjTitle.trim()) {
      resolvedProject = addProject({
        title: inlineProjTitle.trim(),
        targetVenue: inlineProjVenue.trim() || 'Conference',
        tag:
          inlineProjTag.trim() ||
          inlineProjTitle.trim().split(/\s+/)[0]?.slice(0, 12) ||
          'Lab',
        status: stage,
        leadAuthorId: fallbackLead.id,
        piId: fallbackPI.id,
        visibility,
        assets: {},
      });
    }

    const safeProjectId = resolvedProject?.id || 'proj-general';
    const safeProjectTag = resolvedProject?.tag || (language === 'zh' ? '常规科研' : 'General');
    const safeVenue = resolvedProject?.targetVenue || 'Internal';

    addTask({
      title: title.trim(),
      description: description.trim() || undefined,
      stage,
      priority,
      projectId: safeProjectId,
      projectTag: safeProjectTag,
      targetVenue: safeVenue,
      startDate,
      deadline,
      progress: 0,
      leadAuthor: fallbackLead,
      pi: fallbackPI,
      visibility,
      assets: {
        overleaf: resolvedProject?.assets?.overleaf,
        github: resolvedProject?.assets?.github,
        dataset: resolvedProject?.assets?.dataset,
        zotero: resolvedProject?.assets?.zotero,
      },
      isBlocked: false,
      order: 0,
      tags: [safeProjectTag],
    });

    setTitle('');
    setDescription('');
    setInlineProjTitle('');
    setInlineProjTag('');
    setIsNewTaskOpen(false);
  };

  const inputClass =
    'w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500/60';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={() => setIsNewTaskOpen(false)}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-500 dark:text-indigo-400">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
              {t.newTask}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'zh'
                ? '添加一个学术论文研发任务、实验批次或撰写章节。'
                : 'Add a research task, experiment batch, or manuscript section.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t.paperTitle} *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Conduct sensitivity analysis on variance penalty parameter lambda"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  {language === 'zh' ? '归属课题 / 论文' : 'Parent Project'}
                </label>
                <button
                  type="button"
                  onClick={() => setCreatingInlineProj((v) => !v)}
                  className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <FolderPlus className="w-3 h-3" />
                  <span>
                    {creatingInlineProj
                      ? language === 'zh'
                        ? '选已有课题'
                        : 'Select Existing'
                      : language === 'zh'
                      ? '新建课题'
                      : '+ New Project'}
                  </span>
                </button>
              </div>

              {creatingInlineProj || projects.length === 0 ? (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={inlineProjTitle}
                    onChange={(e) => setInlineProjTitle(e.target.value)}
                    placeholder={
                      language === 'zh'
                        ? '输入新课题名 (留空则归入常规科研)'
                        : 'New project title (optional -> General)'
                    }
                    className={inputClass}
                  />
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      value={inlineProjTag}
                      onChange={(e) => setInlineProjTag(e.target.value)}
                      placeholder={language === 'zh' ? '简短标签' : 'Tag'}
                      className={inputClass}
                    />
                    <input
                      type="text"
                      value={inlineProjVenue}
                      onChange={(e) => setInlineProjVenue(e.target.value)}
                      placeholder={language === 'zh' ? '目标期刊/会议' : 'Target Venue'}
                      className={inputClass}
                    />
                  </div>
                </div>
              ) : (
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className={inputClass}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900">
                      [{p.tag}] {p.title.length > 36 ? `${p.title.slice(0, 36)}...` : p.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.academicStage} *
              </label>
              <select
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.startDate}
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.endDate}
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.priority}
              </label>
              <select
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
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.leadAuthor} *
              </label>
              <select
                value={leadAuthorId}
                onChange={(e) => setLeadAuthorId(e.target.value)}
                className={inputClass}
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id} className="bg-white dark:bg-slate-900">
                    {language === 'zh'
                      ? `${m.nameZh} (${m.titleZh})`
                      : `${m.nameEn} (${m.titleEn})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t.visibility}
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as VisibilityLevel)}
              className={inputClass}
            >
              <option value="PUBLIC">{t.visibilityPublic}</option>
              <option value="TEAM_ONLY">{t.visibilityTeamOnly}</option>
              <option value="PI_ONLY">{t.visibilityPIOnly}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t.methodologyDesc}
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline specific objectives, theorems, or data protocols..."
              className={inputClass}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsNewTaskOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all"
            >
              {t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
