'use client';

import React, { useEffect, useState } from 'react';
import { LabMember } from '@/types';
import { generateInitialsAvatar } from '@/utils/avatar';

export type MemberAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASSES: Record<MemberAvatarSize, string> = {
  xs: 'w-5 h-5 text-[9px]',
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-12 h-12 text-sm',
  xl: 'w-16 h-16 text-base',
};

interface MemberAvatarProps {
  member?: Partial<LabMember> | null;
  alt?: string;
  size?: MemberAvatarSize;
  className?: string;
}

/**
 * Unified member avatar component rendering uploaded photo avatars or offline SVG initials
 * consistently across headers, cards, settings, trees, and To-Do lists.
 */
export const MemberAvatar: React.FC<MemberAvatarProps> = ({
  member,
  alt,
  size = 'md',
  className = '',
}) => {
  const displayName = member?.nameZh || member?.nameEn || alt || 'LF';
  const fallbackSrc = generateInitialsAvatar(member?.nameEn || member?.nameZh || 'LF', member?.id || displayName);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [member?.avatar]);

  const resolvedSrc = !imgFailed && member?.avatar ? member.avatar : fallbackSrc;

  return (
    <div
      className={`relative rounded-full overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-cyan-600 dark:text-cyan-400 select-none ${SIZE_CLASSES[size]} ${className}`}
      title={alt || displayName}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolvedSrc}
        alt={alt || displayName}
        onError={() => setImgFailed(true)}
        className="w-full h-full object-cover"
      />
    </div>
  );
};
