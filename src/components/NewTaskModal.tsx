'use client';

import React, { useState } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import { AcademicStage, Priority } from '@/types';
import { STAGES } from '@/data/mockData';
import { Plus, X } from 'lucide-react';

export const NewTaskModal: React.FC = () => {
  const { isNewTaskOpen, setIsNewTaskOpen, addTask, members, projects } = useLabFlow();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stage, setStage] = useState<AcademicStage>('DATA_EXP');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [projectId, setProjectId] = useState(projects[0]?.id || 'proj-1');
  const [deadline, setDeadline] = useState(new Date().toISOString().split('T')[0]);
  const [leadAuthorId, setLeadAuthorId] = useState(members[2]?.id || 'member-kayn');
  const [overleaf, setOverleaf] = useState('');
  const [github, setGithub] = useState('');

  if (!isNewTaskOpen) return null;

  const currentProject = projects.find((p) => p.id === projectId) || projects[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const lead = members.find((m) => m.id === leadAuthorId) || members[2];
    const pi = members[0]; // Prof. Malone

    addTask({
      title,
      description: description.trim() || undefined,
      stage,
      priority,
      projectId: currentProject.id,
      projectTag: currentProject.tag,
      targetVenue: currentProject.targetVenue,
      deadline,
      leadAuthor: lead,
      pi,
      assets: {
        overleaf: overleaf.trim() || currentProject.assets.overleaf,
        github: github.trim() || currentProject.assets.github,
        dataset: currentProject.assets.dataset,
        zotero: currentProject.assets.zotero,
      },
      isBlocked: false,
      order: 0,
      tags: [currentProject.tag, 'Research'],
    });

    setIsNewTaskOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setIsNewTaskOpen(false)}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 leading-snug">
              Create New Academic Milestone / Task
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Add a paper sprint item, experiment batch, or manuscript section to the board.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Task Title *
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
                Parent Project / Paper *
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
                Initial Pipeline Stage *
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as AcademicStage)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60"
              >
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                    {s.labelEn} ({s.labelZh})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority & Deadline */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
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
              <label className="block text-xs font-medium text-slate-300 mb-1">Deadline Date</label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60"
              />
            </div>
          </div>

          {/* Lead Author */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Lead Author / Assignee *
            </label>
            <select
              value={leadAuthorId}
              onChange={(e) => setLeadAuthorId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">
                  {m.name} ({m.role})
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline specific objectives, theorems, or data protocols..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
            />
          </div>

          {/* Asset overrides */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Overleaf URL (optional)
              </label>
              <input
                type="url"
                value={overleaf}
                onChange={(e) => setOverleaf(e.target.value)}
                placeholder="https://overleaf.com/..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                GitHub URL (optional)
              </label>
              <input
                type="url"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsNewTaskOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all"
            >
              Add to Board
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
