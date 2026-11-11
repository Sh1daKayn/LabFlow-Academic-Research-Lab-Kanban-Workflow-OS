'use client';

import React, { useState } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import { ReverseDDLForm, MilestoneTemplate, AcademicStage } from '@/types';
import { subtractDays, formatDate } from '@/utils/date';
import { Zap, X, Sparkles, Plus, Trash2, ChevronUp } from 'lucide-react';

export const ReverseDDLModal: React.FC = () => {
  const {
    isReverseDDLOpen,
    setIsReverseDDLOpen,
    members,
    venues,
    addVenue,
    deleteVenue,
    stages,
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

  // Customizable Milestones State
  const [milestones, setMilestones] = useState<MilestoneTemplate[]>([
    { nameEn: 'Baseline & Empirical Freeze', nameZh: '基线锁定与实验评测冻结', offsetDays: 45, stageId: 'DATA_EXP' },
    { nameEn: 'Full Manuscript Draft Ready', nameZh: '完整学术论文初稿就绪', offsetDays: 30, stageId: 'DRAFTING' },
    { nameEn: 'Submit to Advisor for Review', nameZh: '提交导师进行全篇审阅', offsetDays: 14, stageId: 'PI_REVIEW' },
    { nameEn: 'Camera & Formatting Check', nameZh: '格式排版与匿名复核', offsetDays: 3, stageId: 'PI_REVIEW' },
  ]);

  // Add Venue Accordion State
  const [isAddingVenue, setIsAddingVenue] = useState(false);
  const [newVenueName, setNewVenueName] = useState('');
  const [newVenueTag, setNewVenueTag] = useState('');

  if (!isReverseDDLOpen) return null;

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
      customMilestones: milestones.map((m) => ({
        ...m,
        offsetDays: Math.max(1, Number(m.offsetDays) || 1),
      })),
    };

    generateReverseDDLPipeline(form);
    setIsReverseDDLOpen(false);
  };

  const handleSelectVenue = (v: (typeof venues)[0]) => {
    setTargetVenue(v.name);
    setTag(v.tag);
    if (v.defaultLeadId) setLeadAuthorId(v.defaultLeadId);
    if (v.milestones && v.milestones.length > 0) {
      setMilestones(JSON.parse(JSON.stringify(v.milestones)));
    }
  };

  const handleAddCustomVenue = () => {
    if (!newVenueName.trim()) return;
    const vTag = newVenueTag.trim() || newVenueName.split(' ')[0];
    addVenue({
      id: `venue-${Date.now()}`,
      name: newVenueName.trim(),
      tag: vTag,
      defaultLeadId: leadAuthorId,
      milestones: [...milestones],
    });
    setTargetVenue(newVenueName.trim());
    setTag(vTag);
    setNewVenueName('');
    setNewVenueTag('');
    setIsAddingVenue(false);
  };

  const updateMilestone = (index: number, updates: Partial<MilestoneTemplate>) => {
    setMilestones((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const removeMilestone = (index: number) => {
    if (milestones.length <= 1) return;
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  };

  const addMilestoneStep = () => {
    const defaultOffset = milestones.length > 0 ? Math.max(1, milestones[milestones.length - 1].offsetDays - 5) : 7;
    setMilestones((prev) => [
      ...prev,
      {
        nameEn: 'Supplementary Milestone',
        nameZh: '补充阶段里程碑',
        offsetDays: defaultOffset,
        stageId: (stages[2]?.id || 'DRAFTING') as AcademicStage,
      },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 max-h-[92vh] overflow-y-auto">
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
              <button
                type="button"
                onClick={() => setIsAddingVenue(!isAddingVenue)}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                {isAddingVenue ? <ChevronUp className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                <span>{t.addVenue}</span>
              </button>
            </div>

            {/* Presets pills from customizable venues state */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {venues.map((v) => (
                <div key={v.id} className="relative group inline-flex items-center">
                  <button
                    type="button"
                    onClick={() => handleSelectVenue(v)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                      targetVenue === v.name
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {v.name}
                  </button>
                  {venues.length > 3 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteVenue(v.id);
                      }}
                      className="hidden group-hover:inline-block ml-0.5 p-0.5 text-slate-500 hover:text-rose-400"
                      title={language === 'zh' ? '删除该预设' : 'Delete preset'}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Collapsible Add Custom Venue Form */}
            {isAddingVenue && (
              <div className="mb-3 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold text-slate-300 block">
                  {language === 'zh' ? '添加自定义会议/期刊库' : 'Add Custom Target Venue'}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newVenueName}
                    onChange={(e) => setNewVenueName(e.target.value)}
                    placeholder={language === 'zh' ? '会议/期刊全称 (如 KDD 2027)' : 'Venue Full Name'}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  />
                  <input
                    type="text"
                    value={newVenueTag}
                    onChange={(e) => setNewVenueTag(e.target.value)}
                    placeholder={language === 'zh' ? '简写标签 (如 KDD)' : 'Short Tag'}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingVenue(false)}
                    className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCustomVenue}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium"
                  >
                    {language === 'zh' ? '存入期刊库' : 'Save to Library'}
                  </button>
                </div>
              </div>
            )}

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

          {/* Customizable Milestone Steps Table (Offset Days & Stage Customization) */}
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-200">
                  {t.customMilestoneOffsets}
                </span>
              </div>
              <button
                type="button"
                onClick={addMilestoneStep}
                className="text-[11px] font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>{t.addStep}</span>
              </button>
            </div>

            <div className="space-y-2">
              {milestones.map((m, idx) => {
                const targetDate = subtractDays(deadlineDate, m.offsetDays);
                const stepName = language === 'zh' ? m.nameZh : m.nameEn;

                return (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs"
                  >
                    {/* Days Offset Input */}
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-slate-400 font-mono text-[11px]">T -</span>
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={m.offsetDays}
                        onChange={(e) =>
                          updateMilestone(idx, { offsetDays: parseInt(e.target.value) || 0 })
                        }
                        className="w-14 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-center font-mono font-bold text-amber-400 text-xs focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-slate-400 text-[11px]">
                        {language === 'zh' ? '天' : 'd'}
                      </span>
                    </div>

                    {/* Step Title Input */}
                    <input
                      type="text"
                      value={stepName}
                      onChange={(e) =>
                        updateMilestone(
                          idx,
                          language === 'zh'
                            ? { nameZh: e.target.value }
                            : { nameEn: e.target.value }
                        )
                      }
                      placeholder={t.stepTitle}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />

                    {/* Stage Select */}
                    <select
                      value={m.stageId}
                      onChange={(e) =>
                        updateMilestone(idx, { stageId: e.target.value as AcademicStage })
                      }
                      className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 shrink-0"
                    >
                      {stages.map((st) => (
                        <option key={st.id} value={st.id}>
                          {language === 'zh' ? st.labelZh : st.labelEn}
                        </option>
                      ))}
                    </select>

                    {/* Calculated Date Preview & Delete */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                      <span className="text-[11px] font-mono text-cyan-400">
                        {formatDate(targetDate, language)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeMilestone(idx)}
                        disabled={milestones.length <= 1}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
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

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsReverseDDLOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{t.generatePipelineBtn}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
