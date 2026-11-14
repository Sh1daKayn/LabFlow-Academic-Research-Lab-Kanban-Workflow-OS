import { describe, expect, it } from 'vitest';
import { LAB_MEMBERS, INITIAL_PROJECTS, INITIAL_TASKS } from '@/data/mockData';
import {
  canAdvanceToStage,
  canDeleteTask,
  canEditTask,
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
    expect(canAdvanceToStage('ACCEPTED', 'ADMIN_PI', true)).toBe(true);
  });
});
