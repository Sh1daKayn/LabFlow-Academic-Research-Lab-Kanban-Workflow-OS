import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { NextRequest } from 'next/server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  buildSlackWebhookPayload,
  buildTeamsAdaptiveCardPayload,
  buildWorkspaceDigestReport,
  DEFAULT_NOTIFICATION_SETTINGS,
  sanitizeNotificationSettings,
  validateWebhookUrl,
} from '@/utils/notificationPayloads';
import { detectNewPersonalAlerts } from '@/utils/desktopNotifications';
import { dispatchWorkspaceEvent } from '@/lib/notificationDispatcher';
import { GET as getNotifConfig, PUT as putNotifConfig } from '@/app/api/notifications/config/route';
import { DEFAULT_STAGES, DEFAULT_VENUES, INITIAL_RESOURCES, LAB_MEMBERS } from '@/data/mockData';
import { DirectRequest, LabMember, LabWorkspaceData, ProjectItem, TaskItem } from '@/types';

describe('Notifications: Webhook Payloads, SSRF Guards & Settings', () => {
  it('validates Microsoft Teams / Slack webhook URLs and blocks loopback or private IPs', () => {
    const teamsWorkflow = validateWebhookUrl(
      'https://prod-14.westus.logic.azure.com:443/workflows/abc123/triggers/manual/paths/invoke'
    );
    expect(teamsWorkflow.valid).toBe(true);
    expect(teamsWorkflow.providerHint).toBe('teams');

    const slackUrl = validateWebhookUrl('https://hooks.slack.com/services/T123/B456/secret789');
    expect(slackUrl.valid).toBe(true);
    expect(slackUrl.providerHint).toBe('slack');

    expect(validateWebhookUrl('http://prod.logic.azure.com/hook').valid).toBe(false);
    expect(validateWebhookUrl('https://localhost:3000/api/test').valid).toBe(false);
    expect(validateWebhookUrl('https://127.0.0.1/hook').valid).toBe(false);
    expect(validateWebhookUrl('https://192.168.1.10/hook').valid).toBe(false);
    expect(validateWebhookUrl('https://169.254.169.254/latest/meta-data').valid).toBe(false);
  });

  it('builds Teams Adaptive Card v1.4 and Slack Block Kit payloads', () => {
    const card = {
      title: 'Blocker Escalation: Stata convergence',
      subtitle: 'Asa escalated to Martin',
      body: 'Fixed effects specification dropped observations.',
      tone: 'danger' as const,
      facts: [
        { name: 'Project', value: 'C1 · VUCA' },
        { name: 'Deadline', value: '2026-12-01' },
      ],
      appUrl: 'https://labflow.example.edu',
    };

    const teamsPayload = buildTeamsAdaptiveCardPayload(card) as {
      type: string;
      attachments: Array<{
        contentType: string;
        content: { type: string; version: string; body: unknown[]; actions?: unknown[] };
      }>;
    };
    expect(teamsPayload.type).toBe('message');
    expect(teamsPayload.attachments[0]?.contentType).toBe('application/vnd.microsoft.card.adaptive');
    expect(teamsPayload.attachments[0]?.content.version).toBe('1.4');
    expect(teamsPayload.attachments[0]?.content.actions).toHaveLength(1);

    const slackPayload = buildSlackWebhookPayload(card) as { text: string; blocks: unknown[] };
    expect(slackPayload.text).toContain('Stata convergence');
    expect(slackPayload.blocks.length).toBeGreaterThanOrEqual(2);
  });

  it('sanitizes master toggles and clamps deadline window bounds', () => {
    const sanitized = sanitizeNotificationSettings({
      enabled: false,
      teams: { enabled: false },
      digest: { deadlineWindowHours: 9999, recipientRoles: ['PI', 'INVALID' as 'PI'] },
    });
    expect(sanitized.enabled).toBe(false);
    expect(sanitized.teams.enabled).toBe(false);
    expect(sanitized.digest.deadlineWindowHours).toBe(336);
    expect(sanitized.digest.recipientRoles).toEqual(['PI']);
  });
});

describe('Scheme D Digest & Privacy Boundaries', () => {
  it('detects overdue / 48h due / PI Review / blocker tasks and excludes private direct requests', () => {
    const piMember: LabMember = {
      ...LAB_MEMBERS[0],
      id: 'm-pi',
      role: 'PI',
      accessRole: 'ADMIN_PI',
      nameEn: 'Dr. PI',
      email: 'pi.real@purdue.edu',
    };
    const pmMember: LabMember = {
      ...LAB_MEMBERS[1],
      id: 'm-pm',
      role: 'SENIOR_PHD',
      accessRole: 'SYS_ADMIN',
      nameEn: 'PM Demo',
      email: 'pm@cablab.edu', // placeholder domain
    };
    const project: ProjectItem = {
      id: 'p-1',
      title: 'Supply Chain Paper',
      targetVenue: 'AJAE',
      tag: 'C1 · SC',
      status: 'DATA_EXP',
      leadAuthorId: pmMember.id,
      piId: piMember.id,
      assets: {},
      visibility: 'PUBLIC',
    };

    const now = new Date('2026-11-17T12:00:00.000Z');
    const tasks: TaskItem[] = [
      {
        id: 't-overdue',
        title: 'Overdue Table',
        stage: 'DATA_EXP',
        projectId: 'p-1',
        projectTag: 'C1 · SC',
        targetVenue: 'AJAE',
        deadline: '2026-11-16',
        leadAuthor: pmMember,
        pi: piMember,
        priority: 'HIGH',
        assets: {},
        isBlocked: false,
        order: 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 't-soon',
        title: 'Due Within 48h Draft',
        stage: 'PI_REVIEW',
        projectId: 'p-1',
        projectTag: 'C1 · SC',
        targetVenue: 'AJAE',
        deadline: '2026-11-18',
        leadAuthor: pmMember,
        pi: piMember,
        priority: 'URGENT',
        assets: {},
        isBlocked: true,
        blocker: {
          category: 'OTHER',
          details: 'Need sign-off',
          tried: 'Re-checked appendix',
          escalatedTo: 'Dr. PI',
          escalatedToId: piMember.id,
          reportedAt: now.toISOString(),
        },
        order: 1,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 't-secret',
        title: 'Secret Confidential Item',
        stage: 'PI_REVIEW',
        projectId: 'p-1',
        projectTag: 'C1 · SC',
        targetVenue: 'AJAE',
        deadline: '2026-11-18',
        leadAuthor: pmMember,
        pi: piMember,
        priority: 'LOW',
        visibility: 'PI_ONLY',
        assets: {},
        isBlocked: false,
        order: 2,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ];

    const directRequests: DirectRequest[] = [
      {
        id: 'req-priv',
        kind: 'CHAT',
        title: 'PRIVATE_SENSITIVE_MATTER_DO_NOT_LEAK',
        content: 'Personal fellowship letter details',
        senderId: pmMember.id,
        recipientId: piMember.id,
        visibility: 'PRIVATE',
        status: 'OPEN',
        replies: [],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 'req-pub',
        kind: 'REVIEW',
        title: 'Cluster 1 Slides Ready',
        content: 'Ready for sync',
        senderId: pmMember.id,
        recipientId: piMember.id,
        visibility: 'PUBLIC',
        status: 'OPEN',
        replies: [],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ];

    const workspace: LabWorkspaceData = {
      stages: DEFAULT_STAGES,
      tasks,
      projects: [project],
      members: [piMember, pmMember],
      venues: DEFAULT_VENUES,
      resources: INITIAL_RESOURCES,
      directRequests,
      notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,
    };

    const report = buildWorkspaceDigestReport(workspace, { now });
    expect(report.stats.overdueCount).toBe(1);
    expect(report.stats.dueSoonCount).toBe(1);
    expect(report.stats.piReviewCount).toBe(1);
    expect(report.stats.blockerCount).toBe(1);
    expect(report.stats.openPublicRequestsCount).toBe(1);
    expect(report.stats.openPrivateRequestsCount).toBe(1);
    expect(report.markdownSummary).not.toContain('PRIVATE_SENSITIVE_MATTER_DO_NOT_LEAK');
    expect(report.markdownSummary).not.toContain('Secret Confidential Item');
    expect(report.emailRecipients.map((r) => r.email)).toEqual(['pi.real@purdue.edu']);
    expect(report.skippedPlaceholderEmails.map((p) => p.email)).toEqual(['pm@cablab.edu']);
  });
});

describe('Scheme C Personal Desktop Notification Diffs', () => {
  it('emits alerts only for new requests, replies, escalations, and assigned todos for currentUserId', () => {
    const m1 = LAB_MEMBERS[0];
    const m2 = LAB_MEMBERS[1];
    const base: LabWorkspaceData = {
      stages: DEFAULT_STAGES,
      tasks: [],
      projects: [],
      members: [m1, m2],
      venues: DEFAULT_VENUES,
      resources: [],
      directRequests: [],
      weeklyTodos: [],
    };

    const next: LabWorkspaceData = {
      ...base,
      directRequests: [
        {
          id: 'r-new',
          kind: 'REVIEW',
          title: 'Please check regression tables',
          content: 'Uploaded updated tables',
          senderId: m2.id,
          recipientId: m1.id,
          visibility: 'PRIVATE',
          status: 'OPEN',
          replies: [],
          createdAt: '2026-11-17T12:00:00Z',
          updatedAt: '2026-11-17T12:00:00Z',
        },
      ],
      weeklyTodos: [
        {
          id: 'todo-new',
          memberId: m1.id,
          weekKey: '2026-W47',
          title: 'Submit IRB amendment',
          done: false,
          acceptanceStatus: 'PENDING',
          assignedById: m2.id,
          createdAt: '2026-11-17T12:00:00Z',
          updatedAt: '2026-11-17T12:00:00Z',
        },
      ],
    };

    const alerts = detectNewPersonalAlerts(base, next, m1.id, 'en');
    expect(alerts).toHaveLength(2);
    expect(alerts.map((a) => a.viewMode)).toEqual(['requests', 'todos']);

    // Sender (m2) should NOT receive self-authored request notification
    expect(detectNewPersonalAlerts(base, next, m2.id, 'en')).toHaveLength(0);
  });
});

describe('Notification Dispatcher Mute & Route Authorization', () => {
  let tempDir = '';
  const prevDataDir = process.env.LABFLOW_DATA_DIR;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'labflow-notif-test-'));
    process.env.LABFLOW_DATA_DIR = tempDir;
  });

  afterAll(async () => {
    if (prevDataDir !== undefined) process.env.LABFLOW_DATA_DIR = prevDataDir;
    else delete process.env.LABFLOW_DATA_DIR;
    if (tempDir) await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('skips outbound webhooks cleanly when master switch is disabled or payload is private', async () => {
    const baseWorkspace: LabWorkspaceData = {
      stages: DEFAULT_STAGES,
      tasks: [],
      projects: [],
      members: LAB_MEMBERS,
      venues: DEFAULT_VENUES,
      resources: [],
      notificationSettings: {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        enabled: false,
      },
    };

    const mutedOutcome = await dispatchWorkspaceEvent({
      workspace: baseWorkspace,
      event: { type: 'blocker', title: 'Blocked', isPrivate: false },
    });
    expect(mutedOutcome.skipped).toBe('master_disabled');

    const privateOutcome = await dispatchWorkspaceEvent({
      workspace: {
        ...baseWorkspace,
        notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,
      },
      event: { type: 'public_request', title: 'Private topic', isPrivate: true },
    });
    expect(privateOutcome.skipped).toBe('private_content_redacted');
  });

  it('requires unlocked admin session to save webhook config and returns masked status', async () => {
    const getRes = await getNotifConfig(new NextRequest('http://localhost:3000/api/notifications/config'));
    expect(getRes.status).toBe(200);
    const getBody = (await getRes.json()) as { status: { hasTeamsWebhook: boolean } };
    expect(getBody.status.hasTeamsWebhook).toBe(false);

    const lockedPutRes = await putNotifConfig(
      new NextRequest('http://localhost:3000/api/notifications/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamsWebhookUrl: 'https://prod.logic.azure.com/workflows/x' }),
      })
    );
    expect(lockedPutRes.status).toBe(403);
  });
});
