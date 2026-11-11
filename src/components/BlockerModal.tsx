'use client';

import React, { useState, useEffect } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import { BLOCKER_CATEGORIES } from '@/data/mockData';
import { BlockerCategory, BlockerInfo } from '@/types';
import {
  Flame,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserCheck,
} from 'lucide-react';

export const BlockerModal: React.FC = () => {
  const {
    activeBlockerTask,
    setActiveBlockerTask,
    reportBlocker,
    resolveBlocker,
  } = useLabFlow();

  const [category, setCategory] = useState<BlockerCategory>('MATH_DERIVATION');
  const [details, setDetails] = useState('');
  const [tried, setTried] = useState('');
  const [escalatedTo, setEscalatedTo] = useState('Prof. Malone');

  useEffect(() => {
    if (activeBlockerTask?.blocker) {
      setCategory(activeBlockerTask.blocker.category);
      setDetails(activeBlockerTask.blocker.details);
      setTried(activeBlockerTask.blocker.tried);
      setEscalatedTo(activeBlockerTask.blocker.escalatedTo);
    } else {
      setCategory('MATH_DERIVATION');
      setDetails('');
      setTried('');
      setEscalatedTo('Prof. Malone');
    }
  }, [activeBlockerTask]);

  if (!activeBlockerTask) return null;

  const isAlreadyBlocked = activeBlockerTask.isBlocked && activeBlockerTask.blocker;

  const handleReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) return;

    const blockerInfo: BlockerInfo = {
      category,
      details,
      tried: tried.trim() || 'Analytical formulation tested; empirical verification stalled.',
      escalatedTo,
      reportedAt: new Date().toISOString(),
    };

    reportBlocker(activeBlockerTask.id, blockerInfo);
    setActiveBlockerTask(null);
  };

  const handleResolve = () => {
    resolveBlocker(activeBlockerTask.id);
    setActiveBlockerTask(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => setActiveBlockerTask(null)}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 mb-5">
          <div
            className={`p-2.5 rounded-xl border ${
              isAlreadyBlocked
                ? 'bg-red-500/15 border-red-500/40 text-red-400'
                : 'bg-amber-500/15 border-amber-500/40 text-amber-400'
            }`}
          >
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {activeBlockerTask.projectTag}
              </span>
              <span className="text-xs text-slate-400">
                Lead: {activeBlockerTask.leadAuthor.name}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-100 mt-1 leading-snug">
              {isAlreadyBlocked ? 'Active Blocker Escalation' : 'Report Academic Blocker (标记卡点)'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{activeBlockerTask.title}</p>
          </div>
        </div>

        {/* Existing Blocker Status Box if already blocked */}
        {isAlreadyBlocked && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/30 border border-red-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-400 flex items-center gap-1.5 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Active Blocker: {BLOCKER_CATEGORIES[activeBlockerTask.blocker!.category]?.labelZh || activeBlockerTask.blocker!.category}
              </span>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                {new Date(activeBlockerTask.blocker!.reportedAt).toLocaleDateString()}
              </span>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Where is it stuck?
              </div>
              <p className="text-xs text-slate-200 mt-0.5 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                {activeBlockerTask.blocker!.details}
              </p>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                What has been tried?
              </div>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                {activeBlockerTask.blocker!.tried}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1 text-xs text-slate-300">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Escalated to:</span>
              <span className="font-semibold text-cyan-300">
                {activeBlockerTask.blocker!.escalatedTo}
              </span>
            </div>

            {/* Resolve Blocker Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleResolve}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all duration-150"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Resolve Blocker / 解除卡点 (Resume Pipeline)</span>
              </button>
            </div>
          </div>
        )}

        {/* Report / Update Blocker Form */}
        <form onSubmit={handleReport} className="space-y-4">
          <div className="border-t border-slate-800 pt-4">
            <h3 className="text-xs font-semibold text-slate-300 mb-2">
              {isAlreadyBlocked ? 'Or Update Blocker Details:' : 'Describe the Technical Bottleneck:'}
            </h3>

            {/* Category Selector */}
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Blocker Category (卡点类型)
            </label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {(Object.keys(BLOCKER_CATEGORIES) as BlockerCategory[]).map((catKey) => {
                const meta = BLOCKER_CATEGORIES[catKey];
                const isSelected = category === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setCategory(catKey)}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-rose-500/15 border-rose-500 text-rose-200 ring-1 ring-rose-500'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-200">{meta.labelZh}</span>
                    <span className="text-[10px] text-slate-400">{meta.labelEn}</span>
                  </button>
                );
              })}
            </div>

            {/* Stuck Description */}
            <div className="space-y-1.5 mb-3">
              <label className="block text-xs font-medium text-slate-300">
                Where is it stuck? (具体卡在什么技术点？) *
              </label>
              <textarea
                rows={3}
                required
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="e.g. Inexact ADMM primal-dual gap diverges at iteration k > 500 under non-Lipschitz gradient condition in Lemma 4.2..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/40 leading-relaxed"
              />
            </div>

            {/* What has been tried */}
            <div className="space-y-1.5 mb-3">
              <label className="block text-xs font-medium text-slate-300">
                What has been tried so far? (已尝试过的解法与推导)
              </label>
              <textarea
                rows={2}
                value={tried}
                onChange={(e) => setTried(e.target.value)}
                placeholder="e.g. Tested proximal gradient scaling with backtracking line search; verified on 50-node toy graph but fails analytically for directed topologies..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/40 leading-relaxed"
              />
            </div>

            {/* Escalate To */}
            <div className="space-y-1.5 mb-5">
              <label className="block text-xs font-medium text-slate-300">
                Escalate to / 求助对象
              </label>
              <select
                value={escalatedTo}
                onChange={(e) => setEscalatedTo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500/60"
              >
                <option value="Prof. Malone (PI)">Prof. Malone (PI & Lab Director)</option>
                <option value="Dr. Aris Thorne (Postdoc)">Dr. Aris Thorne (Postdoctoral Fellow)</option>
                <option value="Kayn Zhang (Senior PhD)">Kayn Zhang (Senior PhD Candidate)</option>
                <option value="All Group Meeting Discussion">All Group Meeting Discussion (组会全员讨论)</option>
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveBlockerTask(null)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/30 transition-all duration-150"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{isAlreadyBlocked ? 'Update Blocker' : '🚨 Escalate Blocker to Lab'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
