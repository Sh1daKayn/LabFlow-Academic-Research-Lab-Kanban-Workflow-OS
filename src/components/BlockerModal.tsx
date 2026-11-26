'use client';

import React, { useState, useEffect } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import { BLOCKER_CATEGORIES } from '@/data/mockData';
import { BlockerCategory, BlockerInfo, RequestVisibility } from '@/types';
import {
  Flame,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserCheck,
  Lock,
  Globe,
} from 'lucide-react';

export const BlockerModal: React.FC = () => {
  const {
    activeBlockerTask,
    setActiveBlockerTask,
    reportBlocker,
    resolveBlocker,
    language,
    t,
    members,
    notificationSettings,
  } = useLabFlow();

  const [category, setCategory] = useState<BlockerCategory>('MATH_DERIVATION');
  const [details, setDetails] = useState('');
  const [tried, setTried] = useState('');
  const [escalatedToId, setEscalatedToId] = useState('');
  const [requestVisibility, setRequestVisibility] = useState<RequestVisibility>('PRIVATE');
  const [notifyChannel, setNotifyChannel] = useState<boolean>(true);

  useEffect(() => {
    const defaultPI =
      members.find((m) => m.accessRole === 'ADMIN_PI' || m.role === 'PI') || members[0];
    if (activeBlockerTask?.blocker) {
      setCategory(activeBlockerTask.blocker.category);
      setDetails(activeBlockerTask.blocker.details);
      setTried(activeBlockerTask.blocker.tried);
      const matched =
        members.find((m) => m.id === activeBlockerTask.blocker?.escalatedToId) ||
        members.find(
          (m) =>
            m.nameZh === activeBlockerTask.blocker?.escalatedTo ||
            m.nameEn === activeBlockerTask.blocker?.escalatedTo
        ) ||
        defaultPI;
      setEscalatedToId(matched?.id || '');
      setRequestVisibility('PRIVATE');
      setNotifyChannel(true);
    } else {
      setCategory('MATH_DERIVATION');
      setDetails('');
      setTried('');
      setEscalatedToId(defaultPI?.id || '');
      setRequestVisibility('PRIVATE');
      setNotifyChannel(true);
    }
  }, [activeBlockerTask, members]);

  if (!activeBlockerTask) return null;

  const isAlreadyBlocked = activeBlockerTask.isBlocked && activeBlockerTask.blocker;
  const externalChannelsActive =
    notificationSettings.enabled &&
    activeBlockerTask.visibility !== 'PI_ONLY' &&
    ((notificationSettings.teams.enabled && notificationSettings.teams.notifyOnBlocker) ||
      (notificationSettings.slack.enabled && notificationSettings.slack.notifyOnBlocker));

  const handleReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) return;

    const targetMember = members.find((m) => m.id === escalatedToId) || members[0];
    const resolvedName = targetMember
      ? language === 'zh'
        ? targetMember.nameZh
        : targetMember.nameEn
      : 'PI';

    const blockerInfo: BlockerInfo = {
      category,
      details,
      tried: tried.trim() || (language === 'zh' ? '已完成初步推导与验证，但在特定边界条件下无法闭合。' : 'Initial formulation tested but failed under edge condition.'),
      escalatedTo: resolvedName,
      escalatedToId: targetMember?.id,
      reportedAt: new Date().toISOString(),
    };

    reportBlocker(
      activeBlockerTask.id,
      blockerInfo,
      requestVisibility,
      requestVisibility === 'PUBLIC' && notifyChannel
    );
    setActiveBlockerTask(null);
  };

  const handleResolve = () => {
    resolveBlocker(activeBlockerTask.id);
    setActiveBlockerTask(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => setActiveBlockerTask(null)}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 mb-5">
          <div
            className={`p-2.5 rounded-xl border ${
              isAlreadyBlocked
                ? 'bg-red-500/15 border-red-500/40 text-red-600 dark:text-red-400'
                : 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400'
            }`}
          >
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                {activeBlockerTask.projectTag}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'zh' ? activeBlockerTask.leadAuthor.nameZh : activeBlockerTask.leadAuthor.nameEn}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1 leading-snug">
              {isAlreadyBlocked ? t.activeBlockerAlert : t.reportBlocker}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{activeBlockerTask.title}</p>
          </div>
        </div>

        {/* Existing Blocker Status Box if already blocked */}
        {isAlreadyBlocked && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                {language === 'zh'
                  ? BLOCKER_CATEGORIES[activeBlockerTask.blocker!.category]?.labelZh
                  : BLOCKER_CATEGORIES[activeBlockerTask.blocker!.category]?.labelEn}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                {new Date(activeBlockerTask.blocker!.reportedAt).toLocaleDateString()}
              </span>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {t.whereStuck}
              </div>
              <p className="text-xs text-slate-800 dark:text-slate-200 mt-0.5 leading-relaxed bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-red-200 dark:border-slate-800">
                {activeBlockerTask.blocker!.details}
              </p>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {t.whatTried}
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-red-200 dark:border-slate-800">
                {activeBlockerTask.blocker!.tried}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1 text-xs text-slate-700 dark:text-slate-300">
              <UserCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>{t.escalateTo}:</span>
              <span className="font-semibold text-indigo-700 dark:text-indigo-300">
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
                <span>{t.resolveBlocker}</span>
              </button>
            </div>
          </div>
        )}

        {/* Report / Update Blocker Form */}
        <form onSubmit={handleReport} className="space-y-4">
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
            {/* Category Selector */}
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {t.blockerCategory}
            </label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {(Object.keys(BLOCKER_CATEGORIES) as BlockerCategory[]).map((catKey) => {
                const meta = BLOCKER_CATEGORIES[catKey];
                const isSelected = category === catKey;
                const catLabel = language === 'zh' ? meta.labelZh : meta.labelEn;
                const catDesc = language === 'zh' ? meta.descriptionZh : meta.descriptionEn;

                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setCategory(catKey)}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-rose-50 dark:bg-rose-500/15 border-rose-500 text-rose-900 dark:text-rose-200 ring-1 ring-rose-500'
                        : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-200">{catLabel}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate w-full">{catDesc}</span>
                  </button>
                );
              })}
            </div>

            {/* Stuck Description */}
            <div className="space-y-1.5 mb-3">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                {t.whereStuck} *
              </label>
              <textarea
                rows={3}
                required
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={
                  language === 'zh'
                    ? '例如：核心实验重复组方差过大、调研问卷样本失衡，或某关键推导引理仍需反例核验...'
                    : 'e.g. Sample variance across trials exceeds threshold, identification assumption failing robustness test, or instrumentation queue stalled...'
                }
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/40 leading-relaxed"
              />
            </div>

            {/* What has been tried */}
            <div className="space-y-1.5 mb-3">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                {t.whatTried}
              </label>
              <textarea
                rows={2}
                value={tried}
                onChange={(e) => setTried(e.target.value)}
                placeholder={
                  language === 'zh'
                    ? '例如：已核查预处理管线、调整控制变量或复核相关文献参考参数，暂未定位根本原因...'
                    : 'e.g. Checked pre-processing pipeline, ran sensitivity subsets, and cross-checked baseline assumptions...'
                }
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/40 leading-relaxed"
              />
            </div>

            {/* Escalate To (Strictly Single Member) + Request Visibility */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  {t.escalateTo} ({language === 'zh' ? '仅发给 1 位求助人' : '1 person only'})
                </label>
                <select
                  value={escalatedToId}
                  onChange={(e) => setEscalatedToId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-rose-500/60"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {language === 'zh' ? `${m.nameZh} (${m.titleZh})` : `${m.nameEn} (${m.titleEn})`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  {language === 'zh' ? '同步生成 1 对 1 求助可见范围' : 'Linked Request Privacy'}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRequestVisibility('PRIVATE')}
                    className={`flex items-center justify-center gap-1 py-2 px-2 rounded-xl border text-[11px] font-medium transition-colors ${
                      requestVisibility === 'PRIVATE'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-200'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Lock className="w-3 h-3" />
                    <span>{language === 'zh' ? '隐私 · 仅双方' : 'Private'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestVisibility('PUBLIC')}
                    className={`flex items-center justify-center gap-1 py-2 px-2 rounded-xl border text-[11px] font-medium transition-colors ${
                      requestVisibility === 'PUBLIC'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-200'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Globe className="w-3 h-3" />
                    <span>{language === 'zh' ? '组内公开' : 'Public'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {externalChannelsActive && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 px-3 py-2 mb-3 text-[11px]">
              {requestVisibility === 'PUBLIC' ? (
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={notifyChannel}
                    onChange={(e) => setNotifyChannel(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 text-rose-500 focus:ring-rose-500"
                  />
                  <span>
                    {language === 'zh'
                      ? '同时推送卡点求助卡片到已启用的 Teams / Slack 群频道'
                      : 'Also post escalation card to enabled Teams / Slack channel'}
                  </span>
                </label>
              ) : (
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Lock className="w-3.5 h-3.5 shrink-0 text-indigo-500 dark:text-indigo-400" />
                  <span>
                    {language === 'zh'
                      ? '当前求助为「隐私 · 仅双方」，不会推送到 Teams/Slack 公共频道'
                      : 'Private blocker request stays inside LabFlow (not posted to public Teams/Slack channels).'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveBlockerTask(null)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/30 transition-all duration-150"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{isAlreadyBlocked ? t.updateBlocker : t.escalateBlockerBtn}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
