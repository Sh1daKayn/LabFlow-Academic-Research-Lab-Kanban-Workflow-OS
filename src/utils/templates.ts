import {
  ChecklistAcceptanceTemplate,
  ChecklistItem,
  ChecklistTemplateEntry,
  Priority,
  TaskItem,
  WeeklyTodoItem,
} from '@/types';
import { getWeekKey } from '@/utils/weeklyTodos';

const VALID_PRIORITIES = new Set<Priority>(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

export const DEFAULT_CHECKLIST_TEMPLATES: ChecklistAcceptanceTemplate[] = [
  {
    id: 'tpl-top-venue-rubric',
    name: '顶会投稿与双盲核查模板',
    category: '投稿核查',
    description: '适用于 NeurIPS / ICML / ICLR / CVPR / ACL 等顶会定稿与可复现性自检',
    items: [
      {
        text: '【双盲匿名】清除论文及附录中所有作者姓名、致谢、机构标识与非匿名仓库链接',
        acceptanceCriteria: '导出 PDF 全文检索引号无作者名、单位与真实 GitHub URL 泄露',
        priority: 'URGENT',
      },
      {
        text: '【可复现性】提供随机数种子配置、超参数网格与环境依赖清单 (conda/docker)',
        acceptanceCriteria: '新建干净环境按 README 命令可在 15 分钟内跑通 Smoke Test',
        priority: 'HIGH',
      },
      {
        text: '【实验统计】核心主实验与消融完成至少 5 次随机种子并报告均值与标准差 (std/CI)',
        acceptanceCriteria: '表格与正文数值完全对齐且附图含误差棒',
        priority: 'HIGH',
      },
      {
        text: '【理论与伦理】核验引理完整推导附录、局限性讨论与合规伦理声明',
        acceptanceCriteria: '附录定理编号与正文交叉引用无断链，Overleaf 零引用报错',
        priority: 'MEDIUM',
      },
    ],
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'tpl-weekly-experiment-cycle',
    name: '模型实验与消融验证周模板',
    category: '周实验',
    description: '适用于实验推进周的基线对齐、消融对比及失败案例复盘',
    items: [
      {
        text: '复现主流基线方法并在目标数据集对齐原始论文精度',
        acceptanceCriteria: '附上实验日志链接与对比表格（主指标误差 ≤1%）',
        priority: 'HIGH',
      },
      {
        text: '设计并跑通核心模块消融实验（Ablation Study）',
        acceptanceCriteria: '输出各变体精度/吞吐/显存占用完整数据表',
        priority: 'HIGH',
      },
      {
        text: '整理本周典型失败案例（Failure Cases）与误差原因分析',
        acceptanceCriteria: '汇总至少 5 条典型 Case 截图及下一步改进假设',
        priority: 'MEDIUM',
      },
    ],
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'tpl-draft-figures-polish',
    name: '论文初稿与图表规范模板',
    category: '撰写打磨',
    description: '适用于初稿成文阶段的框架图绘制、文字润色与参考文献校准',
    items: [
      {
        text: '绘制方法总览图（Figure 1）与核心架构流程图（矢量导出）',
        acceptanceCriteria: '输出清晰矢量 PDF/SVG，图例符号与正文公式 100% 一致',
        priority: 'HIGH',
      },
      {
        text: '完成 Related Work 脉络梳理与实验章节定量分析撰写',
        acceptanceCriteria: '组内骨干/导师完成一轮批注阅读，无逻辑断层与口语化表达',
        priority: 'MEDIUM',
      },
      {
        text: '逐条核验参考文献 BibTeX（作者缩写、会议简称、年份与页码统一）',
        acceptanceCriteria: 'Overleaf BibTeX 零 Warning，核心对比文献引用完整',
        priority: 'LOW',
      },
    ],
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  },
];

function sanitizeTemplateEntries(input: unknown): ChecklistTemplateEntry[] {
  if (!Array.isArray(input)) return [];
  const entries: ChecklistTemplateEntry[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue;
    const obj = raw as Partial<ChecklistTemplateEntry>;
    const text = typeof obj.text === 'string' ? obj.text.trim() : '';
    if (!text) continue;
    const criteria =
      typeof obj.acceptanceCriteria === 'string' && obj.acceptanceCriteria.trim()
        ? obj.acceptanceCriteria.trim()
        : undefined;
    const priority = obj.priority && VALID_PRIORITIES.has(obj.priority) ? obj.priority : undefined;
    entries.push({
      text,
      acceptanceCriteria: criteria,
      priority,
    });
  }
  return entries;
}

/**
 * Normalizes checklist & acceptance templates from workspace storage.
 * Legacy workspaces where `input === undefined` receive default starter templates;
 * explicit arrays (including empty arrays) are preserved as saved by users.
 */
export function sanitizeChecklistTemplates(input: unknown): ChecklistAcceptanceTemplate[] {
  if (input === undefined) {
    return structuredClone(DEFAULT_CHECKLIST_TEMPLATES);
  }
  if (!Array.isArray(input)) {
    return structuredClone(DEFAULT_CHECKLIST_TEMPLATES);
  }
  const now = new Date().toISOString();
  const result: ChecklistAcceptanceTemplate[] = [];

  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue;
    const obj = raw as Partial<ChecklistAcceptanceTemplate>;
    const name = typeof obj.name === 'string' ? obj.name.trim() : '';
    const items = sanitizeTemplateEntries(obj.items);
    if (!name || items.length === 0) continue;

    result.push({
      id: typeof obj.id === 'string' && obj.id.trim() ? obj.id : `tpl-${Date.now()}-${result.length}`,
      name,
      description:
        typeof obj.description === 'string' && obj.description.trim()
          ? obj.description.trim()
          : undefined,
      category:
        typeof obj.category === 'string' && obj.category.trim() ? obj.category.trim() : undefined,
      items,
      createdAt: typeof obj.createdAt === 'string' && obj.createdAt ? obj.createdAt : now,
      updatedAt: typeof obj.updatedAt === 'string' && obj.updatedAt ? obj.updatedAt : now,
    });
  }

  return result;
}

/**
 * Parses quick multi-line template text (`Item title | Acceptance criteria`).
 */
export function parseMultilineTemplateEntries(rawText: string): ChecklistTemplateEntry[] {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-*•\d.)]+\s*/, '').trim())
    .filter(Boolean)
    .map((line) => {
      const sepIdx = line.search(/\s*[|｜]\s*/);
      if (sepIdx === -1) {
        return { text: line, priority: 'MEDIUM' as Priority };
      }
      const match = line.match(/^(.*?)\s*[|｜]\s*(.+)$/);
      if (!match) {
        return { text: line, priority: 'MEDIUM' as Priority };
      }
      return {
        text: match[1].trim(),
        acceptanceCriteria: match[2].trim() || undefined,
        priority: 'MEDIUM' as Priority,
      };
    })
    .filter((entry) => Boolean(entry.text));
}

function normalizeTextKey(text: string): string {
  return text.trim().toLowerCase();
}

/**
 * Appends non-duplicate checklist entries from a saved template onto an existing task checklist.
 */
export function buildChecklistItemsFromTemplate(
  template: ChecklistAcceptanceTemplate,
  existingChecklist: ChecklistItem[] = []
): {
  addedItems: ChecklistItem[];
  matchedEntries: Array<{ checklistItem: ChecklistItem; entry: ChecklistTemplateEntry }>;
  nextChecklist: ChecklistItem[];
  skippedCount: number;
} {
  const existingByKey = new Map<string, ChecklistItem>();
  for (const item of existingChecklist) {
    existingByKey.set(normalizeTextKey(item.text), item);
  }

  const baseTs = Date.now();
  const addedItems: ChecklistItem[] = [];
  const matchedEntries: Array<{ checklistItem: ChecklistItem; entry: ChecklistTemplateEntry }> = [];
  let skippedCount = 0;

  template.items.forEach((entry, idx) => {
    const key = normalizeTextKey(entry.text);
    const existing = existingByKey.get(key);
    if (existing) {
      skippedCount += 1;
      matchedEntries.push({ checklistItem: existing, entry });
      return;
    }

    const created: ChecklistItem = {
      id: `tplitem-${baseTs}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
      text: entry.text,
      done: false,
    };
    existingByKey.set(key, created);
    addedItems.push(created);
    matchedEntries.push({ checklistItem: created, entry });
  });

  return {
    addedItems,
    matchedEntries,
    nextChecklist: [...existingChecklist, ...addedItems],
    skippedCount,
  };
}

/**
 * Builds non-duplicate WeeklyTodoItem rows from a saved template for a member & calendar week.
 */
export function buildWeeklyTodosFromTemplate(params: {
  template: ChecklistAcceptanceTemplate;
  memberId: string;
  weekKey?: string;
  projectId?: string;
  task?: TaskItem;
  checklistLinks?: Array<{ checklistItem: ChecklistItem; entry: ChecklistTemplateEntry }>;
  existingTodos?: WeeklyTodoItem[];
}): {
  addedTodos: WeeklyTodoItem[];
  skippedCount: number;
} {
  const {
    template,
    memberId,
    weekKey = getWeekKey(),
    projectId,
    task,
    checklistLinks,
    existingTodos = [],
  } = params;

  const existingTitleKeys = new Set<string>();
  const existingChecklistKeys = new Set<string>();
  for (const w of existingTodos) {
    if (w.memberId === memberId && w.weekKey === weekKey) {
      existingTitleKeys.add(normalizeTextKey(w.title));
      if (w.taskId && w.checklistItemId) {
        existingChecklistKeys.add(`${w.taskId}:${w.checklistItemId}`);
      }
    }
  }

  const now = new Date().toISOString();
  const baseTs = Date.now();
  const addedTodos: WeeklyTodoItem[] = [];
  let skippedCount = 0;

  const sourcePairs: Array<{ entry: ChecklistTemplateEntry; checklistItemId?: string; done?: boolean }> =
    checklistLinks
      ? checklistLinks.map(({ checklistItem, entry }) => ({
          entry,
          checklistItemId: checklistItem.id,
          done: checklistItem.done,
        }))
      : template.items.map((entry) => ({ entry }));

  sourcePairs.forEach(({ entry, checklistItemId, done }, idx) => {
    const titleKey = normalizeTextKey(entry.text);
    const linkKey = task && checklistItemId ? `${task.id}:${checklistItemId}` : '';
    if (existingTitleKeys.has(titleKey) || (linkKey && existingChecklistKeys.has(linkKey))) {
      skippedCount += 1;
      return;
    }

    existingTitleKeys.add(titleKey);
    if (linkKey) existingChecklistKeys.add(linkKey);

    addedTodos.push({
      id: `todo-${baseTs}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
      memberId,
      weekKey,
      title: entry.text,
      done: Boolean(done),
      priority: entry.priority || task?.priority || 'MEDIUM',
      projectId: projectId || task?.projectId || undefined,
      taskId: task?.id || undefined,
      checklistItemId,
      acceptanceCriteria: entry.acceptanceCriteria || undefined,
      acceptanceStatus: done ? 'SUBMITTED' : 'PENDING',
      createdAt: now,
      updatedAt: now,
    });
  });

  return {
    addedTodos,
    skippedCount,
  };
}
