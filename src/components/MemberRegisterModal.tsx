'use client';

import React, { useState } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import { UserPlus, X, GraduationCap, Mail, Sparkles, Lock, AlertCircle } from 'lucide-react';
import { LabMember } from '@/types';

export const MemberRegisterModal: React.FC = () => {
  const {
    isRegisterModalOpen,
    setIsRegisterModalOpen,
    registerNewMember,
    language,
    t,
  } = useLabFlow();

  const [nameZh, setNameZh] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [role, setRole] = useState<LabMember['role']>('PHD_CANDIDATE');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  if (!isRegisterModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!nameZh.trim() && !nameEn.trim()) return;
    if (pin.trim().length < 4) {
      setError(
        language === 'zh'
          ? '请为新成员设置至少 4 位的个人密码 / PIN'
          : 'Please set a 4+ character PIN'
      );
      return;
    }
    if (pin.trim() !== confirmPin.trim()) {
      setError(language === 'zh' ? '两次输入的密码 / PIN 不一致' : 'PINs do not match');
      return;
    }

    registerNewMember({
      nameZh: nameZh.trim() || nameEn.trim(),
      nameEn: nameEn.trim() || nameZh.trim(),
      role,
      email: email.trim(),
      pin: pin.trim(),
    });

    setNameZh('');
    setNameEn('');
    setEmail('');
    setPin('');
    setConfirmPin('');
    setError('');
    setIsRegisterModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {t.quickRegisterTitle}
              </h3>
              <p className="text-[11px] text-slate-500">{t.quickRegisterDesc}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsRegisterModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                {language === 'zh' ? '中文姓名' : 'Chinese Name'}
              </label>
              <input
                type="text"
                required
                autoFocus
                value={nameZh}
                onChange={(e) => setNameZh(e.target.value)}
                placeholder="如 张三 / 李博"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                {language === 'zh' ? '英文/拼音姓名' : 'English / Pinyin Name'}
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. San Zhang"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-cyan-500" />
              {t.memberRole}
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as LabMember['role'])}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-cyan-500 focus:outline-none"
            >
              <option value="PHD_CANDIDATE">博士研究生 (PhD Candidate)</option>
              <option value="RA">科研助理 / 硕士生 (Research Assistant)</option>
              <option value="SENIOR_PHD">高年级博士生 (Senior PhD)</option>
              <option value="POSTDOC">博士后研究员 (Postdoc Fellow)</option>
              <option value="VISITING_SCHOLAR">访问学者 (Visiting Scholar)</option>
            </select>
            <span className="text-[10px] text-slate-500 block">
              {language === 'zh'
                ? '自主登记默认赋予【组内成员】权限；系统管理员（学生协管）或导师权限由导师在成员设置中委派。'
                : 'Assigned Student / RA access by default. PI can appoint System Admin or elevate permissions.'}
            </span>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-cyan-500" />
              {t.memberEmail}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. yourname@university.edu"
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-500" />
                {language === 'zh' ? '个人密码 / PIN *（4+位）' : 'Personal PIN * (4+)'}
              </label>
              <input
                type="password"
                required
                minLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder={language === 'zh' ? '用于个人账号登录切换' : 'Required 4+ chars'}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                {language === 'zh' ? '确认密码 / PIN *' : 'Confirm PIN *'}
              </label>
              <input
                type="password"
                required
                minLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder={language === 'zh' ? '再次输入 PIN' : 'Confirm PIN'}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 shadow-sm transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{language === 'zh' ? '登记并进入实验室' : 'Join Lab'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
