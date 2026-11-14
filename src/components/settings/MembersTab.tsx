'use client';

import React, { useState } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import { AccessRole } from '@/types';
import { deriveAccessRole } from '@/utils/rbac';
import { MemberAvatar } from '@/components/MemberAvatar';
import { MemberProfileEditor } from '@/components/settings/MemberProfileEditor';
import { CheckCircle, Pencil, Trash2, UserPlus, X } from 'lucide-react';

export const MembersTab: React.FC = () => {
  const {
    members,
    currentUserId,
    setCurrentUserId,
    addMember,
    updateMember,
    deleteMember,
    effectiveIsAdmin,
    canManageLab,
    canEditMemberProfile,
    canAssignMemberRole,
    language,
    t,
  } = useLabFlow();

  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [isAddingMember, setIsAddingMember] = useState<boolean>(false);
  const [addFormKey, setAddFormKey] = useState<number>(0);

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {t.allMembers} ({members.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{t.memberManagerDesc}</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingMemberId(null);
            setIsAddingMember((prev) => !prev);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          {isAddingMember ? <X className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
          <span>{isAddingMember ? t.cancel : t.addNewMember}</span>
        </button>
      </div>

      {effectiveIsAdmin && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed">
          {language === 'zh'
            ? '👑 导师委派权限：可在下方将任意学生设为「🛡️ 系统管理员（学生协管）」，其权限仅次于导师、高于所有学生，协助日常管理及与同学沟通。'
            : '👑 PI Delegation: Assign any student as "🛡️ System Admin" below. They hold authority second only to PI to coordinate lab operations with students.'}
        </div>
      )}

      {isAddingMember && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-cyan-500/40 space-y-3">
          <div className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>{t.addNewMember}</span>
          </div>
          <MemberProfileEditor
            key={`new-member-${addFormKey}`}
            language={language}
            canEditAccessRole={canManageLab()}
            allowElevatedRoles={effectiveIsAdmin}
            submitLabel={language === 'zh' ? '录入课题组成员' : 'Add Member'}
            onCancel={() => setIsAddingMember(false)}
            onSave={(draft) => {
              const newId = `member-${Date.now()}`;
              addMember({
                id: newId,
                nameZh: draft.nameZh,
                nameEn: draft.nameEn,
                role: draft.role,
                accessRole: draft.accessRole,
                titleZh: draft.titleZh,
                titleEn: draft.titleEn,
                avatar: draft.avatar,
                email: draft.email || `${newId}@labflow.edu`,
              });
              setAddFormKey((k) => k + 1);
              setIsAddingMember(false);
            }}
          />
        </div>
      )}

      <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
        {members.map((m) => {
          const isCurrent = currentUserId === m.id;
          const isEditing = editingMemberId === m.id;
          const memberRole = deriveAccessRole(m);
          const allowProfileEdit = canEditMemberProfile(m.id);
          const allowRoleSelect = canAssignMemberRole(m);
          const allowDelete =
            canManageLab() &&
            (effectiveIsAdmin || (memberRole !== 'ADMIN_PI' && memberRole !== 'SYS_ADMIN'));
          const displayName = language === 'zh' ? m.nameZh : m.nameEn;
          const displayTitle = language === 'zh' ? m.titleZh : m.titleEn;

          return (
            <div
              key={m.id}
              className={`p-3 rounded-xl border text-xs transition-all space-y-3 ${
                isCurrent
                  ? 'bg-cyan-50/50 dark:bg-cyan-950/30 border-cyan-500/50 shadow-sm'
                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <MemberAvatar member={m} size="sm" />
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                        {displayName}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono">
                        [{m.role}]
                      </span>
                      {memberRole === 'SYS_ADMIN' && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/35 font-semibold">
                          🛡️ {language === 'zh' ? '系统管理员' : 'SysAdmin'}
                        </span>
                      )}
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

                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  {allowProfileEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingMember(false);
                        setEditingMemberId(isEditing ? null : m.id);
                      }}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
                        isEditing
                          ? 'bg-cyan-600 text-white border-cyan-600'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-cyan-500/50'
                      }`}
                      title={t.editProfile}
                    >
                      <Pencil className="w-3 h-3" />
                      <span>{isEditing ? t.cancel : t.editProfile}</span>
                    </button>
                  )}

                  <select
                    value={memberRole}
                    disabled={!allowRoleSelect}
                    onChange={(e) => updateMember(m.id, { accessRole: e.target.value as AccessRole })}
                    title={
                      !allowRoleSelect
                        ? language === 'zh'
                          ? '仅导师（解锁管理锁）可调整高阶权限或委派系统管理员'
                          : 'Requires unlocked PI to change this role'
                        : undefined
                    }
                    className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-800 dark:text-slate-200 font-semibold focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="ADMIN_PI" disabled={!effectiveIsAdmin}>
                      👑 {t.roleAdminPI}
                    </option>
                    <option value="SYS_ADMIN" disabled={!effectiveIsAdmin}>
                      🛡️ {t.roleSysAdmin}
                    </option>
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

                  {allowDelete && (
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
                  )}
                </div>
              </div>

              {isEditing && allowProfileEdit && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                  <MemberProfileEditor
                    key={m.id}
                    initialMember={m}
                    language={language}
                    canEditAccessRole={allowRoleSelect}
                    allowElevatedRoles={effectiveIsAdmin}
                    submitLabel={t.saveMemberChanges}
                    onCancel={() => setEditingMemberId(null)}
                    onSave={(draft) => {
                      updateMember(m.id, draft);
                      setEditingMemberId(null);
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
