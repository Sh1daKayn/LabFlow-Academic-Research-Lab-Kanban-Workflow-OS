'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Bell,
  BellOff,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Eye,
  Lock,
  Mail,
  MessageSquareShare,
  Send,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useLabFlow } from '@/context/LabFlowContext';
import { NotificationTutorial } from '@/components/settings/NotificationTutorial';
import type { WorkspaceDigestReport } from '@/utils/notificationPayloads';

interface MaskedIntegrationStatus {
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
}

export const NotificationsTab: React.FC = () => {
  const {
    language,
    t,
    canManageLab,
    isAdminUnlocked,
    requireAdminAuth,
    addToast,
    notificationSettings,
    updateNotificationSettings,
    desktopNotificationsEnabled,
    desktopNotificationPermission,
    toggleDesktopNotifications,
    sendTestDesktopNotification,
  } = useLabFlow();

  const isZh = language === 'zh';
  const canEditWorkspace = canManageLab();

  const [integrationStatus, setIntegrationStatus] = useState<MaskedIntegrationStatus | null>(null);
  const [teamsUrlInput, setTeamsUrlInput] = useState('');
  const [slackUrlInput, setSlackUrlInput] = useState('');
  const [appUrlInput, setAppUrlInput] = useState('');
  const [resendKeyInput, setResendKeyInput] = useState('');
  const [mailFromInput, setMailFromInput] = useState('');
  const [digestToInput, setDigestToInput] = useState('');
  const [showEmailCreds, setShowEmailCreds] = useState(false);
  const [smtpHostInput, setSmtpHostInput] = useState('');
  const [smtpPortInput, setSmtpPortInput] = useState('587');
  const [smtpUserInput, setSmtpUserInput] = useState('');
  const [smtpPassInput, setSmtpPassInput] = useState('');

  const [showTutorial, setShowTutorial] = useState(true);
  const [savingSecrets, setSavingSecrets] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [runningDigest, setRunningDigest] = useState(false);
  const [digestPreview, setDigestPreview] = useState<WorkspaceDigestReport | null>(null);

  const appOrigin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  const loadIntegrationStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/config', { cache: 'no-store' });
      if (!res.ok) return;
      const body = (await res.json()) as { status?: MaskedIntegrationStatus };
      if (body.status) {
        setIntegrationStatus(body.status);
        setAppUrlInput(body.status.appBaseUrl || '');
        setMailFromInput(body.status.mailFrom || '');
        setDigestToInput(body.status.digestEmailTo || '');
      }
    } catch {
      // Keep non-blocking offline state
    }
  }, []);

  useEffect(() => {
    void loadIntegrationStatus();
  }, [loadIntegrationStatus]);

  const guardWorkspaceMutation = (fn: () => void) => {
    if (!canEditWorkspace) {
      addToast(t.requireAdminNotice, '', 'warning');
      return;
    }
    fn();
  };

  const performSaveSecrets = async (clearTarget?: 'teams' | 'slack') => {
    const payload: Record<string, unknown> = {};
    if (clearTarget === 'teams') {
      payload.teamsWebhookUrl = '';
    } else if (teamsUrlInput.trim()) {
      payload.teamsWebhookUrl = teamsUrlInput.trim();
    }

    if (clearTarget === 'slack') {
      payload.slackWebhookUrl = '';
    } else if (slackUrlInput.trim()) {
      payload.slackWebhookUrl = slackUrlInput.trim();
    }

    if (appUrlInput.trim() || integrationStatus?.appBaseUrl) {
      payload.appBaseUrl = appUrlInput.trim();
    }
    if (resendKeyInput.trim()) payload.resendApiKey = resendKeyInput.trim();
    if (mailFromInput.trim()) payload.mailFrom = mailFromInput.trim();
    if (digestToInput.trim() || integrationStatus?.digestEmailTo) {
      payload.digestEmailTo = digestToInput.trim();
    }
    if (smtpHostInput.trim()) payload.smtpHost = smtpHostInput.trim();
    if (smtpPortInput.trim()) payload.smtpPort = Number(smtpPortInput) || 587;
    if (smtpUserInput.trim()) payload.smtpUser = smtpUserInput.trim();
    if (smtpPassInput.trim()) payload.smtpPass = smtpPassInput.trim();

    setSavingSecrets(true);
    try {
      const res = await fetch('/api/notifications/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = (await res.json()) as {
        status?: MaskedIntegrationStatus;
        error?: string;
      };
      if (!res.ok) {
        addToast(
          isZh ? 'Webhook / 邮件配置保存失败' : 'Failed to Save Integration Secrets',
          body.error || `HTTP ${res.status}`,
          'error'
        );
        return;
      }
      if (body.status) setIntegrationStatus(body.status);
      setTeamsUrlInput('');
      setSlackUrlInput('');
      setResendKeyInput('');
      setSmtpPassInput('');
      addToast(
        isZh ? '通知渠道凭据已加密保存' : 'Integration Credentials Saved',
        isZh ? '密钥已安全保存在服务端本地配置中' : 'Secrets stored securely on server',
        'success'
      );
    } catch {
      addToast(isZh ? '网络请求失败' : 'Network request failed', '', 'error');
    } finally {
      setSavingSecrets(false);
    }
  };

  const handleSaveSecrets = (clearTarget?: 'teams' | 'slack') => {
    if (!isAdminUnlocked) {
      requireAdminAuth(() => {
        void performSaveSecrets(clearTarget);
      });
      return;
    }
    void performSaveSecrets(clearTarget);
  };

  const handleSendTestWebhook = async () => {
    setTestingWebhook(true);
    try {
      const res = await fetch('/api/notifications/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'test',
          title: isZh ? 'LabFlow Teams / Slack 连接测试成功' : 'LabFlow Channel Notification Test',
          subtitle: isZh
            ? '您的研究组频道已正确连接到 LabFlow 实时协作通知。'
            : 'Your lab channel is connected and ready for real-time research alerts.',
          body: isZh
            ? '当出现阻塞卡点升级、任务进入 PI Review 或每周摘要触发时，这里会自动推送卡片。'
            : 'Escalated blockers, PI Review milestones, and scheduled digests will arrive here.',
          projectTag: 'System Check',
          actorName: 'LabFlow Notification Engine',
        }),
      });
      const body = (await res.json()) as {
        outcome?: {
          teams?: { sent: boolean; skipped?: string; error?: string };
          slack?: { sent: boolean; skipped?: string; error?: string };
        };
        error?: string;
      };
      if (!res.ok || !body.outcome) {
        addToast(isZh ? '测试推送失败' : 'Test Dispatch Failed', body.error || '', 'error');
        return;
      }
      const { teams, slack } = body.outcome;
      const sentChannels = [teams?.sent ? 'Teams' : '', slack?.sent ? 'Slack' : ''].filter(Boolean);
      if (sentChannels.length > 0) {
        addToast(
          isZh ? `测试卡片已发送至 ${sentChannels.join(' & ')}` : `Test Card Sent to ${sentChannels.join(' & ')}`,
          isZh ? '请检查频道内是否收到 Adaptive Card' : 'Check your channel for the Adaptive Card',
          'success'
        );
      } else {
        const detail = [
          teams?.error ? `Teams: ${teams.error}` : teams?.skipped ? `Teams: ${teams.skipped}` : '',
          slack?.error ? `Slack: ${slack.error}` : slack?.skipped ? `Slack: ${slack.skipped}` : '',
        ]
          .filter(Boolean)
          .join(' · ');
        addToast(
          isZh ? '未发送（请检查通道启用状态或 Webhook URL）' : 'Nothing Dispatched',
          detail || (isZh ? '请先配置并启用 Teams 或 Slack Webhook URL' : 'Configure and enable Teams or Slack first'),
          'warning'
        );
      }
    } catch {
      addToast(isZh ? '测试发送出错' : 'Test request error', '', 'error');
    } finally {
      setTestingWebhook(false);
    }
  };

  const handlePreviewDigest = async () => {
    setRunningDigest(true);
    try {
      const res = await fetch('/api/notifications/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previewOnly: true }),
      });
      const body = (await res.json()) as { report?: WorkspaceDigestReport; error?: string };
      if (!res.ok || !body.report) {
        addToast(isZh ? '生成摘要预览失败' : 'Failed to preview digest', body.error || '', 'error');
        return;
      }
      setDigestPreview(body.report);
    } finally {
      setRunningDigest(false);
    }
  };

  const performSendDigestNow = async () => {
    setRunningDigest(true);
    try {
      const res = await fetch('/api/notifications/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previewOnly: false }),
      });
      const body = (await res.json()) as {
        report?: WorkspaceDigestReport;
        outcome?: {
          skipped?: string;
          teams?: { sent: boolean; skipped?: string; error?: string };
          slack?: { sent: boolean; skipped?: string; error?: string };
          email?: { sent: boolean; skipped?: string; error?: string; recipientCount?: number };
        };
        error?: string;
      };
      if (!res.ok) {
        addToast(isZh ? '发送定时摘要失败' : 'Digest Dispatch Failed', body.error || `HTTP ${res.status}`, 'error');
        return;
      }
      if (body.report) setDigestPreview(body.report);
      const outcome = body.outcome;
      if (outcome?.skipped) {
        addToast(
          isZh ? '摘要发送已跳过（开关已关闭）' : 'Digest Skipped (Toggle Off)',
          outcome.skipped === 'master_disabled'
            ? isZh
              ? '全局外部交流总开关当前为关闭状态'
              : 'Master external notifications toggle is currently OFF'
            : isZh
            ? '定时摘要开关当前为关闭状态'
            : 'Scheduled digest toggle is currently OFF',
          'warning'
        );
        return;
      }
      const parts = [
        outcome?.teams?.sent
          ? 'Teams ✓'
          : outcome?.teams?.error
          ? `Teams Error: ${outcome.teams.error}`
          : '',
        outcome?.slack?.sent ? 'Slack ✓' : '',
        outcome?.email?.sent
          ? `Email ✓ (${outcome.email.recipientCount || 0})`
          : outcome?.email?.error
          ? `Email Error: ${outcome.email.error}`
          : '',
      ].filter(Boolean);

      addToast(
        isZh ? '周期 / 临期 DDL 摘要执行完成' : 'Digest Dispatch Completed',
        parts.length > 0
          ? parts.join(' · ')
          : isZh
          ? '已生成摘要报告（尚未配置 Webhook 或邮箱通道）'
          : 'Snapshot built cleanly (no webhook or email channel configured yet)',
        parts.some((p) => p.includes('✓')) ? 'success' : 'info'
      );
    } finally {
      setRunningDigest(false);
    }
  };

  const handleSendDigestNow = () => {
    if (!isAdminUnlocked) {
      requireAdminAuth(() => {
        void performSendDigestNow();
      });
      return;
    }
    void performSendDigestNow();
  };

  const toggleDigestRole = (role: 'PI' | 'SYS_ADMIN' | 'PROJECT_LEAD') => {
    const current = notificationSettings.digest.recipientRoles;
    const next = current.includes(role)
      ? current.filter((r) => r !== role)
      : [...current, role];
    updateNotificationSettings({
      digest: {
        ...notificationSettings.digest,
        recipientRoles: next.length > 0 ? next : ['PI'],
      },
    });
  };

  const sourceLabel = (source?: 'env' | 'saved' | 'unset') => {
    if (source === 'env') return isZh ? '.env 环境变量已配置' : 'Configured via .env';
    if (source === 'saved') return isZh ? '已保存在服务端' : 'Saved on Host';
    return isZh ? '未配置' : 'Not Configured';
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header + Master External Communication Toggle */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {t.tabNotifications}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isZh
              ? '自由开启或关闭外部通知：Microsoft Teams / Slack 群推送（方案 B）、浏览器桌面弹窗（方案 C）与定时周报/临期 DDL 摘要（方案 D）。'
              : 'Toggleable communication controls: Teams/Slack webhooks (Scheme B), browser desktop popups (Scheme C), and scheduled digests (Scheme D).'}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            guardWorkspaceMutation(() =>
              updateNotificationSettings({ enabled: !notificationSettings.enabled })
            )
          }
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
            notificationSettings.enabled
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
              : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
          }`}
        >
          {notificationSettings.enabled ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : (
            <BellOff className="w-4 h-4 text-slate-400" />
          )}
          <span>
            {notificationSettings.enabled
              ? isZh
                ? '外部通知总开关：已开启'
                : 'External Sync: ENABLED'
              : isZh
              ? '外部通知总开关：已静音关闭'
              : 'External Sync: MUTED'}
          </span>
        </button>
      </div>

      {/* Scheme C: Browser Desktop Notifications (Per-Browser, Available to Every Member) */}
      <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>
                  {isZh
                    ? '方案 C：本机浏览器后台桌面弹窗（零账号成本）'
                    : 'Scheme C: Browser Desktop Popups (Per-User · Zero Config)'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                  {desktopNotificationPermission === 'granted'
                    ? isZh
                      ? '浏览器已授权'
                      : 'Permission Granted'
                    : desktopNotificationPermission === 'denied'
                    ? isZh
                      ? '浏览器已拦截'
                      : 'Blocked in Browser'
                    : desktopNotificationPermission === 'unsupported'
                    ? isZh
                      ? '当前环境不支持'
                      : 'Unsupported'
                    : isZh
                    ? '待授权'
                    : 'Not Prompted'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                {isZh
                  ? '保持网页标签页开启即可在每 12 秒同步时接收：新 1对1 申请、回复、卡点指派、PI 审阅与新 Weekly To-Do 桌面右下角弹窗；点击通知直接跳回对应卡片。'
                  : 'While LabFlow is open in a tab, receive OS notifications during 12s background sync for incoming 1-on-1 requests, replies, escalated blockers, PI review items, and assigned To-Dos.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void toggleDesktopNotifications()}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                desktopNotificationsEnabled
                  ? 'bg-cyan-600 border-cyan-500 text-white hover:bg-cyan-500'
                  : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-cyan-500/50'
              }`}
            >
              {desktopNotificationsEnabled
                ? isZh
                  ? '已开启 · 点击关闭'
                  : 'Active · Turn Off'
                : isZh
                ? '开启桌面弹窗'
                : 'Enable Desktop Alerts'}
            </button>
            <button
              type="button"
              onClick={sendTestDesktopNotification}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {isZh ? '试弹通知' : 'Test Popup'}
            </button>
          </div>
        </div>
      </div>

      {/* Scheme B: Microsoft Teams & Slack Webhooks */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MessageSquareShare className="w-4 h-4 text-indigo-500" />
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {isZh
                  ? '方案 B：Microsoft Teams / Slack 群频道 Webhook 推送'
                  : 'Scheme B: Microsoft Teams & Slack Channel Webhooks'}
              </h4>
              <p className="text-[11px] text-slate-500">
                {isZh
                  ? '面向公共实验室频道的低打扰同步，严格遵守隐私边界（PRIVATE 1对1 / PI_ONLY 永不外发至群频道）。'
                  : 'Low-noise group channel sync. PRIVATE 1-on-1 messages and PI_ONLY tasks never broadcast to public channels.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowTutorial((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>
              {showTutorial
                ? isZh
                  ? '收起内置教程'
                  : 'Hide Setup Guide'
                : isZh
                ? '查看内置教程'
                : 'Show Setup Guide'}
            </span>
          </button>
        </div>

        {/* Channel Switches */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Teams Card Controls */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Microsoft Teams
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {sourceLabel(integrationStatus?.teamsSource)}
                  {integrationStatus?.teamsMasked ? ` (${integrationStatus.teamsMasked})` : ''}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  guardWorkspaceMutation(() =>
                    updateNotificationSettings({
                      teams: {
                        ...notificationSettings.teams,
                        enabled: !notificationSettings.teams.enabled,
                      },
                    })
                  )
                }
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                  notificationSettings.teams.enabled
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
                }`}
              >
                {notificationSettings.teams.enabled ? (isZh ? '已启用' : 'ON') : isZh ? '已关闭' : 'OFF'}
              </button>
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.teams.notifyOnBlocker}
                  onChange={(e) =>
                    guardWorkspaceMutation(() =>
                      updateNotificationSettings({
                        teams: { ...notificationSettings.teams, notifyOnBlocker: e.target.checked },
                      })
                    )
                  }
                />
                <span>{isZh ? '公开课题阻塞升级 (Blocker Escalated)' : 'Public Blocker Escalation'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.teams.notifyOnPiReview}
                  onChange={(e) =>
                    guardWorkspaceMutation(() =>
                      updateNotificationSettings({
                        teams: { ...notificationSettings.teams, notifyOnPiReview: e.target.checked },
                      })
                    )
                  }
                />
                <span>{isZh ? '任务进入「待导师审阅 (PI Review)」' : 'Task Enters PI Review'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.teams.notifyOnPublicRequest}
                  onChange={(e) =>
                    guardWorkspaceMutation(() =>
                      updateNotificationSettings({
                        teams: {
                          ...notificationSettings.teams,
                          notifyOnPublicRequest: e.target.checked,
                        },
                      })
                    )
                  }
                />
                <span>{isZh ? '全组可见 (Public) 的协作申请' : 'Public Team Requests Only'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.teams.notifyOnDigest}
                  onChange={(e) =>
                    guardWorkspaceMutation(() =>
                      updateNotificationSettings({
                        teams: { ...notificationSettings.teams, notifyOnDigest: e.target.checked },
                      })
                    )
                  }
                />
                <span>{isZh ? '推送每周 / 48h DDL 定时汇总卡片' : 'Scheduled Weekly & DDL Digest Cards'}</span>
              </label>
            </div>
          </div>

          {/* Slack Card Controls */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Slack ({isZh ? '可选兼容' : 'Optional'})
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {sourceLabel(integrationStatus?.slackSource)}
                  {integrationStatus?.slackMasked ? ` (${integrationStatus.slackMasked})` : ''}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  guardWorkspaceMutation(() =>
                    updateNotificationSettings({
                      slack: {
                        ...notificationSettings.slack,
                        enabled: !notificationSettings.slack.enabled,
                      },
                    })
                  )
                }
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                  notificationSettings.slack.enabled
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
                }`}
              >
                {notificationSettings.slack.enabled ? (isZh ? '已启用' : 'ON') : isZh ? '已关闭' : 'OFF'}
              </button>
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.slack.notifyOnBlocker}
                  onChange={(e) =>
                    guardWorkspaceMutation(() =>
                      updateNotificationSettings({
                        slack: { ...notificationSettings.slack, notifyOnBlocker: e.target.checked },
                      })
                    )
                  }
                />
                <span>{isZh ? '公开课题阻塞升级' : 'Public Blocker Escalation'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.slack.notifyOnPiReview}
                  onChange={(e) =>
                    guardWorkspaceMutation(() =>
                      updateNotificationSettings({
                        slack: { ...notificationSettings.slack, notifyOnPiReview: e.target.checked },
                      })
                    )
                  }
                />
                <span>{isZh ? '任务进入 PI Review' : 'Task Enters PI Review'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.slack.notifyOnPublicRequest}
                  onChange={(e) =>
                    guardWorkspaceMutation(() =>
                      updateNotificationSettings({
                        slack: {
                          ...notificationSettings.slack,
                          notifyOnPublicRequest: e.target.checked,
                        },
                      })
                    )
                  }
                />
                <span>{isZh ? '全组可见 (Public) 的协作申请' : 'Public Team Requests Only'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.slack.notifyOnDigest}
                  onChange={(e) =>
                    guardWorkspaceMutation(() =>
                      updateNotificationSettings({
                        slack: { ...notificationSettings.slack, notifyOnDigest: e.target.checked },
                      })
                    )
                  }
                />
                <span>{isZh ? '推送每周 / 48h DDL 汇总' : 'Scheduled Digest Messages'}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Secret URL Entry & Test Controls */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {isZh
                  ? 'Webhook URL 与回调地址配置（支持粘贴保存或通过 .env 注入）'
                  : 'Webhook URLs & Action Link Base (UI Save or .env)'}
              </span>
            </div>
            {!isAdminUnlocked && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400">
                {isZh ? '保存密钥需先解锁导师锁' : 'Admin unlock required to save secrets'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                {isZh ? 'Microsoft Teams Webhook URL' : 'Microsoft Teams Webhook URL'}
              </label>
              <div className="flex gap-1.5">
                <input
                  type="url"
                  value={teamsUrlInput}
                  onChange={(e) => setTeamsUrlInput(e.target.value)}
                  placeholder={
                    integrationStatus?.hasTeamsWebhook
                      ? `${integrationStatus.teamsMasked} (${isZh ? '留空保持不变' : 'keep existing'})`
                      : 'https://prod-xx.logic.azure.com/workflows/...'
                  }
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs"
                />
                {integrationStatus?.teamsSource === 'saved' && (
                  <button
                    type="button"
                    onClick={() => handleSaveSecrets('teams')}
                    className="px-2 py-1 rounded-lg border border-rose-500/30 text-rose-600 text-[11px]"
                  >
                    {isZh ? '清除' : 'Clear'}
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                {isZh ? 'Slack Webhook URL（可选）' : 'Slack Webhook URL (Optional)'}
              </label>
              <div className="flex gap-1.5">
                <input
                  type="url"
                  value={slackUrlInput}
                  onChange={(e) => setSlackUrlInput(e.target.value)}
                  placeholder={
                    integrationStatus?.hasSlackWebhook
                      ? `${integrationStatus.slackMasked}`
                      : 'https://hooks.slack.com/services/...'
                  }
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs"
                />
                {integrationStatus?.slackSource === 'saved' && (
                  <button
                    type="button"
                    onClick={() => handleSaveSecrets('slack')}
                    className="px-2 py-1 rounded-lg border border-rose-500/30 text-rose-600 text-[11px]"
                  >
                    {isZh ? '清除' : 'Clear'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <input
              type="url"
              value={appUrlInput}
              onChange={(e) => setAppUrlInput(e.target.value)}
              placeholder={
                isZh
                  ? `卡片跳转地址（默认当前访问网址，例如 ${appOrigin}）`
                  : `Action Link Base URL (e.g. ${appOrigin})`
              }
              className="flex-1 min-w-[220px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs"
            />

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={savingSecrets}
                onClick={() => handleSaveSecrets()}
                className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {savingSecrets
                  ? isZh
                    ? '保存中...'
                    : 'Saving...'
                  : isZh
                  ? '保存 Webhook 配置'
                  : 'Save Webhook Config'}
              </button>

              <button
                type="button"
                disabled={testingWebhook}
                onClick={() => void handleSendTestWebhook()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {testingWebhook
                    ? isZh
                      ? '发送中...'
                      : 'Sending...'
                    : isZh
                    ? '发送测试卡片'
                    : 'Send Test Card'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Built-in Interactive Setup Tutorial */}
        {showTutorial && <NotificationTutorial language={language} appOrigin={appOrigin} />}
      </div>

      {/* Scheme D: Scheduled Digest & 48h DDL Summary */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-violet-500" />
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {isZh
                  ? '方案 D：定时任务（周报与临期 DDL 自动汇总 · 支持邮件与 Teams 摘要）'
                  : 'Scheme D: Scheduled Digest (Weekly Sync & 48h Deadline Alerts)'}
              </h4>
              <p className="text-[11px] text-slate-500">
                {isZh
                  ? '汇总即将截稿、已逾期、待 PI Review 与阻塞任务，减少零散邮件打扰。'
                  : 'Batches imminent deadlines, overdue milestones, PI Review queues, and active blockers into one clean digest.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              guardWorkspaceMutation(() =>
                updateNotificationSettings({
                  digest: {
                    ...notificationSettings.digest,
                    enabled: !notificationSettings.digest.enabled,
                  },
                })
              )
            }
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
              notificationSettings.digest.enabled
                ? 'bg-violet-600 border-violet-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
            }`}
          >
            {notificationSettings.digest.enabled ? (isZh ? '已启用' : 'ON') : isZh ? '已关闭' : 'OFF'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              {isZh ? '临期 DDL 预警窗口' : 'Deadline Lookahead Window'}
            </label>
            <select
              value={notificationSettings.digest.deadlineWindowHours}
              onChange={(e) =>
                guardWorkspaceMutation(() =>
                  updateNotificationSettings({
                    digest: {
                      ...notificationSettings.digest,
                      deadlineWindowHours: Number(e.target.value) || 48,
                    },
                  })
                )
              }
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs"
            >
              <option value={24}>{isZh ? '未来 24 小时' : 'Next 24 Hours'}</option>
              <option value={48}>{isZh ? '未来 48 小时（推荐）' : 'Next 48 Hours (Recommended)'}</option>
              <option value={72}>{isZh ? '未来 72 小时' : 'Next 72 Hours'}</option>
              <option value={168}>{isZh ? '未来 7 天（周会视角）' : 'Next 7 Days (Weekly)'}</option>
            </select>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              {isZh ? '邮件摘要收件角色' : 'Email Digest Recipient Roles'}
            </div>
            <div className="flex flex-wrap gap-2 pt-0.5 text-[11px]">
              {(['PI', 'SYS_ADMIN', 'PROJECT_LEAD'] as const).map((roleKey) => (
                <label key={roleKey} className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.digest.recipientRoles.includes(roleKey)}
                    onChange={() => guardWorkspaceMutation(() => toggleDigestRole(roleKey))}
                  />
                  <span>
                    {roleKey === 'PI'
                      ? isZh
                        ? '导师 PI'
                        : 'PI'
                      : roleKey === 'SYS_ADMIN'
                      ? isZh
                        ? '协管 PM'
                        : 'SysAdmin'
                      : isZh
                      ? '骨干/博士后'
                      : 'Leads'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-violet-500" />
                {isZh ? '同时发送真实邮件摘要' : 'Send Email Digest'}
              </span>
              <input
                type="checkbox"
                checked={notificationSettings.digest.emailEnabled}
                onChange={(e) =>
                  guardWorkspaceMutation(() =>
                    updateNotificationSettings({
                      digest: {
                        ...notificationSettings.digest,
                        emailEnabled: e.target.checked,
                      },
                    })
                  )
                }
              />
            </div>
            <div className="text-[10px] text-slate-500 flex items-center justify-between">
              <span>
                {integrationStatus?.hasEmailTransport
                  ? `${isZh ? '通道就绪：' : 'Ready: '}${integrationStatus.emailProvider.toUpperCase()}`
                  : isZh
                  ? '未配发信密钥（仅推 Teams/预览）'
                  : 'No SMTP/Resend yet (Teams/Preview only)'}
              </span>
              <button
                type="button"
                onClick={() => setShowEmailCreds((v) => !v)}
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                {showEmailCreds ? (isZh ? '收起' : 'Hide') : isZh ? '配置发信' : 'Configure'}
              </button>
            </div>
          </div>
        </div>

        {/* Optional Email Credentials Panel */}
        {showEmailCreds && (
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5 text-xs">
            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
              {isZh
                ? '可选邮件发送配置（Resend API Key 或 通用 SMTP 二选一，也可直接配在 .env）'
                : 'Optional Email Transport (Resend API Key or SMTP, also supports .env)'}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="password"
                value={resendKeyInput}
                onChange={(e) => setResendKeyInput(e.target.value)}
                placeholder="Resend API Key (re_...)"
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs"
              />
              <input
                type="text"
                value={mailFromInput}
                onChange={(e) => setMailFromInput(e.target.value)}
                placeholder="From (LabFlow <noreply@yourlab.edu>)"
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs"
              />
              <input
                type="text"
                value={digestToInput}
                onChange={(e) => setDigestToInput(e.target.value)}
                placeholder={isZh ? '额外抄送邮箱（逗号分隔）' : 'Extra recipients (comma-separated)'}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <input
                type="text"
                value={smtpHostInput}
                onChange={(e) => setSmtpHostInput(e.target.value)}
                placeholder="SMTP Host (e.g. smtp.gmail.com)"
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs"
              />
              <input
                type="number"
                value={smtpPortInput}
                onChange={(e) => setSmtpPortInput(e.target.value)}
                placeholder="Port (587)"
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs"
              />
              <input
                type="text"
                value={smtpUserInput}
                onChange={(e) => setSmtpUserInput(e.target.value)}
                placeholder="SMTP Username"
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs"
              />
              <input
                type="password"
                value={smtpPassInput}
                onChange={(e) => setSmtpPassInput(e.target.value)}
                placeholder="SMTP Password / App Pass"
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                disabled={savingSecrets}
                onClick={() => handleSaveSecrets()}
                className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
              >
                {isZh ? '保存发信凭据' : 'Save Email Config'}
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-500" />
            <span>
              {integrationStatus?.hasCronSecret
                ? isZh
                  ? 'CRON_SECRET 已配置，可安全对接 Vercel / GitHub Actions 定时调用'
                  : 'CRON_SECRET active for automated schedules'
                : isZh
                ? '可在 .env 中设置 CRON_SECRET 以启用自动定时调度，或随时在此手动预览/推送'
                : 'Add CRON_SECRET in .env for automated cron triggers, or preview/send manually here'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={runningDigest}
              onClick={() => void handlePreviewDigest()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isZh ? '预览本次摘要' : 'Preview Digest'}</span>
            </button>
            <button
              type="button"
              disabled={runningDigest}
              onClick={handleSendDigestNow}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isZh ? '立即发送摘要' : 'Send Digest Now'}</span>
            </button>
          </div>
        </div>

        {/* Live Digest Preview Card */}
        {digestPreview && (
          <div className="p-3.5 rounded-xl border border-violet-500/30 bg-white dark:bg-slate-900 space-y-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {digestPreview.subject}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {isZh ? '有效收件邮箱：' : 'Real recipients: '}
                {digestPreview.emailRecipients.length}
              </span>
            </div>

            {digestPreview.skippedPlaceholderEmails.length > 0 && (
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-800 dark:text-amber-200 flex items-start gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  {isZh
                    ? `以下成员仍使用示例占位邮箱（不会真实发信，请在「人员与用户」里改为真实工作/学校邮箱）：${digestPreview.skippedPlaceholderEmails
                        .map((p) => `${p.name} (${p.email})`)
                        .join('、')}`
                    : `Skipped demo placeholder emails (update to real university emails in Lab Members tab): ${digestPreview.skippedPlaceholderEmails
                        .map((p) => `${p.name} (${p.email})`)
                        .join(', ')}`}
                </span>
              </div>
            )}

            <pre className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] whitespace-pre-wrap font-mono text-slate-700 dark:text-slate-300 max-h-56 overflow-y-auto">
              {digestPreview.markdownSummary}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
