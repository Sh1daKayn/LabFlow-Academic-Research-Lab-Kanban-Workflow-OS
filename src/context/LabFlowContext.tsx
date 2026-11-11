'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AcademicStage,
  BlockerInfo,
  LabMember,
  LabResource,
  ProjectItem,
  ReverseDDLForm,
  TaskItem,
} from '@/types';
import {
  INITIAL_PROJECTS,
  INITIAL_RESOURCES,
  INITIAL_TASKS,
  LAB_MEMBERS,
} from '@/data/mockData';
import { subtractDays } from '@/utils/date';
import { triggerConfetti } from '@/utils/confetti';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'warning' | 'info' | 'error';
}

interface LabFlowContextType {
  tasks: TaskItem[];
  projects: ProjectItem[];
  members: LabMember[];
  resources: LabResource[];
  filterOnlyBlockers: boolean;
  searchQuery: string;
  filterMemberId: string;
  viewMode: 'kanban' | 'meeting';
  theme: 'dark' | 'light';
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
  setViewMode: (val: 'kanban' | 'meeting') => void;
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
  TASKS: 'labflow_tasks_v1',
  PROJECTS: 'labflow_projects_v1',
  RESOURCES: 'labflow_resources_v1',
  THEME: 'labflow_theme_v1',
};

export const LabFlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [projects, setProjects] = useState<ProjectItem[]>(INITIAL_PROJECTS);
  const [members] = useState<LabMember[]>(LAB_MEMBERS);
  const [resources, setResources] = useState<LabResource[]>(INITIAL_RESOURCES);

  const [filterOnlyBlockers, setFilterOnlyBlockers] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMemberId, setFilterMemberId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'meeting'>('kanban');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const [activeBlockerTask, setActiveBlockerTask] = useState<TaskItem | null>(null);
  const [isReverseDDLOpen, setIsReverseDDLOpen] = useState<boolean>(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState<boolean>(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Load from localStorage on client mount
  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
      const savedProjects = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      const savedResources = localStorage.getItem(STORAGE_KEYS.RESOURCES);
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) as 'dark' | 'light';

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

  // Save changes to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
      localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(resources));
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (e) {
      console.warn('Could not write to localStorage', e);
    }
  }, [tasks, projects, resources, theme, isInitialized]);

  // Apply dark mode class to <html>
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
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const moveTask = (taskId: string, targetStage: AcademicStage, newOrder?: number) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    if (targetStage === 'ACCEPTED' && targetTask.stage !== 'ACCEPTED') {
      triggerConfetti();
      addToast(
        '🎉 Milestone Accepted & Archived!',
        `"${targetTask.title.slice(0, 40)}..." is now marked as Accepted!`,
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
      '🚨 Blocker Logged & Escalated',
      `Card escalated to ${blocker.escalatedTo} (${blocker.category})`,
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
      '✨ Blocker Resolved',
      'The blocker has been marked as resolved and task is unblocked.',
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
    addToast('Task Created', `Added "${newTask.title.slice(0, 30)}..." to ${newTask.stage}`, 'success');
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
    addToast('Task Updated', 'Card details updated successfully', 'info');
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
    }
    addToast('Task Deleted', 'Card removed from pipeline', 'info');
  };

  const generateReverseDDLPipeline = (plan: ReverseDDLForm) => {
    const lead = members.find((m) => m.id === plan.leadAuthorId) || members[2]; // Default to Kayn
    const pi = members[0]; // Prof. Malone

    const projectId = `proj-${Date.now()}`;
    const newProject: ProjectItem = {
      id: projectId,
      title: plan.title,
      targetVenue: plan.targetVenue,
      tag: plan.tag || plan.targetVenue.split(' ')[0] || 'Paper',
      submissionDeadline: plan.deadlineDate,
      status: 'DATA_EXP',
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
        title: `[T-45] Baseline & Core Empirical Results Freeze: ${plan.title}`,
        description: `Finalize experimental benchmark suites, freeze baseline comparisons, and verify seed replicability for ${plan.targetVenue}.`,
        stage: 'DATA_EXP',
        projectId,
        projectTag: newProject.tag,
        targetVenue: plan.targetVenue,
        deadline: t45,
        leadAuthor: lead,
        pi,
        priority: 'HIGH',
        assets: newProject.assets,
        isBlocked: false,
        order: 0,
        tags: ['Empirical Freeze', 'Baselines', plan.targetVenue],
        checklist: [
          { id: 'c1', text: 'Lock baseline algorithm configurations & hyperparameters', done: false },
          { id: 'c2', text: 'Generate primary evaluation table across 5 random seeds', done: false },
          { id: 'c3', text: 'Backup raw tensor/log checkpoints to cloud storage', done: false },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `task-${Date.now()}-2`,
        title: `[T-30] Full Manuscript First Draft Ready (Overleaf): ${plan.title}`,
        description: `Complete full draft in Overleaf including Introduction, Related Work, Methodology, Main Theorems, and Discussion.`,
        stage: 'DRAFTING',
        projectId,
        projectTag: newProject.tag,
        targetVenue: plan.targetVenue,
        deadline: t30,
        leadAuthor: lead,
        pi,
        priority: 'HIGH',
        assets: newProject.assets,
        isBlocked: false,
        order: 0,
        tags: ['Drafting', 'Overleaf', 'Figures'],
        checklist: [
          { id: 'c1', text: 'Complete Section 1 & 2 literature framing', done: false },
          { id: 'c2', text: 'Compile vector figures at 300 DPI', done: false },
          { id: 'c3', text: 'Verify KaTeX/LaTeX math notations consistency', done: false },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `task-${Date.now()}-3`,
        title: `[T-14] Submit Polished PDF to PI for Internal Review: ${plan.title}`,
        description: `Deliver ready manuscript to ${pi.name} for critical structural review, theorem verification, and abstract refinement.`,
        stage: 'PI_REVIEW',
        projectId,
        projectTag: newProject.tag,
        targetVenue: plan.targetVenue,
        deadline: t14,
        leadAuthor: lead,
        pi,
        priority: 'URGENT',
        assets: newProject.assets,
        isBlocked: false,
        order: 0,
        tags: ['PI Review', 'Critical Polish'],
        checklist: [
          { id: 'c1', text: 'Send compiled PDF & diff notes to PI', done: false },
          { id: 'c2', text: 'Conduct internal lab dry-run walk-through', done: false },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `task-${Date.now()}-4`,
        title: `[T-3] Camera Formatting, Anonymity & Code Check: ${plan.title}`,
        description: `Final submission checks: OpenReview author profile confirmation, blind review scrub, supplementary replication zip pack.`,
        stage: 'PI_REVIEW',
        projectId,
        projectTag: newProject.tag,
        targetVenue: plan.targetVenue,
        deadline: t3,
        leadAuthor: lead,
        pi,
        priority: 'URGENT',
        assets: newProject.assets,
        isBlocked: false,
        order: 1,
        tags: ['Submission Check', 'Camera Ready'],
        checklist: [
          { id: 'c1', text: 'Strip author names & institution metadata for double-blind review', done: false },
          { id: 'c2', text: 'Compile anonymized GitHub code repository', done: false },
          { id: 'c3', text: 'Submit to portal and verify confirmation receipt', done: false },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    setTasks((prev) => [...generatedTasks, ...prev]);
    triggerConfetti();
    addToast(
      '⚡ Reverse Pipeline Generated!',
      `Created 4 synchronized milestones leading up to ${plan.targetVenue} (${plan.deadlineDate})`,
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
      '🖥️ Resource Claimed',
      `Locked for @${currentUser} (${currentJob || 'Batch training'}, ${hours}h)`,
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
    addToast('Resource Released', 'Node is now IDLE and available for other lab members', 'info');
  };

  const resetToMockData = () => {
    setTasks(INITIAL_TASKS);
    setProjects(INITIAL_PROJECTS);
    setResources(INITIAL_RESOURCES);
    setFilterOnlyBlockers(false);
    setSearchQuery('');
    setFilterMemberId('all');
    setViewMode('kanban');
    try {
      localStorage.removeItem(STORAGE_KEYS.TASKS);
      localStorage.removeItem(STORAGE_KEYS.PROJECTS);
      localStorage.removeItem(STORAGE_KEYS.RESOURCES);
    } catch (e) {
      console.warn('Could not reset localStorage', e);
    }
    triggerConfetti();
    addToast('Demo State Reset', 'Restored pristine academic mock data across all pipelines', 'success');
  };

  return (
    <LabFlowContext.Provider
      value={{
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
