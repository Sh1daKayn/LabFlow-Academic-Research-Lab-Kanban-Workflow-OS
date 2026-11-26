'use client';

import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { TaskItem } from '@/types';
import { useLabFlow } from '@/context/LabFlowContext';
import { formatCountdownBadge } from '@/utils/date';
import { BLOCKER_CATEGORIES } from '@/data/mockData';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Database,
  ExternalLink,
  FileText,
  Flame,
  GitBranch,
  GripVertical,
  Link2,
  Lock,
  MessageSquare,
  Shield,
} from 'lucide-react';
import { GitHubIcon } from '@/components/icons/BrandIcons';
import { KanbanCardInlineEditor } from '@/components/KanbanCardInlineEditor';
import { MemberAvatar } from '@/components/MemberAvatar';
import { countLogicTreeStats } from '@/utils/taskLogicTree';
import { extractNormalizedAssetEntries } from '@/utils/assets';
import { resolveVenueUrl } from '@/utils/venues';
import {
  WORK_CATEGORY_META,
  getWorkCategoryLabel,
  resolveTaskWorkCategory,
} from '@/utils/workCategory';

interface KanbanCardProps {
  task: TaskItem;
  index: number;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ task, index }) => {
  const {
    projects,
    venues,
    currentUserId,
    openRequestModal,
    selectedTask,
    setSelectedTask,
    setActiveBlockerTask,
    setLogicTreeTaskId,
    moveTask,
    stages,
    language,
    t,
    canEditTask,
    simpleMode,
  } = useLabFlow();

  const linkedProject = projects.find((p) => p.id === task.projectId);
  const workCategory = resolveTaskWorkCategory(task, projects);
  const categoryMeta = WORK_CATEGORY_META[workCategory];
  const partnerOrg = task.partnerOrg || linkedProject?.partnerOrg;
  const milestoneNode = task.milestoneNode || linkedProject?.milestoneNode;

  const hasEditPermission = canEditTask(task);
  const isExpanded = selectedTask?.id === task.id;
  const ddlBadge = formatCountdownBadge(task.deadline, language);
  const resolvedVenueUrl = resolveVenueUrl(
    task.targetVenue,
    venues,
    task.targetVenueUrl || linkedProject?.targetVenueUrl
  );
  const assetLinks = extractNormalizedAssetEntries(task.assets);

  const blockerMeta = task.blocker
    ? BLOCKER_CATEGORIES[task.blocker.category] || BLOCKER_CATEGORIES.OTHER
    : null;

  const leadName = language === 'zh' ? task.leadAuthor.nameZh : task.leadAuthor.nameEn;
  const piName = language === 'zh' ? task.pi.nameZh : task.pi.nameEn;

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTask(isExpanded ? null : task);
  };

  const stageIds = stages.map((s) => s.id);
  const curStageIndex = stageIds.indexOf(task.stage);
  const canStepBack = curStageIndex > 0;
  const canStepForward = curStageIndex >= 0 && curStageIndex < stageIds.length - 1;

  return (
    <Draggable draggableId={task.id} index={index} isDragDisabled={!hasEditPermission}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          data-tour="tour-sample-card"
          className={`group relative rounded-xl transition-all duration-200 select-none bg-white dark:bg-slate-900 border ${
            snapshot.isDragging
              ? 'shadow-2xl shadow-indigo-500/25 ring-2 ring-indigo-500 scale-[1.02] z-50'
              : isExpanded
              ? 'ring-2 ring-indigo-500/80 shadow-lg border-indigo-500/50'
              : 'hover:shadow-md border-slate-200 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700'
          } ${task.isBlocked ? 'border-2 border-red-500/80 ring-1 ring-red-500/30' : ''}`}
          style={provided.draggableProps.style}
        >
          {/* Card Content Summary Container — entire collapsed card acts as draggable cell */}
          <div
            {...(hasEditPermission && !isExpanded ? provided.dragHandleProps : {})}
            className={`p-3 space-y-2.5 ${
              hasEditPermission && !isExpanded ? 'cursor-grab active:cursor-grabbing' : ''
            }`}
          >
            {/* Top row: Drag handle + Project tag + Countdown */}
            <div
              {...(hasEditPermission && isExpanded ? provided.dragHandleProps : {})}
              className={`flex items-center justify-between gap-1.5 ${
                hasEditPermission && isExpanded ? 'cursor-grab active:cursor-grabbing' : ''
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                {hasEditPermission ? (
                  <div
                    className={`cursor-grab active:cursor-grabbing text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 p-0.5 -ml-1 rounded transition-opacity ${
                      simpleMode ? 'opacity-30 group-hover:opacity-100' : ''
                    }`}
                    title={
                      language === 'zh'
                        ? '拖拽此卡片单元格即可调整阶段或排序'
                        : 'Drag this card cell to change stage or order'
                    }
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <div
                    className="text-slate-300 dark:text-slate-600 p-0.5 -ml-1"
                    title={language === 'zh' ? '只读/非负责人不可拖拽' : 'Read-only / Locked'}
                  >
                    <Lock className="w-3 h-3 text-slate-400" />
                  </div>
                )}

                {!simpleMode && (
                  <span
                    className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border shrink-0 ${categoryMeta.badgeClass}`}
                    title={getWorkCategoryLabel(workCategory, language, false)}
                  >
                    {getWorkCategoryLabel(workCategory, language, true)}
                  </span>
                )}

                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300 truncate max-w-[115px]"
                  title={`${task.projectTag} (${task.targetVenue})`}
                >
                  {task.projectTag}
                </span>

                {task.visibility === 'TEAM_ONLY' && (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    title={language === 'zh' ? '仅本课题组成员与导师可见' : 'Project Team Only'}
                  >
                    {t.visibilityTeamBadge}
                  </span>
                )}
                {task.visibility === 'PI_ONLY' && (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center gap-0.5"
                    title={language === 'zh' ? '隐私 (仅自己与导师可见)' : 'Private'}
                  >
                    <Shield className="w-2.5 h-2.5" />
                    {t.visibilityPIBadge}
                  </span>
                )}

                {task.priority === 'URGENT' && (
                  <span
                    className="inline-flex rounded-full h-2 w-2 bg-rose-500 shrink-0"
                    title={language === 'zh' ? '紧急优先级' : 'Urgent'}
                  />
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <div className={`text-[9px] px-2 py-0.5 rounded-full border ${ddlBadge.className}`}>
                  {ddlBadge.text}
                </div>
                <button
                  type="button"
                  onClick={toggleExpand}
                  className={`p-1 rounded-md transition-colors ${
                    isExpanded
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title={
                    isExpanded
                      ? language === 'zh'
                        ? '收起详情'
                        : 'Collapse'
                      : language === 'zh'
                      ? '展开项目细节'
                      : 'Expand Details'
                  }
                >
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Pulsing Blocker Status Badge (if blocked) */}
            {task.isBlocked && blockerMeta && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (hasEditPermission) setActiveBlockerTask(task);
                }}
                className={`${
                  hasEditPermission ? 'cursor-pointer hover:bg-red-500/25' : ''
                } flex items-center justify-between gap-1.5 px-2 py-1 rounded-lg bg-red-500/15 border border-red-500/40 text-red-600 dark:text-red-300 transition-all group/blocker`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="inline-flex rounded-full h-2 w-2 bg-red-500 shrink-0" />
                  <span className="text-[10px] font-bold truncate">
                    {language === 'zh' ? blockerMeta.labelZh : blockerMeta.labelEn}
                  </span>
                </div>
                {hasEditPermission && (
                  <span className="text-[10px] underline font-semibold text-red-600 dark:text-red-400 group-hover/blocker:text-red-800 dark:group-hover/blocker:text-red-200 shrink-0">
                    {language === 'zh' ? '解除 →' : 'Resolve →'}
                  </span>
                )}
              </div>
            )}

            {/* Task Title & Venue Link */}
            <div onClick={toggleExpand} className="cursor-pointer space-y-1">
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors leading-snug line-clamp-2">
                {task.title}
              </h3>
              {!simpleMode && task.targetVenue && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {resolvedVenueUrl ? (
                    <a
                      href={resolvedVenueUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25 transition-colors max-w-[180px]"
                      title={`${task.targetVenue} — ${resolvedVenueUrl}`}
                    >
                      <span className="truncate">{task.targetVenue}</span>
                      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                      {task.targetVenue}
                    </span>
                  )}
                </div>
              )}
              {!simpleMode &&
                (workCategory !== 'PAPER' || milestoneNode || partnerOrg) &&
                (partnerOrg || milestoneNode) && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {[partnerOrg, milestoneNode].filter(Boolean).join(' · ')}
                  </p>
                )}
            </div>

            {/* Checklist progress if present */}
            {task.checklist && task.checklist.length > 0 && (
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800/60">
                <CheckSquare className="w-2.5 h-2.5 text-emerald-500 dark:text-emerald-400" />
                <span>
                  {task.checklist.filter((c) => c.done).length} / {task.checklist.length}
                </span>
                <div className="flex-1 bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden ml-1">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{
                      width: `${
                        (task.checklist.filter((c) => c.done).length / task.checklist.length) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Direct Asset Quick-Links (standard + custom external links) */}
            {!simpleMode && assetLinks.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                {assetLinks.map((link) => {
                  const displayLabel = link.label;
                  return (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700/60 transition-colors max-w-[140px]"
                      title={`${displayLabel}: ${link.url}`}
                    >
                      {link.iconKind === 'overleaf' ? (
                        <FileText className="w-2.5 h-2.5 text-slate-500 dark:text-slate-400 shrink-0" />
                      ) : link.iconKind === 'github' ? (
                        <GitHubIcon className="w-2.5 h-2.5 text-slate-500 dark:text-slate-400 shrink-0" />
                      ) : link.iconKind === 'dataset' ? (
                        <Database className="w-2.5 h-2.5 text-slate-500 dark:text-slate-400 shrink-0" />
                      ) : link.iconKind === 'zotero' ? (
                        <BookOpen className="w-2.5 h-2.5 text-slate-500 dark:text-slate-400 shrink-0" />
                      ) : (
                        <Link2 className="w-2.5 h-2.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                      )}
                      <span className="truncate">{displayLabel}</span>
                      <ExternalLink className="w-2 h-2 opacity-50 shrink-0" />
                    </a>
                  );
                })}
              </div>
            )}

            {/* Bottom Row: Authors + Primary Actions */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-1.5 text-[10px]">
              <div className="flex items-center gap-1.5 truncate text-slate-500 dark:text-slate-400">
                <MemberAvatar member={task.leadAuthor} size="xs" />
                <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                  {leadName}
                </span>
                {!simpleMode && (
                  <>
                    <span className="text-slate-400 dark:text-slate-600">/</span>
                    <span className="text-slate-500 dark:text-slate-400 truncate">{piName}</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!simpleMode && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const defaultRecipient =
                          task.leadAuthor.id === currentUserId ? task.pi.id : task.leadAuthor.id;
                        openRequestModal({
                          recipientId: defaultRecipient,
                          kind: 'PROJECT_SYNC',
                          workCategory,
                          projectId: task.projectId,
                          taskId: task.id,
                          title:
                            language === 'zh'
                              ? `关于「${task.title}」的对接沟通`
                              : `Sync on "${task.title}"`,
                        });
                      }}
                      className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title={language === 'zh' ? '发起 1 对 1 沟通/申请' : 'Send 1-on-1 request'}
                    >
                      <MessageSquare className="w-3 h-3" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLogicTreeTaskId(task.id);
                      }}
                      className={`px-1.5 py-1 rounded text-[10px] flex items-center gap-0.5 transition-colors ${
                        task.logicTree
                          ? 'bg-indigo-500/12 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20'
                          : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={language === 'zh' ? '查看/编辑任务树状逻辑图' : 'Open Task Logic Tree'}
                    >
                      <GitBranch className="w-3 h-3" />
                      {task.logicTree && (
                        <span className="font-semibold">
                          {countLogicTreeStats(task.logicTree).total}
                        </span>
                      )}
                    </button>
                  </>
                )}

                {hasEditPermission && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveBlockerTask(task);
                      }}
                      className={`p-1 rounded text-xs transition-colors ${
                        task.isBlocked
                          ? 'text-red-500 hover:text-red-600 hover:bg-red-500/20'
                          : 'text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={language === 'zh' ? '标记/解除卡点' : 'Report/Resolve Blocker'}
                    >
                      <Flame className="w-3.5 h-3.5" />
                    </button>

                    <div className="inline-flex items-center rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-0.5">
                      <button
                        type="button"
                        disabled={!canStepBack}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canStepBack) {
                            moveTask(task.id, stageIds[curStageIndex - 1]);
                          }
                        }}
                        className={`p-0.5 rounded transition-colors ${
                          canStepBack
                            ? 'text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-white dark:hover:bg-slate-800'
                            : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                        }`}
                        title={language === 'zh' ? '退回上一阶段' : 'Move Back to Previous Stage'}
                        aria-label={language === 'zh' ? '退回上一阶段' : 'Move Back to Previous Stage'}
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={!canStepForward}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canStepForward) {
                            moveTask(task.id, stageIds[curStageIndex + 1]);
                          }
                        }}
                        className={`p-0.5 rounded transition-colors ${
                          canStepForward
                            ? 'text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800'
                            : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                        }`}
                        title={language === 'zh' ? '推进至下一阶段' : 'Advance Stage'}
                        aria-label={language === 'zh' ? '推进至下一阶段' : 'Advance Stage'}
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {isExpanded && <KanbanCardInlineEditor task={task} />}
        </div>
      )}
    </Draggable>
  );
};
