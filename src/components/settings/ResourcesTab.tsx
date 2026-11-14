'use client';

import React, { useState } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import { ResourceType } from '@/types';
import { Cpu, Monitor, Server, Trash2 } from 'lucide-react';

export const ResourcesTab: React.FC = () => {
  const {
    resources,
    addResource,
    deleteResource,
    updateResource,
    enableComputeStrip,
    setEnableComputeStrip,
    language,
    t,
  } = useLabFlow();

  const [newResNameZh, setNewResNameZh] = useState('');
  const [newResType, setNewResType] = useState<ResourceType>('GPU');
  const [newResSpecs, setNewResSpecs] = useState('');

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResNameZh.trim()) return;
    const newId = `res-${Date.now()}`;
    addResource({
      id: newId,
      nameZh: newResNameZh.trim(),
      nameEn: newResNameZh.trim(),
      type: newResType,
      specs: newResSpecs.trim() || 'Shared Lab Instrument / Server',
      status: 'IDLE',
    });
    setNewResNameZh('');
    setNewResSpecs('');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {t.tabResources} ({resources.length})
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {language === 'zh'
            ? '自由增减 GPU 算力节点、计量经济服务器、高性能集群或专业实验设备。'
            : 'Manage GPU clusters, servers, and laboratory scientific instruments.'}
        </p>
      </div>

      <div className="flex items-center justify-between p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
            {language === 'zh'
              ? '在主界面显示公共算力与设施栏'
              : 'Show Compute & Facilities Strip on Main View'}
          </span>
          <span className="text-[11px] text-slate-500 block">
            {language === 'zh'
              ? '若课题组偏重纯理论或人文学科、无需算力监控，可关闭此栏'
              : 'Hide the top compute status strip if your lab does not track GPU/HPC nodes'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setEnableComputeStrip(!enableComputeStrip)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            enableComputeStrip ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              enableComputeStrip ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {resources.map((res) => {
          const isBusy = res.status === 'OCCUPIED';
          const resName = language === 'zh' ? res.nameZh : res.nameEn;

          return (
            <div
              key={res.id}
              className="flex items-center justify-between gap-3 p-3 rounded-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`p-2 rounded-lg border shrink-0 ${
                    res.type === 'GPU'
                      ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30'
                      : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
                  }`}
                >
                  {res.type === 'GPU' ? (
                    <Cpu className="w-4 h-4" />
                  ) : (
                    <Monitor className="w-4 h-4" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                      {resName}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold border ${
                        isBusy
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {isBusy ? t.busyNodes : t.idleNodes}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 truncate block">
                    {res.specs}{' '}
                    {isBusy &&
                      res.currentUser &&
                      `· @${res.currentUser} (${res.remainingHours || 0}h)`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    updateResource(res.id, {
                      status: isBusy ? 'IDLE' : 'OCCUPIED',
                      currentUser: isBusy ? undefined : 'Current User',
                      remainingHours: isBusy ? 0 : 8,
                    })
                  }
                  className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] text-slate-600 dark:text-slate-300 font-medium transition-colors"
                >
                  {isBusy
                    ? language === 'zh'
                      ? '设为空闲'
                      : 'Set Idle'
                    : language === 'zh'
                    ? '设为占用'
                    : 'Set Busy'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(t.deleteResourceConfirm)) {
                      deleteResource(res.id);
                    }
                  }}
                  className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={handleAddResource}
        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs"
      >
        <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          <Server className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          {t.addResource}
        </span>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            required
            value={newResNameZh}
            onChange={(e) => setNewResNameZh(e.target.value)}
            placeholder={
              language === 'zh'
                ? '设施名称 (如 GPU Node-03 / 质谱仪)'
                : 'Facility Name (e.g. GPU Node-03)'
            }
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
          />
          <select
            value={newResType}
            onChange={(e) => setNewResType(e.target.value as ResourceType)}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200"
          >
            <option value="GPU">GPU 深度学习加速节点</option>
            <option value="SERVER">计算/实证服务器 (Server)</option>
            <option value="CLUSTER">高性能计算集群 (HPC Cluster)</option>
            <option value="EQUIPMENT">专业实验仪器设备 (Equipment)</option>
          </select>
        </div>

        <input
          type="text"
          value={newResSpecs}
          onChange={(e) => setNewResSpecs(e.target.value)}
          placeholder="硬件与系统规格描述 (如 8x RTX 4090 24GB, CUDA 12.2)"
          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
        />

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm"
          >
            {language === 'zh' ? '添加并纳入调度' : 'Add Facility'}
          </button>
        </div>
      </form>
    </div>
  );
};
