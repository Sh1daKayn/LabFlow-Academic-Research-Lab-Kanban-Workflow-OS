import fs from 'fs/promises';
import path from 'path';
import { Prisma } from '@prisma/client';
import {
  createInitialWeeklyTodos,
  DEFAULT_STAGES,
  DEFAULT_VENUES,
  INITIAL_PROJECTS,
  INITIAL_RESOURCES,
  INITIAL_TASKS,
  LAB_MEMBERS,
} from '@/data/mockData';
import {
  AccessRole,
  BlockerCategory,
  ChecklistItem,
  LabMember,
  LabResource,
  LabWorkspaceData,
  MilestoneTemplate,
  Priority,
  ProjectItem,
  ResourceStatus,
  ResourceType,
  StageConfig,
  StorageMode,
  TaskItem,
  TaskLogicNode,
  VenuePreset,
  VisibilityLevel,
} from '@/types';
import {
  generateSessionSecret,
  hashPassword,
  signAdminToken,
  verifyAdminToken,
  verifyPassword,
} from '@/lib/auth';
import { getPrismaClient, isPostgresConfigured } from '@/lib/prisma';
import { generateInitialsAvatar } from '@/utils/avatar';
import { sanitizeWeeklyTodos } from '@/utils/weeklyTodos';
import {
  DEFAULT_CHECKLIST_TEMPLATES,
  sanitizeChecklistTemplates,
} from '@/utils/templates';

export interface PersistedWorkspaceRecord {
  data: LabWorkspaceData;
  adminPasswordHash: string;
  sessionSecret: string;
  revision: number;
  updatedAt: string;
}

export interface PublicWorkspacePayload {
  data: LabWorkspaceData;
  revision: number;
  updatedAt: string;
  storageMode: StorageMode;
}

const DEFAULT_LAB_ID = 'lab-default';
const DEFAULT_ADMIN_PASS = process.env.LABFLOW_DEFAULT_ADMIN_PASSWORD || 'admin888';

// In-process async mutex to prevent concurrent file writes from racing
let writeChain: Promise<unknown> = Promise.resolve();
function withStoreLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = writeChain.then(fn, fn);
  writeChain = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

function getLocalStoreFilePath(): string {
  const baseDir = process.env.LABFLOW_DATA_DIR || path.join(process.cwd(), '.data');
  return path.join(baseDir, 'labflow-state.json');
}

export function getDefaultWorkspaceData(): LabWorkspaceData {
  return structuredClone({
    stages: DEFAULT_STAGES,
    tasks: INITIAL_TASKS,
    projects: INITIAL_PROJECTS,
    members: LAB_MEMBERS,
    venues: DEFAULT_VENUES,
    resources: INITIAL_RESOURCES,
    weeklyTodos: createInitialWeeklyTodos(),
    allowPeerAcceptance: false,
    checklistTemplates: DEFAULT_CHECKLIST_TEMPLATES,
  });
}

function createInitialRecord(): PersistedWorkspaceRecord {
  return {
    data: getDefaultWorkspaceData(),
    adminPasswordHash: hashPassword(DEFAULT_ADMIN_PASS),
    sessionSecret: process.env.LABFLOW_SESSION_SECRET || generateSessionSecret(),
    revision: 1,
    updatedAt: new Date().toISOString(),
  };
}

export function sanitizeWorkspaceData(input: Partial<LabWorkspaceData>): LabWorkspaceData {
  const defaults = getDefaultWorkspaceData();
  return {
    stages: Array.isArray(input.stages) && input.stages.length > 0 ? input.stages : defaults.stages,
    tasks: Array.isArray(input.tasks) ? input.tasks : [],
    projects: Array.isArray(input.projects) ? input.projects : [],
    members: Array.isArray(input.members) ? input.members : defaults.members,
    venues: Array.isArray(input.venues) ? input.venues : defaults.venues,
    resources: Array.isArray(input.resources) ? input.resources : [],
    weeklyTodos: sanitizeWeeklyTodos(input.weeklyTodos),
    allowPeerAcceptance: Boolean(input.allowPeerAcceptance),
    checklistTemplates: sanitizeChecklistTemplates(input.checklistTemplates),
  };
}

export type StoreErrorCode =
  | 'READONLY_FILESYSTEM'
  | 'DATABASE_UNAVAILABLE'
  | 'STORE_WRITE_FAILED';

export function classifyStoreError(err: unknown): StoreErrorCode {
  if (!err || typeof err !== 'object') {
    return 'STORE_WRITE_FAILED';
  }
  const e = err as { code?: string; name?: string; message?: string };
  if (e.code === 'EROFS' || e.code === 'EACCES' || e.code === 'EPERM') {
    return 'READONLY_FILESYSTEM';
  }
  if (
    e.code === 'P1000' ||
    e.code === 'P1001' ||
    e.code === 'P1002' ||
    e.code === 'P1003' ||
    e.name === 'PrismaClientInitializationError' ||
    (typeof e.message === 'string' &&
      (e.message.includes("Can't reach database server") ||
        e.message.includes('Prisma client unavailable')))
  ) {
    return 'DATABASE_UNAVAILABLE';
  }
  return 'STORE_WRITE_FAILED';
}

export function getStorageMode(): StorageMode {
  return isPostgresConfigured() ? 'postgres' : 'local-file';
}

// =========================================================================
// LOCAL FILE STORE ADAPTER
// =========================================================================

async function readLocalRecord(): Promise<PersistedWorkspaceRecord> {
  const filePath = getLocalStoreFilePath();
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<PersistedWorkspaceRecord>;
    if (!parsed.data || !parsed.adminPasswordHash || !parsed.sessionSecret) {
      throw new Error('Incomplete store file');
    }
    return {
      data: sanitizeWorkspaceData(parsed.data),
      adminPasswordHash: parsed.adminPasswordHash,
      sessionSecret: parsed.sessionSecret,
      revision: typeof parsed.revision === 'number' ? parsed.revision : 1,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    const initial = createInitialRecord();
    try {
      await writeLocalRecord(initial);
    } catch (writeErr) {
      // Allow booting on read-only hosts (e.g. serverless without DATABASE_URL);
      // explicit PUT saves will still surface the write error cleanly.
      console.warn('Could not initialize local workspace file:', writeErr);
    }
    return initial;
  }
}

async function writeLocalRecord(record: PersistedWorkspaceRecord): Promise<void> {
  const filePath = getLocalStoreFilePath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(record, null, 2), 'utf8');
  await fs.rename(tmpPath, filePath);
}

// =========================================================================
// POSTGRES / PRISMA ADAPTER
// =========================================================================

function mapDbRoleToMemberRole(role: string): LabMember['role'] {
  if (role === 'PHD_STUDENT') return 'PHD_CANDIDATE';
  if (role === 'COLLABORATOR') return 'VISITING_SCHOLAR';
  if (
    role === 'PI' ||
    role === 'POSTDOC' ||
    role === 'SENIOR_PHD' ||
    role === 'PHD_CANDIDATE' ||
    role === 'RA' ||
    role === 'VISITING_SCHOLAR'
  ) {
    return role;
  }
  return 'PHD_CANDIDATE';
}

function parseDateOrNull(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function writePostgresRecord(record: PersistedWorkspaceRecord): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) throw new Error('Prisma client unavailable');

  const { data, adminPasswordHash, sessionSecret, revision } = record;
  const fallbackPi =
    data.members.find((m) => m.role === 'PI' || m.accessRole === 'ADMIN_PI') || data.members[0];

  await prisma.$transaction(async (tx) => {
    await tx.workspaceConfig.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        adminPasswordHash,
        sessionSecret,
        revision,
        allowPeerAcceptance: Boolean(data.allowPeerAcceptance),
        weeklyTodos: (data.weeklyTodos || []) as unknown as Prisma.InputJsonValue,
        checklistTemplates: sanitizeChecklistTemplates(
          data.checklistTemplates
        ) as unknown as Prisma.InputJsonValue,
      },
      update: {
        adminPasswordHash,
        sessionSecret,
        revision,
        allowPeerAcceptance: Boolean(data.allowPeerAcceptance),
        weeklyTodos: (data.weeklyTodos || []) as unknown as Prisma.InputJsonValue,
        checklistTemplates: sanitizeChecklistTemplates(
          data.checklistTemplates
        ) as unknown as Prisma.InputJsonValue,
      },
    });

    await tx.lab.upsert({
      where: { id: DEFAULT_LAB_ID },
      create: {
        id: DEFAULT_LAB_ID,
        name: 'LabFlow Research Lab',
        institution: 'Academic Institution',
        slug: 'labflow-default',
        piName: fallbackPi?.nameEn || 'Principal Investigator',
      },
      update: {
        piName: fallbackPi?.nameEn || 'Principal Investigator',
      },
    });

    // Clear and sync transactional workspace tables cleanly
    await tx.blocker.deleteMany();
    await tx.task.deleteMany();
    await tx.project.deleteMany();
    await tx.resourceSlot.deleteMany();
    await tx.stage.deleteMany();
    await tx.venuePreset.deleteMany();
    await tx.membership.deleteMany();
    await tx.user.deleteMany();

    if (data.stages.length > 0) {
      await tx.stage.createMany({
        data: data.stages.map((s, idx) => ({
          id: s.id,
          labelEn: s.labelEn,
          labelZh: s.labelZh,
          subTitleEn: s.subTitleEn || null,
          subTitleZh: s.subTitleZh || null,
          color: s.color,
          badgeBg: s.badgeBg,
          borderColor: s.borderColor,
          sortOrder: idx,
        })),
      });
    }

    if (data.venues.length > 0) {
      await tx.venuePreset.createMany({
        data: data.venues.map((v, idx) => ({
          id: v.id,
          name: v.name,
          tag: v.tag,
          defaultLeadId: v.defaultLeadId,
          milestones: v.milestones as unknown as Prisma.InputJsonValue,
          sortOrder: idx,
        })),
      });
    }

    const usedEmails = new Set<string>();
    const validUserIds = new Set<string>();
    if (data.members.length > 0) {
      await tx.user.createMany({
        data: data.members.map((m) => {
          let email = (m.email || `${m.id}@labflow.edu`).trim();
          if (usedEmails.has(email.toLowerCase())) {
            email = `${m.id}-${usedEmails.size}@labflow.edu`;
          }
          usedEmails.add(email.toLowerCase());
          validUserIds.add(m.id);
          return {
            id: m.id,
            email,
            name: m.nameEn || m.nameZh || m.id,
            nameZh: m.nameZh,
            nameEn: m.nameEn,
            titleZh: m.titleZh,
            titleEn: m.titleEn,
            avatar: m.avatar,
            role: m.role,
            accessRole: (['ADMIN_PI', 'SYS_ADMIN', 'PROJECT_LEAD', 'STUDENT_RA', 'AUDITOR_GUEST'].includes(
              String(m.accessRole)
            )
              ? m.accessRole
              : 'STUDENT_RA') as AccessRole,
            pin: m.pin || null,
          };
        }),
      });

      await tx.membership.createMany({
        data: data.members.map((m) => ({
          labId: DEFAULT_LAB_ID,
          userId: m.id,
          role: m.role,
        })),
      });
    }

    const fallbackUserId = data.members[0]?.id;
    const validProjectIds = new Set<string>();
    if (data.projects.length > 0 && fallbackUserId) {
      await tx.project.createMany({
        data: data.projects.map((p) => {
          validProjectIds.add(p.id);
          return {
            id: p.id,
            title: p.title,
            abstract: p.abstract || null,
            category: p.category || null,
            categoryColor: p.categoryColor || null,
            memberIds: (p.memberIds || []) as unknown as Prisma.InputJsonValue,
            targetVenue: p.targetVenue,
            tag: p.tag,
            submissionDeadline: parseDateOrNull(p.submissionDeadline),
            status: p.status,
            visibility: (p.visibility || 'PUBLIC') as VisibilityLevel,
            overleafUrl: p.assets?.overleaf || null,
            githubUrl: p.assets?.github || null,
            datasetUrl: p.assets?.dataset || null,
            zoteroUrl: p.assets?.zotero || null,
            labId: DEFAULT_LAB_ID,
            leadAuthorId: validUserIds.has(p.leadAuthorId) ? p.leadAuthorId : fallbackUserId,
            piId: validUserIds.has(p.piId) ? p.piId : fallbackUserId,
          };
        }),
      });
    }

    if (data.tasks.length > 0) {
      await tx.task.createMany({
        data: data.tasks.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description || null,
          stage: t.stage,
          projectTag: t.projectTag,
          targetVenue: t.targetVenue,
          priority: t.priority as Priority,
          visibility: (t.visibility || 'PUBLIC') as VisibilityLevel,
          startDate: t.startDate || null,
          deadline: parseDateOrNull(t.deadline),
          progress: typeof t.progress === 'number' ? t.progress : 0,
          order: typeof t.order === 'number' ? t.order : 0,
          projectId: t.projectId && validProjectIds.has(t.projectId) ? t.projectId : null,
          assigneeId: t.leadAuthor?.id && validUserIds.has(t.leadAuthor.id) ? t.leadAuthor.id : null,
          piId: t.pi?.id && validUserIds.has(t.pi.id) ? t.pi.id : null,
          overleafUrl: t.assets?.overleaf || null,
          githubUrl: t.assets?.github || null,
          datasetUrl: t.assets?.dataset || null,
          zoteroUrl: t.assets?.zotero || null,
          tags: (t.tags || []) as unknown as Prisma.InputJsonValue,
          checklist: (t.checklist || []) as unknown as Prisma.InputJsonValue,
          logicTree: t.logicTree
            ? (t.logicTree as unknown as Prisma.InputJsonValue)
            : Prisma.DbNull,
          isBlocked: Boolean(t.isBlocked),
          blockerCategory: t.blocker?.category ? (t.blocker.category as BlockerCategory) : null,
          blockerReason: t.blocker?.details || null,
          blockerTried: t.blocker?.tried || null,
          blockerEscalatedTo: t.blocker?.escalatedTo || null,
          blockedAt: parseDateOrNull(t.blocker?.reportedAt),
          completedAt: parseDateOrNull(t.completedAt),
        })),
      });
    }

    if (data.resources.length > 0) {
      await tx.resourceSlot.createMany({
        data: data.resources.map((r) => ({
          id: r.id,
          labId: DEFAULT_LAB_ID,
          name: r.nameEn || r.nameZh,
          nameZh: r.nameZh,
          nameEn: r.nameEn,
          type: r.type as ResourceType,
          specs: r.specs,
          status: r.status as ResourceStatus,
          currentUser: r.currentUser || null,
          currentJob: r.currentJob || null,
          remainingHours: r.remainingHours || 0,
          vramUtilPercent: r.vramUtilPercent || 0,
        })),
      });
    }
  });
}

async function readPostgresRecord(): Promise<PersistedWorkspaceRecord> {
  const prisma = getPrismaClient();
  if (!prisma) throw new Error('Prisma client unavailable');

  const config = await prisma.workspaceConfig.findUnique({ where: { id: 'default' } });
  if (!config) {
    const initial = createInitialRecord();
    await writePostgresRecord(initial);
    return initial;
  }

  const [dbStages, dbVenues, dbUsers, dbProjects, dbTasks, dbResources] = await Promise.all([
    prisma.stage.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.venuePreset.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.user.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.project.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.task.findMany({ orderBy: { order: 'asc' } }),
    prisma.resourceSlot.findMany({ orderBy: { createdAt: 'asc' } }),
  ]);

  const members: LabMember[] = dbUsers.map((u) => ({
    id: u.id,
    nameZh: u.nameZh || u.name,
    nameEn: u.nameEn || u.name,
    role: mapDbRoleToMemberRole(u.role),
    accessRole: u.accessRole as AccessRole,
    titleZh: u.titleZh,
    titleEn: u.titleEn,
    avatar: u.avatar || generateInitialsAvatar(u.nameEn || u.name, u.id),
    email: u.email,
    pin: u.pin || undefined,
  }));

  const memberMap = new Map(members.map((m) => [m.id, m]));
  const fallbackMember: LabMember = members[0] || LAB_MEMBERS[0];
  const fallbackPi: LabMember =
    members.find((m) => m.role === 'PI' || m.accessRole === 'ADMIN_PI') || fallbackMember;

  const stages: StageConfig[] =
    dbStages.length > 0
      ? dbStages.map((s) => ({
          id: s.id,
          labelEn: s.labelEn,
          labelZh: s.labelZh,
          subTitleEn: s.subTitleEn || undefined,
          subTitleZh: s.subTitleZh || undefined,
          color: s.color,
          badgeBg: s.badgeBg,
          borderColor: s.borderColor,
        }))
      : DEFAULT_STAGES;

  const venues: VenuePreset[] = dbVenues.map((v) => ({
    id: v.id,
    name: v.name,
    tag: v.tag,
    defaultLeadId: v.defaultLeadId,
    milestones: (Array.isArray(v.milestones) ? v.milestones : []) as unknown as MilestoneTemplate[],
  }));

  const projects: ProjectItem[] = dbProjects.map((p) => ({
    id: p.id,
    title: p.title,
    abstract: p.abstract || undefined,
    category: p.category || undefined,
    categoryColor: p.categoryColor || undefined,
    memberIds: Array.isArray(p.memberIds) ? (p.memberIds as string[]) : undefined,
    targetVenue: p.targetVenue,
    tag: p.tag,
    submissionDeadline: p.submissionDeadline
      ? p.submissionDeadline.toISOString().split('T')[0]
      : undefined,
    status: p.status,
    leadAuthorId: p.leadAuthorId,
    piId: p.piId,
    visibility: p.visibility as VisibilityLevel,
    assets: {
      overleaf: p.overleafUrl || undefined,
      github: p.githubUrl || undefined,
      dataset: p.datasetUrl || undefined,
      zotero: p.zoteroUrl || undefined,
    },
  }));

  const tasks: TaskItem[] = dbTasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description || undefined,
    stage: t.stage,
    projectId: t.projectId || 'proj-general',
    projectTag: t.projectTag,
    targetVenue: t.targetVenue,
    startDate: t.startDate || undefined,
    deadline: t.deadline ? t.deadline.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    progress: t.progress,
    leadAuthor: (t.assigneeId && memberMap.get(t.assigneeId)) || fallbackMember,
    pi: (t.piId && memberMap.get(t.piId)) || fallbackPi,
    priority: t.priority as Priority,
    visibility: t.visibility as VisibilityLevel,
    assets: {
      overleaf: t.overleafUrl || undefined,
      github: t.githubUrl || undefined,
      dataset: t.datasetUrl || undefined,
      zotero: t.zoteroUrl || undefined,
    },
    isBlocked: t.isBlocked,
    blocker:
      t.isBlocked && t.blockerCategory
        ? {
            category: t.blockerCategory as BlockerCategory,
            details: t.blockerReason || '',
            tried: t.blockerTried || '',
            escalatedTo: t.blockerEscalatedTo || fallbackPi.nameEn,
            reportedAt: (t.blockedAt || t.updatedAt).toISOString(),
          }
        : undefined,
    order: t.order,
    tags: Array.isArray(t.tags) ? (t.tags as string[]) : undefined,
    checklist: Array.isArray(t.checklist) ? (t.checklist as unknown as ChecklistItem[]) : undefined,
    logicTree:
      t.logicTree && typeof t.logicTree === 'object'
        ? (t.logicTree as unknown as TaskLogicNode)
        : undefined,
    completedAt: t.completedAt ? t.completedAt.toISOString() : undefined,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  const resources: LabResource[] = dbResources.map((r) => ({
    id: r.id,
    nameZh: r.nameZh || r.name,
    nameEn: r.nameEn || r.name,
    type: r.type as ResourceType,
    specs: r.specs || '',
    status: r.status as ResourceStatus,
    currentUser: r.currentUser || undefined,
    currentJob: r.currentJob || undefined,
    remainingHours: r.remainingHours || undefined,
    vramUtilPercent: r.vramUtilPercent || undefined,
    updatedAt: r.updatedAt.toISOString(),
  }));

  return {
    data: {
      stages,
      tasks,
      projects,
      members,
      venues,
      resources,
      weeklyTodos: sanitizeWeeklyTodos(config.weeklyTodos),
      allowPeerAcceptance: Boolean(config.allowPeerAcceptance),
      checklistTemplates: sanitizeChecklistTemplates(config.checklistTemplates),
    },
    adminPasswordHash: config.adminPasswordHash,
    sessionSecret: config.sessionSecret,
    revision: config.revision,
    updatedAt: config.updatedAt.toISOString(),
  };
}

// =========================================================================
// UNIFIED STORE OPERATIONS
// =========================================================================

async function readRecord(): Promise<PersistedWorkspaceRecord> {
  if (isPostgresConfigured()) {
    return readPostgresRecord();
  }
  return readLocalRecord();
}

async function writeRecord(record: PersistedWorkspaceRecord): Promise<void> {
  if (isPostgresConfigured()) {
    await writePostgresRecord(record);
    return;
  }
  await writeLocalRecord(record);
}

export async function getPublicWorkspaceState(): Promise<PublicWorkspacePayload> {
  return withStoreLock(async () => {
    const rec = await readRecord();
    return {
      data: rec.data,
      revision: rec.revision,
      updatedAt: rec.updatedAt,
      storageMode: getStorageMode(),
    };
  });
}

export async function saveWorkspaceData(
  nextData: Partial<LabWorkspaceData>,
  expectedRevision?: number
): Promise<PublicWorkspacePayload & { conflict: boolean }> {
  return withStoreLock(async () => {
    const current = await readRecord();
    if (
      typeof expectedRevision === 'number' &&
      expectedRevision > 0 &&
      current.revision !== expectedRevision
    ) {
      return {
        data: current.data,
        revision: current.revision,
        updatedAt: current.updatedAt,
        storageMode: getStorageMode(),
        conflict: true,
      };
    }

    const updatedRecord: PersistedWorkspaceRecord = {
      ...current,
      data: sanitizeWorkspaceData(nextData),
      revision: current.revision + 1,
      updatedAt: new Date().toISOString(),
    };
    await writeRecord(updatedRecord);
    return {
      data: updatedRecord.data,
      revision: updatedRecord.revision,
      updatedAt: updatedRecord.updatedAt,
      storageMode: getStorageMode(),
      conflict: false,
    };
  });
}

export async function authenticateAdminPassword(
  password: string
): Promise<{ valid: boolean; token?: string }> {
  return withStoreLock(async () => {
    const rec = await readRecord();
    if (!verifyPassword(password, rec.adminPasswordHash)) {
      return { valid: false };
    }
    return { valid: true, token: signAdminToken(rec.sessionSecret) };
  });
}

export async function isAdminSessionValid(token?: string | null): Promise<boolean> {
  if (!token) return false;
  return withStoreLock(async () => {
    const rec = await readRecord();
    return verifyAdminToken(token, rec.sessionSecret);
  });
}

export async function changeAdminPassword(newPassword: string): Promise<void> {
  return withStoreLock(async () => {
    const rec = await readRecord();
    const updated: PersistedWorkspaceRecord = {
      ...rec,
      adminPasswordHash: hashPassword(newPassword),
      updatedAt: new Date().toISOString(),
    };
    await writeRecord(updated);
  });
}
