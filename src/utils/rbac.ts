import { AccessRole, LabMember, ProjectItem, TaskItem } from '@/types';

/**
 * Resolves the effective RBAC role for a lab member.
 */
export function deriveAccessRole(member?: LabMember): AccessRole {
  if (member?.accessRole) return member.accessRole;
  if (member?.role === 'PI') return 'ADMIN_PI';
  if (member?.role === 'POSTDOC' || member?.role === 'SENIOR_PHD') return 'PROJECT_LEAD';
  if (member?.role === 'VISITING_SCHOLAR') return 'AUDITOR_GUEST';
  return 'STUDENT_RA';
}

export function getSafeLeadAuthor(members: LabMember[], preferredId?: string): LabMember | undefined {
  if (!members || members.length === 0) return undefined;
  if (preferredId) {
    const matched = members.find((m) => m.id === preferredId);
    if (matched) return matched;
  }
  return members[0];
}

export function getSafePI(members: LabMember[]): LabMember | undefined {
  if (!members || members.length === 0) return undefined;
  return (
    members.find((m) => m.role === 'PI' || m.accessRole === 'ADMIN_PI') ||
    members[0]
  );
}

export function canViewTask(
  task: TaskItem,
  currentUserId: string,
  currentAccessRole: AccessRole,
  effectiveIsAdmin: boolean,
  projects: ProjectItem[]
): boolean {
  const vis = task.visibility || 'PUBLIC';
  if (vis === 'PUBLIC') return true;
  if (effectiveIsAdmin) return true;
  if (vis === 'TEAM_ONLY') {
    if (currentAccessRole === 'AUDITOR_GUEST') return false;
    const isAuthor = task.leadAuthor?.id === currentUserId;
    const project = projects.find((p) => p.id === task.projectId);
    const isProjLead = project?.leadAuthorId === currentUserId;
    return isAuthor || isProjLead;
  }
  if (vis === 'PI_ONLY') {
    return task.leadAuthor?.id === currentUserId || task.pi?.id === currentUserId;
  }
  return true;
}

export function canViewProject(
  project: ProjectItem,
  currentUserId: string,
  currentAccessRole: AccessRole,
  effectiveIsAdmin: boolean
): boolean {
  const vis = project.visibility || 'PUBLIC';
  if (vis === 'PUBLIC') return true;
  if (effectiveIsAdmin) return true;
  if (vis === 'TEAM_ONLY') {
    if (currentAccessRole === 'AUDITOR_GUEST') return false;
    return project.leadAuthorId === currentUserId;
  }
  if (vis === 'PI_ONLY') {
    return project.leadAuthorId === currentUserId || project.piId === currentUserId;
  }
  return true;
}

export function canEditTask(
  task: TaskItem,
  currentUserId: string,
  currentAccessRole: AccessRole,
  effectiveIsAdmin: boolean,
  projects: ProjectItem[]
): boolean {
  if (effectiveIsAdmin) return true;
  if (currentAccessRole === 'AUDITOR_GUEST') return false;
  if (currentAccessRole === 'PROJECT_LEAD') {
    const isLead = task.leadAuthor?.id === currentUserId || task.pi?.id === currentUserId;
    const project = projects.find((p) => p.id === task.projectId);
    return isLead || project?.leadAuthorId === currentUserId;
  }
  if (currentAccessRole === 'STUDENT_RA') {
    return task.leadAuthor?.id === currentUserId;
  }
  return false;
}

export function canDeleteTask(
  task: TaskItem,
  currentUserId: string,
  currentAccessRole: AccessRole,
  effectiveIsAdmin: boolean
): boolean {
  if (effectiveIsAdmin) return true;
  if (currentAccessRole === 'PROJECT_LEAD') {
    return task.leadAuthor?.id === currentUserId;
  }
  return false;
}

export function canAdvanceToStage(
  targetStage: string,
  currentAccessRole: AccessRole,
  effectiveIsAdmin: boolean
): boolean {
  if (targetStage === 'ACCEPTED') {
    return effectiveIsAdmin || currentAccessRole === 'PROJECT_LEAD';
  }
  return true;
}
