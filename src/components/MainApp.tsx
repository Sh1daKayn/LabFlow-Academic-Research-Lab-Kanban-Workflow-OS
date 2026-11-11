'use client';

import React from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import { Header } from '@/components/Header';
import { ResourceStrip } from '@/components/ResourceStrip';
import { KanbanBoard } from '@/components/KanbanBoard';
import { GroupMeetingView } from '@/components/GroupMeetingView';
import { BlockerModal } from '@/components/BlockerModal';
import { ReverseDDLModal } from '@/components/ReverseDDLModal';
import { NewTaskModal } from '@/components/NewTaskModal';
import { TaskDetailDrawer } from '@/components/TaskDetailDrawer';
import { ResourceModal } from '@/components/ResourceModal';
import { ToastContainer } from '@/components/Toast';

export const MainApp: React.FC = () => {
  const { viewMode } = useLabFlow();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Header */}
      <Header />

      {/* Compute & Lab Resource Status Strip */}
      <ResourceStrip />

      {/* Main View Area: Kanban vs Group Meeting */}
      <main className="flex-1 flex flex-col">
        {viewMode === 'kanban' ? <KanbanBoard /> : <GroupMeetingView />}
      </main>

      {/* Modals & Slide-over Drawers */}
      <BlockerModal />
      <ReverseDDLModal />
      <NewTaskModal />
      <TaskDetailDrawer />
      <ResourceModal />

      {/* Toast Notification Layer */}
      <ToastContainer />
    </div>
  );
};
