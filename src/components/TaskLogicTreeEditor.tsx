'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  GitBranch,
  Sparkles,
  Plus,
  CornerDownRight,
  Trash2,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronRight,
  Download,
  ListChecks,
  Maximize2,
  Check,
  Network,
  ListTree,
} from 'lucide-react';
import { useLabFlow } from '@/context/LabFlowContext';
import {
  ChecklistItem,
  TaskItem,
  TaskLogicNode,
  TaskLogicNodeStatus,
  TaskLogicNodeType,
} from '@/types';
import {
  addChildLogicNode,
  addSiblingLogicNode,
  countLogicTreeStats,
  deleteLogicNode,
  exportLogicTreeMarkdown,
  flattenLogicTreeOptions,
  generateInitialLogicTree,
  LOGIC_NODE_STATUS_META,
  LOGIC_NODE_TYPE_META,
  moveLogicNodeOrder,
  reparentLogicNode,
  updateLogicNode,
} from '@/utils/taskLogicTree';
import { MemberAvatar } from './MemberAvatar';

interface TaskLogicTreeEditorProps {
  task: TaskItem;
  editable: boolean;
  compact?: boolean;
  onExpandFullscreen?: () => void;
}

type TreeOrientation = 'horizontal' | 'outline';

const STATUS_CYCLE: TaskLogicNodeStatus[] = ['todo', 'doing', 'done', 'blocked'];

function findNodeById(node: TaskLogicNode, targetId: string): TaskLogicNode | null {
  if (node.id === targetId) return node;
  for (const child of node.children) {
    const found = findNodeById(child, targetId);
    if (found) return found;
  }
  return null;
}

function findParentId(node: TaskLogicNode, targetId: string): string | null {
  for (const child of node.children) {
    if (child.id === targetId) return node.id;
    const deeper = findParentId(child, targetId);
    if (deeper) return deeper;
  }
  return null;
}

export const TaskLogicTreeEditor: React.FC<TaskLogicTreeEditorProps> = ({
  task,
  editable,
  compact = false,
  onExpandFullscreen,
}) => {
  const { language, t, members, updateTask, addToast } = useLabFlow();
  const isZh = language === 'zh';

  const [orientation, setOrientation] = useState<TreeOrientation>(compact ? 'outline' : 'horizontal');

  const resolvedTree = useMemo(
    () => task.logicTree || generateInitialLogicTree(task, language),
    [task, language]
  );

  const [selectedNodeId, setSelectedNodeId] = useState<string>(resolvedTree.id);

  useEffect(() => {
    if (!findNodeById(resolvedTree, selectedNodeId)) {
      setSelectedNodeId(resolvedTree.id);
    }
  }, [resolvedTree, selectedNodeId]);

  const selectedNode = useMemo(
    () => findNodeById(resolvedTree, selectedNodeId) || resolvedTree,
    [resolvedTree, selectedNodeId]
  );

  const selectedParentId = useMemo(
    () => findParentId(resolvedTree, selectedNode.id),
    [resolvedTree, selectedNode]
  );

  const stats = useMemo(() => countLogicTreeStats(resolvedTree), [resolvedTree]);
  const parentOptions = useMemo(() => flattenLogicTreeOptions(resolvedTree), [resolvedTree]);

  const commitTree = (nextTree: TaskLogicNode) => {
    if (!editable) return;
    updateTask(task.id, { logicTree: nextTree });
  };

  const handleRegenerateTree = () => {
    if (!editable) return;
    const generated = generateInitialLogicTree(task, language);
    updateTask(task.id, { logicTree: generated });
    setSelectedNodeId(generated.id);
    addToast(
      isZh ? '已重新生成任务逻辑树图' : 'Logic Tree Regenerated',
      task.title.slice(0, 32),
      'success'
    );
  };

  const handleSaveInitialIfMissing = () => {
    if (!editable || task.logicTree) return;
    updateTask(task.id, { logicTree: resolvedTree });
    addToast(isZh ? '已保存逻辑树结构' : 'Logic Tree Saved', '', 'success');
  };

  const makeNewNode = (baseType: TaskLogicNodeType = 'experiment'): TaskLogicNode => ({
    id: `node-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
    label: isZh ? '新逻辑节点（点击编辑）' : 'New Logic Node',
    nodeType: baseType,
    status: 'todo',
    assigneeId: task.leadAuthor?.id,
    children: [],
  });

  const handleAddChild = (parentId: string, parentType: TaskLogicNodeType) => {
    if (!editable) return;
    const childType: TaskLogicNodeType =
      parentType === 'goal'
        ? 'method'
        : parentType === 'hypothesis'
        ? 'method'
        : parentType === 'method'
        ? 'experiment'
        : parentType === 'experiment'
        ? 'validation'
        : 'milestone';
    const created = makeNewNode(childType);
    const next = addChildLogicNode(resolvedTree, parentId, created);
    commitTree(next);
    setSelectedNodeId(created.id);
  };

  const handleAddSibling = (targetId: string, siblingType: TaskLogicNodeType) => {
    if (!editable || targetId === resolvedTree.id) return;
    const created = makeNewNode(siblingType);
    const next = addSiblingLogicNode(resolvedTree, targetId, created);
    commitTree(next);
    setSelectedNodeId(created.id);
  };

  const handleCycleStatus = (node: TaskLogicNode) => {
    if (!editable) return;
    const idx = STATUS_CYCLE.indexOf(node.status);
    const nextStatus = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    commitTree(updateLogicNode(resolvedTree, node.id, { status: nextStatus }));
  };

  const handleToggleCollapse = (node: TaskLogicNode) => {
    const next = updateLogicNode(resolvedTree, node.id, { collapsed: !node.collapsed });
    if (editable) {
      updateTask(task.id, { logicTree: next });
    }
  };

  const handleSyncNodeToChecklist = (node: TaskLogicNode) => {
    if (!editable) return;
    const existingChecklist = Array.isArray(task.checklist) ? [...task.checklist] : [];
    const alreadyExists =
      node.linkedChecklistId && existingChecklist.some((c) => c.id === node.linkedChecklistId);
    if (alreadyExists) {
      addToast(
        isZh ? '该节点已关联到执行清单中' : 'Already linked in checklist',
        node.label.slice(0, 28),
        'info'
      );
      return;
    }

    const newItemId = `chk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
    const newItem: ChecklistItem = {
      id: newItemId,
      text: node.label,
      done: node.status === 'done',
    };
    const nextChecklist = [...existingChecklist, newItem];
    const doneCount = nextChecklist.filter((c) => c.done).length;
    const nextProgress = Math.round((doneCount / nextChecklist.length) * 100);
    const nextTree = updateLogicNode(resolvedTree, node.id, { linkedChecklistId: newItemId });

    updateTask(task.id, {
      checklist: nextChecklist,
      progress: nextProgress,
      logicTree: nextTree,
    });
    addToast(
      isZh ? '✅ 已同步到任务执行清单' : '✅ Synced to Task Checklist',
      node.label.slice(0, 32),
      'success'
    );
  };

  const handleExportMarkdown = () => {
    const md = `# ${task.title} (${task.projectTag})\n\n${exportLogicTreeMarkdown(resolvedTree)}`;
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${task.projectTag || 'task'}-logic-tree.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderNodeCard = (node: TaskLogicNode, isRoot: boolean) => {
    const isSelected = selectedNode.id === node.id;
    const typeMeta = LOGIC_NODE_TYPE_META[node.nodeType] || LOGIC_NODE_TYPE_META.experiment;
    const statusMeta = LOGIC_NODE_STATUS_META[node.status] || LOGIC_NODE_STATUS_META.todo;
    const assignee = node.assigneeId ? members.find((m) => m.id === node.assigneeId) : undefined;
    const hasChildren = node.children.length > 0;

    return (
      <div
        onClick={() => setSelectedNodeId(node.id)}
        className={`group relative rounded-xl border p-2.5 cursor-pointer transition-all ${
          compact ? 'min-w-[200px]' : 'min-w-[220px] max-w-[270px]'
        } ${
          isSelected
            ? 'bg-cyan-500/10 dark:bg-cyan-950/50 border-cyan-500 ring-2 ring-cyan-500/20 shadow-sm'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-cyan-400/70'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Clickable Status Dot */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCycleStatus(node);
              }}
              title={
                editable
                  ? isZh
                    ? `状态：${statusMeta.labelZh}（点击切换）`
                    : `Status: ${statusMeta.labelEn} (click to cycle)`
                  : statusMeta.labelEn
              }
              className={`w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white dark:ring-slate-900 ${statusMeta.dotClass}`}
            />
            <span className={`px-1.5 py-0.2 rounded border text-[9px] font-semibold ${typeMeta.colorClass}`}>
              {isZh ? typeMeta.labelZh : typeMeta.labelEn}
            </span>
            {node.linkedChecklistId && (
              <span
                className="px-1 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[9px] font-medium"
                title={isZh ? '已关联任务执行清单' : 'Linked to Checklist'}
              >
                ✓ {isZh ? '清单' : 'Chk'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {assignee && <MemberAvatar member={assignee} size="xs" />}
            {hasChildren && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleCollapse(node);
                }}
                className="p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                title={node.collapsed ? (isZh ? '展开分支' : 'Expand') : isZh ? '折叠分支' : 'Collapse'}
              >
                {node.collapsed ? (
                  <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        </div>

        <div className="mt-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100 leading-snug break-words">
          {node.label}
        </div>

        {node.note && (
          <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
            {node.note}
          </div>
        )}

        {/* Quick hover actions when editable */}
        {editable && (
          <div className="mt-2 pt-1.5 border-t border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddChild(node.id, node.nodeType);
                }}
                className="px-1.5 py-0.5 rounded bg-cyan-500/12 hover:bg-cyan-500/25 text-cyan-700 dark:text-cyan-300 text-[10px] font-medium flex items-center gap-0.5"
              >
                <Plus className="w-2.5 h-2.5" />
                <span>{t.addChildNode}</span>
              </button>
              {!isRoot && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddSibling(node.id, node.nodeType);
                  }}
                  className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-medium flex items-center gap-0.5"
                >
                  <CornerDownRight className="w-2.5 h-2.5" />
                  <span>{isZh ? '同级' : 'Sibling'}</span>
                </button>
              )}
            </div>

            {!isRoot && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  commitTree(deleteLogicNode(resolvedTree, node.id));
                }}
                className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10"
                title={isZh ? '删除节点' : 'Delete Node'}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // Horizontal Mind-Map Recursive Renderer
  const renderHorizontalBranch = (node: TaskLogicNode, isRoot = false): React.ReactNode => {
    const showChildren = !node.collapsed && node.children.length > 0;
    return (
      <div key={node.id} className="flex items-center">
        <div className="shrink-0">{renderNodeCard(node, isRoot)}</div>

        {node.collapsed && node.children.length > 0 && (
          <button
            type="button"
            onClick={() => handleToggleCollapse(node)}
            className="ml-2 px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-700 dark:hover:text-cyan-300"
          >
            +{node.children.length}
          </button>
        )}

        {showChildren && (
          <div className="flex items-center">
            <div className="w-5 h-px bg-slate-300 dark:bg-slate-700 shrink-0" />
            <div className="flex flex-col gap-3 pl-4 border-l-2 border-slate-300 dark:border-slate-700 relative">
              {node.children.map((child) => (
                <div key={child.id} className="relative flex items-center">
                  <span className="absolute -left-4 top-1/2 w-4 h-px bg-slate-300 dark:bg-slate-700" />
                  {renderHorizontalBranch(child, false)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Vertical Outline Recursive Renderer
  const renderOutlineBranch = (node: TaskLogicNode, isRoot = false, depth = 0): React.ReactNode => {
    const showChildren = !node.collapsed && node.children.length > 0;
    return (
      <div key={node.id} className="space-y-2">
        {renderNodeCard(node, isRoot)}
        {showChildren && (
          <div className="ml-5 pl-3 border-l-2 border-slate-200 dark:border-slate-800 space-y-2">
            {node.children.map((child) => renderOutlineBranch(child, false, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5">
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
            <GitBranch className="w-3.5 h-3.5 text-cyan-500" />
            <span>
              {isZh
                ? `共 ${stats.total} 节点 · 已完成 ${stats.done}`
                : `${stats.total} nodes · ${stats.done} done`}
            </span>
          </span>
          {stats.blocked > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold">
              {isZh ? `阻塞 ${stats.blocked}` : `${stats.blocked} blocked`}
            </span>
          )}
          {!task.logicTree && editable && (
            <button
              type="button"
              onClick={handleSaveInitialIfMissing}
              className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-medium hover:bg-amber-500/25 flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              <span>{isZh ? '固化自动生成树' : 'Pin Auto-Tree'}</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Orientation Switch */}
          <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setOrientation('horizontal')}
              className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                orientation === 'horizontal'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Network className="w-3 h-3" />
              <span>{isZh ? '横向树图' : 'Mindmap'}</span>
            </button>
            <button
              type="button"
              onClick={() => setOrientation('outline')}
              className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                orientation === 'outline'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <ListTree className="w-3 h-3" />
              <span>{isZh ? '缩进大纲' : 'Outline'}</span>
            </button>
          </div>

          {editable && (
            <button
              type="button"
              onClick={handleRegenerateTree}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-500/12 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25 text-[11px] font-semibold flex items-center gap-1 transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              <span>{t.generateLogicTree}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportMarkdown}
            className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-[11px] font-medium flex items-center gap-1 transition-colors"
          >
            <Download className="w-3 h-3" />
            <span>{t.exportMarkdown}</span>
          </button>

          {onExpandFullscreen && (
            <button
              type="button"
              onClick={onExpandFullscreen}
              className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors"
            >
              <Maximize2 className="w-3 h-3" />
              <span>{isZh ? '大画布编辑' : 'Fullscreen'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Selected Node Inspector */}
      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {isZh ? '当前选中节点编辑' : 'Selected Node Inspector'}
          </div>
          {editable && (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleAddChild(selectedNode.id, selectedNode.nodeType)}
                className="px-2 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-semibold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>{t.addChildNode}</span>
              </button>
              {selectedNode.id !== resolvedTree.id && (
                <>
                  <button
                    type="button"
                    onClick={() => handleAddSibling(selectedNode.id, selectedNode.nodeType)}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-medium flex items-center gap-1"
                  >
                    <CornerDownRight className="w-3 h-3" />
                    <span>{t.addSiblingNode}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => commitTree(moveLogicNodeOrder(resolvedTree, selectedNode.id, 'up'))}
                    className="p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-cyan-500"
                    title={isZh ? '同级上移' : 'Move Up'}
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => commitTree(moveLogicNodeOrder(resolvedTree, selectedNode.id, 'down'))}
                    className="p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-cyan-500"
                    title={isZh ? '同级下移' : 'Move Down'}
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => handleSyncNodeToChecklist(selectedNode)}
                className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-700 dark:text-amber-300 text-[11px] font-semibold flex items-center gap-1"
              >
                <ListChecks className="w-3 h-3" />
                <span>{t.syncNodeToChecklist}</span>
              </button>
              {selectedNode.id !== resolvedTree.id && (
                <button
                  type="button"
                  onClick={() => commitTree(deleteLogicNode(resolvedTree, selectedNode.id))}
                  className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[11px] font-medium flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{isZh ? '删除' : 'Delete'}</span>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-medium text-slate-500 mb-1">
              {isZh ? '节点内容 / 步骤描述' : 'Node Label'}
            </label>
            <input
              type="text"
              disabled={!editable}
              value={selectedNode.label}
              onChange={(e) =>
                commitTree(updateLogicNode(resolvedTree, selectedNode.id, { label: e.target.value }))
              }
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-[10px] font-medium text-slate-500 mb-1">
              {isZh ? '逻辑类型' : 'Node Type'}
            </label>
            <select
              disabled={!editable}
              value={selectedNode.nodeType}
              onChange={(e) =>
                commitTree(
                  updateLogicNode(resolvedTree, selectedNode.id, {
                    nodeType: e.target.value as TaskLogicNodeType,
                  })
                )
              }
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-cyan-500 disabled:opacity-60"
            >
              {(Object.keys(LOGIC_NODE_TYPE_META) as TaskLogicNodeType[]).map((key) => (
                <option key={key} value={key}>
                  {isZh ? LOGIC_NODE_TYPE_META[key].labelZh : LOGIC_NODE_TYPE_META[key].labelEn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-medium text-slate-500 mb-1">
              {isZh ? '节点状态' : 'Status'}
            </label>
            <select
              disabled={!editable}
              value={selectedNode.status}
              onChange={(e) =>
                commitTree(
                  updateLogicNode(resolvedTree, selectedNode.id, {
                    status: e.target.value as TaskLogicNodeStatus,
                  })
                )
              }
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-cyan-500 disabled:opacity-60"
            >
              {(Object.keys(LOGIC_NODE_STATUS_META) as TaskLogicNodeStatus[]).map((key) => (
                <option key={key} value={key}>
                  {isZh ? LOGIC_NODE_STATUS_META[key].labelZh : LOGIC_NODE_STATUS_META[key].labelEn}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] font-medium text-slate-500 mb-1">
              {isZh ? '负责人（可选）' : 'Assignee'}
            </label>
            <select
              disabled={!editable}
              value={selectedNode.assigneeId || ''}
              onChange={(e) =>
                commitTree(
                  updateLogicNode(resolvedTree, selectedNode.id, {
                    assigneeId: e.target.value || undefined,
                  })
                )
              }
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-cyan-500 disabled:opacity-60"
            >
              <option value="">{isZh ? '未指定' : 'Unassigned'}</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {isZh ? m.nameZh : m.nameEn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-medium text-slate-500 mb-1">
              {isZh ? '调整挂载父节点' : 'Reparent Under'}
            </label>
            <select
              disabled={!editable || selectedNode.id === resolvedTree.id}
              value={selectedParentId || ''}
              onChange={(e) => {
                if (!e.target.value) return;
                commitTree(reparentLogicNode(resolvedTree, selectedNode.id, e.target.value));
              }}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-cyan-500 disabled:opacity-60"
            >
              {selectedNode.id === resolvedTree.id ? (
                <option value="">{isZh ? '根节点' : 'Root Node'}</option>
              ) : (
                parentOptions
                  .filter((opt) => opt.id !== selectedNode.id)
                  .map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {'　'.repeat(opt.depth)}
                      {opt.label.slice(0, 28)}
                    </option>
                  ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-medium text-slate-500 mb-1">
              {isZh ? '逻辑说明 / 备注' : 'Note / Rationale'}
            </label>
            <input
              type="text"
              disabled={!editable}
              value={selectedNode.note || ''}
              onChange={(e) =>
                commitTree(updateLogicNode(resolvedTree, selectedNode.id, { note: e.target.value }))
              }
              placeholder={isZh ? '参数、前提或判定依据...' : 'Parameters or rationale...'}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 disabled:opacity-60"
            />
          </div>
        </div>
      </div>

      {/* Tree Canvas */}
      <div className="bg-slate-50/80 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 rounded-xl p-4 overflow-x-auto custom-scrollbar">
        {orientation === 'horizontal'
          ? renderHorizontalBranch(resolvedTree, true)
          : renderOutlineBranch(resolvedTree, true)}
      </div>
    </div>
  );
};
