'use client';

import React, { useState } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import {
  DEFAULT_UNIVERSAL_VENUES,
  STANDARD_PAPER_MILESTONES,
  normalizeExternalUrl,
  parseVenueImportText,
} from '@/utils/venues';
import {
  DEFAULT_OUTREACH_TRACKS,
} from '@/utils/outreachTracks';
import {
  BookOpen,
  CalendarClock,
  Check,
  ExternalLink,
  Globe,
  Link2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';

export const VenuesTab: React.FC = () => {
  const {
    venues,
    addVenue,
    addVenues,
    updateVenue,
    deleteVenue,
    outreachTracks,
    addOutreachTrack,
    removeOutreachTrack,
    members,
    currentUserId,
    language,
    t,
  } = useLabFlow();

  const isZh = language === 'zh';
  const [newVenueName, setNewVenueName] = useState('');
  const [newVenueTag, setNewVenueTag] = useState('');
  const [newVenueUrl, setNewVenueUrl] = useState('');
  const [newTrackName, setNewTrackName] = useState('');

  const [importText, setImportText] = useState('');
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  const [editingUrlId, setEditingUrlId] = useState<string | null>(null);
  const [editingUrlValue, setEditingUrlValue] = useState('');

  const defaultLeadId = currentUserId || members[0]?.id || 'member-pi';

  const handleAddVenue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVenueName.trim()) return;
    const cleanUrl = normalizeExternalUrl(newVenueUrl);
    const vTag = newVenueTag.trim() || newVenueName.trim().split(' ')[0];
    addVenue({
      id: `venue-${Date.now()}`,
      name: newVenueName.trim(),
      tag: vTag,
      url: cleanUrl,
      defaultLeadId,
      milestones: structuredClone(STANDARD_PAPER_MILESTONES),
    });
    setNewVenueName('');
    setNewVenueTag('');
    setNewVenueUrl('');
  };

  const handleImportVenues = () => {
    const parsed = parseVenueImportText(importText, defaultLeadId);
    if (parsed.length === 0) {
      setImportFeedback(
        isZh
          ? '请至少粘贴一行会议/期刊网页 URL，或使用「全称 | 短标签 | URL」格式。'
          : 'Paste at least one journal/conference URL or "Venue Name | Tag | URL" line.'
      );
      return;
    }
    const addedCount = addVenues(parsed);
    if (addedCount > 0) {
      setImportFeedback(
        isZh
          ? `已成功导入 ${addedCount} 个目标期刊/会议并支持点击直达。`
          : `Imported ${addedCount} venue${addedCount === 1 ? '' : 's'} into the library.`
      );
      setImportText('');
    } else {
      setImportFeedback(
        isZh
          ? '输入的期刊或会议已存在于库中（按 URL 或名称自动去重）。'
          : 'All entered venues are already in your library (matched by URL or name).'
      );
    }
  };

  const handleLoadUniversalPresets = () => {
    const addedCount = addVenues(DEFAULT_UNIVERSAL_VENUES);
    setImportFeedback(
      addedCount > 0
        ? isZh
          ? `已补充 ${addedCount} 个常见跨学科顶刊/顶会示例。`
          : `Added ${addedCount} sample cross-disciplinary journals & conferences.`
        : isZh
        ? '常见跨学科示例库已全部加载。'
        : 'All sample cross-disciplinary venues are already loaded.'
    );
  };

  const handleSaveInlineUrl = (venueId: string) => {
    const normalized = normalizeExternalUrl(editingUrlValue);
    updateVenue(venueId, { url: normalized });
    setEditingUrlId(null);
    setEditingUrlValue('');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {t.tabVenues} ({venues.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isZh
              ? '管理学术期刊、顶会及基金报告渠道，绑定官网后可在任务卡与倒排计划中一键跳转。'
              : 'Manage target journals, conferences, and grant outlets with clickable webpage links across tasks and reverse DDL planning.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadUniversalPresets}
          className="px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20 text-[11px] font-semibold flex items-center gap-1.5 transition-colors shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isZh ? '加载跨学科顶刊示例' : 'Load Sample Venues'}</span>
        </button>
      </div>

      {/* Existing Venues & Links */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {venues.map((v) => {
          const safeUrl = normalizeExternalUrl(v.url);
          const isEditingUrl = editingUrlId === v.id;

          return (
            <div
              key={v.id}
              className="p-3 rounded-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                        {v.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {v.tag}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] text-slate-500">
                        {v.milestones.length}{' '}
                        {isZh ? '个默认倒排节点' : `milestone${v.milestones.length === 1 ? '' : 's'}`}
                      </span>
                      {safeUrl ? (
                        <a
                          href={safeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 text-[10px] font-medium transition-colors max-w-[260px] truncate"
                          title={safeUrl}
                        >
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">
                            {isZh ? '打开官方网站' : 'Open Venue Webpage'}
                          </span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">
                          {isZh ? '暂未绑定网址' : 'No URL attached'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (isEditingUrl) {
                        setEditingUrlId(null);
                      } else {
                        setEditingUrlId(v.id);
                        setEditingUrlValue(v.url || '');
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title={isZh ? '编辑网址' : 'Edit webpage URL'}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (venues.length > 1) deleteVenue(v.id);
                    }}
                    disabled={venues.length <= 1}
                    className="p-1.5 text-slate-400 hover:text-rose-500 disabled:opacity-30 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title={isZh ? '删除' : 'Remove venue'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {isEditingUrl && (
                <div className="flex items-center gap-2 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                  <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="url"
                    value={editingUrlValue}
                    onChange={(e) => setEditingUrlValue(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveInlineUrl(v.id)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>{isZh ? '保存' : 'Save'}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Paste / Import Venue Webpages */}
      <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            {isZh
              ? '批量导入期刊 / 会议网址'
              : 'Import Venue Webpages (Batch URL Paste)'}
          </span>
          <span className="text-[10px] text-slate-500">
            {isZh
              ? '支持纯 URL 或「名称 | 标签 | URL」'
              : 'Supports raw URLs or "Venue Name | Tag | URL"'}
          </span>
        </div>

        <textarea
          rows={3}
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder={
            isZh
              ? '每行粘贴一个网址或条目，例如：\nhttps://www.nature.com/ncomms/\nScience Translational Medicine | Sci Transl Med | https://www.science.org/journal/stm'
              : 'Paste one URL or line per entry, e.g.\nhttps://www.nature.com/ncomms/\nScience Translational Medicine | Sci Transl Med | https://www.science.org/journal/stm'
          }
          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono"
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          {importFeedback ? (
            <span className="text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
              {importFeedback}
            </span>
          ) : (
            <span className="text-[11px] text-slate-500">
              {isZh
                ? '导入后将自动在任务卡、项目卡及时间线生成直达链接。'
                : 'Imported venues immediately become clickable links across tasks, projects, and timelines.'}
            </span>
          )}
          <button
            type="button"
            onClick={handleImportVenues}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            {isZh ? '立即导入' : 'Import Venues'}
          </button>
        </div>
      </div>

      {/* Add Single Custom Venue */}
      <form
        onSubmit={handleAddVenue}
        className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 space-y-3"
      >
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          {isZh ? '添加单个自定义期刊 / 会议' : 'Add Custom Journal or Conference'}
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="text"
            required
            value={newVenueName}
            onChange={(e) => setNewVenueName(e.target.value)}
            placeholder={isZh ? '全称 (例如 Nature Biotechnology)' : 'Full Name (e.g. Nature Biotechnology)'}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
          />
          <input
            type="text"
            value={newVenueTag}
            onChange={(e) => setNewVenueTag(e.target.value)}
            placeholder={isZh ? '简短标签 (例如 Nat Biotech)' : 'Short Tag (e.g. Nat Biotech)'}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <input
          type="url"
          value={newVenueUrl}
          onChange={(e) => setNewVenueUrl(e.target.value)}
          placeholder={isZh ? '官网链接 URL (https://...)' : 'Venue Webpage URL (https://...)'}
          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
        />
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            {t.addVenue}
          </button>
        </div>
      </form>

      {/* Customizable Outreach & Translation Tracks */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 space-y-3">
        <div>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <CalendarClock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            {isZh
              ? '成果转化与外联出口标签 (Outreach & Workshops)'
              : 'Outreach & Translation Track Labels'}
          </span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {isZh
              ? '为课题配置汇报、临床/产业转化、政策简报或工作坊去向（同步显示在“项目与转化”排期与看板筛选中）。'
              : 'Define downstream outlets (e.g., Seminars, Clinical/Industry Partners, Policy Briefs, Open-Source) used across Outreach scheduling and Kanban filtering.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {outreachTracks.map((track) => (
            <span
              key={track}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-200"
            >
              <span>{track}</span>
              <button
                type="button"
                onClick={() => removeOutreachTrack(track)}
                className="text-slate-400 hover:text-rose-500"
                title={isZh ? '移除标签' : 'Remove track'}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={newTrackName}
            onChange={(e) => setNewTrackName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (newTrackName.trim()) {
                  addOutreachTrack(newTrackName.trim());
                  setNewTrackName('');
                }
              }
            }}
            placeholder={
              isZh
                ? '添加转化去向标签 (例如：Clinical Trial / 政策专报)...'
                : 'Add track label (e.g. Clinical Trial, Annual Symposium)...'
            }
            className="flex-1 min-w-[200px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            onClick={() => {
              if (!newTrackName.trim()) return;
              addOutreachTrack(newTrackName.trim());
              setNewTrackName('');
            }}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isZh ? '添加出口' : 'Add Track'}</span>
          </button>
          <button
            type="button"
            onClick={() => DEFAULT_OUTREACH_TRACKS.forEach((tr) => addOutreachTrack(tr))}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-indigo-500 text-[11px] font-medium"
          >
            {isZh ? '恢复默认建议标签' : 'Add Defaults'}
          </button>
        </div>
      </div>
    </div>
  );
};
