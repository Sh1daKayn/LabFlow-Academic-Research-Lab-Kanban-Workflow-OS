import { LabMember, LabResource, Language, ProjectItem, StageConfig, TaskItem } from '@/types';

export const subtractDays = (dateStr: string, days: number): string => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
};

export const formatDate = (dateStr?: string, lang: Language = 'zh'): string => {
  if (!dateStr) return lang === 'zh' ? '待定' : 'TBD';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  if (lang === 'zh') {
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  }
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

export const formatCountdownBadge = (deadlineStr?: string, lang: Language = 'zh') => {
  const days = getDaysRemaining(deadlineStr);
  if (days === null) {
    return {
      text: lang === 'zh' ? '无截稿期' : 'No DDL',
      className: 'bg-slate-800/80 text-slate-400 border-slate-700',
      isUrgent: false,
    };
  }

  if (days < 0) {
    return {
      text: lang === 'zh' ? `逾期 ${Math.abs(days)} 天` : `DDL: ${Math.abs(days)}d past`,
      className: 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-semibold',
      isUrgent: true,
    };
  }
  if (days === 0) {
    return {
      text: lang === 'zh' ? '今日截止!' : 'DDL: Today!',
      className: 'bg-red-500/30 text-red-300 border-red-500/60 animate-pulse font-bold',
      isUrgent: true,
    };
  }
  if (days <= 3) {
    return {
      text: lang === 'zh' ? `剩余 ${days} 天` : `DDL: ${days}d left`,
      className: 'bg-red-500/20 text-red-300 border-red-500/50 font-bold animate-pulse',
      isUrgent: true,
    };
  }
  if (days <= 14) {
    return {
      text: lang === 'zh' ? `剩余 ${days} 天` : `DDL: ${days}d left`,
      className: 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-medium',
      isUrgent: false,
    };
  }
  return {
    text: lang === 'zh' ? `剩余 ${days} 天` : `DDL: ${days}d left`,
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
  stages: StageConfig[];
  selectedMemberId?: string;
  lang?: Language;
}): string => {
  const lang = params.lang || 'zh';
  const isZh = lang === 'zh';

  const todayStr = isZh
    ? new Date().toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      })
    : new Date().toLocaleDateString('en-US', {
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

  const getMemberName = (m: LabMember) => (isZh ? m.nameZh : m.nameEn);
  const getStageName = (stageId: string) => {
    const s = params.stages.find((x) => x.id === stageId);
    if (!s) return stageId;
    return isZh ? s.labelZh : s.labelEn;
  };

  let md = isZh
    ? `# 📝 LabFlow 学术课题组会议纪要\n\n`
    : `# 📝 LabFlow Group Meeting Minutes\n\n`;

  md += isZh
    ? `**实验室 / 课题组**: ${params.labName}\n`
    : `**Lab / Research Group**: ${params.labName}\n`;

  md += isZh
    ? `**导师 / 课题组负责人**: ${params.piName}\n`
    : `**Principal Investigator (PI)**: ${params.piName}\n`;

  md += isZh ? `**会议日期**: ${todayStr}\n` : `**Date**: ${todayStr}\n`;

  md += isZh
    ? `**汇报范围**: ${memberFilter ? `${getMemberName(memberFilter)} (${isZh ? memberFilter.titleZh : memberFilter.titleEn})` : '全实验室成员'}\n`
    : `**Focus Scope**: ${memberFilter ? `${getMemberName(memberFilter)} (${memberFilter.titleEn})` : 'All Lab Members'}\n`;

  md += isZh
    ? `**参会人员**: ${params.members.map((m) => `${getMemberName(m)} [${m.role}]`).join(', ')}\n\n`
    : `**Attendees**: ${params.members.map((m) => `${getMemberName(m)} [${m.role}]`).join(', ')}\n\n`;

  md += `---\n\n`;

  // Section 1: Critical Blockers
  md += isZh
    ? `## 🔥 1. 核心技术卡点与导师决断 (Critical Blockers Requiring Decision)\n`
    : `## 🔥 1. Critical Blockers Requiring PI Decision\n`;

  if (blockers.length === 0) {
    md += isZh
      ? `*全流程未见受阻卡点，各项课题均平稳推进中。*\n\n`
      : `*No active blockers reported across the pipeline. All tracks progressing normally.*\n\n`;
  } else {
    blockers.forEach((t, i) => {
      md += `### ${i + 1}. [${t.projectTag}] ${t.title}\n`;
      md += isZh
        ? `- **第一作者 / 负责人**: ${getMemberName(t.leadAuthor)} | **导师**: ${getMemberName(t.pi)}\n`
        : `- **Lead Author**: ${getMemberName(t.leadAuthor)} | **PI**: ${getMemberName(t.pi)}\n`;
      md += isZh
        ? `- **目标会议/期刊与截稿期**: ${t.targetVenue} (${formatCountdownBadge(t.deadline, lang).text})\n`
        : `- **Target Venue & DDL**: ${t.targetVenue} (${formatCountdownBadge(t.deadline, lang).text})\n`;
      md += isZh
        ? `- **卡点类别**: \`${t.blocker?.category || 'GENERAL'}\`\n`
        : `- **Blocker Category**: \`${t.blocker?.category || 'GENERAL'}\`\n`;
      md += isZh
        ? `- **技术卡死细节**: ${t.blocker?.details || '无'}\n`
        : `- **Where is it stuck?**: ${t.blocker?.details || 'N/A'}\n`;
      md += isZh
        ? `- **已尝试解法**: ${t.blocker?.tried || '无'}\n`
        : `- **What has been tried?**: ${t.blocker?.tried || 'N/A'}\n`;
      md += isZh
        ? `- **求助决断对象**: **${t.blocker?.escalatedTo || getMemberName(t.pi)}**\n\n`
        : `- **Escalate to / Decision Needed from**: **${t.blocker?.escalatedTo || getMemberName(t.pi)}**\n\n`;
    });
  }

  // Section 2: Active & In-Progress Pipeline
  md += isZh
    ? `## ⚡ 2. 正在推进的学术研发项目 (Active Research Pipeline)\n`
    : `## ⚡ 2. Active & In-Progress Research Pipeline\n`;

  if (active.length === 0) {
    md += isZh
      ? `*当前筛选条件下暂无进行中的课题任务。*\n\n`
      : `*No active in-progress tasks under current filter.*\n\n`;
  } else {
    active.forEach((t) => {
      md += `- **[${getStageName(t.stage)}]** \`${t.projectTag}\`: **${t.title}**\n`;
      md += isZh
        ? `  - 负责人: ${getMemberName(t.leadAuthor)} | 截稿: ${formatDate(t.deadline, lang)} (${formatCountdownBadge(t.deadline, lang).text}) | 进度: ${t.progress || 0}%\n`
        : `  - Lead: ${getMemberName(t.leadAuthor)} | DDL: ${formatDate(t.deadline, lang)} (${formatCountdownBadge(t.deadline, lang).text}) | Progress: ${t.progress || 0}%\n`;
      if (t.assets.overleaf || t.assets.github) {
        const links = [];
        if (t.assets.overleaf) links.push(`[Overleaf](${t.assets.overleaf})`);
        if (t.assets.github) links.push(`[GitHub](${t.assets.github})`);
        if (t.assets.dataset) links.push(`[Dataset](${t.assets.dataset})`);
        md += `  - ${isZh ? '科研资产' : 'Assets'}: ${links.join(' · ')}\n`;
      }
    });
    md += `\n`;
  }

  // Section 3: Completed Recently
  md += isZh
    ? `## ✅ 3. 近期结项与发表录用成果 (Completed & Accepted Publications)\n`
    : `## ✅ 3. Recently Completed Milestones & Publications\n`;

  if (completed.length === 0) {
    md += isZh
      ? `*本周期暂无新归档的录用成果。*\n\n`
      : `*No recently archived tasks in this cycle.*\n\n`;
  } else {
    completed.forEach((t) => {
      md += `- 🏆 **[${t.projectTag}] ${t.title}**\n`;
      md += isZh
        ? `  - 目标会议: ${t.targetVenue} | 负责人: ${getMemberName(t.leadAuthor)}\n`
        : `  - Target: ${t.targetVenue} | Lead: ${getMemberName(t.leadAuthor)}\n`;
    });
    md += `\n`;
  }

  // Section 4: Compute status
  md += isZh
    ? `## 🖥️ 4. 公共算力与基础设施状态 (Compute Infrastructure Status)\n`
    : `## 🖥️ 4. Compute & Shared Lab Resource Status\n`;

  params.resources.forEach((r) => {
    const resName = isZh ? r.nameZh : r.nameEn;
    const statusText = isZh
      ? r.status === 'OCCUPIED'
        ? `运行中 (${r.currentUser} 占用 - ${r.currentJob || '计算任务'}, 剩余 ${r.remainingHours || 0} 小时)`
        : r.status === 'IDLE'
        ? '空闲可用'
        : '已预约'
      : r.status === 'OCCUPIED'
      ? `Occupied by ${r.currentUser} (${r.currentJob || 'Batch training'}, ${r.remainingHours || 0}h remaining)`
      : r.status === 'IDLE'
      ? 'Idle / Available'
      : 'Reserved';

    md += `- **${resName}**: \`${statusText}\`\n`;
  });

  md += isZh
    ? `\n---\n*由 LabFlow 学术操作系统自动生成于 ${new Date().toISOString()}*\n`
    : `\n---\n*Generated automatically by LabFlow OS at ${new Date().toISOString()}*\n`;

  return md;
};
