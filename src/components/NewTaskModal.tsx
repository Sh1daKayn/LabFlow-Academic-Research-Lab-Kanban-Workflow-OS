'use client';

import React, { useState } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import { AcademicStage, Priority, VisibilityLevel } from '@/types';
import { Plus, X } from 'lucide-react';

export const NewTaskModal: React.FC = () => {
  const {
    isNewTaskOpen,
    setIsNewTaskOpen,
    addTask,
    members,
    projects,
    stages,
    language,
    t,
  } = useLabFlow();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stage, setStage] = useState<AcademicStage>(stages[1]?.id || 'DATA_EXP');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [visibility, setVisibility] = useState<VisibilityLevel>('PUBLIC');
  const [projectId, setProjectId] = useState(projects[0]?.id || 'proj-1');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [deadline, setDeadline] = useState(new Date().toISOString().split('T')[0]);
  const [leadAuthorId, setLeadAuthorId] = useState(members[2]?.id || 'member-student1');

  if (!isNewTaskOpen) return null;

  const currentProject = projects.find((p) => p.id === projectId) || projects[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const lead = members.find((m) => m.id === leadAuthorId) || members[2];
    const pi = members[0]; // Professor 1

    addTask({
      title,
      description: description.trim() || undefined,
      stage,
      priority,
      projectId: currentProject.id,
      projectTag: currentProject.tag,
      targetVenue: currentProject.targetVenue,
      startDate,
      deadline,
      progress: 0,
      leadAuthor: lead,
      pi,
      visibility,
      assets: {
        overleaf: currentProject.assets.overleaf,
        github: currentProject.assets.github,
        dataset: currentProject.assets.dataset,
        zotero: currentProject.assets.zotero,
      },
      isBlocked: false,
      order: 0,
      tags: [currentProject.tag],
    });

    setIsNewTaskOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setIsNewTaskOpen(false)}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 leading-snug">
              {t.newTask}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === 'zh' ? '添加一个学术论文研发任务、实验批次或撰写章节。' : 'Add a research task, experiment batch, or manuscript section.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {t.paperTitle} *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Conduct sensitivity analysis on variance penalty parameter lambda"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
            />
          </div>

          {/* Project & Stage */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {language === 'zh' ? '归属课题 / 论文 *' : 'Parent Project *'}
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                    [{p.tag}] {p.title.slice(0, 36)}...
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t.academicStage} *
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as AcademicStage)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60"
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                    {language === 'zh' ? s.labelZh : s.labelEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">{t.startDate}</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">{t.endDate}</label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60"
              />
            </div>
          </div>

          {/* Priority & Lead */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">{t.priority}</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60"
              >
                <option value="LOW" className="bg-slate-900 text-slate-200">Low</option>
                <option value="MEDIUM" className="bg-slate-900 text-slate-200">Medium</option>
                <option value="HIGH" className="bg-slate-900 text-slate-200">High</option>
                <option value="URGENT" className="bg-slate-900 text-slate-200">Urgent 🔥</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">{t.leadAuthor} *</label>
              <select
                value={leadAuthorId}
                onChange={(e) => setLeadAuthorId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">
                    {language === 'zh' ? `${m.nameZh} (${m.titleZh})` : `${m.nameEn} (${m.titleEn})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Visibility Scope */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {t.visibility}
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as VisibilityLevel)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60"
            >
              <option value="PUBLIC">{t.visibilityPublic}</option>
              <option value="TEAM_ONLY">{t.visibilityTeamOnly}</option>
              <option value="PI_ONLY">{t.visibilityPIOnly}</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {t.methodologyDesc}
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline specific objectives, theorems, or data protocols..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsNewTaskOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
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
