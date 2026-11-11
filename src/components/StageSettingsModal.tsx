'use client';

import React, { useState } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import { StageConfig } from '@/types';
import {
  Settings,
  X,
  Plus,
  Trash2,
  RotateCcw,
  Palette,
  Check,
} from 'lucide-react';

const COLOR_PRESETS = [
  { name: 'Purple', color: 'text-purple-400', badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30', border: 'border-purple-500/30' },
  { name: 'Cyan', color: 'text-cyan-400', badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', border: 'border-cyan-500/30' },
  { name: 'Amber', color: 'text-amber-400', badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30', border: 'border-amber-500/30' },
  { name: 'Blue', color: 'text-blue-400', badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30', border: 'border-blue-500/30' },
  { name: 'Rose', color: 'text-rose-400', badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30', border: 'border-rose-500/30' },
  { name: 'Emerald', color: 'text-emerald-400', badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', border: 'border-emerald-500/30' },
  { name: 'Indigo', color: 'text-indigo-400', badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30', border: 'border-indigo-500/30' },
  { name: 'Orange', color: 'text-orange-400', badgeBg: 'bg-orange-500/10 text-orange-400 border-orange-500/30', border: 'border-orange-500/30' },
];

export const StageSettingsModal: React.FC = () => {
  const {
    isStageSettingsOpen,
    setIsStageSettingsOpen,
    stages,
    addStage,
    updateStage,
    deleteStage,
    restoreDefaultStages,
    language,
    t,
  } = useLabFlow();

  const [newLabelZh, setNewLabelZh] = useState('');
  const [newLabelEn, setNewLabelEn] = useState('');
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);

  if (!isStageSettingsOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelZh.trim() && !newLabelEn.trim()) return;

    const preset = COLOR_PRESETS[selectedColorIdx];
    const id = `STAGE_${Date.now()}`;

    const newStage: StageConfig = {
      id,
      labelZh: newLabelZh.trim() || newLabelEn.trim(),
      labelEn: newLabelEn.trim() || newLabelZh.trim(),
      subTitleZh: '自定义研究工作流阶段',
      subTitleEn: 'Custom pipeline workflow stage',
      color: preset.color,
      badgeBg: preset.badgeBg,
      borderColor: preset.border,
    };

    addStage(newStage);
    setNewLabelZh('');
    setNewLabelEn('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setIsStageSettingsOpen(false)}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 leading-snug">
              {t.settingsTitle}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{t.settingsDesc}</p>
          </div>
        </div>

        {/* Current Stages List */}
        <div className="space-y-2.5 mb-6">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>{language === 'zh' ? '当前已启用的学术阶段' : 'Active Pipeline Stages'}</span>
            <span className="text-[11px] text-slate-500">
              {stages.length} {language === 'zh' ? '个阶段' : 'stages'}
            </span>
          </div>

          <div className="space-y-2">
            {stages.map((stage) => {
              return (
                <div
                  key={stage.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${stage.color.replace('text-', 'bg-')}`} />

                    <div className="flex flex-col flex-1 min-w-0">
                      <input
                        type="text"
                        value={language === 'zh' ? stage.labelZh : stage.labelEn}
                        onChange={(e) => {
                          if (language === 'zh') {
                            updateStage(stage.id, { labelZh: e.target.value });
                          } else {
                            updateStage(stage.id, { labelEn: e.target.value });
                          }
                        }}
                        className="bg-transparent font-semibold text-slate-200 focus:outline-none border-b border-transparent focus:border-cyan-500/60 pb-0.5 text-xs"
                      />
                      <span className="text-[10px] text-slate-500 truncate">
                        ID: {stage.id}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(t.deleteStageConfirm)) {
                          deleteStage(stage.id);
                        }
                      }}
                      className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title={language === 'zh' ? '删除阶段' : 'Delete Stage'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add New Stage Form */}
        <form onSubmit={handleAdd} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-cyan-400" />
              {t.addNewStage}
            </h3>
            <span className="text-[10px] text-slate-500">
              {language === 'zh' ? '自定义你的学科研发流程' : 'Custom workflow column'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                {language === 'zh' ? '中文名称 *' : 'Name (Chinese)'}
              </label>
              <input
                type="text"
                required
                value={newLabelZh}
                onChange={(e) => setNewLabelZh(e.target.value)}
                placeholder={language === 'zh' ? '例如：IRB 伦理审批、专利撰写' : 'e.g. IRB Review'}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                {language === 'zh' ? '英文名称' : 'Name (English) *'}
              </label>
              <input
                type="text"
                value={newLabelEn}
                onChange={(e) => setNewLabelEn(e.target.value)}
                placeholder="e.g. Ethics & IRB Approval"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60"
              />
            </div>
          </div>

          {/* Color preset picker */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1.5 flex items-center gap-1">
              <Palette className="w-3 h-3" />
              {language === 'zh' ? '选择阶段主题色' : 'Select Stage Color'}
            </label>
            <div className="flex gap-2">
              {COLOR_PRESETS.map((p, idx) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => setSelectedColorIdx(idx)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${p.color.replace('text-', 'bg-')} ${
                    selectedColorIdx === idx ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {selectedColorIdx === idx && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-all"
            >
              {language === 'zh' ? '确认添加阶段' : 'Add Stage'}
            </button>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={restoreDefaultStages}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.restoreDefaults}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsStageSettingsOpen(false)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
};
