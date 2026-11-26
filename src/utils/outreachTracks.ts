import { WorkshopTranslationStatus } from '@/types';

export const DEFAULT_OUTREACH_TRACKS: readonly string[] = [
  'Seminar & Research Workshop',
  'Industry / Clinical Partner',
  'Teaching & Course Module',
  'Policy Brief & Public Outreach',
  'Open-Source / Patent Release',
] as const;

export const WORKSHOP_TRANSLATION_STATUSES: readonly WorkshopTranslationStatus[] = [
  'NOT_STARTED',
  'IN_PREP',
  'WORKSHOP_READY',
  'PRESENTED',
] as const;

export const OUTREACH_STATUS_META: Record<
  WorkshopTranslationStatus,
  {
    labelEn: string;
    labelZh: string;
    shortEn: string;
    shortZh: string;
    badgeClass: string;
  }
> = {
  NOT_STARTED: {
    labelEn: 'Not Started',
    labelZh: '未启动',
    shortEn: 'Not Started',
    shortZh: '未启动',
    badgeClass:
      'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700',
  },
  IN_PREP: {
    labelEn: 'Preparing Outreach',
    labelZh: '筹备转化中',
    shortEn: 'In Prep',
    shortZh: '筹备中',
    badgeClass:
      'bg-amber-50 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40',
  },
  WORKSHOP_READY: {
    labelEn: 'Ready to Deliver',
    labelZh: '已就绪待发布',
    shortEn: 'Ready',
    shortZh: '已就绪',
    badgeClass:
      'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40',
  },
  PRESENTED: {
    labelEn: 'Presented / Delivered',
    labelZh: '已展示 / 落地',
    shortEn: 'Delivered',
    shortZh: '已落地',
    badgeClass:
      'bg-indigo-600 text-white border-indigo-500/40',
  },
};

export function normalizeWorkshopTranslationStatus(
  input: unknown
): WorkshopTranslationStatus | undefined {
  if (typeof input !== 'string') return undefined;
  const upper = input.trim().toUpperCase() as WorkshopTranslationStatus;
  return WORKSHOP_TRANSLATION_STATUSES.includes(upper) ? upper : undefined;
}

export function normalizeWorkshopTargetDate(input: unknown): string | undefined {
  if (typeof input !== 'string') return undefined;
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }
  return undefined;
}

/**
 * Normalizes a list of outreach / workshop / applied track tags linked to a research project.
 */
export function sanitizeWorkshopPrograms(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of input) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

/**
 * Normalizes a lab's configurable library of outreach/workshop track labels.
 */
export function sanitizeOutreachTracks(input: unknown): string[] {
  if (!Array.isArray(input)) return [...DEFAULT_OUTREACH_TRACKS];
  const cleaned = sanitizeWorkshopPrograms(input);
  return cleaned.length > 0 ? cleaned : [...DEFAULT_OUTREACH_TRACKS];
}

/**
 * Matches a project against the Outreach / Workshops filter ('ALL', 'UNLINKED', or exact track name).
 */
export function matchesProjectWorkshopFilter(
  project: { workshopPrograms?: string[] } | undefined,
  workshopFilter: string
): boolean {
  if (!workshopFilter || workshopFilter === 'ALL' || workshopFilter === 'all') {
    return true;
  }
  const programs = Array.isArray(project?.workshopPrograms)
    ? sanitizeWorkshopPrograms(project?.workshopPrograms)
    : [];
  if (workshopFilter === 'UNLINKED') {
    return programs.length === 0;
  }
  const targetLower = workshopFilter.trim().toLowerCase();
  return programs.some((p) => p.toLowerCase() === targetLower);
}
