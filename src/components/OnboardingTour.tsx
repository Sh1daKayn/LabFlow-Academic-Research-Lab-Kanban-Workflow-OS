'use client';

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  Eye,
  EyeOff,
  Lightbulb,
  Sparkles,
  X,
} from 'lucide-react';
import { useLabFlow } from '@/context/LabFlowContext';
import { TOUR_STORAGE_KEY } from '@/context/UIContext';
import { ViewMode } from '@/types';
import { computeTourPopoverPosition, TourPlacement, TourRect } from '@/utils/tourPosition';

interface TourStepConfig {
  id: string;
  chapterZh: string;
  chapterEn: string;
  selectors: string[];
  placement: TourPlacement;
  targetView?: ViewMode;
  titleZh: string;
  titleEn: string;
  summaryZh: string;
  summaryEn: string;
  pointsZh: string[];
  pointsEn: string[];
  tipZh?: string;
  tipEn?: string;
}

const TOUR_STEPS: TourStepConfig[] = [
  {
    id: 'tabs',
    chapterZh: '阶段 1/4 · 界面布局',
    chapterEn: 'Part 1/4 · Layout',
    selectors: ['[data-tour="primary-tabs"]'],
    placement: 'bottom',
    titleZh: '1. 主工作区切换（5 大视图入口）',
    titleEn: '1. Switch Core Workspaces',
    summaryZh: '平时 90% 的日常协作只用点前 3 个常用标签，其余高级视图已收纳进右侧「更多视图」。',
    summaryEn: 'Focus daily work in the first three tabs while keeping timeline & lineage views neatly under More.',
    pointsZh: [
      'Tasks：查看论文/课题所处阶段、拖拽推进度、记录卡点；',
      'Weekly Todos：记录本周行动清单并提交导师或同门验收；',
      '1对1沟通：单独向指定成员发审稿/求助申请；',
      '更多视图：打开 Gantt 时间线、项目架构与学期继承图谱、组会模式，并支持「自定义初始视图」。',
    ],
    pointsEn: [
      'Tasks: drag project cards across research milestones and flag blockers.',
      'Weekly Todos: break goals into weekly items with advisor/peer acceptance.',
      'Requests: direct 1-on-1 approvals and troubleshooting threads.',
      'More: Timeline Gantt, Categories & Semester Lineage, Meeting Mode, plus pinned-tab customization.',
    ],
  },
  {
    id: 'scope',
    chapterZh: '阶段 1/4 · 界面布局',
    chapterEn: 'Part 1/4 · Layout',
    selectors: ['[data-tour="scope-toggle"]'],
    placement: 'bottom',
    titleZh: '2. 视角切换：「仅看我的」vs「组内公开」',
    titleEn: '2. "Mine" Isolation vs. "Lab Public"',
    summaryZh: '为了避免信息过载，系统默认只聚焦你自己的工作，需要全局统筹时一键放开。',
    summaryEn: 'Stay uncluttered by default, or expand to the whole lab whenever coordinating.',
    pointsZh: [
      '仅看我的 (Mine)：只展示你作为主责/PI/协作者的课题任务、个人本周待办与收发的 1对1 沟通；',
      '组内公开 (Lab Public)：立刻解锁全组所有课题、成员周报条、公开交流墙与组内成员筛选。',
    ],
    pointsEn: [
      'Mine: shows only tasks, weekly todos, and 1-on-1 requests tied to you.',
      'Lab Public: unlocks every member card, public request feed, and lab-wide filters.',
    ],
    tipZh: '建议学生平时保持「仅看我的」，导师或周会前切到「组内公开」。',
    tipEn: 'Students usually keep "Mine" on daily; PIs toggle "Lab Public" before group meetings.',
  },
  {
    id: 'account',
    chapterZh: '阶段 1/4 · 界面布局',
    chapterEn: 'Part 1/4 · Layout',
    selectors: ['[data-tour="account-capsule"]'],
    placement: 'bottom',
    titleZh: '3. 个人菜单：桌面提醒、界面模式与 PIN',
    titleEn: '3. Account Capsule: Alerts, Mode & PIN',
    summaryZh: '所有个人偏好（主题、语言、提醒与安全解锁）全部收纳在这个下拉胶囊中。',
    summaryEn: 'Personal notifications, Simple/Full view, theme, language, and admin lock live here.',
    pointsZh: [
      '桌面弹窗提醒：授权浏览器通知后，每 12 秒自动检测发给你的新 1对1 请求或指派待办并系统弹窗；',
      '简洁视图 / 完整统筹：切换轻量日常卡片，或展开全量外部链接与 AI 工具条；',
      '导师锁徽章（PI 专属）：点击旁边的锁图标输入管理员密码，即可解锁增删成员、删除与系统配置权限。',
    ],
    pointsEn: [
      'Desktop Alerts: polls every 12s for new 1-on-1 requests or assigned weekly todos.',
      'Simple vs. Full Layout: switch between streamlined cards and coordinator power tools.',
      'PI Lock Icon: advisors unlock member/admin management with the admin passphrase.',
    ],
  },
  {
    id: 'focus-banner',
    chapterZh: '阶段 2/4 · 看板实操',
    chapterEn: 'Part 2/4 · Daily Kanban',
    selectors: ['[data-tour="focus-banner"]', '[data-tour="board-controls"]'],
    placement: 'bottom',
    targetView: 'kanban',
    titleZh: '4. 今日聚焦条：先看今天最急的三件事',
    titleEn: '4. Daily Focus Bar: 3 Immediate Priorities',
    summaryZh: '每天打开网页先扫一眼这里，不用去各处翻找就能知道自己手头还有什么要处理。',
    summaryEn: 'Check this strip first each morning for pending weekly items, inbox requests, and blockers.',
    pointsZh: [
      '本周待办数 / 待回复请求 / 个人卡点：点击任意一个胶囊直接跳转到对应页面或筛选视图；',
      '右侧模式开关：随时一键在「简洁视图」与「完整统筹」间来回切换；',
      '分步引导按钮：任何时候想再看一遍教程，点击这里即可重新打开。',
    ],
    pointsEn: [
      'Click any pill to jump straight to remaining Weekly To-Dos, Requests, or Blocked items.',
      'Toggle Simple View vs. Full Workspace directly on the right.',
      'Click Guided Tour anytime here to replay this walkthrough.',
    ],
  },
  {
    id: 'search-filter',
    chapterZh: '阶段 2/4 · 看板实操',
    chapterEn: 'Part 2/4 · Daily Kanban',
    selectors: ['[data-tour="header-subbar"]', '[data-tour="filter-toggle"]'],
    placement: 'bottom',
    targetView: 'kanban',
    titleZh: '5. 筛选与「只看阻塞卡点」工具栏',
    titleEn: '5. Search, Blocker Filter & Quick Tools',
    summaryZh: '找某个特定课题、查导师/某位同学手里的卡点，就从这里展开筛选栏。',
    summaryEn: 'Expand this drawer when searching papers, filtering members, or isolating blockers.',
    pointsZh: [
      '点击「筛选 / Filter」按钮会展开搜索框，支持按标题、项目标签、投稿期刊快速过滤；',
      '「只看卡点 🔥」：带红色数字角标，点一下立即把全组受阻任务拎出来解决；',
      '完整视图下，工具栏右侧还会平铺显示 模板库、DDL 倒排 与 AI 导入 按钮。',
    ],
    pointsEn: [
      'Click Filter to reveal keyword search, member filter (in Lab Public), and blocker isolation.',
      'Only Blockers highlights stalled projects needing immediate advisor or data help.',
      'In Full Layout, direct buttons for Templates, DDL Planner, and AI Importer appear here too.',
    ],
  },
  {
    id: 'board-controls',
    chapterZh: '阶段 2/4 · 看板实操',
    chapterEn: 'Part 2/4 · Daily Kanban',
    selectors: ['[data-tour="board-controls"]'],
    placement: 'bottom',
    targetView: 'kanban',
    titleZh: '6. 阶段过滤、DDL 排序与 3 种看板模式',
    titleEn: '6. Stage Filters, DDL Sort & 3 Board Modes',
    summaryZh: '根据你现在的目的（按流水线看、按论文/纵向/横向归类看、或包含空项目统筹）随时切换视图形态。',
    summaryEn: 'Slice tasks by milestone stage, urgency deadline, or switch between 3 board layouts.',
    pointsZh: [
      '阶段胶囊 + 下拉框：快速筛选如「Advisor Review / Submitted & R&R」或单独过滤某一个科研项目；',
      '按 DDL 紧迫度：开启后系统自动把距离截止日最近的卡片排到每一列最顶部；',
      '看板列 / 三类归类 / 阶段单元格：其中「阶段单元格」会把 Categories 里还没有建卡的项目也一起列出，方便直接推进！',
    ],
    pointsEn: [
      'Filter by milestone pill, track dropdown (Paper / Vertical / Enterprise), or specific project.',
      'DDL Urgency brings nearest-deadline cards to the top of every column.',
      'Board Switcher: Columns (drag pipeline), By Category, or Stage Cells (includes projects with 0 tasks).',
    ],
    tipZh: '新建了项目却在「看板列」里没看到？切到最右边的「阶段单元格」就能看见并一键加卡。',
    tipEn: 'New project has no task card yet? Switch to "Stage Cells" on the right to see & manage it directly.',
  },
  {
    id: 'sample-card',
    chapterZh: '阶段 2/4 · 看板实操',
    chapterEn: 'Part 2/4 · Daily Kanban',
    selectors: ['[data-tour="tour-sample-card"]', '[data-tour="kanban-columns"]'],
    placement: 'right',
    targetView: 'kanban',
    titleZh: '7. 任务卡片交互：拖拽、展开清单与报卡点',
    titleEn: '7. Task Card Actions: Drag, Checklist & Blocker',
    summaryZh: '这是你每天操作最频繁的核心单元——卡片本身就可以完成绝大部分日常更新。',
    summaryEn: 'You can handle nearly every daily update directly inside a task card without opening modals.',
    pointsZh: [
      '推阶段：按住卡片左上方拖到相邻列，或直接点卡片右下角的 `← / →` 小箭头跨阶段前移/退回；',
      '行内展开编辑：点击卡片标题或右上角 `⌄`，立刻勾选执行清单、改 DDL、填 Overleaf/GitHub/Dataset 链接或推送到本周待办；',
      '紧急报卡点：遇到技术/数据/合作障碍时点右下角 🔥 小火苗，选好卡点类型后整张卡片会标红置顶提醒。',
    ],
    pointsEn: [
      'Move Stage: drag the card across columns, or click the `← / →` step buttons at bottom-right.',
      'Inline Details: click title or `⌄` to check off checklists, edit deadlines, or push items to Weekly To-Dos.',
      'Flag Blocker 🔥: click the flame icon to mark data/method/review blockers so your team spots them immediately.',
    ],
  },
  {
    id: 'new-split',
    chapterZh: '阶段 2/4 · 看板实操',
    chapterEn: 'Part 2/4 · Daily Kanban',
    selectors: ['[data-tour="new-split-cta"]'],
    placement: 'bottom',
    titleZh: '8. 「+ 新建任务 | ▾」与高级规划工具箱',
    titleEn: '8. "+ New Task | ▾" & Planning Toolbox',
    summaryZh: '一个主按钮搞定新建任务，右侧小箭头里藏着批量初始化和倒排日期利器。',
    summaryEn: 'Create a single card on the left, or open `▾` for deadline planning, AI import, and templates.',
    pointsZh: [
      '点「+ 新建任务」：只需填标题、选项目与阶段即可创建，可选是否仅导师和作者隐私可见；',
      '点「▾」打开工具菜单：内含「新建项目」、按最终目标日期自动反推里程碑的「DDL 节点倒排」；',
      'AI 智能导入：可将导师现有的组会纪要、立项文档交由 AI 转成 JSON 一键灌入全组项目；',
      'Checklist 模板库 & 指南：套用预设投稿清单，或再次重放本指引。',
    ],
    pointsEn: [
      'Click "+ New Task" for fast card creation with optional team/advisor visibility privacy.',
      'Click `▾` for New Project, Reverse DDL Planner (work backward from submission dates), and Templates.',
      'AI Smart Importer parses existing lab notes or docs into structured projects & tasks.',
    ],
  },
  {
    id: 'weekly-todos',
    chapterZh: '阶段 3/4 · 周待办与 1对1',
    chapterEn: 'Part 3/4 · Weekly & Requests',
    selectors: ['[data-tour="weekly-todos-bar"]', '[data-tour="weekly-todos-form"]'],
    placement: 'bottom',
    targetView: 'todos',
    titleZh: '9. 本周待办：周度计划与验收闭环',
    titleEn: '9. Weekly Todos: Execution & Acceptance Loop',
    summaryZh: '已为你自动切换到「Weekly Todos」视图预览：把大任务拆成这周能做完的小步。',
    summaryEn: 'Switched to Weekly Todos preview: break big paper milestones into concrete weekly deliverables.',
    pointsZh: [
      '按周切换与导师指派：顶部可左右翻看历史/下周计划；导师切换「组内公开」后可多选学生直接布置本周任务；',
      '关联项目 Checklist + 验收标准：新建 To-Do 时可直接从上方任务 Checklist 导入，并写明「完成标准」；',
      '提交待验收 → 通过 ✓：学生完成打勾后点击提交验收，导师或同门可填写点评「需修改」或「通过验收」。',
    ],
    pointsEn: [
      'Navigate weeks via `< / >`; in Lab Public mode, advisors/leads can assign tasks to multiple members.',
      'Link each To-Do directly to a task checklist item and define clear Acceptance Criteria.',
      'Close the loop: submit completed items for Advisor/Peer Acceptance review with feedback notes.',
    ],
  },
  {
    id: 'requests',
    chapterZh: '阶段 3/4 · 周待办与 1对1',
    chapterEn: 'Part 3/4 · Weekly & Requests',
    selectors: ['[data-tour="requests-bar"]', '[data-tour="quick-request"]'],
    placement: 'bottom',
    targetView: 'requests',
    titleZh: '10. 1对1 申请与沟通（点对点直达 + 隐私保护）',
    titleEn: '10. 1-on-1 Requests & Private Review',
    summaryZh: '需要某位老师看初稿、或者找方法同学讨论模型细节？不用在群里喊，直接在这里点名发起。',
    summaryEn: 'Send targeted requests for manuscript review, IRB/admin help, or methods advice to one person.',
    pointsZh: [
      '全站快捷入口：任意界面点击右上角「+ 新建 → 1对1」或在「更多 → 1对1沟通」发起，就能立刻给指定一人发消息并关联任务/截止日；',
      '隐私与公开自由选：默认可设为「仅双方私密可见」，也可以设为「组内公开」让大家共用经验；',
      '状态追踪闭环：收件人回复后支持多轮行内追问，问题解决后双方都可点击「标为已解决 ✓」归档。',
    ],
    pointsEn: [
      'Open "+ New -> 1-on-1 Request" top-right anytime to message a specific member linked to a project/task.',
      'Choose Private (sender + recipient only) or Public (shared across Lab Public feed).',
      'Track Open -> Replied -> Resolved states so no review ask gets buried.',
    ],
  },
  {
    id: 'lineage',
    chapterZh: '阶段 4/4 · 跨学期与系统设置',
    chapterEn: 'Part 4/4 · Lineage & Setup',
    selectors: ['[data-tour="arch-subview-switch"]'],
    placement: 'bottom',
    targetView: 'architecture',
    titleZh: '11. 项目总览与「学期继承图谱」',
    titleEn: '11. Categories, Tree & Semester Lineage',
    summaryZh: '实验室很多课题会由不同同学跨学期接力，或从一份老数据衍生出多篇新文章——在这里一目了然。',
    summaryEn: 'Visualize multi-semester student baton handoffs, shared datasets, and spinoff papers cleanly.',
    pointsZh: [
      '按聚类分组：查看每个研究大类下的核心 Research Question（研究问题）、共享数据集与历任交接记录；',
      '架构树状图：自顶向下梳理 大类 → 项目 → 子任务 树结构，支持点击高频关键词反查课题；',
      '学期继承图谱：按北美 Spring → Summer → Fall 时间列排布，自动用实线连起接力人与分叉衍生关系（悬停高亮链路！）。',
    ],
    pointsEn: [
      'By Cluster: inspect Research Questions, Shared Datasets, and cross-term contributor history.',
      'Architecture Tree: drill from Research Categories -> Projects -> Tasks + Keyword Cloud.',
      'Semester Lineage: chronological Spring -> Summer -> Fall swimlanes with SVG handoff & spinoff lines.',
    ],
    tipZh: '现在遮罩中间就是真实按钮，你可以直接点选切换看看「学期继承图谱」效果！',
    tipEn: 'The highlighted buttons are live—feel free to click "Semester Lineage" right through the cutout!',
  },
  {
    id: 'settings',
    chapterZh: '阶段 4/4 · 跨学期与系统设置',
    chapterEn: 'Part 4/4 · Lineage & Setup',
    selectors: ['[data-tour="settings-btn"]'],
    placement: 'bottom',
    titleZh: '12. 系统设置、Teams 推送与数据备份',
    titleEn: '12. Lab Settings, Teams Webhooks & Backups',
    summaryZh: '管理员和导师可以在这里管理全组邮箱、导入/导出 JSON 数据包，并开启群聊与邮件自动推送。',
    summaryEn: 'Configure team rosters, Microsoft Teams / Slack Webhooks, scheduled email digests, and JSON backups.',
    pointsZh: [
      '团队成员与邮箱：新增成员、配置 PI/骨干/学生权限，以及用于邮件摘要的真实邮箱；',
      'Teams / Slack Webhook & 内置教程：打开「通知与集成」标签即可查看在 Microsoft Teams 创建 Incoming Webhook 的图文步骤与一键测试；',
      '48 小时临期 / 周会前定时摘要 + 数据备份：随时导出或导入恢复全量 JSON 数据快照，支持自定义转化出口与期刊库。',
    ],
    pointsEn: [
      'Team & Emails: manage member roles and recipient emails for digests.',
      'Notifications & Webhooks: includes a step-by-step Microsoft Teams Incoming Webhook tutorial + test trigger.',
      'Data & Backup: export/restore full JSON workspace snapshots and configure outreach tracks & venue links.',
    ],
  },
];

function findFirstVisibleElement(selectors: string[]): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  for (const selector of selectors) {
    const matches = Array.from(document.querySelectorAll(selector)) as HTMLElement[];
    const visible = matches.find((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    if (visible) return visible;
  }
  return null;
}

export const OnboardingTour: React.FC = () => {
  const {
    language,
    isHydrated,
    isAuthenticatedSession,
    currentUserId,
    isSettingsOpen,
    isFeatureGuideOpen,
    isNewTaskOpen,
    viewMode,
    setViewMode,
    isTourOpen,
    tourStepIndex,
    setTourStepIndex,
    startTour,
    closeTour,
  } = useLabFlow();

  const isZh = language === 'zh';
  const [targetRect, setTargetRect] = useState<TourRect | null>(null);
  const [viewport, setViewport] = useState({ width: 1280, height: 800 });
  const [popoverHeight, setPopoverHeight] = useState(330);
  const [peekBehind, setPeekBehind] = useState(false);

  const autoCheckedRef = useRef(false);
  const initialViewRef = useRef<ViewMode | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const safeStepIndex = Math.max(0, Math.min(tourStepIndex, TOUR_STEPS.length - 1));
  const currentStep = TOUR_STEPS[safeStepIndex] || TOUR_STEPS[0];

  // Auto-launch once on a member's very first authenticated session
  useEffect(() => {
    if (autoCheckedRef.current) return;
    if (
      !isHydrated ||
      !isAuthenticatedSession ||
      !currentUserId ||
      isTourOpen ||
      isSettingsOpen ||
      isFeatureGuideOpen ||
      isNewTaskOpen
    ) {
      return;
    }

    autoCheckedRef.current = true;
    try {
      const seen = localStorage.getItem(TOUR_STORAGE_KEY);
      if (seen === '1') return;
    } catch {
      return;
    }

    const timer = setTimeout(() => {
      startTour();
    }, 450);
    return () => clearTimeout(timer);
  }, [
    isHydrated,
    isAuthenticatedSession,
    currentUserId,
    isTourOpen,
    isSettingsOpen,
    isFeatureGuideOpen,
    isNewTaskOpen,
    startTour,
  ]);

  // Capture user's starting view when the tour opens so finishing/closing restores gracefully
  useEffect(() => {
    if (isTourOpen && initialViewRef.current === null) {
      initialViewRef.current = viewMode;
      setPeekBehind(false);
    } else if (!isTourOpen) {
      initialViewRef.current = null;
      setPeekBehind(false);
    }
  }, [isTourOpen, viewMode]);

  // Switch cleanly into the target view when a step highlights a specific workspace tab
  useEffect(() => {
    if (!isTourOpen || !currentStep.targetView) return;
    if (viewMode !== currentStep.targetView) {
      setViewMode(currentStep.targetView);
    }
  }, [isTourOpen, currentStep.targetView, viewMode, setViewMode]);

  const measureTarget = useCallback(() => {
    if (!isTourOpen || typeof window === 'undefined') return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    setViewport({ width: vw, height: vh });

    if (popoverRef.current) {
      const measuredH = Math.ceil(popoverRef.current.getBoundingClientRect().height);
      if (measuredH > 120) {
        setPopoverHeight(measuredH);
      }
    }

    const el = findFirstVisibleElement(currentStep.selectors);
    if (!el) {
      setTargetRect(null);
      return;
    }

    const rect = el.getBoundingClientRect();
    const cappedHeight = Math.min(rect.height, Math.max(180, vh * 0.48));
    const pad = 5;
    const top = Math.max(4, Math.round(rect.top - pad));
    const left = Math.max(4, Math.round(rect.left - pad));
    const maxW = vw - left - 4;
    const maxH = vh - top - 4;

    setTargetRect({
      top,
      left,
      width: Math.max(28, Math.min(Math.round(rect.width + pad * 2), maxW)),
      height: Math.max(28, Math.min(Math.round(cappedHeight + pad * 2), maxH)),
    });
  }, [isTourOpen, currentStep.selectors]);

  useLayoutEffect(() => {
    if (!isTourOpen) return;
    const el = findFirstVisibleElement(currentStep.selectors);
    if (el && typeof el.scrollIntoView === 'function') {
      try {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } catch {}
    }

    measureTarget();
    const raf = requestAnimationFrame(measureTarget);
    const t1 = setTimeout(measureTarget, 90);
    const t2 = setTimeout(measureTarget, 240);

    window.addEventListener('resize', measureTarget);
    window.addEventListener('scroll', measureTarget, true);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', measureTarget);
      window.removeEventListener('scroll', measureTarget, true);
    };
  }, [isTourOpen, safeStepIndex, viewMode, currentStep.selectors, measureTarget]);

  const finishOrCloseTour = useCallback(() => {
    const restoreView = initialViewRef.current;
    closeTour();
    if (restoreView && viewMode !== restoreView) {
      setViewMode(restoreView);
    }
  }, [closeTour, viewMode, setViewMode]);

  const handleNext = useCallback(() => {
    if (safeStepIndex >= TOUR_STEPS.length - 1) {
      finishOrCloseTour();
    } else {
      setTourStepIndex(safeStepIndex + 1);
    }
  }, [safeStepIndex, finishOrCloseTour, setTourStepIndex]);

  const handlePrev = useCallback(() => {
    if (safeStepIndex > 0) {
      setTourStepIndex(safeStepIndex - 1);
    }
  }, [safeStepIndex, setTourStepIndex]);

  // Keyboard shortcuts: Esc closes, ArrowRight/Enter advances, ArrowLeft goes back
  useEffect(() => {
    if (!isTourOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        finishOrCloseTour();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isTourOpen, finishOrCloseTour, handleNext, handlePrev]);

  const popoverWidth = Math.min(410, Math.max(270, viewport.width - 24));
  const popoverPos = useMemo(() => {
    const fallbackRect: TourRect = {
      top: Math.max(60, Math.round(viewport.height * 0.25)),
      left: Math.max(20, Math.round(viewport.width / 2 - 140)),
      width: 280,
      height: 80,
    };
    return computeTourPopoverPosition({
      targetRect: targetRect || fallbackRect,
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
      popoverWidth,
      popoverHeight: Math.min(popoverHeight, Math.max(220, viewport.height - 40)),
      preferredPlacement: currentStep.placement,
      gap: 14,
      margin: 12,
    });
  }, [targetRect, viewport, popoverWidth, popoverHeight, currentStep.placement]);

  if (!isTourOpen) return null;

  const isFirst = safeStepIndex === 0;
  const isLast = safeStepIndex === TOUR_STEPS.length - 1;
  const targetRight = targetRect ? targetRect.left + targetRect.width : 0;
  const targetBottom = targetRect ? targetRect.top + targetRect.height : 0;

  return (
    <div
      data-tour-root="true"
      data-tour-layer="true"
      role="dialog"
      aria-modal="true"
      aria-label={isZh ? '新手分步交互引导' : 'Interactive Product Walkthrough'}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 80,
        pointerEvents: 'none',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
      }}
    >
      {/* True SVG cutout mask: highlighted region is 100% transparent & unblurred; surround is gently dimmed */}
      {!peekBehind && (
        <svg
          data-tour-layer="true"
          width="100%"
          height="100%"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: 81,
          }}
          aria-hidden="true"
        >
          <defs>
            <mask id="labflow-tour-spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left}
                  y={targetRect.top}
                  width={targetRect.width}
                  height={targetRect.height}
                  rx="12"
                  ry="12"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(2, 6, 23, 0.34)"
            mask="url(#labflow-tour-spotlight-mask)"
          />
        </svg>
      )}

      {/* 4 perimeter transparent click-catchers so clicks INSIDE cutout go straight through to real UI controls */}
      {targetRect && !peekBehind && (
        <>
          <div
            data-tour-layer="true"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              height: `${Math.max(0, targetRect.top)}px`,
              pointerEvents: 'auto',
              zIndex: 82,
              backgroundColor: 'transparent',
            }}
          />
          <div
            data-tour-layer="true"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: `${targetRect.top}px`,
              left: 0,
              width: `${Math.max(0, targetRect.left)}px`,
              height: `${targetRect.height}px`,
              pointerEvents: 'auto',
              zIndex: 82,
              backgroundColor: 'transparent',
            }}
          />
          <div
            data-tour-layer="true"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: `${targetRect.top}px`,
              left: `${targetRight}px`,
              right: 0,
              height: `${targetRect.height}px`,
              pointerEvents: 'auto',
              zIndex: 82,
              backgroundColor: 'transparent',
            }}
          />
          <div
            data-tour-layer="true"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: `${targetBottom}px`,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'auto',
              zIndex: 82,
              backgroundColor: 'transparent',
            }}
          />
        </>
      )}

      {/* Glowing highlight frame (never matches .rounded-xl/.fixed.inset-0 CSS modal rules) */}
      {targetRect && (
        <div
          data-tour-layer="true"
          style={{
            position: 'fixed',
            top: `${targetRect.top}px`,
            left: `${targetRect.left}px`,
            width: `${targetRect.width}px`,
            height: `${targetRect.height}px`,
            borderRadius: '12px',
            border: '2px solid #06b6d4',
            boxShadow: peekBehind
              ? '0 0 0 3px rgba(6, 182, 212, 0.35)'
              : '0 0 0 4px rgba(34, 211, 238, 0.25), 0 0 24px rgba(6, 182, 212, 0.28)',
            backgroundColor: 'transparent',
            pointerEvents: 'none',
            transition: 'all 180ms ease',
            zIndex: 83,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '-10px',
              left: '10px',
              background: '#0891b2',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 700,
              padding: '1px 7px',
              borderRadius: '9999px',
              letterSpacing: '0.02em',
              boxShadow: '0 2px 6px rgba(8, 145, 178, 0.35)',
            }}
          >
            {isZh ? '当前高亮区' : 'Spotlight'}
          </span>
        </div>
      )}

      {/* Coachmark Card + Geometric Pointer Arrow */}
      <div
        ref={popoverRef}
        data-tour-layer="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: `${popoverPos.top}px`,
          left: `${popoverPos.left}px`,
          width: `${popoverWidth}px`,
          maxHeight: 'calc(100vh - 24px)',
          overflowY: 'auto',
          zIndex: 85,
          pointerEvents: 'auto',
          borderRadius: '16px',
          opacity: peekBehind ? 0.88 : 1,
          transition: 'top 180ms ease, left 180ms ease, opacity 150ms ease',
        }}
        className="bg-white dark:bg-slate-900 border-2 border-indigo-500/45 shadow-2xl p-4 text-slate-900 dark:text-slate-100"
      >
        {/* Pointer Arrow aimed cleanly at target center */}
        {targetRect && popoverPos.placement === 'bottom' && (
          <div
            data-tour-layer="true"
            style={{ left: `${popoverPos.arrowLeft - 7}px`, top: '-8px' }}
            className="absolute w-3.5 h-3.5 rotate-45 bg-white dark:bg-slate-900 border-l-2 border-t-2 border-indigo-500/45"
          />
        )}
        {targetRect && popoverPos.placement === 'top' && (
          <div
            data-tour-layer="true"
            style={{ left: `${popoverPos.arrowLeft - 7}px`, bottom: '-8px' }}
            className="absolute w-3.5 h-3.5 rotate-45 bg-white dark:bg-slate-900 border-r-2 border-b-2 border-indigo-500/45"
          />
        )}
        {targetRect && popoverPos.placement === 'right' && (
          <div
            data-tour-layer="true"
            style={{ left: '-8px', top: `${popoverPos.arrowTop - 7}px` }}
            className="absolute w-3.5 h-3.5 rotate-45 bg-white dark:bg-slate-900 border-l-2 border-b-2 border-indigo-500/45"
          />
        )}
        {targetRect && popoverPos.placement === 'left' && (
          <div
            data-tour-layer="true"
            style={{ right: '-8px', top: `${popoverPos.arrowTop - 7}px` }}
            className="absolute w-3.5 h-3.5 rotate-45 bg-white dark:bg-slate-900 border-r-2 border-t-2 border-indigo-500/45"
          />
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-start gap-2.5 min-w-0">
            <span className="p-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
              <Compass className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/12 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25">
                  {isZh ? currentStep.chapterZh : currentStep.chapterEn}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  {isZh
                    ? `第 ${safeStepIndex + 1} / ${TOUR_STEPS.length} 步`
                    : `${safeStepIndex + 1} of ${TOUR_STEPS.length}`}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                {isZh ? currentStep.titleZh : currentStep.titleEn}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setPeekBehind((p) => !p)}
              className={`p-1 rounded-lg border text-[11px] transition-colors ${
                peekBehind
                  ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-700 dark:text-indigo-300'
                  : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={
                peekBehind
                  ? isZh
                    ? '恢复聚光灯遮罩'
                    : 'Restore spotlight scrim'
                  : isZh
                  ? '暂时收起暗色幕布，清晰查看全屏画面'
                  : 'Hide dim scrim to inspect full page'
              }
            >
              {peekBehind ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={finishOrCloseTour}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              title={isZh ? '关闭引导 (Esc)' : 'Close tour (Esc)'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Summary */}
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2.5">
          {isZh ? currentStep.summaryZh : currentStep.summaryEn}
        </p>

        {/* Actionable Bullet Breakdown */}
        <ul className="space-y-1.5 mb-3">
          {(isZh ? currentStep.pointsZh : currentStep.pointsEn).map((pt, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-[11.5px] text-slate-700 dark:text-slate-200 leading-relaxed"
            >
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
              <span>{pt}</span>
            </li>
          ))}
        </ul>

        {/* Optional Pro Tip Callout */}
        {(currentStep.tipZh || currentStep.tipEn) && (
          <div className="mb-3 px-2.5 py-2 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-200">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <span>{isZh ? currentStep.tipZh : currentStep.tipEn}</span>
          </div>
        )}

        {/* Step Progress Dots & Footer Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1" title={isZh ? '点击圆点直接跳步' : 'Click dots to jump'}>
            {TOUR_STEPS.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setTourStepIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === safeStepIndex
                    ? 'w-4 bg-indigo-500'
                    : idx < safeStepIndex
                    ? 'w-1.5 bg-indigo-500/45 hover:bg-indigo-500'
                    : 'w-1.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                }`}
                aria-label={`Step ${idx + 1}: ${isZh ? s.titleZh : s.titleEn}`}
                title={isZh ? s.titleZh : s.titleEn}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            {!isFirst ? (
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>{isZh ? '上一步' : 'Back'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={finishOrCloseTour}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
              >
                {isZh ? '跳过' : 'Skip'}
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm"
            >
              {isLast ? (
                <>
                  <Sparkles className="w-3 h-3" />
                  <span>{isZh ? '完成开始使用' : 'Finish'}</span>
                </>
              ) : (
                <>
                  <span>{isZh ? '下一步' : 'Next'}</span>
                  <ArrowRight className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        </div>
        {/* Keyboard & Interactive Hint */}
        <div className="mt-2.5 flex items-center justify-between gap-2 text-[10px] text-slate-400">
          <span>{isZh ? '亮框内按钮可直接点击体验' : 'Highlighted controls are live & clickable'}</span>
          <span>{isZh ? '← / → 切步 · Esc 退出' : '← / → Navigate · Esc Close'}</span>
        </div>
      </div>
    </div>
  );
};
