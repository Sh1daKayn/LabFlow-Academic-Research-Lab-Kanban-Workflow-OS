import {
  DirectRequest,
  DirectRequestKind,
  DirectRequestReply,
  DirectRequestStatus,
  RequestVisibility,
  WorkspaceScope,
} from '@/types';
import { normalizeWorkCategory } from '@/utils/workCategory';

export const DIRECT_REQUEST_KINDS: {
  id: DirectRequestKind;
  labelZh: string;
  labelEn: string;
}[] = [
  { id: 'PROJECT_SYNC', labelZh: '进度汇报 / 对接', labelEn: 'Progress Sync' },
  { id: 'REVIEW', labelZh: '审阅 / 审批申请', labelEn: 'Review / Approval' },
  { id: 'BLOCKER_HELP', labelZh: '技术卡点求助', labelEn: 'Blocker Help' },
  { id: 'RESOURCE', labelZh: '算力 / 资源申请', labelEn: 'Resource Request' },
  { id: 'CHAT', labelZh: '一对一交流', labelEn: '1-on-1 Message' },
];

/**
 * Determines whether a member can view a 1-on-1 DirectRequest under the active workspace scope.
 * - PRIVATE requests are strictly visible ONLY to the sender and the single recipient.
 * - PUBLIC requests are visible to sender/recipient in MINE scope, and to all members in PUBLIC_LAB scope.
 */
export function canViewDirectRequest(
  req: DirectRequest,
  currentUserId: string,
  workspaceScope: WorkspaceScope
): boolean {
  const isParticipant = req.senderId === currentUserId || req.recipientId === currentUserId;
  if (req.visibility === 'PRIVATE') {
    return isParticipant;
  }
  if (workspaceScope === 'MINE') {
    return isParticipant;
  }
  return true;
}

export function sanitizeDirectRequests(raw: unknown): DirectRequest[] {
  if (!Array.isArray(raw)) return [];
  const validKinds = new Set<DirectRequestKind>([
    'REVIEW',
    'BLOCKER_HELP',
    'RESOURCE',
    'PROJECT_SYNC',
    'CHAT',
  ]);
  const validStatuses = new Set<DirectRequestStatus>(['OPEN', 'REPLIED', 'RESOLVED']);

  return raw
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map((item, idx): DirectRequest | null => {
      const senderId = typeof item.senderId === 'string' ? item.senderId.trim() : '';
      const recipientId = typeof item.recipientId === 'string' ? item.recipientId.trim() : '';
      const title = typeof item.title === 'string' ? item.title.trim() : '';
      if (!senderId || !recipientId || !title) return null;

      const kindRaw = String(item.kind || 'CHAT') as DirectRequestKind;
      const kind: DirectRequestKind = validKinds.has(kindRaw) ? kindRaw : 'CHAT';
      const visibility: RequestVisibility =
        item.visibility === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE';
      const statusRaw = String(item.status || 'OPEN') as DirectRequestStatus;
      const status: DirectRequestStatus = validStatuses.has(statusRaw) ? statusRaw : 'OPEN';

      const replies: DirectRequestReply[] = Array.isArray(item.replies)
        ? item.replies
            .filter(
              (r): r is Record<string, unknown> =>
                Boolean(r && typeof r === 'object' && typeof r.content === 'string')
            )
            .map((r, rIdx) => ({
              id: typeof r.id === 'string' && r.id ? r.id : `reply-${idx}-${rIdx}`,
              authorId: typeof r.authorId === 'string' ? r.authorId : senderId,
              content: String(r.content).trim(),
              createdAt:
                typeof r.createdAt === 'string' && r.createdAt
                  ? r.createdAt
                  : new Date().toISOString(),
            }))
            .filter((r) => r.content.length > 0)
        : [];

      const now = new Date().toISOString();
      return {
        id: typeof item.id === 'string' && item.id ? item.id : `req-${Date.now()}-${idx}`,
        kind,
        title,
        content: typeof item.content === 'string' ? item.content.trim() : '',
        senderId,
        recipientId,
        visibility,
        status,
        workCategory: item.workCategory
          ? normalizeWorkCategory(String(item.workCategory))
          : undefined,
        projectId: typeof item.projectId === 'string' && item.projectId ? item.projectId : undefined,
        taskId: typeof item.taskId === 'string' && item.taskId ? item.taskId : undefined,
        dueDate: typeof item.dueDate === 'string' && item.dueDate ? item.dueDate : undefined,
        replies,
        createdAt: typeof item.createdAt === 'string' && item.createdAt ? item.createdAt : now,
        updatedAt: typeof item.updatedAt === 'string' && item.updatedAt ? item.updatedAt : now,
      };
    })
    .filter((item): item is DirectRequest => item !== null);
}
