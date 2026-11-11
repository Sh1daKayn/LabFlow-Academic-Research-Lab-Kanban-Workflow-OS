'use client';

import React, { useState } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import { LabMember } from '@/types';
import {
  Users,
  X,
  Trash2,
  CheckCircle,
  UserPlus,
} from 'lucide-react';

export const MemberManagerModal: React.FC = () => {
  const {
    isMemberManagerOpen,
    setIsMemberManagerOpen,
    members,
    currentUserId,
    setCurrentUserId,
    addMember,
    deleteMember,
    language,
    t,
  } = useLabFlow();

  const [nameZh, setNameZh] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [role, setRole] = useState<LabMember['role']>('PHD_CANDIDATE');
  const [titleZh, setTitleZh] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [email, setEmail] = useState('');

  if (!isMemberManagerOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameZh.trim() && !nameEn.trim()) return;

    const newId = `member-${Date.now()}`;
    const newMember: LabMember = {
      id: newId,
      nameZh: nameZh.trim() || nameEn.trim(),
      nameEn: nameEn.trim() || nameZh.trim(),
      role,
      titleZh: titleZh.trim() || '研究生 / 课题成员',
      titleEn: titleEn.trim() || 'Researcher',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      email: email.trim() || `${newId}@labflow.edu`,
    };

    addMember(newMember);
    setNameZh('');
    setNameEn('');
    setTitleZh('');
    setTitleEn('');
    setEmail('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setIsMemberManagerOpen(false)}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 leading-snug">
              {t.memberManagerTitle}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{t.memberManagerDesc}</p>
          </div>
        </div>

        {/* Members List */}
        <div className="space-y-2.5 mb-6">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>{language === 'zh' ? '全课题组成员列表' : 'Active Lab Members'}</span>
            <span className="text-[11px] text-slate-500">
              {members.length} {language === 'zh' ? '位成员' : 'members'}
            </span>
          </div>

          <div className="space-y-2">
            {members.map((m) => {
              const isCurrent = currentUserId === m.id;
              const displayName = language === 'zh' ? m.nameZh : m.nameEn;
              const displayTitle = language === 'zh' ? m.titleZh : m.titleEn;

              return (
                <div
                  key={m.id}
                  className={`flex items-center justify-between gap-3 p-3 rounded-xl border text-xs transition-all ${
                    isCurrent
                      ? 'bg-cyan-950/30 border-cyan-500/50 shadow-sm'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-cyan-400 shrink-0">
                      {displayName.slice(0, 2)}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 truncate">{displayName}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                          [{m.role}]
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold flex items-center gap-1">
                            <CheckCircle className="w-2.5 h-2.5" />
                            {language === 'zh' ? '我本人 (当前)' : 'Active User'}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 truncate">{displayTitle} · {m.email}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={() => setCurrentUserId(m.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-medium transition-colors"
                      >
                        {t.setAsActiveUser}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(language === 'zh' ? `确认移除 ${displayName} 吗？` : `Remove ${displayName}?`)) {
                          deleteMember(m.id);
                        }
                      }}
                      className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title={language === 'zh' ? '删除成员' : 'Delete Member'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Member Form */}
        <form onSubmit={handleAdd} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-cyan-400" />
              {t.addNewMember}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                {language === 'zh' ? '姓名 (中文) *' : 'Name (Chinese)'}
              </label>
              <input
                type="text"
                required
                value={nameZh}
                onChange={(e) => setNameZh(e.target.value)}
                placeholder="例如：Student 4 / 李同学"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                {language === 'zh' ? '姓名 (英文) *' : 'Name (English) *'}
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Student 4"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                {t.memberRole}
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as LabMember['role'])}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60"
              >
                <option value="PI">{language === 'zh' ? '课题组负责人 / 教授 (PI)' : 'Principal Investigator (PI)'}</option>
                <option value="POSTDOC">{language === 'zh' ? '博士后研究员 (Postdoc)' : 'Postdoctoral Fellow'}</option>
                <option value="SENIOR_PHD">{language === 'zh' ? '高年级博士生 (Senior PhD)' : 'Senior PhD Candidate'}</option>
                <option value="PHD_CANDIDATE">{language === 'zh' ? '博士研究生 (PhD Student)' : 'PhD Student'}</option>
                <option value="RA">{language === 'zh' ? '科研助理 (Research Assistant)' : 'Research Assistant'}</option>
                <option value="VISITING_SCHOLAR">{language === 'zh' ? '访问学者 (Visiting Scholar)' : 'Visiting Scholar'}</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                {t.memberEmail}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@university.edu"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              {t.memberTitle}
            </label>
            <input
              type="text"
              value={titleZh}
              onChange={(e) => setTitleZh(e.target.value)}
              placeholder="例如：博士研究生 (深度强化学习 / 运筹优化)"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md transition-all"
            >
              {language === 'zh' ? '创建并加入课题组' : 'Add Member'}
            </button>
          </div>
        </form>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setIsMemberManagerOpen(false)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
};
