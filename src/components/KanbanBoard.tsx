'use client';

import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { useLabFlow } from '@/context/LabFlowContext';
import { AcademicStage, TaskItem } from '@/types';
import { KanbanCard } from '@/components/KanbanCard';
import { Plus, FilterX, Clock } from 'lucide-react';

export const KanbanBoard: React.FC = () => {
  const {
    tasks,
    stages,
    language,
    t,
    filterOnlyBlockers,
    searchQuery,
    filterMemberId,
    selectedStageFilter,
    setSelectedStageFilter,
    sortByDDLUrgency,
    setSortByDDLUrgency,
    moveTask,
    reorderTasks,
    setIsNewTaskOpen,
  } = useLabFlow();

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
          const matchVenue = task.targetVenue.toLowerCase().includes(q);
          if (!matchTitle && !matchTag && !matchVenue) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortByDDLUrgency) {
          const timeA = new Date(a.deadline).getTime() || 9999999999999;
          const timeB = new Date(b.deadline).getTime() || 9999999999999;
          return timeA - timeB;
        }
        return a.order - b.order;
      });
  };

  if (!mounted) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-500 text-sm">
        {language === 'zh' ? '正在载入科研流水线...' : 'Initializing Academic Pipeline...'}
      </div>
    );
  }

  const visibleStages = selectedStageFilter === 'all'
    ? stages
    : stages.filter((s) => s.id === selectedStageFilter);

  const isSingleStage = selectedStageFilter !== 'all';

  return (
    <div className="flex-1 overflow-x-auto p-4 lg:p-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent flex flex-col">
      {/* Top Stage Filter Tabs & Sort Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none max-w-full">
          <button
            onClick={() => setSelectedStageFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
              selectedStageFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {t.allStages} ({tasks.length})
          </button>
          {stages.map((stage) => {
            const isSelected = selectedStageFilter === stage.id;
            const count = tasks.filter((t) => t.stage === stage.id).length;
            const name = language === 'zh' ? stage.labelZh : stage.labelEn;
            return (
              <button
                key={stage.id}
                onClick={() => setSelectedStageFilter(stage.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${stage.color.replace('text-', 'bg-')}`} />
                <span>{name}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Sort by urgency toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setSortByDDLUrgency(!sortByDDLUrgency)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border ${
              sortByDDLUrgency
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border-slate-800'
            }`}
            title={t.sortByDDLUrgency}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{t.sortByDDLUrgency}</span>
          </button>
        </div>
      </div>

      {/* Active filter announcement bar if active */}
      {(filterOnlyBlockers || filterMemberId !== 'all' || searchQuery) && (
        <div className="mb-4 flex items-center justify-between px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-cyan-400">{t.activeFilters}:</span>
            {filterOnlyBlockers && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-medium">
                {t.onlyBlockers}
              </span>
            )}
            {searchQuery && (
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                🔍 &quot;{searchQuery}&quot;
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400">{t.showingTasks}</span>
        </div>
      )}

      {/* DND Context */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div
          className={`flex gap-4 items-start pb-8 ${
            isSingleStage ? 'w-full max-w-4xl mx-auto' : 'min-w-[1550px]'
          }`}
        >
          {visibleStages.map((stage) => {
            const stageTasks = getFilteredTasksForStage(stage.id);
            const blockedInStage = stageTasks.filter((t) => t.isBlocked).length;
            const stageName = language === 'zh' ? stage.labelZh : stage.labelEn;

            return (
              <div
                key={stage.id}
                className={`shrink-0 flex flex-col rounded-2xl bg-slate-100/80 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/90 shadow-sm ${
                  isSingleStage ? 'w-full' : 'w-72'
                }`}
              >
                {/* Stage Header */}
                <div className="p-3 border-b border-slate-200 dark:border-slate-800/80">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-2.5 h-2.5 rounded-full ${stage.color.replace('text-', 'bg-')}`} />
                      <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight truncate">
                        {stageName}
                      </h2>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {blockedInStage > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/20 border border-rose-500/40 text-rose-600 dark:text-rose-300 animate-pulse">
                          {blockedInStage} {language === 'zh' ? '卡点' : 'blocked'}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                        {stageTasks.length}
                      </span>
                      <button
                        onClick={() => setIsNewTaskOpen(true)}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                        title={language === 'zh' ? '添加任务' : 'Add task'}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
                          ? 'bg-indigo-50/60 dark:bg-slate-900/70 ring-1 ring-inset ring-indigo-500/40'
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
                          <p className="text-xs text-slate-500 font-medium">{t.noTasksInStage}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{t.dragHint}</p>
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
