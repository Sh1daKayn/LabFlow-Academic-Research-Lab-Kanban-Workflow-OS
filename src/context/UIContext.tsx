'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import {
  ChecklistTemplateEntry,
  DirectRequestKind,
  SettingsTab,
  TaskItem,
  ViewMode,
  WorkCategory,
  WorkspaceScope,
} from '@/types';

export interface RequestModalSeed {
  kind?: DirectRequestKind;
  recipientId?: string;
  title?: string;
  content?: string;
  taskId?: string;
  projectId?: string;
  workCategory?: WorkCategory;
  dueDate?: string;
}

export interface TemplateDraftSeed {
  templateId?: string;
  name?: string;
  description?: string;
  category?: string;
  items?: ChecklistTemplateEntry[];
  targetTaskId?: string;
  targetMemberId?: string;
  targetWeekKey?: string;
}

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'warning' | 'info' | 'error';
}

export interface UIContextType {
  // Filters & View Mode
  filterOnlyBlockers: boolean;
  setFilterOnlyBlockers: (val: boolean) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filterMemberId: string;
  setFilterMemberId: (val: string) => void;
  selectedStageFilter: string;
  setSelectedStageFilter: (val: string) => void;
  selectedProjectFilter: string;
  setSelectedProjectFilter: (val: string) => void;
  sortByDDLUrgency: boolean;
  setSortByDDLUrgency: (val: boolean) => void;
  viewMode: ViewMode;
  setViewMode: (val: ViewMode) => void;
  workspaceScope: WorkspaceScope;
  setWorkspaceScope: (val: WorkspaceScope) => void;
  workCategoryFilter: 'ALL' | WorkCategory;
  setWorkCategoryFilter: (val: 'ALL' | WorkCategory) => void;

  // Modals & Drawers
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  activeSettingsTab: SettingsTab;
  setActiveSettingsTab: (tab: SettingsTab) => void;
  activeBlockerTask: TaskItem | null;
  setActiveBlockerTask: (task: TaskItem | null) => void;
  isReverseDDLOpen: boolean;
  setIsReverseDDLOpen: (open: boolean) => void;
  isNewTaskOpen: boolean;
  setIsNewTaskOpen: (open: boolean) => void;
  isResourceModalOpen: boolean;
  setIsResourceModalOpen: (open: boolean) => void;
  isAIImportOpen: boolean;
  setIsAIImportOpen: (open: boolean) => void;
  isStageSettingsOpen: boolean;
  setIsStageSettingsOpen: (open: boolean) => void;
  isMemberManagerOpen: boolean;
  setIsMemberManagerOpen: (open: boolean) => void;
  isPasswordModalOpen: boolean;
  setIsPasswordModalOpen: (open: boolean) => void;
  isRegisterModalOpen: boolean;
  setIsRegisterModalOpen: (open: boolean) => void;
  selectedTask: TaskItem | null;
  setSelectedTask: React.Dispatch<React.SetStateAction<TaskItem | null>>;
  logicTreeTaskId: string | null;
  setLogicTreeTaskId: (taskId: string | null) => void;
  isMyProfileModalOpen: boolean;
  setIsMyProfileModalOpen: (open: boolean) => void;
  isFeatureGuideOpen: boolean;
  setIsFeatureGuideOpen: (open: boolean) => void;
  isTemplateModalOpen: boolean;
  setIsTemplateModalOpen: (open: boolean) => void;
  templateDraftSeed: TemplateDraftSeed | null;
  setTemplateDraftSeed: (seed: TemplateDraftSeed | null) => void;
  openTemplateModal: (seed?: TemplateDraftSeed | null) => void;
  isRequestModalOpen: boolean;
  setIsRequestModalOpen: (open: boolean) => void;
  requestModalSeed: RequestModalSeed | null;
  setRequestModalSeed: (seed: RequestModalSeed | null) => void;
  openRequestModal: (seed?: RequestModalSeed | null) => void;
  isViewCustomizerOpen: boolean;
  setIsViewCustomizerOpen: (open: boolean) => void;

  // Interactive Onboarding Walkthrough
  isTourOpen: boolean;
  tourStepIndex: number;
  setTourStepIndex: (idx: number) => void;
  startTour: () => void;
  closeTour: () => void;

  // Notifications
  toasts: ToastItem[];
  addToast: (title: string, description?: string, type?: ToastItem['type']) => void;
  removeToast: (id: string) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const TOUR_STORAGE_KEY = 'labflow_onboarding_tour_seen_v1';

/**
 * Manages transient UI filters, active view mode, modal/drawer flags,
 * and toast notifications without triggering domain-data re-renders.
 */
export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filterOnlyBlockers, setFilterOnlyBlockers] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMemberId, setFilterMemberId] = useState<string>('all');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('all');
  const [sortByDDLUrgency, setSortByDDLUrgency] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [workspaceScope, setWorkspaceScope] = useState<WorkspaceScope>('MINE');
  const [workCategoryFilter, setWorkCategoryFilter] = useState<'ALL' | WorkCategory>('ALL');

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab>('appearance');
  const [activeBlockerTask, setActiveBlockerTask] = useState<TaskItem | null>(null);
  const [isReverseDDLOpen, setIsReverseDDLOpen] = useState<boolean>(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState<boolean>(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState<boolean>(false);
  const [isAIImportOpen, setIsAIImportOpen] = useState<boolean>(false);
  const [isStageSettingsOpen, setIsStageSettingsOpen] = useState<boolean>(false);
  const [isMemberManagerOpen, setIsMemberManagerOpen] = useState<boolean>(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [logicTreeTaskId, setLogicTreeTaskId] = useState<string | null>(null);
  const [isMyProfileModalOpen, setIsMyProfileModalOpen] = useState<boolean>(false);
  const [isFeatureGuideOpen, setIsFeatureGuideOpen] = useState<boolean>(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);
  const [templateDraftSeed, setTemplateDraftSeed] = useState<TemplateDraftSeed | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);
  const [requestModalSeed, setRequestModalSeed] = useState<RequestModalSeed | null>(null);
  const [isViewCustomizerOpen, setIsViewCustomizerOpen] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [tourStepIndex, setTourStepIndex] = useState<number>(0);

  const startTour = useCallback(() => {
    setIsFeatureGuideOpen(false);
    setIsSettingsOpen(false);
    setSelectedTask(null);
    setViewMode('kanban');
    setTourStepIndex(0);
    setIsTourOpen(true);
  }, []);

  const closeTour = useCallback(() => {
    setIsTourOpen(false);
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, '1');
    } catch {}
  }, []);

  const openTemplateModal = useCallback((seed: TemplateDraftSeed | null = null) => {
    setTemplateDraftSeed(seed);
    setIsTemplateModalOpen(true);
  }, []);

  const openRequestModal = useCallback((seed: RequestModalSeed | null = null) => {
    setRequestModalSeed(seed);
    setIsRequestModalOpen(true);
  }, []);

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addToast = useCallback(
    (title: string, description?: string, type: ToastItem['type'] = 'info') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
      setToasts((prev) => [...prev, { id, title, description, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, 4500);
    },
    []
  );

  return (
    <UIContext.Provider
      value={{
        filterOnlyBlockers,
        setFilterOnlyBlockers,
        searchQuery,
        setSearchQuery,
        filterMemberId,
        setFilterMemberId,
        selectedStageFilter,
        setSelectedStageFilter,
        selectedProjectFilter,
        setSelectedProjectFilter,
        sortByDDLUrgency,
        setSortByDDLUrgency,
        viewMode,
        setViewMode,
        workspaceScope,
        setWorkspaceScope,
        workCategoryFilter,
        setWorkCategoryFilter,
        isSettingsOpen,
        setIsSettingsOpen,
        activeSettingsTab,
        setActiveSettingsTab,
        activeBlockerTask,
        setActiveBlockerTask,
        isReverseDDLOpen,
        setIsReverseDDLOpen,
        isNewTaskOpen,
        setIsNewTaskOpen,
        isResourceModalOpen,
        setIsResourceModalOpen,
        isAIImportOpen,
        setIsAIImportOpen,
        isStageSettingsOpen,
        setIsStageSettingsOpen,
        isMemberManagerOpen,
        setIsMemberManagerOpen,
        isPasswordModalOpen,
        setIsPasswordModalOpen,
        isRegisterModalOpen,
        setIsRegisterModalOpen,
        selectedTask,
        setSelectedTask,
        logicTreeTaskId,
        setLogicTreeTaskId,
        isMyProfileModalOpen,
        setIsMyProfileModalOpen,
        isFeatureGuideOpen,
        setIsFeatureGuideOpen,
        isTemplateModalOpen,
        setIsTemplateModalOpen,
        templateDraftSeed,
        setTemplateDraftSeed,
        openTemplateModal,
        isRequestModalOpen,
        setIsRequestModalOpen,
        requestModalSeed,
        setRequestModalSeed,
        openRequestModal,
        isViewCustomizerOpen,
        setIsViewCustomizerOpen,
        isTourOpen,
        tourStepIndex,
        setTourStepIndex,
        startTour,
        closeTour,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useLabUI = () => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useLabUI must be used within a UIProvider');
  return ctx;
};
