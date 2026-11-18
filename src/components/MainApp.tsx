'use client';

import React from 'react';
import { FlaskConical } from 'lucide-react';
import { AccountGate } from '@/components/AccountGate';
import { RequestsView } from '@/components/RequestsView';
import { DirectRequestModal } from '@/components/DirectRequestModal';
import { ViewCustomizerModal } from '@/components/ViewCustomizerModal';
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
import { OnboardingTour } from '@/components/OnboardingTour';
import { ChecklistTemplateModal } from '@/components/ChecklistTemplateModal';
import { ToastContainer } from '@/components/Toast';

export const MainApp: React.FC = () => {
  const {
    viewMode,
    enableComputeStrip,
    isHydrated,
    isAuthenticatedSession,
  } = useLabFlow();

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 gap-3">
        <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-sm text-white">
          <FlaskConical className="w-5 h-5" />
        </div>
        <div className="text-center">
          <div className="font-bold text-lg tracking-tight">
            Lab<span className="text-cyan-500">Flow</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticatedSession) {
    return (
      <>
        <AccountGate />
        <AdminPasswordModal />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-800 dark:selection:text-cyan-200">
      {/* Top Header */}
      <Header />

      {/* Slim Foldable Compute Strip */}
      {enableComputeStrip && <ResourceStrip />}

      {/* Main View Area: Kanban | Gantt | Architecture & Cloud | Weekly Todos | Requests | Group Meeting */}
      <main className="flex-1 flex flex-col">
        {viewMode === 'kanban' ? (
          <KanbanBoard />
        ) : viewMode === 'gantt' ? (
          <GanttView />
        ) : viewMode === 'architecture' ? (
          <ArchitectureCloudView />
        ) : viewMode === 'todos' ? (
          <WeeklyTodosView />
        ) : viewMode === 'requests' ? (
          <RequestsView />
        ) : (
          <GroupMeetingView />
        )}
      </main>

      {/* Modals & Dialog Windows */}
      <BlockerModal />
      <ReverseDDLModal />
      <NewTaskModal />
      <DirectRequestModal />
      <ViewCustomizerModal />
      <ResourceModal />
      <SettingsModal />
      <AdminPasswordModal />
      <MemberRegisterModal />
      <MyProfileModal />
      <AIImportModal />
      <TaskLogicTreeModal />
      <FeatureGuideModal />
      <OnboardingTour />
      <ChecklistTemplateModal />
      {viewMode !== 'kanban' && viewMode !== 'requests' && <TaskDetailDrawer />}

      {/* Toast Notification Layer */}
      <ToastContainer />
    </div>
  );
};
