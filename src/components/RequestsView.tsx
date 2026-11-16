'use client';

import React, { useMemo, useState } from 'react';
import {
  Plus,
  Lock,
  Globe,
  MessageSquare,
  CheckCircle2,
  RotateCcw,
  Trash2,
  Send,
  Inbox,
  SendHorizontal,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { useLabFlow } from '@/context/LabFlowContext';
import { MemberAvatar } from '@/components/MemberAvatar';
import { DirectRequest, DirectRequestStatus } from '@/types';
import { getMemberDisplayName } from '@/utils/avatar';
import { DIRECT_REQUEST_KINDS } from '@/utils/directRequests';
import {
  WORK_CATEGORIES,
  WORK_CATEGORY_META,
  getWorkCategoryLabel,
} from '@/utils/workCategory';

type RequestTab = 'inbox' | 'sent' | 'public_feed';

export const RequestsView: React.FC = () => {
  const {
    directRequests,
    members,
    projects,
    tasks,
    currentUserId,
    workspaceScope,
    workCategoryFilter,
    setWorkCategoryFilter,
    effectiveIsAdmin,
    language,
    openRequestModal,
    replyDirectRequest,
    updateDirectRequestStatus,
    updateDirectRequestVisibility,
    deleteDirectRequest,
  } = useLabFlow();

  const isZh = language === 'zh';
  const [activeTab, setActiveTab] = useState<RequestTab>('inbox');
  const [statusFilter, setStatusFilter] = useState<'ALL' | DirectRequestStatus>('ALL');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [openReplyId, setOpenReplyId] = useState<string | null>(null);

  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members]
  );
  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects]
  );
  const taskMap = useMemo(
    () => new Map(tasks.map((t) => [t.id, t])),
    [tasks]
  );

  const categoryFiltered = useMemo(() => {
    if (workCategoryFilter === 'ALL') return directRequests;
    return directRequests.filter((req) => {
      if (req.workCategory) return req.workCategory === workCategoryFilter;
      if (req.projectId) {
        const proj = projectMap.get(req.projectId);
        return (proj?.workCategory || 'PAPER') === workCategoryFilter;
      }
      return false;
    });
  }, [directRequests, workCategoryFilter, projectMap]);

  const inboxItems = useMemo(
    () => categoryFiltered.filter((r) => r.recipientId === currentUserId),
    [categoryFiltered, currentUserId]
  );
  const sentItems = useMemo(
    () => categoryFiltered.filter((r) => r.senderId === currentUserId),
    [categoryFiltered, currentUserId]
  );
  const publicFeedItems = useMemo(
    () =>
      categoryFiltered.filter(
        (r) =>
          r.visibility === 'PUBLIC' &&
          r.senderId !== currentUserId &&
          r.recipientId !== currentUserId
      ),
    [categoryFiltered, currentUserId]
  );

  const resolvedTab: RequestTab =
    activeTab === 'public_feed' && workspaceScope !== 'PUBLIC_LAB' ? 'inbox' : activeTab;

  const listItems = useMemo(() => {
    const base =
      resolvedTab === 'inbox'
        ? inboxItems
        : resolvedTab === 'sent'
          ? sentItems
          : publicFeedItems;
    if (statusFilter === 'ALL') return base;
    return base.filter((r) => r.status === statusFilter);
  }, [resolvedTab, inboxItems, sentItems, publicFeedItems, statusFilter]);

  const openInboxCount = inboxItems.filter((r) => r.status !== 'RESOLVED').length;

  const handleSendReply = (reqId: string) => {
    const text = (replyDrafts[reqId] || '').trim();
    if (!text) return;
    replyDirectRequest(reqId, text);
    setReplyDrafts((prev) => ({ ...prev, [reqId]: '' }));
    setOpenReplyId(null);
  };

  const renderStatusBadge = (status: DirectRequestStatus) => {
    if (status === 'RESOLVED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
          <CheckCircle2 className="w-3 h-3" />
          {isZh ? '已解决' : 'Resolved'}
        </span>
      );
    }
    if (status === 'REPLIED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60">
          {isZh ? '已回复' : 'Replied'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
        {isZh ? '待处理' : 'Open'}
      </span>
    );
  };

  const renderRequestCard = (req: DirectRequest) => {
    const sender = memberMap.get(req.senderId);
    const recipient = memberMap.get(req.recipientId);
    const linkedProject = req.projectId ? projectMap.get(req.projectId) : undefined;
    const linkedTask = req.taskId ? taskMap.get(req.taskId) : undefined;
    const kindMeta = DIRECT_REQUEST_KINDS.find((k) => k.id === req.kind);
    const isSender = req.senderId === currentUserId;
    const isParticipant = isSender || req.recipientId === currentUserId;

    return (
      <div
        key={req.id}
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-xs"
      >
        {/* Top Meta Row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-100">
              <MemberAvatar
                member={sender}
                alt={getMemberDisplayName(sender, language, req.senderId)}
                size="xs"
              />
              <span>{getMemberDisplayName(sender, language, req.senderId)}</span>
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-100">
              <MemberAvatar
                member={recipient}
                alt={getMemberDisplayName(recipient, language, req.recipientId)}
                size="xs"
              />
              <span>{getMemberDisplayName(recipient, language, req.recipientId)}</span>
            </span>

            {kindMeta && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium">
                {isZh ? kindMeta.labelZh : kindMeta.labelEn}
              </span>
            )}

            {req.workCategory && (
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[11px] font-medium">
                {getWorkCategoryLabel(req.workCategory, language, true)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Visibility Badge / Toggle for Sender */}
            {isSender ? (
              <button
                type="button"
                onClick={() =>
                  updateDirectRequestVisibility(
                    req.id,
                    req.visibility === 'PRIVATE' ? 'PUBLIC' : 'PRIVATE'
                  )
                }
                title={isZh ? '点击切换隐私或组内公开' : 'Click to toggle Private / Public'}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
                  req.visibility === 'PRIVATE'
                    ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    : 'border-cyan-200 dark:border-cyan-800/60 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/40'
                }`}
              >
                {req.visibility === 'PRIVATE' ? (
                  <>
                    <Lock className="w-3 h-3" />
                    {isZh ? '隐私 · 仅双方' : 'Private'}
                  </>
                ) : (
                  <>
                    <Globe className="w-3 h-3" />
                    {isZh ? '组内公开' : 'Public'}
                  </>
                )}
              </button>
            ) : (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                  req.visibility === 'PRIVATE'
                    ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    : 'border-cyan-200 dark:border-cyan-800/60 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300'
                }`}
              >
                {req.visibility === 'PRIVATE' ? (
                  <>
                    <Lock className="w-3 h-3" />
                    {isZh ? '隐私' : 'Private'}
                  </>
                ) : (
                  <>
                    <Globe className="w-3 h-3" />
                    {isZh ? '组内公开' : 'Public'}
                  </>
                )}
              </span>
            )}

            {renderStatusBadge(req.status)}
          </div>
        </div>

        {/* Body */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {req.title}
          </h3>
          {req.content && (
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-wrap leading-relaxed">
              {req.content}
            </p>
          )}
        </div>

        {/* Linked Project / Task / DueDate */}
        {(linkedProject || linkedTask || req.dueDate) && (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            {linkedProject && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80">
                📁 {linkedProject.tag} · {linkedProject.title}
              </span>
            )}
            {linkedTask && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80">
                📌 {linkedTask.title}
              </span>
            )}
            {req.dueDate && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80">
                <Calendar className="w-3 h-3" />
                {req.dueDate}
              </span>
            )}
          </div>
        )}

        {/* Replies Thread */}
        {req.replies.length > 0 && (
          <div className="space-y-2 border-l-2 border-slate-200 dark:border-slate-700 pl-3 pt-1">
            {req.replies.map((reply) => {
              const author = memberMap.get(reply.authorId);
              return (
                <div key={reply.id} className="text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <MemberAvatar
                      member={author}
                      alt={getMemberDisplayName(author, language, reply.authorId)}
                      size="xs"
                    />
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {getMemberDisplayName(author, language, reply.authorId)}
                    </span>
                    <span className="text-[10px] opacity-70">
                      {reply.createdAt.slice(0, 10)}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5 whitespace-pre-wrap">
                    {reply.content}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Inline Reply Editor */}
        {openReplyId === req.id && (
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={replyDrafts[req.id] || ''}
              onChange={(e) =>
                setReplyDrafts((prev) => ({ ...prev, [req.id]: e.target.value }))
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendReply(req.id);
                }
              }}
              placeholder={isZh ? '输入 1 对 1 回复内容...' : 'Write a reply...'}
              className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
              autoFocus
            />
            <button
              type="button"
              onClick={() => handleSendReply(req.id)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1"
            >
              <Send className="w-3 h-3" />
              {isZh ? '发送' : 'Send'}
            </button>
          </div>
        )}

        {/* Actions */}
        {(isParticipant || effectiveIsAdmin) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
            <span className="text-[11px] text-slate-400">
              {req.createdAt.slice(0, 10)}
            </span>

            <div className="flex items-center gap-2">
              {isParticipant && (
                <button
                  type="button"
                  onClick={() =>
                    setOpenReplyId((curr) => (curr === req.id ? null : req.id))
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {isZh ? '回复' : 'Reply'}
                </button>
              )}

              {isParticipant && req.status !== 'RESOLVED' ? (
                <button
                  type="button"
                  onClick={() => updateDirectRequestStatus(req.id, 'RESOLVED')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isZh ? '标为已解决' : 'Resolve'}
                </button>
              ) : (
                isParticipant && (
                  <button
                    type="button"
                    onClick={() => updateDirectRequestStatus(req.id, 'OPEN')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {isZh ? '重新打开' : 'Reopen'}
                  </button>
                )
              )}

              {(isSender || effectiveIsAdmin) && (
                <button
                  type="button"
                  onClick={() => deleteDirectRequest(req.id)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  title={isZh ? '删除记录' : 'Delete'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {isZh ? '1 对 1 申请与沟通' : '1-on-1 Requests & Messages'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isZh
              ? '点对点发起审批、对接或卡点求助；隐私事项仅双方可见，也可自由设为组内公开'
              : 'Send targeted requests to one member at a time with per-request private or public control.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => openRequestModal()}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {isZh ? '发起 1 对 1 申请 / 交流' : 'New 1-on-1 Request'}
        </button>
      </div>

      {/* Category & Inbox Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('inbox')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${
              resolvedTab === 'inbox'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            {isZh ? '发给我的' : 'Inbox'} ({inboxItems.length})
            {openInboxCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white">
                {openInboxCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sent')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${
              resolvedTab === 'sent'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <SendHorizontal className="w-3.5 h-3.5" />
            {isZh ? '我发出的' : 'Sent'} ({sentItems.length})
          </button>
          {workspaceScope === 'PUBLIC_LAB' && (
            <button
              type="button"
              onClick={() => setActiveTab('public_feed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${
                resolvedTab === 'public_feed'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              {isZh ? '组内公开动态' : 'Group Public'} ({publicFeedItems.length})
            </button>
          )}
        </div>

        {/* WorkCategory + Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setWorkCategoryFilter('ALL')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                workCategoryFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {isZh ? '全部类别' : 'All'}
            </button>
            {WORK_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setWorkCategoryFilter(cat)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  workCategoryFilter === cat
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {isZh
                  ? WORK_CATEGORY_META[cat].shortZh
                  : WORK_CATEGORY_META[cat].shortEn}
              </button>
            ))}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | DirectRequestStatus)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs text-slate-700 dark:text-slate-200"
          >
            <option value="ALL">{isZh ? '全部状态' : 'All Status'}</option>
            <option value="OPEN">{isZh ? '待处理' : 'Open'}</option>
            <option value="REPLIED">{isZh ? '已回复' : 'Replied'}</option>
            <option value="RESOLVED">{isZh ? '已解决' : 'Resolved'}</option>
          </select>
        </div>
      </div>

      {/* Request Cards List */}
      {listItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center space-y-2 bg-white/60 dark:bg-slate-900/40">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {resolvedTab === 'inbox'
              ? isZh
                ? '暂无发给你的 1 对 1 请求'
                : 'No 1-on-1 requests in your inbox'
              : resolvedTab === 'sent'
                ? isZh
                  ? '你还没有发出过 1 对 1 申请或交流'
                  : 'You have not sent any 1-on-1 requests yet'
                : isZh
                  ? '当前暂无其他成员公开的组内动态'
                  : 'No public group requests from peers'}
          </p>
          <p className="text-xs text-slate-400">
            {isZh
              ? '点击右上角按钮即可向指定成员发起私密或公开的沟通'
              : 'Use the button above to send a private or public request to one teammate'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">{listItems.map(renderRequestCard)}</div>
      )}
    </div>
  );
};
