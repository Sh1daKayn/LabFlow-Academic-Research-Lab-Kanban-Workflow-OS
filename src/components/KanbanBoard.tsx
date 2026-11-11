'use client';

import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { useLabFlow } from '@/context/LabFlowContext';
import { STAGES } from '@/data/mockData';
import { AcademicStage, TaskItem } from '@/types';
import { KanbanCard } from '@/components/KanbanCard';
import { Plus, FilterX } from 'lucide-react';

export const KanbanBoard: React.FC = () => {
  const {
    tasks,
    filterOnlyBlockers,
    searchQuery,
    filterMemberId,
    moveTask,
    reorderTasks,
    setIsNewTaskOpen,
  } = useLabFlow();

  // Prevent SSR hydration mismatch with dnd
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceStage = source.droppableId as AcademicStage;
    const destStage = destination.droppableId as AcademicStage;

    if (sourceStage === destStage) {
      reorderTasks(sourceStage, source.index, destination.index);
    } else {
      moveTask(draggableId, destStage, destination.index);
    }
  };

  // Filter tasks based on search, member, and blocker toggle
  const getFilteredTasksForStage = (stageId: AcademicStage): TaskItem[] => {
    return tasks
      .filter((task) => task.stage === stageId)
      .filter((task) => {
        if (filterOnlyBlockers && !task.isBlocked) return false;
        if (filterMemberId !== 'all' && task.leadAuthor.id !== filterMemberId) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = task.title.toLowerCase().includes(q);
          const matchTag = task.projectTag.toLowerCase().includes(q);
          const matchAuthor = task.leadAuthor.name.toLowerCase().includes(q);
          const matchVenue = task.targetVenue.toLowerCase().includes(q);
          const matchDesc = (task.description || '').toLowerCase().includes(q);
          if (!matchTitle && !matchTag && !matchAuthor && !matchVenue && !matchDesc) return false;
        }
        return true;
      })
      .sort((a, b) => a.order - b.order);
  };

  if (!mounted) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-500 text-sm">
        Initializing Academic Pipeline...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-x-auto p-4 lg:p-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
      {/* Active filter announcement bar if active */}
      {(filterOnlyBlockers || filterMemberId !== 'all' || searchQuery) && (
        <div className="mb-4 flex items-center justify-between px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-cyan-400">Active Board Filters:</span>
            {filterOnlyBlockers && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-medium">
                🔥 Only Blockers
              </span>
            )}
            {filterMemberId !== 'all' && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-medium">
                👤 Filtered Member
              </span>
            )}
            {searchQuery && (
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                🔍 &quot;{searchQuery}&quot;
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400">
            Showing matching tasks across 6 pipeline stages
          </span>
        </div>
      )}

      {/* DND Context */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 items-start min-w-[1550px] pb-8">
          {STAGES.map((stage) => {
            const stageTasks = getFilteredTasksForStage(stage.id);
            const blockedInStage = stageTasks.filter((t) => t.isBlocked).length;

            return (
              <div
                key={stage.id}
                className="w-72 shrink-0 flex flex-col rounded-2xl bg-slate-950/70 border border-slate-800/90 shadow-sm"
              >
                {/* Stage Header */}
                <div className="p-3.5 border-b border-slate-800/80">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          stage.id === 'IDEATION'
                            ? 'bg-purple-400'
                            : stage.id === 'DATA_EXP'
                            ? 'bg-cyan-400'
                            : stage.id === 'DRAFTING'
                            ? 'bg-amber-400'
                            : stage.id === 'PI_REVIEW'
                            ? 'bg-blue-400'
                            : stage.id === 'REVISION'
                            ? 'bg-rose-400'
                            : 'bg-emerald-400'
                        }`}
                      />
                      <h2 className="text-xs font-bold text-slate-200 tracking-tight truncate">
                        {stage.labelEn}
                      </h2>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {blockedInStage > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/20 border border-rose-500/40 text-rose-300 animate-pulse">
                          {blockedInStage} blocked
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-900 border border-slate-800 text-slate-400">
                        {stageTasks.length}
                      </span>
                      <button
                        onClick={() => setIsNewTaskOpen(true)}
                        className="p-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                        title={`Add task to ${stage.labelEn}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Subtitle / Chinese label */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{stage.labelZh}</span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                      {stage.id === 'ACCEPTED' ? 'DOI & Replication' : stage.id === 'PI_REVIEW' ? 'Advisor Sign-off' : ''}
                    </span>
                  </div>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-2.5 flex-1 flex flex-col gap-2.5 min-h-[460px] transition-colors rounded-b-2xl ${
                        snapshot.isDraggingOver
                          ? 'bg-slate-900/70 ring-1 ring-inset ring-indigo-500/40'
                          : 'bg-transparent'
                      }`}
                    >
                      {stageTasks.map((task, idx) => (
                        <KanbanCard key={task.id} task={task} index={idx} />
                      ))}

                      {provided.placeholder}

                      {/* Empty Column Placeholder */}
                      {stageTasks.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border border-dashed border-slate-800/80 rounded-xl my-2">
                          <FilterX className="w-5 h-5 text-slate-600 mb-1" />
                          <p className="text-xs text-slate-500 font-medium">No tasks in stage</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Drag a card here or click +
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};
