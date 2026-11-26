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

  const [selectedResourceId, setSelectedResourceId] = useState<string>(resources[1]?.id || resources[0]?.id || '');
  const [claimUser, setClaimUser] = useState<string>(currentMember?.nameEn || members[0]?.nameEn || 'Member');
  const [jobName, setJobName] = useState<string>('Data Collection / Experiment Batch');
  const [hours, setHours] = useState<number>(8);

  if (!isResourceModalOpen) return null;

  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResourceId || !claimUser.trim()) return;
    claimResource(selectedResourceId, claimUser, jobName.trim() || 'Shared Resource Session', hours);
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
          <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                {t.computeTitle}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5 leading-snug">
              {language === 'zh' ? '实验室共享仪器、算力与场地预约调度' : 'Shared Lab Equipment, Compute & Resource Scheduler'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'zh' ? '实时占用状态、载荷配额监控与一键预约释放。' : 'Live utilization status, quota tracking, and reservation scheduler.'}
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
                className={`p-4 rounded-xl border transition-all bg-slate-50 dark:bg-slate-950/70 ${
                  isOccupied
                    ? 'border-indigo-300 dark:border-indigo-500/35'
                    : isIdle
                    ? 'border-emerald-300 dark:border-emerald-500/35'
                    : 'border-amber-300 dark:border-amber-500/35'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Specs & Name */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{resName}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isOccupied
                            ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30'
                            : isIdle
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {res.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">{res.specs}</p>

                    {/* Telemetry / occupancy details */}
                    <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300 pt-1 flex-wrap">
                      {isOccupied && (
                        <>
                          <span className="flex items-center gap-1 text-indigo-700 dark:text-indigo-300 font-medium">
                            <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            @{res.currentUser}
                          </span>
                          <span>·</span>
                          <span className="text-slate-600 dark:text-slate-400 truncate max-w-xs">{res.currentJob}</span>
                          {res.remainingHours && (
                            <>
                              <span>·</span>
                              <span className="text-amber-600 dark:text-amber-400 font-mono flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {res.remainingHours}{t.hoursRemaining}
                              </span>
                            </>
                          )}
                        </>
                      )}

                      {isIdle && (
                        <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-medium">
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
                            ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/40 hover:bg-rose-500/25'
                            : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-rose-600 dark:text-rose-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {(effectiveIsAdmin || canManageLab()) && res.currentUser !== currentMember.nameZh && res.currentUser !== currentMember.nameEn
                          ? t.forceRelease
                          : (language === 'zh' ? '释放资源' : 'Release Resource')}
                      </button>
                    )}

                    {isIdle && (
                      <button
                        onClick={() => {
                          setSelectedResourceId(res.id);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          selectedResourceId === res.id
                            ? 'bg-indigo-600 text-white shadow'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        {selectedResourceId === res.id
                          ? (language === 'zh' ? '已选中' : 'Selected')
                          : (language === 'zh' ? '预约资源' : 'Reserve')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Utilization bar */}
                {res.vramUtilPercent !== undefined && res.vramUtilPercent > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                      <span>{language === 'zh' ? '资源负载 / 占用率' : 'Resource Utilization'}</span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400">{res.vramUtilPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all"
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
          className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              {language === 'zh' ? '预约共享资源 / 登记使用计划' : 'Reserve Shared Resource'}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                {language === 'zh' ? '选择设备 / 资源' : 'Select Resource'}
              </label>
              <select
                value={selectedResourceId}
                onChange={(e) => setSelectedResourceId(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500/60"
              >
                {resources.map((r) => (
                  <option key={r.id} value={r.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
                    {language === 'zh' ? r.nameZh.split('(')[0] : r.nameEn.split('(')[0]} ({r.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                {language === 'zh' ? '使用者' : 'User'}
              </label>
              <select
                value={claimUser}
                onChange={(e) => setClaimUser(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500/60"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.nameEn} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
                    {language === 'zh' ? m.nameZh : m.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                {language === 'zh' ? '预计占用时长 (小时)' : 'Duration (Hours)'}
              </label>
              <input
                type="number"
                min={1}
                max={168}
                value={hours}
                onChange={(e) => setHours(parseInt(e.target.value) || 1)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500/60"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              {language === 'zh' ? '使用任务简述' : 'Session / Experiment Purpose'}
            </label>
            <input
              type="text"
              required
              value={jobName}
              onChange={(e) => setJobName(e.target.value)}
              placeholder="e.g. Sample Scanning / Empirical Model Estimation"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-500/60"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-all"
            >
              {language === 'zh' ? '确认预约资源' : 'Confirm Reservation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
