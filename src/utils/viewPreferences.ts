import { LabMember, ViewMode } from '@/types';

export const ALL_VIEW_MODES: ViewMode[] = [
  'kanban',
  'todos',
  'requests',
  'gantt',
  'architecture',
  'meeting',
];

export const DEFAULT_STUDENT_VIEWS: ViewMode[] = ['kanban', 'todos', 'requests'];

export const VIEW_META: Record<
  ViewMode,
  { labelZh: string; labelEn: string; descZh: string; descEn: string }
> = {
  kanban: {
    labelZh: '任务看板',
    labelEn: 'Tasks',
    descZh: '按论文、纵向项目、横向项目归类推进个人任务',
    descEn: 'Track papers, vertical & enterprise projects by stage',
  },
  todos: {
    labelZh: '本周待办',
    labelEn: 'Weekly To-Do',
    descZh: '聚焦本周个人可执行清单与节点自检',
    descEn: 'Focused weekly action items and milestone checks',
  },
  requests: {
    labelZh: '申请与交流',
    labelEn: '1-on-1 Requests',
    descZh: '向指定某一人发起一对一申请、求助或交流',
    descEn: 'Send private or public 1-on-1 requests to one person',
  },
  gantt: {
    labelZh: '时间轴甘特',
    labelEn: 'Timeline',
    descZh: '按时间节点与工期排期查看截止进度',
    descEn: 'Timeline view for strict project milestones & deadlines',
  },
  architecture: {
    labelZh: '项目分类总览',
    labelEn: 'Projects',
    descZh: '按论文、纵向项目、横向企业项目归类汇总与学期继承图谱',
    descEn: 'Projects by cluster, cross-term handoffs & semester lineage',
  },
  meeting: {
    labelZh: '组会汇报',
    labelEn: 'Meeting',
    descZh: '周会汇报展示与待决事项',
    descEn: 'Weekly group meeting standup mode',
  },
};

export function isValidViewMode(value: unknown): value is ViewMode {
  return typeof value === 'string' && ALL_VIEW_MODES.includes(value as ViewMode);
}

export function sanitizePreferredViews(views?: unknown): ViewMode[] {
  if (!Array.isArray(views)) return [...DEFAULT_STUDENT_VIEWS];
  const unique = Array.from(new Set(views.filter(isValidViewMode)));
  return unique.length > 0 ? unique : [...DEFAULT_STUDENT_VIEWS];
}

export function resolveMemberDefaultView(
  member?: Pick<LabMember, 'preferredViews' | 'defaultView'>
): ViewMode {
  const preferred = sanitizePreferredViews(member?.preferredViews);
  if (member?.defaultView && isValidViewMode(member.defaultView)) {
    return member.defaultView;
  }
  return preferred[0] || 'kanban';
}
