'use client';

import React, { useMemo, useState } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import { AcademicStage, LabMember, ProjectItem, StageConfig, TaskItem } from '@/types';
import { formatCountdownBadge } from '@/utils/date';
import { canAdvanceToStage } from '@/utils/rbac';
import { getProjectMembers } from '@/utils/projectAnalytics';
import { MemberAvatar } from '@/components/MemberAvatar';
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Flame,
  FolderKanban,
  GripVertical,
  Layers,
  Lock,
  MoveHorizontal,
} from 'lucide-react';

type MatrixScope = 'all' | 'projects' | 'tasks';
type MatrixRowKind = 'project' | 'task';

interface DragPayload {
  kind: MatrixRowKind;
  id: string;
}

interface MatrixRowItem {
  kind: MatrixRowKind;
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  currentStage: AcademicStage;
  canDrag: boolean;
  isBlocked?: boolean;
  badgeText?: string;
  badgeClassName?: string;
  progressPercent?: number;
  leadAuthor?: LabMember;
}

interface StageDragMatrixProps {
  filteredTasks: TaskItem[];
}

interface MatrixSectionProps {
  sectionKind: MatrixRowKind;
  sectionTitle: string;
  items: MatrixRowItem[];
  stages: StageConfig[];
  language: 'en' | 'zh';
  dragging: DragPayload | null;
  hoverCellKey: string | null;
  canAdvanceTo: (stageId: AcademicStage) => boolean;
  onStartDrag: (payload: DragPayload) => void;
  onEndDrag: () => void;
  onSetHoverCell: (key: string | null) => void;
  onMoveStage: (itemId: string, targetStage: AcademicStage) => void;
}

const StageMatrixSection: React.FC<MatrixSectionProps> = ({
  sectionKind,
  sectionTitle,
  items,
  stages,
  language,
  dragging,
  hoverCellKey,
  canAdvanceTo,
  onStartDrag,
  onEndDrag,
  onSetHoverCell,
  onMoveStage,
}) => {
  const isZh = language === 'zh';

  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm overflow-hidden">
      {/* Section Header */}
      <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100">
          {sectionKind === 'project' ? (
            <FolderKanban className="w-4 h-4 text-violet-500" />
          ) : (
            <Layers className="w-4 h-4 text-indigo-500" />
          )}
          <span>{sectionTitle}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {items.length}
          </span>
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
          {isZh ? '横向拖拽单元格到目标阶段列即可前移或退回' : 'Drag any highlighted cell across stage columns'}
        </span>
      </div>

      {/* Horizontal Matrix Grid */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
        <div className="min-w-[960px]">
          {/* Stage Columns Header */}
          <div
            className="grid border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40"
            style={{
              gridTemplateColumns: `250px repeat(${stages.length}, minmax(135px, 1fr))`,
            }}
          >
            <div className="sticky left-0 z-10 px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800">
              {sectionKind === 'project'
                ? isZh
                  ? '科研项目'
                  : 'Project'
                : isZh
                ? '研发任务'
                : 'Task'}
            </div>
            {stages.map((stage, sIdx) => {
              const stageCount = items.filter((item) => item.currentStage === stage.id).length;
              return (
                <div
                  key={stage.id}
                  className="px-2.5 py-2.5 border-r last:border-r-0 border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-1.5"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${stage.color.replace('text-', 'bg-')}`} />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">
                      {isZh ? stage.labelZh : stage.labelEn}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                    {sIdx + 1} · {stageCount}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Matrix Rows */}
          <div className="divide-y divide-slate-200/80 dark:divide-slate-800/80">
            {items.map((item) => {
              const curIdx = stages.findIndex((s) => s.id === item.currentStage);
              const isRowDragging = dragging?.kind === item.kind && dragging?.id === item.id;

              return (
                <div
                  key={`${item.kind}-${item.id}`}
                  className={`grid items-stretch transition-colors ${
                    isRowDragging
                      ? 'bg-indigo-50/40 dark:bg-indigo-950/20'
                      : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20'
                  }`}
                  style={{
                    gridTemplateColumns: `250px repeat(${stages.length}, minmax(135px, 1fr))`,
                  }}
                >
                  {/* Sticky Left Entity Cell */}
                  <div className="sticky left-0 z-10 px-3.5 py-2.5 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-center gap-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/25 truncate max-w-[130px]">
                        {item.tag}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {item.isBlocked && (
                          <span
                            className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.2 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                            title={isZh ? '存在卡点' : 'Blocked'}
                          >
                            <Flame className="w-2.5 h-2.5" />
                          </span>
                        )}
                        {item.badgeText && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-full border ${item.badgeClassName || ''}`}>
                            {item.badgeText}
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className="text-xs font-semibold text-slate-800 dark:text-slate-100 line-clamp-1"
                      title={item.title}
                    >
                      {item.title}
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {item.leadAuthor && <MemberAvatar member={item.leadAuthor} size="xs" />}
                      <span className="truncate">{item.subtitle}</span>
                    </div>
                  </div>

                  {/* Stage Grid Cells */}
                  {stages.map((stage, stageIdx) => {
                    const isOccupied = item.currentStage === stage.id;
                    const cellKey = `${item.kind}:${item.id}:${stage.id}`;
                    const isHovered = hoverCellKey === cellKey;
                    const isStageAllowed = canAdvanceTo(stage.id);
                    const stageLabel = isZh ? stage.labelZh : stage.labelEn;

                    if (isOccupied) {
                      const canBack = item.canDrag && curIdx > 0;
                      const canNext = item.canDrag && curIdx >= 0 && curIdx < stages.length - 1;

                      return (
                        <div
                          key={stage.id}
                          className="p-2 border-r last:border-r-0 border-slate-200/70 dark:border-slate-800/70 flex items-center justify-center bg-slate-50/40 dark:bg-slate-950/30"
                        >
                          <div
                            draggable={item.canDrag}
                            onDragStart={(e) => {
                              if (!item.canDrag) {
                                e.preventDefault();
                                return;
                              }
                              e.dataTransfer.effectAllowed = 'move';
                              e.dataTransfer.setData('text/plain', `${item.kind}:${item.id}`);
                              onStartDrag({ kind: item.kind, id: item.id });
                            }}
                            onDragEnd={onEndDrag}
                            className={`w-full rounded-xl p-2 border transition-all select-none ${
                              item.canDrag
                                ? 'cursor-grab active:cursor-grabbing bg-gradient-to-br from-indigo-500/12 via-white to-cyan-500/10 dark:from-indigo-500/20 dark:via-slate-900 dark:to-cyan-500/10 border-indigo-400/60 dark:border-indigo-500/50 shadow-sm hover:shadow-md hover:border-indigo-500'
                                : 'bg-slate-100 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 opacity-80'
                            } ${isRowDragging ? 'opacity-50 scale-[0.98]' : ''}`}
                            title={
                              item.canDrag
                                ? isZh
                                  ? '按住此单元格横向拖拽到任意阶段列，或用下方左右箭头调整'
                                  : 'Drag this cell to any stage column or use arrows'
                                : isZh
                                ? '当前账号仅只读查看此项'
                                : 'Read-only'
                            }
                          >
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <div className="flex items-center gap-1 min-w-0">
                                {item.canDrag ? (
                                  <GripVertical className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                ) : (
                                  <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                                )}
                                <span
                                  className={`text-[10px] font-bold truncate ${stage.color}`}
                                >
                                  {stageLabel}
                                </span>
                              </div>
                              <span className="text-[9px] font-mono text-slate-400 shrink-0">
                                {stageIdx + 1}/{stages.length}
                              </span>
                            </div>

                            {typeof item.progressPercent === 'number' && (
                              <div className="w-full h-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mb-1.5">
                                <div
                                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full"
                                  style={{ width: `${Math.max(0, Math.min(100, item.progressPercent))}%` }}
                                />
                              </div>
                            )}

                            {/* Reversible Quick Stepper inside Occupied Cell */}
                            {item.canDrag && (
                              <div
                                className="flex items-center justify-between gap-1 pt-1 border-t border-indigo-200/50 dark:border-indigo-500/20"
                                onMouseDown={(e) => e.stopPropagation()}
                                onDragStart={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                              >
                                <button
                                  type="button"
                                  disabled={!canBack}
                                  onClick={() => canBack && onMoveStage(item.id, stages[curIdx - 1].id)}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-0.5 transition-colors ${
                                    canBack
                                      ? 'text-slate-600 dark:text-slate-300 hover:bg-amber-500/15 hover:text-amber-600 dark:hover:text-amber-300'
                                      : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                                  }`}
                                  title={isZh ? '退回上一阶段' : 'Previous Stage'}
                                >
                                  <ArrowLeft className="w-2.5 h-2.5" />
                                  <span>{isZh ? '回退' : 'Back'}</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={!canNext}
                                  onClick={() => canNext && onMoveStage(item.id, stages[curIdx + 1].id)}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-0.5 transition-colors ${
                                    canNext
                                      ? 'text-slate-600 dark:text-slate-300 hover:bg-cyan-500/15 hover:text-cyan-600 dark:hover:text-cyan-300'
                                      : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                                  }`}
                                  title={isZh ? '推进至下一阶段' : 'Next Stage'}
                                >
                                  <span>{isZh ? '推进' : 'Next'}</span>
                                  <ArrowRight className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // Empty Target Stage Cell (Drop Target + Direct Jump on Click)
                    const canDirectClick = item.canDrag && isStageAllowed;
                    const showDropPreview = isRowDragging;

                    return (
                      <div
                        key={stage.id}
                        onDragOver={(e) => {
                          if (!isRowDragging) return;
                          e.preventDefault();
                          e.dataTransfer.dropEffect = item.canDrag && isStageAllowed ? 'move' : 'none';
                          if (!isHovered) {
                            onSetHoverCell(cellKey);
                          }
                        }}
                        onDragLeave={(e) => {
                          if (!isRowDragging) return;
                          if (!e.currentTarget.contains(e.relatedTarget as Node) && isHovered) {
                            onSetHoverCell(null);
                          }
                        }}
                        onDrop={(e) => {
                          if (!isRowDragging) return;
                          e.preventDefault();
                          onMoveStage(item.id, stage.id);
                          onEndDrag();
                        }}
                        className={`group/cell p-2 border-r last:border-r-0 border-slate-200/70 dark:border-slate-800/70 flex items-center justify-center transition-all ${
                          isHovered && showDropPreview
                            ? isStageAllowed
                              ? 'bg-indigo-500/15 ring-2 ring-inset ring-indigo-500'
                              : 'bg-rose-500/10 ring-2 ring-inset ring-rose-500/60'
                            : showDropPreview
                            ? 'bg-slate-50/70 dark:bg-slate-900/40'
                            : ''
                        }`}
                      >
                        {showDropPreview ? (
                          <div
                            className={`w-full h-full min-h-[54px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center px-2 text-center transition-colors ${
                              isHovered
                                ? isStageAllowed
                                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-300 bg-white/70 dark:bg-slate-900/80'
                                  : 'border-rose-500/70 text-rose-600 dark:text-rose-400'
                                : 'border-slate-300/80 dark:border-slate-700/70 text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            {isStageAllowed ? (
                              <>
                                <MoveHorizontal className="w-3.5 h-3.5 mb-0.5" />
                                <span className="text-[10px] font-semibold leading-tight">
                                  {isHovered
                                    ? isZh
                                      ? `松手移至「${stageLabel}」`
                                      : `Drop -> ${stageLabel}`
                                    : isZh
                                    ? '拖放至此'
                                    : 'Drop here'}
                                </span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3 mb-0.5" />
                                <span className="text-[9px] font-medium">
                                  {isZh ? '需导师/负责人权限' : 'Restricted'}
                                </span>
                              </>
                            )}
                          </div>
                        ) : canDirectClick ? (
                          <button
                            type="button"
                            onClick={() => onMoveStage(item.id, stage.id)}
                            className="w-full h-full min-h-[54px] rounded-xl border border-dashed border-transparent group-hover/cell:border-indigo-400/60 dark:group-hover/cell:border-indigo-500/40 group-hover/cell:bg-indigo-50/50 dark:group-hover/cell:bg-indigo-950/30 flex items-center justify-center text-[10px] font-medium text-transparent group-hover/cell:text-indigo-600 dark:group-hover/cell:text-indigo-300 transition-all"
                            title={
                              isZh
                                ? `点击或拖拽至此，切换阶段为「${stageLabel}」`
                                : `Click or drag here to move to ${stageLabel}`
                            }
                          >
                            {isZh ? `移至「${stageLabel}」` : `Move here`}
                          </button>
                        ) : (
                          <div className="w-full h-full min-h-[54px] flex items-center justify-center">
                            <span className="text-slate-200 dark:text-slate-800 text-xs">·</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export const StageDragMatrix: React.FC<StageDragMatrixProps> = ({ filteredTasks }) => {
  const {
    projects,
    tasks,
    members,
    stages,
    language,
    searchQuery,
    selectedProjectFilter,
    moveTask,
    updateProject,
    canEditTask,
    currentAccessRole,
    effectiveIsAdmin,
  } = useLabFlow();

  const isZh = language === 'zh';
  const [scope, setScope] = useState<MatrixScope>('all');
  const [dragging, setDragging] = useState<DragPayload | null>(null);
  const [hoverCellKey, setHoverCellKey] = useState<string | null>(null);

  const canMoveProject = currentAccessRole !== 'AUDITOR_GUEST' || effectiveIsAdmin;

  const projectRows: MatrixRowItem[] = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return projects
      .filter((p: ProjectItem) => {
        if (selectedProjectFilter !== 'all' && p.id !== selectedProjectFilter) return false;
        if (!q) return true;
        return (
          p.title.toLowerCase().includes(q) ||
          p.tag.toLowerCase().includes(q) ||
          p.targetVenue.toLowerCase().includes(q)
        );
      })
      .map((p) => {
        const pMembers = getProjectMembers(p, tasks, members);
        const pTaskCount = tasks.filter((t) => t.projectId === p.id).length;
        return {
          kind: 'project',
          id: p.id,
          tag: p.tag,
          title: p.title,
          subtitle: `${p.targetVenue} · ${pMembers.length}${isZh ? '人' : ' mem'} · ${pTaskCount}${isZh ? '任务' : ' tasks'}`,
          currentStage: p.status,
          canDrag: canMoveProject,
          badgeText: p.category || undefined,
          badgeClassName:
            'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300',
        };
      });
  }, [projects, tasks, members, selectedProjectFilter, searchQuery, canMoveProject, isZh]);

  const taskRows: MatrixRowItem[] = useMemo(() => {
    return filteredTasks.map((task) => {
      const ddlBadge = formatCountdownBadge(task.deadline, language);
      const leadName = isZh ? task.leadAuthor.nameZh : task.leadAuthor.nameEn;
      return {
        kind: 'task',
        id: task.id,
        tag: task.projectTag,
        title: task.title,
        subtitle: `${leadName} · ${task.progress}%`,
        currentStage: task.stage,
        canDrag: canEditTask(task),
        isBlocked: task.isBlocked,
        badgeText: ddlBadge.text,
        badgeClassName: ddlBadge.className,
        progressPercent: task.progress,
        leadAuthor: task.leadAuthor,
      };
    });
  }, [filteredTasks, language, isZh, canEditTask]);

  const handleEndDrag = () => {
    setDragging(null);
    setHoverCellKey(null);
  };

  const canAdvanceTo = (stageId: AcademicStage) =>
    canAdvanceToStage(stageId, currentAccessRole, effectiveIsAdmin);

  return (
    <div className="space-y-4 pb-8">
      {/* Scope Switcher & Instructions */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-cyan-500/5 to-transparent border border-indigo-500/20">
        <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-200">
          <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm shrink-0">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold">
              {isZh ? '阶段拖拽单元格（双向可逆调度）' : 'Stage Drag Cells Matrix (Reversible)'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {isZh
                ? '直接拖拽高亮单元格至任意阶段列即可前移或退回，也可点击 ←/→ 或悬停空白单元格一键调回。'
                : 'Drag highlighted cells to any stage column forward or backward, or click empty cells / arrows.'}
            </div>
          </div>
        </div>

        <div className="inline-flex items-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 text-xs shadow-sm">
          {(
            [
              {
                id: 'all',
                label: isZh
                  ? `全部 (${projectRows.length + taskRows.length})`
                  : `All (${projectRows.length + taskRows.length})`,
              },
              {
                id: 'projects',
                label: isZh ? `科研项目 (${projectRows.length})` : `Projects (${projectRows.length})`,
              },
              {
                id: 'tasks',
                label: isZh ? `研发任务 (${taskRows.length})` : `Tasks (${taskRows.length})`,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setScope(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                scope === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {(scope === 'all' || scope === 'projects') && (
        <StageMatrixSection
          sectionKind="project"
          sectionTitle={isZh ? '科研项目总阶段单元格' : 'Research Project Stage Cells'}
          items={projectRows}
          stages={stages}
          language={language}
          dragging={dragging}
          hoverCellKey={hoverCellKey}
          canAdvanceTo={canAdvanceTo}
          onStartDrag={setDragging}
          onEndDrag={handleEndDrag}
          onSetHoverCell={setHoverCellKey}
          onMoveStage={(projectId, targetStage) =>
            updateProject(projectId, { status: targetStage })
          }
        />
      )}

      {(scope === 'all' || scope === 'tasks') && (
        <StageMatrixSection
          sectionKind="task"
          sectionTitle={isZh ? '研发任务阶段单元格' : 'Task Stage Cells'}
          items={taskRows}
          stages={stages}
          language={language}
          dragging={dragging}
          hoverCellKey={hoverCellKey}
          canAdvanceTo={canAdvanceTo}
          onStartDrag={setDragging}
          onEndDrag={handleEndDrag}
          onSetHoverCell={setHoverCellKey}
          onMoveStage={(taskId, targetStage) => moveTask(taskId, targetStage)}
        />
      )}

      {((scope === 'projects' && projectRows.length === 0) ||
        (scope === 'tasks' && taskRows.length === 0) ||
        (scope === 'all' && projectRows.length === 0 && taskRows.length === 0)) && (
        <div className="p-10 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-xs text-slate-500">
          {isZh ? '当前筛选条件下暂无可调度的项目或任务' : 'No matching projects or tasks'}
        </div>
      )}
    </div>
  );
};
