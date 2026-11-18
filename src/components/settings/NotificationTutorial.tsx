'use client';

import React, { useState } from 'react';
import { BookOpen, Check, Copy, Lock } from 'lucide-react';
import { Language } from '@/types';

interface NotificationTutorialProps {
  language: Language;
  appOrigin: string;
}

type GuideTab = 'teams' | 'slack' | 'cron';

export const NotificationTutorial: React.FC<NotificationTutorialProps> = ({
  language,
  appOrigin,
}) => {
  const isZh = language === 'zh';
  const [guideTab, setGuideTab] = useState<GuideTab>('teams');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copySnippet = (key: string, text: string) => {
    void navigator.clipboard?.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    });
  };

  const normalizedOrigin = (appOrigin || 'https://your-labflow-host').replace(/\/+$/, '');

  const envTeamsSnippet = `TEAMS_WEBHOOK_URL="https://prod-xx.westus.logic.azure.com:443/workflows/..."
LABFLOW_APP_URL="${normalizedOrigin}"`;

  const vercelCronSnippet = `{
  "crons": [
    {
      "path": "/api/notifications/digest",
      "schedule": "0 13 * * 1"
    }
  ]
}`;

  const githubActionSnippet = `name: LabFlow Weekly & 48h Deadline Digest
on:
  schedule:
    - cron: '0 13 * * 1,4' # Mon & Thu 08:00 EST / 13:00 UTC
  workflow_dispatch:
jobs:
  digest:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger LabFlow Digest
        run: |
          curl -fsS -H "Authorization: Bearer \${{ secrets.CRON_SECRET }}" \\
            "${normalizedOrigin}/api/notifications/digest"`;

  const curlCrontabSnippet = `# Runs every weekday at 08:30 AM:
30 8 * * 1-5 curl -fsS -H "Authorization: Bearer YOUR_CRON_SECRET" "${normalizedOrigin}/api/notifications/digest" >/dev/null 2>&1`;

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-950/20 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
            {isZh
              ? '内置配置教程：Microsoft Teams / Slack Webhook 与定时摘要'
              : 'Built-in Setup Guide: Microsoft Teams, Slack & Scheduled Digest'}
          </h4>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => setGuideTab('teams')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              guideTab === 'teams'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Microsoft Teams
          </button>
          <button
            type="button"
            onClick={() => setGuideTab('slack')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              guideTab === 'slack'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Slack
          </button>
          <button
            type="button"
            onClick={() => setGuideTab('cron')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              guideTab === 'cron'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {isZh ? '方案 D 定时任务' : 'Cron / Digest'}
          </button>
        </div>
      </div>

      {guideTab === 'teams' && (
        <div className="space-y-2.5 text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div className="p-3 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="font-bold text-indigo-600 dark:text-indigo-400">
                {isZh
                  ? '方式 1（新版 Teams 官方推荐）：Workflows Webhook'
                  : 'Method 1 (Current Teams Standard): Teams Workflows'}
              </div>
              <ol className="list-decimal pl-4 space-y-1">
                <li>
                  {isZh
                    ? '打开 Microsoft Teams -> 进入实验室团队频道（如 #lab-sync）-> 点击频道名右侧 `•••` -> 选择「Workflows（工作流）」。'
                    : 'Open Microsoft Teams -> open your lab channel -> click `•••` -> choose "Workflows".'}
                </li>
                <li>
                  {isZh
                    ? '搜索并选择模板："Post to a channel when a webhook request is received"（收到 Webhook 请求时发布到频道）。'
                    : 'Search template: "Post to a channel when a webhook request is received".'}
                </li>
                <li>
                  {isZh
                    ? '确认 Team 与 Channel 后点击创建，复制生成的 `https://...logic.azure.com/...` URL。'
                    : 'Confirm the target Team & Channel, create the workflow, and copy the `https://...logic.azure.com/...` URL.'}
                </li>
                <li>
                  {isZh
                    ? '将该 URL 粘贴到本页下方的 Teams Webhook 输入框（或写入 `.env`），点击「发送测试卡片」验证频道收到卡片即完成。'
                    : 'Paste the URL below (or set `TEAMS_WEBHOOK_URL` in `.env`) and click "Send Test Card".'}
                </li>
              </ol>
            </div>

            <div className="p-3 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="font-bold text-slate-800 dark:text-slate-200">
                {isZh
                  ? '方式 2（旧版兼容）与环境变量说明'
                  : 'Method 2 (Legacy Connectors) & Privacy Boundary'}
              </div>
              <p>
                {isZh
                  ? '如果你的学校组织仍启用了旧版 Connectors（`*.webhook.office.com/...`），LabFlow 同样原生兼容 Adaptive Card 格式，可直接填入使用。'
                  : 'If your university tenant still uses legacy `*.webhook.office.com` Incoming Webhooks, the exact same Adaptive Card format works automatically.'}
              </p>
              <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 flex items-start gap-1.5">
                <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  {isZh
                    ? '边界说明：Webhook 默认推送到群公共频道；为防隐私泄露，所有标为 `PRIVATE` 的 1对1 沟通与 `PI_ONLY` 任务绝不会推送到 Teams 公共频道，请配合下方「方案 C 桌面通知」或「方案 D 邮件摘要」直达个人。'
                    : 'Boundary: Channel Webhooks broadcast to the whole channel. `PRIVATE` 1-on-1 DMs and `PI_ONLY` items are never posted to public channels—pair with Scheme C (Desktop Alerts) or Scheme D Email.'}
                </span>
              </div>
            </div>
          </div>

          <div className="relative rounded-lg bg-slate-900 text-slate-200 p-2.5 font-mono text-[10px] overflow-x-auto">
            <button
              type="button"
              onClick={() => copySnippet('env', envTeamsSnippet)}
              className="absolute right-2 top-2 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1"
            >
              {copiedKey === 'env' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === 'env' ? (isZh ? '已复制' : 'Copied') : (isZh ? '复制 .env 示例' : 'Copy .env')}</span>
            </button>
            <pre>{envTeamsSnippet}</pre>
          </div>
        </div>
      )}

      {guideTab === 'slack' && (
        <div className="p-3 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1.5 text-slate-700 dark:text-slate-300">
          <ol className="list-decimal pl-4 space-y-1">
            <li>
              {isZh
                ? '访问 api.slack.com/apps 创建应用 -> 开启 "Incoming Webhooks" -> 点击 "Add New Webhook to Workspace"。'
                : 'Open api.slack.com/apps -> Create App -> Enable "Incoming Webhooks" -> "Add New Webhook to Workspace".'}
            </li>
            <li>
              {isZh
                ? '选择实验室频道，复制 `https://hooks.slack.com/services/...` URL。'
                : 'Choose your lab channel and copy the `https://hooks.slack.com/services/...` URL.'}
            </li>
            <li>
              {isZh
                ? '填入下方 Slack Webhook（或 `.env` 的 `SLACK_WEBHOOK_URL`）并启用开关即可（私聊 DM 需 Slack Bot Token，此处遵循与 Teams 相同的公共频道安全边界）。'
                : 'Paste into Slack Webhook below (or `SLACK_WEBHOOK_URL` in `.env`). Direct DMs require Bot Tokens; public channel webhooks share the same privacy boundary.'}
            </li>
          </ol>
        </div>
      )}

      {guideTab === 'cron' && (
        <div className="space-y-2.5 text-[11px] text-slate-700 dark:text-slate-300">
          <p>
            {isZh
              ? '定时端点 `GET /api/notifications/digest` 会汇总临期 DDL（默认 48 小时内）、待 PI 审阅及卡点任务，并向已启用的 Teams 频道与（可选 Resend/SMTP）邮箱发送摘要。请在 `.env` 设置 `CRON_SECRET`。'
              : 'Endpoint `GET /api/notifications/digest` computes upcoming deadlines (48h default), PI review items, and blockers, delivering to active Teams/Slack/Email channels. Set `CRON_SECRET` in `.env`.'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div className="relative rounded-lg bg-slate-900 text-slate-200 p-2.5 font-mono text-[10px] overflow-x-auto">
              <div className="text-cyan-400 mb-1">1. Vercel Cron (vercel.json)</div>
              <button
                type="button"
                onClick={() => copySnippet('vercel', vercelCronSnippet)}
                className="absolute right-2 top-2 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1"
              >
                {copiedKey === 'vercel' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'vercel' ? (isZh ? '已复制' : 'Copied') : 'Copy'}</span>
              </button>
              <pre>{vercelCronSnippet}</pre>
            </div>

            <div className="relative rounded-lg bg-slate-900 text-slate-200 p-2.5 font-mono text-[10px] overflow-x-auto">
              <div className="text-cyan-400 mb-1">2. GitHub Actions (.github/workflows/digest.yml)</div>
              <button
                type="button"
                onClick={() => copySnippet('gha', githubActionSnippet)}
                className="absolute right-2 top-2 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1"
              >
                {copiedKey === 'gha' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'gha' ? (isZh ? '已复制' : 'Copied') : 'Copy'}</span>
              </button>
              <pre>{githubActionSnippet}</pre>
            </div>
          </div>

          <div className="relative rounded-lg bg-slate-900 text-slate-200 p-2.5 font-mono text-[10px] overflow-x-auto">
            <div className="text-cyan-400 mb-1">3. Self-hosted Server Crontab</div>
            <button
              type="button"
              onClick={() => copySnippet('curl', curlCrontabSnippet)}
              className="absolute right-2 top-2 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1"
            >
              {copiedKey === 'curl' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === 'curl' ? (isZh ? '已复制' : 'Copied') : 'Copy'}</span>
            </button>
            <pre>{curlCrontabSnippet}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
