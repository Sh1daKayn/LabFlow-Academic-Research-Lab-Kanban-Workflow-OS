import { LabMember, LabResource, ProjectItem, TaskItem } from '@/types';

export const subtractDays = (dateStr: string, days: number): string => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
};

export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return 'TBD';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const getDaysRemaining = (deadlineStr?: string): number | null => {
  if (!deadlineStr) return null;
  const target = new Date(deadlineStr).getTime();
  if (isNaN(target)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = target - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const formatCountdownBadge = (deadlineStr?: string) => {
  const days = getDaysRemaining(deadlineStr);
  if (days === null) {
    return {
      text: 'No DDL',
      className: 'bg-slate-800/80 text-slate-400 border-slate-700',
      isUrgent: false,
    };
  }

  if (days < 0) {
    return {
      text: `DDL: ${Math.abs(days)}d past`,
      className: 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-semibold',
      isUrgent: true,
    };
  }
  if (days === 0) {
    return {
      text: 'DDL: Today!',
      className: 'bg-red-500/30 text-red-300 border-red-500/60 animate-pulse font-bold',
      isUrgent: true,
    };
  }
  if (days <= 3) {
    return {
      text: `DDL: ${days}d left`,
      className: 'bg-red-500/20 text-red-300 border-red-500/50 font-bold animate-pulse',
      isUrgent: true,
    };
  }
  if (days <= 14) {
    return {
      text: `DDL: ${days}d left`,
      className: 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-medium',
      isUrgent: false,
    };
  }
  return {
    text: `DDL: ${days}d left`,
    className: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
    isUrgent: false,
  };
};

export const generateMeetingMinutesMarkdown = (params: {
  labName: string;
  piName: string;
  members: LabMember[];
  tasks: TaskItem[];
  projects: ProjectItem[];
  resources: LabResource[];
  selectedMemberId?: string;
}): string => {
  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const memberFilter = params.selectedMemberId && params.selectedMemberId !== 'all'
    ? params.members.find((m) => m.id === params.selectedMemberId)
    : null;

  const relevantTasks = memberFilter
    ? params.tasks.filter((t) => t.leadAuthor.id === memberFilter.id)
    : params.tasks;

  const completed = relevantTasks.filter((t) => t.stage === 'ACCEPTED' || !!t.completedAt);
  const active = relevantTasks.filter((t) => !t.isBlocked && t.stage !== 'ACCEPTED' && !t.completedAt);
  const blockers = relevantTasks.filter((t) => t.isBlocked);

  let md = `# 📝 LabFlow Group Meeting Minutes (组会纪要)\n\n`;
  md += `**Lab / Research Group**: ${params.labName}\n`;
  md += `**Principal Investigator (PI)**: ${params.piName}\n`;
  md += `**Date**: ${todayStr}\n`;
  md += `**Focus Scope**: ${memberFilter ? `${memberFilter.name} (${memberFilter.title})` : 'All Lab Members (全员)'}\n`;
  md += `**Attendees**: ${params.members.map((m) => `${m.name} [${m.role}]`).join(', ')}\n\n`;

  md += `---\n\n`;

  // Section 1: Critical Blockers Requiring PI Decision
  md += `## 🔥 1. Critical Blockers Requiring PI Decision (核心卡点与导师求助)\n`;
  if (blockers.length === 0) {
    md += `*No active blockers reported across the pipeline. All tracks progressing normally.*\n\n`;
  } else {
    blockers.forEach((t, i) => {
      md += `### ${i + 1}. [${t.projectTag}] ${t.title}\n`;
      md += `- **Lead Author**: ${t.leadAuthor.name} (${t.leadAuthor.role}) | **PI**: ${t.pi.name}\n`;
      md += `- **Target Venue & DDL**: ${t.targetVenue} (${formatCountdownBadge(t.deadline).text})\n`;
      md += `- **Blocker Category**: \`${t.blocker?.category || 'GENERAL'}\`\n`;
      md += `- **Where is it stuck?**: ${t.blocker?.details || 'N/A'}\n`;
      md += `- **What has been tried?**: ${t.blocker?.tried || 'N/A'}\n`;
      md += `- **Escalate to / Decision Needed from**: **${t.blocker?.escalatedTo || t.pi.name}**\n\n`;
    });
  }

  // Section 2: Active & In-Progress Pipeline
  md += `## ⚡ 2. Active & In-Progress Research Pipeline (当前在研进展)\n`;
  if (active.length === 0) {
    md += `*No active in-progress tasks under current filter.*\n\n`;
  } else {
    active.forEach((t) => {
      md += `- **[${t.stage}]** \`${t.projectTag}\`: **${t.title}**\n`;
      md += `  - Lead: ${t.leadAuthor.name} | DDL: ${formatDate(t.deadline)} (${formatCountdownBadge(t.deadline).text})\n`;
      if (t.assets.overleaf || t.assets.github) {
        const links = [];
        if (t.assets.overleaf) links.push(`[Overleaf](${t.assets.overleaf})`);
        if (t.assets.github) links.push(`[GitHub](${t.assets.github})`);
        if (t.assets.dataset) links.push(`[Dataset](${t.assets.dataset})`);
        md += `  - Assets: ${links.join(' · ')}\n`;
      }
    });
    md += `\n`;
  }

  // Section 3: Completed Recently & Accepted
  md += `## ✅ 3. Recently Completed Milestones & Publications (近期成果与录用)\n`;
  if (completed.length === 0) {
    md += `*No recently archived tasks in this cycle.*\n\n`;
  } else {
    completed.forEach((t) => {
      md += `- 🏆 **[${t.projectTag}] ${t.title}**\n`;
      md += `  - Target: ${t.targetVenue} | Lead: ${t.leadAuthor.name}\n`;
      if (t.assets.github || t.assets.overleaf) {
        md += `  - Artifacts: ${[t.assets.overleaf && `[Paper](${t.assets.overleaf})`, t.assets.github && `[Code](${t.assets.github})`].filter(Boolean).join(' | ')}\n`;
      }
    });
    md += `\n`;
  }

  // Section 4: Shared Compute & Lab Resources
  md += `## 🖥️ 4. Compute & Shared Lab Resource Status (算力与公共设施状态)\n`;
  params.resources.forEach((r) => {
    md += `- **${r.name}**: \`${r.status}\`${r.currentUser ? ` (Occupied by ${r.currentUser} - ${r.currentJob || 'Active'}, ${r.remainingHours || 0}h remaining)` : ' (Available for scheduling)'}\n`;
  });

  md += `\n---\n*Generated automatically by LabFlow OS at ${new Date().toISOString()}*\n`;

  return md;
};
