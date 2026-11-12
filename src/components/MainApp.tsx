'use client';

import React from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import { Header } from '@/components/Header';
import { ResourceStrip } from '@/components/ResourceStrip';
import { KanbanBoard } from '@/components/KanbanBoard';
import { GanttView } from '@/components/GanttView';
import { GroupMeetingView } from '@/components/GroupMeetingView';
import { BlockerModal } from '@/components/BlockerModal';
import { ReverseDDLModal } from '@/components/ReverseDDLModal';
import { NewTaskModal } from '@/components/NewTaskModal';
import { ResourceModal } from '@/components/ResourceModal';
import { SettingsModal } from '@/components/SettingsModal';
import { AdminPasswordModal } from '@/components/AdminPasswordModal';
import { MemberRegisterModal } from '@/components/MemberRegisterModal';
import { AIImportModal } from '@/components/AIImportModal';
import { ToastContainer } from '@/components/Toast';

export const MainApp: React.FC = () => {
  const { viewMode, enableComputeStrip } = useLabFlow();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-800 dark:selection:text-cyan-200">
      {/* Top Header */}
      <Header />

      {/* Slim Foldable Compute Strip */}
      {enableComputeStrip && <ResourceStrip />}

      {/* Main View Area: Kanban vs Gantt vs Group Meeting */}
      <main className="flex-1 flex flex-col">
        {viewMode === 'kanban' ? (
          <KanbanBoard />
        ) : viewMode === 'gantt' ? (
          <GanttView />
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
      <AIImportModal />

      {/* Toast Notification Layer */}
      <ToastContainer />
    </div>
  );
};
