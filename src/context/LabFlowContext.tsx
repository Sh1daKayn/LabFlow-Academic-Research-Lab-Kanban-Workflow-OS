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
  DirectRequest,
  DirectRequestKind,
  DirectRequestStatus,
  LabMember,
  LabResource,
  LabWorkspaceData,
  Language,
  NotificationEventKind,
  NotificationSettings,
  Priority,
  ProjectItem,
  RequestVisibility,
  ReverseDDLForm,
  StageConfig,
  StorageMode,
  TaskItem,
  VenuePreset,
  ViewMode,
  VisibilityLevel,
  WeeklyTodoAcceptanceStatus,
  WeeklyTodoItem,
  WorkCategory,
} from '@/types';
import {
  createInitialDirectRequests,
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
import { generateInitialsAvatar, getMemberDisplayName } from '@/utils/avatar';
import { canViewDirectRequest, sanitizeDirectRequests } from '@/utils/directRequests';
import {
  getRoleDefaultTitles,
  localizeWorkspaceCollections,
  resolvePreferredLanguage,
} from '@/utils/i18n';
import { hashMemberPin, hasMemberPin, verifyMemberPin } from '@/utils/pin';
import { sanitizeProjects } from '@/utils/projectAnalytics';
import { resolveMemberDefaultView, sanitizePreferredViews } from '@/utils/viewPreferences';
import {
  applyTodoToggleToTasks,
  canAcceptWeeklyTodo,
  canAssignWeeklyTodos,
  getWeekKey,
  sanitizeWeeklyTodos,
  syncTaskChecklistChangesToTodos,
} from '@/utils/weeklyTodos';
import {
  buildChecklistItemsFromTemplate,
  buildWeeklyTodosFromTemplate,
  DEFAULT_CHECKLIST_TEMPLATES,
  getDefaultChecklistTemplates,
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
  isTaskInPersonalScope,
} from '@/utils/rbac';
import {
  buildReverseDDLPipeline,
  moveTaskToStage,
  reorderStageTasks,
} from '@/utils/taskOperations';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  sanitizeNotificationSettings,
} from '@/utils/notificationPayloads';
import { detectNewPersonalAlerts, PersonalDesktopAlert } from '@/utils/desktopNotifications';
import {
  buildWeeklyDigestMarkdown,
} from '@/utils/weeklyDigest';
import {
  DEFAULT_OUTREACH_TRACKS,
  sanitizeOutreachTracks,
} from '@/utils/outreachTracks';
import { normalizeExternalUrl } from '@/utils/venues';
import { sanitizeAssetLinks } from '@/utils/assets';
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
  addVenues: (items: VenuePreset[]) => number;
  updateVenue: (venueId: string, updates: Partial<VenuePreset>) => void;
  deleteVenue: (venueId: string) => void;

  // Outreach / Workshop Tracks
  outreachTracks: string[];
  addOutreachTrack: (trackName: string) => void;
  removeOutreachTrack: (trackName: string) => void;

  // Members & Current User
  members: LabMember[];
  currentUserId: string;
  setCurrentUserId: (id: string) => void;
  isHydrated: boolean;
  isAuthenticatedSession: boolean;
  loginAsMember: (
    memberId: string,
    pin: string,
    newPinIfUnset?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  logoutMember: () => void;
  preferredViews: ViewMode[];
  defaultView: ViewMode;
  updateMyViewPreferences: (views: ViewMode[], defaultView: ViewMode) => void;
  updateMyPin: (currentPin: string, nextPin: string) => { ok: boolean; error?: string };
  addMember: (member: LabMember) => void;
  updateMember: (id: string, updates: Partial<LabMember>) => void;
  deleteMember: (id: string) => void;
  mergeDuplicateMember: (sourceMemberId: string, targetMemberId: string) => void;

  // Core Data
  tasks: TaskItem[];
  allTasksCount: number;
  projects: ProjectItem[];
  resources: LabResource[];
  weeklyTodos: WeeklyTodoItem[];
  directRequests: DirectRequest[];
  pendingRequestsForMeCount: number;
  allowPeerAcceptance: boolean;
  checklistTemplates: ChecklistAcceptanceTemplate[];
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (patch: Partial<NotificationSettings>) => void;
  desktopNotificationsEnabled: boolean;
  desktopNotificationPermission: NotificationPermission | 'unsupported';
  toggleDesktopNotifications: () => Promise<boolean>;
  sendTestDesktopNotification: () => void;
  addProject: (project: Omit<ProjectItem, 'id'> & { id?: string }) => ProjectItem;
  updateProject: (projectId: string, updates: Partial<ProjectItem>) => void;
  deleteProject: (projectId: string) => void;

  // 1-on-1 Direct Requests & Communication
  sendDirectRequest: (input: {
    kind: DirectRequestKind;
    title: string;
    content: string;
    recipientId: string;
    visibility: RequestVisibility;
    workCategory?: WorkCategory;
    projectId?: string;
    taskId?: string;
    dueDate?: string;
    notifyChannel?: boolean;
  }) => DirectRequest | null;
  replyDirectRequest: (requestId: string, content: string) => void;
  updateDirectRequestStatus: (requestId: string, status: DirectRequestStatus) => void;
  updateDirectRequestVisibility: (requestId: string, visibility: RequestVisibility) => void;
  deleteDirectRequest: (requestId: string) => void;

  // Weekly To-Do & Acceptance Actions
  canAssignWeeklyTodo: boolean;
  addWeeklyTodo: (
    todo: Omit<WeeklyTodoItem, 'id' | 'createdAt' | 'updatedAt' | 'acceptanceStatus'> & {
      acceptanceStatus?: WeeklyTodoAcceptanceStatus;
    }
  ) => WeeklyTodoItem | null;
  assignWeeklyTodos: (params: {
    memberIds: string[];
    weekKey: string;
    title: string;
    priority?: Priority;
    projectId?: string;
    taskId?: string;
    checklistItemId?: string;
    acceptanceCriteria?: string;
  }) => number;
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
    memberId?: string;
    memberIds?: string[];
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
  reportBlocker: (
    taskId: string,
    blocker: BlockerInfo,
    requestVisibility?: RequestVisibility,
    notifyChannel?: boolean
  ) => void;
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
    pin?: string;
    preferredViews?: ViewMode[];
    defaultView?: ViewMode;
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
  DIRECT_REQUESTS: 'labflow_direct_requests_v3',
  ALLOW_PEER_ACCEPTANCE: 'labflow_peer_acceptance_v3',
  OUTREACH_TRACKS: 'labflow_outreach_tracks_v1',
  CHECKLIST_TEMPLATES: 'labflow_checklist_templates_v3',
  NOTIFICATION_SETTINGS: 'labflow_notification_settings_v3',
  DESKTOP_NOTIFY: 'labflow_desktop_notify_v1',
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
    directRequests: sanitizeDirectRequests(workspace.directRequests),
    allowPeerAcceptance: Boolean(workspace.allowPeerAcceptance),
    outreachTracks: sanitizeOutreachTracks(workspace.outreachTracks),
    checklistTemplates: sanitizeChecklistTemplates(workspace.checklistTemplates),
    notificationSettings: sanitizeNotificationSettings(workspace.notificationSettings),
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
    setSelectedWorkshopFilter,
    setViewMode,
    workspaceScope,
    setWorkspaceScope,
    setWorkCategoryFilter,
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
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isAuthenticatedSession, setIsAuthenticatedSession] = useState<boolean>(false);
  const [resources, setResources] = useState<LabResource[]>(INITIAL_RESOURCES);
  const [weeklyTodos, setWeeklyTodos] = useState<WeeklyTodoItem[]>(() =>
    createInitialWeeklyTodos()
  );
  const [directRequests, setDirectRequests] = useState<DirectRequest[]>(() =>
    createInitialDirectRequests()
  );
  const [allowPeerAcceptance, setAllowPeerAcceptance] = useState<boolean>(false);
  const [outreachTracks, setOutreachTracks] = useState<string[]>(() => [...DEFAULT_OUTREACH_TRACKS]);
  const [checklistTemplates, setChecklistTemplates] = useState<ChecklistAcceptanceTemplate[]>(() =>
    structuredClone(DEFAULT_CHECKLIST_TEMPLATES)
  );
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() =>
    structuredClone(DEFAULT_NOTIFICATION_SETTINGS)
  );
  const [desktopNotificationsEnabled, setDesktopNotificationsEnabled] = useState<boolean>(false);
  const [desktopNotificationPermission, setDesktopNotificationPermission] = useState<
    NotificationPermission | 'unsupported'
  >('default');

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
  const currentUserIdRef = useRef<string>(currentUserId);
  currentUserIdRef.current = currentUserId;
  const desktopNotifyRef = useRef<boolean>(desktopNotificationsEnabled);
  desktopNotifyRef.current = desktopNotificationsEnabled;
  const latestWorkspaceRef = useRef<LabWorkspaceData>({
    stages: DEFAULT_STAGES,
    tasks: INITIAL_TASKS,
    projects: INITIAL_PROJECTS,
    members: LAB_MEMBERS,
    venues: DEFAULT_VENUES,
    resources: INITIAL_RESOURCES,
    weeklyTodos: [],
    directRequests: [],
    allowPeerAcceptance: false,
    outreachTracks: [...DEFAULT_OUTREACH_TRACKS],
    checklistTemplates: DEFAULT_CHECKLIST_TEMPLATES,
    notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,
  });

  latestWorkspaceRef.current = {
    stages,
    tasks,
    projects,
    members,
    venues,
    resources,
    weeklyTodos,
    directRequests,
    allowPeerAcceptance,
    outreachTracks,
    checklistTemplates,
    notificationSettings,
  };

  const t = language === 'zh' ? zh : en;

  const handleSetLanguage = useCallback((nextLang: Language) => {
    setLanguage(nextLang);
    try {
      localStorage.setItem(CACHE_KEYS.LANG, nextLang);
    } catch {}
  }, []);

  const applyServerSnapshot = useCallback((snapshot: LabWorkspaceData) => {
    lastSyncedSerializedRef.current = serializeWorkspace(snapshot);
    setStages(snapshot.stages);
    setTasks(snapshot.tasks);
    setProjects(snapshot.projects);
    setMembers(snapshot.members);
    setVenues(snapshot.venues);
    setResources(snapshot.resources);
    setWeeklyTodos(sanitizeWeeklyTodos(snapshot.weeklyTodos));
    setDirectRequests(sanitizeDirectRequests(snapshot.directRequests));
    setAllowPeerAcceptance(Boolean(snapshot.allowPeerAcceptance));
    setOutreachTracks(sanitizeOutreachTracks(snapshot.outreachTracks));
    setChecklistTemplates(sanitizeChecklistTemplates(snapshot.checklistTemplates));
    setNotificationSettings(sanitizeNotificationSettings(snapshot.notificationSettings));
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
      let savedUserId: string | null = null;
      let offlineMembers: LabMember[] = LAB_MEMBERS;

      try {
        // Purge legacy plain-text credential keys from browser storage
        localStorage.removeItem(CACHE_KEYS.LEGACY_ADMIN_PASS);
        sessionStorage.removeItem(CACHE_KEYS.LEGACY_ADMIN_UNLOCKED);

        const savedLang = localStorage.getItem(CACHE_KEYS.LANG);
        savedUserId = localStorage.getItem(CACHE_KEYS.CURRENT_USER);
        const browserLanguages =
          typeof navigator !== 'undefined'
            ? navigator.languages && navigator.languages.length > 0
              ? navigator.languages
              : [navigator.language]
            : [];
        const initialLang = resolvePreferredLanguage({
          savedLang,
          search: typeof window !== 'undefined' ? window.location.search : '',
          browserLanguages,
        });
        setLanguage(initialLang);
        if (savedUserId) setCurrentUserId(savedUserId);
        hasPendingOfflineSync = localStorage.getItem(CACHE_KEYS.PENDING_OFFLINE_SYNC) === '1';

        // Apply cached offline copy initially before server response arrives
        const cachedTasks = localStorage.getItem(CACHE_KEYS.TASKS);
        const cachedStages = localStorage.getItem(CACHE_KEYS.STAGES);
        const cachedProjects = localStorage.getItem(CACHE_KEYS.PROJECTS);
        const cachedMembers = localStorage.getItem(CACHE_KEYS.MEMBERS);
        const cachedVenues = localStorage.getItem(CACHE_KEYS.VENUES);
        const cachedResources = localStorage.getItem(CACHE_KEYS.RESOURCES);
        const cachedTodos = localStorage.getItem(CACHE_KEYS.WEEKLY_TODOS);
        const cachedRequests = localStorage.getItem(CACHE_KEYS.DIRECT_REQUESTS);
        const cachedPeerAcc = localStorage.getItem(CACHE_KEYS.ALLOW_PEER_ACCEPTANCE);
        const cachedOutreach = localStorage.getItem(CACHE_KEYS.OUTREACH_TRACKS);
        const cachedTemplates = localStorage.getItem(CACHE_KEYS.CHECKLIST_TEMPLATES);
        const cachedNotifSettings = localStorage.getItem(CACHE_KEYS.NOTIFICATION_SETTINGS);
        const cachedDesktopNotify = localStorage.getItem(CACHE_KEYS.DESKTOP_NOTIFY);

        if (cachedStages) setStages(JSON.parse(cachedStages));
        if (cachedTasks) setTasks(JSON.parse(cachedTasks));
        if (cachedProjects) setProjects(JSON.parse(cachedProjects));
        if (cachedMembers) {
          offlineMembers = JSON.parse(cachedMembers);
          setMembers(offlineMembers);
        }
        if (cachedVenues) setVenues(JSON.parse(cachedVenues));
        if (cachedResources) setResources(JSON.parse(cachedResources));
        if (cachedTodos) setWeeklyTodos(sanitizeWeeklyTodos(JSON.parse(cachedTodos)));
        if (cachedRequests) setDirectRequests(sanitizeDirectRequests(JSON.parse(cachedRequests)));
        if (cachedPeerAcc !== null) setAllowPeerAcceptance(cachedPeerAcc === 'true');
        if (cachedOutreach !== null) setOutreachTracks(sanitizeOutreachTracks(JSON.parse(cachedOutreach)));
        if (cachedTemplates !== null) {
          setChecklistTemplates(sanitizeChecklistTemplates(JSON.parse(cachedTemplates)));
        }
        if (cachedNotifSettings !== null) {
          setNotificationSettings(sanitizeNotificationSettings(JSON.parse(cachedNotifSettings)));
        }
        if (typeof window !== 'undefined' && typeof Notification !== 'undefined') {
          setDesktopNotificationPermission(Notification.permission);
          if (cachedDesktopNotify === '1' && Notification.permission === 'granted') {
            setDesktopNotificationsEnabled(true);
          }
        } else {
          setDesktopNotificationPermission('unsupported');
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
        const matched = savedUserId
          ? memberSource.find((m) => m.id === savedUserId)
          : undefined;
        if (matched) {
          setCurrentUserId(matched.id);
          setIsAuthenticatedSession(true);
          setWorkspaceScope('MINE');
          setViewMode(resolveMemberDefaultView(matched));
        } else {
          setCurrentUserId('');
          setIsAuthenticatedSession(false);
        }
      } catch (e) {
        console.warn('Server workspace unavailable, running offline cache:', e);
        if (!cancelled) {
          setSyncStatus('offline');
          setLastSyncError(
            formatSyncError(undefined, e instanceof Error ? e.message : 'unavailable')
          );
          const matchedOffline = savedUserId
            ? offlineMembers.find((m) => m.id === savedUserId)
            : undefined;
          if (matchedOffline) {
            setCurrentUserId(matchedOffline.id);
            setIsAuthenticatedSession(true);
            setWorkspaceScope('MINE');
            setViewMode(resolveMemberDefaultView(matchedOffline));
          } else {
            setCurrentUserId('');
            setIsAuthenticatedSession(false);
          }
        }
      } finally {
        if (!cancelled) setIsHydrated(true);
      }
    };

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [applyServerSnapshot, formatSyncError, setViewMode, setWorkspaceScope]);

  // Persist active authenticated member selection locally
  useEffect(() => {
    if (!isHydrated) return;
    try {
      if (isAuthenticatedSession && currentUserId) {
        localStorage.setItem(CACHE_KEYS.CURRENT_USER, currentUserId);
      } else {
        localStorage.removeItem(CACHE_KEYS.CURRENT_USER);
      }
    } catch {}
  }, [currentUserId, isAuthenticatedSession, isHydrated]);

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
      directRequests,
      allowPeerAcceptance,
      outreachTracks,
      checklistTemplates,
      notificationSettings,
    };

    try {
      localStorage.setItem(CACHE_KEYS.STAGES, JSON.stringify(stages));
      localStorage.setItem(CACHE_KEYS.TASKS, JSON.stringify(tasks));
      localStorage.setItem(CACHE_KEYS.PROJECTS, JSON.stringify(projects));
      localStorage.setItem(CACHE_KEYS.MEMBERS, JSON.stringify(members));
      localStorage.setItem(CACHE_KEYS.VENUES, JSON.stringify(venues));
      localStorage.setItem(CACHE_KEYS.RESOURCES, JSON.stringify(resources));
      localStorage.setItem(CACHE_KEYS.WEEKLY_TODOS, JSON.stringify(weeklyTodos));
      localStorage.setItem(CACHE_KEYS.DIRECT_REQUESTS, JSON.stringify(directRequests));
      localStorage.setItem(CACHE_KEYS.ALLOW_PEER_ACCEPTANCE, allowPeerAcceptance ? 'true' : 'false');
      localStorage.setItem(CACHE_KEYS.OUTREACH_TRACKS, JSON.stringify(outreachTracks));
      localStorage.setItem(CACHE_KEYS.CHECKLIST_TEMPLATES, JSON.stringify(checklistTemplates));
      localStorage.setItem(
        CACHE_KEYS.NOTIFICATION_SETTINGS,
        JSON.stringify(notificationSettings)
      );
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
    directRequests,
    allowPeerAcceptance,
    outreachTracks,
    checklistTemplates,
    notificationSettings,
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

  const localizedView = useMemo(
    () =>
      localizeWorkspaceCollections(
        {
          projects,
          tasks,
          weeklyTodos,
          directRequests,
          checklistTemplates,
        },
        language
      ),
    [projects, tasks, weeklyTodos, directRequests, checklistTemplates, language]
  );

  // Keep selectedTask synchronized with updates to the underlying task list
  useEffect(() => {
    if (!selectedTask) return;
    const latest = localizedView.tasks.find((item) => item.id === selectedTask.id);
    if (!latest) {
      setSelectedTask(null);
    } else if (latest !== selectedTask) {
      setSelectedTask(latest);
    }
  }, [localizedView.tasks, selectedTask, setSelectedTask]);

  const fireBrowserNotification = useCallback(
    (alert: PersonalDesktopAlert) => {
      if (
        typeof window === 'undefined' ||
        typeof Notification === 'undefined' ||
        Notification.permission !== 'granted'
      ) {
        return;
      }
      try {
        const notif = new Notification(alert.title, {
          body: alert.body,
          tag: alert.tag,
        });
        notif.onclick = () => {
          try {
            window.focus();
          } catch {}
          setViewMode(alert.viewMode);
          if (alert.taskId) {
            const matched = latestWorkspaceRef.current.tasks.find(
              (item) => item.id === alert.taskId
            );
            if (matched) setSelectedTask(matched);
          }
          notif.close();
        };
      } catch {
        // Ignore browser notification errors in restricted contexts
      }
    },
    [setSelectedTask, setViewMode]
  );

  const toggleDesktopNotifications = useCallback(async (): Promise<boolean> => {
    const isZh = languageRef.current === 'zh';
    if (typeof window === 'undefined' || typeof Notification === 'undefined') {
      setDesktopNotificationPermission('unsupported');
      addToast(
        isZh ? '当前浏览器不支持系统桌面通知' : 'Desktop Notifications Unsupported',
        isZh ? '请使用现代桌面浏览器并通过 localhost / HTTPS 访问' : 'Use a modern browser over HTTPS or localhost',
        'warning'
      );
      return false;
    }

    if (desktopNotifyRef.current) {
      setDesktopNotificationsEnabled(false);
      try {
        localStorage.setItem(CACHE_KEYS.DESKTOP_NOTIFY, '0');
      } catch {}
      addToast(
        isZh ? '已关闭本机浏览器桌面弹窗提醒' : 'Desktop Alerts Muted',
        '',
        'info'
      );
      return false;
    }

    let perm = Notification.permission;
    if (perm === 'default') {
      try {
        perm = await Notification.requestPermission();
      } catch {
        perm = 'denied';
      }
    }
    setDesktopNotificationPermission(perm);

    if (perm !== 'granted') {
      setDesktopNotificationsEnabled(false);
      addToast(
        isZh ? '浏览器未授予通知权限' : 'Browser Notification Permission Required',
        isZh
          ? '请在浏览器地址栏左侧权限设置中允许通知后重试'
          : 'Allow notifications in browser site settings and retry',
        'warning'
      );
      return false;
    }

    setDesktopNotificationsEnabled(true);
    try {
      localStorage.setItem(CACHE_KEYS.DESKTOP_NOTIFY, '1');
    } catch {}
    addToast(
      isZh ? '已开启浏览器桌面后台弹窗提醒' : 'Desktop Alerts Enabled',
      isZh
        ? '保持网页标签开启，新申请、回复、卡点与指派都会在右下角提醒'
        : 'Keep tab open to receive OS popups on 12s background sync',
      'success'
    );
    return true;
  }, [addToast]);

  const sendTestDesktopNotification = useCallback(() => {
    const isZh = languageRef.current === 'zh';
    if (typeof window === 'undefined' || typeof Notification === 'undefined') {
      addToast(isZh ? '当前环境不支持桌面通知' : 'Desktop notifications unsupported', '', 'warning');
      return;
    }
    if (Notification.permission !== 'granted') {
      void toggleDesktopNotifications();
      return;
    }
    fireBrowserNotification({
      id: `test-${Date.now()}`,
      tag: 'labflow-test-desktop',
      title: isZh ? 'LabFlow 桌面弹窗测试成功' : 'LabFlow Desktop Alert Test',
      body: isZh
        ? '当有同事或导师@您、指派 To-Do 或回复 1对1 申请时，这里会弹出提醒。'
        : 'New requests, replies, escalations, and assigned To-Dos will pop up here.',
      viewMode: 'requests',
    });
  }, [addToast, fireBrowserNotification, toggleDesktopNotifications]);

  const updateNotificationSettings = useCallback((patch: Partial<NotificationSettings>) => {
    setNotificationSettings((prev) =>
      sanitizeNotificationSettings({
        ...prev,
        ...patch,
        teams: patch.teams ? { ...prev.teams, ...patch.teams } : prev.teams,
        slack: patch.slack ? { ...prev.slack, ...patch.slack } : prev.slack,
        digest: patch.digest ? { ...prev.digest, ...patch.digest } : prev.digest,
      })
    );
  }, []);

  const triggerExternalNotification = useCallback(
    (payload: {
      type: NotificationEventKind;
      title: string;
      subtitle?: string;
      body?: string;
      actorName?: string;
      targetName?: string;
      projectTag?: string;
      deadline?: string;
      isPrivate?: boolean;
    }) => {
      if (!notificationSettings.enabled) return;
      void fetch('/api/notifications/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => undefined);
    },
    [notificationSettings.enabled]
  );

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
          const prevSnap = latestWorkspaceRef.current;
          serverRevisionRef.current = payload.revision;
          if (payload.updatedAt) setLastSyncedAt(payload.updatedAt);
          applyServerSnapshot(payload.data);
          if (desktopNotifyRef.current && currentUserIdRef.current) {
            const alerts = detectNewPersonalAlerts(
              prevSnap,
              payload.data,
              currentUserIdRef.current,
              languageRef.current
            );
            alerts.forEach(fireBrowserNotification);
          }
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
  }, [isHydrated, applyServerSnapshot, fireBrowserNotification, flushWorkspaceToServer]);

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

  const preferredViews = useMemo(
    () => sanitizePreferredViews(currentMember?.preferredViews),
    [currentMember]
  );
  const defaultView = useMemo(
    () => resolveMemberDefaultView(currentMember),
    [currentMember]
  );

  const visibleTasks = useMemo(() => {
    return localizedView.tasks.filter((task) => {
      if (
        !canViewTask(
          task,
          currentUserId,
          currentAccessRole,
          effectiveIsAdmin,
          localizedView.projects
        )
      ) {
        return false;
      }
      if (workspaceScope === 'MINE') {
        return isTaskInPersonalScope(task, currentUserId, localizedView.projects);
      }
      return true;
    });
  }, [
    localizedView.tasks,
    localizedView.projects,
    currentAccessRole,
    currentUserId,
    effectiveIsAdmin,
    workspaceScope,
  ]);

  const visibleProjects = useMemo(() => {
    return localizedView.projects.filter((proj) => {
      if (!canViewProject(proj, currentUserId, currentAccessRole, effectiveIsAdmin)) {
        return false;
      }
      if (workspaceScope === 'MINE') {
        return (
          proj.leadAuthorId === currentUserId ||
          proj.piId === currentUserId ||
          (Array.isArray(proj.memberIds) && proj.memberIds.includes(currentUserId))
        );
      }
      return true;
    });
  }, [
    localizedView.projects,
    currentAccessRole,
    currentUserId,
    effectiveIsAdmin,
    workspaceScope,
  ]);

  const visibleDirectRequests = useMemo(() => {
    return localizedView.directRequests.filter((req) =>
      canViewDirectRequest(req, currentUserId, workspaceScope)
    );
  }, [localizedView.directRequests, currentUserId, workspaceScope]);

  const pendingRequestsForMeCount = useMemo(() => {
    if (!currentUserId) return 0;
    return localizedView.directRequests.filter(
      (req) => req.recipientId === currentUserId && req.status !== 'RESOLVED'
    ).length;
  }, [localizedView.directRequests, currentUserId]);

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
    pin?: string;
    preferredViews?: ViewMode[];
    defaultView?: ViewMode;
    accessRole?: AccessRole;
  }): LabMember => {
    const id = `member-${Date.now()}`;
    const defaultAccess: AccessRole =
      data.accessRole || (data.role === 'VISITING_SCHOLAR' ? 'AUDITOR_GUEST' : 'STUDENT_RA');
    const displayName =
      language === 'en' ? data.nameEn || data.nameZh : data.nameZh || data.nameEn;
    const roleTitles = getRoleDefaultTitles(data.role);
    const cleanViews = sanitizePreferredViews(data.preferredViews);
    const resolvedDefaultView =
      data.defaultView && cleanViews.includes(data.defaultView)
        ? data.defaultView
        : cleanViews[0] || 'kanban';
    const hashedPin = data.pin && data.pin.trim() ? hashMemberPin(data.pin) : undefined;

    const newMember: LabMember = {
      id,
      nameZh: data.nameZh,
      nameEn: data.nameEn || data.nameZh,
      role: data.role,
      accessRole: defaultAccess,
      titleZh: roleTitles.titleZh,
      titleEn: roleTitles.titleEn,
      avatar: generateInitialsAvatar(displayName, id),
      email: data.email || `${id}@labflow.edu`,
      pin: hashedPin,
      preferredViews: cleanViews,
      defaultView: resolvedDefaultView,
    };
    setMembers((prev) => [...prev, newMember]);
    setCurrentUserId(id);
    setIsAuthenticatedSession(true);
    setWorkspaceScope('MINE');
    setFilterMemberId('all');
    setViewMode(resolvedDefaultView);
    addToast(t.welcomeMember, getMemberDisplayName(newMember, language), 'success');
    return newMember;
  };

  const loginAsMember = async (
    memberId: string,
    pin: string,
    newPinIfUnset?: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const target = members.find((m) => m.id === memberId);
    if (!target) {
      return { ok: false, error: language === 'zh' ? '未找到该成员账号' : 'Member not found' };
    }

    const targetRole = deriveAccessRole(target);
    if (targetRole === 'ADMIN_PI') {
      const unlocked = await unlockAdmin(pin);
      if (!unlocked) {
        return {
          ok: false,
          error: language === 'zh' ? '导师密码错误，登录失败' : 'Incorrect PI password',
        };
      }
      setCurrentUserId(target.id);
      setIsAuthenticatedSession(true);
      setWorkspaceScope('MINE');
      setFilterMemberId('all');
      setViewMode(resolveMemberDefaultView(target));
      return { ok: true };
    }

    if (hasMemberPin(target)) {
      if (!verifyMemberPin(pin, target.pin)) {
        return {
          ok: false,
          error: language === 'zh' ? '个人密码 / PIN 错误' : 'Incorrect personal PIN',
        };
      }
    } else {
      const setupPin = (newPinIfUnset || pin).trim();
      if (setupPin.length < 4) {
        return {
          ok: false,
          error:
            language === 'zh'
              ? '该账号首次认领需设置至少 4 位个人密码 / PIN'
              : 'Please set at least a 4-character personal PIN for first-time sign-in',
        };
      }
      const hashed = hashMemberPin(setupPin);
      setMembers((prev) => prev.map((m) => (m.id === target.id ? { ...m, pin: hashed } : m)));
    }

    setCurrentUserId(target.id);
    setIsAuthenticatedSession(true);
    setWorkspaceScope('MINE');
    setFilterMemberId('all');
    setViewMode(resolveMemberDefaultView(target));
    addToast(
      language === 'zh' ? '已进入个人工作台' : 'Signed In',
      language === 'zh' ? target.nameZh : target.nameEn,
      'success'
    );
    return { ok: true };
  };

  const logoutMember = () => {
    if (isAdminUnlocked) {
      void lockAdmin();
    }
    try {
      localStorage.removeItem(CACHE_KEYS.CURRENT_USER);
    } catch {}
    setIsAuthenticatedSession(false);
    setCurrentUserId('');
    setWorkspaceScope('MINE');
    setWorkCategoryFilter('ALL');
    setSelectedWorkshopFilter('ALL');
    setFilterMemberId('all');
    setSelectedTask(null);
  };

  const updateMyViewPreferences = (views: ViewMode[], nextDefaultView: ViewMode) => {
    const cleanViews = sanitizePreferredViews(views);
    const cleanDefault = cleanViews.includes(nextDefaultView) ? nextDefaultView : cleanViews[0];
    setMembers((prev) =>
      prev.map((m) =>
        m.id === currentUserId
          ? { ...m, preferredViews: cleanViews, defaultView: cleanDefault }
          : m
      )
    );
    if (!cleanViews.includes(cleanDefault)) {
      setViewMode('kanban');
    }
    addToast(
      language === 'zh' ? '个人初始视图设置已保存' : 'View preferences saved',
      '',
      'success'
    );
  };

  const updateMyPin = (currentPin: string, nextPin: string): { ok: boolean; error?: string } => {
    const cleanNext = nextPin.trim();
    if (cleanNext.length < 4) {
      return {
        ok: false,
        error: language === 'zh' ? '新密码 / PIN 至少需要 4 位' : 'PIN must be at least 4 characters',
      };
    }
    if (hasMemberPin(currentMember) && !verifyMemberPin(currentPin, currentMember.pin)) {
      return {
        ok: false,
        error: language === 'zh' ? '当前密码 / PIN 不正确' : 'Current PIN does not match',
      };
    }
    const hashed = hashMemberPin(cleanNext);
    setMembers((prev) =>
      prev.map((m) => (m.id === currentUserId ? { ...m, pin: hashed } : m))
    );
    addToast(language === 'zh' ? '个人密码 / PIN 已更新' : 'Personal PIN updated', '', 'success');
    return { ok: true };
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

  const mergeDuplicateMember = (sourceMemberId: string, targetMemberId: string) => {
    if (!canManageLab()) {
      addToast(t.requireAdminNotice, '', 'warning');
      return;
    }
    if (!sourceMemberId || !targetMemberId || sourceMemberId === targetMemberId) return;
    const sourceMember = members.find((m) => m.id === sourceMemberId);
    const targetMember = members.find((m) => m.id === targetMemberId);
    if (!sourceMember || !targetMember) return;

    const sourceRole = deriveAccessRole(sourceMember);
    if (!effectiveIsAdmin && (sourceRole === 'ADMIN_PI' || sourceRole === 'SYS_ADMIN')) {
      addToast(
        language === 'zh'
          ? '系统管理员无权合并导师或其他系统管理员账号'
          : 'System Admin cannot merge PI or fellow System Admin accounts',
        '',
        'warning'
      );
      return;
    }

    const mergedTarget: LabMember = {
      ...targetMember,
      pin: hasMemberPin(targetMember) ? targetMember.pin : sourceMember.pin,
      avatar: targetMember.avatar || sourceMember.avatar,
      email:
        targetMember.email && !targetMember.email.endsWith('@lab.edu')
          ? targetMember.email
          : sourceMember.email || targetMember.email,
    };

    const targetDisplayName =
      language === 'zh'
        ? mergedTarget.nameZh || mergedTarget.nameEn
        : mergedTarget.nameEn || mergedTarget.nameZh;

    setTasks((prev) =>
      prev.map((task) => {
        const replaceLead = task.leadAuthor?.id === sourceMemberId;
        const replacePi = task.pi?.id === sourceMemberId;
        const replaceEscalated = task.blocker?.escalatedToId === sourceMemberId;
        if (!replaceLead && !replacePi && !replaceEscalated) return task;
        return {
          ...task,
          leadAuthor: replaceLead ? mergedTarget : task.leadAuthor,
          pi: replacePi ? mergedTarget : task.pi,
          blocker:
            replaceEscalated && task.blocker
              ? {
                  ...task.blocker,
                  escalatedToId: mergedTarget.id,
                  escalatedTo: targetDisplayName,
                }
              : task.blocker,
        };
      })
    );

    setProjects((prev) =>
      prev.map((proj) => {
        const nextMemberIds = proj.memberIds
          ? Array.from(
              new Set(
                proj.memberIds.map((id) => (id === sourceMemberId ? targetMemberId : id))
              )
            )
          : proj.memberIds;
        const nextHandoffs = proj.handoffHistory?.map((entry) =>
          entry.memberId === sourceMemberId
            ? { ...entry, memberId: targetMemberId, memberName: targetDisplayName }
            : entry
        );
        return {
          ...proj,
          leadAuthorId: proj.leadAuthorId === sourceMemberId ? targetMemberId : proj.leadAuthorId,
          piId: proj.piId === sourceMemberId ? targetMemberId : proj.piId,
          memberIds: nextMemberIds,
          handoffHistory: nextHandoffs,
        };
      })
    );

    setWeeklyTodos((prev) =>
      prev.map((todo) => ({
        ...todo,
        memberId: todo.memberId === sourceMemberId ? targetMemberId : todo.memberId,
        assignedById:
          todo.assignedById === sourceMemberId ? targetMemberId : todo.assignedById,
        acceptedById:
          todo.acceptedById === sourceMemberId ? targetMemberId : todo.acceptedById,
      }))
    );

    setDirectRequests((prev) =>
      prev.map((req) => ({
        ...req,
        senderId: req.senderId === sourceMemberId ? targetMemberId : req.senderId,
        recipientId: req.recipientId === sourceMemberId ? targetMemberId : req.recipientId,
        replies: req.replies?.map((reply) =>
          reply.authorId === sourceMemberId ? { ...reply, authorId: targetMemberId } : reply
        ),
      }))
    );

    setMembers((prev) =>
      prev
        .filter((m) => m.id !== sourceMemberId)
        .map((m) => (m.id === targetMemberId ? mergedTarget : m))
    );
    if (currentUserId === sourceMemberId) {
      setCurrentUserId(targetMemberId);
    }

    addToast(
      language === 'zh' ? '重复成员账号已合并' : 'Duplicate Member Merged',
      `${sourceMember.nameEn || sourceMember.nameZh} -> ${targetDisplayName}`,
      'success'
    );
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
    if (
      updates.tag !== undefined ||
      updates.targetVenue !== undefined ||
      updates.targetVenueUrl !== undefined
    ) {
      setTasks((prev) =>
        prev.map((item) =>
          item.projectId === projectId
            ? {
                ...item,
                projectTag: updates.tag ?? item.projectTag,
                targetVenue: updates.targetVenue ?? item.targetVenue,
                targetVenueUrl:
                  updates.targetVenueUrl !== undefined
                    ? normalizeExternalUrl(updates.targetVenueUrl)
                    : item.targetVenueUrl,
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

  const canAssignWeeklyTodo = canAssignWeeklyTodos(currentAccessRole, isAdminUnlocked);

  const addWeeklyTodo = (
    todoData: Omit<WeeklyTodoItem, 'id' | 'createdAt' | 'updatedAt' | 'acceptanceStatus'> & {
      acceptanceStatus?: WeeklyTodoAcceptanceStatus;
    }
  ): WeeklyTodoItem | null => {
    if (currentAccessRole === 'AUDITOR_GUEST' && !effectiveIsAdmin) {
      addToast(t.readOnlyNotice, '', 'warning');
      return null;
    }
    const isCrossMember = todoData.memberId !== currentUserId;
    if (isCrossMember && !canAssignWeeklyTodo) {
      addToast(
        language === 'zh'
          ? '仅导师、系统管理员或项目骨干可给其他成员布置本周任务'
          : 'Only Advisors, SysAdmins, or Project Leads can assign tasks to other members',
        '',
        'warning'
      );
      return null;
    }
    const now = new Date().toISOString();
    const newTodo: WeeklyTodoItem = {
      ...todoData,
      id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      acceptanceStatus: todoData.acceptanceStatus || (todoData.done ? 'SUBMITTED' : 'PENDING'),
      assignedById: todoData.assignedById ?? (isCrossMember ? currentUserId : undefined),
      createdAt: now,
      updatedAt: now,
    };
    setWeeklyTodos((prev) => [newTodo, ...prev]);
    if (newTodo.taskId && newTodo.checklistItemId) {
      setTasks((prev) => applyTodoToggleToTasks(prev, newTodo, newTodo.done));
    }
    addToast(
      isCrossMember
        ? language === 'zh'
          ? '已布置本周任务'
          : 'Weekly Task Assigned'
        : language === 'zh'
        ? '已添加本周待办事项'
        : 'Weekly To-Do Added',
      newTodo.title.slice(0, 32),
      'success'
    );
    return newTodo;
  };

  const assignWeeklyTodos = ({
    memberIds,
    weekKey,
    title,
    priority = 'MEDIUM',
    projectId,
    taskId,
    checklistItemId,
    acceptanceCriteria,
  }: {
    memberIds: string[];
    weekKey: string;
    title: string;
    priority?: Priority;
    projectId?: string;
    taskId?: string;
    checklistItemId?: string;
    acceptanceCriteria?: string;
  }): number => {
    const cleanTitle = title.trim();
    const uniqueTargets = Array.from(new Set(memberIds.filter(Boolean)));
    if (!cleanTitle || uniqueTargets.length === 0) return 0;

    if (currentAccessRole === 'AUDITOR_GUEST' && !effectiveIsAdmin) {
      addToast(t.readOnlyNotice, '', 'warning');
      return 0;
    }

    const targetsOther = uniqueTargets.some((id) => id !== currentUserId);
    if (targetsOther && !canAssignWeeklyTodo) {
      addToast(
        language === 'zh'
          ? '仅导师、系统管理员或项目骨干可给其他成员布置本周任务'
          : 'Only Advisors, SysAdmins, or Project Leads can assign tasks to others',
        '',
        'warning'
      );
      return 0;
    }

    const now = new Date().toISOString();
    const titleKey = cleanTitle.toLowerCase();
    const createdItems: WeeklyTodoItem[] = [];
    let skipped = 0;

    uniqueTargets.forEach((memberId, idx) => {
      const exists = weeklyTodos.some(
        (w) =>
          w.memberId === memberId &&
          w.weekKey === weekKey &&
          w.title.trim().toLowerCase() === titleKey
      );
      if (exists) {
        skipped += 1;
        return;
      }

      createdItems.push({
        id: `todo-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
        memberId,
        weekKey,
        title: cleanTitle,
        done: false,
        priority,
        projectId: projectId || undefined,
        taskId: taskId || undefined,
        checklistItemId: checklistItemId || undefined,
        acceptanceCriteria: acceptanceCriteria?.trim() || undefined,
        acceptanceStatus: 'PENDING',
        assignedById: memberId !== currentUserId ? currentUserId : undefined,
        createdAt: now,
        updatedAt: now,
      });
    });

    if (createdItems.length === 0) {
      addToast(
        language === 'zh' ? '所选成员本周已有同名待办任务' : 'Selected members already have this task',
        cleanTitle.slice(0, 32),
        'info'
      );
      return 0;
    }

    setWeeklyTodos((prev) => [...createdItems, ...prev]);
    addToast(
      targetsOther
        ? language === 'zh'
          ? `已向 ${createdItems.length} 位成员布置本周任务`
          : `Assigned weekly task to ${createdItems.length} member(s)`
        : language === 'zh'
        ? '已添加本周待办事项'
        : 'Weekly To-Do Added',
      skipped > 0
        ? language === 'zh'
          ? `${cleanTitle.slice(0, 24)}（跳过重复 ${skipped} 人）`
          : `${cleanTitle.slice(0, 24)} (${skipped} skipped)`
        : cleanTitle.slice(0, 32),
      'success'
    );
    return createdItems.length;
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
    if (currentAccessRole === 'AUDITOR_GUEST' && !effectiveIsAdmin) {
      addToast(t.readOnlyNotice, '', 'warning');
      return;
    }
    const isCrossMember = memberId !== currentUserId;
    if (isCrossMember && !canAssignWeeklyTodo) {
      addToast(
        language === 'zh'
          ? '仅导师、系统管理员或项目骨干可向他人布置任务'
          : 'Only Advisors, SysAdmins, or Project Leads can assign tasks to others',
        '',
        'warning'
      );
      return;
    }
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
      assignedById: isCrossMember ? currentUserId : undefined,
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
      const missingDefaults = getDefaultChecklistTemplates(language).filter(
        (d) => !existingIds.has(d.id)
      );
      return [...prev, ...missingDefaults];
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
    const template = localizedView.checklistTemplates.find((tpl) => tpl.id === templateId);
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
    memberIds,
    weekKey,
    projectId,
    taskId,
  }: {
    templateId: string;
    memberId?: string;
    memberIds?: string[];
    weekKey: string;
    projectId?: string;
    taskId?: string;
  }): number => {
    if (currentAccessRole === 'AUDITOR_GUEST' && !effectiveIsAdmin) {
      addToast(t.readOnlyNotice, '', 'warning');
      return 0;
    }
    const targetMembers = Array.from(
      new Set((memberIds && memberIds.length > 0 ? memberIds : memberId ? [memberId] : []).filter(Boolean))
    );
    if (targetMembers.length === 0) return 0;

    if (targetMembers.some((id) => id !== currentUserId) && !canAssignWeeklyTodo) {
      addToast(
        language === 'zh'
          ? '仅导师、系统管理员或项目骨干可给其他成员批量注入任务'
          : 'Only Advisors, SysAdmins, or Project Leads can inject tasks for other members',
        '',
        'warning'
      );
      return 0;
    }

    const template = localizedView.checklistTemplates.find((tpl) => tpl.id === templateId);
    if (!template) return 0;

    const linkedTask = taskId ? localizedView.tasks.find((tk) => tk.id === taskId) : undefined;
    const allAdded: WeeklyTodoItem[] = [];
    let totalSkipped = 0;

    targetMembers.forEach((targetMemberId) => {
      const { addedTodos, skippedCount } = buildWeeklyTodosFromTemplate({
        template,
        memberId: targetMemberId,
        weekKey,
        projectId: projectId || linkedTask?.projectId,
        task: linkedTask,
        assignedById: targetMemberId !== currentUserId ? currentUserId : undefined,
        existingTodos: [...allAdded, ...weeklyTodos],
      });
      allAdded.push(...addedTodos);
      totalSkipped += skippedCount;
    });

    if (allAdded.length === 0) {
      addToast(
        language === 'zh' ? '该周已包含模板全部待办条目' : 'All template items already exist in this week',
        template.name,
        'info'
      );
      return 0;
    }

    setWeeklyTodos((prev) => [...allAdded, ...prev]);
    addToast(
      language === 'zh'
        ? `已一键生成 ${allAdded.length} 条本周待办与验收项`
        : `Generated ${allAdded.length} Weekly To-Do & Acceptance items`,
      totalSkipped > 0
        ? language === 'zh'
          ? `${template.name}（跳过重复 ${totalSkipped} 条）`
          : `${template.name} (${totalSkipped} duplicates skipped)`
        : template.name,
      'success'
    );
    return allAdded.length;
  };

  // Venue Management
  const addVenue = (venue: VenuePreset) => {
    const cleanUrl = normalizeExternalUrl(venue.url);
    setVenues((prev) => [...prev, { ...venue, url: cleanUrl }]);
    addToast(language === 'zh' ? '目标期刊/会议已保存' : 'Target Venue Saved', venue.name, 'success');
  };

  const addVenues = (items: VenuePreset[]): number => {
    if (!Array.isArray(items) || items.length === 0) return 0;
    const existingKeys = new Set(
      venues
        .flatMap((v) => [v.name.toLowerCase(), v.tag.toLowerCase(), v.url?.toLowerCase() || ''])
        .filter(Boolean)
    );
    const fresh = items.filter(
      (item) =>
        !existingKeys.has(item.name.toLowerCase()) &&
        (!item.url || !existingKeys.has(item.url.toLowerCase()))
    );
    if (fresh.length === 0) {
      addToast(
        language === 'zh' ? '未发现新增条目' : 'No New Venues Added',
        language === 'zh' ? '所选条目均已存在' : 'All imported entries already exist',
        'info'
      );
      return 0;
    }
    setVenues((prev) => [
      ...prev,
      ...fresh.map((item) => ({ ...item, url: normalizeExternalUrl(item.url) })),
    ]);
    addToast(
      language === 'zh'
        ? `已导入 ${fresh.length} 个期刊/会议预设`
        : `Imported ${fresh.length} Venue Preset${fresh.length > 1 ? 's' : ''}`,
      '',
      'success'
    );
    return fresh.length;
  };

  const updateVenue = (venueId: string, updates: Partial<VenuePreset>) => {
    setVenues((prev) =>
      prev.map((v) =>
        v.id === venueId
          ? {
              ...v,
              ...updates,
              url: updates.url !== undefined ? normalizeExternalUrl(updates.url) : v.url,
            }
          : v
      )
    );
    addToast(language === 'zh' ? '期刊/会议网址已更新' : 'Venue Updated', '', 'info');
  };

  const deleteVenue = (venueId: string) => {
    setVenues((prev) => prev.filter((v) => v.id !== venueId));
    addToast(language === 'zh' ? '目标会议已删除' : 'Target Venue Removed', '', 'info');
  };

  // Outreach Track Management
  const addOutreachTrack = (trackName: string) => {
    const clean = trackName.trim();
    if (!clean) return;
    setOutreachTracks((prev) =>
      prev.some((item) => item.toLowerCase() === clean.toLowerCase()) ? prev : [...prev, clean]
    );
    addToast(language === 'zh' ? '转化渠道已添加' : 'Outreach Track Added', clean, 'success');
  };

  const removeOutreachTrack = (trackName: string) => {
    const needle = trackName.trim().toLowerCase();
    setOutreachTracks((prev) => prev.filter((item) => item.toLowerCase() !== needle));
    addToast(language === 'zh' ? '预设转化渠道已移除' : 'Outreach Track Removed', trackName, 'info');
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

    if (targetStage === 'PI_REVIEW' && targetStage !== targetTask.stage) {
      triggerExternalNotification({
        type: 'pi_review',
        title: targetTask.title,
        subtitle:
          language === 'zh'
            ? `任务已推进至「导师内部审阅 (PI Review)」`
            : `Task moved to PI Review stage`,
        actorName: currentMember
          ? getMemberDisplayName(currentMember, language, currentMember.id)
          : targetTask.leadAuthor?.nameEn,
        targetName: targetTask.pi
          ? getMemberDisplayName(targetTask.pi, language, targetTask.pi.id)
          : 'PI',
        projectTag: targetTask.projectTag,
        deadline: targetTask.deadline,
        isPrivate: targetTask.visibility === 'PI_ONLY',
      });
    }
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

  const sendDirectRequest = (input: {
    kind: DirectRequestKind;
    title: string;
    content: string;
    recipientId: string;
    visibility: RequestVisibility;
    workCategory?: WorkCategory;
    projectId?: string;
    taskId?: string;
    dueDate?: string;
    notifyChannel?: boolean;
  }): DirectRequest | null => {
    const cleanTitle = input.title.trim();
    const cleanRecipient = input.recipientId.trim();
    if (!cleanTitle || !cleanRecipient || !currentUserId) return null;
    if (!members.some((m) => m.id === cleanRecipient)) return null;

    const now = new Date().toISOString();
    const newReq: DirectRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      kind: input.kind,
      title: cleanTitle,
      content: input.content.trim(),
      senderId: currentUserId,
      recipientId: cleanRecipient,
      visibility: input.visibility === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE',
      status: 'OPEN',
      workCategory: input.workCategory,
      projectId: input.projectId || undefined,
      taskId: input.taskId || undefined,
      dueDate: input.dueDate || undefined,
      replies: [],
      createdAt: now,
      updatedAt: now,
    };

    setDirectRequests((prev) => [newReq, ...prev]);
    const targetMember = members.find((m) => m.id === cleanRecipient);
    const recipientName = targetMember
      ? language === 'zh'
        ? targetMember.nameZh
        : targetMember.nameEn
      : cleanRecipient;
    const linkedProj = newReq.projectId
      ? projects.find((p) => p.id === newReq.projectId)
      : undefined;

    if (newReq.visibility === 'PUBLIC' && input.notifyChannel) {
      triggerExternalNotification({
        type: 'public_request',
        title: newReq.title,
        subtitle:
          language === 'zh'
            ? `${getMemberDisplayName(currentMember, language, currentMember.id)} -> ${recipientName}`
            : `${getMemberDisplayName(currentMember, language, currentMember.id)} -> ${recipientName}`,
        body: newReq.content ? newReq.content.slice(0, 260) : undefined,
        actorName: getMemberDisplayName(currentMember, language, currentMember.id),
        targetName: recipientName,
        projectTag: linkedProj?.tag,
        deadline: newReq.dueDate,
        isPrivate: false,
      });
    }
    addToast(
      language === 'zh' ? '已发起 1对1 申请/交流' : '1-on-1 Request Sent',
      `${recipientName} · ${
        newReq.visibility === 'PRIVATE'
          ? language === 'zh'
            ? '隐私'
            : 'Private'
          : language === 'zh'
          ? '公开'
          : 'Public'
      }`,
      'success'
    );
    return newReq;
  };

  const replyDirectRequest = (requestId: string, content: string) => {
    const clean = content.trim();
    if (!clean || !currentUserId) return;
    const now = new Date().toISOString();
    setDirectRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        return {
          ...req,
          status: req.status === 'RESOLVED' ? 'RESOLVED' : 'REPLIED',
          replies: [
            ...req.replies,
            {
              id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
              authorId: currentUserId,
              content: clean,
              createdAt: now,
            },
          ],
          updatedAt: now,
        };
      })
    );
  };

  const updateDirectRequestStatus = (requestId: string, status: DirectRequestStatus) => {
    const now = new Date().toISOString();
    setDirectRequests((prev) =>
      prev.map((req) => (req.id === requestId ? { ...req, status, updatedAt: now } : req))
    );
  };

  const updateDirectRequestVisibility = (requestId: string, visibility: RequestVisibility) => {
    const target = directRequests.find((r) => r.id === requestId);
    if (!target) return;
    if (target.senderId !== currentUserId && !effectiveIsAdmin) {
      addToast(t.readOnlyNotice, '', 'warning');
      return;
    }
    const now = new Date().toISOString();
    setDirectRequests((prev) =>
      prev.map((req) => (req.id === requestId ? { ...req, visibility, updatedAt: now } : req))
    );
  };

  const deleteDirectRequest = (requestId: string) => {
    const target = directRequests.find((r) => r.id === requestId);
    if (!target) return;
    if (target.senderId !== currentUserId && !effectiveIsAdmin) {
      addToast(t.readOnlyNotice, '', 'warning');
      return;
    }
    setDirectRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const reportBlocker = (
    taskId: string,
    blocker: BlockerInfo,
    requestVisibility: RequestVisibility = 'PRIVATE',
    notifyChannel = false
  ) => {
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

    if (blocker.escalatedToId && members.some((m) => m.id === blocker.escalatedToId)) {
      const now = new Date().toISOString();
      const isZh = language === 'zh';
      const linkedReq: DirectRequest = {
        id: `req-blk-${Date.now()}`,
        kind: 'BLOCKER_HELP',
        title: target
          ? `${isZh ? '[卡点求助]' : '[Blocker Help]'} ${target.title}`
          : blocker.details.slice(0, 48),
        content: `${blocker.details}\n${
          blocker.tried ? `\n${isZh ? '已尝试：' : 'Tried so far: '}${blocker.tried}` : ''
        }`.trim(),
        senderId: currentUserId || target?.leadAuthor?.id || members[0]?.id || '',
        recipientId: blocker.escalatedToId,
        visibility: requestVisibility,
        status: 'OPEN',
        workCategory: target?.workCategory,
        projectId: target?.projectId,
        taskId: target?.id,
        dueDate: target?.deadline,
        replies: [],
        createdAt: now,
        updatedAt: now,
      };
      setDirectRequests((prev) => [linkedReq, ...prev]);
    }

    if (requestVisibility === 'PUBLIC' && notifyChannel && target?.visibility !== 'PI_ONLY') {
      triggerExternalNotification({
        type: 'blocker',
        title: target?.title || 'Task Blocker Reported',
        subtitle:
          language === 'zh'
            ? `卡点已升级给 ${blocker.escalatedTo}`
            : `Blocker escalated to ${blocker.escalatedTo}`,
        body: blocker.details.slice(0, 260),
        actorName: currentMember
          ? getMemberDisplayName(currentMember, language, currentMember.id)
          : target?.leadAuthor?.nameEn,
        targetName: blocker.escalatedTo,
        projectTag: target?.projectTag,
        deadline: target?.deadline,
        isPrivate: false,
      });
    }

    addToast(
      language === 'zh' ? '已发送 1对1 卡点求助' : '1-on-1 Blocker Request Sent',
      `${blocker.escalatedTo}`,
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
      directRequests,
      allowPeerAcceptance,
      outreachTracks,
      checklistTemplates,
      notificationSettings,
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
      if (data.tasks) {
        setTasks(
          data.tasks.map((t: TaskItem) => ({
            ...t,
            targetVenueUrl: normalizeExternalUrl(t.targetVenueUrl),
            assets: sanitizeAssetLinks(t.assets),
          }))
        );
      }
      if (data.projects) setProjects(sanitizeProjects(data.projects));
      if (Array.isArray(data.members) && data.members.length > 0) {
        setMembers(data.members);
        const stillExists = data.members.some((m: LabMember) => m.id === currentUserId);
        if (!stillExists) {
          const fallbackUser =
            data.members.find((m: LabMember) => m.accessRole === 'SYS_ADMIN') ||
            data.members.find((m: LabMember) => m.accessRole !== 'ADMIN_PI') ||
            data.members[0];
          if (fallbackUser) {
            setCurrentUserId(fallbackUser.id);
            setIsAuthenticatedSession(true);
            setViewMode(resolveMemberDefaultView(fallbackUser));
          }
        }
      }
      if (data.venues) {
        setVenues(
          data.venues.map((v: VenuePreset) => ({
            ...v,
            url: normalizeExternalUrl(v.url),
          }))
        );
      }
      if (data.resources) setResources(data.resources);
      if (Array.isArray(data.weeklyTodos)) {
        setWeeklyTodos(sanitizeWeeklyTodos(data.weeklyTodos));
      }
      if (Array.isArray(data.directRequests)) {
        setDirectRequests(sanitizeDirectRequests(data.directRequests));
      }
      if (typeof data.allowPeerAcceptance === 'boolean') {
        setAllowPeerAcceptance(data.allowPeerAcceptance);
      }
      if (Array.isArray(data.outreachTracks)) {
        setOutreachTracks(sanitizeOutreachTracks(data.outreachTracks));
      }
      if (Array.isArray(data.checklistTemplates)) {
        setChecklistTemplates(sanitizeChecklistTemplates(data.checklistTemplates));
      }
      if (data.notificationSettings && typeof data.notificationSettings === 'object') {
        setNotificationSettings(sanitizeNotificationSettings(data.notificationSettings));
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
    return buildWeeklyDigestMarkdown({ member: userMember, tasks: localizedView.tasks, language });
  };

  const resetToMockData = () => {
    const applyReset = () => {
      const localizedDemo = localizeWorkspaceCollections(
        {
          projects: INITIAL_PROJECTS,
          tasks: INITIAL_TASKS,
          weeklyTodos: createInitialWeeklyTodos(),
          directRequests: createInitialDirectRequests(),
          checklistTemplates: getDefaultChecklistTemplates(language),
        },
        language
      );
      setTasks(localizedDemo.tasks);
      setProjects(localizedDemo.projects);
      setResources(INITIAL_RESOURCES);
      setStages(DEFAULT_STAGES);
      setMembers(LAB_MEMBERS);
      setVenues(DEFAULT_VENUES);
      setWeeklyTodos(localizedDemo.weeklyTodos);
      setDirectRequests(localizedDemo.directRequests);
      setAllowPeerAcceptance(false);
      setOutreachTracks([...DEFAULT_OUTREACH_TRACKS]);
      setChecklistTemplates(localizedDemo.checklistTemplates);
      setWorkspaceScope('MINE');
      setWorkCategoryFilter('ALL');
      setSelectedWorkshopFilter('ALL');
      setSelectedWorkshopFilter('ALL');
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
      const isZh = language === 'zh';
      const initialUser: LabMember = {
        id: 'member-me',
        nameEn: 'Researcher 1',
        nameZh: isZh ? '研究员 1' : 'Researcher 1',
        role: 'PI',
        accessRole: 'ADMIN_PI',
        titleEn: 'Principal Investigator',
        titleZh: '课题组长 (PI)',
        avatar: generateInitialsAvatar(isZh ? '研究员 1' : 'Researcher 1', 'member-me'),
        email: 'pi@lab.edu',
      };
      setTasks([]);
      setProjects([]);
      setResources([]);
      setWeeklyTodos([]);
      setDirectRequests([]);
      setMembers([initialUser]);
      setCurrentUserId('member-me');
      setIsAuthenticatedSession(true);
      setWorkspaceScope('MINE');
      setWorkCategoryFilter('ALL');
      setSelectedWorkshopFilter('ALL');
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
        setLanguage: handleSetLanguage,
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
        addVenues,
        updateVenue,
        deleteVenue,
        outreachTracks,
        addOutreachTrack,
        removeOutreachTrack,
        members,
        currentUserId,
        setCurrentUserId: handleSetCurrentUserId,
        isHydrated,
        isAuthenticatedSession,
        loginAsMember,
        logoutMember,
        preferredViews,
        defaultView,
        updateMyViewPreferences,
        updateMyPin,
        addMember,
        updateMember,
        deleteMember,
        mergeDuplicateMember,
        tasks: visibleTasks,
        allTasksCount: tasks.length,
        projects: visibleProjects,
        resources,
        weeklyTodos: localizedView.weeklyTodos,
        directRequests: visibleDirectRequests,
        pendingRequestsForMeCount,
        allowPeerAcceptance,
        checklistTemplates: localizedView.checklistTemplates,
        notificationSettings,
        updateNotificationSettings,
        desktopNotificationsEnabled,
        desktopNotificationPermission,
        toggleDesktopNotifications,
        sendTestDesktopNotification,
        addProject,
        updateProject,
        deleteProject,
        sendDirectRequest,
        replyDirectRequest,
        updateDirectRequestStatus,
        updateDirectRequestVisibility,
        deleteDirectRequest,
        canAssignWeeklyTodo,
        addWeeklyTodo,
        assignWeeklyTodos,
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
