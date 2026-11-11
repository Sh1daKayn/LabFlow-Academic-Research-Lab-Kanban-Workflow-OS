'use client';

import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { TaskItem } from '@/types';
import { useLabFlow } from '@/context/LabFlowContext';
import { formatCountdownBadge } from '@/utils/date';
import { BLOCKER_CATEGORIES } from '@/data/mockData';
import {
  ExternalLink,
  Flame,
  FileText,
  Database,
  BookOpen,
  CheckSquare,
  ArrowRight,
  GripVertical,
} from 'lucide-react';
import { GitHubIcon } from '@/components/icons/BrandIcons';

interface KanbanCardProps {
  task: TaskItem;
  index: number;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ task, index }) => {
  const { setSelectedTask, setActiveBlockerTask, moveTask } = useLabFlow();
  const ddlBadge = formatCountdownBadge(task.deadline);

  const blockerMeta = task.blocker
    ? BLOCKER_CATEGORIES[task.blocker.category] || BLOCKER_CATEGORIES.OTHER
    : null;

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`group relative rounded-xl transition-all duration-200 select-none ${
            snapshot.isDragging
              ? 'shadow-2xl shadow-indigo-500/20 ring-2 ring-indigo-500 scale-[1.02] bg-slate-900 z-50'
              : 'hover:shadow-lg hover:shadow-slate-950/60'
          } ${
            task.isBlocked
              ? 'border-2 border-red-500/80 bg-gradient-to-b from-red-950/30 via-slate-900 to-slate-900/95 ring-1 ring-red-500/40 shadow-red-500/10'
              : 'border border-slate-800 bg-slate-900/90 hover:border-slate-700/90'
          }`}
          style={provided.draggableProps.style}
        >
          {/* Card Content Container */}
          <div className="p-3.5 space-y-3">
            {/* Top row: Drag handle + Project tag + Countdown */}
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <div
                  {...provided.dragHandleProps}
                  className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 p-0.5 -ml-1 rounded transition-colors"
                  title="Drag to reorder or move stage"
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </div>

                {/* Project Tag */}
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 truncate max-w-[130px]"
                  title={`Project: ${task.projectTag} (${task.targetVenue})`}
                >
                  {task.projectTag}
                </span>

                {/* Priority dot for high/urgent */}
                {task.priority === 'URGENT' && (
                  <span className="flex h-2 w-2 relative" title="Urgent Priority">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                )}
              </div>

              {/* DDL Countdown Badge */}
              <div
                className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${ddlBadge.className}`}
              >
                {ddlBadge.text}
              </div>
            </div>

            {/* Pulsing Blocker Status Badge (if blocked) */}
            {task.isBlocked && blockerMeta && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveBlockerTask(task);
                }}
                className="cursor-pointer flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 hover:bg-red-500/25 transition-all group/blocker"
                title="Click to inspect blocker details or resolve"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-400">
                    BLOCKED:
                  </span>
                  <span className="text-[11px] font-medium truncate text-red-200">
                    {blockerMeta.labelZh} ({blockerMeta.labelEn})
                  </span>
                </div>
                <span className="text-[10px] underline font-semibold text-red-400 group-hover/blocker:text-red-200 shrink-0">
                  Resolve →
                </span>
              </div>
            )}

            {/* Task Title (clickable to open detail drawer) */}
            <div
              onClick={() => setSelectedTask(task)}
              className="cursor-pointer"
            >
              <h3 className="text-xs font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors leading-snug line-clamp-2">
                {task.title}
              </h3>
              {task.description && (
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed font-normal">
                  {task.description}
                </p>
              )}
            </div>

            {/* Checklist progress if present */}
            {task.checklist && task.checklist.length > 0 && (
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-950/40 px-2 py-1 rounded-md border border-slate-800/60">
                <CheckSquare className="w-3 h-3 text-emerald-400" />
                <span>
                  {task.checklist.filter((c) => c.done).length} / {task.checklist.length} subtasks
                </span>
                <div className="flex-1 bg-slate-800 h-1 rounded-full overflow-hidden ml-1">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{
                      width: `${
                        (task.checklist.filter((c) => c.done).length / task.checklist.length) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Direct Asset Quick-Links */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {task.assets.overleaf && (
                <a
                  href={task.assets.overleaf}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors"
                  title="Open Overleaf LaTeX Draft"
                >
                  <FileText className="w-2.5 h-2.5" />
                  <span>Overleaf</span>
                  <ExternalLink className="w-2 h-2 text-emerald-400/70" />
                </a>
              )}

              {task.assets.github && (
                <a
                  href={task.assets.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-colors"
                  title="Open GitHub Code & Replication Repo"
                >
                  <GitHubIcon className="w-2.5 h-2.5" />
                  <span>GitHub</span>
                  <ExternalLink className="w-2 h-2 text-purple-400/70" />
                </a>
              )}

              {task.assets.dataset && (
                <a
                  href={task.assets.dataset}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors"
                  title="Open Zenodo / Drive Dataset"
                >
                  <Database className="w-2.5 h-2.5" />
                  <span>Dataset</span>
                  <ExternalLink className="w-2 h-2 text-amber-400/70" />
                </a>
              )}

              {task.assets.zotero && (
                <a
                  href={task.assets.zotero}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors"
                  title="Open Zotero Citation Library"
                >
                  <BookOpen className="w-2.5 h-2.5" />
                  <span>Zotero</span>
                  <ExternalLink className="w-2 h-2 text-rose-400/70" />
                </a>
              )}
            </div>

            {/* Bottom Row: Authors (Lead & PI) + Blocker Trigger Button */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
              {/* Authors */}
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="text-[10px] font-medium text-slate-300 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/60 truncate"
                  title={`Lead Author: ${task.leadAuthor.name} (${task.leadAuthor.role})`}
                >
                  Lead: {task.leadAuthor.name.split(' ')[0]}
                </span>

                <span
                  className="text-[10px] font-medium text-slate-400 px-1.5 py-0.5 rounded bg-slate-800/50 border border-slate-800 truncate"
                  title={`PI: ${task.pi.name}`}
                >
                  PI: {task.pi.name.split(' ')[1] || task.pi.name}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Blocker reporting button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveBlockerTask(task);
                  }}
                  className={`p-1 rounded text-xs transition-colors ${
                    task.isBlocked
                      ? 'text-red-400 hover:text-red-300 hover:bg-red-500/20'
                      : 'text-slate-500 hover:text-rose-400 hover:bg-slate-800'
                  }`}
                  title={task.isBlocked ? 'View / Resolve Blocker' : 'Report Blocker (标记卡点)'}
                >
                  <Flame className="w-3.5 h-3.5" />
                </button>

                {/* Quick advance stage button */}
                {task.stage !== 'ACCEPTED' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const stageFlow: TaskItem['stage'][] = [
                        'IDEATION',
                        'DATA_EXP',
                        'DRAFTING',
                        'PI_REVIEW',
                        'REVISION',
                        'ACCEPTED',
                      ];
                      const currentIndex = stageFlow.indexOf(task.stage);
                      if (currentIndex >= 0 && currentIndex < stageFlow.length - 1) {
                        moveTask(task.id, stageFlow[currentIndex + 1]);
                      }
                    }}
                    className="p-1 rounded text-slate-500 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                    title="Advance to Next Stage"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};
