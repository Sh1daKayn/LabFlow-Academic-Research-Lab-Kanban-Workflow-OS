'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AcademicStage,
  AccessRole,
  BlockerInfo,
  ChecklistAcceptanceTemplate,
  ChecklistItem,
  ChecklistTemplateEntry,
  LabMember,
  LabResource,
  LabWorkspaceData,
  Language,
  ProjectItem,
  ReverseDDLForm,
  StageConfig,
  StorageMode,
  TaskItem,
  VenuePreset,
  VisibilityLevel,
  WeeklyTodoAcceptanceStatus,
  WeeklyTodoItem,
} from '@/types';
import {
  createInitialWeeklyTodos,
  DEFAULT_STAGES,
  DEFAULT_VENUES,
  INITIAL_PROJECTS,
  INITIAL_RESOURCES,
  INITIAL_TASKS,
  LAB_MEMBERS,
} from '@/data/mockData';
import { en, LocaleTranslations } from '@/locales/en';
import { zh } from '@/locales/zh';
import { triggerConfetti } from '@/utils/confetti';
import { ParsedAIData } from '@/utils/aiDocumentParser';
import { generateInitialsAvatar } from '@/utils/avatar';
import {
  applyTodoToggleToTasks,
  canAcceptWeeklyTodo,
  getWeekKey,
  sanitizeWeeklyTodos,
  syncTaskChecklistChangesToTodos,
} from '@/utils/weeklyTodos';
import {
  buildChecklistItemsFromTemplate,
  buildWeeklyTodosFromTemplate,
  DEFAULT_CHECKLIST_TEMPLATES,
  sanitizeChecklistTemplates,
} from '@/utils/templates';
import {
  canAdvanceToStage,
  canAssignAccessRole,
  canDeleteTask as checkCanDeleteTask,
  canEditTask as checkCanEditTask,
  canManageLabRole,
  canViewProject,
  canViewTask,
  deriveAccessRole,
  getSafePI,
} from '@/utils/rbac';
import {
  buildReverseDDLPipeline,
  moveTaskToStage,
  reorderStageTasks,
} from '@/utils/taskOperations';
import { buildWeeklyDigestMarkdown } from '@/utils/weeklyDigest';
import { ThemeContextType, ThemeProvider, useLabTheme } from '@/context/ThemeContext';
import { ToastItem, UIContextType, UIProvider, useLabUI } from '@/context/UIContext';

export type { ToastItem };
export { useLabTheme, useLabUI };

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline';

interface LabDataContextType {
  // Locale & Translation
  language: Language;
  setLanguage: (lang: Language) => void;
  t: LocaleTranslations;

  // Storage & Sync Status
  storageMode: StorageMode;
  syncStatus: SyncStatus;
  lastSyncError: string | null;
  lastSyncedAt: string | null;
  retryServerSync: () => Promise<boolean>;

  // Stages
  stages: StageConfig[];
  addStage: (stage: StageConfig) => void;
  updateStage: (stageId: string, updates: Partial<StageConfig>) => void;
  deleteStage: (stageId: string) => void;
  restoreDefaultStages: () => void;

  // Target Venues
  venues: VenuePreset[];
  addVenue: (venue: VenuePreset) => void;
  deleteVenue: (venueId: string) => void;

  // Members & Current User
  members: LabMember[];
  currentUserId: string;
  setCurrentUserId: (id: string) => void;
  addMember: (member: LabMember) => void;
  updateMember: (id: string, updates: Partial<LabMember>) => void;
  deleteMember: (id: string) => void;

  // Core Data
  tasks: TaskItem[];
  allTasksCount: number;
  projects: ProjectItem[];
  resources: LabResource[];
  weeklyTodos: WeeklyTodoItem[];
  allowPeerAcceptance: boolean;
  checklistTemplates: ChecklistAcceptanceTemplate[];
  addProject: (project: Omit<ProjectItem, 'id'> & { id?: string }) => ProjectItem;
  updateProject: (projectId: string, updates: Partial<ProjectItem>) => void;
  deleteProject: (projectId: string) => void;

  // Weekly To-Do & Acceptance Actions
  addWeeklyTodo: (
    todo: Omit<WeeklyTodoItem, 'id' | 'createdAt' | 'updatedAt' | 'acceptanceStatus'> & {
      acceptanceStatus?: WeeklyTodoAcceptanceStatus;
    }
  ) => WeeklyTodoItem | null;
  updateWeeklyTodo: (todoId: string, updates: Partial<WeeklyTodoItem>) => void;
  deleteWeeklyTodo: (todoId: string) => void;
  acceptWeeklyTodo: (
    todoId: string,
    decision: 'ACCEPTED' | 'REVISION_REQUESTED',
    notes?: string
  ) => void;
  canAcceptTodo: (todo: WeeklyTodoItem) => boolean;
  pushChecklistItemToWeeklyTodo: (params: {
    task: TaskItem;
    checklistItem: ChecklistItem;
    memberId: string;
    weekKey?: string;
    acceptanceCriteria?: string;
  }) => void;
  setWorkspacePeerAcceptance: (enabled: boolean) => void;

  // Checklist & Acceptance Template Actions
  saveChecklistTemplate: (input: {
    id?: string;
    name: string;
    description?: string;
    category?: string;
    items: ChecklistTemplateEntry[];
  }) => ChecklistAcceptanceTemplate | null;
  deleteChecklistTemplate: (templateId: string) => void;
  resetChecklistTemplates: () => void;
  injectTemplateToTask: (params: {
    taskId: string;
    templateId: string;
    alsoPushWeeklyTodos?: boolean;
    weekKey?: string;
  }) => ChecklistItem[] | null;
  injectTemplateToWeeklyTodos: (params: {
    templateId: string;
    memberId: string;
    weekKey: string;
    projectId?: string;
    taskId?: string;
  }) => number;

  // AI Import
  applyAIImport: (data: ParsedAIData, mode: 'overwrite' | 'append') => void;

  // Actions
  moveTask: (taskId: string, targetStage: AcademicStage, newOrder?: number) => void;
  reorderTasks: (
    stage: AcademicStage,
    sourceIndex: number,
    destinationIndex: number,
    visibleStageTaskIds?: string[]
  ) => void;
  reportBlocker: (taskId: string, blocker: BlockerInfo) => void;
  resolveBlocker: (taskId: string) => void;
  addTask: (task: Omit<TaskItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (taskId: string, updates: Partial<TaskItem>) => void;
  updateTaskProgress: (taskId: string, progress: number) => void;
  updateTaskDates: (taskId: string, startDate?: string, deadline?: string) => void;
  deleteTask: (taskId: string) => void;
  generateReverseDDLPipeline: (plan: ReverseDDLForm) => void;
  claimResource: (resourceId: string, currentUser: string, currentJob: string, hours: number) => void;
  releaseResource: (resourceId: string) => void;
  addResource: (res: LabResource) => void;
  updateResource: (id: string, updates: Partial<LabResource>) => void;
  deleteResource: (id: string) => void;
  resetToMockData: () => void;
  cleanSlateWipe: () => void;
  exportDataBackup: () => void;
  importDataBackup: (jsonStr: string) => boolean;
  generateMyWeeklyDigest: (targetMemberId?: string) => string;

  // Permissions & RBAC
  isAdminUnlocked: boolean;
  currentMember: LabMember;
  currentAccessRole: AccessRole;
  effectiveIsAdmin: boolean;
  isSysAdmin: boolean;
  unlockAdmin: (password: string) => Promise<boolean>;
  lockAdmin: () => Promise<void>;
  updateAdminPassword: (newPass: string) => Promise<boolean>;
  requireAdminAuth: (action: () => void) => void;
  canEditTask: (task: TaskItem) => boolean;
  canDeleteTask: (task: TaskItem) => boolean;
  canManageLab: () => boolean;
  canEditMemberProfile: (memberId: string) => boolean;
  canAssignMemberRole: (targetMember: LabMember, nextRole?: AccessRole) => boolean;
  registerNewMember: (memberData: {
    nameZh: string;
    nameEn: string;
    role: LabMember['role'];
    email: string;
    accessRole?: AccessRole;
  }) => LabMember;
}

export type LabFlowContextType = LabDataContextType & ThemeContextType & UIContextType;

const LabDataContext = createContext<LabDataContextType | undefined>(undefined);

const CACHE_KEYS = {
  LANG: 'labflow_lang_v3',
  CURRENT_USER: 'labflow_current_user_v3',
  STAGES: 'labflow_stages_v3',
  TASKS: 'labflow_tasks_v3',
  PROJECTS: 'labflow_projects_v3',
  MEMBERS: 'labflow_members_v3',
  VENUES: 'labflow_venues_v3',
  RESOURCES: 'labflow_resources_v3',
  WEEKLY_TODOS: 'labflow_weekly_todos_v3',
  ALLOW_PEER_ACCEPTANCE: 'labflow_peer_acceptance_v3',
  CHECKLIST_TEMPLATES: 'labflow_checklist_templates_v3',
  PENDING_OFFLINE_SYNC: 'labflow_pending_offline_sync_v3',
  LEGACY_ADMIN_PASS: 'labflow_admin_password_v3',
  LEGACY_ADMIN_UNLOCKED: 'labflow_admin_unlocked_v3',
};

function serializeWorkspace(workspace: LabWorkspaceData): string {
  return JSON.stringify({
    stages: workspace.stages,
    tasks: workspace.tasks,
    projects: workspace.projects,
    members: workspace.members,
    venues: workspace.venues,
    resources: workspace.resources,
    weeklyTodos: workspace.weeklyTodos || [],
    allowPeerAcceptance: Boolean(workspace.allowPeerAcceptance),
    checklistTemplates: sanitizeChecklistTemplates(workspace.checklistTemplates),
  });
}

const LabDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    addToast,
    setFilterOnlyBlockers,
    setSearchQuery,
    setFilterMemberId,
    setSelectedStageFilter,
    setSelectedProjectFilter,
    setViewMode,
    selectedTask,
    setSelectedTask,
    setIsPasswordModalOpen,
  } = useLabUI();

  const [language, setLanguage] = useState<Language>('zh');
  const [stages, setStages] = useState<StageConfig[]>(DEFAULT_STAGES);
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [projects, setProjects] = useState<ProjectItem[]>(INITIAL_PROJECTS);
  const [members, setMembers] = useState<LabMember[]>(LAB_MEMBERS);
  const [venues, setVenues] = useState<VenuePreset[]>(DEFAULT_VENUES);
  const [currentUserId, setCurrentUserId] = useState<string>('member-student1');
  const [resources, setResources] = useState<LabResource[]>(INITIAL_RESOURCES);
  const [weeklyTodos, setWeeklyTodos] = useState<WeeklyTodoItem[]>(() =>
    createInitialWeeklyTodos()
  );
  const [allowPeerAcceptance, setAllowPeerAcceptance] = useState<boolean>(false);
  const [checklistTemplates, setChecklistTemplates] = useState<ChecklistAcceptanceTemplate[]>(() =>
    structuredClone(DEFAULT_CHECKLIST_TEMPLATES)
  );

  const [storageMode, setStorageMode] = useState<StorageMode>('local-file');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Auth & RBAC State (verified against server-issued HttpOnly cookie)
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [passwordCallback, setPasswordCallback] = useState<(() => void) | null>(null);

  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  const serverRevisionRef = useRef<number>(0);
  const lastSyncedSerializedRef = useRef<string>('');
  const syncInFlightRef = useRef<boolean>(false);
  const pendingResyncRef = useRef<boolean>(false);
  const notifiedOfflineRef = useRef<boolean>(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const languageRef = useRef<Language>(language);
  languageRef.current = language;
  const latestWorkspaceRef = useRef<LabWorkspaceData>({
    stages: DEFAULT_STAGES,
    tasks: INITIAL_TASKS,
    projects: INITIAL_PROJECTS,
    members: LAB_MEMBERS,
    venues: DEFAULT_VENUES,
    resources: INITIAL_RESOURCES,
    weeklyTodos: [],
    allowPeerAcceptance: false,
    checklistTemplates: DEFAULT_CHECKLIST_TEMPLATES,
  });

  latestWorkspaceRef.current = {
    stages,
    tasks,
    projects,
    members,
    venues,
    resources,
    weeklyTodos,
    allowPeerAcceptance,
    checklistTemplates,
  };

  const t = language === 'zh' ? zh : en;

  const applyServerSnapshot = useCallback((snapshot: LabWorkspaceData) => {
    lastSyncedSerializedRef.current = serializeWorkspace(snapshot);
    setStages(snapshot.stages);
    setTasks(snapshot.tasks);
    setProjects(snapshot.projects);
    setMembers(snapshot.members);
    setVenues(snapshot.venues);
    setResources(snapshot.resources);
    setWeeklyTodos(sanitizeWeeklyTodos(snapshot.weeklyTodos));
    setAllowPeerAcceptance(Boolean(snapshot.allowPeerAcceptance));
    setChecklistTemplates(sanitizeChecklistTemplates(snapshot.checklistTemplates));
  }, []);

  const formatSyncError = useCallback((code?: string, fallbackMsg?: string) => {
    const isZh = languageRef.current === 'zh';
    if (code === 'READONLY_FILESYSTEM') {
      return isZh
        ? '服务器文件系统只读（未配置 PostgreSQL 数据库），更新目前仅保存在本机浏览器缓存中'
        : 'Server filesystem is read-only (no PostgreSQL configured); edits are currently kept in browser storage only';
    }
    if (code === 'DATABASE_UNAVAILABLE') {
      return isZh
        ? '无法连接 PostgreSQL 数据库，更新暂存在本机浏览器缓存中，请检查 DATABASE_URL 与数据库状态'
        : 'Cannot reach PostgreSQL database; edits are cached locally until connection recovers';
    }
    return isZh
      ? `无法保存到服务器（${fallbackMsg || '网络或服务端异常'}），更新暂存在本机浏览器缓存中`
      : `Could not save to server (${fallbackMsg || 'network or server error'}); edits are cached locally`;
  }, []);

  // Hydrate client preferences & fetch authoritative server workspace
  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      let hasCachedWorkspace = false;
      let hasPendingOfflineSync = false;

      try {
        // Purge legacy plain-text credential keys from browser storage
        localStorage.removeItem(CACHE_KEYS.LEGACY_ADMIN_PASS);
        sessionStorage.removeItem(CACHE_KEYS.LEGACY_ADMIN_UNLOCKED);

        const savedLang = localStorage.getItem(CACHE_KEYS.LANG) as Language | null;
        const savedUser = localStorage.getItem(CACHE_KEYS.CURRENT_USER);
        if (savedLang === 'zh' || savedLang === 'en') setLanguage(savedLang);
        if (savedUser) setCurrentUserId(savedUser);
        hasPendingOfflineSync = localStorage.getItem(CACHE_KEYS.PENDING_OFFLINE_SYNC) === '1';

        // Apply cached offline copy initially before server response arrives
        const cachedTasks = localStorage.getItem(CACHE_KEYS.TASKS);
        const cachedStages = localStorage.getItem(CACHE_KEYS.STAGES);
        const cachedProjects = localStorage.getItem(CACHE_KEYS.PROJECTS);
        const cachedMembers = localStorage.getItem(CACHE_KEYS.MEMBERS);
        const cachedVenues = localStorage.getItem(CACHE_KEYS.VENUES);
        const cachedResources = localStorage.getItem(CACHE_KEYS.RESOURCES);
        const cachedTodos = localStorage.getItem(CACHE_KEYS.WEEKLY_TODOS);
        const cachedPeerAcc = localStorage.getItem(CACHE_KEYS.ALLOW_PEER_ACCEPTANCE);
        const cachedTemplates = localStorage.getItem(CACHE_KEYS.CHECKLIST_TEMPLATES);

        if (cachedStages) setStages(JSON.parse(cachedStages));
        if (cachedTasks) setTasks(JSON.parse(cachedTasks));
        if (cachedProjects) setProjects(JSON.parse(cachedProjects));
        if (cachedMembers) setMembers(JSON.parse(cachedMembers));
        if (cachedVenues) setVenues(JSON.parse(cachedVenues));
        if (cachedResources) setResources(JSON.parse(cachedResources));
        if (cachedTodos) setWeeklyTodos(sanitizeWeeklyTodos(JSON.parse(cachedTodos)));
        if (cachedPeerAcc !== null) setAllowPeerAcceptance(cachedPeerAcc === 'true');
        if (cachedTemplates !== null) {
          setChecklistTemplates(sanitizeChecklistTemplates(JSON.parse(cachedTemplates)));
        }
        hasCachedWorkspace = Boolean(cachedTasks || cachedProjects || cachedMembers);
      } catch (e) {
        console.warn('Could not read local cache', e);
      }

      try {
        const res = await fetch('/api/labflow', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload = (await res.json()) as {
          data: LabWorkspaceData;
          revision: number;
          updatedAt?: string;
          storageMode: StorageMode;
          isAdminUnlocked?: boolean;
        };

        if (cancelled) return;
        serverRevisionRef.current = payload.revision;
        setStorageMode(payload.storageMode);
        setIsAdminUnlocked(Boolean(payload.isAdminUnlocked));
        if (payload.updatedAt) setLastSyncedAt(payload.updatedAt);

        if (hasPendingOfflineSync && hasCachedWorkspace) {
          // Keep unsynced local edits and let sync effect flush them to server
          lastSyncedSerializedRef.current = serializeWorkspace(payload.data);
          setSyncStatus('syncing');
        } else {
          applyServerSnapshot(payload.data);
          try {
            localStorage.removeItem(CACHE_KEYS.PENDING_OFFLINE_SYNC);
          } catch {}
          setLastSyncError(null);
          notifiedOfflineRef.current = false;
          setSyncStatus('synced');
        }

        const memberSource =
          hasPendingOfflineSync && hasCachedWorkspace
            ? latestWorkspaceRef.current.members
            : payload.data.members;
        setCurrentUserId((prevId) => {
          const valid = memberSource.some((m) => m.id === prevId);
          return valid ? prevId : memberSource[0]?.id || 'member-student1';
        });
      } catch (e) {
        console.warn('Server workspace unavailable, running offline cache:', e);
        if (!cancelled) {
          setSyncStatus('offline');
          setLastSyncError(
            formatSyncError(undefined, e instanceof Error ? e.message : 'unavailable')
          );
        }
      } finally {
        if (!cancelled) setIsHydrated(true);
      }
    };

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [applyServerSnapshot, formatSyncError]);

  // Persist language and active member selection locally
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(CACHE_KEYS.LANG, language);
      localStorage.setItem(CACHE_KEYS.CURRENT_USER, currentUserId);
    } catch {}
  }, [language, currentUserId, isHydrated]);

  const flushWorkspaceToServer = useCallback(
    async (options?: { manual?: boolean }): Promise<boolean> => {
      if (syncInFlightRef.current) {
        pendingResyncRef.current = true;
        return false;
      }

      const payloadData = latestWorkspaceRef.current;
      const payloadSerialized = serializeWorkspace(payloadData);
      if (payloadSerialized === lastSyncedSerializedRef.current && !options?.manual) {
        setSyncStatus('synced');
        return true;
      }

      syncInFlightRef.current = true;
      setSyncStatus('syncing');

      try {
        const res = await fetch('/api/labflow', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: payloadData,
            expectedRevision: serverRevisionRef.current,
          }),
        });

        if (res.status === 409) {
          const conflictBody = (await res.json()) as {
            data?: LabWorkspaceData;
            revision?: number;
            updatedAt?: string;
          };
          if (conflictBody.data && typeof conflictBody.revision === 'number') {
            serverRevisionRef.current = conflictBody.revision;
            if (conflictBody.updatedAt) setLastSyncedAt(conflictBody.updatedAt);
            applyServerSnapshot(conflictBody.data);
            try {
              localStorage.removeItem(CACHE_KEYS.PENDING_OFFLINE_SYNC);
            } catch {}
            setLastSyncError(null);
            notifiedOfflineRef.current = false;
            addToast(
              languageRef.current === 'zh'
                ? '检测到其他协作成员更新了工作区，已同步最新数据'
                : 'Synced newer workspace changes from another session',
              '',
              'info'
            );
          }
          setSyncStatus('synced');
          return true;
        }

        if (!res.ok) {
          let errCode: string | undefined;
          let errDetail = `HTTP ${res.status}`;
          try {
            const errBody = (await res.json()) as { error?: string; code?: string };
            errCode = errBody.code;
            if (errBody.error) errDetail = errBody.error;
          } catch {}

          const message = formatSyncError(errCode, errDetail);
          setLastSyncError(message);
          setSyncStatus('offline');
          try {
            localStorage.setItem(CACHE_KEYS.PENDING_OFFLINE_SYNC, '1');
          } catch {}
          if (options?.manual || !notifiedOfflineRef.current) {
            notifiedOfflineRef.current = true;
            addToast(
              languageRef.current === 'zh' ? '服务器同步受限 · 仅保存在本机缓存' : 'Server Sync Failed',
              message,
              'warning'
            );
          }
          return false;
        }

        const saved = (await res.json()) as {
          revision: number;
          updatedAt?: string;
          storageMode: StorageMode;
        };
        serverRevisionRef.current = saved.revision;
        lastSyncedSerializedRef.current = payloadSerialized;
        if (saved.updatedAt) setLastSyncedAt(saved.updatedAt);
        setStorageMode(saved.storageMode);
        setLastSyncError(null);
        notifiedOfflineRef.current = false;
        try {
          localStorage.removeItem(CACHE_KEYS.PENDING_OFFLINE_SYNC);
        } catch {}
        setSyncStatus('synced');
        if (options?.manual) {
          addToast(
            languageRef.current === 'zh' ? '已成功同步至服务器' : 'Synced to server',
            saved.storageMode === 'postgres'
              ? 'PostgreSQL'
              : languageRef.current === 'zh'
              ? '已写入服务端数据文件 (.data/labflow-state.json)'
              : 'Saved to host store (.data/labflow-state.json)',
            'success'
          );
        }
        return true;
      } catch (e) {
        const message = formatSyncError(
          undefined,
          e instanceof Error ? e.message : 'network error'
        );
        console.warn('Failed to persist workspace to server:', e);
        setLastSyncError(message);
        setSyncStatus('offline');
        try {
          localStorage.setItem(CACHE_KEYS.PENDING_OFFLINE_SYNC, '1');
        } catch {}
        if (options?.manual || !notifiedOfflineRef.current) {
          notifiedOfflineRef.current = true;
          addToast(
            languageRef.current === 'zh' ? '服务器连接失败 · 仅保存在本机缓存' : 'Server Unreachable',
            message,
            'warning'
          );
        }
        return false;
      } finally {
        syncInFlightRef.current = false;
        if (pendingResyncRef.current) {
          pendingResyncRef.current = false;
          void flushWorkspaceToServer();
        }
      }
    },
    [applyServerSnapshot, addToast, formatSyncError]
  );

  const retryServerSync = useCallback(() => {
    return flushWorkspaceToServer({ manual: true });
  }, [flushWorkspaceToServer]);

  // Write offline cache & debounce server sync on domain state changes
  useEffect(() => {
    if (!isHydrated) return;

    const currentWorkspace: LabWorkspaceData = {
      stages,
      tasks,
      projects,
      members,
      venues,
      resources,
      weeklyTodos,
      allowPeerAcceptance,
      checklistTemplates,
    };

    try {
      localStorage.setItem(CACHE_KEYS.STAGES, JSON.stringify(stages));
      localStorage.setItem(CACHE_KEYS.TASKS, JSON.stringify(tasks));
      localStorage.setItem(CACHE_KEYS.PROJECTS, JSON.stringify(projects));
      localStorage.setItem(CACHE_KEYS.MEMBERS, JSON.stringify(members));
      localStorage.setItem(CACHE_KEYS.VENUES, JSON.stringify(venues));
      localStorage.setItem(CACHE_KEYS.RESOURCES, JSON.stringify(resources));
      localStorage.setItem(CACHE_KEYS.WEEKLY_TODOS, JSON.stringify(weeklyTodos));
      localStorage.setItem(CACHE_KEYS.ALLOW_PEER_ACCEPTANCE, allowPeerAcceptance ? 'true' : 'false');
      localStorage.setItem(CACHE_KEYS.CHECKLIST_TEMPLATES, JSON.stringify(checklistTemplates));
    } catch {}

    const serialized = serializeWorkspace(currentWorkspace);
    if (serialized === lastSyncedSerializedRef.current) {
      try {
        localStorage.removeItem(CACHE_KEYS.PENDING_OFFLINE_SYNC);
      } catch {}
      setLastSyncError(null);
      setSyncStatus((prev) => (prev === 'idle' ? 'synced' : prev === 'syncing' ? 'synced' : prev));
      return;
    }

    try {
      localStorage.setItem(CACHE_KEYS.PENDING_OFFLINE_SYNC, '1');
    } catch {}

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      void flushWorkspaceToServer();
    }, 250);

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [
    stages,
    tasks,
    projects,
    members,
    venues,
    resources,
    weeklyTodos,
    allowPeerAcceptance,
    checklistTemplates,
    isHydrated,
    flushWorkspaceToServer,
  ]);

  // Flush pending workspace changes immediately if tab closes/reloads before debounce fires
  useEffect(() => {
    if (!isHydrated) return;

    const flushPendingBeforeLeave = () => {
      const currentSerialized = serializeWorkspace(latestWorkspaceRef.current);
      if (currentSerialized === lastSyncedSerializedRef.current) return;
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }
      const body = JSON.stringify({
        data: latestWorkspaceRef.current,
        expectedRevision: serverRevisionRef.current,
      });
      void fetch('/api/labflow', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: body.length < 60_000,
      }).catch(() => {});
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushPendingBeforeLeave();
      }
    };

    window.addEventListener('pagehide', flushPendingBeforeLeave);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', flushPendingBeforeLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isHydrated]);

  // Keep selectedTask synchronized with updates to the underlying task list
  useEffect(() => {
    if (!selectedTask) return;
    const latest = tasks.find((item) => item.id === selectedTask.id);
    if (!latest) {
      setSelectedTask(null);
    } else if (latest !== selectedTask) {
      setSelectedTask(latest);
    }
  }, [tasks, selectedTask, setSelectedTask]);

  // Lightweight multi-user background polling every 12s when tab is active
  useEffect(() => {
    if (!isHydrated) return;

    const timer = setInterval(async () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      if (syncInFlightRef.current || pendingResyncRef.current) return;

      try {
        const res = await fetch('/api/labflow', { cache: 'no-store' });
        if (!res.ok) return;
        const payload = (await res.json()) as {
          data: LabWorkspaceData;
          revision: number;
          updatedAt?: string;
          storageMode: StorageMode;
          isAdminUnlocked?: boolean;
        };

        setStorageMode(payload.storageMode);
        setIsAdminUnlocked(Boolean(payload.isAdminUnlocked));

        const hasDirtyLocal =
          serializeWorkspace(latestWorkspaceRef.current) !== lastSyncedSerializedRef.current;

        if (hasDirtyLocal) {
          if (!syncTimerRef.current) {
            void flushWorkspaceToServer();
          }
          return;
        }

        if (payload.revision > serverRevisionRef.current) {
          serverRevisionRef.current = payload.revision;
          if (payload.updatedAt) setLastSyncedAt(payload.updatedAt);
          applyServerSnapshot(payload.data);
          setLastSyncError(null);
          setSyncStatus('synced');
        } else {
          setLastSyncError(null);
          setSyncStatus((prev) => (prev === 'offline' ? 'synced' : prev));
        }
      } catch {
        // Keep current status on transient polling failures
      }
    }, 12000);

    return () => clearInterval(timer);
  }, [isHydrated, applyServerSnapshot, flushWorkspaceToServer]);

  // Current Member & RBAC Derivation
  const currentMember: LabMember = useMemo(() => {
    return members.find((m) => m.id === currentUserId) || members[0] || LAB_MEMBERS[0];
  }, [members, currentUserId]);

  const currentAccessRole: AccessRole = useMemo(
    () => deriveAccessRole(currentMember),
    [currentMember]
  );

  const effectiveIsAdmin = currentAccessRole === 'ADMIN_PI' && isAdminUnlocked;
  const isSysAdmin = currentAccessRole === 'SYS_ADMIN';

  const visibleTasks = useMemo(() => {
    return tasks.filter((task) =>
      canViewTask(task, currentUserId, currentAccessRole, effectiveIsAdmin, projects)
    );
  }, [tasks, projects, currentAccessRole, currentUserId, effectiveIsAdmin]);

  const visibleProjects = useMemo(() => {
    return projects.filter((proj) =>
      canViewProject(proj, currentUserId, currentAccessRole, effectiveIsAdmin)
    );
  }, [projects, currentAccessRole, currentUserId, effectiveIsAdmin]);

  // Admin Session Actions (Server-Side Auth)
  const unlockAdmin = async (password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) return false;
      const body = (await res.json()) as { unlocked?: boolean };
      if (!body.unlocked) return false;

      setIsAdminUnlocked(true);
      setIsPasswordModalOpen(false);
      addToast(t.adminUnlocked, '', 'success');
      if (passwordCallback) {
        const cb = passwordCallback;
        setPasswordCallback(null);
        cb();
      }
      return true;
    } catch {
      addToast(
        language === 'zh' ? '无法连接验证服务' : 'Could not reach auth endpoint',
        '',
        'error'
      );
      return false;
    }
  };

  const lockAdmin = async (): Promise<void> => {
    setIsAdminUnlocked(false);
    try {
      await fetch('/api/auth/admin', { method: 'DELETE' });
    } catch {}
    addToast(t.adminLocked, '', 'info');
  };

  const updateAdminPassword = async (newPass: string): Promise<boolean> => {
    const trimmed = newPass.trim();
    if (trimmed.length < 4) {
      addToast(
        language === 'zh' ? '密码长度不能少于 4 位' : 'Password must be at least 4 characters',
        '',
        'error'
      );
      return false;
    }

    try {
      const res = await fetch('/api/auth/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: trimmed }),
      });

      if (!res.ok) {
        addToast(
          language === 'zh'
            ? '需要解锁管理员权限后才能修改密码'
            : 'Unlock Admin session before updating password',
          '',
          'error'
        );
        return false;
      }

      addToast(t.passwordUpdated, '', 'success');
      return true;
    } catch {
      addToast(
        language === 'zh' ? '密码修改失败' : 'Failed to update password',
        '',
        'error'
      );
      return false;
    }
  };

  const requireAdminAuth = (action: () => void) => {
    if (effectiveIsAdmin) {
      action();
    } else {
      setPasswordCallback(() => action);
      setIsPasswordModalOpen(true);
    }
  };

  const canEditTask = useCallback(
    (task: TaskItem): boolean =>
      checkCanEditTask(task, currentUserId, currentAccessRole, effectiveIsAdmin, projects),
    [currentUserId, currentAccessRole, effectiveIsAdmin, projects]
  );

  const canDeleteTask = useCallback(
    (task: TaskItem): boolean =>
      checkCanDeleteTask(task, currentUserId, currentAccessRole, effectiveIsAdmin),
    [currentUserId, currentAccessRole, effectiveIsAdmin]
  );

  const canManageLab = useCallback(
    (): boolean => canManageLabRole(currentAccessRole, effectiveIsAdmin),
    [currentAccessRole, effectiveIsAdmin]
  );

  const canEditMemberProfile = useCallback(
    (memberId: string): boolean => {
      if (effectiveIsAdmin) return true;
      if (memberId === currentUserId) return true;
      if (currentAccessRole === 'SYS_ADMIN') {
        const target = members.find((m) => m.id === memberId);
        return deriveAccessRole(target) !== 'ADMIN_PI';
      }
      return false;
    },
    [effectiveIsAdmin, currentAccessRole, currentUserId, members]
  );

  const canAssignMemberRole = useCallback(
    (targetMember: LabMember, nextRole?: AccessRole): boolean => {
      const currentTargetRole = deriveAccessRole(targetMember);
      return canAssignAccessRole(
        effectiveIsAdmin,
        currentAccessRole,
        currentTargetRole,
        nextRole || currentTargetRole
      );
    },
    [effectiveIsAdmin, currentAccessRole]
  );

  const registerNewMember = (data: {
    nameZh: string;
    nameEn: string;
    role: LabMember['role'];
    email: string;
    accessRole?: AccessRole;
  }): LabMember => {
    const id = `member-${Date.now()}`;
    const defaultAccess: AccessRole =
      data.accessRole || (data.role === 'VISITING_SCHOLAR' ? 'AUDITOR_GUEST' : 'STUDENT_RA');
    const displayName = data.nameZh || data.nameEn;
    const newMember: LabMember = {
      id,
      nameZh: data.nameZh,
      nameEn: data.nameEn || data.nameZh,
      role: data.role,
      accessRole: defaultAccess,
      titleZh:
        data.role === 'RA' ? '科研助理' : data.role === 'PHD_CANDIDATE' ? '博士研究生' : '课题组成员',
      titleEn: data.role === 'RA' ? 'Research Assistant' : 'PhD Researcher',
      avatar: generateInitialsAvatar(displayName, id),
      email: data.email || `${id}@labflow.edu`,
    };
    setMembers((prev) => [...prev, newMember]);
    setCurrentUserId(id);
    addToast(t.welcomeMember, `${newMember.nameZh || newMember.nameEn}`, 'success');
    return newMember;
  };

  // Member Management
  const addMember = (member: LabMember) => {
    if (!canManageLab()) {
      addToast(t.requireAdminNotice, '', 'warning');
      return;
    }
    const requestedAccess = member.accessRole || 'STUDENT_RA';
    const safeAccess: AccessRole =
      !effectiveIsAdmin && (requestedAccess === 'ADMIN_PI' || requestedAccess === 'SYS_ADMIN')
        ? 'STUDENT_RA'
        : requestedAccess;
    const safeMember: LabMember = { ...member, accessRole: safeAccess };
    setMembers((prev) => [...prev, safeMember]);
    addToast(
      language === 'zh' ? '成员已添加' : 'Member Added',
      safeMember.nameZh || safeMember.nameEn,
      'success'
    );
  };

  const updateMember = (id: string, updates: Partial<LabMember>) => {
    const target = members.find((m) => m.id === id);
    if (!target) return;
    if (!canEditMemberProfile(id)) {
      addToast(t.requireAdminNotice, '', 'warning');
      return;
    }

    const cleanUpdates = { ...updates };
    if (cleanUpdates.accessRole !== undefined) {
      const currentTargetRole = deriveAccessRole(target);
      if (
        cleanUpdates.accessRole !== currentTargetRole &&
        !canAssignAccessRole(effectiveIsAdmin, currentAccessRole, currentTargetRole, cleanUpdates.accessRole)
      ) {
        addToast(
          language === 'zh'
            ? '仅导师（解锁管理锁后）有权委派系统管理员或变更高级权限'
            : 'Only unlocked PI can assign System Admin or Admin roles',
          '',
          'warning'
        );
        delete cleanUpdates.accessRole;
        if (Object.keys(cleanUpdates).length === 0) return;
      }
    }

    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...cleanUpdates } : m)));
    setTasks((prev) =>
      prev.map((task) => {
        const updateLead = task.leadAuthor?.id === id;
        const updatePi = task.pi?.id === id;
        if (!updateLead && !updatePi) return task;
        return {
          ...task,
          leadAuthor: updateLead ? { ...task.leadAuthor, ...cleanUpdates } : task.leadAuthor,
          pi: updatePi ? { ...task.pi, ...cleanUpdates } : task.pi,
        };
      })
    );
    addToast(language === 'zh' ? '成员资料与头像已更新' : 'Member Profile Updated', '', 'success');
  };

  const deleteMember = (id: string) => {
    if (!canManageLab()) {
      addToast(t.requireAdminNotice, '', 'warning');
      return;
    }
    const target = members.find((m) => m.id === id);
    const targetRole = deriveAccessRole(target);
    if (!effectiveIsAdmin && (targetRole === 'ADMIN_PI' || targetRole === 'SYS_ADMIN')) {
      addToast(
        language === 'zh'
          ? '系统管理员无权移除导师或其他管理员'
          : 'System Admin cannot remove PI or fellow System Admins',
        '',
        'warning'
      );
      return;
    }
    if (members.length <= 1) {
      addToast(
        language === 'zh' ? '无法删除' : 'Cannot delete',
        language === 'zh' ? '至少保留一位成员' : 'Keep at least 1 member',
        'error'
      );
      return;
    }
    const remaining = members.filter((m) => m.id !== id);
    setMembers(remaining);
    if (currentUserId === id && remaining[0]) {
      setCurrentUserId(remaining[0].id);
    }
    addToast(language === 'zh' ? '成员已移除' : 'Member Removed', '', 'info');
  };

  // Project Management
  const addProject = (projectData: Omit<ProjectItem, 'id'> & { id?: string }): ProjectItem => {
    const newProject: ProjectItem = {
      ...projectData,
      id: projectData.id || `proj-${Date.now()}`,
    };
    setProjects((prev) => [newProject, ...prev]);
    addToast(
      language === 'zh' ? '课题项目已创建' : 'Project Created',
      newProject.title,
      'success'
    );
    return newProject;
  };

  const updateProject = (projectId: string, updates: Partial<ProjectItem>) => {
    const target = projects.find((p) => p.id === projectId);
    if (!target) return;
    if (currentAccessRole === 'AUDITOR_GUEST' && !effectiveIsAdmin) {
      addToast(t.readOnlyNotice, '', 'warning');
      return;
    }
    if (
      updates.status &&
      !canAdvanceToStage(updates.status, currentAccessRole, effectiveIsAdmin)
    ) {
      addToast(t.acceptedStageNotice, '', 'error');
      return;
    }
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, ...updates } : p))
    );
    if (updates.tag !== undefined || updates.targetVenue !== undefined) {
      setTasks((prev) =>
        prev.map((item) =>
          item.projectId === projectId
            ? {
                ...item,
                projectTag: updates.tag ?? item.projectTag,
                targetVenue: updates.targetVenue ?? item.targetVenue,
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );
    }
    const nextStageCfg = updates.status ? stages.find((s) => s.id === updates.status) : undefined;
    const stageToastMsg = nextStageCfg
      ? `${target.tag} → ${language === 'zh' ? nextStageCfg.labelZh : nextStageCfg.labelEn}`
      : '';
    addToast(language === 'zh' ? '课题项目已更新' : 'Project Updated', stageToastMsg, 'success');
  };

  const deleteProject = (projectId: string) => {
    const target = projects.find((p) => p.id === projectId);
    const canDelete =
      effectiveIsAdmin ||
      ((currentAccessRole === 'SYS_ADMIN' || currentAccessRole === 'PROJECT_LEAD') &&
        target?.visibility !== 'PI_ONLY');
    if (!canDelete) {
      addToast(t.requireAdminNotice, '', 'warning');
      return;
    }
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    addToast(language === 'zh' ? '课题项目已删除' : 'Project Deleted', '', 'info');
  };

  // Weekly To-Do & Acceptance Management
  const canAcceptTodo = useCallback(
    (todo: WeeklyTodoItem): boolean => {
      const project = todo.projectId
        ? projects.find((p) => p.id === todo.projectId)
        : undefined;
      const task = todo.taskId ? tasks.find((tItem) => tItem.id === todo.taskId) : undefined;
      return canAcceptWeeklyTodo({
        todo,
        project,
        task,
        currentUserId,
        currentAccessRole,
        effectiveIsAdmin,
        isAdminUnlocked,
        allowPeerAcceptance,
      });
    },
    [
      projects,
      tasks,
      currentUserId,
      currentAccessRole,
      effectiveIsAdmin,
      isAdminUnlocked,
      allowPeerAcceptance,
    ]
  );

  const addWeeklyTodo = (
    todoData: Omit<WeeklyTodoItem, 'id' | 'createdAt' | 'updatedAt' | 'acceptanceStatus'> & {
      acceptanceStatus?: WeeklyTodoAcceptanceStatus;
    }
  ): WeeklyTodoItem | null => {
    if (currentAccessRole === 'AUDITOR_GUEST' && !effectiveIsAdmin && !allowPeerAcceptance) {
      addToast(t.readOnlyNotice, '', 'warning');
      return null;
    }
    const now = new Date().toISOString();
    const newTodo: WeeklyTodoItem = {
      ...todoData,
      id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      acceptanceStatus: todoData.acceptanceStatus || (todoData.done ? 'SUBMITTED' : 'PENDING'),
      createdAt: now,
      updatedAt: now,
    };
    setWeeklyTodos((prev) => [newTodo, ...prev]);
    if (newTodo.taskId && newTodo.checklistItemId) {
      setTasks((prev) => applyTodoToggleToTasks(prev, newTodo, newTodo.done));
    }
    addToast(
      language === 'zh' ? '已添加本周待办事项' : 'Weekly To-Do Added',
      newTodo.title.slice(0, 32),
      'success'
    );
    return newTodo;
  };

  const updateWeeklyTodo = (todoId: string, updates: Partial<WeeklyTodoItem>) => {
    const existing = weeklyTodos.find((item) => item.id === todoId);
    if (!existing) return;
    const now = new Date().toISOString();
    const nextDone = updates.done !== undefined ? updates.done : existing.done;
    let nextStatus = updates.acceptanceStatus ?? existing.acceptanceStatus;
    if (updates.done !== undefined && updates.acceptanceStatus === undefined) {
      nextStatus = nextDone
        ? existing.acceptanceStatus === 'ACCEPTED'
          ? 'ACCEPTED'
          : 'SUBMITTED'
        : 'PENDING';
    }

    const updatedItem: WeeklyTodoItem = {
      ...existing,
      ...updates,
      done: nextDone,
      acceptanceStatus: nextStatus,
      updatedAt: now,
    };

    setWeeklyTodos((prev) => prev.map((item) => (item.id === todoId ? updatedItem : item)));
    if (updates.done !== undefined && existing.taskId && existing.checklistItemId) {
      setTasks((prev) => applyTodoToggleToTasks(prev, updatedItem, nextDone));
    }
  };

  const deleteWeeklyTodo = (todoId: string) => {
    setWeeklyTodos((prev) => prev.filter((item) => item.id !== todoId));
    addToast(language === 'zh' ? '周待办已移除' : 'Weekly To-Do Removed', '', 'info');
  };

  const acceptWeeklyTodo = (
    todoId: string,
    decision: 'ACCEPTED' | 'REVISION_REQUESTED',
    notes?: string
  ) => {
    const target = weeklyTodos.find((item) => item.id === todoId);
    if (!target) return;
    if (!canAcceptTodo(target)) {
      addToast(
        language === 'zh'
          ? '当前处于严格验收模式：需导师 / 负责人，或解锁开启全员互验模式'
          : 'Strict acceptance mode: requires PI/Lead or unlocked peer mode',
        '',
        'warning'
      );
      return;
    }

    const now = new Date().toISOString();
    const nextDone = decision === 'ACCEPTED';
    const updatedItem: WeeklyTodoItem = {
      ...target,
      done: nextDone,
      acceptanceStatus: decision,
      acceptedById: currentUserId,
      acceptedAt: now,
      notes: notes !== undefined ? notes : target.notes,
      updatedAt: now,
    };

    setWeeklyTodos((prev) => prev.map((item) => (item.id === todoId ? updatedItem : item)));
    if (target.taskId && target.checklistItemId) {
      setTasks((prev) => applyTodoToggleToTasks(prev, updatedItem, nextDone));
    }
    if (decision === 'ACCEPTED') {
      triggerConfetti();
    }
    addToast(
      decision === 'ACCEPTED'
        ? language === 'zh'
          ? '✅ 已确认通过该项验收'
          : '✅ Item Acceptance Confirmed'
        : language === 'zh'
        ? '↩ 已退回要求补充修改'
        : '↩ Marked as Needs Revision',
      target.title.slice(0, 32),
      decision === 'ACCEPTED' ? 'success' : 'warning'
    );
  };

  const pushChecklistItemToWeeklyTodo = ({
    task,
    checklistItem,
    memberId,
    weekKey = getWeekKey(),
    acceptanceCriteria,
  }: {
    task: TaskItem;
    checklistItem: ChecklistItem;
    memberId: string;
    weekKey?: string;
    acceptanceCriteria?: string;
  }) => {
    const duplicate = weeklyTodos.find(
      (w) =>
        w.memberId === memberId &&
        w.weekKey === weekKey &&
        w.taskId === task.id &&
        w.checklistItemId === checklistItem.id
    );
    if (duplicate) {
      addToast(
        language === 'zh' ? '该执行项已在该成员本周清单中' : 'Already in weekly To-Do list',
        checklistItem.text.slice(0, 32),
        'info'
      );
      return;
    }

    const now = new Date().toISOString();
    const newTodo: WeeklyTodoItem = {
      id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      memberId,
      weekKey,
      title: checklistItem.text,
      done: checklistItem.done,
      priority: task.priority,
      projectId: task.projectId,
      taskId: task.id,
      checklistItemId: checklistItem.id,
      acceptanceCriteria:
        acceptanceCriteria ||
        (language === 'zh' ? `完成「${task.projectTag}」执行清单核验` : `Verify ${task.projectTag} checklist item`),
      acceptanceStatus: checklistItem.done ? 'SUBMITTED' : 'PENDING',
      createdAt: now,
      updatedAt: now,
    };
    setWeeklyTodos((prev) => [newTodo, ...prev]);
    const targetMember = members.find((m) => m.id === memberId);
    const mName = targetMember ? (language === 'zh' ? targetMember.nameZh : targetMember.nameEn) : '';
    addToast(
      language === 'zh' ? `已推送至 ${mName} 本周 To-Do` : `Pushed to ${mName} Weekly To-Do`,
      checklistItem.text.slice(0, 32),
      'success'
    );
  };

  const setWorkspacePeerAcceptance = (enabled: boolean) => {
    const applyChange = () => {
      setAllowPeerAcceptance(enabled);
      addToast(
        enabled
          ? language === 'zh'
            ? '🔓 已开启非锁模式：全组成员可互相验收'
            : '🔓 Peer Acceptance Enabled for All Members'
          : language === 'zh'
          ? '🔒 已切换为严格验收模式（导师 / 负责人）'
          : '🔒 Switched to Strict Acceptance Mode',
        '',
        'info'
      );
    };
    if (effectiveIsAdmin || isAdminUnlocked || currentAccessRole === 'SYS_ADMIN') {
      applyChange();
    } else {
      requireAdminAuth(applyChange);
    }
  };

  // Checklist & Acceptance Template Actions
  const saveChecklistTemplate = (input: {
    id?: string;
    name: string;
    description?: string;
    category?: string;
    items: ChecklistTemplateEntry[];
  }): ChecklistAcceptanceTemplate | null => {
    if (currentAccessRole === 'AUDITOR_GUEST' && !effectiveIsAdmin) {
      addToast(t.readOnlyNotice, '', 'warning');
      return null;
    }
    const cleanName = input.name.trim();
    const cleanItems = input.items
      .map((item) => ({
        text: item.text.trim(),
        acceptanceCriteria: item.acceptanceCriteria?.trim() || undefined,
        priority: item.priority,
      }))
      .filter((item) => Boolean(item.text));

    if (!cleanName || cleanItems.length === 0) {
      addToast(
        language === 'zh' ? '请填写模板名称和至少一条事项' : 'Enter template name and at least 1 item',
        '',
        'warning'
      );
      return null;
    }

    const now = new Date().toISOString();
    const existing = input.id ? checklistTemplates.find((tpl) => tpl.id === input.id) : undefined;
    const saved: ChecklistAcceptanceTemplate = {
      id: existing?.id || `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      name: cleanName,
      description: input.description?.trim() || undefined,
      category: input.category?.trim() || undefined,
      items: cleanItems,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    setChecklistTemplates((prev) =>
      existing ? prev.map((tpl) => (tpl.id === existing.id ? saved : tpl)) : [saved, ...prev]
    );
    addToast(
      language === 'zh' ? '模板已保存' : 'Template Saved',
      `${saved.name} (${saved.items.length})`,
      'success'
    );
    return saved;
  };

  const deleteChecklistTemplate = (templateId: string) => {
    if (currentAccessRole === 'AUDITOR_GUEST' && !effectiveIsAdmin) {
      addToast(t.readOnlyNotice, '', 'warning');
      return;
    }
    setChecklistTemplates((prev) => prev.filter((tpl) => tpl.id !== templateId));
    addToast(language === 'zh' ? '模板已删除' : 'Template Deleted', '', 'info');
  };

  const resetChecklistTemplates = () => {
    if (currentAccessRole === 'AUDITOR_GUEST' && !effectiveIsAdmin) {
      addToast(t.readOnlyNotice, '', 'warning');
      return;
    }
    setChecklistTemplates((prev) => {
      const existingIds = new Set(prev.map((tpl) => tpl.id));
      const missingDefaults = DEFAULT_CHECKLIST_TEMPLATES.filter((d) => !existingIds.has(d.id));
      return [...prev, ...structuredClone(missingDefaults)];
    });
    addToast(
      language === 'zh' ? '已恢复内置参考模板' : 'Starter Templates Restored',
      '',
      'success'
    );
  };

  const injectTemplateToTask = ({
    taskId,
    templateId,
    alsoPushWeeklyTodos = false,
    weekKey = getWeekKey(),
  }: {
    taskId: string;
    templateId: string;
    alsoPushWeeklyTodos?: boolean;
    weekKey?: string;
  }): ChecklistItem[] | null => {
    const targetTask = tasks.find((item) => item.id === taskId);
    const template = checklistTemplates.find((tpl) => tpl.id === templateId);
    if (!targetTask || !template) return null;

    if (!canEditTask(targetTask)) {
      addToast(t.readOnlyNotice, '', 'warning');
      return null;
    }

    const { addedItems, matchedEntries, nextChecklist, skippedCount } = buildChecklistItemsFromTemplate(
      template,
      targetTask.checklist || []
    );

    const now = new Date().toISOString();
    const totalCount = nextChecklist.length;
    const completedCount = nextChecklist.filter((c) => c.done).length;
    const nextProgress =
      totalCount > 0 && targetTask.stage !== 'ACCEPTED'
        ? Math.round((completedCount / totalCount) * 100)
        : targetTask.progress;

    if (addedItems.length > 0) {
      setTasks((prev) =>
        prev.map((item) =>
          item.id === taskId
            ? {
                ...item,
                checklist: nextChecklist,
                progress: nextProgress,
                updatedAt: now,
              }
            : item
        )
      );
    }

    let createdTodoCount = 0;
    if (alsoPushWeeklyTodos) {
      const targetMemberId = targetTask.leadAuthor?.id || currentUserId;
      const { addedTodos } = buildWeeklyTodosFromTemplate({
        template,
        memberId: targetMemberId,
        weekKey,
        projectId: targetTask.projectId,
        task: targetTask,
        checklistLinks: matchedEntries,
        existingTodos: weeklyTodos,
      });
      createdTodoCount = addedTodos.length;
      if (addedTodos.length > 0) {
        setWeeklyTodos((prev) => [...addedTodos, ...prev]);
      }
    }

    if (addedItems.length === 0 && createdTodoCount === 0) {
      addToast(
        language === 'zh' ? '模板条目已全部存在，未重复注入' : 'All template items already exist',
        template.name,
        'info'
      );
    } else {
      const summaryParts: string[] = [];
      if (addedItems.length > 0) {
        summaryParts.push(
          language === 'zh' ? `清单 +${addedItems.length}` : `+${addedItems.length} checklist`
        );
      }
      if (createdTodoCount > 0) {
        summaryParts.push(
          language === 'zh' ? `周待办与验收 +${createdTodoCount}` : `+${createdTodoCount} weekly todos`
        );
      }
      if (skippedCount > 0) {
        summaryParts.push(
          language === 'zh' ? `跳过重复 ${skippedCount}` : `${skippedCount} skipped`
        );
      }
      addToast(
        language === 'zh' ? `已注入模板「${template.name}」` : `Injected "${template.name}"`,
        summaryParts.join(' · '),
        'success'
      );
    }

    return nextChecklist;
  };

  const injectTemplateToWeeklyTodos = ({
    templateId,
    memberId,
    weekKey,
    projectId,
    taskId,
  }: {
    templateId: string;
    memberId: string;
    weekKey: string;
    projectId?: string;
    taskId?: string;
  }): number => {
    if (currentAccessRole === 'AUDITOR_GUEST' && !effectiveIsAdmin) {
      addToast(t.readOnlyNotice, '', 'warning');
      return 0;
    }
    const template = checklistTemplates.find((tpl) => tpl.id === templateId);
    if (!template) return 0;

    const linkedTask = taskId ? tasks.find((tk) => tk.id === taskId) : undefined;
    const { addedTodos, skippedCount } = buildWeeklyTodosFromTemplate({
      template,
      memberId,
      weekKey,
      projectId: projectId || linkedTask?.projectId,
      task: linkedTask,
      existingTodos: weeklyTodos,
    });

    if (addedTodos.length === 0) {
      addToast(
        language === 'zh' ? '该周已包含模板全部待办条目' : 'All template items already exist in this week',
        template.name,
        'info'
      );
      return 0;
    }

    setWeeklyTodos((prev) => [...addedTodos, ...prev]);
    addToast(
      language === 'zh'
        ? `已一键生成 ${addedTodos.length} 条本周待办与验收项`
        : `Generated ${addedTodos.length} Weekly To-Do & Acceptance items`,
      skippedCount > 0
        ? language === 'zh'
          ? `${template.name}（跳过重复 ${skippedCount} 条）`
          : `${template.name} (${skippedCount} duplicates skipped)`
        : template.name,
      'success'
    );
    return addedTodos.length;
  };

  // Venue Management
  const addVenue = (venue: VenuePreset) => {
    setVenues((prev) => [...prev, venue]);
    addToast(language === 'zh' ? '目标会议已保存' : 'Target Venue Saved', venue.name, 'success');
  };

  const deleteVenue = (venueId: string) => {
    setVenues((prev) => prev.filter((v) => v.id !== venueId));
    addToast(language === 'zh' ? '目标会议已删除' : 'Target Venue Removed', '', 'info');
  };

  // Stage Management
  const addStage = (stage: StageConfig) => {
    setStages((prev) => [...prev, stage]);
    addToast(
      language === 'zh' ? '阶段已添加' : 'Stage Added',
      stage.labelZh || stage.labelEn,
      'success'
    );
  };

  const updateStage = (stageId: string, updates: Partial<StageConfig>) => {
    setStages((prev) => prev.map((s) => (s.id === stageId ? { ...s, ...updates } : s)));
    addToast(language === 'zh' ? '阶段已更新' : 'Stage Updated', '', 'info');
  };

  const deleteStage = (stageId: string) => {
    if (stages.length <= 1) {
      addToast(
        language === 'zh' ? '无法删除' : 'Cannot delete',
        language === 'zh' ? '至少保留一个阶段' : 'Must keep at least 1 stage',
        'error'
      );
      return;
    }
    const remainingStages = stages.filter((s) => s.id !== stageId);
    const fallbackStageId = remainingStages[0].id;

    setTasks((prev) =>
      prev.map((task) => (task.stage === stageId ? { ...task, stage: fallbackStageId } : task))
    );
    setStages(remainingStages);
    addToast(
      language === 'zh' ? '阶段已移除' : 'Stage Removed',
      language === 'zh' ? '任务已自动移至第一阶段' : 'Tasks migrated to first stage',
      'info'
    );
  };

  const restoreDefaultStages = () => {
    setStages(DEFAULT_STAGES);
    addToast(language === 'zh' ? '已重置默认阶段' : 'Default Stages Restored', '', 'success');
  };

  // Task Operations with Consistent RBAC Checks
  const moveTask = (taskId: string, targetStage: AcademicStage, newOrder?: number) => {
    const targetTask = tasks.find((item) => item.id === taskId);
    if (!targetTask) return;

    if (!canEditTask(targetTask)) {
      addToast(t.readOnlyNotice, '', 'warning');
      return;
    }

    if (!canAdvanceToStage(targetStage, currentAccessRole, effectiveIsAdmin)) {
      addToast(t.acceptedStageNotice, '', 'error');
      return;
    }

    if (targetStage !== targetTask.stage) {
      const fromIdx = stages.findIndex((s) => s.id === targetTask.stage);
      const toIdx = stages.findIndex((s) => s.id === targetStage);
      const destStageCfg = stages[toIdx];
      const destStageName = destStageCfg
        ? language === 'zh'
          ? destStageCfg.labelZh
          : destStageCfg.labelEn
        : targetStage;

      if (targetStage === 'ACCEPTED') {
        triggerConfetti();
        addToast(
          language === 'zh' ? '🎉 成果录用归档！' : '🎉 Milestone Accepted & Archived!',
          `"${targetTask.title.slice(0, 36)}..."`,
          'success'
        );
      } else {
        const isRollback = fromIdx >= 0 && toIdx >= 0 && toIdx < fromIdx;
        addToast(
          language === 'zh'
            ? `${isRollback ? '已退回至' : '已推进至'}「${destStageName}」`
            : `${isRollback ? 'Moved back to' : 'Moved to'} "${destStageName}"`,
          targetTask.title.slice(0, 40),
          'info'
        );
      }
    }

    setTasks((prev) => moveTaskToStage(prev, taskId, targetStage, newOrder));
  };

  const reorderTasks = (
    stage: AcademicStage,
    sourceIndex: number,
    destinationIndex: number,
    visibleStageTaskIds?: string[]
  ) => {
    const candidateId =
      visibleStageTaskIds?.[sourceIndex] ??
      tasks
        .filter((item) => item.stage === stage)
        .sort((a, b) => a.order - b.order)[sourceIndex]?.id;

    if (candidateId) {
      const movedTask = tasks.find((item) => item.id === candidateId);
      if (movedTask && !canEditTask(movedTask)) {
        addToast(t.readOnlyNotice, '', 'warning');
        return;
      }
    }

    setTasks((prev) =>
      reorderStageTasks(prev, stage, sourceIndex, destinationIndex, visibleStageTaskIds)
    );
  };

  const reportBlocker = (taskId: string, blocker: BlockerInfo) => {
    const target = tasks.find((item) => item.id === taskId);
    if (target && !canEditTask(target)) {
      addToast(t.readOnlyNotice, '', 'warning');
      return;
    }

    setTasks((prev) =>
      prev.map((item) =>
        item.id === taskId
          ? {
              ...item,
              isBlocked: true,
              blocker,
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );
    addToast(
      language === 'zh' ? '🚨 技术卡点已标记' : '🚨 Blocker Logged & Escalated',
      `${blocker.escalatedTo} (${blocker.category})`,
      'warning'
    );
  };

  const resolveBlocker = (taskId: string) => {
    const target = tasks.find((item) => item.id === taskId);
    if (target && !canEditTask(target)) {
      addToast(t.readOnlyNotice, '', 'warning');
      return;
    }

    setTasks((prev) =>
      prev.map((item) =>
        item.id === taskId
          ? {
              ...item,
              isBlocked: false,
              blocker: undefined,
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );
    triggerConfetti();
    addToast(
      language === 'zh' ? '✨ 卡点已解除' : '✨ Blocker Resolved',
      language === 'zh' ? '该任务已恢复推进状态' : 'Task unblocked and resumed',
      'success'
    );
  };

  const addTask = (taskData: Omit<TaskItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (currentAccessRole === 'AUDITOR_GUEST' && !effectiveIsAdmin) {
      addToast(t.readOnlyNotice, '', 'warning');
      return;
    }
    const now = new Date().toISOString();
    const newTask: TaskItem = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    setTasks((prev) => [newTask, ...prev]);
    addToast(language === 'zh' ? '任务已创建' : 'Task Created', newTask.title.slice(0, 30), 'success');
  };

  const updateTask = (taskId: string, updates: Partial<TaskItem>) => {
    const target = tasks.find((item) => item.id === taskId);
    if (target && !canEditTask(target)) {
      addToast(t.readOnlyNotice, '', 'warning');
      return;
    }
    if (
      updates.stage &&
      !canAdvanceToStage(updates.stage, currentAccessRole, effectiveIsAdmin)
    ) {
      addToast(t.acceptedStageNotice, '', 'error');
      return;
    }

    setTasks((prev) =>
      prev.map((item) =>
        item.id === taskId
          ? {
              ...item,
              ...updates,
              completedAt:
                updates.stage === 'ACCEPTED'
                  ? item.completedAt || new Date().toISOString()
                  : updates.stage !== undefined
                  ? undefined
                  : item.completedAt,
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );
    if (Array.isArray(updates.checklist)) {
      setWeeklyTodos((prev) => syncTaskChecklistChangesToTodos(prev, taskId, updates.checklist!));
    }
    addToast(language === 'zh' ? '修改已保存' : 'Task Updated', '', 'info');
  };

  const updateTaskProgress = (taskId: string, progress: number) => {
    const target = tasks.find((item) => item.id === taskId);
    if (target && !canEditTask(target)) {
      addToast(t.readOnlyNotice, '', 'warning');
      return;
    }
    setTasks((prev) =>
      prev.map((item) =>
        item.id === taskId ? { ...item, progress, updatedAt: new Date().toISOString() } : item
      )
    );
  };

  const updateTaskDates = (taskId: string, startDate?: string, deadline?: string) => {
    const target = tasks.find((item) => item.id === taskId);
    if (target && !canEditTask(target)) {
      addToast(t.readOnlyNotice, '', 'warning');
      return;
    }
    setTasks((prev) =>
      prev.map((item) =>
        item.id === taskId
          ? {
              ...item,
              startDate: startDate || item.startDate,
              deadline: deadline || item.deadline,
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );
    addToast(language === 'zh' ? '排期已调整' : 'Schedule Adjusted', '', 'info');
  };

  const deleteTask = (taskId: string) => {
    const target = tasks.find((item) => item.id === taskId);
    if (target && !canDeleteTask(target)) {
      addToast(t.cannotDeleteNotice, '', 'error');
      return;
    }
    setTasks((prev) => prev.filter((item) => item.id !== taskId));
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
    }
    addToast(language === 'zh' ? '任务已删除' : 'Task Deleted', '', 'info');
  };

  const generateReverseDDLPipeline = (plan: ReverseDDLForm) => {
    if (currentAccessRole === 'AUDITOR_GUEST' && !effectiveIsAdmin) {
      addToast(t.readOnlyNotice, '', 'warning');
      return;
    }
    const { project: newProject, tasks: generatedTasks } = buildReverseDDLPipeline(
      plan,
      members,
      stages,
      language
    );

    setProjects((prev) => [newProject, ...prev]);
    setTasks((prev) => [...generatedTasks, ...prev]);

    triggerConfetti();
    addToast(
      language === 'zh' ? '⚡ 倒排计划已自动生成' : '⚡ Reverse-DDL Pipeline Generated',
      `${plan.title} (${generatedTasks.length} ${language === 'zh' ? '个里程碑' : 'milestones'})`,
      'success'
    );
  };

  // Lab Compute & Resources
  const claimResource = (
    resourceId: string,
    currentUser: string,
    currentJob: string,
    hours: number
  ) => {
    setResources((prev) =>
      prev.map((r) =>
        r.id === resourceId
          ? {
              ...r,
              status: 'OCCUPIED',
              currentUser,
              currentJob,
              remainingHours: hours,
              vramUtilPercent: r.type === 'GPU' ? 88 : 50,
              updatedAt: new Date().toISOString(),
            }
          : r
      )
    );
    addToast(
      language === 'zh' ? '🖥️ 算力节点已认领' : '🖥️ Resource Claimed',
      `@${currentUser} (${hours}h)`,
      'success'
    );
  };

  const releaseResource = (resourceId: string) => {
    const target = resources.find((r) => r.id === resourceId);
    if (!target) return;

    const isOwner =
      target.currentUser === currentMember.nameZh ||
      target.currentUser === currentMember.nameEn ||
      target.currentUser === currentMember.email;

    if (!isOwner && !effectiveIsAdmin && currentAccessRole !== 'SYS_ADMIN') {
      addToast(
        language === 'zh'
          ? '该节点正由其他成员使用，非本人无法释放（需导师 / 系统管理员权限）'
          : 'Occupied by another member. Requires PI or System Admin release.',
        '',
        'warning'
      );
      return;
    }

    setResources((prev) =>
      prev.map((r) =>
        r.id === resourceId
          ? {
              ...r,
              status: 'IDLE',
              currentUser: undefined,
              currentJob: undefined,
              remainingHours: 0,
              vramUtilPercent: 0,
              updatedAt: new Date().toISOString(),
            }
          : r
      )
    );
    addToast(
      language === 'zh' ? '🖥️ 算力节点已成功释放' : '🖥️ Resource Released',
      target.nameZh || target.nameEn,
      'info'
    );
  };

  const addResource = (res: LabResource) => {
    setResources((prev) => [...prev, res]);
    addToast(
      language === 'zh' ? '公共设施已添加' : 'Resource Added',
      res.nameZh || res.nameEn,
      'success'
    );
  };

  const updateResource = (id: string, updates: Partial<LabResource>) => {
    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r))
    );
    addToast(language === 'zh' ? '设施状态已更新' : 'Resource Updated', '', 'info');
  };

  const deleteResource = (id: string) => {
    setResources((prev) => prev.filter((r) => r.id !== id));
    addToast(language === 'zh' ? '设施已移除' : 'Resource Removed', '', 'info');
  };

  // Backup & Restore
  const exportDataBackup = () => {
    const backupData = {
      version: 4,
      exportedAt: new Date().toISOString(),
      stages,
      tasks,
      projects,
      members,
      venues,
      resources,
      weeklyTodos,
      allowPeerAcceptance,
      checklistTemplates,
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LabFlow_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast(language === 'zh' ? '数据备份已下载' : 'Backup Downloaded', '', 'success');
  };

  const importDataBackup = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.tasks || !data.stages) return false;
      if (data.stages) setStages(data.stages);
      if (data.tasks) setTasks(data.tasks);
      if (data.projects) setProjects(data.projects);
      if (data.members) setMembers(data.members);
      if (data.venues) setVenues(data.venues);
      if (data.resources) setResources(data.resources);
      if (Array.isArray(data.weeklyTodos)) {
        setWeeklyTodos(sanitizeWeeklyTodos(data.weeklyTodos));
      }
      if (typeof data.allowPeerAcceptance === 'boolean') {
        setAllowPeerAcceptance(data.allowPeerAcceptance);
      }
      if (Array.isArray(data.checklistTemplates)) {
        setChecklistTemplates(sanitizeChecklistTemplates(data.checklistTemplates));
      }
      triggerConfetti();
      addToast(
        language === 'zh' ? '数据已成功恢复！' : 'Data Restored Successfully!',
        '',
        'success'
      );
      return true;
    } catch (e) {
      console.warn('Invalid backup file', e);
      addToast(language === 'zh' ? '备份文件解析失败' : 'Failed to parse backup', '', 'error');
      return false;
    }
  };

  const generateMyWeeklyDigest = (targetMemberId?: string): string => {
    const activeId = targetMemberId || currentUserId;
    const userMember = members.find((m) => m.id === activeId) || members[0];
    return buildWeeklyDigestMarkdown({ member: userMember, tasks, language });
  };

  const resetToMockData = () => {
    const applyReset = () => {
      setTasks(INITIAL_TASKS);
      setProjects(INITIAL_PROJECTS);
      setResources(INITIAL_RESOURCES);
      setStages(DEFAULT_STAGES);
      setMembers(LAB_MEMBERS);
      setVenues(DEFAULT_VENUES);
      setWeeklyTodos(createInitialWeeklyTodos());
      setAllowPeerAcceptance(false);
      setChecklistTemplates(structuredClone(DEFAULT_CHECKLIST_TEMPLATES));
      setCurrentUserId('member-student1');
      setFilterOnlyBlockers(false);
      setSearchQuery('');
      setFilterMemberId('all');
      setSelectedStageFilter('all');
      setSelectedProjectFilter('all');
      setViewMode('kanban');
      triggerConfetti();
      addToast(language === 'zh' ? '示例数据已重置' : 'Demo State Reset', '', 'success');
    };
    if (!effectiveIsAdmin) {
      requireAdminAuth(applyReset);
      return;
    }
    applyReset();
  };

  const cleanSlateWipe = () => {
    const applyWipe = () => {
      const initialUser: LabMember = {
        id: 'member-me',
        nameEn: 'Researcher 1',
        nameZh: '研究员 1',
        role: 'PI',
        accessRole: 'ADMIN_PI',
        titleEn: 'Principal Investigator',
        titleZh: '课题组长 (PI)',
        avatar: generateInitialsAvatar('研究员 1', 'member-me'),
        email: 'pi@lab.edu',
      };
      setTasks([]);
      setProjects([]);
      setResources([]);
      setWeeklyTodos([]);
      setMembers([initialUser]);
      setCurrentUserId('member-me');
      setFilterOnlyBlockers(false);
      setSearchQuery('');
      setFilterMemberId('all');
      setSelectedStageFilter('all');
      setSelectedProjectFilter('all');
      addToast(
        t.cleanSlateSuccess ||
          (language === 'zh'
            ? '已一键清空所有任务和人员，开启全新实验室'
            : 'All tasks and members wiped. Blank canvas ready.'),
        '',
        'warning'
      );
    };
    if (!effectiveIsAdmin) {
      requireAdminAuth(applyWipe);
      return;
    }
    applyWipe();
  };

  const applyAIImport = (data: ParsedAIData, mode: 'overwrite' | 'append') => {
    let updatedMembers = [...members];
    if (mode === 'overwrite') {
      const newMembers: LabMember[] = data.members.map((m) => ({
        id: m.id,
        nameZh: m.nameZh,
        nameEn: m.nameEn,
        role: m.role,
        accessRole: m.accessRole,
        titleZh: m.titleZh,
        titleEn: m.titleEn,
        email: m.email,
        avatar: m.avatar,
      }));
      const hasPI = newMembers.some((m) => m.role === 'PI' || m.accessRole === 'ADMIN_PI');
      if (!hasPI && newMembers.length > 0) {
        newMembers[0].role = 'PI';
        newMembers[0].accessRole = 'ADMIN_PI';
      }
      updatedMembers = newMembers.length > 0 ? newMembers : members;
      setMembers(updatedMembers);
      const piUser = getSafePI(updatedMembers);
      if (piUser) setCurrentUserId(piUser.id);
    } else {
      const existingNames = new Set(
        members.map((m) => m.nameZh.toLowerCase()).concat(members.map((m) => m.nameEn.toLowerCase()))
      );
      const toAdd: LabMember[] = [];
      data.members.forEach((m) => {
        if (!existingNames.has(m.nameZh.toLowerCase()) && !existingNames.has(m.nameEn.toLowerCase())) {
          toAdd.push({
            id: m.id,
            nameZh: m.nameZh,
            nameEn: m.nameEn,
            role: m.role,
            accessRole: m.accessRole,
            titleZh: m.titleZh,
            titleEn: m.titleEn,
            email: m.email,
            avatar: m.avatar,
          });
          existingNames.add(m.nameZh.toLowerCase());
          existingNames.add(m.nameEn.toLowerCase());
        }
      });
      updatedMembers = [...members, ...toAdd];
      setMembers(updatedMembers);
    }

    const getMemberByName = (name: string): LabMember => {
      const match = updatedMembers.find(
        (m) => m.nameZh === name || m.nameEn.toLowerCase() === name.toLowerCase() || m.id === name
      );
      return match || updatedMembers[0];
    };

    const piMember = getSafePI(updatedMembers) || updatedMembers[0];

    let updatedProjects = [...projects];
    if (mode === 'overwrite') {
      updatedProjects = data.projects.map((p) => {
        const lead = getMemberByName(p.leadAuthorName);
        return {
          id: p.id,
          title: p.title,
          abstract: p.abstract,
          targetVenue: p.targetVenue,
          tag: p.tag,
          status: p.status,
          leadAuthorId: lead.id,
          piId: piMember.id,
          assets: {},
          visibility: 'PUBLIC' as VisibilityLevel,
        };
      });
      setProjects(updatedProjects);
    } else {
      const existingProjTitles = new Set(projects.map((p) => p.title.toLowerCase()));
      const projsToAdd: ProjectItem[] = [];
      data.projects.forEach((p) => {
        if (!existingProjTitles.has(p.title.toLowerCase())) {
          const lead = getMemberByName(p.leadAuthorName);
          projsToAdd.push({
            id: p.id,
            title: p.title,
            abstract: p.abstract,
            targetVenue: p.targetVenue,
            tag: p.tag,
            status: p.status,
            leadAuthorId: lead.id,
            piId: piMember.id,
            assets: {},
            visibility: 'PUBLIC' as VisibilityLevel,
          });
          existingProjTitles.add(p.title.toLowerCase());
        }
      });
      updatedProjects = [...projects, ...projsToAdd];
      setProjects(updatedProjects);
    }

    const projectLookup = new Map<string, ProjectItem>();
    updatedProjects.forEach((p) => {
      projectLookup.set(p.title, p);
      projectLookup.set(p.id, p);
    });

    const newTasks: TaskItem[] = data.tasks.map((item, idx) => {
      const lead = getMemberByName(item.leadAuthorName);
      const proj =
        projectLookup.get(item.projectName) ||
        projectLookup.get(item.projectId) ||
        updatedProjects[0];
      const validStage = stages.some((s) => s.id === item.stage)
        ? item.stage
        : stages[0]?.id || 'IDEATION';

      return {
        id: item.id || `task-ai-${Date.now()}-${idx}`,
        title: item.title,
        description: item.description,
        stage: validStage,
        projectId: proj ? proj.id : 'proj-general',
        projectTag: proj ? proj.tag : 'AI-LAB',
        targetVenue: proj ? proj.targetVenue : 'Conference',
        startDate: new Date().toISOString().split('T')[0],
        deadline:
          item.deadline || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        progress: item.progress || 0,
        leadAuthor: lead,
        pi: piMember,
        priority: item.priority,
        visibility: item.visibility,
        assets: {},
        isBlocked: false,
        order: idx,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    if (mode === 'overwrite') {
      setTasks(newTasks);
    } else {
      setTasks((prev) => [...prev, ...newTasks]);
    }

    if (data.resources && data.resources.length > 0) {
      if (mode === 'overwrite') {
        const newResources: LabResource[] = data.resources.map((r) => ({
          id: r.id,
          nameZh: r.nameZh,
          nameEn: r.nameEn,
          type: r.type,
          specs: r.specs,
          status: 'IDLE',
        }));
        setResources(newResources);
      } else {
        const existingRes = new Set(resources.map((r) => r.nameZh.toLowerCase()));
        const toAddRes: LabResource[] = [];
        data.resources.forEach((r) => {
          if (!existingRes.has(r.nameZh.toLowerCase())) {
            toAddRes.push({
              id: r.id,
              nameZh: r.nameZh,
              nameEn: r.nameEn,
              type: r.type,
              specs: r.specs,
              status: 'IDLE',
            });
            existingRes.add(r.nameZh.toLowerCase());
          }
        });
        setResources((prev) => [...prev, ...toAddRes]);
      }
    }

    triggerConfetti();
    const countMembers = data.members.length;
    const countProjects = data.projects.length;
    const countTasks = data.tasks.length;
    const isZh = language === 'zh';
    addToast(
      isZh
        ? mode === 'overwrite'
          ? '🎉 AI 智能冷启动导入成功！'
          : '✨ 成功追加导入 AI 数据！'
        : mode === 'overwrite'
        ? '🎉 AI Onboarding Imported!'
        : '✨ AI Data Appended!',
      isZh
        ? `成功载入 ${countMembers} 位成员、${countProjects} 个课题项目与 ${countTasks} 项学术任务`
        : `Imported ${countMembers} members, ${countProjects} projects, and ${countTasks} tasks`,
      'success'
    );
  };

  const handleSetCurrentUserId = (newId: string) => {
    const target = members.find((m) => m.id === newId);
    const targetRole = deriveAccessRole(target);
    if (targetRole === 'ADMIN_PI' && !isAdminUnlocked) {
      setPasswordCallback(() => () => {
        setCurrentUserId(newId);
      });
      setIsPasswordModalOpen(true);
      return;
    }
    setCurrentUserId(newId);
  };

  return (
    <LabDataContext.Provider
      value={{
        language,
        setLanguage,
        t,
        storageMode,
        syncStatus,
        lastSyncError,
        lastSyncedAt,
        retryServerSync,
        stages,
        addStage,
        updateStage,
        deleteStage,
        restoreDefaultStages,
        venues,
        addVenue,
        deleteVenue,
        members,
        currentUserId,
        setCurrentUserId: handleSetCurrentUserId,
        addMember,
        updateMember,
        deleteMember,
        tasks: visibleTasks,
        allTasksCount: tasks.length,
        projects: visibleProjects,
        resources,
        weeklyTodos,
        allowPeerAcceptance,
        checklistTemplates,
        addProject,
        updateProject,
        deleteProject,
        addWeeklyTodo,
        updateWeeklyTodo,
        deleteWeeklyTodo,
        acceptWeeklyTodo,
        canAcceptTodo,
        pushChecklistItemToWeeklyTodo,
        setWorkspacePeerAcceptance,
        saveChecklistTemplate,
        deleteChecklistTemplate,
        resetChecklistTemplates,
        injectTemplateToTask,
        injectTemplateToWeeklyTodos,
        applyAIImport,
        moveTask,
        reorderTasks,
        reportBlocker,
        resolveBlocker,
        addTask,
        updateTask,
        updateTaskProgress,
        updateTaskDates,
        deleteTask,
        generateReverseDDLPipeline,
        claimResource,
        releaseResource,
        addResource,
        updateResource,
        deleteResource,
        resetToMockData,
        cleanSlateWipe,
        exportDataBackup,
        importDataBackup,
        generateMyWeeklyDigest,
        isAdminUnlocked,
        currentMember,
        currentAccessRole,
        effectiveIsAdmin,
        isSysAdmin,
        unlockAdmin,
        lockAdmin,
        updateAdminPassword,
        requireAdminAuth,
        canEditTask,
        canDeleteTask,
        canManageLab,
        canEditMemberProfile,
        canAssignMemberRole,
        registerNewMember,
      }}
    >
      {children}
    </LabDataContext.Provider>
  );
};

export const LabFlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider>
      <UIProvider>
        <LabDataProvider>{children}</LabDataProvider>
      </UIProvider>
    </ThemeProvider>
  );
};

export const useLabFlow = (): LabFlowContextType => {
  const themeCtx = useLabTheme();
  const uiCtx = useLabUI();
  const dataCtx = useContext(LabDataContext);
  if (!dataCtx) {
    throw new Error('useLabFlow must be used within a LabFlowProvider');
  }
  return {
    ...themeCtx,
    ...uiCtx,
    ...dataCtx,
  };
};
