import { Language, ProjectItem, TaskItem, WorkCategory } from '@/types';

export interface WorkCategoryMeta {
  id: WorkCategory;
  labelZh: string;
  labelEn: string;
  shortZh: string;
  shortEn: string;
  descZh: string;
  descEn: string;
  badgeClass: string;
  accentBarClass: string;
}

export const WORK_CATEGORIES: WorkCategory[] = [
  'PAPER',
  'VERTICAL_PROJECT',
  'HORIZONTAL_PROJECT',
];

export const WORK_CATEGORY_META: Record<WorkCategory, WorkCategoryMeta> = {
  PAPER: {
    id: 'PAPER',
    labelZh: '学术论文',
    labelEn: 'Paper Track',
    shortZh: '论文',
    shortEn: 'Paper',
    descZh: '面向期刊与会议发表的研究成果',
    descEn: 'Journal manuscripts & working papers',
    badgeClass:
      'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25',
    accentBarClass: 'bg-indigo-500',
  },
  VERTICAL_PROJECT: {
    id: 'VERTICAL_PROJECT',
    labelZh: '纵向科研项目',
    labelEn: 'Grant / Funded',
    shortZh: '纵向项目',
    shortEn: 'Grant',
    descZh: '国家/省部级基金与科研攻关课题',
    descEn: 'Funded grants, foundations & policy deliverables',
    badgeClass:
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
    accentBarClass: 'bg-emerald-500',
  },
  HORIZONTAL_PROJECT: {
    id: 'HORIZONTAL_PROJECT',
    labelZh: '横向企业项目',
    labelEn: 'Industry / Outreach',
    shortZh: '横向项目',
    shortEn: 'Industry',
    descZh: '企业合作研发，具有明确交付时间节点要求',
    descEn: 'Industry partner & extension consulting milestones',
    badgeClass:
      'bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/30',
    accentBarClass: 'bg-amber-500',
  },
};

export function normalizeWorkCategory(value?: string): WorkCategory {
  if (value === 'VERTICAL_PROJECT' || value === 'HORIZONTAL_PROJECT' || value === 'PAPER') {
    return value;
  }
  return 'PAPER';
}

export function resolveProjectWorkCategory(project?: Pick<ProjectItem, 'workCategory'>): WorkCategory {
  return normalizeWorkCategory(project?.workCategory);
}

export function resolveTaskWorkCategory(
  task: Pick<TaskItem, 'workCategory' | 'projectId'>,
  projects: Pick<ProjectItem, 'id' | 'workCategory'>[] = []
): WorkCategory {
  if (task.workCategory) return normalizeWorkCategory(task.workCategory);
  const parent = projects.find((p) => p.id === task.projectId);
  return normalizeWorkCategory(parent?.workCategory);
}

export function getWorkCategoryLabel(
  category: WorkCategory,
  lang: Language,
  short = false
): string {
  const meta = WORK_CATEGORY_META[category];
  if (short) return lang === 'zh' ? meta.shortZh : meta.shortEn;
  return lang === 'zh' ? meta.labelZh : meta.labelEn;
}
