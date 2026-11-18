import { LabWorkspaceData, Language, ViewMode } from '@/types';
import { getMemberDisplayName } from '@/utils/avatar';

export interface PersonalDesktopAlert {
  id: string;
  tag: string;
  title: string;
  body: string;
  viewMode: ViewMode;
  taskId?: string;
}

/**
 * Compares two LabWorkspaceData snapshots for `currentUserId` to emit
 * Scheme C Web Notification API alerts only for newly arrived items targeted at them.
 */
export function detectNewPersonalAlerts(
  prev: LabWorkspaceData,
  next: LabWorkspaceData,
  currentUserId: string,
  language: Language
): PersonalDesktopAlert[] {
  if (!currentUserId) return [];

  const isZh = language === 'zh';
  const alerts: PersonalDesktopAlert[] = [];
  const memberMap = new Map(next.members.map((m) => [m.id, m]));

  // 1. Newly arrived 1-on-1 Requests or replies addressed to currentUserId
  const prevReqMap = new Map((prev.directRequests || []).map((r) => [r.id, r]));
  for (const req of next.directRequests || []) {
    const oldReq = prevReqMap.get(req.id);
    if (!oldReq) {
      if (req.recipientId === currentUserId && req.senderId !== currentUserId && req.status !== 'RESOLVED') {
        const sender = memberMap.get(req.senderId);
        const senderName = sender ? getMemberDisplayName(sender, language, req.senderId) : req.senderId;
        alerts.push({
          id: `alert-req-${req.id}`,
          tag: `labflow-req-${req.id}`,
          title: isZh ? `新 1对1 申请：来自 ${senderName}` : `New 1-on-1 Request from ${senderName}`,
          body: req.title,
          viewMode: 'requests',
        });
      }
      continue;
    }

    const oldRepliesCount = oldReq.replies?.length || 0;
    const newReplies = req.replies || [];
    if (
      newReplies.length > oldRepliesCount &&
      (req.senderId === currentUserId || req.recipientId === currentUserId)
    ) {
      const latestReply = newReplies[newReplies.length - 1];
      if (latestReply && latestReply.authorId !== currentUserId) {
        const replier = memberMap.get(latestReply.authorId);
        const replierName = replier
          ? getMemberDisplayName(replier, language, latestReply.authorId)
          : latestReply.authorId;
        alerts.push({
          id: `alert-reply-${req.id}-${latestReply.id}`,
          tag: `labflow-req-${req.id}`,
          title: isZh ? `${replierName} 回复了申请` : `${replierName} replied to request`,
          body: `${req.title}: ${latestReply.content.slice(0, 90)}`,
          viewMode: 'requests',
        });
      }
    }
  }

  // 2. Tasks escalated to currentUserId as blocker OR moved to PI_REVIEW when currentUserId is PI
  const prevTaskMap = new Map((prev.tasks || []).map((t) => [t.id, t]));
  for (const task of next.tasks || []) {
    const oldTask = prevTaskMap.get(task.id);
    if (!oldTask) continue;

    if (
      task.isBlocked &&
      task.blocker?.escalatedToId === currentUserId &&
      (!oldTask.isBlocked || oldTask.blocker?.reportedAt !== task.blocker?.reportedAt)
    ) {
      const leadName = task.leadAuthor
        ? getMemberDisplayName(task.leadAuthor, language, task.leadAuthor.id)
        : '';
      alerts.push({
        id: `alert-blocker-${task.id}-${task.blocker.reportedAt}`,
        tag: `labflow-blk-${task.id}`,
        title: isZh ? `卡点求助指派给你 (${leadName})` : `Blocker Escalated to You (${leadName})`,
        body: `[${task.projectTag}] ${task.title}`,
        viewMode: 'kanban',
        taskId: task.id,
      });
    } else if (
      task.stage === 'PI_REVIEW' &&
      oldTask.stage !== 'PI_REVIEW' &&
      task.pi?.id === currentUserId &&
      task.leadAuthor?.id !== currentUserId
    ) {
      const leadName = task.leadAuthor
        ? getMemberDisplayName(task.leadAuthor, language, task.leadAuthor.id)
        : '';
      alerts.push({
        id: `alert-pirev-${task.id}`,
        tag: `labflow-pirev-${task.id}`,
        title: isZh ? `待导师审阅 (PI Review) · ${leadName}` : `Ready for PI Review · ${leadName}`,
        body: `[${task.projectTag}] ${task.title}`,
        viewMode: 'kanban',
        taskId: task.id,
      });
    }
  }

  // 3. Weekly To-Do newly assigned to currentUserId OR returned for revision
  const prevTodoMap = new Map((prev.weeklyTodos || []).map((w) => [w.id, w]));
  for (const todo of next.weeklyTodos || []) {
    if (todo.memberId !== currentUserId) continue;
    const oldTodo = prevTodoMap.get(todo.id);
    if (!oldTodo) {
      if (todo.assignedById && todo.assignedById !== currentUserId) {
        const assigner = memberMap.get(todo.assignedById);
        const assignerName = assigner
          ? getMemberDisplayName(assigner, language, todo.assignedById)
          : '';
        alerts.push({
          id: `alert-todo-${todo.id}`,
          tag: `labflow-todo-${todo.id}`,
          title: isZh
            ? `本周新增指派 To-Do (${assignerName})`
            : `New Weekly To-Do Assigned (${assignerName})`,
          body: todo.title,
          viewMode: 'todos',
        });
      }
      continue;
    }

    if (
      todo.acceptanceStatus === 'REVISION_REQUESTED' &&
      oldTodo.acceptanceStatus !== 'REVISION_REQUESTED'
    ) {
      alerts.push({
        id: `alert-todo-rev-${todo.id}`,
        tag: `labflow-todo-${todo.id}`,
        title: isZh ? `每周 To-Do 需修订后再提交` : `Weekly To-Do Revision Requested`,
        body: todo.title,
        viewMode: 'todos',
      });
    }
  }

  return alerts;
}
