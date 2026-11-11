export type Language = 'zh' | 'en';

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

export interface LabMember {
  id: string;
  nameEn: string;
  nameZh: string;
  role: 'PI' | 'POSTDOC' | 'SENIOR_PHD' | 'PHD_CANDIDATE' | 'RA' | 'VISITING_SCHOLAR';
  titleEn: string;
  titleZh: string;
  avatar: string;
  email: string;
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
  isBlocked: boolean;
  blocker?: BlockerInfo;
  order: number;
  tags?: string[];
  checklist?: { id: string; text: string; done: boolean }[];
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  abstract?: string;
  targetVenue: string;
  tag: string;
  submissionDeadline?: string;
  status: AcademicStage;
  leadAuthorId: string;
  piId: string;
  assets: AssetLinks;
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
  targetVenue: string;
  deadlineDate: string;
  leadAuthorId: string;
  tag: string;
  overleafUrl?: string;
  githubUrl?: string;
  datasetUrl?: string;
  zoteroUrl?: string;
  notes?: string;
  customMilestones?: MilestoneTemplate[];
}
