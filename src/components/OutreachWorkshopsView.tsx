'use client';

import React, { useMemo, useState } from 'react';
import { ProjectItem, WorkshopTranslationStatus } from '@/types';
import { useLabFlow } from '@/context/LabFlowContext';
import {
  OUTREACH_STATUS_META,
  WORKSHOP_TRANSLATION_STATUSES,
} from '@/utils/outreachTracks';
import { getProjectMembers } from '@/utils/projectAnalytics';
import { resolveVenueUrl } from '@/utils/venues';
import { formatCountdownBadge, formatDate } from '@/utils/date';
import {
  WORK_CATEGORY_META,
  getWorkCategoryLabel,
  resolveProjectWorkCategory,
} from '@/utils/workCategory';
import { MemberAvatar } from '@/components/MemberAvatar';
import {
  ArrowRight,
  Calendar,
  ExternalLink,
  FolderKanban,
  Pencil,
  Plus,
  Presentation,
  Sparkles,
  X,
} from 'lucide-react';

interface OutreachWorkshopsViewProps {
  projects: ProjectItem[];
  onEditProject: (project: ProjectItem) => void;
}

/**
 * Reverse schedule & translational outreach workspace grouped by configurable lab outreach tracks
 * (seminars, industry/clinical partners, teaching modules, policy briefs, or open-source releases).
 */
export const OutreachWorkshopsView: React.FC<OutreachWorkshopsViewProps> = ({
  projects,
  onEditProject,
}) => {
  const {
    tasks,
    members,
    venues,
    stages,
    outreachTracks,
    addOutreachTrack,
    removeOutreachTrack,
    language,
    updateProject,
    setSelectedWorkshopFilter,
    setSelectedProjectFilter,
    setViewMode,
  } = useLabFlow();

  const isZh = language === 'zh';
  const [programFilter, setProgramFilter] = useState<string>('ALL');
  const [showAddTrack, setShowAddTrack] = useState(false);
  const [newTrackInput, setNewTrackInput] = useState('');

  const configuredSet = useMemo(
    () => new Set(outreachTracks.map((tr) => tr.trim()).filter(Boolean)),
    [outreachTracks]
  );

  const programBuckets = useMemo(() => {
    const customPrograms = new Set<string>(outreachTracks);
    projects.forEach((p) => {
      (p.workshopPrograms || []).forEach((prog) => {
        if (prog.trim()) customPrograms.add(prog.trim());
      });
    });

    const buckets = Array.from(customPrograms).map((programName) => {
      const linked = projects
        .filter((p) => (p.workshopPrograms || []).includes(programName))
        .sort((a, b) => {
          const da = a.workshopTargetDate || a.submissionDeadline || '9999-12-31';
          const db = b.workshopTargetDate || b.submissionDeadline || '9999-12-31';
          return da.localeCompare(db);
        });
      const earliestTarget = linked
        .map((p) => p.workshopTargetDate)
        .filter((d): d is string => Boolean(d))
        .sort()[0];
      return {
        name: programName,
        projects: linked,
        earliestTarget,
      };
    });

    const unlinked = projects.filter(
      (p) => !p.workshopPrograms || p.workshopPrograms.length === 0
    );

    return { buckets, unlinked };
  }, [projects, outreachTracks]);

  const stats = useMemo(() => {
    const linked = projects.filter((p) => (p.workshopPrograms || []).length > 0);
    const inPrep = linked.filter((p) => p.workshopTranslationStatus === 'IN_PREP').length;
    const ready = linked.filter((p) => p.workshopTranslationStatus === 'WORKSHOP_READY').length;
    const presented = linked.filter((p) => p.workshopTranslationStatus === 'PRESENTED').length;
    return {
      linkedCount: linked.length,
      inPrep,
      ready,
      presented,
    };
  }, [projects]);

  const visibleBuckets = useMemo(() => {
    if (programFilter === 'UNLINKED') return [];
    if (programFilter === 'ALL') {
      return programBuckets.buckets.filter((b) => b.projects.length > 0);
    }
    return programBuckets.buckets.filter((b) => b.name === programFilter);
  }, [programBuckets, programFilter]);

  const openBoardForTrack = (trackName: string, projectId?: string) => {
    setSelectedWorkshopFilter(trackName);
    setSelectedProjectFilter(projectId || 'all');
    setViewMode('kanban');
  };

  const handleCreateTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTrackInput.trim();
    if (!trimmed) return;
    addOutreachTrack(trimmed);
    setNewTrackInput('');
    setShowAddTrack(false);
    setProgramFilter(trimmed);
  };

  return (
    <section className="space-y-5 animate-in fade-in duration-150">
      {/* Outreach & Translation Overview Header */}
      <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Presentation className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {isZh
                  ? '研究成果转化与外联排期 (Outreach & Workshops)'
                  : 'Outreach, Workshops & Translational Schedule'}
              </h2>
              <button
                type="button"
                onClick={() => setShowAddTrack((v) => !v)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 dark:bg-slate-900 border border-indigo-500/35 text-[10px] font-semibold text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Plus className="w-2.5 h-2.5" />
                <span>{isZh ? '自定义转化渠道' : 'Customize Tracks'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {isZh
                ? '按实验室自定义的研讨会、产业/临床合作、教学课程或开源出口查看研究课题的转化进度，并可反向一键跳转到任务看板。'
                : 'Group research projects by your lab’s outreach workshops, industry/clinical partners, teaching modules, or open-source releases, track delivery dates, and filter tasks directly.'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-[11px] font-semibold">
            <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100">
              {stats.linkedCount} {isZh ? '关联课题' : 'Linked Projects'}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300">
              {stats.inPrep} {isZh ? '筹备中' : 'In Prep'}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300">
              {stats.ready} {isZh ? '已就绪' : 'Ready'}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white border border-indigo-500/40">
              {stats.presented} {isZh ? '已落地' : 'Delivered'}
            </span>
          </div>
        </div>

        {/* Custom Track Manager Bar */}
        {showAddTrack && (
          <form
            onSubmit={handleCreateTrack}
            className="p-3 rounded-xl bg-white/95 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={newTrackInput}
                onChange={(e) => setNewTrackInput(e.target.value)}
                placeholder={
                  isZh
                    ? '输入新渠道名称 (例如：年度学术年会 / 临床伦理培训 / 工业合作演示)...'
                    : 'New outreach track name (e.g. Clinical Grand Rounds, GitHub Tooling, MBA Case)...'
                }
                className="flex-1 min-w-[220px] bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shrink-0"
              >
                {isZh ? '添加渠道' : 'Add Track'}
              </button>
            </div>

            {outreachTracks.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                <span className="text-slate-500">
                  {isZh ? '已配置列表：' : 'Configured tracks:'}
                </span>
                {outreachTracks.map((tr) => (
                  <span
                    key={tr}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                  >
                    <span>{tr}</span>
                    {outreachTracks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          removeOutreachTrack(tr);
                          if (programFilter === tr) setProgramFilter('ALL');
                        }}
                        className="text-slate-400 hover:text-rose-500"
                        title={isZh ? '移除该预设渠道' : 'Remove preset track'}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
          </form>
        )}

        {/* Reverse Filter Program Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setProgramFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors ${
              programFilter === 'ALL'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-500/40'
            }`}
          >
            {isZh
              ? `全部已关联渠道 (${programBuckets.buckets.filter((b) => b.projects.length > 0).length})`
              : `All Active Tracks (${programBuckets.buckets.filter((b) => b.projects.length > 0).length})`}
          </button>
          {programBuckets.buckets.map((bucket) => {
            const isSelected = programFilter === bucket.name;
            const hasLinked = bucket.projects.length > 0;
            const isCustomTag = !configuredSet.has(bucket.name);
            return (
              <button
                key={bucket.name}
                type="button"
                onClick={() => setProgramFilter(bucket.name)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-500 font-semibold shadow-xs'
                    : hasLinked
                    ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-indigo-500/40'
                    : 'bg-white/60 dark:bg-slate-900/60 text-slate-400 border-dashed border-slate-300 dark:border-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {bucket.name} ({bucket.projects.length})
                {isCustomTag ? '*' : ''}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setProgramFilter('UNLINKED')}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
              programFilter === 'UNLINKED'
                ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-700'
                : 'bg-white/70 dark:bg-slate-900/70 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-400'
            }`}
          >
            {isZh
              ? `未关联渠道 (${programBuckets.unlinked.length})`
              : `Unlinked Projects (${programBuckets.unlinked.length})`}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {programFilter === 'UNLINKED' ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isZh
                ? '尚未关联转化/外联渠道的课题'
                : 'Research Projects Without an Assigned Outreach Track'}
            </h3>
            <span className="text-[11px] text-slate-400">
              {isZh
                ? '点击编辑即可挂载至工作坊、合作方或教学模块'
                : 'Assign any track by editing the project'}
            </span>
          </div>
          {programBuckets.unlinked.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              {isZh
                ? '所有研究课题均已关联至少一个转化渠道。'
                : 'All active projects are linked to at least one outreach track.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {programBuckets.unlinked.map((proj) => (
                <div
                  key={proj.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">
                        {proj.tag}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {proj.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {proj.targetVenue}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onEditProject(proj)}
                    className="shrink-0 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold"
                  >
                    {isZh ? '关联渠道' : 'Link Track'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : visibleBuckets.length === 0 ? (
        <div className="p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-xs text-slate-500">
          {isZh
            ? '当前没有课题关联至此渠道，编辑任意课题即可绑定。'
            : 'No research projects are currently linked to this track. Edit any project to assign it.'}
        </div>
      ) : (
        <div className="space-y-4">
          {visibleBuckets.map((bucket) => {
            const earliestCountdown = bucket.earliestTarget
              ? formatCountdownBadge(bucket.earliestTarget, language)
              : null;
            return (
              <div
                key={bucket.name}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
              >
                {/* Track Header */}
                <div className="px-4 py-3 bg-slate-50/90 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
                      <Presentation className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {bucket.name}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                        <span>
                          {bucket.projects.length}{' '}
                          {isZh ? '个关联课题' : 'linked research projects'}
                        </span>
                        {bucket.earliestTarget && (
                          <>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1 font-medium text-indigo-600 dark:text-indigo-400">
                              <Calendar className="w-3 h-3" />
                              {isZh ? '最近排期：' : 'Next target: '}
                              {formatDate(bucket.earliestTarget, language)}
                            </span>
                          </>
                        )}
                        {earliestCountdown && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full border ${earliestCountdown.className}`}
                          >
                            {earliestCountdown.text}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {bucket.projects.length > 0 && (
                    <button
                      type="button"
                      onClick={() => openBoardForTrack(bucket.name)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <FolderKanban className="w-3.5 h-3.5" />
                      <span>
                        {isZh ? '在看板查看关联任务' : 'View Track Tasks on Board'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Linked Research Rows */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {bucket.projects.map((proj) => {
                    const pMembers = getProjectMembers(proj, tasks, members);
                    const projTasks = tasks.filter((t) => t.projectId === proj.id);
                    const blockedCount = projTasks.filter((t) => t.isBlocked).length;
                    const venueUrl = resolveVenueUrl(
                      proj.targetVenue,
                      venues,
                      proj.targetVenueUrl
                    );
                    const wCat = resolveProjectWorkCategory(proj);
                    const stageCfg = stages.find((s) => s.id === proj.status);
                    const translationStatus: WorkshopTranslationStatus =
                      proj.workshopTranslationStatus || 'NOT_STARTED';
                    const tMeta = OUTREACH_STATUS_META[translationStatus];
                    const targetCountdown = proj.workshopTargetDate
                      ? formatCountdownBadge(proj.workshopTargetDate, language)
                      : null;

                    return (
                      <div
                        key={proj.id}
                        className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-950/40 transition-colors"
                      >
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${WORK_CATEGORY_META[wCat].badgeClass}`}
                            >
                              {getWorkCategoryLabel(wCat, language, true)}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">
                              {proj.tag}
                            </span>
                            {stageCfg && (
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${stageCfg.color}`}
                              >
                                {isZh ? stageCfg.labelZh : stageCfg.labelEn}
                              </span>
                            )}
                            {venueUrl ? (
                              <a
                                href={venueUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-0.5 text-[10px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                              >
                                <span>{proj.targetVenue}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-400">{proj.targetVenue}</span>
                            )}
                            {proj.workshopTargetDate && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                                <Calendar className="w-2.5 h-2.5" />
                                {isZh ? '目标日期：' : 'Target Date: '}
                                {formatDate(proj.workshopTargetDate, language)}
                              </span>
                            )}
                            {targetCountdown && (
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-full border ${targetCountdown.className}`}
                              >
                                {targetCountdown.text}
                              </span>
                            )}
                          </div>

                          <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                            {proj.title}
                          </div>

                          {proj.researchQuestion && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {isZh ? '核心研究问题：' : 'RQ:'}
                              </span>{' '}
                              {proj.researchQuestion}
                            </p>
                          )}

                          <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                            <div className="flex -space-x-1.5">
                              {pMembers.slice(0, 5).map((mem) => (
                                <MemberAvatar key={mem.id} member={mem} size="xs" />
                              ))}
                            </div>
                            <span className="text-[10px] text-slate-500">
                              {pMembers
                                .map((mem) => (isZh ? mem.nameZh : mem.nameEn))
                                .join(', ')}
                            </span>
                            {blockedCount > 0 && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                                {blockedCount}{' '}
                                {isZh ? '个卡点' : `blocker${blockedCount > 1 ? 's' : ''}`}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap shrink-0">
                          {/* Translation Readiness Status Selector */}
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            <select
                              data-status-select="true"
                              aria-label={`Translation status for ${proj.title}`}
                              value={translationStatus}
                              onChange={(e) =>
                                updateProject(proj.id, {
                                  workshopTranslationStatus:
                                    e.target.value as WorkshopTranslationStatus,
                                })
                              }
                              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold focus:outline-none cursor-pointer ${tMeta.badgeClass}`}
                            >
                              {WORKSHOP_TRANSLATION_STATUSES.map((st) => (
                                <option
                                  key={st}
                                  value={st}
                                  className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                                >
                                  {isZh
                                    ? OUTREACH_STATUS_META[st].labelZh
                                    : OUTREACH_STATUS_META[st].labelEn}
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() => openBoardForTrack(bucket.name, proj.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 hover:border-indigo-500 text-[11px] font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                          >
                            <span>
                              {isZh ? `任务 (${projTasks.length})` : `Tasks (${projTasks.length})`}
                            </span>
                            <ArrowRight className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onEditProject(proj)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title={isZh ? '编辑转化关联与课题详情' : 'Edit outreach link & project details'}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
