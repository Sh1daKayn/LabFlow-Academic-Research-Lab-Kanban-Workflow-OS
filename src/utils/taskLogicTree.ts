import {
  Language,
  TaskItem,
  TaskLogicNode,
  TaskLogicNodeStatus,
  TaskLogicNodeType,
} from '@/types';

export const LOGIC_NODE_TYPE_META: Record<
  TaskLogicNodeType,
  { labelZh: string; labelEn: string; colorClass: string; stroke: string }
> = {
  goal: {
    labelZh: '核心目标',
    labelEn: 'Goal',
    colorClass: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/35',
    stroke: '#6366f1',
  },
  hypothesis: {
    labelZh: '研究假设',
    labelEn: 'Hypothesis',
    colorClass: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/35',
    stroke: '#a855f7',
  },
  method: {
    labelZh: '方案/推导',
    labelEn: 'Method',
    colorClass: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/35',
    stroke: '#06b6d4',
  },
  experiment: {
    labelZh: '实验执行',
    labelEn: 'Experiment',
    colorClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/35',
    stroke: '#f59e0b',
  },
  validation: {
    labelZh: '验证分析',
    labelEn: 'Validation',
    colorClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35',
    stroke: '#10b981',
  },
  milestone: {
    labelZh: '交付验收',
    labelEn: 'Milestone',
    colorClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/35',
    stroke: '#f43f5e',
  },
};

export const LOGIC_NODE_STATUS_META: Record<
  TaskLogicNodeStatus,
  { labelZh: string; labelEn: string; dotClass: string }
> = {
  todo: { labelZh: '待开始', labelEn: 'To Do', dotClass: 'bg-slate-400' },
  doing: { labelZh: '推进中', labelEn: 'In Progress', dotClass: 'bg-cyan-500' },
  done: { labelZh: '已完成', labelEn: 'Done', dotClass: 'bg-emerald-500' },
  blocked: { labelZh: '卡点阻塞', labelEn: 'Blocked', dotClass: 'bg-rose-500' },
};

function makeNodeId(prefix = 'node'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Auto-generates an editable multi-level科研 logic tree from a task's metadata,
 * description sentences, blocker status, and verification checklist.
 */
export function generateInitialLogicTree(task: TaskItem, lang: Language): TaskLogicNode {
  const isZh = lang === 'zh';
  const checklist = Array.isArray(task.checklist) ? task.checklist : [];

  const descSegments = (task.description || '')
    .split(/[。；;\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 4)
    .slice(0, 2);

  const methodChildren: TaskLogicNode[] =
    descSegments.length > 0
      ? descSegments.map((seg) => ({
          id: makeNodeId('m'),
          label: seg,
          nodeType: 'method',
          status: task.progress && task.progress >= 40 ? 'doing' : 'todo',
          children: [],
        }))
      : [
          {
            id: makeNodeId('m'),
            label: isZh ? '明确核心假设与问题边界' : 'Define core hypothesis & assumptions',
            nodeType: 'hypothesis',
            status: task.progress && task.progress >= 25 ? 'done' : 'doing',
            children: [],
          },
          {
            id: makeNodeId('m'),
            label: isZh ? '构建模型推导 / 基线算法设计' : 'Formulate model / baseline architecture',
            nodeType: 'method',
            status: task.progress && task.progress >= 50 ? 'doing' : 'todo',
            children: [],
          },
        ];

  const expChildren: TaskLogicNode[] =
    checklist.length > 0
      ? checklist.map((item) => ({
          id: makeNodeId('e'),
          label: item.text,
          nodeType: 'experiment',
          status: item.done ? 'done' : task.isBlocked ? 'blocked' : 'todo',
          linkedChecklistId: item.id,
          assigneeId: task.leadAuthor?.id,
          children: [],
        }))
      : [
          {
            id: makeNodeId('e'),
            label: isZh ? '数据清洗与可复现基准构建' : 'Dataset preparation & reproducible baseline',
            nodeType: 'experiment',
            status: 'doing',
            assigneeId: task.leadAuthor?.id,
            children: [],
          },
          {
            id: makeNodeId('e'),
            label: isZh ? '核心消融实验与统计显著性校验' : 'Ablation study & statistical significance checks',
            nodeType: 'experiment',
            status: task.isBlocked ? 'blocked' : 'todo',
            assigneeId: task.leadAuthor?.id,
            children: [],
          },
        ];

  const validationBranch: TaskLogicNode = {
    id: makeNodeId('vroot'),
    label: isZh ? '成果检验与阶段验收' : 'Validation & Stage Sign-off',
    nodeType: 'validation',
    status: task.stage === 'ACCEPTED' ? 'done' : 'todo',
    children: [
      {
        id: makeNodeId('val'),
        label: isZh
          ? `达成 ${task.targetVenue || '目标节点'} 评审交付要求`
          : `Satisfy ${task.targetVenue || 'target'} submission criteria`,
        nodeType: 'milestone',
        status: task.stage === 'ACCEPTED' ? 'done' : 'todo',
        note: task.deadline ? `DDL: ${task.deadline}` : undefined,
        children: [],
      },
    ],
  };

  if (task.isBlocked && task.blocker?.details) {
    validationBranch.children.unshift({
      id: makeNodeId('blk'),
      label: `${isZh ? '攻克卡点：' : 'Unblock: '}${task.blocker.details}`,
      nodeType: 'validation',
      status: 'blocked',
      note: task.blocker.tried || undefined,
      children: [],
    });
  }

  return {
    id: makeNodeId('root'),
    label: task.title,
    nodeType: 'goal',
    status: task.isBlocked
      ? 'blocked'
      : task.stage === 'ACCEPTED'
      ? 'done'
      : task.progress && task.progress > 0
      ? 'doing'
      : 'todo',
    note: task.projectTag ? `${task.projectTag} · ${task.targetVenue}` : task.targetVenue,
    assigneeId: task.leadAuthor?.id,
    children: [
      {
        id: makeNodeId('branch-m'),
        label: isZh ? '理论假设与技术路线' : 'Hypotheses & Methodology',
        nodeType: 'hypothesis',
        status: 'doing',
        children: methodChildren,
      },
      {
        id: makeNodeId('branch-e'),
        label: isZh ? '实验拆解与关键子步骤' : 'Experiments & Action Subtasks',
        nodeType: 'experiment',
        status: task.isBlocked ? 'blocked' : 'doing',
        children: expChildren,
      },
      validationBranch,
    ],
  };
}

export function updateLogicNode(
  root: TaskLogicNode,
  nodeId: string,
  patch: Partial<TaskLogicNode>
): TaskLogicNode {
  if (root.id === nodeId) {
    return { ...root, ...patch };
  }
  return {
    ...root,
    children: root.children.map((child) => updateLogicNode(child, nodeId, patch)),
  };
}

export function addChildLogicNode(
  root: TaskLogicNode,
  parentId: string,
  newNode: TaskLogicNode
): TaskLogicNode {
  if (root.id === parentId) {
    return {
      ...root,
      collapsed: false,
      children: [...root.children, newNode],
    };
  }
  return {
    ...root,
    children: root.children.map((child) => addChildLogicNode(child, parentId, newNode)),
  };
}

export function addSiblingLogicNode(
  root: TaskLogicNode,
  targetId: string,
  newNode: TaskLogicNode
): TaskLogicNode {
  const nextChildren: TaskLogicNode[] = [];
  let inserted = false;
  for (const child of root.children) {
    nextChildren.push(child);
    if (child.id === targetId) {
      nextChildren.push(newNode);
      inserted = true;
    }
  }
  if (inserted) {
    return { ...root, children: nextChildren };
  }
  return {
    ...root,
    children: root.children.map((child) => addSiblingLogicNode(child, targetId, newNode)),
  };
}

export function deleteLogicNode(root: TaskLogicNode, nodeId: string): TaskLogicNode {
  if (root.id === nodeId) return root; // Never delete root
  return {
    ...root,
    children: root.children
      .filter((child) => child.id !== nodeId)
      .map((child) => deleteLogicNode(child, nodeId)),
  };
}

export function moveLogicNodeOrder(
  root: TaskLogicNode,
  nodeId: string,
  direction: 'up' | 'down'
): TaskLogicNode {
  const idx = root.children.findIndex((c) => c.id === nodeId);
  if (idx !== -1) {
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= root.children.length) return root;
    const copy = [...root.children];
    const [item] = copy.splice(idx, 1);
    copy.splice(swapIdx, 0, item);
    return { ...root, children: copy };
  }
  return {
    ...root,
    children: root.children.map((child) => moveLogicNodeOrder(child, nodeId, direction)),
  };
}

function containsNodeId(node: TaskLogicNode, searchId: string): boolean {
  if (node.id === searchId) return true;
  return node.children.some((c) => containsNodeId(c, searchId));
}

function findAndExtractNode(
  node: TaskLogicNode,
  targetId: string
): { treeWithoutTarget: TaskLogicNode; extracted: TaskLogicNode | null } {
  const direct = node.children.find((c) => c.id === targetId);
  if (direct) {
    return {
      treeWithoutTarget: {
        ...node,
        children: node.children.filter((c) => c.id !== targetId),
      },
      extracted: direct,
    };
  }
  let found: TaskLogicNode | null = null;
  const nextChildren = node.children.map((c) => {
    if (found) return c;
    const res = findAndExtractNode(c, targetId);
    if (res.extracted) found = res.extracted;
    return res.treeWithoutTarget;
  });
  return {
    treeWithoutTarget: { ...node, children: nextChildren },
    extracted: found,
  };
}

/**
 * Reparents a subtree under `newParentId`, rejecting cycles (cannot move a node into itself or its descendant).
 */
export function reparentLogicNode(
  root: TaskLogicNode,
  nodeId: string,
  newParentId: string
): TaskLogicNode {
  if (nodeId === root.id || nodeId === newParentId) return root;
  const { treeWithoutTarget, extracted } = findAndExtractNode(root, nodeId);
  if (!extracted) return root;
  if (containsNodeId(extracted, newParentId)) {
    return root; // Prevent cycle
  }
  return addChildLogicNode(treeWithoutTarget, newParentId, extracted);
}

export function flattenLogicTreeOptions(
  node: TaskLogicNode,
  depth = 0
): Array<{ id: string; label: string; depth: number }> {
  const out = [{ id: node.id, label: node.label, depth }];
  for (const child of node.children) {
    out.push(...flattenLogicTreeOptions(child, depth + 1));
  }
  return out;
}

export function countLogicTreeStats(node?: TaskLogicNode): { total: number; done: number; blocked: number } {
  if (!node) return { total: 0, done: 0, blocked: 0 };
  let total = 1;
  let done = node.status === 'done' ? 1 : 0;
  let blocked = node.status === 'blocked' ? 1 : 0;
  for (const child of node.children) {
    const sub = countLogicTreeStats(child);
    total += sub.total;
    done += sub.done;
    blocked += sub.blocked;
  }
  return { total, done, blocked };
}

export function exportLogicTreeMarkdown(node: TaskLogicNode, depth = 0): string {
  const indent = '  '.repeat(depth);
  const statusMark =
    node.status === 'done' ? '[x]' : node.status === 'blocked' ? '[!]' : '[ ]';
  let md = `${indent}- ${statusMark} **${node.label}** *(${node.nodeType})*${
    node.note ? ` — ${node.note}` : ''
  }\n`;
  for (const child of node.children) {
    md += exportLogicTreeMarkdown(child, depth + 1);
  }
  return md;
}
