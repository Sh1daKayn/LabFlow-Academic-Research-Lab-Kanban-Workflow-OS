import {
  ChecklistAcceptanceTemplate,
  DirectRequest,
  LabMember,
  Language,
  ProjectItem,
  TaskItem,
  WeeklyTodoItem,
} from '@/types';
import { localizeChecklistTemplates } from '@/utils/templates';

export interface LanguageResolutionInput {
  savedLang?: string | null;
  search?: string;
  browserLanguages?: readonly (string | undefined)[];
}

/**
 * Resolves initial UI language with priority:
 * 1. Explicit `?lang=en|zh` query override
 * 2. User-saved preference in localStorage
 * 3. Browser locale (`zh*` -> 'zh', any other non-empty locale -> 'en')
 * 4. Safe fallback ('zh' only when no locale signal exists)
 */
export function resolvePreferredLanguage({
  savedLang,
  search,
  browserLanguages,
}: LanguageResolutionInput): Language {
  if (search) {
    try {
      const param = new URLSearchParams(search).get('lang')?.toLowerCase();
      if (param === 'en' || param === 'zh') {
        return param;
      }
    } catch {
      // Ignore malformed query string
    }
  }

  if (savedLang === 'en' || savedLang === 'zh') {
    return savedLang;
  }

  if (browserLanguages && browserLanguages.length > 0) {
    for (const rawLocale of browserLanguages) {
      const normalized = (rawLocale || '').trim().toLowerCase();
      if (!normalized) continue;
      return normalized.startsWith('zh') ? 'zh' : 'en';
    }
  }

  return 'zh';
}

const ROLE_TITLE_DEFAULTS: Record<LabMember['role'], { titleZh: string; titleEn: string }> = {
  PI: { titleZh: '实验室负责人 / 导师', titleEn: 'Principal Investigator' },
  POSTDOC: { titleZh: '博士后研究员', titleEn: 'Postdoctoral Fellow' },
  SENIOR_PHD: { titleZh: '高年级博士生', titleEn: 'Senior PhD Candidate' },
  PHD_CANDIDATE: { titleZh: '博士研究生', titleEn: 'PhD Candidate' },
  RA: { titleZh: '科研助理 / 硕士生', titleEn: 'Research Assistant / MS' },
  VISITING_SCHOLAR: { titleZh: '访问学者', titleEn: 'Visiting Scholar' },
};

/**
 * Returns default bilingual title strings for an academic member role.
 */
export function getRoleDefaultTitles(role: LabMember['role']): {
  titleZh: string;
  titleEn: string;
} {
  return ROLE_TITLE_DEFAULTS[role] || ROLE_TITLE_DEFAULTS.PHD_CANDIDATE;
}

/**
 * Exact-match map translating untouched Chinese demo seed copy into US academic English
 * when switching an existing workspace (or fresh seed) to English mode.
 */
const DEMO_ZH_TO_EN: Record<string, string> = {
  // Categories & Tags
  '数字经济与计量实证': 'Econometrics & Digital Economy',
  '分布式优化与智能算法': 'Distributed Optimization & AI',
  '能源环境与碳市场': 'Energy & Carbon Markets',
  '企业横向与工程落地': 'Industry & Systems Engineering',
  '纵向 · NSFC': 'Vertical · NSF',
  '横向 · 智能装备': 'Industry · Apex',
  '横向交付': 'Industry Delivery',
  'UAT验收': 'UAT Sign-off',

  // Projects (proj-3, proj-7)
  '再生农业采纳行为与政策效果评估（国家自科/世界银行合作纵向课题）':
    'Regenerative Agriculture Adoption & Policy Evaluation (NSF / World Bank Grant)',
  '国家自然科学基金面上项目 / World Bank': 'National Science Foundation / World Bank',
  '阶段中期数据报告与模型评估归档': 'Midterm Empirical Data Report & Model Benchmark Archive',
  '工业设备智能预测性维护与供应链排程系统（企业横向合作）':
    'Predictive Maintenance & Supply-Chain Scheduling System (Industry Partner)',
  '面向合作制造企业的设备遥测异常检测与备件库存联合优化系统，需按期交付模型 API 与验收测试报告。':
    'Joint telemetry anomaly detection and spare-parts scheduling platform for manufacturing partner; scheduled API delivery and UAT sign-off.',
  '华东智能装备集团（甲方）': 'Apex Smart Manufacturing Corp. (Client)',
  '华东智能装备集团': 'Apex Smart Manufacturing',
  '一期原型联调与企业现场 UAT 验收节点':
    'Phase-1 Prototype Integration & Client UAT Milestone',

  // Tasks (task-102, task-203, task-204)
  '样本数据伦理审查与脱敏入库节点': 'IRB Data Ethics Review & De-identification Milestone',
  '课题年度中期检查指标提取': 'Annual Grant Midterm Metric Extraction',
  '交付企业设备时序预测 API 并完成甲方现场压测验收':
    'Deliver Time-Series Forecasting API & Complete Client UAT Load Test',
  '按企业合同时间节点完成推理服务 Docker 打包、延迟压测 (<50ms) 及现场联调测试报告签署。':
    'Complete inference Docker packaging, p95 latency benchmark (<50ms), and client UAT sign-off by contract milestone.',
  '一期原型联调与 UAT 验收节点（严格时间要求）':
    'Phase-1 Prototype Integration & UAT Sign-off (Strict Deadline)',
  '完成设备传感器异常检测接口联调': 'Complete sensor anomaly detection API integration',
  '输出企业验收测试报告并与甲方技术负责人确认':
    'Deliver UAT test report and confirm with client engineering lead',

  // Weekly Todos (demo-1..3)
  '对比至少 6 篇 Neural ODE 与 SCM 基线并附可复现指标表':
    'Compare >= 6 Neural ODE and SCM baselines with reproducible metrics table',
  '提交 Zotero 分组与文献筛选汇总表格':
    'Submit Zotero collection and literature screening summary sheet',
  '核对 AEPP (R&R) 审稿意见 Response Letter 表格与稳健性回归系数':
    'Audit AEPP (R&R) Response Letter tables & robustness regression coefficients',
  '完成 Point-by-Point 回复草稿并通过组会交叉校验':
    'Complete point-by-point response draft and pass team cross-check',

  // Direct Requests (demo-1..2)
  '确认华东智能装备企业项目 UAT 验收测试接口清单':
    'Confirm Apex Industry Project UAT API Interface Specification',
  '老师您好，本周需要与甲方确认设备端 API 字段定义，想在周五联调前请您把关一下接口文档。':
    'Hi Professor, we need to finalize edge-device API schemas with the industry client this week. Could you review the spec before Friday integration?',
  'Lemma 4.2 非利普希茨条件下步长收缩引理请教':
    'Question on Lemma 4.2 Step-Size Contraction under Non-Lipschitz Conditions',
  '关于 Inexact ADMM 引理 4.2 的对偶变量发散问题，希望能约 15 分钟单独探讨一下李雅普诺夫函数构造思路。':
    'Regarding dual variable divergence in Inexact ADMM Lemma 4.2—could we schedule 15 minutes to discuss constructing the Lyapunov function?',
  '收到，下午 4 点我们可以看下近端步长缩放的那两行推导。':
    'Got it—let us walk through those two proximal step-size scaling lines at 4:00 PM.',
};

/**
 * Translates an untouched built-in Chinese seed string to English in `'en'` mode.
 * Any user-authored or edited string not present in `DEMO_ZH_TO_EN` is returned verbatim.
 */
export function localizeDemoString<T extends string | undefined>(
  value: T,
  language: Language
): T {
  if (language !== 'en' || !value) return value;
  return (DEMO_ZH_TO_EN[value] ?? value) as T;
}

/**
 * Produces localized UI views of projects, tasks, weekly todos, direct requests, and templates
 * without mutating persisted server records.
 */
export function localizeWorkspaceCollections(
  collections: {
    projects: ProjectItem[];
    tasks: TaskItem[];
    weeklyTodos: WeeklyTodoItem[];
    directRequests: DirectRequest[];
    checklistTemplates: ChecklistAcceptanceTemplate[];
  },
  language: Language
): typeof collections {
  const localizedTemplates = localizeChecklistTemplates(
    collections.checklistTemplates,
    language
  );

  if (language !== 'en') {
    return {
      ...collections,
      checklistTemplates: localizedTemplates,
    };
  }

  return {
    projects: collections.projects.map((p) => ({
      ...p,
      title: localizeDemoString(p.title, language),
      abstract: localizeDemoString(p.abstract, language),
      partnerOrg: localizeDemoString(p.partnerOrg, language),
      milestoneNode: localizeDemoString(p.milestoneNode, language),
      category: localizeDemoString(p.category, language),
      targetVenue: localizeDemoString(p.targetVenue, language),
      tag: localizeDemoString(p.tag, language),
    })),
    tasks: collections.tasks.map((task) => ({
      ...task,
      title: localizeDemoString(task.title, language),
      description: localizeDemoString(task.description, language),
      partnerOrg: localizeDemoString(task.partnerOrg, language),
      milestoneNode: localizeDemoString(task.milestoneNode, language),
      projectTag: localizeDemoString(task.projectTag, language),
      targetVenue: localizeDemoString(task.targetVenue, language),
      tags: task.tags?.map((tg) => localizeDemoString(tg, language)),
      checklist: task.checklist?.map((chk) => ({
        ...chk,
        text: localizeDemoString(chk.text, language),
      })),
    })),
    weeklyTodos: collections.weeklyTodos.map((todo) => ({
      ...todo,
      title: localizeDemoString(todo.title, language),
      acceptanceCriteria: localizeDemoString(todo.acceptanceCriteria, language),
    })),
    directRequests: collections.directRequests.map((req) => ({
      ...req,
      title: localizeDemoString(req.title, language),
      content: localizeDemoString(req.content, language),
      replies: req.replies.map((rep) => ({
        ...rep,
        content: localizeDemoString(rep.content, language),
      })),
    })),
    checklistTemplates: localizedTemplates,
  };
}
