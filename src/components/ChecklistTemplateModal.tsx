'use client';

import React, { useEffect, useState } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import { ChecklistAcceptanceTemplate, ChecklistTemplateEntry, Priority } from '@/types';
import { parseMultilineTemplateEntries } from '@/utils/templates';
import {
  ArrowDown,
  ArrowUp,
  BookmarkPlus,
  Check,
  Copy,
  FilePlus2,
  ListChecks,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';

function createEmptyEntry(): ChecklistTemplateEntry {
  return {
    text: '',
    acceptanceCriteria: '',
    priority: 'MEDIUM',
  };
}

export const ChecklistTemplateModal: React.FC = () => {
  const {
    isTemplateModalOpen,
    setIsTemplateModalOpen,
    templateDraftSeed,
    setTemplateDraftSeed,
    checklistTemplates,
    saveChecklistTemplate,
    deleteChecklistTemplate,
    resetChecklistTemplates,
    injectTemplateToTask,
    injectTemplateToWeeklyTodos,
    currentAccessRole,
    effectiveIsAdmin,
    language,
    addToast,
  } = useLabFlow();

  const isZh = language === 'zh';
  const canEditTemplates = currentAccessRole !== 'AUDITOR_GUEST' || effectiveIsAdmin;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<ChecklistTemplateEntry[]>([createEmptyEntry()]);
  const [showBatchBox, setShowBatchBox] = useState(false);
  const [batchRaw, setBatchRaw] = useState('');

  const loadTemplateIntoForm = (tpl: ChecklistAcceptanceTemplate) => {
    setSelectedId(tpl.id);
    setName(tpl.name);
    setCategory(tpl.category || '');
    setDescription(tpl.description || '');
    setItems(
      tpl.items.length > 0
        ? tpl.items.map((item) => ({
            text: item.text,
            acceptanceCriteria: item.acceptanceCriteria || '',
            priority: item.priority || 'MEDIUM',
          }))
        : [createEmptyEntry()]
    );
  };

  useEffect(() => {
    if (!isTemplateModalOpen) return;

    if (templateDraftSeed) {
      if (templateDraftSeed.templateId) {
        const matched = checklistTemplates.find((tpl) => tpl.id === templateDraftSeed.templateId);
        if (matched) {
          loadTemplateIntoForm(matched);
          return;
        }
      }
      setSelectedId(null);
      setName(
        templateDraftSeed.name ||
          (isZh ? '新建自定义清单与验收模板' : 'Custom Checklist & Acceptance Template')
      );
      setCategory(templateDraftSeed.category || (isZh ? '自定义' : 'Custom'));
      setDescription(templateDraftSeed.description || '');
      setItems(
        templateDraftSeed.items && templateDraftSeed.items.length > 0
          ? templateDraftSeed.items.map((item) => ({
              text: item.text,
              acceptanceCriteria: item.acceptanceCriteria || '',
              priority: item.priority || 'MEDIUM',
            }))
          : [createEmptyEntry()]
      );
      return;
    }

    if (checklistTemplates.length > 0) {
      const existingSelected = selectedId
        ? checklistTemplates.find((tpl) => tpl.id === selectedId)
        : undefined;
      loadTemplateIntoForm(existingSelected || checklistTemplates[0]);
    } else {
      setSelectedId(null);
      setName('');
      setCategory('');
      setDescription('');
      setItems([createEmptyEntry()]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTemplateModalOpen, templateDraftSeed]);

  if (!isTemplateModalOpen) return null;

  const closeModal = () => {
    setIsTemplateModalOpen(false);
    setTemplateDraftSeed(null);
    setShowBatchBox(false);
    setBatchRaw('');
  };

  const handleStartNew = () => {
    setSelectedId(null);
    setName('');
    setCategory(isZh ? '自定义' : 'Custom');
    setDescription('');
    setItems([createEmptyEntry()]);
  };

  const handleDuplicate = (tpl: ChecklistAcceptanceTemplate) => {
    const saved = saveChecklistTemplate({
      name: `${tpl.name} (${isZh ? '副本' : 'Copy'})`,
      category: tpl.category,
      description: tpl.description,
      items: tpl.items,
    });
    if (saved) {
      loadTemplateIntoForm(saved);
    }
  };

  const handleUpdateRow = (index: number, patch: Partial<ChecklistTemplateEntry>) => {
    setItems((prev) => prev.map((row, idx) => (idx === index ? { ...row, ...patch } : row)));
  };

  const handleMoveRow = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return next;
    });
  };

  const handleParseBatch = () => {
    const parsed = parseMultilineTemplateEntries(batchRaw);
    if (parsed.length === 0) {
      addToast(
        isZh ? '未检测到有效条目文本' : 'No valid lines detected',
        '',
        'warning'
      );
      return;
    }
    setItems((prev) => {
      const nonEmpty = prev.filter((row) => row.text.trim().length > 0);
      return [...nonEmpty, ...parsed];
    });
    setBatchRaw('');
    setShowBatchBox(false);
    addToast(
      isZh ? `已拆入 ${parsed.length} 条模板项` : `Parsed ${parsed.length} entries`,
      '',
      'success'
    );
  };

  const saveCurrentTemplate = (): ChecklistAcceptanceTemplate | null => {
    const saved = saveChecklistTemplate({
      id: selectedId || undefined,
      name,
      category,
      description,
      items,
    });
    if (saved) {
      setSelectedId(saved.id);
      setTemplateDraftSeed(null);
    }
    return saved;
  };

  const handleSaveOnly = (e: React.FormEvent) => {
    e.preventDefault();
    saveCurrentTemplate();
  };

  const handleSaveAndInjectTask = (alsoPushWeeklyTodos: boolean) => {
    const saved = saveCurrentTemplate();
    if (!saved || !templateDraftSeed?.targetTaskId) return;
    injectTemplateToTask({
      taskId: templateDraftSeed.targetTaskId,
      templateId: saved.id,
      alsoPushWeeklyTodos,
    });
    closeModal();
  };

  const handleSaveAndInjectWeek = () => {
    const saved = saveCurrentTemplate();
    if (!saved || !templateDraftSeed?.targetMemberId || !templateDraftSeed?.targetWeekKey) return;
    injectTemplateToWeeklyTodos({
      templateId: saved.id,
      memberId: templateDraftSeed.targetMemberId,
      weekKey: templateDraftSeed.targetWeekKey,
    });
    closeModal();
  };

  const fieldCls =
    'w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-60';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl h-[88vh] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 shrink-0">
              <BookmarkPlus className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold truncate">
                {isZh ? '执行清单与验收项 · 自定义模板库' : 'Checklist & Acceptance Template Library'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {isZh
                  ? '自由沉淀科研清单与对应验收标准模板，支持在任务卡与周待办中一键注入生成。'
                  : 'Create reusable execution checklists + acceptance criteria templates for 1-click injection.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label={isZh ? '关闭模板库' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body: Left Template List + Right Editor */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Template Selector Column */}
          <aside className="w-full md:w-72 shrink-0 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 p-3.5 flex flex-col gap-3 max-h-56 md:max-h-none">
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={!canEditTemplates}
                onClick={handleStartNew}
                className="flex-1 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                <FilePlus2 className="w-3.5 h-3.5" />
                <span>{isZh ? '新建自定义模板' : 'New Template'}</span>
              </button>
              <button
                type="button"
                disabled={!canEditTemplates}
                onClick={resetChecklistTemplates}
                className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50 transition-colors"
                title={isZh ? '恢复系统内置参考模板（不覆盖自定义模板）' : 'Restore starter templates'}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 scrollbar-thin">
              {checklistTemplates.map((tpl) => {
                const isSelected = selectedId === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => loadTemplateIntoForm(tpl)}
                    className={`cursor-pointer p-2.5 rounded-xl border transition-all space-y-1 group ${
                      isSelected
                        ? 'bg-white dark:bg-slate-900 border-indigo-500 ring-1 ring-indigo-500/40 shadow-sm'
                        : 'bg-white/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                        {tpl.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                        {tpl.items.length}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                      <span className="truncate">{tpl.category || (isZh ? '通用模板' : 'General')}</span>
                      {canEditTemplates && (
                        <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicate(tpl);
                            }}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-cyan-600"
                            title={isZh ? '复制一份' : 'Duplicate'}
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteChecklistTemplate(tpl.id);
                              if (selectedId === tpl.id) {
                                handleStartNew();
                              }
                            }}
                            className="p-1 rounded hover:bg-rose-500/15 hover:text-rose-500"
                            title={isZh ? '删除模板' : 'Delete'}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {checklistTemplates.length === 0 && (
                <div className="p-4 text-center text-[11px] text-slate-400 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl">
                  {isZh ? '暂无模板，点击上方新建或恢复内置参考模板' : 'No templates saved'}
                </div>
              )}
            </div>
          </aside>

          {/* Right Form Panel */}
          <form onSubmit={handleSaveOnly} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
              {/* Template Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {isZh ? '模板名称 *' : 'Template Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!canEditTemplates}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isZh ? '例如：CVPR 消融与可视化交付模板' : 'e.g. NeurIPS Reproducibility Checklist'}
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {isZh ? '分类标签' : 'Category'}
                  </label>
                  <input
                    type="text"
                    disabled={!canEditTemplates}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder={isZh ? '如：投稿核查 / 周实验' : 'Submission / Experiment'}
                    className={fieldCls}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {isZh ? '适用场景说明（可选）' : 'Description (optional)'}
                </label>
                <input
                  type="text"
                  disabled={!canEditTemplates}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={isZh ? '简述该模板在什么阶段或周次一键注入使用...' : 'When to apply this template...'}
                  className={fieldCls}
                />
              </div>

              {/* Items Header & Quick Batch Paste */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
                    <ListChecks className="w-4 h-4 text-emerald-500" />
                    <span>
                      {isZh
                        ? `清单条目与对应验收标准 (${items.length} 条)`
                        : `Checklist & Acceptance Entries (${items.length})`}
                    </span>
                  </div>

                  {canEditTemplates && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowBatchBox((v) => !v)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Wand2 className="w-3 h-3" />
                        <span>{isZh ? '多行文本快速拆入' : 'Batch Paste Lines'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setItems((prev) => [...prev, createEmptyEntry()])}
                        className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{isZh ? '添加条目' : 'Add Entry'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {showBatchBox && canEditTemplates && (
                  <div className="p-3 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/20 border border-cyan-500/30 space-y-2">
                    <div className="text-[11px] text-cyan-800 dark:text-cyan-300 font-medium">
                      {isZh
                        ? '每行一条，支持「执行清单内容 | 项验收标准」用竖线隔开自动拆成两栏：'
                        : 'One item per line, optionally formatted as "Checklist title | Acceptance criteria":'}
                    </div>
                    <textarea
                      rows={4}
                      value={batchRaw}
                      onChange={(e) => setBatchRaw(e.target.value)}
                      placeholder={
                        isZh
                          ? '跑完 5 组随机种子消融实验 | 输出均值±方差汇总表\n补齐 Figure 1 矢量框图 | 导出 PDF 且符号与正文完全一致'
                          : 'Run 5 random-seed ablations | Report mean ± std table\nDraw Figure 1 pipeline diagram | Export clean vector PDF'
                      }
                      className="w-full bg-white dark:bg-slate-950 border border-cyan-500/30 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowBatchBox(false)}
                        className="px-3 py-1 rounded-lg text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      >
                        {isZh ? '收起' : 'Cancel'}
                      </button>
                      <button
                        type="button"
                        onClick={handleParseBatch}
                        className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
                      >
                        {isZh ? '拆入列表' : 'Parse & Append'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Rows */}
                <div className="space-y-2">
                  {items.map((row, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-slate-400 font-mono">
                          #{idx + 1}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <select
                            disabled={!canEditTemplates}
                            value={row.priority || 'MEDIUM'}
                            onChange={(e) =>
                              handleUpdateRow(idx, { priority: e.target.value as Priority })
                            }
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md px-2 py-0.5 text-[10px] text-slate-700 dark:text-slate-300"
                          >
                            <option value="URGENT">{isZh ? '紧急' : 'Urgent'}</option>
                            <option value="HIGH">{isZh ? '高优' : 'High'}</option>
                            <option value="MEDIUM">{isZh ? '常规' : 'Medium'}</option>
                            <option value="LOW">{isZh ? '低优' : 'Low'}</option>
                          </select>
                          {canEditTemplates && (
                            <>
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveRow(idx, -1)}
                                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
                                title={isZh ? '上移' : 'Move Up'}
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === items.length - 1}
                                onClick={() => handleMoveRow(idx, 1)}
                                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
                                title={isZh ? '下移' : 'Move Down'}
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={items.length <= 1}
                                onClick={() =>
                                  setItems((prev) => prev.filter((_, i) => i !== idx))
                                }
                                className="p-1 rounded text-slate-400 hover:text-rose-500 disabled:opacity-30"
                                title={isZh ? '移除此条' : 'Remove'}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 mb-0.5">
                            {isZh ? '执行清单事项 *' : 'Checklist / To-Do Title *'}
                          </label>
                          <input
                            type="text"
                            required
                            disabled={!canEditTemplates}
                            value={row.text}
                            onChange={(e) => handleUpdateRow(idx, { text: e.target.value })}
                            placeholder={isZh ? '例如：完成基线模型对比实验' : 'Checklist item text'}
                            className={fieldCls}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 mb-0.5">
                            {isZh ? '项验收标准（注入周待办时自动带上）' : 'Acceptance Criteria (optional)'}
                          </label>
                          <input
                            type="text"
                            disabled={!canEditTemplates}
                            value={row.acceptanceCriteria || ''}
                            onChange={(e) =>
                              handleUpdateRow(idx, { acceptanceCriteria: e.target.value })
                            }
                            placeholder={
                              isZh ? '例如：附精度/显存表格及日志截图' : 'Expected proof / sign-off standard'
                            }
                            className={fieldCls}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Save / Direct Inject Bar */}
            <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {selectedId
                  ? isZh
                    ? '正在编辑已保存模板（保存即同步全实验室成员共享）'
                    : 'Editing saved shared template'
                  : isZh
                  ? '正在创建新模板（保存后全组可一键套用）'
                  : 'Creating new shared template'}
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {isZh ? '取消' : 'Cancel'}
                </button>

                {canEditTemplates && (
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isZh ? '保存模板' : 'Save Template'}</span>
                  </button>
                )}

                {canEditTemplates && templateDraftSeed?.targetTaskId && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSaveAndInjectTask(false)}
                      className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isZh ? '保存并注入任务清单' : 'Save & Inject Task'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveAndInjectTask(true)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <ListChecks className="w-3.5 h-3.5" />
                      <span>{isZh ? '保存并同步生成周待办' : 'Save & Inject + Weekly'}</span>
                    </button>
                  </>
                )}

                {canEditTemplates &&
                  templateDraftSeed?.targetMemberId &&
                  templateDraftSeed?.targetWeekKey && (
                    <button
                      type="button"
                      onClick={handleSaveAndInjectWeek}
                      className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isZh ? '保存并一键生成至本周待办' : 'Save & Inject to Week'}</span>
                    </button>
                  )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
