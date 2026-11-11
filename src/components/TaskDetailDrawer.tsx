'use client';

import React, { useState, useEffect } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import { AcademicStage, Priority } from '@/types';
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
} from 'lucide-react';
import { GitHubIcon } from '@/components/icons/BrandIcons';

export const TaskDetailDrawer: React.FC = () => {
  const {
    selectedTask,
    setSelectedTask,
    updateTask,
    deleteTask,
    members,
    stages,
    language,
    t,
    resolveBlocker,
  } = useLabFlow();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stage, setStage] = useState<AcademicStage>('DATA_EXP');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
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
      setStartDate(selectedTask.startDate || '');
      setDeadline(selectedTask.deadline ? selectedTask.deadline.split('T')[0] : '');
      setProgress(selectedTask.progress || 0);
      setTargetVenue(selectedTask.targetVenue);
      setProjectTag(selectedTask.projectTag);
      setLeadAuthorId(selectedTask.leadAuthor.id);
      setPiId(selectedTask.pi.id);
      setOverleaf(selectedTask.assets.overleaf || '');
      setGithub(selectedTask.assets.github || '');
      setDataset(selectedTask.assets.dataset || '');
      setZotero(selectedTask.assets.zotero || '');
      setChecklist(selectedTask.checklist || []);
    }
  }, [selectedTask]);

  if (!selectedTask) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const lead = members.find((m) => m.id === leadAuthorId) || selectedTask.leadAuthor;
    const pi = members.find((m) => m.id === piId) || selectedTask.pi;

    updateTask(selectedTask.id, {
      title,
      description,
      stage,
      priority,
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
    if (confirm(t.confirmDelete)) {
      deleteTask(selectedTask.id);
    }
  };

  const handleAddSubtask = () => {
    if (!newSubtaskText.trim()) return;
    const newId = `sub-${Date.now()}`;
    setChecklist([...checklist, { id: newId, text: newSubtaskText.trim(), done: false }]);
    setNewSubtaskText('');
  };

  const handleToggleSubtask = (subId: string) => {
    setChecklist(
      checklist.map((c) => (c.id === subId ? { ...c, done: !c.done } : c))
    );
  };

  const handleDeleteSubtask = (subId: string) => {
    setChecklist(checklist.filter((c) => c.id !== subId));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {projectTag || 'Project'}
            </span>
            <span className="text-xs text-slate-400">{t.inspector}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDelete}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title={t.delete}
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setSelectedTask(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body Form */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Blocker Alert Box if Blocked */}
          {selectedTask.isBlocked && selectedTask.blocker && (
            <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-400 flex items-center gap-1.5 uppercase">
                  <Flame className="w-4 h-4 text-red-400 animate-pulse" />
                  {t.activeBlockerAlert}
                </span>
                <button
                  type="button"
                  onClick={() => resolveBlocker(selectedTask.id)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t.resolveAction}</span>
                </button>
              </div>

              <div className="text-xs text-slate-200 bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1">
                <div>
                  <span className="text-slate-400 font-semibold">{t.blockerCategory}: </span>
                  <span className="text-red-300 font-medium">
                    {language === 'zh'
                      ? BLOCKER_CATEGORIES[selectedTask.blocker.category]?.labelZh
                      : BLOCKER_CATEGORIES[selectedTask.blocker.category]?.labelEn}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">{t.whereStuck}: </span>
                  <span className="text-slate-200">{selectedTask.blocker.details}</span>
                </div>
              </div>
            </div>
          )}

          {/* Title input */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">{t.paperTitle} *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 font-semibold focus:outline-none focus:border-cyan-500/60"
            />
          </div>

          {/* Stage & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {t.academicStage} *
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as AcademicStage)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60"
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                    {language === 'zh' ? s.labelZh : s.labelEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">{t.priority}</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60"
              >
                <option value="LOW" className="bg-slate-900 text-slate-200">Low</option>
                <option value="MEDIUM" className="bg-slate-900 text-slate-200">Medium</option>
                <option value="HIGH" className="bg-slate-900 text-slate-200">High</option>
                <option value="URGENT" className="bg-slate-900 text-slate-200">Urgent 🔥</option>
              </select>
            </div>
          </div>

          {/* Dates & Progress */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">{t.startDate}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">{t.endDate}</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {t.progress} ({progress}%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={progress}
                onChange={(e) => setProgress(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60 font-mono"
              />
            </div>
          </div>

          {/* Authors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">{t.leadAuthor}</label>
              <select
                value={leadAuthorId}
                onChange={(e) => setLeadAuthorId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">
                    {language === 'zh' ? `${m.nameZh} (${m.titleZh})` : `${m.nameEn} (${m.titleEn})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">PI</label>
              <select
                value={piId}
                onChange={(e) => setPiId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">
                    {language === 'zh' ? m.nameZh : m.nameEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              {t.methodologyDesc}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 leading-relaxed"
            />
          </div>

          {/* Checklist */}
          <div className="border-t border-slate-800 pt-3">
            <label className="block text-xs font-medium text-slate-400 mb-2">
              {t.checklist}
            </label>
            <div className="space-y-1.5 mb-2">
              {checklist.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                >
                  <div
                    onClick={() => handleToggleSubtask(c.id)}
                    className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                  >
                    <input
                      type="checkbox"
                      checked={c.done}
                      onChange={() => {}}
                      className="rounded border-slate-700 bg-slate-900 text-emerald-500 cursor-pointer"
                    />
                    <span
                      className={`truncate ${
                        c.done ? 'line-through text-slate-500' : 'text-slate-200'
                      }`}
                    >
                      {c.text}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteSubtask(c.id)}
                    className="text-slate-600 hover:text-rose-400 text-xs p-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

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
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Asset Links */}
          <div className="border-t border-slate-800 pt-3 space-y-2">
            <label className="block text-xs font-medium text-slate-400">
              {t.assets}
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <input
                  type="url"
                  value={overleaf}
                  onChange={(e) => setOverleaf(e.target.value)}
                  placeholder="Overleaf URL"
                  className="bg-transparent text-slate-200 focus:outline-none w-full text-xs placeholder-slate-600"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
                <GitHubIcon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <input
                  type="url"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="GitHub URL"
                  className="bg-transparent text-slate-200 focus:outline-none w-full text-xs placeholder-slate-600"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
                <Database className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <input
                  type="url"
                  value={dataset}
                  onChange={(e) => setDataset(e.target.value)}
                  placeholder="Dataset URL"
                  className="bg-transparent text-slate-200 focus:outline-none w-full text-xs placeholder-slate-600"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
                <BookOpen className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <input
                  type="url"
                  value={zotero}
                  onChange={(e) => setZotero(e.target.value)}
                  placeholder="Zotero URL"
                  className="bg-transparent text-slate-200 focus:outline-none w-full text-xs placeholder-slate-600"
                />
              </div>
            </div>
          </div>

          {/* Drawer Bottom Bar */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedTask(null)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{t.save}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
