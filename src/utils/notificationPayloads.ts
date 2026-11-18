import {
  LabMember,
  LabWorkspaceData,
  NotificationSettings,
  ProjectItem,
  TaskItem,
} from '@/types';
import { deriveAccessRole } from '@/utils/rbac';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  teams: {
    enabled: true,
    notifyOnBlocker: true,
    notifyOnPiReview: true,
    notifyOnPublicRequest: true,
    notifyOnDigest: true,
  },
  slack: {
    enabled: true,
    notifyOnBlocker: true,
    notifyOnPiReview: true,
    notifyOnPublicRequest: true,
    notifyOnDigest: true,
  },
  digest: {
    enabled: true,
    emailEnabled: true,
    deadlineWindowHours: 48,
    includePiReview: true,
    includeBlockers: true,
    includeOpenRequests: true,
    recipientRoles: ['PI', 'SYS_ADMIN'],
  },
};

const VALID_DIGEST_ROLES = new Set<'PI' | 'SYS_ADMIN' | 'PROJECT_LEAD'>([
  'PI',
  'SYS_ADMIN',
  'PROJECT_LEAD',
]);

export function sanitizeNotificationSettings(input?: unknown): NotificationSettings {
  const raw = (input && typeof input === 'object' ? input : {}) as Partial<NotificationSettings>;
  const rawTeams = (raw.teams && typeof raw.teams === 'object' ? raw.teams : {}) as Partial<
    NotificationSettings['teams']
  >;
  const rawSlack = (raw.slack && typeof raw.slack === 'object' ? raw.slack : {}) as Partial<
    NotificationSettings['slack']
  >;
  const rawDigest = (raw.digest && typeof raw.digest === 'object' ? raw.digest : {}) as Partial<
    NotificationSettings['digest']
  >;

  const rawWindow = Number(rawDigest.deadlineWindowHours);
  const deadlineWindowHours = Number.isFinite(rawWindow)
    ? Math.max(12, Math.min(336, Math.round(rawWindow)))
    : DEFAULT_NOTIFICATION_SETTINGS.digest.deadlineWindowHours;

  const recipientRoles = Array.isArray(rawDigest.recipientRoles)
    ? Array.from(
        new Set(
          rawDigest.recipientRoles.filter(
            (r): r is 'PI' | 'SYS_ADMIN' | 'PROJECT_LEAD' => VALID_DIGEST_ROLES.has(r)
          )
        )
      )
    : [...DEFAULT_NOTIFICATION_SETTINGS.digest.recipientRoles];

  return {
    enabled:
      typeof raw.enabled === 'boolean' ? raw.enabled : DEFAULT_NOTIFICATION_SETTINGS.enabled,
    teams: {
      enabled:
        typeof rawTeams.enabled === 'boolean'
          ? rawTeams.enabled
          : DEFAULT_NOTIFICATION_SETTINGS.teams.enabled,
      notifyOnBlocker:
        typeof rawTeams.notifyOnBlocker === 'boolean'
          ? rawTeams.notifyOnBlocker
          : DEFAULT_NOTIFICATION_SETTINGS.teams.notifyOnBlocker,
      notifyOnPiReview:
        typeof rawTeams.notifyOnPiReview === 'boolean'
          ? rawTeams.notifyOnPiReview
          : DEFAULT_NOTIFICATION_SETTINGS.teams.notifyOnPiReview,
      notifyOnPublicRequest:
        typeof rawTeams.notifyOnPublicRequest === 'boolean'
          ? rawTeams.notifyOnPublicRequest
          : DEFAULT_NOTIFICATION_SETTINGS.teams.notifyOnPublicRequest,
      notifyOnDigest:
        typeof rawTeams.notifyOnDigest === 'boolean'
          ? rawTeams.notifyOnDigest
          : DEFAULT_NOTIFICATION_SETTINGS.teams.notifyOnDigest,
    },
    slack: {
      enabled:
        typeof rawSlack.enabled === 'boolean'
          ? rawSlack.enabled
          : DEFAULT_NOTIFICATION_SETTINGS.slack.enabled,
      notifyOnBlocker:
        typeof rawSlack.notifyOnBlocker === 'boolean'
          ? rawSlack.notifyOnBlocker
          : DEFAULT_NOTIFICATION_SETTINGS.slack.notifyOnBlocker,
      notifyOnPiReview:
        typeof rawSlack.notifyOnPiReview === 'boolean'
          ? rawSlack.notifyOnPiReview
          : DEFAULT_NOTIFICATION_SETTINGS.slack.notifyOnPiReview,
      notifyOnPublicRequest:
        typeof rawSlack.notifyOnPublicRequest === 'boolean'
          ? rawSlack.notifyOnPublicRequest
          : DEFAULT_NOTIFICATION_SETTINGS.slack.notifyOnPublicRequest,
      notifyOnDigest:
        typeof rawSlack.notifyOnDigest === 'boolean'
          ? rawSlack.notifyOnDigest
          : DEFAULT_NOTIFICATION_SETTINGS.slack.notifyOnDigest,
    },
    digest: {
      enabled:
        typeof rawDigest.enabled === 'boolean'
          ? rawDigest.enabled
          : DEFAULT_NOTIFICATION_SETTINGS.digest.enabled,
      emailEnabled:
        typeof rawDigest.emailEnabled === 'boolean'
          ? rawDigest.emailEnabled
          : DEFAULT_NOTIFICATION_SETTINGS.digest.emailEnabled,
      deadlineWindowHours,
      includePiReview:
        typeof rawDigest.includePiReview === 'boolean'
          ? rawDigest.includePiReview
          : DEFAULT_NOTIFICATION_SETTINGS.digest.includePiReview,
      includeBlockers:
        typeof rawDigest.includeBlockers === 'boolean'
          ? rawDigest.includeBlockers
          : DEFAULT_NOTIFICATION_SETTINGS.digest.includeBlockers,
      includeOpenRequests:
        typeof rawDigest.includeOpenRequests === 'boolean'
          ? rawDigest.includeOpenRequests
          : DEFAULT_NOTIFICATION_SETTINGS.digest.includeOpenRequests,
      recipientRoles:
        recipientRoles.length > 0
          ? recipientRoles
          : [...DEFAULT_NOTIFICATION_SETTINGS.digest.recipientRoles],
    },
  };
}

function isPrivateOrLoopbackHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host === '::1' ||
    host.startsWith('fe80:') ||
    host.startsWith('fc') ||
    host.startsWith('fd')
  ) {
    return true;
  }
  const ipv4Match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!ipv4Match) return false;
  const [, aStr, bStr] = ipv4Match;
  const a = Number(aStr);
  const b = Number(bStr);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

/**
 * Validates external webhook URLs (HTTPS only, rejecting loopback/RFC1918 addresses to prevent SSRF).
 */
export function validateWebhookUrl(rawUrl: string): {
  valid: boolean;
  normalized?: string;
  reason?: string;
  providerHint?: 'teams' | 'slack' | 'generic';
} {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { valid: false, reason: 'Webhook URL is empty' };
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') {
      return { valid: false, reason: 'Webhook URL must use https://' };
    }
    if (isPrivateOrLoopbackHostname(parsed.hostname)) {
      return { valid: false, reason: 'Private or loopback webhook hosts are not allowed' };
    }
    const lowerHost = parsed.hostname.toLowerCase();
    const providerHint =
      lowerHost.includes('logic.azure.com') ||
      lowerHost.includes('webhook.office') ||
      lowerHost.includes('office365') ||
      lowerHost.includes('powerautomate')
        ? 'teams'
        : lowerHost.includes('hooks.slack.com') || lowerHost.includes('slack-gov.com')
        ? 'slack'
        : 'generic';

    return {
      valid: true,
      normalized: parsed.toString(),
      providerHint,
    };
  } catch {
    return { valid: false, reason: 'Malformed webhook URL' };
  }
}

export function maskSecretValue(value?: string): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    const tail = trimmed.slice(-6);
    return `${parsed.protocol}//${parsed.hostname}/••••${tail}`;
  } catch {
    if (trimmed.length <= 6) return '••••';
    return `••••${trimmed.slice(-4)}`;
  }
}

export interface NotificationCardInput {
  title: string;
  subtitle?: string;
  body?: string;
  tone?: 'accent' | 'warning' | 'danger' | 'good';
  facts?: Array<{ name: string; value: string }>;
  appUrl?: string;
  actionLabel?: string;
}

/**
 * Builds an Adaptive Card payload compatible with both Microsoft Teams Workflows
 * ("Post to a channel when a webhook request is received") and legacy Teams Incoming Webhooks.
 */
export function buildTeamsAdaptiveCardPayload(card: NotificationCardInput): Record<string, unknown> {
  const toneColor =
    card.tone === 'danger'
      ? 'Attention'
      : card.tone === 'warning'
      ? 'Warning'
      : card.tone === 'good'
      ? 'Good'
      : 'Accent';

  const bodyBlocks: Array<Record<string, unknown>> = [
    {
      type: 'TextBlock',
      text: card.title,
      weight: 'Bolder',
      size: 'Medium',
      color: toneColor,
      wrap: true,
    },
  ];

  if (card.subtitle) {
    bodyBlocks.push({
      type: 'TextBlock',
      text: card.subtitle,
      isSubtle: true,
      spacing: 'None',
      wrap: true,
    });
  }

  if (card.body) {
    bodyBlocks.push({
      type: 'TextBlock',
      text: card.body,
      wrap: true,
      spacing: 'Small',
    });
  }

  const nonEmptyFacts = (card.facts || []).filter((f) => f.name && f.value);
  if (nonEmptyFacts.length > 0) {
    bodyBlocks.push({
      type: 'FactSet',
      facts: nonEmptyFacts.map((f) => ({ title: f.name, value: f.value })),
      spacing: 'Medium',
    });
  }

  const actions = card.appUrl
    ? [
        {
          type: 'Action.OpenUrl',
          title: card.actionLabel || 'Open LabFlow',
          url: card.appUrl,
        },
      ]
    : [];

  return {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        contentUrl: null,
        content: {
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          type: 'AdaptiveCard',
          version: '1.4',
          body: bodyBlocks,
          ...(actions.length > 0 ? { actions } : {}),
        },
      },
    ],
  };
}

/**
 * Builds a clean Slack Incoming Webhook Block Kit payload.
 */
export function buildSlackWebhookPayload(card: NotificationCardInput): Record<string, unknown> {
  const factLines = (card.facts || [])
    .filter((f) => f.name && f.value)
    .map((f) => `• *${f.name}:* ${f.value}`)
    .join('\n');

  const blocks: Array<Record<string, unknown>> = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: card.title.slice(0, 150),
        emoji: true,
      },
    },
  ];

  const mrkdwnParts = [card.subtitle, card.body, factLines].filter(Boolean);
  if (mrkdwnParts.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: mrkdwnParts.join('\n\n').slice(0, 2900),
      },
    });
  }

  if (card.appUrl) {
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `<${card.appUrl}|${card.actionLabel || 'Open LabFlow'}>`,
        },
      ],
    });
  }

  return {
    text: `${card.title}${card.subtitle ? ` — ${card.subtitle}` : ''}`,
    blocks,
  };
}

const PLACEHOLDER_EMAIL_DOMAINS = ['@cablab.edu', '@labflow.edu', '@lab.edu', '@example.com'];

export function isPlaceholderEmail(email?: string): boolean {
  if (!email) return true;
  const lower = email.trim().toLowerCase();
  if (!lower.includes('@')) return true;
  return PLACEHOLDER_EMAIL_DOMAINS.some((domain) => lower.endsWith(domain));
}

export function resolveDigestEmailRecipients(
  members: LabMember[],
  roles: NotificationSettings['digest']['recipientRoles']
): {
  realEmails: Array<{ member: LabMember; email: string }>;
  placeholderEmails: Array<{ member: LabMember; email: string }>;
} {
  const realEmails: Array<{ member: LabMember; email: string }> = [];
  const placeholderEmails: Array<{ member: LabMember; email: string }> = [];
  const seen = new Set<string>();

  for (const member of members) {
    const role = deriveAccessRole(member);
    const matches =
      (roles.includes('PI') && (role === 'ADMIN_PI' || member.role === 'PI')) ||
      (roles.includes('SYS_ADMIN') && role === 'SYS_ADMIN') ||
      (roles.includes('PROJECT_LEAD') && role === 'PROJECT_LEAD');

    if (!matches) continue;
    const email = (member.email || '').trim();
    if (!email || !email.includes('@')) continue;
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    if (isPlaceholderEmail(email)) {
      placeholderEmails.push({ member, email });
    } else {
      realEmails.push({ member, email });
    }
  }

  return { realEmails, placeholderEmails };
}

function parseDeadlineEndOfDayMs(deadline?: string): number | null {
  if (!deadline) return null;
  const trimmed = deadline.trim();
  if (!trimmed) return null;
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    ? `${trimmed}T23:59:59.000Z`
    : trimmed;
  const ms = Date.parse(normalized);
  return Number.isNaN(ms) ? null : ms;
}

export interface DigestTaskSummary {
  id: string;
  title: string;
  projectTag: string;
  leadName: string;
  stage: string;
  deadline: string;
  hoursRemaining: number | null;
  blockerDetails?: string;
}

export interface WorkspaceDigestReport {
  generatedAt: string;
  deadlineWindowHours: number;
  stats: {
    overdueCount: number;
    dueSoonCount: number;
    piReviewCount: number;
    blockerCount: number;
    openPublicRequestsCount: number;
    openPrivateRequestsCount: number;
    submittedTodosCount: number;
  };
  overdueTasks: DigestTaskSummary[];
  dueSoonTasks: DigestTaskSummary[];
  piReviewTasks: DigestTaskSummary[];
  blockedTasks: DigestTaskSummary[];
  publicRequests: Array<{ id: string; title: string; recipientName: string; kind: string }>;
  emailRecipients: Array<{ name: string; email: string }>;
  skippedPlaceholderEmails: Array<{ name: string; email: string }>;
  subject: string;
  markdownSummary: string;
  htmlEmail: string;
  teamsCard: NotificationCardInput;
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function summarizeTask(
  task: TaskItem,
  nowMs: number,
  projectMap: Map<string, ProjectItem>
): DigestTaskSummary {
  const deadlineMs = parseDeadlineEndOfDayMs(task.deadline);
  const hoursRemaining =
    deadlineMs !== null ? Math.round(((deadlineMs - nowMs) / 3600000) * 10) / 10 : null;
  const project = projectMap.get(task.projectId);
  return {
    id: task.id,
    title: task.title,
    projectTag: task.projectTag || project?.tag || 'Lab',
    leadName: task.leadAuthor?.nameEn || 'Unassigned',
    stage: task.stage,
    deadline: task.deadline || '',
    hoursRemaining,
    blockerDetails: task.blocker?.details,
  };
}

/**
 * Computes the Scheme D Weekly & 48h Deadline Digest from authoritative workspace data.
 * Never leaks PRIVATE direct-request text or PI_ONLY confidential items into public channel payloads.
 */
export function buildWorkspaceDigestReport(
  workspace: LabWorkspaceData,
  options?: {
    now?: Date;
    appUrl?: string;
    extraRecipients?: string[];
  }
): WorkspaceDigestReport {
  const now = options?.now || new Date();
  const nowMs = now.getTime();
  const settings = sanitizeNotificationSettings(workspace.notificationSettings);
  const windowHours = settings.digest.deadlineWindowHours;
  const projectMap = new Map(workspace.projects.map((p) => [p.id, p]));
  const memberMap = new Map(workspace.members.map((m) => [m.id, m]));

  const activeTasks = workspace.tasks.filter(
    (t) => t.stage !== 'ACCEPTED' && !t.completedAt && t.visibility !== 'PI_ONLY'
  );

  const overdueTasks: DigestTaskSummary[] = [];
  const dueSoonTasks: DigestTaskSummary[] = [];
  const piReviewTasks: DigestTaskSummary[] = [];
  const blockedTasks: DigestTaskSummary[] = [];

  for (const task of activeTasks) {
    const summary = summarizeTask(task, nowMs, projectMap);
    if (summary.hoursRemaining !== null) {
      if (summary.hoursRemaining < 0) {
        overdueTasks.push(summary);
      } else if (summary.hoursRemaining <= windowHours) {
        dueSoonTasks.push(summary);
      }
    }
    if (settings.digest.includePiReview && task.stage === 'PI_REVIEW') {
      piReviewTasks.push(summary);
    }
    if (settings.digest.includeBlockers && task.isBlocked) {
      blockedTasks.push(summary);
    }
  }

  const unresolvedRequests = (workspace.directRequests || []).filter(
    (r) => r.status !== 'RESOLVED'
  );
  const publicRequests = settings.digest.includeOpenRequests
    ? unresolvedRequests
        .filter((r) => r.visibility === 'PUBLIC')
        .map((r) => ({
          id: r.id,
          title: r.title,
          recipientName: memberMap.get(r.recipientId)?.nameEn || r.recipientId,
          kind: r.kind,
        }))
    : [];
  const openPrivateRequestsCount = settings.digest.includeOpenRequests
    ? unresolvedRequests.filter((r) => r.visibility !== 'PUBLIC').length
    : 0;

  const submittedTodosCount = (workspace.weeklyTodos || []).filter(
    (w) => w.acceptanceStatus === 'SUBMITTED'
  ).length;

  const resolvedRecipients = resolveDigestEmailRecipients(
    workspace.members,
    settings.digest.recipientRoles
  );

  const emailRecipients = resolvedRecipients.realEmails.map((r) => ({
    name: r.member.nameEn,
    email: r.email,
  }));

  if (options?.extraRecipients) {
    const existing = new Set(emailRecipients.map((r) => r.email.toLowerCase()));
    for (const extra of options.extraRecipients) {
      const clean = extra.trim();
      if (clean && clean.includes('@') && !existing.has(clean.toLowerCase())) {
        existing.add(clean.toLowerCase());
        emailRecipients.push({ name: 'Configured Recipient', email: clean });
      }
    }
  }

  const dateLabel = now.toISOString().slice(0, 10);
  const subject = `[LabFlow Digest · ${dateLabel}] ${overdueTasks.length} Overdue · ${dueSoonTasks.length} Due <=${windowHours}h · ${blockedTasks.length} Blockers · ${piReviewTasks.length} PI Review`;

  const formatList = (items: DigestTaskSummary[], emptyMsg: string) =>
    items.length === 0
      ? `_${emptyMsg}_`
      : items
          .slice(0, 8)
          .map(
            (item) =>
              `- **[${item.projectTag}]** ${item.title} (${item.leadName}${
                item.deadline ? ` · DDL ${item.deadline}` : ''
              })`
          )
          .join('\n');

  const mdSections = [
    `## LabFlow Digest Summary (${dateLabel})`,
    '',
    `### Overdue Tasks (${overdueTasks.length})`,
    formatList(overdueTasks, 'No overdue tasks'),
    '',
    `### Upcoming Deadlines <= ${windowHours}h (${dueSoonTasks.length})`,
    formatList(dueSoonTasks, `No tasks due within ${windowHours} hours`),
    '',
    `### Waiting for PI Review (${piReviewTasks.length})`,
    formatList(piReviewTasks, 'No tasks waiting in PI Review'),
    '',
    `### Active Technical Blockers (${blockedTasks.length})`,
    formatList(blockedTasks, 'No active blockers'),
  ];

  if (settings.digest.includeOpenRequests) {
    mdSections.push(
      '',
      `### Open Requests`,
      `- Public Requests: ${publicRequests.length}`,
      `- Private 1-on-1 Requests (check in LabFlow): ${openPrivateRequestsCount}`,
      `- Weekly To-Dos awaiting review: ${submittedTodosCount}`
    );
  }

  if (options?.appUrl) {
    mdSections.push('', `[Open LabFlow Workspace](${options.appUrl})`);
  }

  const markdownSummary = mdSections.join('\n');

  const renderHtmlList = (items: DigestTaskSummary[], emptyMsg: string) =>
    items.length === 0
      ? `<p style="color:#64748b;font-size:13px;margin:4px 0;">${escapeHtml(emptyMsg)}</p>`
      : `<ul style="margin:6px 0 12px 18px;padding:0;font-size:13px;color:#1e293b;">${items
          .slice(0, 10)
          .map(
            (i) =>
              `<li style="margin:4px 0;"><strong>[${escapeHtml(i.projectTag)}]</strong> ${escapeHtml(
                i.title
              )} <span style="color:#64748b;">(${escapeHtml(i.leadName)}${
                i.deadline ? ` · DDL ${escapeHtml(i.deadline)}` : ''
              })</span></li>`
          )
          .join('')}</ul>`;

  const htmlEmail = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:640px;margin:0 auto;padding:20px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;">
      <h2 style="margin:0 0 6px;color:#0f172a;font-size:18px;">LabFlow Scheduled Research Digest (${escapeHtml(
        dateLabel
      )})</h2>
      <p style="margin:0 0 16px;color:#475569;font-size:13px;">Deadline lookahead window: ${windowHours} hours</p>
      <h3 style="margin:14px 0 4px;color:#be123c;font-size:14px;">Overdue (${overdueTasks.length})</h3>
      ${renderHtmlList(overdueTasks, 'No overdue tasks.')}
      <h3 style="margin:14px 0 4px;color:#b45309;font-size:14px;">Due Within ${windowHours}h (${dueSoonTasks.length})</h3>
      ${renderHtmlList(dueSoonTasks, `No tasks due within ${windowHours}h.`)}
      <h3 style="margin:14px 0 4px;color:#4f46e5;font-size:14px;">Waiting on PI Review (${piReviewTasks.length})</h3>
      ${renderHtmlList(piReviewTasks, 'No items in PI Review.')}
      <h3 style="margin:14px 0 4px;color:#9f1239;font-size:14px;">Active Blockers (${blockedTasks.length})</h3>
      ${renderHtmlList(blockedTasks, 'No blockers reported.')}
      <p style="margin:14px 0 4px;font-size:13px;color:#334155;">Open Requests: <strong>${
        publicRequests.length
      }</strong> public · <strong>${openPrivateRequestsCount}</strong> private 1-on-1 · Weekly To-Dos awaiting review: <strong>${submittedTodosCount}</strong></p>
      ${
        options?.appUrl
          ? `<div style="margin-top:18px;"><a href="${escapeHtml(
              options.appUrl
            )}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:9px 16px;border-radius:8px;font-size:13px;font-weight:600;">Open LabFlow</a></div>`
          : ''
      }
    </div>
  `.trim();

  const urgentLines = [
    ...overdueTasks.slice(0, 3).map((t) => `• [OVERDUE] [${t.projectTag}] ${t.title} (${t.leadName})`),
    ...dueSoonTasks.slice(0, 3).map((t) => `• [DUE <=${windowHours}h] [${t.projectTag}] ${t.title} (${t.leadName})`),
    ...blockedTasks.slice(0, 3).map((t) => `• [BLOCKER] [${t.projectTag}] ${t.title} (${t.leadName})`),
    ...piReviewTasks.slice(0, 3).map((t) => `• [PI REVIEW] [${t.projectTag}] ${t.title} (${t.leadName})`),
  ];

  const teamsCard: NotificationCardInput = {
    title: `LabFlow Weekly / ${windowHours}h Digest (${dateLabel})`,
    subtitle: `${overdueTasks.length} Overdue · ${dueSoonTasks.length} Due <=${windowHours}h · ${blockedTasks.length} Blockers · ${piReviewTasks.length} PI Review`,
    body:
      urgentLines.length > 0
        ? urgentLines.join('\n')
        : 'All tracked milestones are on schedule with no blockers or imminent deadlines.',
    tone:
      overdueTasks.length > 0 || blockedTasks.length > 0
        ? 'danger'
        : dueSoonTasks.length > 0 || piReviewTasks.length > 0
        ? 'warning'
        : 'good',
    facts: [
      { name: 'PI Review Queue', value: String(piReviewTasks.length) },
      { name: 'Active Blockers', value: String(blockedTasks.length) },
      {
        name: 'Open Requests',
        value: `${publicRequests.length} public / ${openPrivateRequestsCount} private`,
      },
      { name: 'To-Dos Submitted', value: String(submittedTodosCount) },
    ],
    appUrl: options?.appUrl,
    actionLabel: 'Open LabFlow',
  };

  return {
    generatedAt: now.toISOString(),
    deadlineWindowHours: windowHours,
    stats: {
      overdueCount: overdueTasks.length,
      dueSoonCount: dueSoonTasks.length,
      piReviewCount: piReviewTasks.length,
      blockerCount: blockedTasks.length,
      openPublicRequestsCount: publicRequests.length,
      openPrivateRequestsCount,
      submittedTodosCount,
    },
    overdueTasks,
    dueSoonTasks,
    piReviewTasks,
    blockedTasks,
    publicRequests,
    emailRecipients,
    skippedPlaceholderEmails: resolvedRecipients.placeholderEmails.map((p) => ({
      name: p.member.nameEn,
      email: p.email,
    })),
    subject,
    markdownSummary,
    htmlEmail,
    teamsCard,
  };
}
