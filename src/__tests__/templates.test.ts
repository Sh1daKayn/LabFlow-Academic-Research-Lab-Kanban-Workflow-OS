import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CHECKLIST_TEMPLATES,
  sanitizeChecklistTemplates,
  parseMultilineTemplateEntries,
  buildChecklistItemsFromTemplate,
  buildWeeklyTodosFromTemplate,
} from '@/utils/templates';
import { ChecklistAcceptanceTemplate, TaskItem, WeeklyTodoItem } from '@/types';

describe('Checklist & Acceptance Templates', () => {
  it('seeds starter templates for undefined/legacy input while preserving explicit empty arrays', () => {
    const legacy = sanitizeChecklistTemplates(undefined);
    expect(legacy).toHaveLength(DEFAULT_CHECKLIST_TEMPLATES.length);
    expect(legacy[0]?.items.length).toBeGreaterThan(0);

    const cleared = sanitizeChecklistTemplates([]);
    expect(cleared).toEqual([]);
  });

  it('sanitizes invalid templates, blank entries, and unknown priorities', () => {
    const sanitized = sanitizeChecklistTemplates([
      { name: '   ', items: [{ text: 'Valid step' }] },
      { name: 'No Valid Items', items: [{ text: '  ' }, null] },
      {
        id: 'tpl-custom-1',
        name: ' 实验周自检 ',
        category: ' 消融 ',
        items: [
          {
            text: ' 对齐基线指标 ',
            acceptanceCriteria: ' 误差 <= 0.5% ',
            priority: 'URGENT',
          },
          {
            text: '导出训练曲线',
            priority: 'INVALID_PRIORITY',
          },
        ],
      },
    ]);

    expect(sanitized).toHaveLength(1);
    expect(sanitized[0].id).toBe('tpl-custom-1');
    expect(sanitized[0].name).toBe('实验周自检');
    expect(sanitized[0].category).toBe('消融');
    expect(sanitized[0].items).toEqual([
      {
        text: '对齐基线指标',
        acceptanceCriteria: '误差 <= 0.5%',
        priority: 'URGENT',
      },
      {
        text: '导出训练曲线',
        acceptanceCriteria: undefined,
        priority: undefined,
      },
    ]);
  });

  it('parses multiline batch text with ASCII or full-width pipes and list prefixes', () => {
    const entries = parseMultilineTemplateEntries(`
      1. 跑通端到端训练 | Loss 收敛且无 NaN
      - 检查显存峰值 ｜ 单卡 <= 24GB
      * 备份最佳权重到 NAS

      （空白行应被忽略）
    `);

    expect(entries).toHaveLength(4);
    expect(entries[0]).toEqual({
      text: '跑通端到端训练',
      acceptanceCriteria: 'Loss 收敛且无 NaN',
      priority: 'MEDIUM',
    });
    expect(entries[1]).toEqual({
      text: '检查显存峰值',
      acceptanceCriteria: '单卡 <= 24GB',
      priority: 'MEDIUM',
    });
    expect(entries[2]).toEqual({
      text: '备份最佳权重到 NAS',
      priority: 'MEDIUM',
    });
    expect(entries[3]).toEqual({
      text: '（空白行应被忽略）',
      priority: 'MEDIUM',
    });
  });

  it('injects template items into task checklist while skipping duplicate titles cleanly', () => {
    const template: ChecklistAcceptanceTemplate = {
      id: 'tpl-1',
      name: '投稿核查',
      items: [
        { text: '双盲去作者信息', acceptanceCriteria: 'PDF 无泄露', priority: 'URGENT' },
        { text: '补充消融误差棒', acceptanceCriteria: '5 seeds mean±std', priority: 'HIGH' },
      ],
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    };

    const existingChecklist = [{ id: 'chk-existing', text: '  双盲去作者信息 ', done: true }];
    const result = buildChecklistItemsFromTemplate(template, existingChecklist);

    expect(result.skippedCount).toBe(1);
    expect(result.addedItems).toHaveLength(1);
    expect(result.addedItems[0].text).toBe('补充消融误差棒');
    expect(result.addedItems[0].done).toBe(false);
    expect(result.nextChecklist).toHaveLength(2);
    expect(result.matchedEntries).toHaveLength(2);
    expect(result.matchedEntries[0].checklistItem.id).toBe('chk-existing');
    expect(result.matchedEntries[1].checklistItem.id).toBe(result.addedItems[0].id);
  });

  it('builds weekly todos carrying acceptance criteria and avoids duplicates per member & week', () => {
    const template: ChecklistAcceptanceTemplate = {
      id: 'tpl-2',
      name: '实验周模板',
      items: [
        { text: '双盲去作者信息', acceptanceCriteria: 'PDF 零姓名泄露', priority: 'URGENT' },
        { text: '整理失败案例集', acceptanceCriteria: '至少 5 条 Case', priority: 'LOW' },
      ],
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    };

    const task = {
      id: 'task-1',
      projectId: 'proj-1',
      priority: 'HIGH',
    } as TaskItem;

    const checklistLinks = [
      {
        checklistItem: { id: 'chk-1', text: '双盲去作者信息', done: true },
        entry: template.items[0],
      },
      {
        checklistItem: { id: 'chk-2', text: '整理失败案例集', done: false },
        entry: template.items[1],
      },
    ];

    const existingTodos: WeeklyTodoItem[] = [
      {
        id: 'todo-old',
        memberId: 'stu-1',
        weekKey: '2026-W46',
        title: '双盲去作者信息',
        done: true,
        priority: 'URGENT',
        projectId: 'proj-1',
        taskId: 'task-1',
        checklistItemId: 'chk-1',
        acceptanceCriteria: 'PDF 零姓名泄露',
        acceptanceStatus: 'ACCEPTED',
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-01T00:00:00.000Z',
      },
    ];

    const sameWeekResult = buildWeeklyTodosFromTemplate({
      template,
      memberId: 'stu-1',
      weekKey: '2026-W46',
      task,
      checklistLinks,
      existingTodos,
    });

    expect(sameWeekResult.skippedCount).toBe(1);
    expect(sameWeekResult.addedTodos).toHaveLength(1);
    expect(sameWeekResult.addedTodos[0]).toMatchObject({
      memberId: 'stu-1',
      weekKey: '2026-W46',
      title: '整理失败案例集',
      done: false,
      priority: 'LOW',
      projectId: 'proj-1',
      taskId: 'task-1',
      checklistItemId: 'chk-2',
      acceptanceCriteria: '至少 5 条 Case',
      acceptanceStatus: 'PENDING',
    });

    const nextWeekResult = buildWeeklyTodosFromTemplate({
      template,
      memberId: 'stu-1',
      weekKey: '2026-W47',
      task,
      checklistLinks,
      existingTodos,
    });

    expect(nextWeekResult.skippedCount).toBe(0);
    expect(nextWeekResult.addedTodos).toHaveLength(2);
    expect(nextWeekResult.addedTodos[0].done).toBe(true);
    expect(nextWeekResult.addedTodos[0].acceptanceStatus).toBe('SUBMITTED');
  });
});
