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
} from '@/types';
import {
  DEFAULT_STAGES,
  INITIAL_PROJECTS,
  INITIAL_RESOURCES,
  INITIAL_TASKS,
  LAB_MEMBERS,
} from '@/data/mockData';
import { en, LocaleTranslations } from '@/locales/en';
import { zh } from '@/locales/zh';
import { subtractDays } from '@/utils/date';
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

  // Core Data
  tasks: TaskItem[];
  projects: ProjectItem[];
  members: LabMember[];
  resources: LabResource[];

  // View & Filters
  filterOnlyBlockers: boolean;
  searchQuery: string;
  filterMemberId: string;
  viewMode: 'kanban' | 'gantt' | 'meeting';
  theme: 'dark' | 'light';

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
  resetToMockData: () => void;
  addToast: (title: string, description?: string, type?: ToastItem['type']) => void;
  removeToast: (id: string) => void;
}

const LabFlowContext = createContext<LabFlowContextType | undefined>(undefined);

const STORAGE_KEYS = {
  LANG: 'labflow_lang_v2',
  STAGES: 'labflow_stages_v2',
  TASKS: 'labflow_tasks_v2',
  PROJECTS: 'labflow_projects_v2',
  RESOURCES: 'labflow_resources_v2',
  THEME: 'labflow_theme_v2',
};

export const LabFlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('zh');
  const [stages, setStages] = useState<StageConfig[]>(DEFAULT_STAGES);
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [projects, setProjects] = useState<ProjectItem[]>(INITIAL_PROJECTS);
  const [members] = useState<LabMember[]>(LAB_MEMBERS);
  const [resources, setResources] = useState<LabResource[]>(INITIAL_RESOURCES);

  const [filterOnlyBlockers, setFilterOnlyBlockers] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMemberId, setFilterMemberId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'gantt' | 'meeting'>('kanban');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const [activeBlockerTask, setActiveBlockerTask] = useState<TaskItem | null>(null);
  const [isReverseDDLOpen, setIsReverseDDLOpen] = useState<boolean>(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState<boolean>(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState<boolean>(false);
  const [isStageSettingsOpen, setIsStageSettingsOpen] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Active translation dictionary
  const t = language === 'zh' ? zh : en;

  // Load from localStorage
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem(STORAGE_KEYS.LANG) as Language;
      const savedStages = localStorage.getItem(STORAGE_KEYS.STAGES);
      const savedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
      const savedProjects = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      const savedResources = localStorage.getItem(STORAGE_KEYS.RESOURCES);
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) as 'dark' | 'light';

      if (savedLang) setLanguage(savedLang);
      if (savedStages) setStages(JSON.parse(savedStages));
      if (savedTasks) setTasks(JSON.parse(savedTasks));
      if (savedProjects) setProjects(JSON.parse(savedProjects));
      if (savedResources) setResources(JSON.parse(savedResources));
      if (savedTheme) setTheme(savedTheme);
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
      localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(resources));
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (e) {
      console.warn('Could not write to localStorage', e);
    }
  }, [language, stages, tasks, projects, resources, theme, isInitialized]);

  // Apply dark mode class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

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

    // Migrate any tasks in the deleted stage to the fallback stage
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

  const generateReverseDDLPipeline = (plan: ReverseDDLForm) => {
    const lead = members.find((m) => m.id === plan.leadAuthorId) || members[2];
    const pi = members[0]; // Professor 1

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

    // Calculate dates
    const ddl = plan.deadlineDate;
    const t45 = subtractDays(ddl, 45);
    const t30 = subtractDays(ddl, 30);
    const t14 = subtractDays(ddl, 14);
    const t3 = subtractDays(ddl, 3);

    const generatedTasks: TaskItem[] = [
      {
        id: `task-${Date.now()}-1`,
        title: language === 'zh'
          ? `[T-45 基线锁定] ${plan.title}`
          : `[T-45 Baseline Freeze] ${plan.title}`,
        description: language === 'zh'
          ? '锁定基准算法与核心实验数据，完成随机种子复现性核查。'
          : `Freeze algorithm benchmark baselines and verify empirical seed stability.`,
        stage: stages[1]?.id || 'DATA_EXP',
        projectId,
        projectTag: newProject.tag,
        targetVenue: plan.targetVenue,
        startDate: subtractDays(t45, 14),
        deadline: t45,
        progress: 25,
        leadAuthor: lead,
        pi,
        priority: 'HIGH',
        assets: newProject.assets,
        isBlocked: false,
        order: 0,
        tags: ['Baseline', plan.targetVenue],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `task-${Date.now()}-2`,
        title: language === 'zh'
          ? `[T-30 初稿就绪] ${plan.title}`
          : `[T-30 Manuscript Draft] ${plan.title}`,
        description: language === 'zh'
          ? '在 Overleaf 完成包括方法、引理、主定理与实验对比在内的完整初稿。'
          : `Complete full draft in Overleaf including Methodology, Theorems, and Discussion.`,
        stage: stages[2]?.id || 'DRAFTING',
        projectId,
        projectTag: newProject.tag,
        targetVenue: plan.targetVenue,
        startDate: t45,
        deadline: t30,
        progress: 20,
        leadAuthor: lead,
        pi,
        priority: 'HIGH',
        assets: newProject.assets,
        isBlocked: false,
        order: 0,
        tags: ['Overleaf', 'Drafting'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `task-${Date.now()}-3`,
        title: language === 'zh'
          ? `[T-14 导师全篇审阅] ${plan.title}`
          : `[T-14 Advisor Review] ${plan.title}`,
        description: language === 'zh'
          ? '提交完整 PDF 供导师进行结构性批评、定理严谨性核查与叙事润色。'
          : `Deliver manuscript to advisor for structural review, theorem verification, and abstract polish.`,
        stage: stages[3]?.id || 'PI_REVIEW',
        projectId,
        projectTag: newProject.tag,
        targetVenue: plan.targetVenue,
        startDate: t30,
        deadline: t14,
        progress: 10,
        leadAuthor: lead,
        pi,
        priority: 'URGENT',
        assets: newProject.assets,
        isBlocked: false,
        order: 0,
        tags: ['Advisor Review'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `task-${Date.now()}-4`,
        title: language === 'zh'
          ? `[T-3 格式排版与匿名复核] ${plan.title}`
          : `[T-3 Camera & Anonymity Check] ${plan.title}`,
        description: language === 'zh'
          ? '双盲匿名脱敏检查、附录压缩包打包与会议提交系统元数据核对。'
          : `Final submission checks: OpenReview author confirmation, blind review scrub, and supplementary zip compile.`,
        stage: stages[3]?.id || 'PI_REVIEW',
        projectId,
        projectTag: newProject.tag,
        targetVenue: plan.targetVenue,
        startDate: t14,
        deadline: t3,
        progress: 0,
        leadAuthor: lead,
        pi,
        priority: 'URGENT',
        assets: newProject.assets,
        isBlocked: false,
        order: 1,
        tags: ['Submission'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

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

  const resetToMockData = () => {
    setTasks(INITIAL_TASKS);
    setProjects(INITIAL_PROJECTS);
    setResources(INITIAL_RESOURCES);
    setStages(DEFAULT_STAGES);
    setFilterOnlyBlockers(false);
    setSearchQuery('');
    setFilterMemberId('all');
    setViewMode('kanban');
    try {
      localStorage.removeItem(STORAGE_KEYS.TASKS);
      localStorage.removeItem(STORAGE_KEYS.PROJECTS);
      localStorage.removeItem(STORAGE_KEYS.RESOURCES);
      localStorage.removeItem(STORAGE_KEYS.STAGES);
    } catch (e) {
      console.warn('Could not reset localStorage', e);
    }
    triggerConfetti();
    addToast(language === 'zh' ? '示例数据已重置' : 'Demo State Reset', '', 'success');
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
        tasks,
        projects,
        members,
        resources,
        filterOnlyBlockers,
        searchQuery,
        filterMemberId,
        viewMode,
        theme,
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
        resetToMockData,
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
