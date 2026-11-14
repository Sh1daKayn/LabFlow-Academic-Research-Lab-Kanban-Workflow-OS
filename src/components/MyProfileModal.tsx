'use client';

import React from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import { MemberProfileEditor } from '@/components/settings/MemberProfileEditor';
import { UserCog, X } from 'lucide-react';

/**
 * Allows the currently active member to edit their own name, research title,
 * email, and upload a custom photo avatar without requiring admin lock elevation.
 */
export const MyProfileModal: React.FC = () => {
  const {
    isMyProfileModalOpen,
    setIsMyProfileModalOpen,
    currentMember,
    effectiveIsAdmin,
    updateMember,
    language,
    t,
  } = useLabFlow();

  if (!isMyProfileModalOpen || !currentMember) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={() => setIsMyProfileModalOpen(false)}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
            <UserCog className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold">{t.myProfile}</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'zh'
                ? '随时修改个人姓名、研究方向并上传照片头像，修改会同步至全组视图。'
                : 'Update your display name, title, and custom photo avatar across the lab.'}
            </p>
          </div>
        </div>

        <MemberProfileEditor
          key={currentMember.id}
          initialMember={currentMember}
          language={language}
          canEditAccessRole={effectiveIsAdmin}
          submitLabel={t.saveMemberChanges}
          onCancel={() => setIsMyProfileModalOpen(false)}
          onSave={(draft) => {
            updateMember(currentMember.id, draft);
            setIsMyProfileModalOpen(false);
          }}
        />
      </div>
    </div>
  );
};
