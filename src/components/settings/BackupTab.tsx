'use client';

import React, { useRef, useState } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import {
  AlertTriangle,
  Database,
  Download,
  KeyRound,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';

export const BackupTab: React.FC = () => {
  const {
    setIsSettingsOpen,
    setIsAIImportOpen,
    exportDataBackup,
    importDataBackup,
    updateAdminPassword,
    resetToMockData,
    cleanSlateWipe,
    storageMode,
    syncStatus,
    lastSyncError,
    lastSyncedAt,
    retryServerSync,
    effectiveIsAdmin,
    language,
    t,
  } = useLabFlow();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newAdminPass, setNewAdminPass] = useState('');
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);
  const [isRetryingSync, setIsRetryingSync] = useState(false);

  const handleRetrySync = async () => {
    if (isRetryingSync) return;
    setIsRetryingSync(true);
    try {
      await retryServerSync();
    } finally {
      setIsRetryingSync(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importDataBackup(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleUpdatePassword = async () => {
    if (!newAdminPass.trim() || isUpdatingPass) return;
    setIsUpdatingPass(true);
    try {
      const ok = await updateAdminPassword(newAdminPass.trim());
      if (ok) {
        setNewAdminPass('');
      }
    } finally {
      setIsUpdatingPass(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {t.tabBackup}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {language === 'zh'
            ? '完整导出或恢复您的课题组全量数据（包含全部任务、课题、成员、算力与自定义阶段）。'
            : 'Export and restore complete JSON snapshot of all lab data and state.'}
        </p>
      </div>

      {/* Live Backend Persistence Status */}
      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-lg border ${
                syncStatus === 'offline'
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              }`}
            >
              <Database className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                {language === 'zh' ? '服务端持久化引擎' : 'Server Persistence Engine'}
              </span>
              <span className="text-[11px] text-slate-500 block">
                {storageMode === 'postgres'
                  ? language === 'zh'
                    ? 'PostgreSQL 服务器数据库 (Prisma ORM · 支持跨设备/云端多人协作)'
                    : 'PostgreSQL Server DB (Prisma ORM · Cloud & Multi-User Ready)'
                  : language === 'zh'
                  ? '本机服务端文件存储 (.data/labflow-state.json · 仅保存在当前运行服务的主机上)'
                  : 'Host Local Server Store (.data/labflow-state.json · Saved on host running Next.js)'}
              </span>
              {lastSyncedAt && (
                <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                  {language === 'zh' ? '最近同步: ' : 'Last synced: '}
                  {new Date(lastSyncedAt).toLocaleString()}
                </span>
              )}
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${
              syncStatus === 'offline'
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
            }`}
          >
            {syncStatus === 'syncing'
              ? language === 'zh'
                ? '同步中...'
                : 'Syncing...'
              : syncStatus === 'offline'
              ? language === 'zh'
                ? '仅本机浏览器缓存'
                : 'Browser Cache Only'
              : language === 'zh'
              ? '已实时同步'
              : 'Synced'}
          </span>
        </div>

        {syncStatus === 'offline' && (
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-start gap-2 text-[11px] text-rose-700 dark:text-rose-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {lastSyncError ||
                  (language === 'zh'
                    ? '当前更改仅保存在本机浏览器缓存中，尚未写入服务器。'
                    : 'Edits are stored only in browser cache and have not been saved to the server.')}
              </span>
            </div>
            <button
              type="button"
              onClick={handleRetrySync}
              disabled={isRetryingSync}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-[11px] font-bold flex items-center gap-1.5 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetryingSync ? 'animate-spin' : ''}`} />
              <span>{language === 'zh' ? '立即重试同步' : 'Retry Sync'}</span>
            </button>
          </div>
        )}

        {storageMode === 'local-file' && (
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            {language === 'zh' ? (
              <>
                <strong className="text-cyan-700 dark:text-cyan-300">关于服务器保存说明：</strong>
                当前未检测到 <code className="font-mono bg-slate-200/70 dark:bg-slate-800 px-1 rounded">DATABASE_URL</code>，数据保存在运行 Next.js 的本机文件 <code className="font-mono bg-slate-200/70 dark:bg-slate-800 px-1 rounded">.data/labflow-state.json</code>（不会推送到 GitHub）。如需部署到云端或跨电脑协作，请在 <code className="font-mono bg-slate-200/70 dark:bg-slate-800 px-1 rounded">.env</code> 中配置 PostgreSQL（如 Neon/Supabase 或运行 <code className="font-mono bg-slate-200/70 dark:bg-slate-800 px-1 rounded">docker compose up -d</code>）；同局域网共享本机数据可使用 <code className="font-mono bg-slate-200/70 dark:bg-slate-800 px-1 rounded">npm run dev:lan</code>。
              </>
            ) : (
              <>
                <strong className="text-cyan-700 dark:text-cyan-300">Host vs Remote Server Note:</strong>{' '}
                <code className="font-mono bg-slate-200/70 dark:bg-slate-800 px-1 rounded">DATABASE_URL</code> is not set, so edits persist to <code className="font-mono bg-slate-200/70 dark:bg-slate-800 px-1 rounded">.data/labflow-state.json</code> on this host machine (not synced to GitHub). Set PostgreSQL <code className="font-mono bg-slate-200/70 dark:bg-slate-800 px-1 rounded">DATABASE_URL</code> in <code className="font-mono bg-slate-200/70 dark:bg-slate-800 px-1 rounded">.env</code> (or run <code className="font-mono bg-slate-200/70 dark:bg-slate-800 px-1 rounded">docker compose up -d</code>) for cloud/remote server persistence, or use <code className="font-mono bg-slate-200/70 dark:bg-slate-800 px-1 rounded">npm run dev:lan</code> for LAN sharing.
              </>
            )}
          </div>
        )}
      </div>

      {/* AI Smart Document Importer Fast Track */}
      <div className="p-4 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-transparent flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
              {t.aiImportTitle}
            </span>
            <span className="text-[10px] text-slate-500 block">{t.aiImportDesc}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsSettingsOpen(false);
            setIsAIImportOpen(true);
          }}
          className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-sm shrink-0"
        >
          {language === 'zh' ? '打开 AI 导入' : 'Open AI Importer'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
        <button
          type="button"
          onClick={exportDataBackup}
          className="flex items-center gap-3 p-4 rounded-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-left transition-all group"
        >
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 group-hover:bg-indigo-500/20">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold block">{t.exportBackup}</span>
            <span className="text-[10px] text-slate-500">
              {language === 'zh' ? '下载当前全部数据 JSON' : 'Download full state JSON'}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-3 p-4 rounded-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-left transition-all group"
        >
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 group-hover:bg-cyan-500/20">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold block">{t.importBackup}</span>
            <span className="text-[10px] text-slate-500">
              {language === 'zh' ? '选择文件导入并覆盖' : 'Select JSON file to restore'}
            </span>
          </div>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".json"
          className="hidden"
        />
      </div>

      {/* Admin Password Setting (PI Exclusive) */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {t.changeAdminPassword}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              {effectiveIsAdmin
                ? language === 'zh'
                  ? '服务端哈希加密保护'
                  : 'Server Hashed (scrypt)'
                : language === 'zh'
                ? '👑 仅导师最高权限可修改'
                : '👑 PI Exclusive'}
            </span>
          </div>
          <div className="flex items-center gap-2 max-w-md">
            <input
              type="password"
              disabled={!effectiveIsAdmin}
              value={newAdminPass}
              onChange={(e) => setNewAdminPass(e.target.value)}
              placeholder={
                language === 'zh'
                  ? '输入新密码（至少4位，默认: admin888）'
                  : 'New password (min 4 chars)'
              }
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            />
            <button
              type="button"
              disabled={!effectiveIsAdmin || isUpdatingPass || newAdminPass.trim().length < 4}
              onClick={handleUpdatePassword}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold shrink-0"
            >
              {isUpdatingPass ? (language === 'zh' ? '保存中...' : 'Saving...') : t.save}
            </button>
          </div>
        </div>
      </div>

      {/* Reset to Mock (PI Exclusive) */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              {t.resetDemo}
            </span>
            <span className="text-[10px] text-slate-500">
              {language === 'zh'
                ? '恢复初始的国际高水平论文、阶段及卡点示例数据（仅导师最高权限可执行）'
                : 'Restore default sample papers, pipelines, and blocker mock state (PI exclusive)'}
            </span>
          </div>
          <button
            type="button"
            disabled={!effectiveIsAdmin}
            onClick={resetToMockData}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-45 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.resetDemo}</span>
          </button>
        </div>
      </div>

      {/* Clean Slate Wipe (PI Exclusive) */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
          <div>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block">
              {language === 'zh'
                ? '一键初始化空白实验室'
                : 'Clean Slate (Wipe All to Blank)'}
            </span>
            <span className="text-[10px] text-slate-500">
              {language === 'zh'
                ? '清空全部任务、项目、算力与预设人员（仅导师最高权限解锁后可执行）'
                : 'Wipe all tasks, projects, resources, and members (PI exclusive)'}
            </span>
          </div>
          <button
            type="button"
            disabled={!effectiveIsAdmin}
            onClick={() => {
              if (
                confirm(
                  language === 'zh'
                    ? '确定要清空所有数据并从零初始化吗？此操作将删除所有现有任务和人员！'
                    : 'Wipe all data and start completely fresh? This cannot be undone!'
                )
              ) {
                cleanSlateWipe();
              }
            }}
            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-45 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{language === 'zh' ? '清空并初始化' : 'Wipe & Initialize'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
