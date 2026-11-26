'use client';

import React, { useMemo, useState } from 'react';
import {
  FlaskConical,
  UserPlus,
  LogIn,
  Lock,
  Globe,
  Check,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  LayoutGrid,
  UserCheck,
} from 'lucide-react';
import { useLabFlow } from '@/context/LabFlowContext';
import { LabMember, ViewMode } from '@/types';
import { getMemberDisplayName } from '@/utils/avatar';
import { hasMemberPin } from '@/utils/pin';
import { findMatchingMembersByName } from '@/utils/memberWorkload';
import { MemberAvatar } from '@/components/MemberAvatar';
import {
  ALL_VIEW_MODES,
  DEFAULT_STUDENT_VIEWS,
  VIEW_META,
  sanitizePreferredViews,
} from '@/utils/viewPreferences';

const STUDENT_ROLE_OPTIONS: {
  id: LabMember['role'];
  labelZh: string;
  labelEn: string;
}[] = [
  { id: 'PHD_CANDIDATE', labelZh: '博士生 / PhD', labelEn: 'PhD Candidate' },
  { id: 'RA', labelZh: '硕士生 / 研究助理', labelEn: 'Master / RA' },
  { id: 'SENIOR_PHD', labelZh: '高年级博士 / Lead', labelEn: 'Senior PhD' },
  { id: 'POSTDOC', labelZh: '博士后 / Postdoc', labelEn: 'Postdoc' },
  { id: 'VISITING_SCHOLAR', labelZh: '访问学者 / Visiting', labelEn: 'Visiting Scholar' },
];

export const AccountGate: React.FC = () => {
  const {
    members,
    registerNewMember,
    loginAsMember,
    language,
    setLanguage,
    t,
  } = useLabFlow();

  const isZh = language === 'zh';
  const [mode, setMode] = useState<'register' | 'login'>('register');

  // --- Register Form State ---
  const [nameZh, setNameZh] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [role, setRole] = useState<LabMember['role']>('PHD_CANDIDATE');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showRegPin, setShowRegPin] = useState(false);
  const [preferredViews, setPreferredViews] = useState<ViewMode[]>(DEFAULT_STUDENT_VIEWS);
  const [defaultView, setDefaultView] = useState<ViewMode>(DEFAULT_STUDENT_VIEWS[0]);
  const [regError, setRegError] = useState('');
  const [confirmDifferentPerson, setConfirmDifferentPerson] = useState(false);

  const matchingExistingMembers = useMemo(() => {
    const primary = isZh ? nameZh || nameEn : nameEn || nameZh;
    const alt = isZh ? nameEn : nameZh;
    return findMatchingMembersByName(members, primary, alt);
  }, [members, nameZh, nameEn, isZh]);

  // --- Login Form State ---
  const defaultLoginId = useMemo(
    () => members.find((m) => m.role !== 'PI')?.id || members[0]?.id || '',
    [members]
  );
  const [selectedMemberId, setSelectedMemberId] = useState<string>(defaultLoginId);
  const [loginPin, setLoginPin] = useState('');
  const [loginBindPin, setLoginBindPin] = useState('');
  const [loginBindConfirmPin, setLoginBindConfirmPin] = useState('');
  const [showLoginPin, setShowLoginPin] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedMember = useMemo(
    () => members.find((m) => m.id === selectedMemberId) || members[0] || null,
    [members, selectedMemberId]
  );

  const needsInitialPinBind =
    selectedMember && selectedMember.accessRole !== 'ADMIN_PI'
      ? !hasMemberPin(selectedMember)
      : false;

  const togglePreferredView = (view: ViewMode) => {
    setPreferredViews((prev) => {
      const exists = prev.includes(view);
      if (exists && prev.length === 1) {
        return prev; // Keep at least one view
      }
      const next = exists ? prev.filter((v) => v !== view) : [...prev, view];
      const sanitized = sanitizePreferredViews(next);
      if (!sanitized.includes(defaultView)) {
        setDefaultView(sanitized[0]);
      }
      return sanitized;
    });
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    const trimmedZh = nameZh.trim();
    const trimmedEn = nameEn.trim();
    const resolvedPrimary = isZh ? trimmedZh || trimmedEn : trimmedEn || trimmedZh;
    if (!resolvedPrimary) {
      setRegError(isZh ? '请输入你的姓名' : 'Please enter your full name');
      return;
    }
    if (matchingExistingMembers.length > 0 && !confirmDifferentPerson) {
      setRegError(
        isZh
          ? '检测到重名账户，请先在下方直接认领登录；确属同名不同人请勾选确认。'
          : 'An account with this name already exists. Claim it below or confirm registering a distinct profile.'
      );
      return;
    }
    if (pin.trim().length < 4) {
      setRegError(
        isZh ? '请设置至少 4 位的个人密码 / PIN' : 'Please set a personal PIN of at least 4 characters'
      );
      return;
    }
    if (pin.trim() !== confirmPin.trim()) {
      setRegError(isZh ? '两次输入的密码 / PIN 不一致' : 'PINs do not match');
      return;
    }

    const sanitizedViews = sanitizePreferredViews(preferredViews);
    const resolvedDefault = sanitizedViews.includes(defaultView)
      ? defaultView
      : sanitizedViews[0];

    registerNewMember({
      nameZh: isZh ? trimmedZh || trimmedEn : resolvedPrimary,
      nameEn: isZh ? trimmedEn || trimmedZh : resolvedPrimary,
      role,
      email: email.trim(),
      pin: pin.trim(),
      preferredViews: sanitizedViews,
      defaultView: resolvedDefault,
    });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setLoginError('');

    if (needsInitialPinBind) {
      if (loginBindPin.trim().length < 4) {
        setLoginError(
          isZh ? '首次登录请设置至少 4 位个人密码 / PIN' : 'Please set a personal PIN (4+ chars)'
        );
        return;
      }
      if (loginBindPin.trim() !== loginBindConfirmPin.trim()) {
        setLoginError(isZh ? '两次输入的密码 / PIN 不一致' : 'PINs do not match');
        return;
      }
      setIsSubmitting(true);
      try {
        const result = await loginAsMember(
          selectedMember.id,
          loginBindPin.trim(),
          loginBindPin.trim()
        );
        if (!result.ok) {
          setLoginError(
            result.error || (isZh ? '登录失败，请重试' : 'Sign in failed, please retry')
          );
        }
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!loginPin.trim()) {
      setLoginError(isZh ? '请输入你的个人密码 / PIN' : 'Please enter your PIN or password');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await loginAsMember(selectedMember.id, loginPin.trim());
      if (!result.ok) {
        setLoginError(
          result.error || (isZh ? '密码或 PIN 不正确' : 'Incorrect PIN or password')
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-8 text-slate-900 dark:text-slate-100">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
        {/* Top Brand Header */}
        <div className="px-6 pt-6 pb-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-indigo-600 shadow-sm text-white shrink-0">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
                Lab<span className="text-indigo-600 dark:text-indigo-400 font-extrabold">Flow</span>
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wide mt-0.5">
                {t.labTitle}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setLanguage(isZh ? 'en' : 'zh')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isZh ? 'Switch to English' : '切换为中文'}
          >
            <Globe className="w-3.5 h-3.5" />
            {isZh ? 'EN' : '中文'}
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setLoginError('');
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === 'register'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              {isZh ? '创建个人账户' : 'Create Account'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setRegError('');
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === 'login'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              {isZh ? '已有账户登录' : 'Sign In'}
            </button>
          </div>
        </div>

        {/* Registration Form */}
        {mode === 'register' ? (
          <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
            <div className="rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/50 px-3.5 py-2.5 flex items-start gap-2.5 text-xs text-indigo-800 dark:text-indigo-200">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600 dark:text-indigo-400" />
              <span>
                {isZh
                  ? '登录后默认进入「仅看我的」专注视图，只展示你自己的任务、项目和 1 对 1 沟通，减少干扰。'
                  : 'Starts in "My Workspace" isolation mode—showing only your tasks, projects, and 1-on-1 requests.'}
              </span>
            </div>

            {matchingExistingMembers.length > 0 && (
              <div className="rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50/90 dark:bg-amber-950/35 p-3 space-y-2">
                <div className="flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div className="space-y-1">
                    <div className="font-semibold">
                      {isZh
                        ? '系统中已存在同名账号，可直接认领登录避免重复建号：'
                        : 'An existing profile matches this name. Claim it to avoid duplicates:'}
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {matchingExistingMembers.map((existing) => (
                    <div
                      key={existing.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/50 px-2.5 py-1.5 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <MemberAvatar member={existing} size="xs" />
                        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {getMemberDisplayName(existing, language, existing.id)}
                        </span>
                        <span className="text-[10px] text-slate-500">[{existing.role}]</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMemberId(existing.id);
                          setMode('login');
                          setRegError('');
                          setLoginError('');
                        }}
                        className="px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold shrink-0 flex items-center gap-1"
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>{isZh ? '认领登录' : 'Claim & Sign In'}</span>
                      </button>
                    </div>
                  ))}
                </div>
                <label className="flex items-center gap-2 text-[11px] text-amber-800 dark:text-amber-300 cursor-pointer pt-0.5">
                  <input
                    type="checkbox"
                    checked={confirmDifferentPerson}
                    onChange={(e) => setConfirmDifferentPerson(e.target.checked)}
                    className="rounded border-amber-400 text-indigo-600"
                  />
                  <span>
                    {isZh
                      ? '我是另一位同名成员，确认注册全新独立账号'
                      : 'I am a different person with the same name; create a separate account'}
                  </span>
                </label>
              </div>
            )}

            {isZh ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    姓名 *
                  </label>
                  <input
                    type="text"
                    required
                    value={nameZh}
                    onChange={(e) => setNameZh(e.target.value)}
                    placeholder="例如：张明"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    英文名 / 拼音（可选）
                  </label>
                  <input
                    type="text"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g. Ming Zhang"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {matchingExistingMembers.length > 0 && (
              <div className="rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50/90 dark:bg-amber-950/35 p-3 space-y-2">
                <div className="flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div className="space-y-1">
                    <div className="font-semibold">
                      {isZh
                        ? '系统中已存在同名账号，可直接认领登录避免重复建号：'
                        : 'An existing profile matches this name. Claim it to avoid duplicates:'}
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {matchingExistingMembers.map((existing) => (
                    <div
                      key={existing.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/50 px-2.5 py-1.5 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <MemberAvatar member={existing} size="xs" />
                        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {getMemberDisplayName(existing, language, existing.id)}
                        </span>
                        <span className="text-[10px] text-slate-500">[{existing.role}]</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMemberId(existing.id);
                          setMode('login');
                          setRegError('');
                          setLoginError('');
                        }}
                        className="px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold shrink-0 flex items-center gap-1"
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>{isZh ? '认领登录' : 'Claim & Sign In'}</span>
                      </button>
                    </div>
                  ))}
                </div>
                <label className="flex items-center gap-2 text-[11px] text-amber-800 dark:text-amber-300 cursor-pointer pt-0.5">
                  <input
                    type="checkbox"
                    checked={confirmDifferentPerson}
                    onChange={(e) => setConfirmDifferentPerson(e.target.checked)}
                    className="rounded border-amber-400 text-indigo-600"
                  />
                  <span>
                    {isZh
                      ? '我是另一位同名成员，确认注册全新独立账号'
                      : 'I am a different person with the same name; create a separate account'}
                  </span>
                </label>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  {isZh ? '身份角色' : 'Academic Role'}
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as LabMember['role'])}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                >
                  {STUDENT_ROLE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {isZh ? opt.labelZh : opt.labelEn}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  {isZh ? '邮箱（可选）' : 'Email (Optional)'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@lab.edu"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Required Personal PIN */}
            {matchingExistingMembers.length > 0 && (
              <div className="rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50/90 dark:bg-amber-950/35 p-3 space-y-2">
                <div className="flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div className="space-y-1">
                    <div className="font-semibold">
                      {isZh
                        ? '系统中已存在同名账号，可直接认领登录避免重复建号：'
                        : 'An existing profile matches this name. Claim it to avoid duplicates:'}
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {matchingExistingMembers.map((existing) => (
                    <div
                      key={existing.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/50 px-2.5 py-1.5 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <MemberAvatar member={existing} size="xs" />
                        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {getMemberDisplayName(existing, language, existing.id)}
                        </span>
                        <span className="text-[10px] text-slate-500">[{existing.role}]</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMemberId(existing.id);
                          setMode('login');
                          setRegError('');
                          setLoginError('');
                        }}
                        className="px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold shrink-0 flex items-center gap-1"
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>{isZh ? '认领登录' : 'Claim & Sign In'}</span>
                      </button>
                    </div>
                  ))}
                </div>
                <label className="flex items-center gap-2 text-[11px] text-amber-800 dark:text-amber-300 cursor-pointer pt-0.5">
                  <input
                    type="checkbox"
                    checked={confirmDifferentPerson}
                    onChange={(e) => setConfirmDifferentPerson(e.target.checked)}
                    className="rounded border-amber-400 text-indigo-600"
                  />
                  <span>
                    {isZh
                      ? '我是另一位同名成员，确认注册全新独立账号'
                      : 'I am a different person with the same name; create a separate account'}
                  </span>
                </label>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  {isZh ? '设置个人密码 / PIN *（至少 4 位）' : 'Personal PIN / Password * (4+ chars)'}
                </label>
                <div className="relative">
                  <input
                    type={showRegPin ? 'text' : 'password'}
                    required
                    minLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder={isZh ? '用于切换与保护个人数据' : 'Protects your account'}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 pr-9 text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPin((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    tabIndex={-1}
                  >
                    {showRegPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  {isZh ? '确认密码 / PIN *' : 'Confirm PIN *'}
                </label>
                <input
                  type={showRegPin ? 'text' : 'password'}
                  required
                  minLength={4}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder={isZh ? '再次输入 PIN' : 'Re-enter PIN'}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Customizable Initial Views */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <LayoutGrid className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  {isZh ? '自定义保留的初始导航视图' : 'Customize Initial Views'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isZh ? '未勾选可在「更多视图」找到' : 'Unpinned views live under More'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ALL_VIEW_MODES.map((view) => {
                  const selected = preferredViews.includes(view);
                  const meta = VIEW_META[view];
                  return (
                    <button
                      key={view}
                      type="button"
                      onClick={() => togglePreferredView(view)}
                      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-left text-xs transition-colors ${
                        selected
                          ? 'border-indigo-500/70 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 font-medium'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                          selected
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {selected && <Check className="w-3 h-3" />}
                      </span>
                      <span className="truncate">{isZh ? meta.labelZh : meta.labelEn}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {isZh ? '登录后默认打开：' : 'Default landing view:'}
                </span>
                <select
                  value={defaultView}
                  onChange={(e) => setDefaultView(e.target.value as ViewMode)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200"
                >
                  {preferredViews.map((v) => (
                    <option key={v} value={v}>
                      {isZh ? VIEW_META[v].labelZh : VIEW_META[v].labelEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {regError && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {isZh ? '创建账户并进入个人工作台' : 'Create Account & Enter Workspace'}
            </button>
          </form>
        ) : (
          /* Sign In Form */
          <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                {isZh ? '选择你的账户' : 'Select Your Account'}
              </label>
              <select
                value={selectedMember?.id || ''}
                onChange={(e) => {
                  setSelectedMemberId(e.target.value);
                  setLoginError('');
                  setLoginPin('');
                  setLoginBindPin('');
                  setLoginBindConfirmPin('');
                }}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {getMemberDisplayName(m, language, m.id)}
                  </option>
                ))}
              </select>
            </div>

            {selectedMember && needsInitialPinBind ? (
              <div className="space-y-3 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/60 dark:bg-amber-950/30 p-3.5">
                <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                  {isZh
                    ? '该预置账户尚未设置个人密码 / PIN，请先绑定一个至少 4 位的个人 PIN，之后登录和切换账户都将使用此 PIN 验证。'
                    : 'This existing profile has no personal PIN yet. Set a 4+ character PIN to claim and protect it.'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={loginBindPin}
                    onChange={(e) => setLoginBindPin(e.target.value)}
                    placeholder={isZh ? '设置 4 位以上 PIN' : 'Set 4+ char PIN'}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={loginBindConfirmPin}
                    onChange={(e) => setLoginBindConfirmPin(e.target.value)}
                    placeholder={isZh ? '确认 PIN' : 'Confirm PIN'}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  {selectedMember?.accessRole === 'ADMIN_PI'
                    ? isZh
                      ? '输入 PI 管理员密码'
                      : 'Enter Admin PI Password'
                    : isZh
                      ? '输入个人密码 / PIN'
                      : 'Enter Personal PIN / Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showLoginPin ? 'text' : 'password'}
                    value={loginPin}
                    onChange={(e) => setLoginPin(e.target.value)}
                    placeholder={
                      selectedMember?.accessRole === 'ADMIN_PI'
                        ? isZh
                          ? '管理员密码'
                          : 'Admin password'
                        : isZh
                          ? '输入你注册时设置的 PIN'
                          : 'Enter your personal PIN'
                    }
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPin((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    tabIndex={-1}
                  >
                    {showLoginPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {loginError && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !selectedMember}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              {isSubmitting
                ? isZh
                  ? '验证中...'
                  : 'Verifying...'
                : isZh
                  ? '登录工作台'
                  : 'Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
