import {
  LabMember,
  Language,
  ProjectItem,
  StageConfig,
  TaskItem,
} from '@/types';
import { BLOCKER_CATEGORIES } from '@/data/mockData';

export const CATEGORY_COLOR_PALETTE = [
  '#6366f1', // indigo
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#0ea5e9', // sky
  '#ef4444', // rose
];

export interface ProjectCategorySummary {
  category: string;
  color: string;
  projects: ProjectItem[];
  members: LabMember[];
  memberCount: number;
  taskCount: number;
  completedTaskCount: number;
  blockedTaskCount: number;
  avgProgress: number;
}

export interface WordCloudTerm {
  text: string;
  weight: number;
  count: number;
  source: 'category' | 'project' | 'venue' | 'tag' | 'blocker' | 'keyword';
  color: string;
  matchedProjectIds: string[];
  matchedTaskIds: string[];
}

export function getProjectCategoryName(project: ProjectItem, lang: Language): string {
  const trimmed = (project.category || '').trim();
  if (trimmed) return trimmed;
  return lang === 'zh' ? '未归类课题' : 'General Research';
}

export function resolveCategoryColor(categoryName: string, explicitColor?: string): string {
  if (explicitColor && /^#[0-9a-fA-F]{3,8}$/.test(explicitColor)) {
    return explicitColor;
  }
  let hash = 0;
  for (let i = 0; i < categoryName.length; i += 1) {
    hash = (hash * 31 + categoryName.charCodeAt(i)) >>> 0;
  }
  return CATEGORY_COLOR_PALETTE[hash % CATEGORY_COLOR_PALETTE.length];
}

/**
 * Computes all distinct responsible lab members for a single project:
 * explicit `project.memberIds` + `leadAuthorId` + `piId` + assignees/PIs of linked tasks.
 */
export function getProjectMembers(
  project: ProjectItem,
  tasks: TaskItem[],
  allMembers: LabMember[]
): LabMember[] {
  const memberById = new Map(allMembers.map((m) => [m.id, m]));
  const ids = new Set<string>();

  if (Array.isArray(project.memberIds)) {
    for (const id of project.memberIds) {
      if (memberById.has(id)) ids.add(id);
    }
  }
  if (memberById.has(project.leadAuthorId)) ids.add(project.leadAuthorId);
  if (memberById.has(project.piId)) ids.add(project.piId);

  for (const task of tasks) {
    if (task.projectId === project.id) {
      if (task.leadAuthor?.id && memberById.has(task.leadAuthor.id)) {
        ids.add(task.leadAuthor.id);
      }
      if (task.pi?.id && memberById.has(task.pi.id)) {
        ids.add(task.pi.id);
      }
    }
  }

  return Array.from(ids)
    .map((id) => memberById.get(id))
    .filter((m): m is LabMember => Boolean(m));
}

/**
 * Groups all projects by category and aggregates unique responsible headcounts,
 * task counts, completion progress, and active blockers.
 */
export function aggregateProjectsByCategory(
  projects: ProjectItem[],
  tasks: TaskItem[],
  members: LabMember[],
  lang: Language
): ProjectCategorySummary[] {
  const map = new Map<
    string,
    {
      category: string;
      color?: string;
      projects: ProjectItem[];
      memberMap: Map<string, LabMember>;
      taskCount: number;
      completedTaskCount: number;
      blockedTaskCount: number;
      progressSum: number;
    }
  >();

  for (const project of projects) {
    const category = getProjectCategoryName(project, lang);
    let bucket = map.get(category);
    if (!bucket) {
      bucket = {
        category,
        color: project.categoryColor,
        projects: [],
        memberMap: new Map(),
        taskCount: 0,
        completedTaskCount: 0,
        blockedTaskCount: 0,
        progressSum: 0,
      };
      map.set(category, bucket);
    }
    if (!bucket.color && project.categoryColor) {
      bucket.color = project.categoryColor;
    }
    bucket.projects.push(project);

    const projMembers = getProjectMembers(project, tasks, members);
    for (const m of projMembers) {
      bucket.memberMap.set(m.id, m);
    }

    const projTasks = tasks.filter((t) => t.projectId === project.id);
    bucket.taskCount += projTasks.length;
    for (const task of projTasks) {
      if (task.stage === 'ACCEPTED' || task.completedAt) {
        bucket.completedTaskCount += 1;
      }
      if (task.isBlocked) {
        bucket.blockedTaskCount += 1;
      }
      bucket.progressSum += typeof task.progress === 'number' ? task.progress : 0;
    }
  }

  const summaries: ProjectCategorySummary[] = Array.from(map.values()).map((b) => ({
    category: b.category,
    color: resolveCategoryColor(b.category, b.color),
    projects: b.projects,
    members: Array.from(b.memberMap.values()),
    memberCount: b.memberMap.size,
    taskCount: b.taskCount,
    completedTaskCount: b.completedTaskCount,
    blockedTaskCount: b.blockedTaskCount,
    avgProgress: b.taskCount > 0 ? Math.round(b.progressSum / b.taskCount) : 0,
  }));

  return summaries.sort((a, b) => b.projects.length - a.projects.length || b.memberCount - a.memberCount);
}

const STOP_WORDS = new Set([
  'for',
  'the',
  'and',
  'with',
  'from',
  'into',
  'using',
  'based',
  'via',
  'over',
  'under',
  'on',
  'in',
  'of',
  'to',
  'vs',
  'an',
  'a',
  'study',
  'analysis',
  'research',
  'project',
  'paper',
  'model',
  'models',
  'method',
  'methods',
  '研究',
  '分析',
  '方法',
  '论文',
  '课题',
  '系统',
  '实验',
]);

function tokenizeKeywords(text: string): string[] {
  if (!text) return [];
  const results: string[] = [];
  // English technical words (3+ chars)
  const enMatches = text.match(/[A-Za-z][A-Za-z0-9-]{2,}/g) || [];
  for (const w of enMatches) {
    const clean = w.replace(/^-+|-+$/g, '');
    if (clean.length >= 3 && !STOP_WORDS.has(clean.toLowerCase())) {
      results.push(clean);
    }
  }
  // Chinese segments separated by punctuation/whitespace (2-8 chars)
  const zhChunks = text.match(/[\u4e00-\u9fa5]{2,8}/g) || [];
  for (const chunk of zhChunks) {
    if (!STOP_WORDS.has(chunk)) {
      results.push(chunk);
    }
  }
  return results;
}

/**
 * Builds an automatic weighted Word Cloud from workspace project categories, tags,
 * target venues, task tags, blocker categories, and extracted title concepts.
 */
export function buildWordCloudTerms(
  projects: ProjectItem[],
  tasks: TaskItem[],
  stages: StageConfig[],
  lang: Language,
  maxTerms = 42
): WordCloudTerm[] {
  const accumulator = new Map<
    string,
    {
      display: string;
      weight: number;
      count: number;
      source: WordCloudTerm['source'];
      projectIds: Set<string>;
      taskIds: Set<string>;
    }
  >();

  const addTerm = (
    raw: string,
    score: number,
    source: WordCloudTerm['source'],
    projectId?: string,
    taskId?: string
  ) => {
    const display = raw.trim();
    if (!display || display.length < 2) return;
    const key = display.toLowerCase();
    const existing = accumulator.get(key);
    if (existing) {
      existing.weight += score;
      existing.count += 1;
      if (projectId) existing.projectIds.add(projectId);
      if (taskId) existing.taskIds.add(taskId);
    } else {
      accumulator.set(key, {
        display,
        weight: score,
        count: 1,
        source,
        projectIds: new Set(projectId ? [projectId] : []),
        taskIds: new Set(taskId ? [taskId] : []),
      });
    }
  };

  for (const p of projects) {
    if (p.category?.trim()) {
      addTerm(p.category.trim(), 6, 'category', p.id);
    }
    if (p.tag?.trim()) {
      addTerm(p.tag.trim(), 4.5, 'project', p.id);
    }
    if (p.targetVenue?.trim()) {
      for (const venuePart of p.targetVenue.split('/')) {
        if (venuePart.trim()) addTerm(venuePart.trim(), 3.2, 'venue', p.id);
      }
    }
    for (const kw of tokenizeKeywords(p.title)) {
      addTerm(kw, 2.0, 'keyword', p.id);
    }
  }

  for (const t of tasks) {
    const urgencyBoost =
      t.priority === 'URGENT' ? 1.8 : t.priority === 'HIGH' ? 1.4 : 1.0;

    if (Array.isArray(t.tags)) {
      for (const tag of t.tags) {
        if (tag && !tag.startsWith('T-')) {
          addTerm(tag, 3.4 * urgencyBoost, 'tag', t.projectId, t.id);
        }
      }
    }
    if (t.isBlocked && t.blocker?.category) {
      const meta = BLOCKER_CATEGORIES[t.blocker.category];
      if (meta) {
        addTerm(lang === 'zh' ? meta.labelZh : meta.labelEn, 3.8, 'blocker', t.projectId, t.id);
      }
    }
    for (const kw of tokenizeKeywords(t.title)) {
      addTerm(kw, 1.3 * urgencyBoost, 'keyword', t.projectId, t.id);
    }
    const stageMeta = stages.find((s) => s.id === t.stage);
    if (stageMeta) {
      addTerm(
        lang === 'zh' ? stageMeta.labelZh : stageMeta.labelEn,
        1.2,
        'tag',
        t.projectId,
        t.id
      );
    }
  }

  const SOURCE_COLORS: Record<WordCloudTerm['source'], string[]> = {
    category: ['#6366f1', '#4f46e5', '#8b5cf6'],
    project: ['#06b6d4', '#0891b2', '#0284c7'],
    venue: ['#10b981', '#059669', '#14b8a6'],
    tag: ['#f59e0b', '#d97706', '#0ea5e9'],
    blocker: ['#f43f5e', '#e11d48', '#fb7185'],
    keyword: ['#64748b', '#475569', '#6366f1', '#0891b2'],
  };

  return Array.from(accumulator.values())
    .sort((a, b) => b.weight - a.weight || b.count - a.count)
    .slice(0, maxTerms)
    .map((item, idx) => {
      const palette = SOURCE_COLORS[item.source];
      return {
        text: item.display,
        weight: Math.round(item.weight * 10) / 10,
        count: item.count,
        source: item.source,
        color: palette[idx % palette.length],
        matchedProjectIds: Array.from(item.projectIds),
        matchedTaskIds: Array.from(item.taskIds),
      };
    });
}
