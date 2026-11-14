import {
  AccessRole,
  LabWorkspaceData,
  Language,
  ProjectItem,
  TaskItem,
  WeeklyTodoItem,
} from '@/types';

/**
 * Returns a Date aligned to Monday 00:00:00 local time for the week containing `dateInput`.
 */
export function getWeekStartDate(dateInput: Date | string = new Date()): Date {
  const base =
    typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput)
      ? new Date(`${dateInput.slice(0, 10)}T12:00:00`)
      : new Date(dateInput);
  if (Number.isNaN(base.getTime())) {
    return getWeekStartDate(new Date());
  }
  const day = base.getDay(); // 0=Sun, 1=Mon, ...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(base.getFullYear(), base.getMonth(), base.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function toIsoYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Canonical Monday YYYY-MM-DD key representing a calendar week.
 */
export function getWeekKey(dateInput: Date | string = new Date()): string {
  return toIsoYmd(getWeekStartDate(dateInput));
}

export function shiftWeekKey(weekKey: string, deltaWeeks: number): string {
  const start = getWeekStartDate(weekKey);
  start.setDate(start.getDate() + deltaWeeks * 7);
  return toIsoYmd(start);
}

export function getWeekEndKey(weekKey: string): string {
  const start = getWeekStartDate(weekKey);
  start.setDate(start.getDate() + 6);
  return toIsoYmd(start);
}

export function isDateInWeek(dateStr: string | undefined, weekKey: string): boolean {
  if (!dateStr) return false;
  const clean = dateStr.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return false;
  const start = getWeekKey(weekKey);
  const end = getWeekEndKey(weekKey);
  return clean >= start && clean <= end;
}

export function formatWeekRangeLabel(weekKey: string, lang: Language): string {
  const start = getWeekKey(weekKey);
  const end = getWeekEndKey(weekKey);
  const current = getWeekKey();
  const prev = shiftWeekKey(current, -1);
  const next = shiftWeekKey(current, 1);

  const rangeText = `${start.slice(5)} ~ ${end.slice(5)}`;
  if (start === current) {
    return lang === 'zh' ? `${rangeText}（本周）` : `${rangeText} (This Week)`;
  }
  if (start === prev) {
    return lang === 'zh' ? `${rangeText}（上周）` : `${rangeText} (Last Week)`;
  }
  if (start === next) {
    return lang === 'zh' ? `${rangeText}（下周）` : `${rangeText} (Next Week)`;
  }
  return `${start} ~ ${end}`;
}

export interface AcceptancePermissionInput {
  todo: WeeklyTodoItem;
  project?: ProjectItem;
  task?: TaskItem;
  currentUserId: string;
  currentAccessRole: AccessRole;
  effectiveIsAdmin: boolean;
  isAdminUnlocked: boolean;
  allowPeerAcceptance?: boolean;
}

/**
 * Evaluates whether the active session user can perform "项验收" (Acceptance sign-off).
 * When the workspace has enabled unlocked/peer mode (`allowPeerAcceptance`) or Admin unlock,
 * all members can verify and accept each other's weekly items.
 */
export function canAcceptWeeklyTodo({
  project,
  task,
  currentUserId,
  currentAccessRole,
  effectiveIsAdmin,
  isAdminUnlocked,
  allowPeerAcceptance,
}: AcceptancePermissionInput): boolean {
  if (effectiveIsAdmin || isAdminUnlocked || allowPeerAcceptance) {
    return true;
  }
  if (currentAccessRole === 'AUDITOR_GUEST') {
    return false;
  }
  if (currentAccessRole === 'SYS_ADMIN' || currentAccessRole === 'PROJECT_LEAD') {
    return true;
  }
  if (project && (project.leadAuthorId === currentUserId || project.piId === currentUserId)) {
    return true;
  }
  if (task && task.pi?.id === currentUserId) {
    return true;
  }
  return false;
}

/**
 * Synchronizes a weekly todo toggle (`done`) back into the linked TaskItem checklist & progress.
 */
export function applyTodoToggleToTasks(
  tasks: TaskItem[],
  todo: WeeklyTodoItem,
  nextDone: boolean
): TaskItem[] {
  if (!todo.taskId || !todo.checklistItemId) return tasks;
  const now = new Date().toISOString();
  return tasks.map((task) => {
    if (task.id !== todo.taskId || !Array.isArray(task.checklist)) return task;
    let changed = false;
    const nextChecklist = task.checklist.map((item) => {
      if (item.id === todo.checklistItemId && item.done !== nextDone) {
        changed = true;
        return { ...item, done: nextDone };
      }
      return item;
    });
    if (!changed) return task;
    const total = nextChecklist.length;
    const completed = nextChecklist.filter((c) => c.done).length;
    const nextProgress = total > 0 ? Math.round((completed / total) * 100) : task.progress;
    return {
      ...task,
      checklist: nextChecklist,
      progress: nextProgress,
      updatedAt: now,
    };
  });
}

/**
 * Synchronizes task checklist edits into any linked WeeklyTodoItem entries.
 */
export function syncTaskChecklistChangesToTodos(
  todos: WeeklyTodoItem[],
  taskId: string,
  nextChecklist: { id: string; text: string; done: boolean }[]
): WeeklyTodoItem[] {
  const byId = new Map(nextChecklist.map((item) => [item.id, item]));
  const now = new Date().toISOString();
  return todos.map((todo) => {
    if (todo.taskId !== taskId || !todo.checklistItemId) return todo;
    const matched = byId.get(todo.checklistItemId);
    if (!matched) return todo;
    if (todo.done === matched.done && todo.title === matched.text) return todo;
    return {
      ...todo,
      title: matched.text,
      done: matched.done,
      acceptanceStatus: matched.done
        ? todo.acceptanceStatus === 'ACCEPTED'
          ? 'ACCEPTED'
          : 'SUBMITTED'
        : 'PENDING',
      updatedAt: now,
    };
  });
}

export function sanitizeWeeklyTodos(input: unknown): WeeklyTodoItem[] {
  if (!Array.isArray(input)) return [];
  const now = new Date().toISOString();
  const validStatuses = new Set(['PENDING', 'SUBMITTED', 'ACCEPTED', 'REVISION_REQUESTED']);
  const result: WeeklyTodoItem[] = [];

  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue;
    const obj = raw as Partial<WeeklyTodoItem>;
    if (!obj.id || !obj.memberId || !obj.title) continue;
    result.push({
      id: String(obj.id),
      memberId: String(obj.memberId),
      weekKey: typeof obj.weekKey === 'string' && obj.weekKey ? obj.weekKey : getWeekKey(),
      title: String(obj.title),
      done: Boolean(obj.done),
      priority: obj.priority,
      projectId: obj.projectId || undefined,
      taskId: obj.taskId || undefined,
      checklistItemId: obj.checklistItemId || undefined,
      acceptanceCriteria: obj.acceptanceCriteria || undefined,
      acceptanceStatus:
        obj.acceptanceStatus && validStatuses.has(obj.acceptanceStatus)
          ? obj.acceptanceStatus
          : obj.done
          ? 'SUBMITTED'
          : 'PENDING',
      acceptedById: obj.acceptedById || undefined,
      acceptedAt: obj.acceptedAt || undefined,
      notes: obj.notes || undefined,
      createdAt: obj.createdAt || now,
      updatedAt: obj.updatedAt || now,
    });
  }

  return result;
}

export function extractWorkspaceAcceptanceFlags(data: Partial<LabWorkspaceData>): {
  weeklyTodos: WeeklyTodoItem[];
  allowPeerAcceptance: boolean;
} {
  return {
    weeklyTodos: sanitizeWeeklyTodos(data.weeklyTodos),
    allowPeerAcceptance: Boolean(data.allowPeerAcceptance),
  };
}
