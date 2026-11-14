import { describe, expect, it } from 'vitest';
import { LAB_MEMBERS, INITIAL_PROJECTS, INITIAL_TASKS } from '@/data/mockData';
import {
  ACCESS_ROLE_RANK,
  canAdvanceToStage,
  canAssignAccessRole,
  canDeleteTask,
  canEditTask,
  canManageLabRole,
  canViewProject,
  canViewTask,
  deriveAccessRole,
  getSafeLeadAuthor,
  getSafePI,
} from '@/utils/rbac';

describe('RBAC helpers', () => {
  const piMember = LAB_MEMBERS[0];
  const leadMember = LAB_MEMBERS[1];
  const studentMember = LAB_MEMBERS[3];
  const guestMember = {
    ...LAB_MEMBERS[5],
    accessRole: undefined,
  };

  it('derives access roles consistently from explicit override or academic rank', () => {
    expect(deriveAccessRole(piMember)).toBe('ADMIN_PI');
    expect(deriveAccessRole(leadMember)).toBe('PROJECT_LEAD');
    expect(deriveAccessRole(studentMember)).toBe('STUDENT_RA');
    expect(deriveAccessRole(guestMember)).toBe('AUDITOR_GUEST');
  });

  it('safely picks fallback lead authors and PIs even for 1-member labs', () => {
    const soloLab = [studentMember];
    expect(getSafeLeadAuthor(soloLab, 'non-existent-id')).toEqual(studentMember);
    expect(getSafePI(soloLab)).toEqual(studentMember);
    expect(getSafeLeadAuthor([])).toBeUndefined();
    expect(getSafePI([])).toBeUndefined();
  });

  it('enforces task visibility scopes cleanly', () => {
    const baseTask = INITIAL_TASKS[0];
    const teamOnly = { ...baseTask, visibility: 'TEAM_ONLY' as const, leadAuthor: studentMember };
    const piOnly = { ...baseTask, visibility: 'PI_ONLY' as const, leadAuthor: studentMember, pi: piMember };

    expect(canViewTask(teamOnly, guestMember.id, 'AUDITOR_GUEST', false, INITIAL_PROJECTS)).toBe(false);
    expect(canViewTask(teamOnly, studentMember.id, 'STUDENT_RA', false, INITIAL_PROJECTS)).toBe(true);

    expect(canViewTask(piOnly, 'other-student', 'STUDENT_RA', false, INITIAL_PROJECTS)).toBe(false);
    expect(canViewTask(piOnly, piMember.id, 'ADMIN_PI', true, INITIAL_PROJECTS)).toBe(true);
    expect(canViewTask(piOnly, studentMember.id, 'STUDENT_RA', false, INITIAL_PROJECTS)).toBe(true);

    const confidentialProject = { ...INITIAL_PROJECTS[0], visibility: 'PI_ONLY' as const };
    expect(canViewProject(confidentialProject, 'other', 'STUDENT_RA', false)).toBe(false);
    expect(canViewProject(confidentialProject, piMember.id, 'ADMIN_PI', true)).toBe(true);
  });

  it('enforces edit, delete, and stage-acceptance permissions', () => {
    const task = { ...INITIAL_TASKS[0], leadAuthor: studentMember, pi: piMember };

    expect(canEditTask(task, studentMember.id, 'STUDENT_RA', false, INITIAL_PROJECTS)).toBe(true);
    expect(canEditTask(task, 'other-student', 'STUDENT_RA', false, INITIAL_PROJECTS)).toBe(false);
    expect(canEditTask(task, guestMember.id, 'AUDITOR_GUEST', false, INITIAL_PROJECTS)).toBe(false);
    expect(canEditTask(task, piMember.id, 'ADMIN_PI', true, INITIAL_PROJECTS)).toBe(true);

    expect(canDeleteTask(task, studentMember.id, 'STUDENT_RA', false)).toBe(false);
    expect(canDeleteTask(task, leadMember.id, 'PROJECT_LEAD', false)).toBe(
      task.leadAuthor.id === leadMember.id
    );
    expect(canDeleteTask(task, piMember.id, 'ADMIN_PI', true)).toBe(true);

    expect(canAdvanceToStage('ACCEPTED', 'STUDENT_RA', false)).toBe(false);
    expect(canAdvanceToStage('ACCEPTED', 'PROJECT_LEAD', false)).toBe(true);
    expect(canAdvanceToStage('ACCEPTED', 'SYS_ADMIN', false)).toBe(true);
    expect(canAdvanceToStage('ACCEPTED', 'ADMIN_PI', true)).toBe(true);
  });

  it('places SYS_ADMIN strictly below ADMIN_PI and strictly above all other student roles', () => {
    expect(ACCESS_ROLE_RANK.ADMIN_PI).toBeGreaterThan(ACCESS_ROLE_RANK.SYS_ADMIN);
    expect(ACCESS_ROLE_RANK.SYS_ADMIN).toBeGreaterThan(ACCESS_ROLE_RANK.PROJECT_LEAD);
    expect(ACCESS_ROLE_RANK.PROJECT_LEAD).toBeGreaterThan(ACCESS_ROLE_RANK.STUDENT_RA);
    expect(ACCESS_ROLE_RANK.STUDENT_RA).toBeGreaterThan(ACCESS_ROLE_RANK.AUDITOR_GUEST);

    const sysAdmin = { ...studentMember, id: 'member-sysadmin', accessRole: 'SYS_ADMIN' as const };
    expect(deriveAccessRole(sysAdmin)).toBe('SYS_ADMIN');

    const baseTask = INITIAL_TASKS[0];
    const otherStudentTask = {
      ...baseTask,
      visibility: 'TEAM_ONLY' as const,
      leadAuthor: studentMember,
      pi: piMember,
    };
    const piConfidentialTask = {
      ...baseTask,
      visibility: 'PI_ONLY' as const,
      leadAuthor: studentMember,
      pi: piMember,
    };
    const confidentialProject = { ...INITIAL_PROJECTS[0], visibility: 'PI_ONLY' as const };
    const teamProject = { ...INITIAL_PROJECTS[0], visibility: 'TEAM_ONLY' as const };

    // SysAdmin can coordinate & manage non-PI-only tasks/projects across all students
    expect(canViewTask(otherStudentTask, sysAdmin.id, 'SYS_ADMIN', false, INITIAL_PROJECTS)).toBe(true);
    expect(canEditTask(otherStudentTask, sysAdmin.id, 'SYS_ADMIN', false, INITIAL_PROJECTS)).toBe(true);
    expect(canDeleteTask(otherStudentTask, sysAdmin.id, 'SYS_ADMIN', false)).toBe(true);
    expect(canViewProject(teamProject, sysAdmin.id, 'SYS_ADMIN', false)).toBe(true);
    expect(canManageLabRole('SYS_ADMIN', false)).toBe(true);
    expect(canManageLabRole('PROJECT_LEAD', false)).toBe(false);

    // SysAdmin remains below PI: cannot view/edit/delete unrelated PI_ONLY items
    expect(canViewTask(piConfidentialTask, sysAdmin.id, 'SYS_ADMIN', false, INITIAL_PROJECTS)).toBe(false);
    expect(canEditTask(piConfidentialTask, sysAdmin.id, 'SYS_ADMIN', false, INITIAL_PROJECTS)).toBe(false);
    expect(canDeleteTask(piConfidentialTask, sysAdmin.id, 'SYS_ADMIN', false)).toBe(false);
    expect(canViewProject(confidentialProject, sysAdmin.id, 'SYS_ADMIN', false)).toBe(false);

    // Role delegation guard: only unlocked PI can appoint/revoke SYS_ADMIN or ADMIN_PI
    expect(canAssignAccessRole(true, 'ADMIN_PI', 'STUDENT_RA', 'SYS_ADMIN')).toBe(true);
    expect(canAssignAccessRole(false, 'SYS_ADMIN', 'STUDENT_RA', 'PROJECT_LEAD')).toBe(true);
    expect(canAssignAccessRole(false, 'SYS_ADMIN', 'STUDENT_RA', 'SYS_ADMIN')).toBe(false);
    expect(canAssignAccessRole(false, 'SYS_ADMIN', 'STUDENT_RA', 'ADMIN_PI')).toBe(false);
    expect(canAssignAccessRole(false, 'SYS_ADMIN', 'ADMIN_PI', 'STUDENT_RA')).toBe(false);
    expect(canAssignAccessRole(false, 'PROJECT_LEAD', 'STUDENT_RA', 'PROJECT_LEAD')).toBe(false);
  });
});
