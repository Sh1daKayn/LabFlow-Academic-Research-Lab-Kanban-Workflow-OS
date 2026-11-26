import { DirectRequest, LabMember, ProjectItem, TaskItem } from '@/types';
import { getProjectMembers } from '@/utils/projectAnalytics';

export interface MemberWorkloadSummary {
  memberId: string;
  projectCount: number;
  taskCount: number;
  piTaskCount: number;
  blockedCount: number;
  escalatedBlockerCount: number;
  openRequestsToMeCount: number;
  attentionCount: number;
}

/**
 * Normalizes a member display name for case-insensitive duplicate matching.
 */
export function normalizeMemberNameForMatch(name?: string | null): string {
  return (name || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * Returns existing members whose English or Chinese display name matches `candidateName`
 * case-insensitively after trimming whitespace.
 */
export function findMatchingMembersByName(
  members: LabMember[],
  candidateName: string,
  altCandidateName?: string
): LabMember[] {
  const needles = [
    normalizeMemberNameForMatch(candidateName),
    normalizeMemberNameForMatch(altCandidateName),
  ].filter(Boolean);
  if (needles.length === 0) return [];
  return members.filter((member) => {
    const en = normalizeMemberNameForMatch(member.nameEn);
    const zh = normalizeMemberNameForMatch(member.nameZh);
    return needles.some((needle) => en === needle || zh === needle);
  });
}

/**
 * Groups roster members sharing the exact same normalized name so managers can merge duplicates cleanly.
 */
export function findDuplicateMemberGroups(
  members: LabMember[]
): Array<{ key: string; displayName: string; members: LabMember[] }> {
  const groups = new Map<string, LabMember[]>();
  for (const member of members) {
    const key =
      normalizeMemberNameForMatch(member.nameEn) || normalizeMemberNameForMatch(member.nameZh);
    if (!key) continue;
    const bucket = groups.get(key) || [];
    bucket.push(member);
    groups.set(key, bucket);
  }
  const duplicates: Array<{ key: string; displayName: string; members: LabMember[] }> = [];
  groups.forEach((groupMembers, key) => {
    if (groupMembers.length > 1) {
      duplicates.push({
        key,
        displayName: groupMembers[0].nameEn || groupMembers[0].nameZh,
        members: groupMembers,
      });
    }
  });
  return duplicates;
}

/**
 * Computes per-member project count, active task load, owned blockers, escalated review load,
 * and pending 1-on-1 request count so bottlenecks stand out across Meeting & Roster views.
 */
export function computeMemberWorkloadMap(
  members: LabMember[],
  projects: ProjectItem[],
  tasks: TaskItem[],
  directRequests: DirectRequest[]
): Record<string, MemberWorkloadSummary> {
  const result: Record<string, MemberWorkloadSummary> = {};
  const projectSets = new Map<string, Set<string>>();

  for (const member of members) {
    result[member.id] = {
      memberId: member.id,
      projectCount: 0,
      taskCount: 0,
      piTaskCount: 0,
      blockedCount: 0,
      escalatedBlockerCount: 0,
      openRequestsToMeCount: 0,
      attentionCount: 0,
    };
    projectSets.set(member.id, new Set<string>());
  }

  for (const project of projects) {
    const contributing = getProjectMembers(project, tasks, members);
    for (const member of contributing) {
      projectSets.get(member.id)?.add(project.id);
    }
  }

  for (const task of tasks) {
    const isArchived = task.stage === 'ACCEPTED' || Boolean(task.completedAt);
    const leadId = task.leadAuthor?.id;
    const piId = task.pi?.id;

    if (leadId && result[leadId] && !isArchived) {
      result[leadId].taskCount += 1;
      if (task.isBlocked) {
        result[leadId].blockedCount += 1;
      }
    }

    if (piId && result[piId] && !isArchived) {
      result[piId].piTaskCount += 1;
    }

    if (task.isBlocked && task.blocker?.escalatedToId && result[task.blocker.escalatedToId]) {
      result[task.blocker.escalatedToId].escalatedBlockerCount += 1;
    }
  }

  for (const req of directRequests) {
    if (req.status === 'RESOLVED') continue;
    if (req.recipientId && result[req.recipientId]) {
      result[req.recipientId].openRequestsToMeCount += 1;
    }
  }

  for (const member of members) {
    const summary = result[member.id];
    summary.projectCount = projectSets.get(member.id)?.size || 0;
    summary.attentionCount =
      summary.blockedCount + summary.escalatedBlockerCount + summary.openRequestsToMeCount;
  }

  return result;
}
