export type Language = 'zh' | 'en';

export type AccentColor =
  | 'indigo'
  | 'obsidian-gold'
  | 'purdue'
  | 'boilermaker'
  | 'steel'
  | 'oxford'
  | 'cardinal'
  | 'cambridge'
  | 'crimson'
  | 'cyan'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'violet'
  | string;
export type BgTheme = 'default' | 'oled' | 'warm';
export type FontSize = 'compact' | 'standard' | 'large';
export type EnglishFontPreset =
  | 'times'
  | 'georgia'
  | 'palatino'
  | 'garamond'
  | 'baskerville'
  | 'cambria'
  | 'geist'
  | 'inter'
  | 'helvetica'
  | 'system-sans'
  | 'jetbrains'
  | 'fira-code'
  | 'custom';
export type ChineseFontPreset =
  | 'yahei-pingfang'
  | 'youyuan'
  | 'songti'
  | 'zhongsong'
  | 'kaiti'
  | 'lxgw-wenkai'
  | 'fangsong'
  | 'heiti'
  | 'lishu'
  | 'xingkai'
  | 'dengxian'
  | 'system-zh'
  | 'custom';
export type ViewMode = 'kanban' | 'gantt' | 'architecture' | 'todos' | 'requests' | 'meeting';
export type SettingsTab =
  | 'appearance'
  | 'members'
  | 'resources'
  | 'stages'
  | 'venues'
  | 'notifications'
  | 'backup';

export type WorkspaceScope = 'MINE' | 'PUBLIC_LAB';

export type WorkCategory = 'PAPER' | 'VERTICAL_PROJECT' | 'HORIZONTAL_PROJECT';

export type AcademicStage = string;

export interface StageConfig {
  id: string;
  labelEn: string;
  labelZh: string;
  subTitleEn?: string;
  subTitleZh?: string;
  color: string;
  badgeBg: string;
  borderColor: string;
}

export type BlockerCategory =
  | 'DATA_DEFICIT'
  | 'ALGO_CONVERGENCE'
  | 'MATH_DERIVATION'
  | 'COMPUTE_SHORTAGE'
  | 'WAITING_REVIEW'
  | 'REPLICATION_GAP'
  | 'OTHER';

export interface BlockerCategoryMeta {
  id: BlockerCategory;
  labelEn: string;
  labelZh: string;
  color: string;
  bgColor: string;
  descriptionEn: string;
  descriptionZh: string;
}

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type AccessRole =
  | 'ADMIN_PI'
  | 'SYS_ADMIN'
  | 'PROJECT_LEAD'
  | 'STUDENT_RA'
  | 'AUDITOR_GUEST';

export type VisibilityLevel = 'PUBLIC' | 'TEAM_ONLY' | 'PI_ONLY';

export interface LabMember {
  id: string;
  nameEn: string;
  nameZh: string;
  role: 'PI' | 'POSTDOC' | 'SENIOR_PHD' | 'PHD_CANDIDATE' | 'RA' | 'VISITING_SCHOLAR';
  accessRole?: AccessRole;
  titleEn: string;
  titleZh: string;
  avatar: string;
  email: string;
  pin?: string;
  preferredViews?: ViewMode[];
  defaultView?: ViewMode;
}

export interface CustomAssetLink {
  id: string;
  label: string;
  url: string;
}

export interface AssetLinks {
  overleaf?: string;
  github?: string;
  dataset?: string;
  zotero?: string;
  customLinks?: CustomAssetLink[];
}

export interface BlockerInfo {
  category: BlockerCategory;
  details: string;
  tried: string;
  escalatedTo: string;
  escalatedToId?: string;
  reportedAt: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface ChecklistTemplateEntry {
  text: string;
  acceptanceCriteria?: string;
  priority?: Priority;
}

export interface ChecklistAcceptanceTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  items: ChecklistTemplateEntry[];
  createdAt: string;
  updatedAt: string;
}

export type TaskLogicNodeType =
  | 'goal'
  | 'hypothesis'
  | 'method'
  | 'experiment'
  | 'validation'
  | 'milestone';

export type TaskLogicNodeStatus = 'todo' | 'doing' | 'done' | 'blocked';

export interface TaskLogicNode {
  id: string;
  label: string;
  nodeType: TaskLogicNodeType;
  status: TaskLogicNodeStatus;
  note?: string;
  assigneeId?: string;
  linkedChecklistId?: string;
  collapsed?: boolean;
  children: TaskLogicNode[];
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  workCategory?: WorkCategory;
  partnerOrg?: string;
  milestoneNode?: string;
  stage: AcademicStage;
  projectId: string;
  projectTag: string; // e.g. "NeurIPS '27", "Nature Comms", "Mgt Sci"
  targetVenue: string;
  targetVenueUrl?: string;
  startDate?: string; // ISO date string e.g. "2026-10-01"
  deadline: string; // ISO date string e.g. "2026-12-15"
  progress?: number; // 0 - 100%
  leadAuthor: LabMember;
  pi: LabMember;
  priority: Priority;
  assets: AssetLinks;
  visibility?: VisibilityLevel;
  isBlocked: boolean;
  blocker?: BlockerInfo;
  order: number;
  tags?: string[];
  checklist?: ChecklistItem[];
  logicTree?: TaskLogicNode;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProjectHandoffStatus = 'HANDED_OFF' | 'ACTIVE' | 'CO_LEAD';

export interface ProjectHandoffEntry {
  id: string;
  term: string;
  memberId?: string;
  memberName: string;
  roleLabel?: string;
  phaseSummary?: string;
  status: ProjectHandoffStatus;
}

export type ProjectInheritanceType = 'CONTINUATION' | 'SPINOFF' | 'METHOD_OR_DATA';

export interface ProjectInheritanceLink {
  id: string;
  parentProjectId: string;
  relationType: ProjectInheritanceType;
  fromTerm?: string;
  toTerm?: string;
  note?: string;
}

export type WorkshopTranslationStatus =
  | 'NOT_STARTED'
  | 'IN_PREP'
  | 'WORKSHOP_READY'
  | 'PRESENTED';

export type OutreachStatus = WorkshopTranslationStatus;

export interface ProjectItem {
  id: string;
  title: string;
  abstract?: string;
  researchQuestion?: string;
  sharedDataset?: string;
  handoffHistory?: ProjectHandoffEntry[];
  inheritedFrom?: ProjectInheritanceLink[];
  workCategory?: WorkCategory;
  partnerOrg?: string;
  milestoneNode?: string;
  workshopPrograms?: string[];
  workshopTranslationStatus?: WorkshopTranslationStatus;
  workshopTargetDate?: string;
  category?: string;
  categoryColor?: string;
  memberIds?: string[];
  targetVenue: string;
  targetVenueUrl?: string;
  tag: string;
  submissionDeadline?: string;
  status: AcademicStage;
  leadAuthorId: string;
  piId: string;
  assets: AssetLinks;
  visibility?: VisibilityLevel;
}

export type DirectRequestKind =
  | 'REVIEW'
  | 'BLOCKER_HELP'
  | 'RESOURCE'
  | 'PROJECT_SYNC'
  | 'CHAT';

export type RequestVisibility = 'PRIVATE' | 'PUBLIC';

export type DirectRequestStatus = 'OPEN' | 'REPLIED' | 'RESOLVED';

export interface DirectRequestReply {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface DirectRequest {
  id: string;
  kind: DirectRequestKind;
  title: string;
  content: string;
  senderId: string;
  recipientId: string;
  visibility: RequestVisibility;
  status: DirectRequestStatus;
  workCategory?: WorkCategory;
  projectId?: string;
  taskId?: string;
  dueDate?: string;
  replies: DirectRequestReply[];
  createdAt: string;
  updatedAt: string;
}

export type WeeklyTodoAcceptanceStatus =
  | 'PENDING'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'REVISION_REQUESTED';

export interface WeeklyTodoItem {
  id: string;
  memberId: string;
  weekKey: string; // Monday ISO date e.g. "2026-11-09"
  title: string;
  done: boolean;
  priority?: Priority;
  projectId?: string;
  taskId?: string;
  checklistItemId?: string;
  acceptanceCriteria?: string;
  acceptanceStatus: WeeklyTodoAcceptanceStatus;
  assignedById?: string;
  acceptedById?: string;
  acceptedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ResourceType = 'GPU' | 'SERVER' | 'CLUSTER' | 'EQUIPMENT';
export type ResourceStatus = 'IDLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';

export interface LabResource {
  id: string;
  nameEn: string;
  nameZh: string;
  type: ResourceType;
  specs: string;
  status: ResourceStatus;
  currentUser?: string;
  currentJob?: string;
  remainingHours?: number;
  vramUtilPercent?: number;
  updatedAt?: string;
}

export interface MilestoneTemplate {
  nameEn: string;
  nameZh: string;
  offsetDays: number; // e.g. 45 -> T - 45 days
  stageId: string;
}

export interface VenuePreset {
  id: string;
  name: string;
  tag: string;
  url?: string;
  defaultLeadId: string;
  milestones: MilestoneTemplate[];
}

export interface ReverseDDLForm {
  title: string;
  workCategory?: WorkCategory;
  partnerOrg?: string;
  milestoneNode?: string;
  category?: string;
  targetVenue: string;
  targetVenueUrl?: string;
  deadlineDate: string;
  leadAuthorId: string;
  tag: string;
  visibility?: VisibilityLevel;
  overleafUrl?: string;
  githubUrl?: string;
  datasetUrl?: string;
  zoteroUrl?: string;
  notes?: string;
  customMilestones?: MilestoneTemplate[];
}

export interface NotificationSettings {
  /** Master on/off toggle for all external channels (Teams/Slack/Email) and scheduled digests */
  enabled: boolean;
  teams: {
    enabled: boolean;
    notifyOnBlocker: boolean;
    notifyOnPiReview: boolean;
    notifyOnPublicRequest: boolean;
    notifyOnDigest: boolean;
  };
  slack: {
    enabled: boolean;
    notifyOnBlocker: boolean;
    notifyOnPiReview: boolean;
    notifyOnPublicRequest: boolean;
    notifyOnDigest: boolean;
  };
  digest: {
    enabled: boolean;
    emailEnabled: boolean;
    deadlineWindowHours: number;
    includePiReview: boolean;
    includeBlockers: boolean;
    includeOpenRequests: boolean;
    recipientRoles: Array<'PI' | 'SYS_ADMIN' | 'PROJECT_LEAD'>;
  };
}

export type NotificationEventKind = 'blocker' | 'pi_review' | 'public_request' | 'test';

export type StorageMode = 'postgres' | 'local-file' | 'browser-local';

export interface LabWorkspaceData {
  stages: StageConfig[];
  tasks: TaskItem[];
  projects: ProjectItem[];
  members: LabMember[];
  venues: VenuePreset[];
  resources: LabResource[];
  weeklyTodos?: WeeklyTodoItem[];
  directRequests?: DirectRequest[];
  allowPeerAcceptance?: boolean;
  outreachTracks?: string[];
  checklistTemplates?: ChecklistAcceptanceTemplate[];
  notificationSettings?: NotificationSettings;
}
