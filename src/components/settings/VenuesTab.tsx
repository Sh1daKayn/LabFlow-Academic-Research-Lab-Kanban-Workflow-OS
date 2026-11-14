'use client';

import React, { useState } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import { Plus, Trash2 } from 'lucide-react';

export const VenuesTab: React.FC = () => {
  const { venues, addVenue, deleteVenue, currentUserId, members, language, t } = useLabFlow();

  const [newVenueName, setNewVenueName] = useState('');
  const [newVenueTag, setNewVenueTag] = useState('');

  const handleAddVenue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVenueName.trim()) return;
    const vTag = newVenueTag.trim() || newVenueName.trim().split(' ')[0];
    addVenue({
      id: `venue-${Date.now()}`,
      name: newVenueName.trim(),
      tag: vTag,
      defaultLeadId: currentUserId || members[0]?.id || 'member-pi',
      milestones: [
        {
          nameEn: 'Baseline & Empirical Freeze',
          nameZh: '基线锁定与实验评测冻结',
          offsetDays: 45,
          stageId: 'DATA_EXP',
        },
        {
          nameEn: 'Full Manuscript First Draft',
          nameZh: '论文完整初稿撰写完成',
          offsetDays: 30,
          stageId: 'DRAFTING',
        },
        {
          nameEn: 'Advisor Review & Polish',
          nameZh: '提交导师深入审阅把关',
          offsetDays: 14,
          stageId: 'PI_REVIEW',
        },
        {
          nameEn: 'Double-Blind & Formatting Check',
          nameZh: '双盲匿名与排版格式复核',
          offsetDays: 3,
          stageId: 'PI_REVIEW',
        },
      ],
    });
    setNewVenueName('');
    setNewVenueTag('');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {t.customVenues} ({venues.length})
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {language === 'zh'
            ? '在投稿倒排期生成器中可直接选用的顶会与权威期刊库，支持自主添加与管理。'
            : 'Target venues and journal presets for reverse milestone derivation.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
        {venues.map((v) => (
          <div
            key={v.id}
            className="flex items-center justify-between p-3 rounded-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs shadow-sm"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 dark:text-slate-100">{v.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-mono">
                  {v.tag}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {v.milestones.length}{' '}
                {language === 'zh' ? '个预设倒推里程碑步骤' : 'milestone steps'}
              </span>
            </div>

            {venues.length > 1 && (
              <button
                type="button"
                onClick={() => deleteVenue(v.id)}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
                title={language === 'zh' ? '删除该期刊/会议预设' : 'Delete venue preset'}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <form
        onSubmit={handleAddVenue}
        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs"
      >
        <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          {language === 'zh' ? '添加自定义会议或期刊预设' : 'Add Custom Target Venue'}
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="text"
            required
            value={newVenueName}
            onChange={(e) => setNewVenueName(e.target.value)}
            placeholder={
              language === 'zh'
                ? '会议/期刊全称 (如 ICML 2027, Nature Machine Intelligence)'
                : 'Venue Full Name (e.g. ICML 2027)'
            }
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
          />
          <input
            type="text"
            value={newVenueTag}
            onChange={(e) => setNewVenueTag(e.target.value)}
            placeholder={
              language === 'zh' ? "简短代号标签 (如 ICML'27, NMI)" : "Short Tag (e.g. ICML'27)"
            }
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-slate-500">
            {language === 'zh'
              ? '💡 系统将自动为新期刊/会议配置 T-45/T-30/T-14/T-3 标准科研倒排里程碑'
              : '💡 Standard milestones (T-45, T-30, T-14, T-3) will be auto-generated.'}
          </span>
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm shrink-0"
          >
            {language === 'zh' ? '保存到期刊库' : 'Save Venue'}
          </button>
        </div>
      </form>
    </div>
  );
};
