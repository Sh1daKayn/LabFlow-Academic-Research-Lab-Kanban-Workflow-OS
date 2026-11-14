'use client';

import React from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import { Header } from '@/components/Header';
import { ResourceStrip } from '@/components/ResourceStrip';
import { KanbanBoard } from '@/components/KanbanBoard';
import { GanttView } from '@/components/GanttView';
import { ArchitectureCloudView } from '@/components/ArchitectureCloudView';
import { WeeklyTodosView } from '@/components/WeeklyTodosView';
import { GroupMeetingView } from '@/components/GroupMeetingView';
import { BlockerModal } from '@/components/BlockerModal';
import { ReverseDDLModal } from '@/components/ReverseDDLModal';
import { NewTaskModal } from '@/components/NewTaskModal';
import { ResourceModal } from '@/components/ResourceModal';
import { SettingsModal } from '@/components/SettingsModal';
import { AdminPasswordModal } from '@/components/AdminPasswordModal';
import { MemberRegisterModal } from '@/components/MemberRegisterModal';
import { MyProfileModal } from '@/components/MyProfileModal';
import { AIImportModal } from '@/components/AIImportModal';
import { TaskDetailDrawer } from '@/components/TaskDetailDrawer';
import { TaskLogicTreeModal } from '@/components/TaskLogicTreeModal';
import { FeatureGuideModal } from '@/components/FeatureGuideModal';
import { ChecklistTemplateModal } from '@/components/ChecklistTemplateModal';
import { ToastContainer } from '@/components/Toast';

export const MainApp: React.FC = () => {
  const { viewMode, enableComputeStrip } = useLabFlow();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-800 dark:selection:text-cyan-200">
      {/* Top Header */}
      <Header />

      {/* Slim Foldable Compute Strip */}
      {enableComputeStrip && <ResourceStrip />}

      {/* Main View Area: Kanban | Gantt | Architecture & Cloud | Weekly Todos | Group Meeting */}
      <main className="flex-1 flex flex-col">
        {viewMode === 'kanban' ? (
          <KanbanBoard />
        ) : viewMode === 'gantt' ? (
          <GanttView />
        ) : viewMode === 'architecture' ? (
          <ArchitectureCloudView />
        ) : viewMode === 'todos' ? (
          <WeeklyTodosView />
        ) : (
          <GroupMeetingView />
        )}
      </main>

      {/* Modals & Dialog Windows */}
      <BlockerModal />
      <ReverseDDLModal />
      <NewTaskModal />
      <ResourceModal />
      <SettingsModal />
      <AdminPasswordModal />
      <MemberRegisterModal />
      <MyProfileModal />
      <AIImportModal />
      <TaskLogicTreeModal />
      <FeatureGuideModal />
      <ChecklistTemplateModal />
      {viewMode !== 'kanban' && <TaskDetailDrawer />}

      {/* Toast Notification Layer */}
      <ToastContainer />
    </div>
  );
};
