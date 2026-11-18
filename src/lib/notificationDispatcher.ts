import nodemailer from 'nodemailer';
import {
  LabWorkspaceData,
  NotificationEventKind,
} from '@/types';
import {
  buildSlackWebhookPayload,
  buildTeamsAdaptiveCardPayload,
  buildWorkspaceDigestReport,
  NotificationCardInput,
  sanitizeNotificationSettings,
  validateWebhookUrl,
  WorkspaceDigestReport,
} from '@/utils/notificationPayloads';
import {
  getResolvedIntegrationSecrets,
  ResolvedIntegrationSecrets,
} from '@/lib/integrationStore';

export interface ChannelDeliveryResult {
  sent: boolean;
  skipped?: string;
  statusCode?: number;
  error?: string;
}

export interface DispatchOutcome {
  skipped?: string;
  teams: ChannelDeliveryResult;
  slack: ChannelDeliveryResult;
  email?: ChannelDeliveryResult & {
    recipientCount?: number;
    skippedPlaceholders?: number;
  };
}

export interface WorkspaceEventInput {
  type: NotificationEventKind;
  title: string;
  subtitle?: string;
  body?: string;
  actorName?: string;
  targetName?: string;
  projectTag?: string;
  deadline?: string;
  isPrivate?: boolean;
  appUrl?: string;
}

async function postWebhookPayload(
  webhookUrl: string,
  payload: Record<string, unknown>
): Promise<ChannelDeliveryResult> {
  if (!webhookUrl) {
    return { sent: false, skipped: 'not_configured' };
  }
  const validated = validateWebhookUrl(webhookUrl);
  if (!validated.valid || !validated.normalized) {
    return { sent: false, error: validated.reason || 'Invalid webhook URL' };
  }

  try {
    const res = await fetch(validated.normalized, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return {
        sent: false,
        statusCode: res.status,
        error: `HTTP ${res.status}${text ? `: ${text.slice(0, 120)}` : ''}`,
      };
    }
    return { sent: true, statusCode: res.status };
  } catch (err) {
    return {
      sent: false,
      error: err instanceof Error ? err.message : 'Webhook request failed',
    };
  }
}

export async function sendEmailDigestMessage(params: {
  to: string[];
  subject: string;
  text: string;
  html: string;
  secrets: ResolvedIntegrationSecrets;
}): Promise<ChannelDeliveryResult> {
  const { to, subject, text, html, secrets } = params;
  if (to.length === 0) {
    return { sent: false, skipped: 'no_valid_recipients' };
  }

  if (secrets.resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secrets.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: secrets.mailFrom,
          to,
          subject,
          text,
          html,
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        return {
          sent: false,
          statusCode: res.status,
          error: `Resend HTTP ${res.status}${msg ? `: ${msg.slice(0, 160)}` : ''}`,
        };
      }
      return { sent: true, statusCode: res.status };
    } catch (err) {
      return {
        sent: false,
        error: err instanceof Error ? err.message : 'Resend request failed',
      };
    }
  }

  if (secrets.smtpHost && secrets.smtpUser && secrets.smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: secrets.smtpHost,
        port: secrets.smtpPort,
        secure: secrets.smtpSecure,
        auth: {
          user: secrets.smtpUser,
          pass: secrets.smtpPass,
        },
        connectionTimeout: 6000,
        greetingTimeout: 6000,
        socketTimeout: 8000,
      });

      await transporter.sendMail({
        from: secrets.mailFrom,
        to: to.join(', '),
        subject,
        text,
        html,
      });
      return { sent: true, statusCode: 250 };
    } catch (err) {
      return {
        sent: false,
        error: err instanceof Error ? err.message : 'SMTP delivery failed',
      };
    }
  }

  return { sent: false, skipped: 'no_email_transport' };
}

function buildCardFromEvent(event: WorkspaceEventInput, appUrl?: string): NotificationCardInput {
  const tone: NotificationCardInput['tone'] =
    event.type === 'blocker'
      ? 'danger'
      : event.type === 'pi_review'
      ? 'warning'
      : event.type === 'test'
      ? 'good'
      : 'accent';

  const prefix =
    event.type === 'blocker'
      ? '[Blocker Escalation] '
      : event.type === 'pi_review'
      ? '[Ready for PI Review] '
      : event.type === 'public_request'
      ? '[Team Request] '
      : '';

  const facts: Array<{ name: string; value: string }> = [];
  if (event.projectTag) facts.push({ name: 'Project', value: event.projectTag });
  if (event.actorName) facts.push({ name: 'From', value: event.actorName });
  if (event.targetName) facts.push({ name: 'Target / Reviewer', value: event.targetName });
  if (event.deadline) facts.push({ name: 'Deadline', value: event.deadline });

  return {
    title: `${prefix}${event.title}`.slice(0, 140),
    subtitle: event.subtitle,
    body: event.body,
    tone,
    facts,
    appUrl: event.appUrl || appUrl,
    actionLabel: 'Open in LabFlow',
  };
}

/**
 * Dispatches a real-time Teams/Slack Webhook notification while honoring
 * workspace master toggles, trigger toggles, and strict privacy boundaries.
 */
export async function dispatchWorkspaceEvent(params: {
  workspace: LabWorkspaceData;
  event: WorkspaceEventInput;
  secretsOverride?: ResolvedIntegrationSecrets;
}): Promise<DispatchOutcome> {
  const { workspace, event } = params;
  const settings = sanitizeNotificationSettings(workspace.notificationSettings);

  if (!settings.enabled && event.type !== 'test') {
    return {
      skipped: 'master_disabled',
      teams: { sent: false, skipped: 'master_disabled' },
      slack: { sent: false, skipped: 'master_disabled' },
    };
  }

  // Strictly block private 1-on-1 DMs / PI_ONLY tasks from public channel webhooks
  if (event.type !== 'test' && event.isPrivate) {
    return {
      skipped: 'private_content_redacted',
      teams: { sent: false, skipped: 'private_content_redacted' },
      slack: { sent: false, skipped: 'private_content_redacted' },
    };
  }

  const secrets = params.secretsOverride || (await getResolvedIntegrationSecrets());
  const card = buildCardFromEvent(event, secrets.appBaseUrl || undefined);

  const shouldSendTeams =
    settings.teams.enabled &&
    (event.type === 'test' ||
      (event.type === 'blocker' && settings.teams.notifyOnBlocker) ||
      (event.type === 'pi_review' && settings.teams.notifyOnPiReview) ||
      (event.type === 'public_request' && settings.teams.notifyOnPublicRequest));

  const shouldSendSlack =
    settings.slack.enabled &&
    (event.type === 'test' ||
      (event.type === 'blocker' && settings.slack.notifyOnBlocker) ||
      (event.type === 'pi_review' && settings.slack.notifyOnPiReview) ||
      (event.type === 'public_request' && settings.slack.notifyOnPublicRequest));

  const [teamsResult, slackResult] = await Promise.all([
    shouldSendTeams
      ? postWebhookPayload(secrets.teamsWebhookUrl, buildTeamsAdaptiveCardPayload(card))
      : Promise.resolve<ChannelDeliveryResult>({
          sent: false,
          skipped: settings.teams.enabled ? 'trigger_disabled' : 'channel_disabled',
        }),
    shouldSendSlack
      ? postWebhookPayload(secrets.slackWebhookUrl, buildSlackWebhookPayload(card))
      : Promise.resolve<ChannelDeliveryResult>({
          sent: false,
          skipped: settings.slack.enabled ? 'trigger_disabled' : 'channel_disabled',
        }),
  ]);

  return { teams: teamsResult, slack: slackResult };
}

/**
 * Computes and sends the Scheme D Weekly & 48h Deadline Digest across enabled channels
 * (Microsoft Teams, Slack, and/or Resend/SMTP Email).
 */
export async function dispatchWorkspaceDigest(params: {
  workspace: LabWorkspaceData;
  appUrlOverride?: string;
  secretsOverride?: ResolvedIntegrationSecrets;
  now?: Date;
}): Promise<{
  report: WorkspaceDigestReport;
  outcome: DispatchOutcome;
}> {
  const { workspace } = params;
  const settings = sanitizeNotificationSettings(workspace.notificationSettings);
  const secrets = params.secretsOverride || (await getResolvedIntegrationSecrets());
  const appUrl = params.appUrlOverride || secrets.appBaseUrl || undefined;

  const report = buildWorkspaceDigestReport(workspace, {
    now: params.now,
    appUrl,
    extraRecipients: secrets.digestEmailTo,
  });

  if (!settings.enabled || !settings.digest.enabled) {
    const reason = !settings.enabled ? 'master_disabled' : 'digest_disabled';
    return {
      report,
      outcome: {
        skipped: reason,
        teams: { sent: false, skipped: reason },
        slack: { sent: false, skipped: reason },
        email: {
          sent: false,
          skipped: reason,
          recipientCount: report.emailRecipients.length,
          skippedPlaceholders: report.skippedPlaceholderEmails.length,
        },
      },
    };
  }

  const sendTeamsDigest = settings.teams.enabled && settings.teams.notifyOnDigest;
  const sendSlackDigest = settings.slack.enabled && settings.slack.notifyOnDigest;
  const sendEmailDigest = settings.digest.emailEnabled;

  const [teamsResult, slackResult, emailResult] = await Promise.all([
    sendTeamsDigest
      ? postWebhookPayload(
          secrets.teamsWebhookUrl,
          buildTeamsAdaptiveCardPayload(report.teamsCard)
        )
      : Promise.resolve<ChannelDeliveryResult>({ sent: false, skipped: 'channel_disabled' }),
    sendSlackDigest
      ? postWebhookPayload(secrets.slackWebhookUrl, buildSlackWebhookPayload(report.teamsCard))
      : Promise.resolve<ChannelDeliveryResult>({ sent: false, skipped: 'channel_disabled' }),
    sendEmailDigest
      ? sendEmailDigestMessage({
          to: report.emailRecipients.map((r) => r.email),
          subject: report.subject,
          text: report.markdownSummary,
          html: report.htmlEmail,
          secrets,
        })
      : Promise.resolve<ChannelDeliveryResult>({ sent: false, skipped: 'email_disabled' }),
  ]);

  return {
    report,
    outcome: {
      teams: teamsResult,
      slack: slackResult,
      email: {
        ...emailResult,
        recipientCount: report.emailRecipients.length,
        skippedPlaceholders: report.skippedPlaceholderEmails.length,
      },
    },
  };
}
