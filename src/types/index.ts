export type Language = 'zh' | 'en';

export type AccentColor =
  | 'purdue'
  | 'oxford'
  | 'cardinal'
  | 'cambridge'
  | 'crimson'
  | 'indigo'
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
export type ViewMode = 'kanban' | 'gantt' | 'architecture' | 'todos' | 'meeting';
export type SettingsTab = 'appearance' | 'members' | 'resources' | 'stages' | 'venues' | 'backup';

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
}

export interface AssetLinks {
  overleaf?: string;
  github?: string;
  dataset?: string;
  zotero?: string;
}

export interface BlockerInfo {
  category: BlockerCategory;
  details: string;
  tried: string;
  escalatedTo: string;
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
  stage: AcademicStage;
  projectId: string;
  projectTag: string; // e.g. "AAAI 2027", "AEPP"
  targetVenue: string;
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

export interface ProjectItem {
  id: string;
  title: string;
  abstract?: string;
  category?: string;
  categoryColor?: string;
  memberIds?: string[];
  targetVenue: string;
  tag: string;
  submissionDeadline?: string;
  status: AcademicStage;
  leadAuthorId: string;
  piId: string;
  assets: AssetLinks;
  visibility?: VisibilityLevel;
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
  defaultLeadId: string;
  milestones: MilestoneTemplate[];
}

export interface ReverseDDLForm {
  title: string;
  category?: string;
  targetVenue: string;
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

export type StorageMode = 'postgres' | 'local-file' | 'browser-local';

export interface LabWorkspaceData {
  stages: StageConfig[];
  tasks: TaskItem[];
  projects: ProjectItem[];
  members: LabMember[];
  venues: VenuePreset[];
  resources: LabResource[];
  weeklyTodos?: WeeklyTodoItem[];
  allowPeerAcceptance?: boolean;
  checklistTemplates?: ChecklistAcceptanceTemplate[];
}
