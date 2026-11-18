import fs from 'fs/promises';
import path from 'path';
import { maskSecretValue, validateWebhookUrl } from '@/utils/notificationPayloads';

export interface SavedIntegrationSecrets {
  teamsWebhookUrl?: string;
  slackWebhookUrl?: string;
  resendApiKey?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  mailFrom?: string;
  digestEmailTo?: string;
  appBaseUrl?: string;
  updatedAt?: string;
}

export interface ResolvedIntegrationSecrets {
  teamsWebhookUrl: string;
  teamsSource: 'env' | 'saved' | 'unset';
  slackWebhookUrl: string;
  slackSource: 'env' | 'saved' | 'unset';
  resendApiKey: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  mailFrom: string;
  digestEmailTo: string[];
  appBaseUrl: string;
  cronSecret: string;
}

export interface MaskedIntegrationStatus {
  hasTeamsWebhook: boolean;
  teamsMasked: string;
  teamsSource: 'env' | 'saved' | 'unset';
  hasSlackWebhook: boolean;
  slackMasked: string;
  slackSource: 'env' | 'saved' | 'unset';
  hasEmailTransport: boolean;
  emailProvider: 'resend' | 'smtp' | 'none';
  mailFrom: string;
  digestEmailTo: string;
  hasCronSecret: boolean;
  appBaseUrl: string;
  updatedAt?: string;
}

let writeChain: Promise<unknown> = Promise.resolve();
function withIntegrationLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = writeChain.then(fn, fn);
  writeChain = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

function getIntegrationFilePath(): string {
  const baseDir = process.env.LABFLOW_DATA_DIR || path.join(process.cwd(), '.data');
  return path.join(baseDir, 'labflow-integrations.json');
}

async function readSavedSecrets(): Promise<SavedIntegrationSecrets> {
  try {
    const raw = await fs.readFile(getIntegrationFilePath(), 'utf8');
    const parsed = JSON.parse(raw) as SavedIntegrationSecrets;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function writeSavedSecrets(next: SavedIntegrationSecrets): Promise<void> {
  const filePath = getIntegrationFilePath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(next, null, 2), 'utf8');
  await fs.rename(tmpPath, filePath);
}

export async function getResolvedIntegrationSecrets(): Promise<ResolvedIntegrationSecrets> {
  const saved = await readSavedSecrets();

  const envTeams = (process.env.LABFLOW_TEAMS_WEBHOOK_URL || process.env.TEAMS_WEBHOOK_URL || '').trim();
  const savedTeams = (saved.teamsWebhookUrl || '').trim();
  const teamsWebhookUrl = envTeams || savedTeams;
  const teamsSource: ResolvedIntegrationSecrets['teamsSource'] = envTeams
    ? 'env'
    : savedTeams
    ? 'saved'
    : 'unset';

  const envSlack = (process.env.LABFLOW_SLACK_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL || '').trim();
  const savedSlack = (saved.slackWebhookUrl || '').trim();
  const slackWebhookUrl = envSlack || savedSlack;
  const slackSource: ResolvedIntegrationSecrets['slackSource'] = envSlack
    ? 'env'
    : savedSlack
    ? 'saved'
    : 'unset';

  const resendApiKey = (
    process.env.LABFLOW_RESEND_API_KEY ||
    process.env.RESEND_API_KEY ||
    saved.resendApiKey ||
    ''
  ).trim();

  const smtpHost = (process.env.SMTP_HOST || saved.smtpHost || '').trim();
  const rawPort = Number(process.env.SMTP_PORT || saved.smtpPort || 587);
  const smtpPort = Number.isFinite(rawPort) && rawPort > 0 ? rawPort : 587;
  const envSecure = process.env.SMTP_SECURE;
  const smtpSecure =
    envSecure !== undefined
      ? envSecure === 'true' || envSecure === '1'
      : typeof saved.smtpSecure === 'boolean'
      ? saved.smtpSecure
      : smtpPort === 465;
  const smtpUser = (process.env.SMTP_USER || saved.smtpUser || '').trim();
  const smtpPass = (process.env.SMTP_PASS || saved.smtpPass || '').trim();
  const mailFrom = (
    process.env.LABFLOW_MAIL_FROM ||
    process.env.MAIL_FROM ||
    saved.mailFrom ||
    smtpUser ||
    'LabFlow <onboarding@resend.dev>'
  ).trim();

  const rawExtraEmails = (
    process.env.LABFLOW_DIGEST_EMAIL_TO ||
    saved.digestEmailTo ||
    ''
  ).trim();
  const digestEmailTo = rawExtraEmails
    .split(/[,;\s]+/)
    .map((e) => e.trim())
    .filter((e) => e.includes('@'));

  const appBaseUrl = (
    process.env.LABFLOW_APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    saved.appBaseUrl ||
    ''
  )
    .trim()
    .replace(/\/+$/, '');

  const cronSecret = (process.env.LABFLOW_CRON_SECRET || process.env.CRON_SECRET || '').trim();

  return {
    teamsWebhookUrl,
    teamsSource,
    slackWebhookUrl,
    slackSource,
    resendApiKey,
    smtpHost,
    smtpPort,
    smtpSecure,
    smtpUser,
    smtpPass,
    mailFrom,
    digestEmailTo,
    appBaseUrl,
    cronSecret,
  };
}

export async function getMaskedIntegrationStatus(): Promise<MaskedIntegrationStatus> {
  const [saved, resolved] = await Promise.all([readSavedSecrets(), getResolvedIntegrationSecrets()]);
  const hasResend = Boolean(resolved.resendApiKey);
  const hasSmtp = Boolean(resolved.smtpHost && resolved.smtpUser && resolved.smtpPass);
  const emailProvider: MaskedIntegrationStatus['emailProvider'] = hasResend
    ? 'resend'
    : hasSmtp
    ? 'smtp'
    : 'none';

  return {
    hasTeamsWebhook: Boolean(resolved.teamsWebhookUrl),
    teamsMasked: maskSecretValue(resolved.teamsWebhookUrl),
    teamsSource: resolved.teamsSource,
    hasSlackWebhook: Boolean(resolved.slackWebhookUrl),
    slackMasked: maskSecretValue(resolved.slackWebhookUrl),
    slackSource: resolved.slackSource,
    hasEmailTransport: hasResend || hasSmtp,
    emailProvider,
    mailFrom: resolved.mailFrom,
    digestEmailTo: resolved.digestEmailTo.join(', '),
    hasCronSecret: Boolean(resolved.cronSecret),
    appBaseUrl: resolved.appBaseUrl,
    updatedAt: saved.updatedAt,
  };
}

export async function updateIntegrationSecrets(patch: {
  teamsWebhookUrl?: string;
  slackWebhookUrl?: string;
  resendApiKey?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  mailFrom?: string;
  digestEmailTo?: string;
  appBaseUrl?: string;
}): Promise<{ status: MaskedIntegrationStatus; error?: string }> {
  return withIntegrationLock(async () => {
    const current = await readSavedSecrets();
    const next: SavedIntegrationSecrets = { ...current };

    if (patch.teamsWebhookUrl !== undefined) {
      const clean = patch.teamsWebhookUrl.trim();
      if (clean === '') {
        delete next.teamsWebhookUrl;
      } else {
        const validation = validateWebhookUrl(clean);
        if (!validation.valid || !validation.normalized) {
          return {
            status: await getMaskedIntegrationStatus(),
            error: `Invalid Teams Webhook URL: ${validation.reason}`,
          };
        }
        next.teamsWebhookUrl = validation.normalized;
      }
    }

    if (patch.slackWebhookUrl !== undefined) {
      const clean = patch.slackWebhookUrl.trim();
      if (clean === '') {
        delete next.slackWebhookUrl;
      } else {
        const validation = validateWebhookUrl(clean);
        if (!validation.valid || !validation.normalized) {
          return {
            status: await getMaskedIntegrationStatus(),
            error: `Invalid Slack Webhook URL: ${validation.reason}`,
          };
        }
        next.slackWebhookUrl = validation.normalized;
      }
    }

    if (patch.resendApiKey !== undefined) {
      const clean = patch.resendApiKey.trim();
      if (clean === '') delete next.resendApiKey;
      else next.resendApiKey = clean;
    }

    if (patch.smtpHost !== undefined) {
      const clean = patch.smtpHost.trim();
      if (clean === '') delete next.smtpHost;
      else next.smtpHost = clean;
    }

    if (patch.smtpPort !== undefined && Number.isFinite(patch.smtpPort) && patch.smtpPort > 0) {
      next.smtpPort = Math.round(patch.smtpPort);
    }

    if (patch.smtpSecure !== undefined) {
      next.smtpSecure = Boolean(patch.smtpSecure);
    }

    if (patch.smtpUser !== undefined) {
      const clean = patch.smtpUser.trim();
      if (clean === '') delete next.smtpUser;
      else next.smtpUser = clean;
    }

    if (patch.smtpPass !== undefined) {
      const clean = patch.smtpPass.trim();
      if (clean === '') delete next.smtpPass;
      else next.smtpPass = clean;
    }

    if (patch.mailFrom !== undefined) {
      const clean = patch.mailFrom.trim();
      if (clean === '') delete next.mailFrom;
      else next.mailFrom = clean;
    }

    if (patch.digestEmailTo !== undefined) {
      const clean = patch.digestEmailTo.trim();
      if (clean === '') delete next.digestEmailTo;
      else next.digestEmailTo = clean;
    }

    if (patch.appBaseUrl !== undefined) {
      const clean = patch.appBaseUrl.trim().replace(/\/+$/, '');
      if (clean === '') {
        delete next.appBaseUrl;
      } else {
        try {
          const parsed = new URL(clean);
          if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return {
              status: await getMaskedIntegrationStatus(),
              error: 'App Base URL must use http:// or https://',
            };
          }
          next.appBaseUrl = clean;
        } catch {
          return {
            status: await getMaskedIntegrationStatus(),
            error: 'Malformed App Base URL',
          };
        }
      }
    }

    next.updatedAt = new Date().toISOString();
    await writeSavedSecrets(next);
    return { status: await getMaskedIntegrationStatus() };
  });
}
