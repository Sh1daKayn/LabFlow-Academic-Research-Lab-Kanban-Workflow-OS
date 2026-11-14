import {
  AcademicStage,
  LabMember,
  Language,
  ProjectItem,
  ReverseDDLForm,
  StageConfig,
  TaskItem,
} from '@/types';
import { subtractDays } from '@/utils/date';
import { getSafeLeadAuthor, getSafePI } from '@/utils/rbac';

/**
 * Reorders tasks within a stage while preserving relative ordering for hidden/filtered tasks.
 */
export function reorderStageTasks(
  tasks: TaskItem[],
  stage: AcademicStage,
  sourceIndex: number,
  destinationIndex: number,
  visibleStageTaskIds?: string[]
): TaskItem[] {
  if (sourceIndex === destinationIndex) return tasks;

  const fullStageTasks = tasks
    .filter((t) => t.stage === stage)
    .sort((a, b) => a.order - b.order);
  const otherTasks = tasks.filter((t) => t.stage !== stage);

  if (fullStageTasks.length === 0) return tasks;

  if (visibleStageTaskIds && visibleStageTaskIds.length > 0) {
    const movedId = visibleStageTaskIds[sourceIndex];
    const targetId = visibleStageTaskIds[destinationIndex];
    if (!movedId || !targetId || movedId === targetId) return tasks;

    const fullMovedIdx = fullStageTasks.findIndex((t) => t.id === movedId);
    if (fullMovedIdx === -1) return tasks;

    const [movedTask] = fullStageTasks.splice(fullMovedIdx, 1);
    const fullTargetIdx = fullStageTasks.findIndex((t) => t.id === targetId);
    if (fullTargetIdx === -1) {
      fullStageTasks.push(movedTask);
    } else {
      const insertAt = sourceIndex < destinationIndex ? fullTargetIdx + 1 : fullTargetIdx;
      fullStageTasks.splice(insertAt, 0, movedTask);
    }
  } else {
    if (
      sourceIndex < 0 ||
      sourceIndex >= fullStageTasks.length ||
      destinationIndex < 0 ||
      destinationIndex >= fullStageTasks.length
    ) {
      return tasks;
    }
    const [movedTask] = fullStageTasks.splice(sourceIndex, 1);
    fullStageTasks.splice(destinationIndex, 0, movedTask);
  }

  const now = new Date().toISOString();
  const reindexed = fullStageTasks.map((t, idx) => ({
    ...t,
    order: idx,
    updatedAt: now,
  }));

  return [...otherTasks, ...reindexed];
}

/**
 * Moves a task to a target stage and cleanly re-indexes order in the destination column.
 */
export function moveTaskToStage(
  tasks: TaskItem[],
  taskId: string,
  targetStage: AcademicStage,
  newOrder?: number
): TaskItem[] {
  const targetTask = tasks.find((t) => t.id === taskId);
  if (!targetTask) return tasks;

  const now = new Date().toISOString();
  const updatedMovedTask: TaskItem = {
    ...targetTask,
    stage: targetStage,
    completedAt: targetStage === 'ACCEPTED' ? targetTask.completedAt || now : undefined,
    progress: targetStage === 'ACCEPTED' ? 100 : targetTask.progress,
    updatedAt: now,
  };

  const remaining = tasks.filter((t) => t.id !== taskId);
  const destTasks = remaining
    .filter((t) => t.stage === targetStage)
    .sort((a, b) => a.order - b.order);
  const otherTasks = remaining.filter((t) => t.stage !== targetStage);

  const insertIndex =
    newOrder !== undefined
      ? Math.max(0, Math.min(newOrder, destTasks.length))
      : destTasks.length;

  destTasks.splice(insertIndex, 0, updatedMovedTask);

  const reindexedDest = destTasks.map((t, idx) => ({
    ...t,
    order: idx,
  }));

  return [...otherTasks, ...reindexedDest];
}

/**
 * Builds a project and its T-N milestone tasks safely regardless of member list length.
 */
export function buildReverseDDLPipeline(
  plan: ReverseDDLForm,
  members: LabMember[],
  stages: StageConfig[],
  language: Language
): { project: ProjectItem; tasks: TaskItem[] } {
  const fallbackMember: LabMember = {
    id: 'member-default',
    nameEn: 'Researcher',
    nameZh: '研究员',
    role: 'PI',
    accessRole: 'ADMIN_PI',
    titleEn: 'Principal Investigator',
    titleZh: '课题组成员',
    avatar: '',
    email: 'lab@labflow.edu',
  };

  const lead = getSafeLeadAuthor(members, plan.leadAuthorId) || fallbackMember;
  const pi = getSafePI(members) || lead;

  const timestamp = Date.now();
  const projectId = `proj-${timestamp}`;
  const defaultStage = stages[1]?.id || stages[0]?.id || 'DATA_EXP';

  const project: ProjectItem = {
    id: projectId,
    title: plan.title,
    category: plan.category?.trim() || undefined,
    targetVenue: plan.targetVenue,
    tag: plan.tag || plan.targetVenue.split(' ')[0] || 'Paper',
    submissionDeadline: plan.deadlineDate,
    status: defaultStage,
    leadAuthorId: lead.id,
    piId: pi.id,
    memberIds: Array.from(new Set([lead.id, pi.id])),
    visibility: plan.visibility || 'PUBLIC',
    assets: {
      overleaf: plan.overleafUrl,
      github: plan.githubUrl,
      dataset: plan.datasetUrl,
      zotero: plan.zoteroUrl,
    },
  };

  const steps =
    plan.customMilestones && plan.customMilestones.length > 0
      ? plan.customMilestones
      : [
          {
            nameEn: 'Baseline & Empirical Freeze',
            nameZh: '基线锁定与实验评测冻结',
            offsetDays: 45,
            stageId: stages[1]?.id || 'DATA_EXP',
          },
          {
            nameEn: 'Full Manuscript Draft Ready',
            nameZh: '完整学术论文初稿就绪',
            offsetDays: 30,
            stageId: stages[2]?.id || 'DRAFTING',
          },
          {
            nameEn: 'Submit to Advisor for Review',
            nameZh: '提交导师进行全篇审阅',
            offsetDays: 14,
            stageId: stages[3]?.id || 'PI_REVIEW',
          },
          {
            nameEn: 'Camera & Formatting Check',
            nameZh: '格式排版与匿名复核',
            offsetDays: 3,
            stageId: stages[3]?.id || 'PI_REVIEW',
          },
        ];

  const validStageIds = new Set(stages.map((s) => s.id));
  const now = new Date().toISOString();

  const tasks: TaskItem[] = steps.map((step, idx) => {
    const stepDeadline = subtractDays(plan.deadlineDate, step.offsetDays);
    const stepStart = subtractDays(stepDeadline, 14);
    const resolvedStage = validStageIds.has(step.stageId) || stages.length === 0
      ? step.stageId
      : defaultStage;

    return {
      id: `task-${timestamp}-${idx + 1}`,
      title: `[T-${step.offsetDays}d] ${language === 'zh' ? step.nameZh : step.nameEn}: ${plan.title}`,
      description: `${plan.targetVenue} milestone planned ${step.offsetDays} days prior to submission.`,
      stage: resolvedStage,
      projectId,
      projectTag: project.tag,
      targetVenue: plan.targetVenue,
      startDate: stepStart,
      deadline: stepDeadline,
      progress: idx === 0 ? 30 : 0,
      leadAuthor: lead,
      pi,
      priority: step.offsetDays <= 7 ? 'URGENT' : 'HIGH',
      visibility: plan.visibility || 'PUBLIC',
      assets: project.assets,
      isBlocked: false,
      order: idx,
      tags: [project.tag, `T-${step.offsetDays}d`],
      createdAt: now,
      updatedAt: now,
    };
  });

  return { project, tasks };
}
