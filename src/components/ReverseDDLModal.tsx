'use client';

import React, { useState } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import { ReverseDDLForm } from '@/types';
import { subtractDays, formatDate } from '@/utils/date';
import { Zap, X, Sparkles } from 'lucide-react';

const VENUE_PRESETS = [
  { name: 'AAAI 2027', defaultLead: 'member-alex', tag: 'AAAI 2027' },
  { name: 'NeurIPS 2027', defaultLead: 'member-kayn', tag: 'NeurIPS \'27' },
  { name: 'ICML 2027', defaultLead: 'member-alex', tag: 'ICML \'27' },
  { name: 'INFORMS / Management Science', defaultLead: 'member-kayn', tag: 'Mgt Sci' },
  { name: 'AEPP / IFAMR', defaultLead: 'member-elena', tag: 'AEPP' },
  { name: 'Nature Communications', defaultLead: 'member-kayn', tag: 'Nature Comms' },
];

export const ReverseDDLModal: React.FC = () => {
  const { isReverseDDLOpen, setIsReverseDDLOpen, members, generateReverseDDLPipeline } =
    useLabFlow();

  const [title, setTitle] = useState('');
  const [targetVenue, setTargetVenue] = useState('NeurIPS 2027');
  const [tag, setTag] = useState("NeurIPS '27");
  // Default deadline 70 days from today
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 70);
  const [deadlineDate, setDeadlineDate] = useState(defaultDate.toISOString().split('T')[0]);
  const [leadAuthorId, setLeadAuthorId] = useState('member-kayn');
  const [overleafUrl, setOverleafUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [datasetUrl, setDatasetUrl] = useState('');

  if (!isReverseDDLOpen) return null;

  // Calculate milestones
  const t45 = subtractDays(deadlineDate, 45);
  const t30 = subtractDays(deadlineDate, 30);
  const t14 = subtractDays(deadlineDate, 14);
  const t3 = subtractDays(deadlineDate, 3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !deadlineDate) return;

    const form: ReverseDDLForm = {
      title,
      targetVenue,
      deadlineDate,
      leadAuthorId,
      tag: tag.trim() || targetVenue.split(' ')[0],
      overleafUrl: overleafUrl.trim() || undefined,
      githubUrl: githubUrl.trim() || undefined,
      datasetUrl: datasetUrl.trim() || undefined,
    };

    generateReverseDDLPipeline(form);
    setIsReverseDDLOpen(false);
  };

  const handleSelectPreset = (preset: typeof VENUE_PRESETS[0]) => {
    setTargetVenue(preset.name);
    setTag(preset.tag);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => setIsReverseDDLOpen(false)}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400">
            <Zap className="w-6 h-6 fill-amber-400/20" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Academic DDL Algorithm
              </span>
              <span className="text-xs text-slate-400">Target Venue Synchronization</span>
            </div>
            <h2 className="text-lg font-bold text-slate-100 mt-1 leading-snug">
              Reverse DDL Scheduler (投稿倒推排期生成器)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter target submission date to automatically generate 4 synchronized milestone tasks onto your board.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Paper Title */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Paper / Research Project Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Federated Stochastic Variance Reduction for Non-Convex Bilevel Optimization"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40"
            />
          </div>

          {/* Target Venue & Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Target Venue / Conference / Journal *
              </label>
              <span className="text-[10px] text-slate-500">Quick Presets:</span>
            </div>

            {/* Presets pills */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {VENUE_PRESETS.map((vp) => (
                <button
                  key={vp.name}
                  type="button"
                  onClick={() => handleSelectPreset(vp)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                    targetVenue === vp.name
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {vp.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                value={targetVenue}
                onChange={(e) => setTargetVenue(e.target.value)}
                placeholder="Target Venue (e.g. INFORMS / Management Science)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
              />
              <input
                type="text"
                required
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Badge Tag (e.g. NeurIPS '27)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
              />
            </div>
          </div>

          {/* Submission Deadline & Lead Author */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Submission Deadline (T-Day) *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Lead Author / Assignee *
              </label>
              <select
                value={leadAuthorId}
                onChange={(e) => setLeadAuthorId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Asset Links */}
          <div className="border-t border-slate-800/80 pt-3">
            <span className="text-xs font-medium text-slate-400 block mb-2">
              Initial Asset Links (Optional)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="url"
                value={overleafUrl}
                onChange={(e) => setOverleafUrl(e.target.value)}
                placeholder="Overleaf URL"
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60"
              />
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="GitHub Repo URL"
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60"
              />
              <input
                type="url"
                value={datasetUrl}
                onChange={(e) => setDatasetUrl(e.target.value)}
                placeholder="Dataset / Drive URL"
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60"
              />
            </div>
          </div>

          {/* Milestone Calculation Live Preview */}
          <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Generated 4-Stage Milestone Schedule:
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Deadline: {formatDate(deadlineDate)}
              </span>
            </div>

            <div className="space-y-2 pt-1">
              {/* T-45 */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-cyan-500/30 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    T - 45d
                  </span>
                  <span className="text-slate-200 font-medium">
                    Baseline & Core Empirical Results Freeze
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-cyan-400 font-mono">{formatDate(t45)}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                    Data & Modeling
                  </span>
                </div>
              </div>

              {/* T-30 */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-amber-500/30 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    T - 30d
                  </span>
                  <span className="text-slate-200 font-medium">
                    Full Manuscript First Draft Ready
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-amber-400 font-mono">{formatDate(t30)}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                    Drafting
                  </span>
                </div>
              </div>

              {/* T-14 */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-blue-500/30 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    T - 14d
                  </span>
                  <span className="text-slate-200 font-medium">
                    Submit Polished PDF to PI for Internal Review
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-blue-400 font-mono">{formatDate(t14)}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                    PI Review
                  </span>
                </div>
              </div>

              {/* T-3 */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-rose-500/30 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    T - 3d
                  </span>
                  <span className="text-slate-200 font-medium">
                    Camera Formatting, Anonymity & Code Check
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-rose-400 font-mono">{formatDate(t3)}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                    PI Review
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsReverseDDLOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 transition-all duration-150"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>Generate Pipeline (生成全流程排期)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
