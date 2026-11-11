'use client';

import React, { useState } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import { ReverseDDLForm } from '@/types';
import { subtractDays, formatDate } from '@/utils/date';
import { Zap, X, Sparkles } from 'lucide-react';

const VENUE_PRESETS = [
  { name: 'AAAI 2027', defaultLead: 'member-student2', tag: 'AAAI 2027' },
  { name: 'NeurIPS 2027', defaultLead: 'member-student1', tag: 'NeurIPS \'27' },
  { name: 'ICML 2027', defaultLead: 'member-student2', tag: 'ICML \'27' },
  { name: 'INFORMS / Management Science', defaultLead: 'member-student1', tag: 'Mgt Sci' },
  { name: 'AEPP / IFAMR', defaultLead: 'member-student3', tag: 'AEPP' },
  { name: 'Nature Communications', defaultLead: 'member-student1', tag: 'Nature Comms' },
];

export const ReverseDDLModal: React.FC = () => {
  const {
    isReverseDDLOpen,
    setIsReverseDDLOpen,
    members,
    generateReverseDDLPipeline,
    language,
    t,
  } = useLabFlow();

  const [title, setTitle] = useState('');
  const [targetVenue, setTargetVenue] = useState('NeurIPS 2027');
  const [tag, setTag] = useState("NeurIPS '27");

  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 70);
  const [deadlineDate, setDeadlineDate] = useState(defaultDate.toISOString().split('T')[0]);
  const [leadAuthorId, setLeadAuthorId] = useState('member-student1');
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
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {t.reverseDDL}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-100 mt-1 leading-snug">
              {t.reverseDDLTitle}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{t.reverseDDLDesc}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Paper Title */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {t.paperTitle} *
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
                {t.targetVenue} *
              </label>
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
                placeholder="Target Venue"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
              />
              <input
                type="text"
                required
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder={t.badgeTag}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
              />
            </div>
          </div>

          {/* Submission Deadline & Lead Author */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t.submissionDDL} *
              </label>
              <input
                type="date"
                required
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t.leadAuthor} *
              </label>
              <select
                value={leadAuthorId}
                onChange={(e) => setLeadAuthorId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">
                    {language === 'zh' ? `${m.nameZh} (${m.titleZh})` : `${m.nameEn} (${m.titleEn})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Asset Links */}
          <div className="border-t border-slate-800/80 pt-3">
            <span className="text-xs font-medium text-slate-400 block mb-2">
              {language === 'zh' ? '科研资源直达链接 (选填)' : 'Asset Links (Optional)'}
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
                placeholder="Dataset URL"
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60"
              />
            </div>
          </div>

          {/* Milestone Calculation Live Preview */}
          <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {t.milestoneSchedule}:
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {formatDate(deadlineDate, language)}
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
                    {language === 'zh' ? '基线锁定与核心实验评测冻结' : 'Baseline & Core Empirical Results Freeze'}
                  </span>
                </div>
                <span className="text-[11px] text-cyan-400 font-mono">{formatDate(t45, language)}</span>
              </div>

              {/* T-30 */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-amber-500/30 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    T - 30d
                  </span>
                  <span className="text-slate-200 font-medium">
                    {language === 'zh' ? '完整学术论文初稿就绪' : 'Full Manuscript First Draft Ready'}
                  </span>
                </div>
                <span className="text-[11px] text-amber-400 font-mono">{formatDate(t30, language)}</span>
              </div>

              {/* T-14 */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-blue-500/30 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    T - 14d
                  </span>
                  <span className="text-slate-200 font-medium">
                    {language === 'zh' ? '提交导师进行全篇深入审阅' : 'Submit Polished PDF to Advisor for Review'}
                  </span>
                </div>
                <span className="text-[11px] text-blue-400 font-mono">{formatDate(t14, language)}</span>
              </div>

              {/* T-3 */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-rose-500/30 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    T - 3d
                  </span>
                  <span className="text-slate-200 font-medium">
                    {language === 'zh' ? '排版校验、双盲匿名脱敏与复现包核查' : 'Camera Formatting & Code Replication Check'}
                  </span>
                </div>
                <span className="text-[11px] text-rose-400 font-mono">{formatDate(t3, language)}</span>
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
              {t.cancel}
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 transition-all duration-150"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>{t.generatePipelineBtn}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
