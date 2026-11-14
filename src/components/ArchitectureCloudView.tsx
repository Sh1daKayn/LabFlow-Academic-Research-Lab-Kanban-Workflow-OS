'use client';

import React, { useMemo, useState } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import { LabMember, ProjectItem, TaskItem } from '@/types';
import {
  aggregateProjectsByCategory,
  buildWordCloudTerms,
  CATEGORY_COLOR_PALETTE,
  getProjectMembers,
  WordCloudTerm,
} from '@/utils/projectAnalytics';
import { MemberAvatar } from '@/components/MemberAvatar';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  FolderKanban,
  FolderPlus,
  GitBranch,
  Layers,
  Network,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react';

interface ProjectEditorModalProps {
  initialProject?: ProjectItem | null;
  existingCategories: string[];
  onClose: () => void;
}

const ProjectEditorModal: React.FC<ProjectEditorModalProps> = ({
  initialProject,
  existingCategories,
  onClose,
}) => {
  const {
    members,
    stages,
    addProject,
    updateProject,
    deleteProject,
    currentUserId,
    language,
    effectiveIsAdmin,
    currentAccessRole,
  } = useLabFlow();
  const isZh = language === 'zh';

  const [title, setTitle] = useState(initialProject?.title || '');
  const [tag, setTag] = useState(initialProject?.tag || '');
  const [category, setCategory] = useState(initialProject?.category || existingCategories[0] || '');
  const [categoryColor, setCategoryColor] = useState(
    initialProject?.categoryColor || CATEGORY_COLOR_PALETTE[0]
  );
  const [targetVenue, setTargetVenue] = useState(initialProject?.targetVenue || '');
  const [submissionDeadline, setSubmissionDeadline] = useState(
    initialProject?.submissionDeadline || ''
  );
  const [status, setStatus] = useState(initialProject?.status || stages[0]?.id || 'IDEATION');
  const [leadAuthorId, setLeadAuthorId] = useState(
    initialProject?.leadAuthorId || currentUserId || members[0]?.id || ''
  );
  const [piId, setPiId] = useState(
    initialProject?.piId ||
      members.find((m) => m.role === 'PI' || m.accessRole === 'ADMIN_PI')?.id ||
      members[0]?.id ||
      ''
  );
  const [memberIds, setMemberIds] = useState<string[]>(
    initialProject?.memberIds ||
      Array.from(new Set([initialProject?.leadAuthorId || currentUserId].filter(Boolean)))
  );
  const [abstract, setAbstract] = useState(initialProject?.abstract || '');

  const toggleMember = (id: string) => {
    setMemberIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const normalizedMembers = Array.from(
      new Set([...memberIds, leadAuthorId, piId].filter(Boolean))
    );
    const payload = {
      title: title.trim(),
      tag: tag.trim() || title.trim().split(/\s+/)[0]?.slice(0, 14) || 'Project',
      category: category.trim() || undefined,
      categoryColor,
      memberIds: normalizedMembers,
      targetVenue: targetVenue.trim() || 'Target Venue',
      submissionDeadline: submissionDeadline || undefined,
      status,
      leadAuthorId,
      piId,
      abstract: abstract.trim() || undefined,
      assets: initialProject?.assets || {},
      visibility: initialProject?.visibility || 'PUBLIC',
    };

    if (initialProject) {
      updateProject(initialProject.id, payload);
    } else {
      addProject(payload);
    }
    onClose();
  };

  const inputClass =
    'w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-600 dark:text-violet-400">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold">
              {initialProject
                ? isZh
                  ? '编辑课题项目与大类归属'
                  : 'Edit Project & Category'
                : isZh
                ? '新建课题项目并归类'
                : 'New Categorized Project'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isZh
                ? '设置项目所属大类、负责人及联合参与人员，架构树与人数统计将实时更新。'
                : 'Assign category direction and participating members to update headcounts & architecture tree.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              {isZh ? '课题 / 论文完整名称 *' : 'Project / Paper Title *'}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isZh ? '例如：基于多智能体共识的具身调度算法研究' : 'Project title'}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                {isZh ? '所属研究大类（可选已有或输入新大类）' : 'Research Category'}
              </label>
              <input
                type="text"
                list="labflow-existing-categories"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder={isZh ? '如：具身智能 / 分布式优化 / 计量实证' : 'e.g. Embodied AI'}
                className={inputClass}
              />
              <datalist id="labflow-existing-categories">
                {existingCategories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                {isZh ? '大类颜色标识' : 'Category Color'}
              </label>
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {CATEGORY_COLOR_PALETTE.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setCategoryColor(hex)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      categoryColor === hex ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                {isZh ? '简称标签' : 'Badge Tag'}
              </label>
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="AAAI '27"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                {isZh ? '目标期刊 / 会议' : 'Target Venue'}
              </label>
              <input
                type="text"
                value={targetVenue}
                onChange={(e) => setTargetVenue(e.target.value)}
                placeholder="NeurIPS 2027"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                {isZh ? '当前阶段' : 'Stage'}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={inputClass}
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {isZh ? s.labelZh : s.labelEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                {isZh ? '投稿截稿日' : 'Deadline'}
              </label>
              <input
                type="date"
                value={submissionDeadline}
                onChange={(e) => setSubmissionDeadline(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                {isZh ? '第一作者 / 主责人' : 'Lead Author'}
              </label>
              <select
                value={leadAuthorId}
                onChange={(e) => setLeadAuthorId(e.target.value)}
                className={inputClass}
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {isZh ? m.nameZh : m.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                {isZh ? '指导导师 (PI)' : 'Supervisor / PI'}
              </label>
              <select
                value={piId}
                onChange={(e) => setPiId(e.target.value)}
                className={inputClass}
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {isZh ? m.nameZh : m.nameEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              {isZh
                ? `项目联合负责 / 参与成员（已勾选 ${memberIds.length} 人）`
                : `Project Team Members (${memberIds.length} selected)`}
            </label>
            <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              {members.map((m) => {
                const selected =
                  memberIds.includes(m.id) || leadAuthorId === m.id || piId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMember(m.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs transition-all ${
                      selected
                        ? 'bg-indigo-600/15 border-indigo-500 text-indigo-700 dark:text-indigo-200 font-semibold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <MemberAvatar member={m} size="xs" />
                    <span>{isZh ? m.nameZh : m.nameEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              {isZh ? '课题摘要与目标说明' : 'Abstract / Scope'}
            </label>
            <textarea
              rows={2}
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            <div>
              {initialProject &&
                (effectiveIsAdmin ||
                  ((currentAccessRole === 'SYS_ADMIN' || currentAccessRole === 'PROJECT_LEAD') &&
                    initialProject.visibility !== 'PI_ONLY')) && (
                <button
                  type="button"
                  onClick={() => {
                    if (
                      confirm(
                        isZh
                          ? `确认删除项目「${initialProject.title}」吗？`
                          : `Delete project "${initialProject.title}"?`
                      )
                    ) {
                      deleteProject(initialProject.id);
                      onClose();
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-rose-600 hover:bg-rose-500/10 font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isZh ? '删除项目' : 'Delete'}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium"
              >
                {isZh ? '取消' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-sm"
              >
                {isZh ? '保存项目设置' : 'Save Project'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

interface PlacedWord extends WordCloudTerm {
  x: number;
  y: number;
  fontSize: number;
  rotate: number;
}

/**
 * Deterministic bounding-box collision-free spiral word cloud layout on a fixed SVG viewBox.
 */
function layoutWordCloudSvg(terms: WordCloudTerm[], width = 880, height = 290): PlacedWord[] {
  if (terms.length === 0) return [];
  const maxWeight = Math.max(...terms.map((t) => t.weight), 1);
  const minWeight = Math.min(...terms.map((t) => t.weight), 1);
  const placed: PlacedWord[] = [];
  const boxes: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

  const approxCharWidth = (text: string, fontSize: number): number => {
    let units = 0;
    for (const ch of text) {
      units += ch.charCodeAt(0) > 255 ? 1.05 : 0.6;
    }
    return Math.max(fontSize * 1.4, units * fontSize + 10);
  };

  terms.forEach((term, idx) => {
    const ratio = maxWeight === minWeight ? 1 : (term.weight - minWeight) / (maxWeight - minWeight);
    const fontSize = Math.round(13 + ratio * 23);
    const rotate = idx % 9 === 5 && term.text.length <= 10 ? -6 : 0;
    const w = approxCharWidth(term.text, fontSize);
    const h = fontSize * 1.25 + 6;

    const cx = width / 2;
    const cy = height / 2;
    let foundX = cx;
    let foundY = cy;
    let placedOk = false;

    for (let step = 0; step < 420; step += 1) {
      const angle = step * 0.34;
      const radiusX = step * 1.15;
      const radiusY = step * 0.55;
      const candidateX = cx + Math.cos(angle + idx * 0.45) * radiusX;
      const candidateY = cy + Math.sin(angle + idx * 0.45) * radiusY;

      const x1 = candidateX - w / 2;
      const y1 = candidateY - h / 2;
      const x2 = candidateX + w / 2;
      const y2 = candidateY + h / 2;

      if (x1 < 12 || x2 > width - 12 || y1 < 14 || y2 > height - 12) continue;

      const collides = boxes.some(
        (b) => !(x2 < b.x1 || x1 > b.x2 || y2 < b.y1 || y1 > b.y2)
      );
      if (!collides) {
        foundX = candidateX;
        foundY = candidateY;
        boxes.push({ x1, y1, x2, y2 });
        placedOk = true;
        break;
      }
    }

    if (placedOk) {
      placed.push({
        ...term,
        x: Math.round(foundX),
        y: Math.round(foundY),
        fontSize,
        rotate,
      });
    }
  });

  return placed;
}

function escapeSvgText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const ArchitectureCloudView: React.FC = () => {
  const {
    projects,
    tasks,
    members,
    stages,
    language,
    t,
    setSelectedTask,
    setLogicTreeTaskId,
    setViewMode,
    updateProject,
    searchQuery,
  } = useLabFlow();

  const isZh = language === 'zh';
  const [editingProject, setEditingProject] = useState<ProjectItem | null | undefined>(undefined);
  const [selectedKeyword, setSelectedKeyword] = useState<WordCloudTerm | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [collapsedProjects, setCollapsedProjects] = useState<Record<string, boolean>>({});
  const [treeOrientation, setTreeOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

  const categorySummaries = useMemo(
    () => aggregateProjectsByCategory(projects, tasks, members, language),
    [projects, tasks, members, language]
  );

  const existingCategories = useMemo(
    () =>
      Array.from(
        new Set(
          projects
            .map((p) => (p.category || '').trim())
            .filter(Boolean)
        )
      ),
    [projects]
  );

  const cloudTerms = useMemo(
    () => buildWordCloudTerms(projects, tasks, stages, language, 44),
    [projects, tasks, stages, language]
  );

  const placedWords = useMemo(() => layoutWordCloudSvg(cloudTerms), [cloudTerms]);

  const totalUniqueMembers = useMemo(() => {
    const idSet = new Set<string>();
    for (const cat of categorySummaries) {
      for (const m of cat.members) idSet.add(m.id);
    }
    return idSet.size;
  }, [categorySummaries]);

  const matchedProjectIdSet = useMemo(
    () => new Set(selectedKeyword?.matchedProjectIds || []),
    [selectedKeyword]
  );
  const matchedTaskIdSet = useMemo(
    () => new Set(selectedKeyword?.matchedTaskIds || []),
    [selectedKeyword]
  );

  const getStageLabel = (stageId: string): string => {
    const found = stages.find((s) => s.id === stageId);
    if (!found) return stageId;
    return isZh ? found.labelZh : found.labelEn;
  };

  const handleDownloadWordCloudSvg = () => {
    const textEls = placedWords
      .map(
        (w) =>
          `<text x="${w.x}" y="${w.y}" text-anchor="middle" dominant-baseline="middle" font-size="${w.fontSize}" font-weight="700" fill="${w.color}" transform="rotate(${w.rotate} ${w.x} ${w.y})">${escapeSvgText(
            w.text
          )}</text>`
      )
      .join('\n  ');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="880" height="290" viewBox="0 0 880 290">\n  <rect width="100%" height="100%" fill="#0f172a" rx="16"/>\n  ${textEls}\n</svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LabFlow_WordCloud_${new Date().toISOString().split('T')[0]}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadArchitectureMarkdown = () => {
    let md = isZh
      ? `# 🧬 LabFlow 课题组科研项目架构图\n\n- 研究大类数: ${categorySummaries.length}\n- 课题项目总数: ${projects.length}\n- 参与科研成员: ${totalUniqueMembers} 人\n\n`
      : `# 🧬 LabFlow Research Architecture Tree\n\n- Categories: ${categorySummaries.length}\n- Projects: ${projects.length}\n- Active Contributors: ${totalUniqueMembers}\n\n`;

    for (const cat of categorySummaries) {
      md += `## 📁 ${cat.category} (${cat.projects.length} ${
        isZh ? '个项目' : 'projects'
      } · ${cat.memberCount} ${isZh ? '人负责' : 'members'})\n`;
      for (const proj of cat.projects) {
        const pMembers = getProjectMembers(proj, tasks, members)
          .map((m) => (isZh ? m.nameZh : m.nameEn))
          .join(', ');
        md += `- **[${proj.tag}] ${proj.title}** (${proj.targetVenue}) — ${
          isZh ? '负责团队' : 'Team'
        }: ${pMembers}\n`;
        const pTasks = tasks.filter((item) => item.projectId === proj.id);
        for (const task of pTasks) {
          md += `  - [${getStageLabel(task.stage)}] ${task.title} (${
            isZh ? task.leadAuthor.nameZh : task.leadAuthor.nameEn
          } · ${task.progress || 0}%)\n`;
        }
      }
      md += '\n';
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LabFlow_Architecture_${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openTaskFromTree = (task: TaskItem) => {
    setSelectedTask(task);
  };

  const queryLower = searchQuery.trim().toLowerCase();

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-5 max-w-[1720px] w-full mx-auto space-y-6">
      {/* Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-600 dark:text-violet-400">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {t.projectCategoriesTitle}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t.projectCategoriesDesc}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {categorySummaries.length} {isZh ? '个研究大类' : 'Categories'}
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {projects.length} {isZh ? '个科研项目' : 'Projects'}
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="font-semibold text-cyan-600 dark:text-cyan-400">
              {totalUniqueMembers} {isZh ? '人参与负责' : 'Contributors'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setEditingProject(null)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            <span>{isZh ? '新建 / 归类项目' : 'New Project'}</span>
          </button>
        </div>
      </div>

      {/* Section 1: Project Category Summary Cards */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-violet-500" />
            <span>
              {isZh
                ? '研究大类归档与负责人数总览（同大类多项目自动聚合去重）'
                : 'Categories & Team Headcount Breakdown'}
            </span>
          </h2>
          {selectedKeyword && (
            <button
              type="button"
              onClick={() => setSelectedKeyword(null)}
              className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>
                {isZh
                  ? `清除词云高亮「${selectedKeyword.text}」`
                  : `Clear filter "${selectedKeyword.text}"`}
              </span>
            </button>
          )}
        </div>

        {categorySummaries.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-xs text-slate-500 space-y-2">
            <p>{isZh ? '当前尚未创建科研项目，点击右上角即可新建并归类课题。' : 'No projects yet.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {categorySummaries.map((cat) => (
              <div
                key={cat.category}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col justify-between space-y-3"
              >
                <div className="space-y-3">
                  {/* Category Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {cat.category}
                      </h3>
                    </div>
                    <span className="shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                      {cat.projects.length} {isZh ? '个项目' : 'proj'}
                    </span>
                  </div>

                  {/* Team Headcount & Avatar Stack */}
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {cat.members.slice(0, 6).map((m) => (
                          <MemberAvatar
                            key={m.id}
                            member={m}
                            size="sm"
                            className="ring-2 ring-white dark:ring-slate-900"
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1 whitespace-nowrap">
                        <Users className="w-3.5 h-3.5" />
                        {cat.memberCount} {t.responsibleCount}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono shrink-0">
                      {cat.taskCount} {isZh ? '任务' : 'tasks'} · {cat.avgProgress}%
                    </div>
                  </div>

                  {/* Projects inside category */}
                  <div className="space-y-2">
                    {cat.projects.map((proj) => {
                      const pMembers: LabMember[] = getProjectMembers(proj, tasks, members);
                      const pTasks = tasks.filter((item) => item.projectId === proj.id);
                      const projStageIdx = stages.findIndex((s) => s.id === proj.status);
                      const projStageCfg = stages[projStageIdx];
                      const isHighlighted =
                        (selectedKeyword && matchedProjectIdSet.has(proj.id)) ||
                        (queryLower &&
                          (proj.title.toLowerCase().includes(queryLower) ||
                            proj.tag.toLowerCase().includes(queryLower)));

                      return (
                        <div
                          key={proj.id}
                          className={`p-2.5 rounded-xl border text-xs transition-all ${
                            isHighlighted
                              ? 'bg-cyan-50/70 dark:bg-cyan-950/30 border-cyan-500 ring-1 ring-cyan-500/40'
                              : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">
                                  {proj.tag}
                                </span>
                                {projStageCfg && (
                                  <span
                                    className={`text-[10px] font-semibold px-1.5 py-0.2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${projStageCfg.color}`}
                                  >
                                    {isZh ? projStageCfg.labelZh : projStageCfg.labelEn}
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-400">
                                  {proj.targetVenue}
                                </span>
                              </div>
                              <div className="font-semibold text-slate-800 dark:text-slate-100 mt-1 line-clamp-1">
                                {proj.title}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <div className="inline-flex items-center rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5">
                                <button
                                  type="button"
                                  disabled={projStageIdx <= 0}
                                  onClick={() =>
                                    projStageIdx > 0 &&
                                    updateProject(proj.id, { status: stages[projStageIdx - 1].id })
                                  }
                                  className={`p-0.5 rounded transition-colors ${
                                    projStageIdx > 0
                                      ? 'text-slate-500 hover:text-amber-600 dark:hover:text-amber-400'
                                      : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                                  }`}
                                  title={isZh ? '退回上一阶段' : 'Previous Stage'}
                                >
                                  <ArrowLeft className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={projStageIdx < 0 || projStageIdx >= stages.length - 1}
                                  onClick={() =>
                                    projStageIdx >= 0 &&
                                    projStageIdx < stages.length - 1 &&
                                    updateProject(proj.id, { status: stages[projStageIdx + 1].id })
                                  }
                                  className={`p-0.5 rounded transition-colors ${
                                    projStageIdx >= 0 && projStageIdx < stages.length - 1
                                      ? 'text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400'
                                      : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                                  }`}
                                  title={isZh ? '推进至下一阶段' : 'Advance Stage'}
                                >
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => setEditingProject(proj)}
                                className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors shrink-0"
                                title={isZh ? '编辑项目归类与成员' : 'Edit Project'}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60 text-[10px] text-slate-500">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div className="flex -space-x-1">
                                {pMembers.slice(0, 4).map((m) => (
                                  <MemberAvatar key={m.id} member={m} size="xs" />
                                ))}
                              </div>
                              <span className="truncate">
                                {pMembers.length} {t.responsibleCount}
                              </span>
                            </div>
                            <span>
                              {pTasks.length} {isZh ? '个任务' : 'tasks'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="pt-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                    <span>
                      {isZh ? '推进均度' : 'Avg Progress'} · {cat.completedTaskCount}/{cat.taskCount}{' '}
                      {isZh ? '完成' : 'done'}
                    </span>
                    {cat.blockedTaskCount > 0 && (
                      <span className="text-rose-500 font-semibold">
                        🔥 {cat.blockedTaskCount} {isZh ? '卡点' : 'blocked'}
                      </span>
                    )}
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${cat.avgProgress}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 2: Auto Word Cloud */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-500" />
              <span>{t.wordCloudTitle}</span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isZh
                ? '根据大类、项目、任务标签、目标会议与卡点频率自动生成。点击任意关键词可高亮关联课题与任务。'
                : 'Automatically weighted from categories, tags, venues, blockers, and task concepts. Click any term to highlight matches.'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="hidden md:flex items-center gap-2 text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <i className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                {isZh ? '大类' : 'Category'}
              </span>
              <span className="flex items-center gap-1">
                <i className="w-2 h-2 rounded-full bg-cyan-500 inline-block" />
                {isZh ? '项目' : 'Project'}
              </span>
              <span className="flex items-center gap-1">
                <i className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                {isZh ? '期刊/会议' : 'Venue'}
              </span>
              <span className="flex items-center gap-1">
                <i className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                {isZh ? '卡点' : 'Blocker'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleDownloadWordCloudSvg}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.exportSvg}</span>
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/80 overflow-hidden">
          {placedWords.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              {isZh ? '暂无足够课题与任务文本来生成词云' : 'Add projects or tasks to populate word cloud'}
            </div>
          ) : (
            <svg viewBox="0 0 880 290" className="w-full h-auto max-h-[320px] select-none">
              {placedWords.map((word) => {
                const isActive =
                  selectedKeyword?.text.toLowerCase() === word.text.toLowerCase();
                const dimmed = Boolean(selectedKeyword) && !isActive;
                return (
                  <g
                    key={word.text}
                    onClick={() => setSelectedKeyword(isActive ? null : word)}
                    className="cursor-pointer transition-opacity"
                    style={{ opacity: dimmed ? 0.35 : 1 }}
                  >
                    <text
                      x={word.x}
                      y={word.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={word.fontSize}
                      fontWeight={700}
                      fill={word.color}
                      transform={`rotate(${word.rotate} ${word.x} ${word.y})`}
                    >
                      <title>{`${word.text} (weight: ${word.weight}, count: ${word.count})`}</title>
                      {word.text}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      </section>

      {/* Section 3: Interactive Project Architecture Tree Diagram */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-violet-500" />
              <span>{t.architectureTreeTitle}</span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isZh
                ? '层级结构：实验室总览 → 研究大类 → 课题项目（含成员头像） → 关键研发任务（点击打开逻辑树或详情）。'
                : 'Hierarchical view: Lab Root → Categories → Projects & Teams → Tasks (click to open detail or logic tree).'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px]">
              <button
                type="button"
                onClick={() => setTreeOrientation('horizontal')}
                className={`px-2.5 py-1 rounded-md font-medium ${
                  treeOrientation === 'horizontal'
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {isZh ? '横向展开树' : 'Horizontal'}
              </button>
              <button
                type="button"
                onClick={() => setTreeOrientation('vertical')}
                className={`px-2.5 py-1 rounded-md font-medium ${
                  treeOrientation === 'vertical'
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {isZh ? '纵向分级目录' : 'Directory'}
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadArchitectureMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{t.exportMarkdown}</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          {treeOrientation === 'horizontal' ? (
            <div className="min-w-[820px] flex items-stretch gap-5 p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              {/* Level 0: Lab Root */}
              <div className="flex items-center shrink-0">
                <div className="w-48 p-3.5 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                    LAB ROOT
                  </span>
                  <div className="text-sm font-extrabold">
                    {isZh ? '实验室科研架构' : 'Lab Architecture'}
                  </div>
                  <div className="text-[11px] opacity-90 pt-1 border-t border-white/20 flex items-center justify-between">
                    <span>
                      {categorySummaries.length} {isZh ? '大类' : 'cat'} · {projects.length}{' '}
                      {isZh ? '项目' : 'proj'}
                    </span>
                    <span>{totalUniqueMembers} 👤</span>
                  </div>
                </div>
              </div>

              {/* Branches */}
              <div className="flex-1 space-y-4 border-l-2 border-indigo-500/30 pl-5">
                {categorySummaries.map((cat) => {
                  const catCollapsed = Boolean(collapsedCategories[cat.category]);
                  return (
                    <div key={cat.category} className="relative flex items-start gap-4">
                      {/* Horizontal connector from parent line */}
                      <div
                        className="absolute -left-5 top-5 w-5 h-0.5"
                        style={{ backgroundColor: cat.color }}
                      />

                      {/* Level 1: Category Node */}
                      <div className="w-56 shrink-0 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                              {cat.category}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setCollapsedCategories((prev) => ({
                                ...prev,
                                [cat.category]: !catCollapsed,
                              }))
                            }
                            className="p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                          >
                            {catCollapsed ? (
                              <ChevronRight className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                            {cat.memberCount} {t.responsibleCount}
                          </span>
                          <span>
                            {cat.projects.length} {isZh ? '个项目' : 'proj'} · {cat.avgProgress}%
                          </span>
                        </div>

                        <div className="flex -space-x-1 overflow-hidden">
                          {cat.members.slice(0, 6).map((m) => (
                            <MemberAvatar key={m.id} member={m} size="xs" />
                          ))}
                        </div>
                      </div>

                      {/* Level 2: Projects */}
                      {!catCollapsed && (
                        <div className="flex-1 space-y-2.5 border-l-2 border-slate-300 dark:border-slate-700 pl-4">
                          {cat.projects.map((proj) => {
                            const projTasks = tasks.filter((item) => item.projectId === proj.id);
                            const pMembers = getProjectMembers(proj, tasks, members);
                            const projCollapsed = Boolean(collapsedProjects[proj.id]);
                            const isProjHit = selectedKeyword && matchedProjectIdSet.has(proj.id);

                            return (
                              <div key={proj.id} className="relative flex items-start gap-4">
                                <div className="absolute -left-4 top-4 w-4 h-0.5 bg-slate-300 dark:bg-slate-700" />
                                <div
                                  className={`w-64 shrink-0 p-2.5 rounded-xl border shadow-sm space-y-1.5 ${
                                    isProjHit
                                      ? 'bg-cyan-50/70 dark:bg-cyan-950/30 border-cyan-500'
                                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 truncate">
                                      {proj.tag}
                                    </span>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => setEditingProject(proj)}
                                        className="p-0.5 text-slate-400 hover:text-indigo-500"
                                        title={isZh ? '编辑项目' : 'Edit project'}
                                      >
                                        <Pencil className="w-3 h-3" />
                                      </button>
                                      {projTasks.length > 0 && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setCollapsedProjects((prev) => ({
                                              ...prev,
                                              [proj.id]: !projCollapsed,
                                            }))
                                          }
                                          className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                        >
                                          {projCollapsed ? (
                                            <ChevronRight className="w-3.5 h-3.5" />
                                          ) : (
                                            <ChevronDown className="w-3.5 h-3.5" />
                                          )}
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-2">
                                    {proj.title}
                                  </div>

                                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                                    <div className="flex items-center gap-1">
                                      <div className="flex -space-x-1">
                                        {pMembers.slice(0, 4).map((m) => (
                                          <MemberAvatar key={m.id} member={m} size="xs" />
                                        ))}
                                      </div>
                                      <span>
                                        {pMembers.length} {isZh ? '人' : ''}
                                      </span>
                                    </div>
                                    <span className="truncate max-w-[105px]">{proj.targetVenue}</span>
                                  </div>
                                </div>

                                {/* Level 3: Tasks under Project */}
                                {!projCollapsed && projTasks.length > 0 && (
                                  <div className="flex-1 space-y-1.5 border-l-2 border-slate-200 dark:border-slate-800 pl-3.5">
                                    {projTasks.map((task) => {
                                      const isTaskHit =
                                        selectedKeyword && matchedTaskIdSet.has(task.id);
                                      return (
                                        <div
                                          key={task.id}
                                          className={`relative flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-[11px] ${
                                            task.isBlocked
                                              ? 'bg-red-50/70 dark:bg-red-950/30 border-red-400/50'
                                              : isTaskHit
                                              ? 'bg-cyan-50/70 dark:bg-cyan-950/30 border-cyan-500'
                                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                                          }`}
                                        >
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <MemberAvatar member={task.leadAuthor} size="xs" />
                                            <button
                                              type="button"
                                              onClick={() => openTaskFromTree(task)}
                                              className="font-medium text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-cyan-300 truncate text-left"
                                            >
                                              {task.title}
                                            </button>
                                          </div>
                                          <div className="flex items-center gap-1.5 shrink-0">
                                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                              {getStageLabel(task.stage)}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => setLogicTreeTaskId(task.id)}
                                              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-500/15 hover:bg-violet-500/25 text-violet-700 dark:text-violet-300 text-[10px] font-semibold"
                                              title={isZh ? '编辑任务树状逻辑图' : 'Edit Task Logic Tree'}
                                            >
                                              <GitBranch className="w-3 h-3" />
                                              <span>{isZh ? '逻辑树' : 'Tree'}</span>
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Vertical Directory Tree Mode */
            <div className="space-y-3 p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              {categorySummaries.map((cat) => (
                <div
                  key={cat.category}
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span>{cat.category}</span>
                      <span className="text-[11px] font-normal text-cyan-600 dark:text-cyan-400">
                        ({cat.projects.length} {isZh ? '项目' : 'projects'} · {cat.memberCount}{' '}
                        {t.responsibleCount})
                      </span>
                    </div>
                    <div className="flex -space-x-1">
                      {cat.members.slice(0, 6).map((m) => (
                        <MemberAvatar key={m.id} member={m} size="xs" />
                      ))}
                    </div>
                  </div>

                  <div className="pl-4 border-l-2 border-slate-200 dark:border-slate-800 space-y-2">
                    {cat.projects.map((proj) => {
                      const projTasks = tasks.filter((item) => item.projectId === proj.id);
                      const pMembers = getProjectMembers(proj, tasks, members);
                      return (
                        <div key={proj.id} className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">
                                {proj.tag}
                              </span>
                              <span className="font-semibold truncate">{proj.title}</span>
                              <span className="text-[10px] text-slate-400 shrink-0">
                                ({pMembers.length} {isZh ? '人负责' : 'members'})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setEditingProject(proj)}
                              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
                            >
                              {isZh ? '编辑归类' : 'Edit'}
                            </button>
                          </div>

                          {projTasks.length > 0 && (
                            <div className="pl-4 border-l border-slate-200 dark:border-slate-800 space-y-1">
                              {projTasks.map((task) => (
                                <div
                                  key={task.id}
                                  className="flex items-center justify-between gap-2 text-[11px] py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-950/60"
                                >
                                  <button
                                    type="button"
                                    onClick={() => openTaskFromTree(task)}
                                    className="flex items-center gap-1.5 text-left truncate hover:text-indigo-500"
                                  >
                                    <MemberAvatar member={task.leadAuthor} size="xs" />
                                    <span className="truncate">{task.title}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setLogicTreeTaskId(task.id)}
                                    className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold shrink-0 flex items-center gap-1"
                                  >
                                    <GitBranch className="w-3 h-3" />
                                    <span>{isZh ? '逻辑树图' : 'Logic Tree'}</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Shortcut hint back to Kanban */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setViewMode('kanban')}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isZh ? '返回学术看板统筹任务流' : 'Back to Kanban Pipeline'}</span>
        </button>
      </div>

      {editingProject !== undefined && (
        <ProjectEditorModal
          initialProject={editingProject}
          existingCategories={existingCategories}
          onClose={() => setEditingProject(undefined)}
        />
      )}
    </div>
  );
};
