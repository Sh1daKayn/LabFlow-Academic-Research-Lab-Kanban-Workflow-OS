'use client';

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ArrowRight,
  CalendarPlus,
  Database,
  GitBranch,
  GitFork,
  History,
  Pencil,
  Plus,
  Sparkles,
  X,
} from 'lucide-react';
import {
  LabMember,
  Language,
  ProjectInheritanceType,
  ProjectItem,
  StageConfig,
  TaskItem,
} from '@/types';
import {
  buildSemesterLineageGraph,
  computeFocusedLineageSet,
  SemesterLineageEdge,
  SemesterNodeRoleBadge,
  suggestNextAcademicTerm,
} from '@/utils/semesterLineage';
import { MemberAvatar } from '@/components/MemberAvatar';
import { getMemberDisplayName } from '@/utils/avatar';

interface SemesterLineageViewProps {
  projects: ProjectItem[];
  tasks: TaskItem[];
  members: LabMember[];
  stages: StageConfig[];
  language: Language;
  onEditProject: (project: ProjectItem) => void;
  onSpinOffProject: (parentProject: ProjectItem, fromTerm: string) => void;
}

interface MeasuredEdgeGeometry {
  edge: SemesterLineageEdge;
  path: string;
  labelX: number;
  labelY: number;
}

function getBadgeMeta(badge: SemesterNodeRoleBadge, isZh: boolean) {
  switch (badge) {
    case 'CARRIED_OVER':
      return {
        label: isZh ? '跨期延续' : 'Carried Over',
        cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      };
    case 'SPINOFF':
      return {
        label: isZh ? '衍生继承' : 'Inherited / Spinoff',
        cls: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
      };
    case 'HANDED_OFF':
      return {
        label: isZh ? '已交接归档' : 'Handed Off',
        cls: 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700',
      };
    default:
      return {
        label: isZh ? '本期立项' : 'New Track',
        cls: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
      };
  }
}

function getInheritanceLabel(
  relationType: ProjectInheritanceType | undefined,
  isZh: boolean
): string {
  if (relationType === 'SPINOFF') return isZh ? '衍生新课题' : 'Spinoff';
  if (relationType === 'METHOD_OR_DATA') return isZh ? '方法/数据继承' : 'Method/Data';
  return isZh ? '延续深化' : 'Continuation';
}

function getSeasonColumnAccent(season: string): string {
  if (season === 'SPRING') {
    return 'border-emerald-500/30 bg-emerald-500/5';
  }
  if (season === 'SUMMER') {
    return 'border-amber-500/30 bg-amber-500/5';
  }
  if (season === 'FALL') {
    return 'border-indigo-500/30 bg-indigo-500/5';
  }
  return 'border-slate-300/60 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-900/40';
}

export const SemesterLineageView: React.FC<SemesterLineageViewProps> = ({
  projects,
  tasks,
  members,
  stages,
  language,
  onEditProject,
  onSpinOffProject,
}) => {
  const isZh = language === 'zh';
  const [showSharedDatasetLinks, setShowSharedDatasetLinks] = useState(true);
  const [extraTerms, setExtraTerms] = useState<string[]>([]);
  const [newTermInput, setNewTermInput] = useState('');
  const [showAddTermForm, setShowAddTermForm] = useState(false);

  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  const [lockedProjectId, setLockedProjectId] = useState<string | null>(null);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const nodeElMapRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const [svgSize, setSvgSize] = useState({ width: 900, height: 480 });
  const [edgeGeometries, setEdgeGeometries] = useState<MeasuredEdgeGeometry[]>([]);

  const graph = useMemo(
    () =>
      buildSemesterLineageGraph(projects, tasks, members, {
        extraTerms,
        showSharedDatasetLinks,
      }),
    [projects, tasks, members, extraTerms, showSharedDatasetLinks]
  );

  const focusedProjectId = hoveredProjectId || lockedProjectId;
  const focusSet = useMemo(
    () => computeFocusedLineageSet(focusedProjectId, graph),
    [focusedProjectId, graph]
  );
  const hasFocus = Boolean(focusedProjectId);

  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const stageById = useMemo(() => new Map(stages.map((s) => [s.id, s])), [stages]);
  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  const suggestedNextTerm = useMemo(() => {
    const lastTerm = graph.columns[graph.columns.length - 1]?.termKey || 'Fall 2026';
    return suggestNextAcademicTerm(lastTerm);
  }, [graph.columns]);

  const measureEdges = useCallback(() => {
    const board = boardRef.current;
    if (!board) return;
    const boardRect = board.getBoundingClientRect();
    const width = Math.max(board.scrollWidth, Math.round(boardRect.width));
    const height = Math.max(board.scrollHeight, Math.round(boardRect.height));

    const measured: MeasuredEdgeGeometry[] = [];
    const nodeOffsetCounter = new Map<string, number>();

    for (const edge of graph.edges) {
      const srcEl = nodeElMapRef.current.get(edge.sourceNodeId);
      const dstEl = nodeElMapRef.current.get(edge.targetNodeId);
      if (!srcEl || !dstEl) continue;

      const sRect = srcEl.getBoundingClientRect();
      const dRect = dstEl.getBoundingClientRect();

      const slotIndex = nodeOffsetCounter.get(edge.sourceNodeId) || 0;
      nodeOffsetCounter.set(edge.sourceNodeId, slotIndex + 1);
      const jitterY = ((slotIndex % 3) - 1) * 10;

      const sLeft = sRect.left - boardRect.left;
      const sRight = sRect.right - boardRect.left;
      const sMidY = sRect.top - boardRect.top + sRect.height / 2 + jitterY;

      const dLeft = dRect.left - boardRect.left;
      const dRight = dRect.right - boardRect.left;
      const dMidY = dRect.top - boardRect.top + dRect.height / 2;

      const isSameColumn = Math.abs(dLeft - sLeft) < 30;
      if (isSameColumn) {
        const arcX = Math.max(sRight, dRight) + 28;
        const path = `M ${sRight} ${sMidY} C ${arcX} ${sMidY}, ${arcX} ${dMidY}, ${dRight + 2} ${dMidY}`;
        measured.push({
          edge,
          path,
          labelX: arcX - 4,
          labelY: (sMidY + dMidY) / 2,
        });
      } else if (dLeft >= sRight) {
        const dx = dLeft - sRight;
        const colSkipLift = dx > 120 ? -24 : 0;
        const ctrlOffset = Math.max(36, dx * 0.45);
        const path = `M ${sRight} ${sMidY} C ${sRight + ctrlOffset} ${
          sMidY + colSkipLift
        }, ${dLeft - ctrlOffset} ${dMidY + colSkipLift}, ${dLeft - 3} ${dMidY}`;
        measured.push({
          edge,
          path,
          labelX: (sRight + dLeft) / 2,
          labelY: (sMidY + dMidY) / 2 + colSkipLift * 0.65,
        });
      } else {
        const ctrlOffset = Math.max(40, (sLeft - dRight) * 0.4);
        const path = `M ${sLeft} ${sMidY} C ${sLeft - ctrlOffset} ${sMidY}, ${
          dRight + ctrlOffset
        } ${dMidY}, ${dRight + 3} ${dMidY}`;
        measured.push({
          edge,
          path,
          labelX: (sLeft + dRight) / 2,
          labelY: (sMidY + dMidY) / 2,
        });
      }
    }

    setSvgSize({ width, height });
    setEdgeGeometries(measured);
  }, [graph]);

  useLayoutEffect(() => {
    measureEdges();
  }, [measureEdges]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measureEdges());
    ro.observe(board);
    window.addEventListener('resize', measureEdges);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measureEdges);
    };
  }, [measureEdges]);

  const handleAddTermColumn = (termValue?: string) => {
    const clean = (termValue ?? newTermInput).trim();
    if (!clean) return;
    setExtraTerms((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
    setNewTermInput('');
    setShowAddTermForm(false);
  };

  const renderEdgePaths = (layerFilter: 'muted' | 'focused') =>
    edgeGeometries.map(({ edge, path }) => {
      const isFocused = !hasFocus || focusSet.activeEdgeIds.has(edge.id);
      if (layerFilter === 'muted' && isFocused) return null;
      if (layerFilter === 'focused' && !isFocused) return null;

      const isHandoff = edge.kind === 'handoff';
      const isDataset = edge.kind === 'shared_dataset';
      const stroke = isHandoff
        ? '#10b981'
        : isDataset
        ? '#8b5cf6'
        : '#6366f1';
      const markerEnd = !isFocused
        ? 'url(#lineage-arrow-muted)'
        : isHandoff
        ? 'url(#lineage-arrow-handoff)'
        : isDataset
        ? 'url(#lineage-arrow-dataset)'
        : 'url(#lineage-arrow-inheritance)';

      return (
        <path
          key={`${layerFilter}-${edge.id}`}
          d={path}
          fill="none"
          stroke={isFocused ? stroke : '#94a3b8'}
          strokeWidth={isFocused ? (isDataset ? 1.8 : 2.5) : 1.4}
          strokeDasharray={isDataset ? '5 4' : undefined}
          strokeOpacity={isFocused ? (hasFocus ? 0.95 : isDataset ? 0.55 : 0.8) : 0.16}
          markerEnd={markerEnd}
        />
      );
    });

  return (
    <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
      {/* Toolbar & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <GitFork className="w-4 h-4 text-indigo-500" />
            <span>
              {isZh
                ? '学期维度 · 项目继承与跨期接力图谱 (Spring -> Summer -> Fall)'
                : 'Semester Lineage Graph (Spring -> Summer -> Fall)'}
            </span>
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {isZh
              ? '按北美高校学期时序展示同项目接力、项目间衍生分叉及共享数据复用；悬停或点击卡片即可追踪完整上下游谱系。'
              : 'Chronological term columns showing cross-term baton handoffs, project-to-project spinoffs, and shared dataset lineage. Hover or click any card to focus.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-[11px] font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showSharedDatasetLinks}
              onChange={(e) => setShowSharedDatasetLinks(e.target.checked)}
              className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
            />
            <Database className="w-3.5 h-3.5 text-violet-500" />
            <span>{isZh ? '同源共享数据连线' : 'Shared Dataset Links'}</span>
          </label>

          <button
            type="button"
            onClick={() => handleAddTermColumn(suggestedNextTerm)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold transition-colors"
            title={isZh ? `添加规划学期列 (${suggestedNextTerm})` : `Add column (${suggestedNextTerm})`}
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            <span>+ {suggestedNextTerm}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddTermForm((v) => !v)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {isZh ? '自定义学期' : 'Custom Term'}
          </button>
        </div>
      </div>

      {/* Legend + Optional Add Custom Term Input + Locked Focus Pill */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex flex-wrap items-center gap-3 text-slate-600 dark:text-slate-300">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-5 h-0.5 bg-emerald-500 inline-block" />
            <span>{isZh ? '同项目跨学期接力' : 'Cross-Term Handoff'}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-5 h-0.5 bg-indigo-500 inline-block" />
            <span>{isZh ? '项目间继承 / 衍生分叉' : 'Project Inheritance / Spinoff'}</span>
          </span>
          {showSharedDatasetLinks && (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-5 border-t-2 border-dashed border-violet-500 inline-block" />
              <span>{isZh ? '同源共享数据集复用' : 'Shared Dataset Reuse'}</span>
            </span>
          )}
        </div>

        {lockedProjectId && (
          <button
            type="button"
            onClick={() => setLockedProjectId(null)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-600 text-white text-[11px] font-semibold"
          >
            <Sparkles className="w-3 h-3" />
            <span>
              {isZh ? '已锁定聚焦：' : 'Focused: '}
              {projectById.get(lockedProjectId)?.tag || lockedProjectId}
            </span>
            <X className="w-3 h-3 ml-0.5" />
          </button>
        )}
      </div>

      {showAddTermForm && (
        <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
          <input
            type="text"
            value={newTermInput}
            onChange={(e) => setNewTermInput(e.target.value)}
            placeholder={
              isZh
                ? '输入学期（如 Summer 2026、Spring 2027 或 2027 春）'
                : 'Enter term (e.g. Summer 2026, Spring 2027)'
            }
            className="flex-1 min-w-[220px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs"
          />
          <button
            type="button"
            onClick={() => handleAddTermColumn()}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
          >
            {isZh ? '添加列' : 'Add Column'}
          </button>
        </div>
      )}

      {/* Chronological Horizontal Swimlanes + SVG Overlay */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
        <div
          ref={boardRef}
          className="relative inline-flex min-w-full items-stretch gap-14 p-5"
        >
          {/* SVG Layer 1: Dimmed background edges */}
          <svg
            className="pointer-events-none absolute inset-0 z-10"
            width={svgSize.width}
            height={svgSize.height}
          >
            <defs>
              <marker
                id="lineage-arrow-handoff"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
              </marker>
              <marker
                id="lineage-arrow-inheritance"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#6366f1" />
              </marker>
              <marker
                id="lineage-arrow-dataset"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#8b5cf6" />
              </marker>
              <marker
                id="lineage-arrow-muted"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#94a3b8" opacity="0.35" />
              </marker>
            </defs>
            {renderEdgePaths('muted')}
          </svg>

          {/* SVG Layer 2: Focused edges rendered cleanly */}
          <svg
            className="pointer-events-none absolute inset-0 z-20"
            width={svgSize.width}
            height={svgSize.height}
          >
            {renderEdgePaths('focused')}
          </svg>

          {/* Midpoint Relation Labels on Focused Edges */}
          <div className="pointer-events-none absolute inset-0 z-30">
            {edgeGeometries.map(({ edge, labelX, labelY }) => {
              const isFocused = !hasFocus || focusSet.activeEdgeIds.has(edge.id);
              if (!isFocused || !edge.label) return null;
              if (!hasFocus && edge.kind === 'shared_dataset') return null;

              const badgeCls =
                edge.kind === 'handoff'
                  ? 'border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/90 text-emerald-700 dark:text-emerald-200'
                  : edge.kind === 'shared_dataset'
                  ? 'border-violet-500/40 bg-violet-50 dark:bg-violet-950/90 text-violet-700 dark:text-violet-200'
                  : 'border-indigo-500/40 bg-indigo-50 dark:bg-indigo-950/90 text-indigo-700 dark:text-indigo-200';

              return (
                <div
                  key={`lbl-${edge.id}`}
                  style={{
                    left: `${labelX}px`,
                    top: `${labelY}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute px-2 py-0.5 rounded-full border text-[10px] font-semibold shadow-xs max-w-[140px] truncate ${badgeCls}`}
                >
                  {edge.kind === 'inheritance'
                    ? getInheritanceLabel(edge.relationType, isZh)
                    : edge.label}
                </div>
              );
            })}
          </div>

          {/* Semester Swimlane Columns */}
          {graph.columns.map((column) => (
            <div
              key={column.termKey}
              className={`relative z-20 w-72 shrink-0 rounded-2xl border p-3 flex flex-col gap-3 ${getSeasonColumnAccent(
                column.parsed.season
              )}`}
            >
              {/* Term Column Header */}
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-800">
                <div>
                  <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                    {column.termKey}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    {column.nodes.length}{' '}
                    {isZh ? '个课题活跃' : column.nodes.length === 1 ? 'project' : 'projects'}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-600 dark:text-slate-300">
                  {column.parsed.season}
                </span>
              </div>

              {column.nodes.length === 0 ? (
                <div className="py-10 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-[11px] text-slate-400">
                  {isZh
                    ? '本学期暂无排期课题；点击其他课题的「+ 衍生」可衔接至此学期。'
                    : 'No projects scheduled in this term yet.'}
                </div>
              ) : (
                column.nodes.map((node) => {
                  const isNodeActive =
                    !hasFocus || focusSet.activeNodeIds.has(node.nodeId);
                  const isPrimaryFocused = focusedProjectId === node.projectId;
                  const badgeMeta = getBadgeMeta(node.badge, isZh);
                  const stageCfg = stageById.get(node.project.status);
                  const parentLinks = node.isFirstTermOfProject
                    ? node.project.inheritedFrom || []
                    : [];

                  return (
                    <div
                      key={node.nodeId}
                      ref={(el) => {
                        if (el) nodeElMapRef.current.set(node.nodeId, el);
                        else nodeElMapRef.current.delete(node.nodeId);
                      }}
                      onMouseEnter={() => setHoveredProjectId(node.projectId)}
                      onMouseLeave={() => setHoveredProjectId(null)}
                      onClick={() =>
                        setLockedProjectId((prev) =>
                          prev === node.projectId ? null : node.projectId
                        )
                      }
                      className={`group rounded-xl border bg-white dark:bg-slate-900 p-3 space-y-2 shadow-sm cursor-pointer transition-all ${
                        isPrimaryFocused
                          ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                          : isNodeActive
                          ? 'border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                          : 'border-slate-200/60 dark:border-slate-800/50 opacity-30'
                      }`}
                    >
                      {/* Top Meta Badges */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1 flex-wrap min-w-0">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 truncate max-w-[100px]">
                            {node.project.tag}
                          </span>
                          <span
                            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${badgeMeta.cls}`}
                          >
                            {badgeMeta.label}
                          </span>
                        </div>

                        <div
                          className="flex items-center gap-1 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => onSpinOffProject(node.project, column.termKey)}
                            className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                            title={
                              isZh
                                ? `从「${node.project.tag}」衍生下学期新课题`
                                : `Spin off child project from ${node.project.tag}`
                            }
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditProject(node.project)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title={isZh ? '编辑项目与继承关系' : 'Edit project & lineage'}
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Title */}
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
                        {node.project.title}
                      </div>

                      {/* Inherited From Parent Badge (if child root in this term) */}
                      {parentLinks.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {parentLinks.map((link) => {
                            const parentProj = projectById.get(link.parentProjectId);
                            if (!parentProj) return null;
                            return (
                              <span
                                key={link.id}
                                title={link.note}
                                className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25"
                              >
                                <GitBranch className="w-2.5 h-2.5 shrink-0" />
                                <span>
                                  {getInheritanceLabel(link.relationType, isZh)}: {parentProj.tag}
                                </span>
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Members owning this project in this semester */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 flex-wrap">
                          {node.entries.map((entry, idx) => {
                            const matched = entry.memberId
                              ? memberById.get(entry.memberId)
                              : undefined;
                            const label = matched
                              ? getMemberDisplayName(matched, language, entry.memberId)
                              : entry.memberName;
                            return (
                              <span
                                key={`${entry.id}-${idx}`}
                                title={[entry.roleLabel, entry.phaseSummary].filter(Boolean).join(' — ')}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] ${
                                  entry.status === 'HANDED_OFF'
                                    ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                    : entry.status === 'CO_LEAD'
                                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300 font-semibold'
                                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-semibold'
                                }`}
                              >
                                {matched && <MemberAvatar member={matched} size="xs" />}
                                <span>{label}</span>
                              </span>
                            );
                          })}
                        </div>

                        {node.entries.some((e) => e.phaseSummary) && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 pl-1.5 border-l-2 border-slate-200 dark:border-slate-800">
                            {node.entries.find((e) => e.phaseSummary)?.phaseSummary}
                          </div>
                        )}
                      </div>

                      {/* Shared Dataset & Footer */}
                      <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-[10px] text-slate-500">
                        <span className="truncate max-w-[140px]">
                          {node.project.sharedDataset ? (
                            <span className="inline-flex items-center gap-1 text-violet-600 dark:text-violet-300">
                              <Database className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{node.project.sharedDataset}</span>
                            </span>
                          ) : stageCfg ? (
                            isZh ? (
                              stageCfg.labelZh
                            ) : (
                              stageCfg.labelEn
                            )
                          ) : (
                            node.project.targetVenue
                          )}
                        </span>
                        <span className="font-mono shrink-0">
                          {node.taskCount} {isZh ? '任务' : 'tasks'} · {node.avgProgress}%
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Footnote */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <History className="w-3.5 h-3.5 text-emerald-500" />
          <span>
            {isZh
              ? '提示：点击卡片上的「+」可基于当前学期课题直接派生下学期子课题/继承项目。'
              : 'Tip: Click "+" on any semester card to spin off a child/inherited project into the next term.'}
          </span>
        </span>
        <span className="flex items-center gap-1 font-mono">
          <ArrowRight className="w-3 h-3" />
          {graph.edges.length} {isZh ? '条继承/数据链路' : 'lineage connections'}
        </span>
      </div>
    </section>
  );
};
