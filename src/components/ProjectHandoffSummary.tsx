'use client';

import React from 'react';
import { ArrowRight, Database, GitBranch, HelpCircle, History } from 'lucide-react';
import { LabMember, Language, ProjectHandoffStatus, ProjectItem } from '@/types';
import { MemberAvatar } from '@/components/MemberAvatar';

interface ProjectHandoffSummaryProps {
  project: ProjectItem;
  language: Language;
  members?: LabMember[];
  allProjects?: ProjectItem[];
  compact?: boolean;
}

const HANDOFF_BADGE_STYLES: Record<ProjectHandoffStatus, string> = {
  HANDED_OFF:
    'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  ACTIVE:
    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-semibold',
  CO_LEAD:
    'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30 font-semibold',
};

/**
 * Shared read-only summary showing a project's Research Question, Shared Dataset,
 * and Cross-Term Baton Handoff Timeline uniformly across project cards, tree nodes, and task drawers.
 */
export const ProjectHandoffSummary: React.FC<ProjectHandoffSummaryProps> = ({
  project,
  language,
  members = [],
  allProjects = [],
  compact = false,
}) => {
  const isZh = language === 'zh';
  const hasQuestion = Boolean(project.researchQuestion?.trim());
  const hasDataset = Boolean(project.sharedDataset?.trim());
  const handoffs = Array.isArray(project.handoffHistory) ? project.handoffHistory : [];
  const inheritedFrom = Array.isArray(project.inheritedFrom) ? project.inheritedFrom : [];
  if (!hasQuestion && !hasDataset && handoffs.length === 0 && inheritedFrom.length === 0) {
    return null;
  }

  const memberById = new Map(members.map((m) => [m.id, m]));
  const projectById = new Map(allProjects.map((p) => [p.id, p]));

  return (
    <div className={compact ? 'space-y-1.5 text-[10px]' : 'space-y-2 text-[11px]'}>
      {hasQuestion && (
        <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300 leading-snug">
          <HelpCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
          <span className={compact ? 'line-clamp-2' : ''}>
            <strong className="font-semibold text-slate-700 dark:text-slate-200">RQ: </strong>
            {project.researchQuestion}
          </span>
        </div>
      )}

      {(hasDataset || inheritedFrom.length > 0) && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {hasDataset && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/25 font-medium">
              <Database className="w-3 h-3 shrink-0" />
              <span>
                {isZh ? '共享数据：' : 'Dataset: '}
                {project.sharedDataset}
              </span>
            </span>
          )}
          {inheritedFrom.map((link) => {
            const parent = projectById.get(link.parentProjectId);
            const relLabel =
              link.relationType === 'SPINOFF'
                ? isZh
                  ? '衍生自'
                  : 'Spinoff of'
                : link.relationType === 'METHOD_OR_DATA'
                ? isZh
                  ? '复用方法/数据'
                  : 'Builds on'
                : isZh
                ? '延续自'
                : 'Continues';
            return (
              <span
                key={link.id}
                title={link.note}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25 font-medium"
              >
                <GitBranch className="w-3 h-3 shrink-0" />
                <span>
                  {relLabel}: {parent?.tag || link.parentProjectId}
                  {link.fromTerm ? ` (${link.fromTerm})` : ''}
                </span>
              </span>
            );
          })}
        </div>
      )}

      {handoffs.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            <History className="w-3 h-3" />
            <span>{isZh ? '跨期接力时间线' : 'Cross-Term Handoff'}</span>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {handoffs.map((entry, idx) => {
              const matchedMember = entry.memberId ? memberById.get(entry.memberId) : undefined;
              const statusLabel =
                entry.status === 'HANDED_OFF'
                  ? isZh
                    ? '已交接'
                    : 'Handed Off'
                  : entry.status === 'CO_LEAD'
                  ? isZh
                    ? '联合主责'
                    : 'Co-Lead'
                  : isZh
                  ? '本期主责'
                  : 'Active';
              const tooltip = [entry.roleLabel, statusLabel, entry.phaseSummary]
                .filter(Boolean)
                .join(' — ');

              return (
                <React.Fragment key={entry.id}>
                  {idx > 0 && <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />}
                  <span
                    title={tooltip}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border ${HANDOFF_BADGE_STYLES[entry.status]}`}
                  >
                    {matchedMember && <MemberAvatar member={matchedMember} size="xs" />}
                    <span>{entry.memberName}</span>
                    <span className="opacity-75">({entry.term})</span>
                  </span>
                </React.Fragment>
              );
            })}
          </div>
          {!compact &&
            handoffs.some((h) => Boolean(h.phaseSummary)) && (
              <div className="pl-2 border-l-2 border-slate-200 dark:border-slate-800 space-y-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                {handoffs.map(
                  (entry) =>
                    entry.phaseSummary && (
                      <div key={`${entry.id}-note`}>
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          {entry.term} ({entry.memberName}):{' '}
                        </span>
                        <span>{entry.phaseSummary}</span>
                      </div>
                    )
                )}
              </div>
            )}
        </div>
      )}
    </div>
  );
};
