'use client';

import React, { useState } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import {
  Server,
  X,
  Cpu,
  Clock,
  User,
  CheckCircle2,
} from 'lucide-react';

export const ResourceModal: React.FC = () => {
  const {
    isResourceModalOpen,
    setIsResourceModalOpen,
    resources,
    claimResource,
    releaseResource,
    members,
    currentMember,
    effectiveIsAdmin,
    canManageLab,
    language,
    t,
  } = useLabFlow();

  const [selectedResourceId, setSelectedResourceId] = useState<string>(resources[1]?.id || '');
  const [claimUser, setClaimUser] = useState<string>('Student 2');
  const [jobName, setJobName] = useState<string>('Hyperparameter Sweep & Ablation Study');
  const [hours, setHours] = useState<number>(8);

  if (!isResourceModalOpen) return null;

  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResourceId || !claimUser.trim()) return;
    claimResource(selectedResourceId, claimUser, jobName.trim() || 'Research Training Run', hours);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setIsResourceModalOpen(false)}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {t.computeTitle}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-100 mt-0.5 leading-snug">
              {language === 'zh' ? '实验室算力与公共设施协同调度' : 'Compute & Shared Lab Resource Allocation'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === 'zh' ? '实时状态监控、显存配额管理与节点一键认领。' : 'Live status, VRAM telemetry, and reservation scheduler.'}
            </p>
          </div>
        </div>

        {/* Resource Cards List */}
        <div className="space-y-3 mb-6">
          {resources.map((res) => {
            const isOccupied = res.status === 'OCCUPIED';
            const isIdle = res.status === 'IDLE';
            const resName = language === 'zh' ? res.nameZh : res.nameEn;

            return (
              <div
                key={res.id}
                className={`p-4 rounded-xl border transition-all ${
                  isOccupied
                    ? 'bg-slate-950/70 border-cyan-500/30'
                    : isIdle
                    ? 'bg-slate-950/70 border-emerald-500/30'
                    : 'bg-slate-950/70 border-purple-500/30'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Specs & Name */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-100">{resName}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isOccupied
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : isIdle
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}
                      >
                        {res.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">{res.specs}</p>

                    {/* Telemetry / occupancy details */}
                    <div className="flex items-center gap-3 text-xs text-slate-300 pt-1">
                      {isOccupied && (
                        <>
                          <span className="flex items-center gap-1 text-cyan-300 font-medium">
                            <User className="w-3.5 h-3.5 text-cyan-400" />
                            @{res.currentUser}
                          </span>
                          <span>·</span>
                          <span className="text-slate-400 truncate max-w-xs">{res.currentJob}</span>
                          {res.remainingHours && (
                            <>
                              <span>·</span>
                              <span className="text-amber-400 font-mono flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {res.remainingHours}{t.hoursRemaining}
                              </span>
                            </>
                          )}
                        </>
                      )}

                      {isIdle && (
                        <span className="text-emerald-400 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {t.readyForRuns}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isOccupied && (
                      <button
                        onClick={() => releaseResource(res.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          (effectiveIsAdmin || canManageLab()) && res.currentUser !== currentMember.nameZh && res.currentUser !== currentMember.nameEn
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-rose-200 border-slate-700'
                        }`}
                      >
                        {(effectiveIsAdmin || canManageLab()) && res.currentUser !== currentMember.nameZh && res.currentUser !== currentMember.nameEn
                          ? t.forceRelease
                          : (language === 'zh' ? '释放节点' : 'Release Node')}
                      </button>
                    )}

                    {isIdle && (
                      <button
                        onClick={() => {
                          setSelectedResourceId(res.id);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          selectedResourceId === res.id
                            ? 'bg-cyan-600 text-white shadow'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        {selectedResourceId === res.id
                          ? (language === 'zh' ? '已选中' : 'Selected')
                          : (language === 'zh' ? '认领节点' : 'Claim Node')}
                      </button>
                    )}
                  </div>
                </div>

                {/* VRAM bar */}
                {res.vramUtilPercent !== undefined && res.vramUtilPercent > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span>{language === 'zh' ? '显存占用率' : 'VRAM Allocation'}</span>
                      <span className="font-mono text-cyan-400">{res.vramUtilPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-cyan-500 h-full rounded-full transition-all"
                        style={{ width: `${res.vramUtilPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Claim Form */}
        <form
          onSubmit={handleClaim}
          className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-cyan-400" />
              {language === 'zh' ? '认领算力节点 / 提交跑批计划' : 'Claim Compute Node'}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                {language === 'zh' ? '选择计算节点' : 'Select Node'}
              </label>
              <select
                value={selectedResourceId}
                onChange={(e) => setSelectedResourceId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60"
              >
                {resources.map((r) => (
                  <option key={r.id} value={r.id} className="bg-slate-900 text-slate-200">
                    {language === 'zh' ? r.nameZh.split('(')[0] : r.nameEn.split('(')[0]} ({r.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                {language === 'zh' ? '使用者' : 'User'}
              </label>
              <select
                value={claimUser}
                onChange={(e) => setClaimUser(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.nameEn} className="bg-slate-900 text-slate-200">
                    {language === 'zh' ? m.nameZh : m.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                {language === 'zh' ? '预计占用时长 (小时)' : 'Duration (Hours)'}
              </label>
              <input
                type="number"
                min={1}
                max={168}
                value={hours}
                onChange={(e) => setHours(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              {language === 'zh' ? '实验任务简述' : 'Job Description'}
            </label>
            <input
              type="text"
              required
              value={jobName}
              onChange={(e) => setJobName(e.target.value)}
              placeholder="e.g. ADMM Consensus Training with 10k Graph Perturbations"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md shadow-cyan-600/30 transition-all"
            >
              {language === 'zh' ? '确认认领节点' : 'Confirm Claim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
