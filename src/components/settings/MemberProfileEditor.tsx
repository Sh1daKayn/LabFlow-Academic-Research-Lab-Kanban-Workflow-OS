'use client';

import React, { useRef, useState } from 'react';
import { AccessRole, LabMember, Language } from '@/types';
import { compressAvatarImageFile, generateInitialsAvatar, isCustomPhotoAvatar } from '@/utils/avatar';
import { deriveAccessRole } from '@/utils/rbac';
import { MemberAvatar } from '@/components/MemberAvatar';
import { Camera, RotateCcw, Save, X } from 'lucide-react';

interface MemberProfileEditorProps {
  initialMember?: LabMember;
  language: Language;
  canEditAccessRole?: boolean;
  allowElevatedRoles?: boolean;
  submitLabel?: string;
  onSave: (draft: {
    nameZh: string;
    nameEn: string;
    role: LabMember['role'];
    accessRole?: AccessRole;
    titleZh: string;
    titleEn: string;
    email: string;
    avatar: string;
  }) => void;
  onCancel?: () => void;
}

/**
 * Shared profile + compressed photo-avatar editor reused across Member Settings,
 * Quick Member Manager, and Active User Self-Profile editing.
 */
export const MemberProfileEditor: React.FC<MemberProfileEditorProps> = ({
  initialMember,
  language,
  canEditAccessRole = true,
  allowElevatedRoles = true,
  submitLabel,
  onSave,
  onCancel,
}) => {
  const isZh = language === 'zh';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nameZh, setNameZh] = useState(initialMember?.nameZh || '');
  const [nameEn, setNameEn] = useState(initialMember?.nameEn || '');
  const [role, setRole] = useState<LabMember['role']>(initialMember?.role || 'PHD_CANDIDATE');
  const [accessRole, setAccessRole] = useState<AccessRole>(
    initialMember ? deriveAccessRole(initialMember) : 'STUDENT_RA'
  );
  const [titleZh, setTitleZh] = useState(initialMember?.titleZh || '');
  const [titleEn, setTitleEn] = useState(initialMember?.titleEn || '');
  const [email, setEmail] = useState(initialMember?.email || '');
  const [avatar, setAvatar] = useState(initialMember?.avatar || '');
  const [uploadError, setUploadError] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setIsCompressing(true);
    try {
      const compressed = await compressAvatarImageFile(file, 160, 0.82);
      setAvatar(compressed);
    } catch (err) {
      setUploadError(
        err instanceof Error
          ? err.message
          : isZh
          ? '图片读取或压缩失败，请换一张图片重试'
          : 'Failed to process image file'
      );
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const handleResetAvatar = () => {
    const seed = initialMember?.id || nameZh.trim() || nameEn.trim() || `member-${Date.now()}`;
    const display = nameZh.trim() || nameEn.trim() || 'LF';
    setAvatar(generateInitialsAvatar(display, seed));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanZh = nameZh.trim() || nameEn.trim();
    const cleanEn = nameEn.trim() || nameZh.trim();
    if (!cleanZh && !cleanEn) return;

    const finalAvatar =
      avatar ||
      generateInitialsAvatar(cleanZh || cleanEn, initialMember?.id || cleanEn || cleanZh);

    onSave({
      nameZh: cleanZh,
      nameEn: cleanEn,
      role,
      accessRole: canEditAccessRole ? accessRole : initialMember?.accessRole,
      titleZh: titleZh.trim() || (isZh ? '课题组成员' : 'Researcher'),
      titleEn: titleEn.trim() || titleZh.trim() || 'Researcher',
      email: email.trim() || initialMember?.email || `member@labflow.edu`,
      avatar: finalAvatar,
    });
  };

  const previewMember: Partial<LabMember> = {
    id: initialMember?.id || 'preview',
    nameZh: nameZh || '姓名',
    nameEn: nameEn || nameZh || 'Name',
    avatar: avatar || undefined,
  };

  const fieldClass =
    'w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500';

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-xs">
      {/* Avatar Upload Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
        <MemberAvatar member={previewMember} size="lg" />
        <div className="flex-1 min-w-[180px] space-y-1.5">
          <div className="font-bold text-slate-800 dark:text-slate-100">
            {isZh ? '个人照片头像' : 'Profile Photo Avatar'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isZh
              ? '支持上传 JPG/PNG/WebP 照片，系统自动居中裁切并轻量压缩保存。'
              : 'Upload a local photo (JPG/PNG/WebP). Auto center-cropped & compressed.'}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isCompressing}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>
                {isCompressing
                  ? isZh
                    ? '处理中...'
                    : 'Processing...'
                  : isZh
                  ? '上传照片头像'
                  : 'Upload Photo'}
              </span>
            </button>

            {isCustomPhotoAvatar(avatar) && (
              <button
                type="button"
                onClick={handleResetAvatar}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-medium transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isZh ? '恢复文字头像' : 'Reset Initials'}</span>
              </button>
            )}
          </div>
          {uploadError && <p className="text-[11px] text-rose-500 font-medium">{uploadError}</p>}
        </div>
      </div>

      {/* Name & Identity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            {isZh ? '姓名 (中文) *' : 'Name (Chinese)'}
          </label>
          <input
            type="text"
            required={!nameEn.trim()}
            value={nameZh}
            onChange={(e) => setNameZh(e.target.value)}
            placeholder={isZh ? '例如：张明 / 博士生' : 'Chinese name'}
            className={fieldClass}
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            {isZh ? '姓名 (英文)' : 'Name (English) *'}
          </label>
          <input
            type="text"
            required={!nameZh.trim()}
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            placeholder="e.g. Ming Zhang"
            className={fieldClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            {isZh ? '学术身份' : 'Academic Role'}
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as LabMember['role'])}
            className={fieldClass}
          >
            <option value="PI">{isZh ? '课题组负责人 (PI)' : 'Principal Investigator (PI)'}</option>
            <option value="POSTDOC">{isZh ? '博士后研究员 (Postdoc)' : 'Postdoctoral Fellow'}</option>
            <option value="SENIOR_PHD">{isZh ? '高年级博士生 (Senior PhD)' : 'Senior PhD Candidate'}</option>
            <option value="PHD_CANDIDATE">{isZh ? '博士研究生 (PhD)' : 'PhD Student'}</option>
            <option value="RA">{isZh ? '科研助理 / 硕士生 (RA)' : 'Research Assistant / MS'}</option>
            <option value="VISITING_SCHOLAR">{isZh ? '访问学者 (Visiting)' : 'Visiting Scholar'}</option>
          </select>
        </div>

        {canEditAccessRole ? (
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              {isZh ? '系统操作权限' : 'Access Level'}
            </label>
            <select
              value={accessRole}
              onChange={(e) => setAccessRole(e.target.value as AccessRole)}
              className={fieldClass}
            >
              <option value="ADMIN_PI" disabled={!allowElevatedRoles}>
                {isZh ? '👑 导师 / 最高管理员' : '👑 PI / Lab Owner'}
              </option>
              <option value="SYS_ADMIN" disabled={!allowElevatedRoles}>
                {isZh ? '🛡️ 系统管理员（学生协管）' : '🛡️ System Admin (Student)'}
              </option>
              <option value="PROJECT_LEAD">{isZh ? '🔬 课题负责人 / 骨干' : '🔬 Project Lead'}</option>
              <option value="STUDENT_RA">{isZh ? '🧑‍💻 组内成员 / 研究生' : '🧑‍💻 Student / RA'}</option>
              <option value="AUDITOR_GUEST">{isZh ? '👁️ 只读访客 / 旁听' : '👁️ Read-Only Guest'}</option>
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              {isZh ? '工作邮箱' : 'Email'}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@university.edu"
              className={fieldClass}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            {isZh ? '研究方向 / 中文头衔' : 'Title / Research Focus (ZH)'}
          </label>
          <input
            type="text"
            value={titleZh}
            onChange={(e) => setTitleZh(e.target.value)}
            placeholder={isZh ? '例如：博士生（具身智能 / 多智能体）' : 'Research specialization'}
            className={fieldClass}
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            {canEditAccessRole
              ? isZh
                ? '工作邮箱'
                : 'Email'
              : isZh
              ? '英文头衔'
              : 'Title (English)'}
          </label>
          {canEditAccessRole ? (
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@university.edu"
              className={fieldClass}
            />
          ) : (
            <input
              type="text"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="e.g. PhD Candidate (Embodied AI)"
              className={fieldClass}
            />
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>{isZh ? '取消' : 'Cancel'}</span>
          </button>
        )}
        <button
          type="submit"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-sm transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{submitLabel || (isZh ? '保存成员资料' : 'Save Member')}</span>
        </button>
      </div>
    </form>
  );
};
