'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AcademicStage,
  BlockerInfo,
  LabMember,
  LabResource,
  Language,
  ProjectItem,
  ReverseDDLForm,
  StageConfig,
  TaskItem,
  VenuePreset,
  AccentColor,
  BgTheme,
  FontSize,
  SettingsTab,
} from '@/types';
import {
  DEFAULT_STAGES,
  DEFAULT_VENUES,
  INITIAL_PROJECTS,
  INITIAL_RESOURCES,
  INITIAL_TASKS,
  LAB_MEMBERS,
} from '@/data/mockData';
import { en, LocaleTranslations } from '@/locales/en';
import { zh } from '@/locales/zh';
import { subtractDays, formatDate } from '@/utils/date';
import { triggerConfetti } from '@/utils/confetti';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'warning' | 'info' | 'error';
}

interface LabFlowContextType {
  // Locale & Translation
  language: Language;
  setLanguage: (lang: Language) => void;
  t: LocaleTranslations;

  // Stages
  stages: StageConfig[];
  addStage: (stage: StageConfig) => void;
  updateStage: (stageId: string, updates: Partial<StageConfig>) => void;
  deleteStage: (stageId: string) => void;
  restoreDefaultStages: () => void;
  isStageSettingsOpen: boolean;
  setIsStageSettingsOpen: (open: boolean) => void;

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
  isMemberManagerOpen: boolean;
  setIsMemberManagerOpen: (open: boolean) => void;

  // Core Data
  tasks: TaskItem[];
  projects: ProjectItem[];
  resources: LabResource[];

  // View & Filters
  filterOnlyBlockers: boolean;
  searchQuery: string;
  filterMemberId: string;
  selectedStageFilter: string; // 'all' or specific stageId
  setSelectedStageFilter: (val: string) => void;
  selectedProjectFilter: string; // 'all' or specific projectId
  setSelectedProjectFilter: (val: string) => void;
  sortByDDLUrgency: boolean;
  setSortByDDLUrgency: (val: boolean) => void;
  viewMode: 'kanban' | 'gantt' | 'meeting';
  theme: 'dark' | 'light';
  accentColor: AccentColor;
  setAccentColor: (val: AccentColor) => void;
  bgStyle: BgTheme;
  setBgStyle: (val: BgTheme) => void;
  fontSize: FontSize;
  setFontSize: (val: FontSize) => void;
  enableComputeStrip: boolean;
  setEnableComputeStrip: (val: boolean) => void;

  // Settings Modal Center
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  activeSettingsTab: SettingsTab;
  setActiveSettingsTab: (tab: SettingsTab) => void;

  // Modals
  activeBlockerTask: TaskItem | null;
  isReverseDDLOpen: boolean;
  isNewTaskOpen: boolean;
  isResourceModalOpen: boolean;
  selectedTask: TaskItem | null;
  toasts: ToastItem[];

  // Setters
  setFilterOnlyBlockers: (val: boolean) => void;
  setSearchQuery: (val: string) => void;
  setFilterMemberId: (val: string) => void;
  setViewMode: (val: 'kanban' | 'gantt' | 'meeting') => void;
  setTheme: (val: 'dark' | 'light') => void;
  setActiveBlockerTask: (task: TaskItem | null) => void;
  setIsReverseDDLOpen: (open: boolean) => void;
  setIsNewTaskOpen: (open: boolean) => void;
  setIsResourceModalOpen: (open: boolean) => void;
  setSelectedTask: (task: TaskItem | null) => void;

  // Actions
  moveTask: (taskId: string, targetStage: AcademicStage, newOrder?: number) => void;
  reorderTasks: (stage: AcademicStage, sourceIndex: number, destinationIndex: number) => void;
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
  addToast: (title: string, description?: string, type?: ToastItem['type']) => void;
  removeToast: (id: string) => void;
}

const LabFlowContext = createContext<LabFlowContextType | undefined>(undefined);

const STORAGE_KEYS = {
  LANG: 'labflow_lang_v3',
  STAGES: 'labflow_stages_v3',
  TASKS: 'labflow_tasks_v3',
  PROJECTS: 'labflow_projects_v3',
  MEMBERS: 'labflow_members_v3',
  VENUES: 'labflow_venues_v3',
  CURRENT_USER: 'labflow_current_user_v3',
  RESOURCES: 'labflow_resources_v3',
  THEME: 'labflow_theme_v3',
  ACCENT: 'labflow_accent_v3',
  BG_STYLE: 'labflow_bg_style_v3',
  FONT_SIZE: 'labflow_font_size_v3',
  ENABLE_COMPUTE: 'labflow_enable_compute_v3',
};

export const LabFlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('zh');
  const [stages, setStages] = useState<StageConfig[]>(DEFAULT_STAGES);
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [projects, setProjects] = useState<ProjectItem[]>(INITIAL_PROJECTS);
  const [members, setMembers] = useState<LabMember[]>(LAB_MEMBERS);
  const [venues, setVenues] = useState<VenuePreset[]>(DEFAULT_VENUES);
  const [currentUserId, setCurrentUserId] = useState<string>('member-student1');
  const [resources, setResources] = useState<LabResource[]>(INITIAL_RESOURCES);

  const [filterOnlyBlockers, setFilterOnlyBlockers] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMemberId, setFilterMemberId] = useState<string>('all');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('all');
  const [sortByDDLUrgency, setSortByDDLUrgency] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'gantt' | 'meeting'>('kanban');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [accentColor, setAccentColor] = useState<AccentColor>('indigo');
  const [bgStyle, setBgStyle] = useState<BgTheme>('default');
  const [fontSize, setFontSize] = useState<FontSize>('standard');
  const [enableComputeStrip, setEnableComputeStrip] = useState<boolean>(true);

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab>('appearance');

  const [activeBlockerTask, setActiveBlockerTask] = useState<TaskItem | null>(null);
  const [isReverseDDLOpen, setIsReverseDDLOpen] = useState<boolean>(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState<boolean>(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState<boolean>(false);
  const [isStageSettingsOpen, setIsStageSettingsOpen] = useState<boolean>(false);
  const [isMemberManagerOpen, setIsMemberManagerOpen] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const t = language === 'zh' ? zh : en;

  // Load from localStorage
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem(STORAGE_KEYS.LANG) as Language;
      const savedStages = localStorage.getItem(STORAGE_KEYS.STAGES);
      const savedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
      const savedProjects = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      const savedMembers = localStorage.getItem(STORAGE_KEYS.MEMBERS);
      const savedVenues = localStorage.getItem(STORAGE_KEYS.VENUES);
      const savedCurrentUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      const savedResources = localStorage.getItem(STORAGE_KEYS.RESOURCES);
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) as 'dark' | 'light';
      const savedAccent = localStorage.getItem(STORAGE_KEYS.ACCENT) as AccentColor;
      const savedBgStyle = localStorage.getItem(STORAGE_KEYS.BG_STYLE) as BgTheme;
      const savedFontSize = localStorage.getItem(STORAGE_KEYS.FONT_SIZE) as FontSize;
      const savedCompute = localStorage.getItem(STORAGE_KEYS.ENABLE_COMPUTE);

      if (savedLang) setLanguage(savedLang);
      if (savedStages) setStages(JSON.parse(savedStages));
      if (savedTasks) setTasks(JSON.parse(savedTasks));
      if (savedProjects) setProjects(JSON.parse(savedProjects));
      if (savedMembers) setMembers(JSON.parse(savedMembers));
      if (savedVenues) setVenues(JSON.parse(savedVenues));
      if (savedCurrentUser) setCurrentUserId(savedCurrentUser);
      if (savedResources) setResources(JSON.parse(savedResources));
      if (savedTheme) setTheme(savedTheme);
      if (savedAccent) setAccentColor(savedAccent);
      if (savedBgStyle) setBgStyle(savedBgStyle);
      if (savedFontSize) setFontSize(savedFontSize);
      if (savedCompute !== null) setEnableComputeStrip(savedCompute === 'true');
    } catch (e) {
      console.warn('Could not read from localStorage', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(STORAGE_KEYS.LANG, language);
      localStorage.setItem(STORAGE_KEYS.STAGES, JSON.stringify(stages));
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
      localStorage.setItem(STORAGE_KEYS.VENUES, JSON.stringify(venues));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, currentUserId);
      localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(resources));
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
      localStorage.setItem(STORAGE_KEYS.ACCENT, accentColor);
      localStorage.setItem(STORAGE_KEYS.BG_STYLE, bgStyle);
      localStorage.setItem(STORAGE_KEYS.FONT_SIZE, fontSize);
      localStorage.setItem(STORAGE_KEYS.ENABLE_COMPUTE, enableComputeStrip ? 'true' : 'false');
    } catch (e) {
      console.warn('Could not write to localStorage', e);
    }
  }, [language, stages, tasks, projects, members, venues, currentUserId, resources, theme, accentColor, bgStyle, fontSize, enableComputeStrip, isInitialized]);

  // Apply dark/light classes to <html>
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [theme]);

  // Apply accent color, background tone, and font size attributes to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accentColor);
  }, [accentColor]);

  useEffect(() => {
    document.documentElement.setAttribute('data-bg', bgStyle);
  }, [bgStyle]);

  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize);
  }, [fontSize]);

  const addToast = (
    title: string,
    description?: string,
    type: ToastItem['type'] = 'info'
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  };

  // Member Management
  const addMember = (member: LabMember) => {
    setMembers((prev) => [...prev, member]);
    addToast(language === 'zh' ? '成员已添加' : 'Member Added', member.nameZh || member.nameEn, 'success');
  };

  const updateMember = (id: string, updates: Partial<LabMember>) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
    addToast(language === 'zh' ? '成员资料已更新' : 'Member Updated', '', 'info');
  };

  const deleteMember = (id: string) => {
    if (members.length <= 1) {
      addToast(language === 'zh' ? '无法删除' : 'Cannot delete', language === 'zh' ? '至少保留一位成员' : 'Keep at least 1 member', 'error');
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== id));
    if (currentUserId === id) {
      setCurrentUserId(members[0].id);
    }
    addToast(language === 'zh' ? '成员已移除' : 'Member Removed', '', 'info');
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

  // Stage customization handlers
  const addStage = (stage: StageConfig) => {
    setStages((prev) => [...prev, stage]);
    addToast(language === 'zh' ? '阶段已添加' : 'Stage Added', stage.labelZh || stage.labelEn, 'success');
  };

  const updateStage = (stageId: string, updates: Partial<StageConfig>) => {
    setStages((prev) =>
      prev.map((s) => (s.id === stageId ? { ...s, ...updates } : s))
    );
    addToast(language === 'zh' ? '阶段已更新' : 'Stage Updated', '', 'info');
  };

  const deleteStage = (stageId: string) => {
    if (stages.length <= 1) {
      addToast(language === 'zh' ? '无法删除' : 'Cannot delete', language === 'zh' ? '至少保留一个阶段' : 'Must keep at least 1 stage', 'error');
      return;
    }
    const remainingStages = stages.filter((s) => s.id !== stageId);
    const fallbackStageId = remainingStages[0].id;

    setTasks((prev) =>
      prev.map((task) =>
        task.stage === stageId ? { ...task, stage: fallbackStageId } : task
      )
    );
    setStages(remainingStages);
    addToast(language === 'zh' ? '阶段已移除' : 'Stage Removed', language === 'zh' ? '任务已自动移至第一阶段' : 'Tasks migrated to first stage', 'info');
  };

  const restoreDefaultStages = () => {
    setStages(DEFAULT_STAGES);
    addToast(language === 'zh' ? '已重置默认阶段' : 'Default Stages Restored', '', 'success');
  };

  const moveTask = (taskId: string, targetStage: AcademicStage, newOrder?: number) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    if (targetStage === 'ACCEPTED' && targetTask.stage !== 'ACCEPTED') {
      triggerConfetti();
      addToast(
        language === 'zh' ? '🎉 成果录用归档！' : '🎉 Milestone Accepted & Archived!',
        `"${targetTask.title.slice(0, 36)}..."`,
        'success'
      );
    }

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            stage: targetStage,
            order: newOrder !== undefined ? newOrder : t.order,
            completedAt: targetStage === 'ACCEPTED' ? new Date().toISOString() : t.completedAt,
            progress: targetStage === 'ACCEPTED' ? 100 : t.progress,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      })
    );
  };

  const reorderTasks = (stage: AcademicStage, sourceIndex: number, destinationIndex: number) => {
    setTasks((prev) => {
      const stageTasks = prev.filter((t) => t.stage === stage).sort((a, b) => a.order - b.order);
      const otherTasks = prev.filter((t) => t.stage !== stage);

      const [moved] = stageTasks.splice(sourceIndex, 1);
      stageTasks.splice(destinationIndex, 0, moved);

      const updatedStageTasks = stageTasks.map((t, index) => ({
        ...t,
        order: index,
        updatedAt: new Date().toISOString(),
      }));

      return [...otherTasks, ...updatedStageTasks];
    });
  };

  const reportBlocker = (taskId: string, blocker: BlockerInfo) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            isBlocked: true,
            blocker,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      })
    );
    addToast(
      language === 'zh' ? '🚨 技术卡点已标记' : '🚨 Blocker Logged & Escalated',
      `${blocker.escalatedTo} (${blocker.category})`,
      'warning'
    );
  };

  const resolveBlocker = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            isBlocked: false,
            blocker: undefined,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      })
    );
    triggerConfetti();
    addToast(
      language === 'zh' ? '✨ 卡点已解除' : '✨ Blocker Resolved',
      language === 'zh' ? '该任务已恢复推进状态' : 'Task unblocked and resumed',
      'success'
    );
  };

  const addTask = (taskData: Omit<TaskItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: TaskItem = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
    addToast(language === 'zh' ? '任务已创建' : 'Task Created', newTask.title.slice(0, 30), 'success');
  };

  const updateTask = (taskId: string, updates: Partial<TaskItem>) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      })
    );
    if (selectedTask?.id === taskId) {
      setSelectedTask((prev) => (prev ? { ...prev, ...updates } : null));
    }
    addToast(language === 'zh' ? '修改已保存' : 'Task Updated', '', 'info');
  };

  const updateTaskProgress = (taskId: string, progress: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, progress, updatedAt: new Date().toISOString() } : t))
    );
  };

  const updateTaskDates = (taskId: string, startDate?: string, deadline?: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            startDate: startDate || t.startDate,
            deadline: deadline || t.deadline,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      })
    );
    addToast(language === 'zh' ? '排期已调整' : 'Schedule Adjusted', '', 'info');
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
    }
    addToast(language === 'zh' ? '任务已删除' : 'Task Deleted', '', 'info');
  };

  // Reverse DDL generation with custom milestones
  const generateReverseDDLPipeline = (plan: ReverseDDLForm) => {
    const lead = members.find((m) => m.id === plan.leadAuthorId) || members[2];
    const pi = members[0];

    const projectId = `proj-${Date.now()}`;
    const newProject: ProjectItem = {
      id: projectId,
      title: plan.title,
      targetVenue: plan.targetVenue,
      tag: plan.tag || plan.targetVenue.split(' ')[0] || 'Paper',
      submissionDeadline: plan.deadlineDate,
      status: stages[1]?.id || 'DATA_EXP',
      leadAuthorId: lead.id,
      piId: pi.id,
      assets: {
        overleaf: plan.overleafUrl,
        github: plan.githubUrl,
        dataset: plan.datasetUrl,
        zotero: plan.zoteroUrl,
      },
    };

    setProjects((prev) => [newProject, ...prev]);

    // Use custom milestones if provided, otherwise default 4
    const steps = plan.customMilestones && plan.customMilestones.length > 0
      ? plan.customMilestones
      : [
          { nameEn: 'Baseline & Empirical Freeze', nameZh: '基线锁定与实验评测冻结', offsetDays: 45, stageId: stages[1]?.id || 'DATA_EXP' },
          { nameEn: 'Full Manuscript Draft Ready', nameZh: '完整学术论文初稿就绪', offsetDays: 30, stageId: stages[2]?.id || 'DRAFTING' },
          { nameEn: 'Submit to Advisor for Review', nameZh: '提交导师进行全篇审阅', offsetDays: 14, stageId: stages[3]?.id || 'PI_REVIEW' },
          { nameEn: 'Camera & Formatting Check', nameZh: '格式排版与匿名复核', offsetDays: 3, stageId: stages[3]?.id || 'PI_REVIEW' },
        ];

    const ddl = plan.deadlineDate;
    const generatedTasks: TaskItem[] = steps.map((step, idx) => {
      const stepDeadline = subtractDays(ddl, step.offsetDays);
      const stepStart = subtractDays(stepDeadline, 14);

      return {
        id: `task-${Date.now()}-${idx + 1}`,
        title: `[T-${step.offsetDays}d] ${language === 'zh' ? step.nameZh : step.nameEn}: ${plan.title}`,
        description: `${plan.targetVenue} milestone planned ${step.offsetDays} days prior to submission.`,
        stage: step.stageId,
        projectId,
        projectTag: newProject.tag,
        targetVenue: plan.targetVenue,
        startDate: stepStart,
        deadline: stepDeadline,
        progress: idx === 0 ? 30 : 0,
        leadAuthor: lead,
        pi,
        priority: step.offsetDays <= 7 ? 'URGENT' : 'HIGH',
        assets: newProject.assets,
        isBlocked: false,
        order: idx,
        tags: [newProject.tag, `T-${step.offsetDays}d`],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    setTasks((prev) => [...generatedTasks, ...prev]);
    triggerConfetti();
    addToast(
      language === 'zh' ? '⚡ 倒排期里程碑已生成' : '⚡ Reverse Pipeline Generated',
      `${plan.targetVenue} (${plan.deadlineDate})`,
      'success'
    );
  };

  const claimResource = (
    resourceId: string,
    currentUser: string,
    currentJob: string,
    hours: number
  ) => {
    setResources((prev) =>
      prev.map((r) => {
        if (r.id === resourceId) {
          return {
            ...r,
            status: 'OCCUPIED',
            currentUser,
            currentJob,
            remainingHours: hours,
            vramUtilPercent: r.type === 'GPU' ? 88 : 50,
            updatedAt: new Date().toISOString(),
          };
        }
        return r;
      })
    );
    addToast(
      language === 'zh' ? '🖥️ 算力节点已认领' : '🖥️ Resource Claimed',
      `@${currentUser} (${hours}h)`,
      'success'
    );
  };

  const releaseResource = (resourceId: string) => {
    setResources((prev) =>
      prev.map((r) => {
        if (r.id === resourceId) {
          return {
            ...r,
            status: 'IDLE',
            currentUser: undefined,
            currentJob: undefined,
            remainingHours: 0,
            vramUtilPercent: 0,
            updatedAt: new Date().toISOString(),
          };
        }
        return r;
      })
    );
    addToast(language === 'zh' ? '节点已释放' : 'Resource Released', '', 'info');
  };

  const addResource = (res: LabResource) => {
    setResources((prev) => [...prev, res]);
    addToast(language === 'zh' ? '公共设施已添加' : 'Resource Added', res.nameZh || res.nameEn, 'success');
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
      version: 3,
      exportedAt: new Date().toISOString(),
      stages,
      tasks,
      projects,
      members,
      venues,
      resources,
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
      triggerConfetti();
      addToast(language === 'zh' ? '数据已成功恢复！' : 'Data Restored Successfully!', '', 'success');
      return true;
    } catch (e) {
      console.warn('Invalid backup file', e);
      addToast(language === 'zh' ? '备份文件解析失败' : 'Failed to parse backup', '', 'error');
      return false;
    }
  };

  // Personal Weekly Digest Generator
  const generateMyWeeklyDigest = (targetMemberId?: string): string => {
    const activeId = targetMemberId || currentUserId;
    const userMember = members.find((m) => m.id === activeId) || members[0];
    const isZh = language === 'zh';
    const userName = isZh ? userMember.nameZh : userMember.nameEn;
    const userRole = isZh ? userMember.titleZh : userMember.titleEn;

    const userTasks = tasks.filter((t) => t.leadAuthor.id === userMember.id);
    const completed = userTasks.filter((t) => t.stage === 'ACCEPTED' || !!t.completedAt);
    const active = userTasks.filter((t) => !t.isBlocked && t.stage !== 'ACCEPTED' && !t.completedAt);
    const blocked = userTasks.filter((t) => t.isBlocked);

    let report = isZh
      ? `## 📋 学术周进展汇报 - ${userName} (${userRole})\n`
      : `## 📋 Academic Weekly Progress Report - ${userName} (${userRole})\n`;

    report += isZh
      ? `**汇报日期**: ${formatDate(new Date().toISOString(), 'zh')}\n\n`
      : `**Date**: ${formatDate(new Date().toISOString(), 'en')}\n\n`;

    // 1. Completed
    report += isZh ? `### 1. 本周已完成 / 里程碑结项\n` : `### 1. Recently Completed & Milestones\n`;
    if (completed.length === 0) {
      report += isZh ? `*暂无新结项任务*\n\n` : `*No completed milestones this cycle*\n\n`;
    } else {
      completed.forEach((t) => {
        report += `- ✅ **[${t.projectTag}]** ${t.title} (${t.targetVenue})\n`;
      });
      report += `\n`;
    }

    // 2. In Progress
    report += isZh ? `### 2. 正在推进中课题 / 实验与初稿\n` : `### 2. Active Tasks & In-Progress Pipelines\n`;
    if (active.length === 0) {
      report += isZh ? `*无进行中任务*\n\n` : `*No active in-progress tasks*\n\n`;
    } else {
      active.forEach((t) => {
        report += `- ⚡ **[${t.projectTag}]** ${t.title} (进度: ${t.progress || 0}%, 截稿: ${formatDate(t.deadline, language)})\n`;
      });
      report += `\n`;
    }

    // 3. Blockers
    report += isZh ? `### 3. 当前技术卡点与求助需求\n` : `### 3. Critical Blockers & Assistance Needed\n`;
    if (blocked.length === 0) {
      report += isZh ? `*本周无技术受阻卡点，各方向按计划推进。*\n\n` : `*No active blockers reported. Proceeding on schedule.*\n\n`;
    } else {
      blocked.forEach((t) => {
        report += `- 🔥 **[${t.projectTag}]** ${t.title}\n`;
        report += isZh
          ? `  - 卡点原因: ${t.blocker?.details || '详见系统'}\n  - 已尝试解法: ${t.blocker?.tried || '无'}\n  - 建议决断: ${t.blocker?.escalatedTo || '导师'}\n`
          : `  - Stuck on: ${t.blocker?.details}\n  - Tried: ${t.blocker?.tried}\n  - Escalate to: ${t.blocker?.escalatedTo}\n`;
      });
      report += `\n`;
    }

    report += `---\n*Generated by LabFlow OS*\n`;

    // Copy to clipboard
    navigator.clipboard.writeText(report).then(() => {
      addToast(t.myWeeklyDigest, t.digestCopied, 'success');
    }).catch(() => {});

    return report;
  };

  const resetToMockData = () => {
    setTasks(INITIAL_TASKS);
    setProjects(INITIAL_PROJECTS);
    setResources(INITIAL_RESOURCES);
    setStages(DEFAULT_STAGES);
    setMembers(LAB_MEMBERS);
    setVenues(DEFAULT_VENUES);
    setFilterOnlyBlockers(false);
    setSearchQuery('');
    setFilterMemberId('all');
    setSelectedStageFilter('all');
    setSelectedProjectFilter('all');
    setViewMode('kanban');
    try {
      localStorage.removeItem(STORAGE_KEYS.TASKS);
      localStorage.removeItem(STORAGE_KEYS.PROJECTS);
      localStorage.removeItem(STORAGE_KEYS.RESOURCES);
      localStorage.removeItem(STORAGE_KEYS.STAGES);
      localStorage.removeItem(STORAGE_KEYS.MEMBERS);
      localStorage.removeItem(STORAGE_KEYS.VENUES);
    } catch (e) {
      console.warn('Could not reset localStorage', e);
    }
    triggerConfetti();
    addToast(language === 'zh' ? '示例数据已重置' : 'Demo State Reset', '', 'success');
  };

  const cleanSlateWipe = () => {
    const initialUser: LabMember = {
      id: 'member-me',
      nameEn: 'Researcher 1',
      nameZh: '研究员 1',
      role: 'PI',
      titleEn: 'Principal Investigator',
      titleZh: '课题组长 (PI)',
      avatar: '🧑‍💻',
      email: 'pi@lab.edu'
    };
    setTasks([]);
    setProjects([]);
    setResources([]);
    setMembers([initialUser]);
    setCurrentUserId('member-me');
    setFilterOnlyBlockers(false);
    setSearchQuery('');
    setFilterMemberId('all');
    setSelectedStageFilter('all');
    setSelectedProjectFilter('all');
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify([initialUser]));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, 'member-me');
    } catch (e) {
      console.warn('Could not wipe localStorage', e);
    }
    addToast(t.cleanSlateSuccess || (language === 'zh' ? '已一键清空所有任务和人员，开启全新实验室' : 'All tasks and members wiped. Blank canvas ready.'), '', 'warning');
  };

  return (
    <LabFlowContext.Provider
      value={{
        language,
        setLanguage,
        t,
        stages,
        addStage,
        updateStage,
        deleteStage,
        restoreDefaultStages,
        isStageSettingsOpen,
        setIsStageSettingsOpen,
        venues,
        addVenue,
        deleteVenue,
        members,
        currentUserId,
        setCurrentUserId,
        addMember,
        updateMember,
        deleteMember,
        isMemberManagerOpen,
        setIsMemberManagerOpen,
        tasks,
        projects,
        resources,
        filterOnlyBlockers,
        searchQuery,
        filterMemberId,
        selectedStageFilter,
        setSelectedStageFilter,
        selectedProjectFilter,
        setSelectedProjectFilter,
        sortByDDLUrgency,
        setSortByDDLUrgency,
        viewMode,
        theme,
        accentColor,
        setAccentColor,
        bgStyle,
        setBgStyle,
        fontSize,
        setFontSize,
        enableComputeStrip,
        setEnableComputeStrip,
        isSettingsOpen,
        setIsSettingsOpen,
        activeSettingsTab,
        setActiveSettingsTab,
        activeBlockerTask,
        isReverseDDLOpen,
        isNewTaskOpen,
        isResourceModalOpen,
        selectedTask,
        toasts,
        setFilterOnlyBlockers,
        setSearchQuery,
        setFilterMemberId,
        setViewMode,
        setTheme,
        setActiveBlockerTask,
        setIsReverseDDLOpen,
        setIsNewTaskOpen,
        setIsResourceModalOpen,
        setSelectedTask,
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
        addToast,
        removeToast,
      }}
    >
      {children}
    </LabFlowContext.Provider>
  );
};

export const useLabFlow = () => {
  const context = useContext(LabFlowContext);
  if (!context) {
    throw new Error('useLabFlow must be used within a LabFlowProvider');
  }
  return context;
};
