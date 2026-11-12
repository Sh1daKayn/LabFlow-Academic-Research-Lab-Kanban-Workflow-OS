'use client';

import React, { useState, useRef } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import {
  AI_IMPORT_PROMPT_ZH,
  AI_IMPORT_PROMPT_EN,
  AI_SAMPLE_OUTPUT_ZH,
  AI_SAMPLE_OUTPUT_EN,
  parseAIDocumentText,
  ParsedAIData,
} from '@/utils/aiDocumentParser';
import {
  Sparkles,
  Copy,
  Check,
  FileText,
  Upload,
  RotateCcw,
  Users,
  FolderGit2,
  ListTodo,
  Server,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  X,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const AIImportModal: React.FC = () => {
  const {
    isAIImportOpen,
    setIsAIImportOpen,
    applyAIImport,
    language,
    t,
    members,
    projects,
    stages,
    addToast,
  } = useLabFlow();

  const [inputRawText, setInputRawText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [parsedResult, setParsedResult] = useState<ParsedAIData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'overwrite' | 'append'>('overwrite');
  const [activePreviewTab, setActivePreviewTab] = useState<'all' | 'members' | 'projects' | 'tasks'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isAIImportOpen) return null;

  const promptText = language === 'zh' ? AI_IMPORT_PROMPT_ZH : AI_IMPORT_PROMPT_EN;
  const sampleOutput = language === 'zh' ? AI_SAMPLE_OUTPUT_ZH : AI_SAMPLE_OUTPUT_EN;

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      addToast(t.promptCopied, '', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      addToast(language === 'zh' ? '复制失败，请手动选取复制' : 'Failed to copy', '', 'error');
    }
  };

  const handleLoadSample = () => {
    setInputRawText(sampleOutput);
    setParseError(null);
    // Auto-parse sample
    const res = parseAIDocumentText(sampleOutput, members, projects, stages);
    if (res.success && res.data) {
      setParsedResult(res.data);
      addToast(language === 'zh' ? '已填入典型科研团队示例并完成解析' : 'Loaded and parsed sample data', '', 'info');
    }
  };

  const handleParse = () => {
    if (!inputRawText.trim()) {
      setParseError(language === 'zh' ? '请先粘贴 AI 生成的内容' : 'Please paste AI output text first');
      return;
    }

    const res = parseAIDocumentText(inputRawText, members, projects, stages);
    if (res.success && res.data) {
      setParsedResult(res.data);
      setParseError(null);
      addToast(
        language === 'zh' ? '解析成功！请检查识别出的项目与成员' : 'Parsing successful! Review items below',
        '',
        'success'
      );
    } else {
      setParseError(res.error || t.parsingFailed);
      setParsedResult(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setInputRawText(content);
        const res = parseAIDocumentText(content, members, projects, stages);
        if (res.success && res.data) {
          setParsedResult(res.data);
          setParseError(null);
          addToast(language === 'zh' ? '文件读取并解析成功！' : 'File uploaded and parsed successfully!', '', 'success');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleApply = () => {
    if (!parsedResult) return;
    applyAIImport(parsedResult, importMode);
    setIsAIImportOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{t.aiImportTitle}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                  {language === 'zh' ? '一键冷启动' : 'One-Click Onboarding'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                {t.aiImportDesc}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAIImportOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-xs">
          {/* STEP 1: Copy AI Prompt */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px]">
                  1
                </span>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs tracking-wide">
                  {t.aiImportStep1}
                </h3>
              </div>

              <button
                type="button"
                onClick={handleCopyPrompt}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t.promptCopied : t.copyPrompt}</span>
              </button>
            </div>

            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              {t.aiImportStep1Hint}
            </p>

            <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/80 p-3 max-h-36 overflow-y-auto font-mono text-[11px] text-slate-700 dark:text-slate-300">
              <pre className="whitespace-pre-wrap">{promptText}</pre>
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300">
              <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {language === 'zh'
                  ? '老师操作小窍门：无论手头是组会记录、国自然申请书、排期 Excel 还是微信群通知，直接复制全部文字，连同此提示词一起发给 AI 即可，AI 会自动按规范抽取结构！'
                  : 'Tip: You can paste messy meeting notes, grant proposals, Excel rows, or chat logs along with this prompt to ChatGPT or Claude.'}
              </span>
            </div>
          </section>

          {/* STEP 2: Paste AI Output */}
          <section className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-600 text-white font-bold text-[10px]">
                  2
                </span>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs tracking-wide">
                  {t.aiImportStep2}
                </h3>
              </div>

              {/* Auxiliary Quick Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-medium"
                >
                  <FileText className="w-3 h-3" />
                  <span>{t.loadSampleData}</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-indigo-500"
                  title="Upload .json, .txt or .md"
                >
                  <Upload className="w-3 h-3" />
                  <span>{language === 'zh' ? '上传文档' : 'Upload'}</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".json,.txt,.md"
                  className="hidden"
                />

                {inputRawText && (
                  <button
                    type="button"
                    onClick={() => {
                      setInputRawText('');
                      setParsedResult(null);
                      setParseError(null);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-500"
                    title={t.clearInput}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <p className="text-slate-500 dark:text-slate-400">
              {t.aiImportStep2Hint}
            </p>

            <div className="relative">
              <textarea
                value={inputRawText}
                onChange={(e) => setInputRawText(e.target.value)}
                placeholder={
                  language === 'zh'
                    ? '在此粘贴 AI 生成的代码块或 JSON 内容 (如 ```json { "members": [...], "projects": [...] } ```)...'
                    : 'Paste the generated markdown code block or JSON here...'
                }
                rows={7}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 p-3 font-mono text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-cyan-500/70"
              />
            </div>

            {parseError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleParse}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t.parseAndPreview}</span>
              </button>
            </div>
          </section>

          {/* STEP 3: Preview & Confirm (Conditional) */}
          {parsedResult && (
            <section className="space-y-4 border-t border-slate-200 dark:border-slate-800 pt-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px]">
                    3
                  </span>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs tracking-wide">
                    {t.aiImportStep3}
                  </h3>
                </div>

                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t.detectedSummary}</span>
                </span>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                      {parsedResult.members.length}
                    </span>
                    <span className="block text-[10px] text-slate-500 font-medium">
                      {t.membersFound}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
                    <FolderGit2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                      {parsedResult.projects.length}
                    </span>
                    <span className="block text-[10px] text-slate-500 font-medium">
                      {t.projectsFound}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <ListTodo className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                      {parsedResult.tasks.length}
                    </span>
                    <span className="block text-[10px] text-slate-500 font-medium">
                      {t.tasksFound}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                      {parsedResult.resources.length}
                    </span>
                    <span className="block text-[10px] text-slate-500 font-medium">
                      {t.resourcesFound}
                    </span>
                  </div>
                </div>
              </div>

              {/* Preview Lists Filter */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2 text-[11px]">
                  <button
                    onClick={() => setActivePreviewTab('all')}
                    className={`px-2.5 py-1 rounded-md font-semibold ${
                      activePreviewTab === 'all'
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    全部识别项
                  </button>
                  <button
                    onClick={() => setActivePreviewTab('tasks')}
                    className={`px-2.5 py-1 rounded-md font-semibold ${
                      activePreviewTab === 'tasks'
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    推进任务 ({parsedResult.tasks.length})
                  </button>
                  <button
                    onClick={() => setActivePreviewTab('projects')}
                    className={`px-2.5 py-1 rounded-md font-semibold ${
                      activePreviewTab === 'projects'
                        ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    科研课题 ({parsedResult.projects.length})
                  </button>
                  <button
                    onClick={() => setActivePreviewTab('members')}
                    className={`px-2.5 py-1 rounded-md font-semibold ${
                      activePreviewTab === 'members'
                        ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    人员名单 ({parsedResult.members.length})
                  </button>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
                  {/* Tasks preview */}
                  {(activePreviewTab === 'all' || activePreviewTab === 'tasks') &&
                    parsedResult.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 text-[11px]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-[10px] shrink-0">
                            {task.stage}
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {task.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 text-slate-500 font-mono text-[10px]">
                          <span>{task.leadAuthorName}</span>
                          <span>{task.deadline}</span>
                        </div>
                      </div>
                    ))}

                  {/* Projects preview */}
                  {(activePreviewTab === 'all' || activePreviewTab === 'projects') &&
                    parsedResult.projects.map((proj) => (
                      <div
                        key={proj.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-900/40 text-[11px]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold text-[10px] shrink-0">
                            {proj.tag}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {proj.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono shrink-0">
                          {proj.targetVenue}
                        </span>
                      </div>
                    ))}

                  {/* Members preview */}
                  {(activePreviewTab === 'all' || activePreviewTab === 'members') &&
                    parsedResult.members.map((mem) => (
                      <div
                        key={mem.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 text-[11px]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {mem.nameZh}
                          </span>
                          <span className="text-slate-400 font-mono">({mem.nameEn})</span>
                          <span className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300 text-[10px]">
                            {mem.role}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">{mem.titleZh}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Import Mode Selector */}
              <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-4">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                  {t.importMode}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      importMode === 'overwrite'
                        ? 'border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="overwrite"
                      checked={importMode === 'overwrite'}
                      onChange={() => setImportMode('overwrite')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">
                        {t.modeOverwrite}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {t.modeOverwriteDesc}
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      importMode === 'append'
                        ? 'border-cyan-500 bg-cyan-500/5 ring-1 ring-cyan-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="mt-0.5 text-cyan-600 focus:ring-cyan-500"
                    />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">
                        {t.modeAppend}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {t.modeAppendDesc}
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>
              {language === 'zh'
                ? '导入数据仅在当前浏览器本地安全存储，不上传外部服务器。'
                : 'Data is securely stored strictly on your local browser.'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAIImportOpen(false)}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium"
            >
              {t.cancel}
            </button>

            <button
              type="button"
              disabled={!parsedResult}
              onClick={handleApply}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white shadow-md transition-all ${
                parsedResult
                  ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:opacity-95'
                  : 'bg-slate-400 dark:bg-slate-800 cursor-not-allowed opacity-50'
              }`}
            >
              <span>{t.confirmImport}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
