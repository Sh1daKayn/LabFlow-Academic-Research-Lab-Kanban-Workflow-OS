'use client';

import React, { useMemo, useState } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import { UserPlus, X, GraduationCap, Mail, Sparkles, Lock, AlertCircle, UserCheck } from 'lucide-react';
import { LabMember } from '@/types';
import { findMatchingMembersByName } from '@/utils/memberWorkload';
import { getMemberDisplayName } from '@/utils/avatar';
import { MemberAvatar } from '@/components/MemberAvatar';

export const MemberRegisterModal: React.FC = () => {
  const {
    members,
    isRegisterModalOpen,
    setIsRegisterModalOpen,
    registerNewMember,
    setCurrentUserId,
    language,
    t,
  } = useLabFlow();

  const [nameZh, setNameZh] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [role, setRole] = useState<LabMember['role']>('PHD_CANDIDATE');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [confirmDuplicate, setConfirmDuplicate] = useState(false);
  const [error, setError] = useState('');

  const matchingMembers = useMemo(
    () =>
      findMatchingMembersByName(
        members,
        language === 'zh' ? nameZh || nameEn : nameEn || nameZh,
        language === 'zh' ? nameEn : nameZh
      ),
    [members, nameZh, nameEn, language]
  );

  if (!isRegisterModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!nameZh.trim() && !nameEn.trim()) return;
    if (matchingMembers.length > 0 && !confirmDuplicate) {
      setError(
        language === 'zh'
          ? '检测到已有同名成员，可直接点击下方切换使用，或勾选“确为不同成员”。'
          : 'A profile with this name already exists. Claim it below or confirm creating a separate profile.'
      );
      return;
    }
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
    setConfirmDuplicate(false);
    setError('');
    setIsRegisterModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
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
          {language === 'zh' ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  中文姓名 *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={nameZh}
                  onChange={(e) => setNameZh(e.target.value)}
                  placeholder="如 张三 / 李博"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  英文/拼音姓名
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. San Zhang"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Full Name *
              </label>
              <input
                type="text"
                required
                autoFocus
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
              {t.memberRole}
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as LabMember['role'])}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 focus:outline-none"
            >
              <option value="PHD_CANDIDATE">
                {language === 'zh' ? '博士研究生 (PhD Candidate)' : 'PhD Candidate'}
              </option>
              <option value="RA">
                {language === 'zh' ? '科研助理 / 硕士生 (Research Assistant)' : 'Research Assistant / MS'}
              </option>
              <option value="SENIOR_PHD">
                {language === 'zh' ? '高年级博士生 (Senior PhD)' : 'Senior PhD Candidate'}
              </option>
              <option value="POSTDOC">
                {language === 'zh' ? '博士后研究员 (Postdoc Fellow)' : 'Postdoctoral Fellow'}
              </option>
              <option value="VISITING_SCHOLAR">
                {language === 'zh' ? '访问学者 (Visiting Scholar)' : 'Visiting Scholar'}
              </option>
            </select>
            <span className="text-[10px] text-slate-500 block">
              {language === 'zh'
                ? '自主登记默认赋予【组内成员】权限；系统管理员（学生协管）或导师权限由导师在成员设置中委派。'
                : 'Assigned Student / RA access by default. PI can appoint System Admin or elevate permissions.'}
            </span>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-indigo-500" />
              {t.memberEmail}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. yourname@university.edu"
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-500" />
                {language === 'zh' ? '个人密码 / PIN *（4+位）' : 'Personal PIN * (4+)'}
              </label>
              <input
                type="password"
                required
                minLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder={language === 'zh' ? '用于个人账号登录切换' : 'Required 4+ chars'}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 focus:outline-none"
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
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {matchingMembers.length > 0 && (
            <div className="rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50/90 dark:bg-amber-950/35 p-2.5 space-y-1.5">
              <div className="text-[11px] font-semibold text-amber-900 dark:text-amber-200">
                {language === 'zh'
                  ? '发现同名账号，可直接切换避免重复：'
                  : 'Existing account matches this name:'}
              </div>
              {matchingMembers.map((existing) => (
                <div
                  key={existing.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-white dark:bg-slate-900 px-2 py-1 border border-amber-200 dark:border-amber-800/40 text-xs"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MemberAvatar member={existing} size="xs" />
                    <span className="truncate font-medium">
                      {getMemberDisplayName(existing, language, existing.id)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentUserId(existing.id);
                      setIsRegisterModalOpen(false);
                    }}
                    className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-semibold shrink-0 flex items-center gap-1"
                  >
                    <UserCheck className="w-3 h-3" />
                    <span>{language === 'zh' ? '切换使用' : 'Switch'}</span>
                  </button>
                </div>
              ))}
              <label className="flex items-center gap-1.5 text-[11px] text-amber-800 dark:text-amber-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmDuplicate}
                  onChange={(e) => setConfirmDuplicate(e.target.checked)}
                />
                <span>
                  {language === 'zh'
                    ? '确为同名不同成员，继续建新号'
                    : 'Different person — create anyway'}
                </span>
              </label>
            </div>
          )}

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
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-all flex items-center gap-1.5"
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
