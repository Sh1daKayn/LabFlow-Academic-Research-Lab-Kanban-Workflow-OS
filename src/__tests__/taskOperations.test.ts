import { describe, expect, it } from 'vitest';
import { DEFAULT_STAGES, INITIAL_TASKS, LAB_MEMBERS } from '@/data/mockData';
import {
  buildReverseDDLPipeline,
  moveTaskToStage,
  reorderStageTasks,
} from '@/utils/taskOperations';

describe('Task pipeline operations', () => {
  const baseTask = INITIAL_TASKS[0];

  const makeTasks = () => [
    { ...baseTask, id: 't1', stage: 'DATA_EXP', order: 0 },
    { ...baseTask, id: 't2', stage: 'DATA_EXP', order: 1 },
    { ...baseTask, id: 't3', stage: 'DATA_EXP', order: 2 },
    { ...baseTask, id: 't4', stage: 'DRAFTING', order: 0 },
  ];

  it('reorders unfiltered tasks inside the same stage', () => {
    const next = reorderStageTasks(makeTasks(), 'DATA_EXP', 0, 2);
    const orderedIds = next
      .filter((t) => t.stage === 'DATA_EXP')
      .sort((a, b) => a.order - b.order)
      .map((t) => t.id);

    expect(orderedIds).toEqual(['t2', 't3', 't1']);
  });

  it('preserves relative positions of hidden tasks when filtered IDs are supplied', () => {
    // Only t1 and t3 are visible under an active filter; dragging index 0 -> 1 swaps them around t2
    const next = reorderStageTasks(makeTasks(), 'DATA_EXP', 0, 1, ['t1', 't3']);
    const orderedIds = next
      .filter((t) => t.stage === 'DATA_EXP')
      .sort((a, b) => a.order - b.order)
      .map((t) => t.id);

    expect(orderedIds).toEqual(['t2', 't3', 't1']);
  });

  it('moves task to ACCEPTED stage, sets progress to 100%, and re-indexes order', () => {
    const next = moveTaskToStage(makeTasks(), 't2', 'ACCEPTED', 0);
    const moved = next.find((t) => t.id === 't2');
    expect(moved?.stage).toBe('ACCEPTED');
    expect(moved?.progress).toBe(100);
    expect(moved?.completedAt).toBeTruthy();
    expect(moved?.order).toBe(0);
  });

  it('generates reverse-DDL project & milestone tasks cleanly even with 1 lab member', () => {
    const result = buildReverseDDLPipeline(
      {
        title: 'Quantum Bounds on Non-Convex Optimization',
        targetVenue: 'NeurIPS 2027',
        deadlineDate: '2027-05-15',
        leadAuthorId: 'missing-id',
        tag: 'QC-Opt',
        visibility: 'TEAM_ONLY',
      },
      [LAB_MEMBERS[0]],
      DEFAULT_STAGES,
      'en'
    );

    expect(result.project.leadAuthorId).toBe(LAB_MEMBERS[0].id);
    expect(result.project.piId).toBe(LAB_MEMBERS[0].id);
    expect(result.tasks.length).toBe(4);
    expect(result.tasks[0].deadline).toBe('2027-03-31');
    expect(result.tasks.every((t) => t.visibility === 'TEAM_ONLY')).toBe(true);
  });
});
