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
    descZh: '面向学术期刊、专著与同行评审会议的论文研究',
    descEn: 'Journal manuscripts, working papers & conference publications',
    badgeClass:
      'bg-indigo-500/12 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    accentBarClass: 'bg-indigo-500',
  },
  VERTICAL_PROJECT: {
    id: 'VERTICAL_PROJECT',
    labelZh: '纵向科研基金',
    labelEn: 'Grant / Funded',
    shortZh: '基金项目',
    shortEn: 'Grant',
    descZh: '国家/地方或学术基金会资助的研究与政策报告课题',
    descEn: 'Government, foundation & competitive funded research grants',
    badgeClass:
      'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    accentBarClass: 'bg-emerald-500',
  },
  HORIZONTAL_PROJECT: {
    id: 'HORIZONTAL_PROJECT',
    labelZh: '合作与转化课题',
    labelEn: 'Industry / Outreach',
    shortZh: '合作转化',
    shortEn: 'Outreach',
    descZh: '产业合作、临床试验、田野应用或公共推广落地项目',
    descEn: 'Industry partnerships, clinical translation, field pilots & outreach',
    badgeClass:
      'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/35',
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
