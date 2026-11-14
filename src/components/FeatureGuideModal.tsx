'use client';

import React, { useMemo, useState } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import {
  ArrowLeftRight,
  ArrowRight,
  BarChart2,
  BookmarkPlus,
  BookOpen,
  CheckSquare,
  Compass,
  Cpu,
  Database,
  Flame,
  GitBranch,
  LayoutDashboard,
  ListChecks,
  Network,
  Palette,
  Presentation,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserCog,
  Users,
  X,
  Zap,
} from 'lucide-react';

type GuideCategory = 'all' | 'views' | 'planning' | 'collab' | 'system';
type RoleGuideTab = 'student' | 'sysadmin' | 'pi';
type RoleAccessBadge = 'all' | 'lead' | 'manager';

interface FeatureGuideItem {
  id: string;
  category: Exclude<GuideCategory, 'all'>;
  access: RoleAccessBadge;
  titleZh: string;
  titleEn: string;
  summaryZh: string;
  summaryEn: string;
  whereZh: string;
  whereEn: string;
  actionLabelZh: string;
  actionLabelEn: string;
  keywords: string;
  icon: React.ReactNode;
  accentClass: string;
  actionId:
    | 'kanban'
    | 'gantt'
    | 'architecture'
    | 'todos'
    | 'meeting'
    | 'reverseDDL'
    | 'aiImport'
    | 'newTask'
    | 'blockers'
    | 'profile'
    | 'resources'
    | 'templates'
    | 'settingsAppearance'
    | 'settingsMembers'
    | 'settingsBackup';
}

const ROLE_QUICK_STARTS: Record<
  RoleGuideTab,
  {
    labelZh: string;
    labelEn: string;
    badgeZh: string;
    badgeEn: string;
    steps: Array<{ titleZh: string; titleEn: string; descZh: string; descEn: string }>;
  }
> = {
  student: {
    labelZh: '🧑‍💻 学生 / 骨干',
    labelEn: '🧑‍💻 Student / Lead',
    badgeZh: '日常科研与汇报主线',
    badgeEn: 'Daily Research Workflow',
    steps: [
      {
        titleZh: '1. 完善个人名片与头像',
        titleEn: '1. Set Your Profile & Avatar',
        descZh: '右上角选中自己的账号，点击头像可修改中英文姓名、研究头衔或上传照片头像。',
        descEn: 'Select yourself top-right and click your avatar to edit name, title, or upload a photo.',
      },
      {
        titleZh: '2. 用看板 + 逻辑树推进研究',
        titleEn: '2. Track Progress & Logic Tree',
        descZh: '在「看板」拖卡片或切换「阶段拖拽单元格」前移/退回阶段；点卡片分支图标编辑树状逻辑图。',
        descEn: 'Drag cards in Kanban or switch to Stage Cells; open the Logic Tree icon on any card.',
      },
      {
        titleZh: '3. 周待办提交验收 & 组会周报',
        titleEn: '3. Weekly Todos & Standup Digest',
        descZh: '在「周待办与验收」勾选完成并提交验收；开会前切到「组会」即可查看个人周报摘要。',
        descEn: 'Check off Weekly Todos for acceptance and review your personal summary in Standup.',
      },
    ],
  },
  sysadmin: {
    labelZh: '🛡️ 系统管理员（学生）',
    labelEn: '🛡️ Student SysAdmin',
    badgeZh: '协助导师维护实验室运转',
    badgeEn: 'Lab Operations Assistant',
    steps: [
      {
        titleZh: '1. 直接管理设置中心（免导师密码）',
        titleEn: '1. Open Settings Directly',
        descZh: '拥有仅次于导师的权限，可直接进入「成员、算力、阶段、顶会、备份」设置协助维护。',
        descEn: 'Manage members, GPUs, stages, venues, and backups in Settings without PI password.',
      },
      {
        titleZh: '2. 批量导入课题与协调权限',
        titleEn: '2. Batch Import & Coordinate Roles',
        descZh: '使用顶部「AI 导入」冷启动新课题，在成员管理中分配骨干、普通组员与访客账号。',
        descEn: 'Use AI Import for quick onboarding and assign Lead/Member/Guest permissions.',
      },
      {
        titleZh: '3. 跨课题阶段调度与卡点跟进',
        titleEn: '3. Cross-Project Scheduling',
        descZh: '利用「阶段拖拽单元格」协调公共项目与任务阶段，集中提醒「仅看卡点」阻塞项。',
        descEn: 'Coordinate project & task stages via Stage Cells and track active blockers.',
      },
    ],
  },
  pi: {
    labelZh: '👑 导师 / PI',
    labelEn: '👑 PI / Advisor',
    badgeZh: '实验室总控与组会决策',
    badgeEn: 'Lab Oversight & Decisions',
    steps: [
      {
        titleZh: '1. 解锁管理员并安排系统管理员',
        titleEn: '1. Unlock Admin & Assign SysAdmin',
        descZh: '点击右上角锁头解锁，可在「成员管理」委派学生担任系统管理员，并切换全员互验模式。',
        descEn: 'Click the lock icon top-right to appoint Student SysAdmins or toggle Peer Acceptance.',
      },
      {
        titleZh: '2. 投稿死线倒排期一键建项',
        titleEn: '2. Generate Reverse-DDL Pipelines',
        descZh: '点顶部「投稿倒排期」填写顶会与截稿日，系统自动生成 4 阶段里程碑任务。',
        descEn: 'Click Reverse DDL to auto-generate 4 milestone tasks backwards from your deadline.',
      },
      {
        titleZh: '3. 组会投屏把控节奏与导出纪要',
        titleEn: '3. Run Standup & Export Minutes',
        descZh: '切到「组会」按学生投屏汇报、当场一键解除卡点，并导出 Markdown 会议纪要留档。',
        descEn: 'Use Standup to review each presenter, resolve blockers, and export Markdown minutes.',
      },
    ],
  },
};

const GUIDE_FEATURES: FeatureGuideItem[] = [
  {
    id: 'kanban',
    category: 'views',
    access: 'all',
    titleZh: '科研看板 & 阶段拖拽单元格',
    titleEn: 'Kanban Board & Stage Drag Cells',
    summaryZh: '按研究阶段横向流转卡片，支持「看板列」和「阶段拖拽单元格」双模式，前移推进或退回上阶段完全可逆。',
    summaryEn: 'Move tasks & projects forward or backward across stages via Kanban cards or Stage Cells matrix.',
    whereZh: '顶部标签第 1 项「看板」→ 右上角可切换「阶段拖拽单元格」或卡片底部 ← / →',
    whereEn: 'Top tab #1 "Kanban" -> switch "Columns / Stage Cells" or use card ← / → buttons',
    actionLabelZh: '前往看板',
    actionLabelEn: 'Open Kanban',
    keywords: '看板 kanban 拖拽 单元格 退回 推进 阶段 matrix cell drag stage',
    icon: <LayoutDashboard className="w-4 h-4" />,
    accentClass: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    actionId: 'kanban',
  },
  {
    id: 'gantt',
    category: 'views',
    access: 'all',
    titleZh: '甘特时间轴排期',
    titleEn: 'Gantt Timeline Scheduler',
    summaryZh: '按周或按月直观对比全组课题起止周期与截稿倒计时，支持课题/单任务双视图快速调整日期。',
    summaryEn: 'Inspect project durations and deadlines on a weekly/monthly timeline with project or task grouping.',
    whereZh: '顶部标签第 2 项「甘特」',
    whereEn: 'Top tab #2 "Gantt Chart"',
    actionLabelZh: '查看甘特图',
    actionLabelEn: 'Open Gantt',
    keywords: '甘特 时间轴 排期 截止日期 gantt timeline schedule deadline',
    icon: <BarChart2 className="w-4 h-4" />,
    accentClass: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
    actionId: 'gantt',
  },
  {
    id: 'architecture',
    category: 'views',
    access: 'all',
    titleZh: '大类归档 · 自动词云 · 架构树状图',
    titleEn: 'Project Categories · Word Cloud · Architecture Tree',
    summaryZh: '按研究大类聚合项目并自动统计去重负责人数，生成可点击高亮的 SVG 学术词云与折叠架构树。',
    summaryEn: 'Group projects by research category with member counts, interactive SVG word cloud, and project trees.',
    whereZh: '顶部标签第 3 项「架构与云图」',
    whereEn: 'Top tab #3 "Tree & Cloud"',
    actionLabelZh: '查看架构与云图',
    actionLabelEn: 'Open Tree & Cloud',
    keywords: '架构 树状图 词云 大类 归类 人数 statistics word cloud tree category',
    icon: <Network className="w-4 h-4" />,
    accentClass: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30',
    actionId: 'architecture',
  },
  {
    id: 'todos',
    category: 'views',
    access: 'all',
    titleZh: '成员本周 To-Do List 与项验收',
    titleEn: 'Weekly To-Do List & Acceptance',
    summaryZh: '按学生/成员查看每周待办与完成率，可与任务执行清单双向同步，支持提交验收与导师/全员互验流转。',
    summaryEn: 'Manage each member weekly commitments linked with task checklists and acceptance workflows.',
    whereZh: '顶部标签第 4 项「周待办与验收」',
    whereEn: 'Top tab #4 "Weekly Todos"',
    actionLabelZh: '进入周待办',
    actionLabelEn: 'Open Weekly Todos',
    keywords: '待办 todo 清单 验收 互验 非锁模式 checklist acceptance weekly',
    icon: <ListChecks className="w-4 h-4" />,
    accentClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    actionId: 'todos',
  },
  {
    id: 'meeting',
    category: 'views',
    access: 'all',
    titleZh: '组会投屏与一键纪要导出',
    titleEn: 'Group Standup & Minutes Export',
    summaryZh: '三栏聚焦近期录用、推进中与紧急卡点，内置组会计时器、按汇报人切换，以及个人周报与 Markdown 纪要导出。',
    summaryEn: 'Presenter filter, live timer, 3-column summary, instant unblock, and Markdown minutes export.',
    whereZh: '顶部标签第 5 项「组会」',
    whereEn: 'Top tab #5 "Standup"',
    actionLabelZh: '开启组会模式',
    actionLabelEn: 'Open Standup',
    keywords: '组会 投屏 计时 纪要 周报 markdown meeting standup minutes digest',
    icon: <Presentation className="w-4 h-4" />,
    accentClass: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    actionId: 'meeting',
  },
  {
    id: 'reverseDDL',
    category: 'planning',
    access: 'all',
    titleZh: '投稿死线倒排期建项',
    titleEn: 'Reverse-DDL Pipeline Generator',
    summaryZh: '只需填入论文题目、目标会议与最终投稿截止日期，自动按周期倒推拆出 4 个阶段的任务卡。',
    summaryEn: 'Enter venue & deadline to automatically generate 4 milestone tasks working backwards.',
    whereZh: '顶部导航栏橙色「⚡ 投稿倒排期」按钮',
    whereEn: 'Top header amber "⚡ Reverse DDL" button',
    actionLabelZh: '立即倒推建项',
    actionLabelEn: 'Launch Reverse DDL',
    keywords: '倒排期 ddl 死线 截稿 会议 生成任务 reverse deadline',
    icon: <Zap className="w-4 h-4" />,
    accentClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    actionId: 'reverseDDL',
  },
  {
    id: 'aiImport',
    category: 'planning',
    access: 'all',
    titleZh: 'AI 文档智能冷启动导入',
    titleEn: 'AI Smart Document Importer',
    summaryZh: '提供标准 Prompt 让任意大模型把立项书、周报、人员名单转为 JSON，一次性批量建组、建人、建任务。',
    summaryEn: 'Paste AI-parsed JSON from project proposals or rosters to bootstrap members and tasks in seconds.',
    whereZh: '顶部导航栏「✨ AI 导入」按钮',
    whereEn: 'Top header "✨ AI Import" button',
    actionLabelZh: '打开 AI 导入',
    actionLabelEn: 'Open AI Import',
    keywords: 'ai 导入 冷启动 json 提示词 prompt 批量 import',
    icon: <Sparkles className="w-4 h-4" />,
    accentClass: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    actionId: 'aiImport',
  },
  {
    id: 'logicTree',
    category: 'planning',
    access: 'all',
    titleZh: '任务树状逻辑图（自动生成+自由编辑）',
    titleEn: 'Editable Task Logic Tree',
    summaryZh: '为每个任务生成可编辑的多层级思路/实验逻辑树，支持增删子节点、切换状态及同步进执行清单。',
    summaryEn: 'Auto-generate and freely edit hierarchical reasoning/experiment trees, syncing nodes to checklist.',
    whereZh: '任意看板卡片右下角分支图标 🌿，或展开任务详情切换到「树状逻辑图」',
    whereEn: 'Click the branch icon on any Kanban card or open Task Details -> Logic Tree',
    actionLabelZh: '去看板打开卡片',
    actionLabelEn: 'Go to Cards',
    keywords: '逻辑树 树状图 节点 拆解 清单 logic tree node checklist',
    icon: <GitBranch className="w-4 h-4" />,
    accentClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
    actionId: 'kanban',
  },
  {
    id: 'templates',
    category: 'planning',
    access: 'all',
    titleZh: '执行清单与验收项自定义模板（保存 & 一键注入）',
    titleEn: 'Custom Checklist & Acceptance Templates',
    summaryZh: '把常用的实验步骤、投稿复核或基线对比标准保存为自定义模板（含每条验收标准与优先级），支持一键注入任务清单或本周待办，也可从现有任务或本周列表反存为新模板。',
    summaryEn: 'Save reusable checklist + acceptance criteria templates and inject them in 1 click into tasks or weekly todos.',
    whereZh: '任务卡片内嵌编辑区 / 任务详情抽屉 /「周待办与验收」顶部生成条',
    whereEn: 'Task Card Inline Editor / Task Detail Drawer / Weekly Todos Injector Bar',
    actionLabelZh: '打开模板库',
    actionLabelEn: 'Open Templates',
    keywords: '模板 清单 验收 一键生成 注入 复用 template checklist acceptance inject save',
    icon: <BookmarkPlus className="w-4 h-4" />,
    accentClass: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    actionId: 'templates',
  },
  {
    id: 'blockers',
    category: 'planning',
    access: 'all',
    titleZh: '技术卡点红灯报警与解除',
    titleEn: 'Blocker Escalation & Filter',
    summaryZh: '卡在算力、数据或审稿问题时点火焰图标标红求助，顶部「仅看卡点」与组会看板会集中置顶提示决策人。',
    summaryEn: 'Flag bottlenecks with escalation owner; highlight via top "Only Blockers" filter and Standup view.',
    whereZh: '卡片右下角火焰图标 🔥 / 顶部「仅看卡点」筛选按钮',
    whereEn: 'Flame icon on task cards / top header "Only Blockers" filter',
    actionLabelZh: '筛选当前卡点',
    actionLabelEn: 'Filter Blockers',
    keywords: '卡点 阻塞 求助 红灯 解除 blocker urgent flame',
    icon: <Flame className="w-4 h-4" />,
    accentClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    actionId: 'blockers',
  },
  {
    id: 'profile',
    category: 'collab',
    access: 'all',
    titleZh: '随时改名与上传自定义照片头像',
    titleEn: 'Editable Profile & Photo Avatar',
    summaryZh: '所有成员均可随时修改中英文姓名、职称签名，并上传本地图片（自动压缩适配）作为全系统个人头像。',
    summaryEn: 'Update your Chinese/English name, title, and upload a custom photo avatar anytime.',
    whereZh: '右上角用户切换胶囊中的个人头像或 👤 编辑图标',
    whereEn: 'Click your avatar or profile icon in the top-right user switcher pill',
    actionLabelZh: '编辑我的资料',
    actionLabelEn: 'Edit My Profile',
    keywords: '头像 照片 改名 名字 个人资料 profile avatar photo name',
    icon: <UserCog className="w-4 h-4" />,
    accentClass: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30',
    actionId: 'profile',
  },
  {
    id: 'rbac',
    category: 'collab',
    access: 'manager',
    titleZh: '五级权限与学生系统管理员',
    titleEn: '5-Tier RBAC & Student SysAdmin',
    summaryZh: '权限依次为：导师 > 系统管理员（学生） > 骨干 > 组员 > 访客；导师解锁后可委任学生分担实验室管理，也可切换全员互验。',
    summaryEn: 'PI > SysAdmin > Lead > Member > Guest; PIs can appoint students as SysAdmin & toggle peer acceptance.',
    whereZh: '顶部「系统设置」→「成员与权限管理」',
    whereEn: 'Top "Settings" -> "Members & Permissions"',
    actionLabelZh: '进入成员管理',
    actionLabelEn: 'Open Member Settings',
    keywords: '权限 管理员 系统管理员 导师 角色 学生 互验 rbac admin sysadmin role',
    icon: <ShieldCheck className="w-4 h-4" />,
    accentClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    actionId: 'settingsMembers',
  },
  {
    id: 'resources',
    category: 'collab',
    access: 'all',
    titleZh: '公共算力与实验室设施认领',
    titleEn: 'Shared Compute & GPU Claims',
    summaryZh: '在顶部可折叠资源条查看 GPU 服务器与实验台使用时长倒计时，一键认领占用或提前释放。',
    summaryEn: 'Inspect busy/idle lab GPU nodes and claim or release shared compute slots cleanly.',
    whereZh: '导航栏下方「公共算力与设施」折叠条 →「认领节点」',
    whereEn: 'Foldable "Shared Compute" strip below header -> "Claim Nodes"',
    actionLabelZh: '管理算力认领',
    actionLabelEn: 'Manage Compute',
    keywords: '算力 gpu 服务器 节点 认领 设备 resource compute server',
    icon: <Cpu className="w-4 h-4" />,
    accentClass: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    actionId: 'resources',
  },
  {
    id: 'appearance',
    category: 'system',
    access: 'all',
    titleZh: '24 种中英文字体混搭与浅深色模式',
    titleEn: '12+12 Fonts & Light/Dark Theme',
    summaryZh: '内置 12 种中文字体（含幼圆、楷体、宋体、思源等）与 12 种英文字体自由搭配，配合右上角一键日夜模式切换。',
    summaryEn: 'Mix 12 Chinese (incl. YouYuan) and 12 English font presets alongside full light/dark theme support.',
    whereZh: '顶部「系统设置」→「外观与字体」/ 右上角 ☀️🌙 切换按钮',
    whereEn: 'Top "Settings" -> "Appearance & Fonts" / header Sun/Moon button',
    actionLabelZh: '配置字体与外观',
    actionLabelEn: 'Open Font Settings',
    keywords: '字体 幼圆 中文 英文 主题 黑色 白色 浅色 深色 font youyuan theme dark light',
    icon: <Palette className="w-4 h-4" />,
    accentClass: 'bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30',
    actionId: 'settingsAppearance',
  },
  {
    id: 'backup',
    category: 'system',
    access: 'manager',
    titleZh: '实时同步持久化与 JSON 快照备份',
    titleEn: 'Server Sync & JSON Snapshot Backup',
    summaryZh: '数据自动保存至服务端（本地 JSON 或 PostgreSQL 数据库），支持随时导出全量 JSON 备份或恢复快照。',
    summaryEn: 'Auto-persists to server store (local JSON or PostgreSQL) with full JSON export & restore.',
    whereZh: '顶部同步状态指示胶囊 /「系统设置」→「数据备份与重置」',
    whereEn: 'Top sync status pill / "Settings" -> "Data & Backup"',
    actionLabelZh: '打开数据与备份',
    actionLabelEn: 'Open Data Backup',
    keywords: '备份 同步 数据 持久化 导出 恢复 database postgres json backup sync',
    icon: <Database className="w-4 h-4" />,
    accentClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    actionId: 'settingsBackup',
  },
];

export const FeatureGuideModal: React.FC = () => {
  const {
    isFeatureGuideOpen,
    setIsFeatureGuideOpen,
    setViewMode,
    setFilterOnlyBlockers,
    setIsReverseDDLOpen,
    setIsAIImportOpen,
    setIsNewTaskOpen,
    setIsMyProfileModalOpen,
    setIsResourceModalOpen,
    openTemplateModal,
    setIsSettingsOpen,
    setActiveSettingsTab,
    canManageLab,
    requireAdminAuth,
    currentAccessRole,
    language,
  } = useLabFlow();

  const isZh = language === 'zh';
  const defaultRoleTab: RoleGuideTab =
    currentAccessRole === 'ADMIN_PI'
      ? 'pi'
      : currentAccessRole === 'SYS_ADMIN'
      ? 'sysadmin'
      : 'student';

  const [roleTab, setRoleTab] = useState<RoleGuideTab>(defaultRoleTab);
  const [category, setCategory] = useState<GuideCategory>('all');
  const [query, setQuery] = useState('');

  const filteredFeatures = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GUIDE_FEATURES.filter((item) => {
      if (category !== 'all' && item.category !== category) return false;
      if (!q) return true;
      const haystack = [
        item.titleZh,
        item.titleEn,
        item.summaryZh,
        item.summaryEn,
        item.whereZh,
        item.whereEn,
        item.keywords,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [category, query]);

  if (!isFeatureGuideOpen) return null;

  const openProtectedSettingsTab = (tab: 'members' | 'backup') => {
    setIsFeatureGuideOpen(false);
    if (canManageLab()) {
      setActiveSettingsTab(tab);
      setIsSettingsOpen(true);
    } else {
      requireAdminAuth(() => {
        setActiveSettingsTab(tab);
        setIsSettingsOpen(true);
      });
    }
  };

  const handleJump = (actionId: FeatureGuideItem['actionId']) => {
    switch (actionId) {
      case 'kanban':
        setFilterOnlyBlockers(false);
        setViewMode('kanban');
        setIsFeatureGuideOpen(false);
        break;
      case 'gantt':
        setViewMode('gantt');
        setIsFeatureGuideOpen(false);
        break;
      case 'architecture':
        setViewMode('architecture');
        setIsFeatureGuideOpen(false);
        break;
      case 'todos':
        setViewMode('todos');
        setIsFeatureGuideOpen(false);
        break;
      case 'meeting':
        setViewMode('meeting');
        setIsFeatureGuideOpen(false);
        break;
      case 'reverseDDL':
        setIsFeatureGuideOpen(false);
        setIsReverseDDLOpen(true);
        break;
      case 'aiImport':
        setIsFeatureGuideOpen(false);
        setIsAIImportOpen(true);
        break;
      case 'newTask':
        setIsFeatureGuideOpen(false);
        setIsNewTaskOpen(true);
        break;
      case 'blockers':
        setViewMode('kanban');
        setFilterOnlyBlockers(true);
        setIsFeatureGuideOpen(false);
        break;
      case 'profile':
        setIsFeatureGuideOpen(false);
        setIsMyProfileModalOpen(true);
        break;
      case 'resources':
        setIsFeatureGuideOpen(false);
        setIsResourceModalOpen(true);
        break;
      case 'templates':
        setIsFeatureGuideOpen(false);
        openTemplateModal();
        break;
      case 'settingsAppearance':
        setIsFeatureGuideOpen(false);
        setActiveSettingsTab('appearance');
        setIsSettingsOpen(true);
        break;
      case 'settingsMembers':
        openProtectedSettingsTab('members');
        break;
      case 'settingsBackup':
        openProtectedSettingsTab('backup');
        break;
    }
  };

  const categories: Array<{ id: GuideCategory; label: string }> = [
    { id: 'all', label: isZh ? `全部功能 (${GUIDE_FEATURES.length})` : `All (${GUIDE_FEATURES.length})` },
    { id: 'views', label: isZh ? '五大核心视图' : '5 Core Views' },
    { id: 'planning', label: isZh ? '排期与拆解' : 'Planning & Trees' },
    { id: 'collab', label: isZh ? '协作与权限' : 'Roles & Compute' },
    { id: 'system', label: isZh ? '字体与数据' : 'Fonts & Sync' },
  ];

  const activeRoleGuide = ROLE_QUICK_STARTS[roleTab];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl h-[88vh] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-500/10 via-cyan-500/5 to-transparent flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-sm shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                {isZh ? 'LabFlow 功能一览与快速上手指南' : 'LabFlow Feature Overview & Quick Start'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {isZh
                  ? '不知道从哪下手？先按身份看 3 步路线图，再搜索或点击任意功能「直达」对应界面。'
                  : 'Pick your role for a 3-step quick start or search any module to jump straight in.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsFeatureGuideOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            aria-label={isZh ? '关闭功能一览' : 'Close feature guide'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          {/* Section 1: Role-Based 3-Step Quick Start */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  {isZh ? '按身份 3 步快速上手' : '3-Step Quick Start by Role'}
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium">
                  {isZh ? activeRoleGuide.badgeZh : activeRoleGuide.badgeEn}
                </span>
              </div>

              <div className="inline-flex items-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5 text-xs">
                {(['student', 'sysadmin', 'pi'] as const).map((rId) => (
                  <button
                    key={rId}
                    type="button"
                    onClick={() => setRoleTab(rId)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      roleTab === rId
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {isZh ? ROLE_QUICK_STARTS[rId].labelZh : ROLE_QUICK_STARTS[rId].labelEn}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {activeRoleGuide.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs"
                >
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {isZh ? step.titleZh : step.titleEn}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    {isZh ? step.descZh : step.descEn}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 2: Filter & Search Bar */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                      category === cat.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={isZh ? '搜索功能：如 拖拽、字体、验收...' : 'Search features...'}
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Feature Map Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredFeatures.map((item) => {
                const accessBadge =
                  item.access === 'manager'
                    ? isZh
                      ? '导师 / 系统管理员'
                      : 'PI / SysAdmin'
                    : item.access === 'lead'
                    ? isZh
                      ? '骨干及以上'
                      : 'Lead+'
                    : isZh
                    ? '全员可用'
                    : 'All Members';

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 flex flex-col justify-between gap-3 hover:border-indigo-400/60 dark:hover:border-indigo-500/50 transition-all shadow-xs"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-2 rounded-xl border shrink-0 ${item.accentClass}`}>
                            {item.icon}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
                              {isZh ? item.titleZh : item.titleEn}
                            </h4>
                            <span
                              className={`inline-block mt-0.5 text-[10px] font-medium px-1.5 py-0.2 rounded border ${
                                item.access === 'manager'
                                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {accessBadge}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleJump(item.actionId)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 hover:bg-indigo-600 hover:text-white text-indigo-600 dark:text-indigo-300 dark:hover:bg-indigo-600 dark:hover:text-white text-[11px] font-semibold transition-colors shrink-0"
                        >
                          <span>{isZh ? item.actionLabelZh : item.actionLabelEn}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        {isZh ? item.summaryZh : item.summaryEn}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
                      <CheckSquare className="w-3 h-3 text-cyan-500 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-slate-700 dark:text-slate-300">
                          {isZh ? '入口位置：' : 'Where: '}
                        </strong>
                        {isZh ? item.whereZh : item.whereEn}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredFeatures.length === 0 && (
              <div className="p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-xs text-slate-500">
                {isZh ? '未找到匹配该关键词的功能，换个词试试？' : 'No matching features found.'}
              </div>
            )}
          </section>
        </div>

        {/* Footer Quick Tips */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-500" />
              {isZh ? '看板支持前移/退回阶段' : 'Stage moves are bidirectional'}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-cyan-500" />
              {isZh ? '右上角可随时切换账号体验不同视角' : 'Switch member top-right to preview roles'}
            </span>
            <span className="inline-flex items-center gap-1">
              <Settings className="w-3.5 h-3.5 text-emerald-500" />
              {isZh ? '所有修改会自动同步并持久化' : 'All edits auto-sync & persist'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsFeatureGuideOpen(false)}
            className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            {isZh ? '我已了解，开始使用' : 'Got It'}
          </button>
        </div>
      </div>
    </div>
  );
};
