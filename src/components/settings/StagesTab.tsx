'use client';

import React, { useState } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import { Plus, RotateCcw, Trash2 } from 'lucide-react';

export const StagesTab: React.FC = () => {
  const { stages, addStage, deleteStage, restoreDefaultStages, language, t } = useLabFlow();

  const [newStageNameZh, setNewStageNameZh] = useState('');
  const [newStageNameEn, setNewStageNameEn] = useState('');

  const handleAddStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageNameZh.trim() && !newStageNameEn.trim()) return;
    const newId = `STAGE_${Date.now()}`;
    addStage({
      id: newId,
      labelZh: newStageNameZh.trim() || newStageNameEn.trim(),
      labelEn: newStageNameEn.trim() || newStageNameZh.trim(),
      color: 'text-indigo-400',
      badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      borderColor: 'border-indigo-500/30',
    });
    setNewStageNameZh('');
    setNewStageNameEn('');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {t.settingsTitle} ({stages.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{t.settingsDesc}</p>
        </div>
        <button
          type="button"
          onClick={restoreDefaultStages}
          className="text-[11px] font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          <span>{t.restoreDefaults}</span>
        </button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {stages.map((st, idx) => {
          const stName = language === 'zh' ? st.labelZh : st.labelEn;
          return (
            <div
              key={st.id}
              className="flex items-center justify-between gap-3 p-2.5 rounded-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-slate-400">#{idx + 1}</span>
                <div className={`w-2.5 h-2.5 rounded-full ${st.color.replace('text-', 'bg-')}`} />
                <span className="font-bold text-slate-800 dark:text-slate-200">{stName}</span>
              </div>

              {stages.length > 3 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(t.deleteStageConfirm)) {
                      deleteStage(st.id);
                    }
                  }}
                  className="p-1 text-slate-400 hover:text-rose-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <form
        onSubmit={handleAddStage}
        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs"
      >
        <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          {t.addNewStage}
        </span>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            required
            value={newStageNameZh}
            onChange={(e) => setNewStageNameZh(e.target.value)}
            placeholder="阶段中文名称 (如 伦理审查/IRB)"
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
          />
          <input
            type="text"
            value={newStageNameEn}
            onChange={(e) => setNewStageNameEn(e.target.value)}
            placeholder="Stage Name (English)"
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
          />
        </div>
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm"
          >
            {t.addNewStage}
          </button>
        </div>
      </form>
    </div>
  );
};
