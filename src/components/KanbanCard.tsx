'use client';

import React, { useState, useEffect } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { TaskItem, AcademicStage, Priority, ChecklistItem } from '@/types';
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
  ChevronDown,
  ChevronUp,
  Trash2,
  Save,
  Sparkles,
  X,
  Plus,
  Lock,
  Shield,
} from 'lucide-react';
import { GitHubIcon } from '@/components/icons/BrandIcons';

interface KanbanCardProps {
  task: TaskItem;
  index: number;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ task, index }) => {
  const {
    selectedTask,
    setSelectedTask,
    setActiveBlockerTask,
    moveTask,
    updateTask,
    deleteTask,
    members,
    stages,
    language,
    t,
    addToast,
    canEditTask,
    canDeleteTask,
  } = useLabFlow();

  const hasEditPermission = canEditTask(task);
  const hasDeletePermission = canDeleteTask(task);

  const isExpanded = selectedTask?.id === task.id;
  const ddlBadge = formatCountdownBadge(task.deadline, language);

  const blockerMeta = task.blocker
    ? BLOCKER_CATEGORIES[task.blocker.category] || BLOCKER_CATEGORIES.OTHER
    : null;

  const leadName = language === 'zh' ? task.leadAuthor.nameZh : task.leadAuthor.nameEn;
  const piName = language === 'zh' ? task.pi.nameZh : task.pi.nameEn;

  // Local editable form state when expanded inline
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [stage, setStage] = useState<AcademicStage>(task.stage);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [startDate, setStartDate] = useState(task.startDate || '');
  const [deadline, setDeadline] = useState(task.deadline);
  const [progress, setProgress] = useState(task.progress || 0);
  const [leadAuthorId, setLeadAuthorId] = useState(task.leadAuthor.id);
  const [piId, setPiId] = useState(task.pi.id);
  const [overleaf, setOverleaf] = useState(task.assets.overleaf || '');
  const [github, setGithub] = useState(task.assets.github || '');
  const [dataset, setDataset] = useState(task.assets.dataset || '');
  const [zotero, setZotero] = useState(task.assets.zotero || '');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(task.checklist || []);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  // Sync state when task changes or when opened
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || '');
    setStage(task.stage);
    setPriority(task.priority);
    setStartDate(task.startDate || '');
    setDeadline(task.deadline);
    setProgress(task.progress || 0);
    setLeadAuthorId(task.leadAuthor.id);
    setPiId(task.pi.id);
    setOverleaf(task.assets.overleaf || '');
    setGithub(task.assets.github || '');
    setDataset(task.assets.dataset || '');
    setZotero(task.assets.zotero || '');
    setChecklist(task.checklist || []);
  }, [task]);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isExpanded) {
      setSelectedTask(null);
    } else {
      setSelectedTask(task);
    }
  };

  const handleSaveInline = (e: React.FormEvent) => {
    e.preventDefault();
    const lead = members.find((m) => m.id === leadAuthorId) || task.leadAuthor;
    const pi = members.find((m) => m.id === piId) || task.pi;

    updateTask(task.id, {
      title,
      description,
      stage,
      priority,
      startDate: startDate || undefined,
      deadline,
      progress,
      leadAuthor: lead,
      pi,
      assets: {
        overleaf: overleaf.trim() || undefined,
        github: github.trim() || undefined,
        dataset: dataset.trim() || undefined,
        zotero: zotero.trim() || undefined,
      },
      checklist,
    });

    if (stage !== task.stage) {
      moveTask(task.id, stage);
    }

    addToast(
      language === 'zh' ? '课题细节已保存' : 'Task Details Saved',
      task.projectTag,
      'success'
    );
  };

  const handleDeleteTask = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(t.confirmDelete)) {
      deleteTask(task.id);
      setSelectedTask(null);
    }
  };

  const handleAddSubtask = () => {
    if (!newSubtaskText.trim()) return;
    const newId = `sub-${Date.now()}`;
    const updated = [...checklist, { id: newId, text: newSubtaskText.trim(), done: false }];
    setChecklist(updated);
    setNewSubtaskText('');
    updateTask(task.id, { checklist: updated });
  };

  const handleToggleSubtask = (subId: string) => {
    const updated = checklist.map((c) =>
      c.id === subId ? { ...c, done: !c.done } : c
    );
    setChecklist(updated);
    updateTask(task.id, { checklist: updated });
  };

  const handleDeleteSubtask = (subId: string) => {
    const updated = checklist.filter((c) => c.id !== subId);
    setChecklist(updated);
    updateTask(task.id, { checklist: updated });
  };

  const handleInsertRubric = () => {
    const isZh = language === 'zh';
    const rubricItems = isZh
      ? [
          '【双盲匿名】清除论文及附录中所有作者姓名、致谢、机构标识与非匿名仓库链接',
          '【可复现性】提供随机数种子配置、超参数网格列表与环境依赖清单 (conda/docker)',
          '【实验统计】核心实验完成至少 5 次不同随机种子运行并报告均值与置信区间 (std/CI)',
          '【理论与伦理】补充引理完整数学推导附录、潜在社会负面影响与合规伦理声明',
        ]
      : [
          '[Double-Blind] Remove all author names, acknowledgments, affiliations, and de-anonymized links',
          '[Reproducibility] Specify random seeds, hyperparameter search grids, and conda/docker environment',
          '[Significance] Run models with >=5 random seeds and report std / confidence intervals',
          '[Ethics & Proofs] Complete supplementary mathematical proofs, limitations, and ethical statements',
        ];

    const newItems = rubricItems.map((text, idx) => ({
      id: `rubric-${Date.now()}-${idx}`,
      text,
      done: false,
    }));

    const updated = [...checklist, ...newItems];
    setChecklist(updated);
    updateTask(task.id, { checklist: updated });
    addToast(t.insertRubricChecklist, t.rubricInserted, 'success');
  };

  return (
    <Draggable draggableId={task.id} index={index} isDragDisabled={!hasEditPermission}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`group relative rounded-xl transition-all duration-200 select-none bg-white dark:bg-slate-900 border ${
            snapshot.isDragging
              ? 'shadow-2xl shadow-indigo-500/25 ring-2 ring-indigo-500 scale-[1.02] z-50'
              : isExpanded
              ? 'ring-2 ring-indigo-500/80 shadow-lg border-indigo-500/50'
              : 'hover:shadow-md border-slate-200 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700'
          } ${
            task.isBlocked
              ? 'border-2 border-red-500/80 ring-1 ring-red-500/30'
              : ''
          }`}
          style={provided.draggableProps.style}
        >
          {/* Card Content Summary Container */}
          <div className="p-3 space-y-2.5">
            {/* Top row: Drag handle + Project tag + Countdown */}
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                {hasEditPermission ? (
                  <div
                    {...provided.dragHandleProps}
                    className="cursor-grab active:cursor-grabbing text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 p-0.5 -ml-1 rounded transition-colors"
                    title={language === 'zh' ? '拖拽调整排期或阶段' : 'Drag to move'}
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <div
                    className="text-slate-300 dark:text-slate-600 p-0.5 -ml-1"
                    title={language === 'zh' ? '只读/非负责人不可拖拽' : 'Read-only / Locked'}
                  >
                    <Lock className="w-3 h-3 text-slate-400" />
                  </div>
                )}

                {/* Project Tag */}
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300 truncate max-w-[130px]"
                  title={`${task.projectTag} (${task.targetVenue})`}
                >
                  {task.projectTag}
                </span>

                {/* Visibility Badge */}
                {task.visibility === 'TEAM_ONLY' && (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    title={language === 'zh' ? '仅本课题组成员与导师可见' : 'Project Team Only'}
                  >
                    {t.visibilityTeamBadge}
                  </span>
                )}
                {task.visibility === 'PI_ONLY' && (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center gap-0.5"
                    title={language === 'zh' ? '绝密 (仅导师与负责人可见)' : 'Confidential'}
                  >
                    <Shield className="w-2.5 h-2.5" />
                    {t.visibilityPIBadge}
                  </span>
                )}

                {/* Urgent dot */}
                {task.priority === 'URGENT' && (
                  <span className="flex h-2 w-2 relative" title="Urgent">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                )}
              </div>

              {/* DDL Countdown Badge & Inline Expand Toggle */}
              <div className="flex items-center gap-1 shrink-0">
                <div
                  className={`text-[9px] px-2 py-0.5 rounded-full border ${ddlBadge.className}`}
                >
                  {ddlBadge.text}
                </div>
                <button
                  type="button"
                  onClick={toggleExpand}
                  className={`p-1 rounded-md transition-colors ${
                    isExpanded
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title={isExpanded ? (language === 'zh' ? '收起详情' : 'Collapse') : (language === 'zh' ? '展开项目细节' : 'Expand Details')}
                >
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Pulsing Blocker Status Badge (if blocked) */}
            {task.isBlocked && blockerMeta && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveBlockerTask(task);
                }}
                className="cursor-pointer flex items-center justify-between gap-1.5 px-2 py-1 rounded-lg bg-red-500/15 border border-red-500/40 text-red-600 dark:text-red-300 hover:bg-red-500/25 transition-all group/blocker"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <span className="text-[10px] font-bold truncate">
                    {language === 'zh' ? blockerMeta.labelZh : blockerMeta.labelEn}
                  </span>
                </div>
                <span className="text-[10px] underline font-semibold text-red-600 dark:text-red-400 group-hover/blocker:text-red-800 dark:group-hover/blocker:text-red-200 shrink-0">
                  {language === 'zh' ? '解除 →' : 'Resolve →'}
                </span>
              </div>
            )}

            {/* Task Title (Clicking toggles inline dropdown) */}
            <div
              onClick={toggleExpand}
              className="cursor-pointer"
            >
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors leading-snug line-clamp-2">
                {task.title}
              </h3>
            </div>

            {/* Checklist progress if present */}
            {task.checklist && task.checklist.length > 0 && (
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800/60">
                <CheckSquare className="w-2.5 h-2.5 text-emerald-500 dark:text-emerald-400" />
                <span>
                  {task.checklist.filter((c) => c.done).length} / {task.checklist.length}
                </span>
                <div className="flex-1 bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden ml-1">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{
                      width: `${
                        (task.checklist.filter((c) => c.done).length / task.checklist.length) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Direct Asset Quick-Links (Unified Academic Neutral Styling) */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {task.assets.overleaf && (
                <a
                  href={task.assets.overleaf}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700/60 transition-colors"
                  title="Overleaf"
                >
                  <FileText className="w-2.5 h-2.5 text-slate-500 dark:text-slate-400" />
                  <span>Overleaf</span>
                  <ExternalLink className="w-2 h-2 opacity-50" />
                </a>
              )}

              {task.assets.github && (
                <a
                  href={task.assets.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700/60 transition-colors"
                  title="GitHub"
                >
                  <GitHubIcon className="w-2.5 h-2.5 text-slate-500 dark:text-slate-400" />
                  <span>GitHub</span>
                  <ExternalLink className="w-2 h-2 opacity-50" />
                </a>
              )}

              {task.assets.dataset && (
                <a
                  href={task.assets.dataset}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700/60 transition-colors"
                  title="Dataset"
                >
                  <Database className="w-2.5 h-2.5 text-slate-500 dark:text-slate-400" />
                  <span>Dataset</span>
                  <ExternalLink className="w-2 h-2 opacity-50" />
                </a>
              )}

              {task.assets.zotero && (
                <a
                  href={task.assets.zotero}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700/60 transition-colors"
                  title="Zotero"
                >
                  <BookOpen className="w-2.5 h-2.5 text-slate-500 dark:text-slate-400" />
                  <span>Zotero</span>
                  <ExternalLink className="w-2 h-2 opacity-50" />
                </a>
              )}
            </div>

            {/* Bottom Row: Authors + Advance Button */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-1.5 text-[10px]">
              <div className="flex items-center gap-1 truncate text-slate-500 dark:text-slate-400">
                <span className="font-medium text-slate-700 dark:text-slate-300">{leadName}</span>
                <span className="text-slate-400 dark:text-slate-600">/</span>
                <span className="text-slate-500 dark:text-slate-400">{piName}</span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveBlockerTask(task);
                  }}
                  className={`p-1 rounded text-xs transition-colors ${
                    task.isBlocked
                      ? 'text-red-500 hover:text-red-600 hover:bg-red-500/20'
                      : 'text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title={language === 'zh' ? '标记/解除卡点' : 'Report/Resolve Blocker'}
                >
                  <Flame className="w-3.5 h-3.5" />
                </button>

                {/* Quick Advance to next stage */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const stageIds = stages.map((s) => s.id);
                    const curIndex = stageIds.indexOf(task.stage);
                    if (curIndex >= 0 && curIndex < stageIds.length - 1) {
                      moveTask(task.id, stageIds[curIndex + 1]);
                    }
                  }}
                  className="p-1 rounded text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title={language === 'zh' ? '推进至下一阶段' : 'Advance Stage'}
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* INLINE DROPDOWN INSPECTOR WINDOW (原板块下方弹出下拉式窗口) */}
          {/* ========================================================================= */}
          {isExpanded && (
            <div className="border-t border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/90 dark:bg-slate-950/90 rounded-b-xl space-y-3.5 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
              <form onSubmit={handleSaveInline} className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30">
                      {task.projectTag}
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">
                      {t.inspector}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedTask(null)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
                    title={language === 'zh' ? '收起' : 'Close'}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Read-only Alert when user is not owner */}
                {!hasEditPermission && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>{t.readOnlyNotice}</span>
                  </div>
                )}

                {/* Editable Title */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    {language === 'zh' ? '论文任务标题' : 'Task Title'}
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Stage & Priority */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      {t.academicStage}
                    </label>
                    <select
                      value={stage}
                      onChange={(e) => setStage(e.target.value as AcademicStage)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200"
                    >
                      {stages.map((s) => (
                        <option key={s.id} value={s.id}>
                          {language === 'zh' ? s.labelZh : s.labelEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      {t.priority}
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as Priority)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200"
                    >
                      <option value="LOW">{language === 'zh' ? '低优先级' : 'Low'}</option>
                      <option value="MEDIUM">{language === 'zh' ? '中优先级' : 'Medium'}</option>
                      <option value="HIGH">{language === 'zh' ? '高优先级' : 'High'}</option>
                      <option value="URGENT">{language === 'zh' ? '紧急关键 (Urgent)' : 'Urgent'}</option>
                    </select>
                  </div>
                </div>

                {/* Start Date & Deadline */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      {t.startDate}
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      {t.endDate}
                    </label>
                    <input
                      type="date"
                      required
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* Progress Slider */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    <span>{t.progress}</span>
                    <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{progress}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={progress}
                    onChange={(e) => setProgress(parseInt(e.target.value))}
                    className="w-full accent-cyan-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded cursor-pointer"
                  />
                </div>

                {/* Lead Author & PI */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      {t.leadAuthor}
                    </label>
                    <select
                      value={leadAuthorId}
                      onChange={(e) => setLeadAuthorId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200"
                    >
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {language === 'zh' ? `${m.nameZh} (${m.titleZh})` : `${m.nameEn} (${m.titleEn})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      PI
                    </label>
                    <select
                      value={piId}
                      onChange={(e) => setPiId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200"
                    >
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {language === 'zh' ? m.nameZh : m.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Methodology & Research Description */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    {t.methodologyDesc}
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={language === 'zh' ? '研究方案、推导步骤与模型架构说明...' : 'Methodology notes and hypotheses...'}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Checklist & Subtasks */}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      {t.checklist}
                    </span>
                    <button
                      type="button"
                      onClick={handleInsertRubric}
                      className="text-[10px] font-medium text-amber-600 dark:text-amber-400 hover:text-amber-500 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{t.insertRubricChecklist}</span>
                    </button>
                  </div>

                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {checklist.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between gap-1.5 p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px]"
                      >
                        <div
                          onClick={() => handleToggleSubtask(c.id)}
                          className="flex items-center gap-1.5 cursor-pointer flex-1 min-w-0"
                        >
                          <input
                            type="checkbox"
                            checked={c.done}
                            onChange={() => {}}
                            className="rounded border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-emerald-500 cursor-pointer"
                          />
                          <span className={`truncate ${c.done ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                            {c.text}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubtask(c.id)}
                          className="text-slate-400 hover:text-rose-500 p-0.5"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add subtask */}
                  <div className="flex gap-1.5 pt-1">
                    <input
                      type="text"
                      value={newSubtaskText}
                      onChange={(e) => setNewSubtaskText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubtask();
                        }
                      }}
                      placeholder={t.addSubtask}
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddSubtask}
                      className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Asset Quick Links Edit */}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-2.5 space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                    {t.assets}
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="url"
                      value={overleaf}
                      onChange={(e) => setOverleaf(e.target.value)}
                      placeholder="Overleaf URL"
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-800 dark:text-slate-200"
                    />
                    <input
                      type="url"
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                      placeholder="GitHub URL"
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-800 dark:text-slate-200"
                    />
                    <input
                      type="url"
                      value={dataset}
                      onChange={(e) => setDataset(e.target.value)}
                      placeholder="Dataset URL"
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-800 dark:text-slate-200"
                    />
                    <input
                      type="url"
                      value={zotero}
                      onChange={(e) => setZotero(e.target.value)}
                      placeholder="Zotero URL"
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* Footer Buttons: Save, Blocker, Delete, Collapse */}
                <div className="flex items-center justify-between gap-1.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                  {hasDeletePermission ? (
                    <button
                      type="button"
                      onClick={handleDeleteTask}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title={t.delete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-1.5">
                    {hasEditPermission && (
                      <button
                        type="button"
                        onClick={() => setActiveBlockerTask(task)}
                        className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 text-xs font-medium transition-colors"
                      >
                        <Flame className="w-3.5 h-3.5 inline mr-1" />
                        {task.isBlocked ? (language === 'zh' ? '解除卡点' : 'Resolve') : (language === 'zh' ? '标记卡点' : 'Blocker')}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedTask(null)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium"
                    >
                      {language === 'zh' ? '收起' : 'Close'}
                    </button>

                    {hasEditPermission && (
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition-all flex items-center gap-1"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{t.save}</span>
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};
