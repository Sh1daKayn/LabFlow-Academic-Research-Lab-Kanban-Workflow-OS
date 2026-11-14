'use client';

import React, { useState } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import { ShieldAlert, KeyRound, X, Lock, CheckCircle2 } from 'lucide-react';

export const AdminPasswordModal: React.FC = () => {
  const {
    isPasswordModalOpen,
    setIsPasswordModalOpen,
    unlockAdmin,
    language,
    t,
  } = useLabFlow();

  const [inputPass, setInputPass] = useState('');
  const [errorMsg, setErrorMsg] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isPasswordModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const success = await unlockAdmin(inputPass);
      if (success) {
        setInputPass('');
        setErrorMsg(false);
      } else {
        setErrorMsg(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setInputPass('');
    setErrorMsg(false);
    setIsPasswordModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {t.enterAdminPassword}
              </h3>
              <p className="text-[11px] text-slate-500">
                {language === 'zh' ? '全局管理鉴权与安全锁' : 'Lab Administrator Passkey Guard'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {t.adminPasswordPrompt}
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
              {t.adminPassword}
            </label>
            <input
              type="password"
              autoFocus
              required
              value={inputPass}
              onChange={(e) => {
                setInputPass(e.target.value);
                if (errorMsg) setErrorMsg(false);
              }}
              placeholder={language === 'zh' ? '默认初始密码为 admin888' : 'Default password: admin888'}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border transition-all focus:outline-none ${
                errorMsg
                  ? 'border-rose-500 ring-2 ring-rose-500/20 text-rose-600'
                  : 'border-slate-300 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100'
              }`}
            />
            {errorMsg && (
              <span className="text-[11px] text-rose-500 font-medium block">
                {t.passwordError}
              </span>
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              {language === 'zh'
                ? '解锁后将在当前浏览器会话保持管理员特权，可在设置中修改密码。'
                : 'Session stays unlocked until you lock it or close the tab.'}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {isSubmitting
                  ? language === 'zh'
                    ? '验证中...'
                    : 'Verifying...'
                  : language === 'zh'
                  ? '验证并解锁'
                  : 'Verify & Unlock'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
