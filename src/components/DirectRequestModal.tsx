'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { X, Send, Lock, Globe, ChevronDown, ChevronRight, UserCheck } from 'lucide-react';
import { useLabFlow } from '@/context/LabFlowContext';
import { DirectRequestKind, RequestVisibility, WorkCategory } from '@/types';
import { getMemberDisplayName } from '@/utils/avatar';
import { DIRECT_REQUEST_KINDS } from '@/utils/directRequests';
import {
  WORK_CATEGORIES,
  WORK_CATEGORY_META,
  resolveProjectWorkCategory,
  resolveTaskWorkCategory,
} from '@/utils/workCategory';

export const DirectRequestModal: React.FC = () => {
  const {
    isRequestModalOpen,
    setIsRequestModalOpen,
    requestModalSeed,
    members,
    projects,
    tasks,
    currentUserId,
    language,
    sendDirectRequest,
  } = useLabFlow();

  const isZh = language === 'zh';

  const recipientCandidates = useMemo(() => {
    const others = members.filter((m) => m.id !== currentUserId);
    return others.length > 0 ? others : members;
  }, [members, currentUserId]);

  const defaultRecipientId = useMemo(() => {
    if (requestModalSeed?.recipientId) {
      const match = recipientCandidates.find((m) => m.id === requestModalSeed.recipientId);
      if (match) return match.id;
    }
    const pi = recipientCandidates.find(
      (m) => m.accessRole === 'ADMIN_PI' || m.role === 'PI'
    );
    return pi?.id || recipientCandidates[0]?.id || '';
  }, [recipientCandidates, requestModalSeed]);

  const [recipientId, setRecipientId] = useState(defaultRecipientId);
  const [kind, setKind] = useState<DirectRequestKind>('PROJECT_SYNC');
  const [visibility, setVisibility] = useState<RequestVisibility>('PRIVATE');
  const [workCategory, setWorkCategory] = useState<WorkCategory | ''>('');
  const [projectId, setProjectId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showContextFields, setShowContextFields] = useState(false);

  useEffect(() => {
    if (!isRequestModalOpen) return;
    setRecipientId(defaultRecipientId);
    setKind(requestModalSeed?.kind || 'PROJECT_SYNC');
    setVisibility('PRIVATE');
    setProjectId(requestModalSeed?.projectId || '');
    setTaskId(requestModalSeed?.taskId || '');
    setTitle(requestModalSeed?.title || '');
    setContent('');
    setDueDate('');

    if (requestModalSeed?.workCategory) {
      setWorkCategory(requestModalSeed.workCategory);
    } else if (requestModalSeed?.taskId) {
      const tItem = tasks.find((t) => t.id === requestModalSeed.taskId);
      setWorkCategory(tItem ? resolveTaskWorkCategory(tItem, projects) : '');
    } else if (requestModalSeed?.projectId) {
      const pItem = projects.find((p) => p.id === requestModalSeed.projectId);
      setWorkCategory(pItem ? resolveProjectWorkCategory(pItem) : '');
    } else {
      setWorkCategory('');
    }
    setShowContextFields(Boolean(requestModalSeed?.projectId || requestModalSeed?.taskId));
  }, [isRequestModalOpen, defaultRecipientId, requestModalSeed, tasks, projects]);

  if (!isRequestModalOpen) return null;

  const filteredTasks = projectId
    ? tasks.filter((t) => t.projectId === projectId)
    : tasks;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientId || !title.trim()) return;

    const derivedCategory =
      workCategory ||
      (projectId
        ? resolveProjectWorkCategory(projects.find((p) => p.id === projectId))
        : undefined);

    sendDirectRequest({
      kind,
      title: title.trim(),
      content: content.trim(),
      recipientId,
      visibility,
      workCategory: derivedCategory || undefined,
      projectId: projectId || undefined,
      taskId: taskId || undefined,
      dueDate: dueDate || undefined,
    });
    setIsRequestModalOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
      onClick={() => setIsRequestModalOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              {isZh ? '发起 1 对 1 申请 / 交流' : 'New 1-on-1 Request / Message'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isZh
                ? '只发送给选定的一位接收人，可自主选择隐私或组内公开'
                : 'Sent strictly to one selected person; choose private or group visibility'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsRequestModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Strictly Single Recipient + Request Kind */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                {isZh ? '发送给（仅限 1 人）*' : 'Send To (Single Recipient) *'}
              </label>
              <select
                required
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
              >
                {recipientCandidates.map((m) => (
                  <option key={m.id} value={m.id}>
                    {getMemberDisplayName(m, language, m.id)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                {isZh ? '申请 / 交流类型' : 'Request Type'}
              </label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as DirectRequestKind)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
              >
                {DIRECT_REQUEST_KINDS.map((k) => (
                  <option key={k.id} value={k.id}>
                    {isZh ? k.labelZh : k.labelEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Visibility: Private vs Public */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              {isZh ? '可见范围设置' : 'Privacy Setting'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVisibility('PRIVATE')}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                  visibility === 'PRIVATE'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <Lock className="w-4 h-4 shrink-0" />
                <div>
                  <div className="text-xs font-semibold">
                    {isZh ? '隐私（默认）' : 'Private (Default)'}
                  </div>
                  <div className="text-[11px] opacity-75">
                    {isZh ? '仅我与对方可见' : 'Only you & recipient'}
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setVisibility('PUBLIC')}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                  visibility === 'PUBLIC'
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-200'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <Globe className="w-4 h-4 shrink-0" />
                <div>
                  <div className="text-xs font-semibold">
                    {isZh ? '公开（组内可见）' : 'Public (Lab Feed)'}
                  </div>
                  <div className="text-[11px] opacity-75">
                    {isZh ? '切换「组内公开」可见' : 'Visible in Group view'}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Title & Content */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              {isZh ? '主题 / 标题 *' : 'Subject *'}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                isZh
                  ? '简明说明需要对接、审阅或沟通的事项'
                  : 'Briefly state what you need from this person'
              }
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              {isZh ? '详细说明 / 期望反馈' : 'Details / Expected Feedback'}
            </label>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                isZh
                  ? '补充背景、时间节点或具体问题...'
                  : 'Add background context, deadline, or questions...'
              }
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          {/* Optional Association (Progressive Disclosure) */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowContextFields((v) => !v)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50/70 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/70"
            >
              <span>
                {isZh
                  ? '关联业务分类 / 项目 / 截止节点（可选）'
                  : 'Link Category, Project or Due Date (Optional)'}
              </span>
              {showContextFields ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            {showContextFields && (
              <div className="p-3.5 space-y-3 bg-white dark:bg-slate-900">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      {isZh ? '归属类别' : 'Work Category'}
                    </label>
                    <select
                      value={workCategory}
                      onChange={(e) => setWorkCategory(e.target.value as WorkCategory | '')}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs"
                    >
                      <option value="">{isZh ? '自动 / 不限' : 'Auto / Unspecified'}</option>
                      {WORK_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {isZh
                            ? WORK_CATEGORY_META[cat].labelZh
                            : WORK_CATEGORY_META[cat].labelEn}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      {isZh ? '期望回复 / 节点日期' : 'Target Date'}
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      {isZh ? '关联项目 / 论文' : 'Project / Paper'}
                    </label>
                    <select
                      value={projectId}
                      onChange={(e) => {
                        setProjectId(e.target.value);
                        setTaskId('');
                      }}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs"
                    >
                      <option value="">{isZh ? '不关联' : 'None'}</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.tag} · {p.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      {isZh ? '关联任务节点' : 'Linked Task'}
                    </label>
                    <select
                      value={taskId}
                      onChange={(e) => setTaskId(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs"
                    >
                      <option value="">{isZh ? '不关联' : 'None'}</option>
                      {filteredTasks.map((tItem) => (
                        <option key={tItem.id} value={tItem.id}>
                          {tItem.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsRequestModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {isZh ? '取消' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              {isZh ? '发送 1 对 1 请求' : 'Send 1-on-1 Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
