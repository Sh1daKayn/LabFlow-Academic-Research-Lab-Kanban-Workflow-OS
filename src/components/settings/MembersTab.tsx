'use client';

import React, { useState } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import { AccessRole, LabMember } from '@/types';
import { generateInitialsAvatar } from '@/utils/avatar';
import { deriveAccessRole } from '@/utils/rbac';
import { CheckCircle, Trash2, UserPlus } from 'lucide-react';

export const MembersTab: React.FC = () => {
  const {
    members,
    currentUserId,
    setCurrentUserId,
    addMember,
    updateMember,
    deleteMember,
    language,
    t,
  } = useLabFlow();

  const [newMemberNameZh, setNewMemberNameZh] = useState('');
  const [newMemberNameEn, setNewMemberNameEn] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<LabMember['role']>('PHD_CANDIDATE');
  const [newMemberTitle, setNewMemberTitle] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberNameZh.trim() && !newMemberNameEn.trim()) return;
    const newId = `member-${Date.now()}`;
    const displayName = newMemberNameZh.trim() || newMemberNameEn.trim();
    addMember({
      id: newId,
      nameZh: displayName,
      nameEn: newMemberNameEn.trim() || displayName,
      role: newMemberRole,
      titleZh: newMemberTitle.trim() || '课题组成员',
      titleEn: newMemberTitle.trim() || 'Researcher',
      avatar: generateInitialsAvatar(displayName, newId),
      email: newMemberEmail.trim() || `${newId}@labflow.edu`,
    });
    setNewMemberNameZh('');
    setNewMemberNameEn('');
    setNewMemberTitle('');
    setNewMemberEmail('');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {t.allMembers} ({members.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{t.memberManagerDesc}</p>
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {members.map((m) => {
          const isCurrent = currentUserId === m.id;
          const displayName = language === 'zh' ? m.nameZh : m.nameEn;
          const displayTitle = language === 'zh' ? m.titleZh : m.titleEn;

          return (
            <div
              key={m.id}
              className={`flex items-center justify-between gap-3 p-3 rounded-xl border text-xs transition-all ${
                isCurrent
                  ? 'bg-cyan-50/50 dark:bg-cyan-950/30 border-cyan-500/50 shadow-sm'
                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-cyan-600 dark:text-cyan-400 shrink-0">
                  {displayName.slice(0, 2)}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                      {displayName}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono">
                      [{m.role}]
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40 font-semibold flex items-center gap-0.5">
                        <CheckCircle className="w-2.5 h-2.5" />
                        {language === 'zh' ? '我本人' : 'Active User'}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 truncate">
                    {displayTitle} · {m.email}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <select
                  value={deriveAccessRole(m)}
                  onChange={(e) => updateMember(m.id, { accessRole: e.target.value as AccessRole })}
                  className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-800 dark:text-slate-200 font-semibold focus:outline-none"
                >
                  <option value="ADMIN_PI">👑 {t.roleAdminPI}</option>
                  <option value="PROJECT_LEAD">🔬 {t.roleProjectLead}</option>
                  <option value="STUDENT_RA">🧑‍💻 {t.roleStudentRA}</option>
                  <option value="AUDITOR_GUEST">👁️ {t.roleAuditorGuest}</option>
                </select>

                {!isCurrent && (
                  <button
                    type="button"
                    onClick={() => setCurrentUserId(m.id)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-cyan-700 dark:text-cyan-300 text-[11px] font-medium transition-colors"
                  >
                    {t.setAsActiveUser}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (
                      confirm(
                        language === 'zh' ? `确认移除 ${displayName} 吗？` : `Remove ${displayName}?`
                      )
                    ) {
                      deleteMember(m.id);
                    }
                  }}
                  className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                  title={language === 'zh' ? '删除成员' : 'Delete Member'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={handleAddMember}
        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs"
      >
        <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          <UserPlus className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          {t.addNewMember}
        </span>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            required
            value={newMemberNameZh}
            onChange={(e) => setNewMemberNameZh(e.target.value)}
            placeholder="姓名 (中文，如 Student 4)"
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
          />
          <input
            type="text"
            value={newMemberNameEn}
            onChange={(e) => setNewMemberNameEn(e.target.value)}
            placeholder="Name (English)"
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select
            value={newMemberRole}
            onChange={(e) => setNewMemberRole(e.target.value as LabMember['role'])}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200"
          >
            <option value="PI">
              {language === 'zh' ? '课题组负责人 (PI)' : 'Principal Investigator (PI)'}
            </option>
            <option value="POSTDOC">
              {language === 'zh' ? '博士后研究员 (Postdoc)' : 'Postdoc'}
            </option>
            <option value="SENIOR_PHD">
              {language === 'zh' ? '高年级博士生' : 'Senior PhD'}
            </option>
            <option value="PHD_CANDIDATE">
              {language === 'zh' ? '博士研究生' : 'PhD Student'}
            </option>
            <option value="RA">
              {language === 'zh' ? '科研助理 (RA)' : 'Research Assistant'}
            </option>
            <option value="VISITING_SCHOLAR">
              {language === 'zh' ? '访问学者' : 'Visiting Scholar'}
            </option>
          </select>

          <input
            type="text"
            value={newMemberTitle}
            onChange={(e) => setNewMemberTitle(e.target.value)}
            placeholder={language === 'zh' ? '研究方向或职务代号' : 'Research focus or title'}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
          />
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-sm"
          >
            {language === 'zh' ? '录入课题组成员' : 'Add Member'}
          </button>
        </div>
      </form>
    </div>
  );
};
