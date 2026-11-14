import { describe, expect, it } from 'vitest';
import {
  DEFAULT_STAGES,
  INITIAL_PROJECTS,
  INITIAL_RESOURCES,
  INITIAL_TASKS,
  LAB_MEMBERS,
} from '@/data/mockData';
import {
  formatCountdownBadge,
  formatDate,
  generateMeetingMinutesMarkdown,
  subtractDays,
} from '@/utils/date';

describe('Date and meeting digest utilities', () => {
  it('subtracts days cleanly in ISO YYYY-MM-DD format', () => {
    expect(subtractDays('2026-10-15', 14)).toBe('2026-10-01');
    expect(subtractDays('not-a-date', 5)).toBe('not-a-date');
  });

  it('formats dates and empty fallbacks for both zh and en', () => {
    expect(formatDate(undefined, 'zh')).toBe('待定');
    expect(formatDate(undefined, 'en')).toBe('TBD');
    expect(formatDate('2026-08-19T00:00:00Z', 'zh')).toContain('2026年');
  });

  it('produces urgency countdown badge labels for missing, overdue, and future dates', () => {
    expect(formatCountdownBadge(undefined, 'en').text).toBe('No DDL');
    expect(formatCountdownBadge('2000-01-01', 'en').isUrgent).toBe(true);
    expect(formatCountdownBadge('2099-01-01', 'en').isUrgent).toBe(false);
  });

  it('generates structured Markdown minutes separating blockers, active tasks, and compute status', () => {
    const md = generateMeetingMinutesMarkdown({
      labName: 'AI & Systems Lab',
      piName: LAB_MEMBERS[0].nameEn,
      members: LAB_MEMBERS,
      tasks: INITIAL_TASKS,
      projects: INITIAL_PROJECTS,
      resources: INITIAL_RESOURCES,
      stages: DEFAULT_STAGES,
      lang: 'en',
    });

    expect(md).toContain('# 📝 LabFlow Group Meeting Minutes');
    expect(md).toContain('Critical Blockers Requiring PI Decision');
    expect(md).toContain('Compute & Shared Lab Resource Status');
    expect(md).toContain('Generated automatically by LabFlow OS');
  });
});
