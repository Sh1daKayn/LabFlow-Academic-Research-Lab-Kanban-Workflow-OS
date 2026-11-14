import { AccessRole, LabMember, ProjectItem, TaskItem } from '@/types';

/**
 * Strict permission hierarchy from highest (5) to lowest (1):
 * ADMIN_PI (5) > SYS_ADMIN (4) > PROJECT_LEAD (3) > STUDENT_RA (2) > AUDITOR_GUEST (1)
 */
export const ACCESS_ROLE_RANK: Record<AccessRole, number> = {
  ADMIN_PI: 5,
  SYS_ADMIN: 4,
  PROJECT_LEAD: 3,
  STUDENT_RA: 2,
  AUDITOR_GUEST: 1,
};

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

export function isSysAdminRole(role?: AccessRole): boolean {
  return role === 'SYS_ADMIN';
}

/**
 * Whether the current actor can access shared lab operations management
 * (members onboarding/coordination, GPUs, stages, venues, non-destructive imports).
 */
export function canManageLabRole(role: AccessRole, effectiveIsAdmin: boolean): boolean {
  return effectiveIsAdmin || role === 'SYS_ADMIN';
}

/**
 * Enforces role-assignment hierarchy:
 * - Unlocked PI (`ADMIN_PI`) can assign/revoke any role, including designating students as `SYS_ADMIN`.
 * - Student System Admin (`SYS_ADMIN`) can manage regular members (`PROJECT_LEAD` / `STUDENT_RA` / `AUDITOR_GUEST`),
 *   but cannot appoint or demote `ADMIN_PI` or `SYS_ADMIN`.
 */
export function canAssignAccessRole(
  actorIsUnlockedAdmin: boolean,
  actorRole: AccessRole,
  targetCurrentRole: AccessRole,
  nextRole: AccessRole
): boolean {
  if (actorIsUnlockedAdmin) return true;
  if (actorRole === 'SYS_ADMIN') {
    const elevated: AccessRole[] = ['ADMIN_PI', 'SYS_ADMIN'];
    if (elevated.includes(targetCurrentRole) || elevated.includes(nextRole)) {
      return false;
    }
    return true;
  }
  return false;
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
    if (currentAccessRole === 'SYS_ADMIN') return true;
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
    if (currentAccessRole === 'SYS_ADMIN') return true;
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
  if (currentAccessRole === 'SYS_ADMIN') {
    // System Admin can coordinate all lab Public/Team tasks across students,
    // while PI-confidential tasks remain reserved for PI / owner.
    return (
      task.visibility !== 'PI_ONLY' ||
      task.leadAuthor?.id === currentUserId ||
      task.pi?.id === currentUserId
    );
  }
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
  if (currentAccessRole === 'SYS_ADMIN') {
    return task.visibility !== 'PI_ONLY' || task.leadAuthor?.id === currentUserId;
  }
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
    return (
      effectiveIsAdmin ||
      currentAccessRole === 'SYS_ADMIN' ||
      currentAccessRole === 'PROJECT_LEAD'
    );
  }
  return true;
}
