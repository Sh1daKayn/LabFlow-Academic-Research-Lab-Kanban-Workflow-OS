'use client';

import React, { useMemo, useState } from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import {
  ArrowLeftRight,
  ArrowRight,
  BarChart2,
  BookmarkPlus,
  BookOpen,
  CalendarClock,
  CheckSquare,
  Compass,
  Cpu,
  Database,
  Flame,
  GitBranch,
  LayoutDashboard,
  Link2,
  ListChecks,
  Network,
  Palette,
  Presentation,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserCheck,
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
    | 'settingsVenues'
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
        descZh: '拥有仅次于导师的权限，可直接进入「成员、共享设备与资源、阶段、期刊、备份」设置协助维护。',
        descEn: 'Manage members, shared resources, stages, venues, and backups in Settings without PI password.',
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
    accentClass: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    actionId: 'architecture',
  },
  {
    id: 'outreachWorkshops',
    category: 'views',
    access: 'all',
    titleZh: '课题 → 转化与外联排期视图 (Outreach & Workshops)',
    titleEn: 'Outreach & Translation Track Scheduler',
    summaryZh: '支持在 Settings 自由增删转化去向标签（Seminar、产业/临床合作、政策简报、开源专利等），并反向筛选看板。',
    summaryEn: 'Assign customizable downstream outreach/translation tracks per project, schedule dates, and reverse-filter Kanban.',
    whereZh: '顶部「更多 → 架构与云图」→ 子页签「转化与外联」，或在「系统设置 → 期刊与转化出口」自定义标签',
    whereEn: 'Projects & Lineage -> "Outreach & Workshops" sub-view; customize tracks in Settings -> Venues & Outreach',
    actionLabelZh: '查看转化排期',
    actionLabelEn: 'Open Outreach',
    keywords: '转化 外联 排期 seminar workshop outreach partner policy clinical patent',
    icon: <CalendarClock className="w-4 h-4" />,
    accentClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
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
    whereZh: '顶部标签「更多 → 组会」',
    whereEn: 'Top navigation "More -> Standup"',
    actionLabelZh: '开启组会模式',
    actionLabelEn: 'Open Standup',
    keywords: '组会 投屏 计时 纪要 周报 markdown meeting standup minutes digest',
    icon: <Presentation className="w-4 h-4" />,
    accentClass: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
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
    whereZh: '顶部工具栏橙色「⚡ 投稿倒排期」按钮',
    whereEn: 'Top tools bar amber "⚡ Reverse DDL" button',
    actionLabelZh: '立即倒推建项',
    actionLabelEn: 'Launch Reverse DDL',
    keywords: '倒排期 ddl 死线 截稿 会议 生成任务 reverse deadline',
    icon: <Zap className="w-4 h-4" />,
    accentClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    actionId: 'reverseDDL',
  },
  {
    id: 'venueUrls',
    category: 'planning',
    access: 'all',
    titleZh: '期刊 / 会议网址批量导入与直达跳转',
    titleEn: 'Batch Venue URL Import & Quick Open',
    summaryZh: '粘贴一组期刊/会议 URL（或 全称 | 短标签 | URL）即可批量去重入库，在任务卡、项目卡和倒排表点击徽章直达官网。',
    summaryEn: 'Paste a list of journal/conference URLs to import & deduplicate them, adding clickable links across cards & forms.',
    whereZh: '顶部「系统设置」→「目标期刊/会议库」批量粘贴框',
    whereEn: 'Settings -> Target Venues -> Batch URL Import box',
    actionLabelZh: '管理期刊网址',
    actionLabelEn: 'Manage Venues',
    keywords: '期刊 会议 网址 批量导入 url venue journal conference import',
    icon: <BookOpen className="w-4 h-4" />,
    accentClass: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
    actionId: 'settingsVenues',
  },
  {
    id: 'customAssets',
    category: 'planning',
    access: 'all',
    titleZh: '任务与项目动态自定义外链 (Custom Resource Links)',
    titleEn: 'Flexible Custom External Links',
    summaryZh: '不局限于固定 4 项链接！随时添加/重命名/删减 Lab Notebook、IRB、Qualtrics、Pre-reg、Box 等跨学科任意外链。',
    summaryEn: 'Add, rename, or remove unlimited links per task or project using cross-disciplinary presets (Overleaf, GitHub, IRB, Survey, Drive...).',
    whereZh: '任意任务卡片展开编辑器 / 任务详情抽屉 / 项目编辑弹窗中的「外链资源」区',
    whereEn: 'Expanded task card editor, Task Detail Drawer, New Task modal, or Project Editor',
    actionLabelZh: '前往任务管理外链',
    actionLabelEn: 'Open Board',
    keywords: '外链 链接 custom link resource overleaf github dataset irb qualtrics box',
    icon: <Link2 className="w-4 h-4" />,
    accentClass: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    actionId: 'kanban',
  },
  {
    id: 'aiImport',
    category: 'planning',
    access: 'all',
    titleZh: 'AI 文档智能冷启动导入',
    titleEn: 'AI Smart Document Importer',
    summaryZh: '提供标准 Prompt 让任意大模型把立项书、周报、人员名单转为 JSON，一次性批量建组、建人、建任务。',
    summaryEn: 'Paste AI-parsed JSON from project proposals or rosters to bootstrap members and tasks in seconds.',
    whereZh: '顶部工具栏「✨ AI 导入」按钮',
    whereEn: 'Top tools bar "✨ AI Import" button',
    actionLabelZh: '打开 AI 导入',
    actionLabelEn: 'Open AI Import',
    keywords: 'ai 导入 冷启动 json 提示词 prompt 批量 import',
    icon: <Sparkles className="w-4 h-4" />,
    accentClass: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
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
    accentClass: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
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
    whereZh: '顶部工具栏「📑 模板库」/ 任务卡片内嵌编辑区 / 任务详情抽屉 /「周待办与验收」顶部生成条',
    whereEn: 'Top tools bar "Templates" / Task Card Editor / Detail Drawer / Weekly Todos Bar',
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
    titleZh: '研究卡点红灯报警与解除',
    titleEn: 'Blocker Escalation & Filter',
    summaryZh: '卡在实验方法、数据、设备或审稿问题时点火焰图标标红求助，顶部「仅看卡点」与组会看板会集中置顶提示决策人。',
    summaryEn: 'Flag bottlenecks with escalation owner; highlight via top "Only Blockers" filter and Standup view.',
    whereZh: '卡片右下角火焰图标 🔥 / 顶部筛选栏「仅看卡点」筛选按钮',
    whereEn: 'Flame icon on task cards / top filter bar "Only Blockers" toggle',
    actionLabelZh: '筛选当前卡点',
    actionLabelEn: 'Filter Blockers',
    keywords: '卡点 阻塞 求助 红灯 解除 blocker urgent flame',
    icon: <Flame className="w-4 h-4" />,
    accentClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    actionId: 'blockers',
  },
  {
    id: 'duplicateWorkload',
    category: 'collab',
    access: 'all',
    titleZh: '重名防重认领、合并与工作负载气泡',
    titleEn: 'Duplicate Account Guard & Workload Bubbles',
    summaryZh: '注册或建档时自动检测重名并提供一键认领原账号；成员管理页与组会标签展示每人活跃课题、任务、阻塞与待审负荷气泡。',
    summaryEn: 'Detects existing profiles by name to let members claim/switch directly, lets admins merge duplicates, and shows workload bubbles.',
    whereZh: '注册登录页自动提醒 / 成员管理页 / 组会「汇报人」药丸标签',
    whereEn: 'Sign-up gate & Register Modal / Settings -> Members / Standup presenter pills',
    actionLabelZh: '查看成员与负载',
    actionLabelEn: 'Open Member Roster',
    keywords: '重名 合并 认领 负载 气泡 duplicate merge workload claim',
    icon: <UserCheck className="w-4 h-4" />,
    accentClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    actionId: 'settingsMembers',
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
    titleZh: '共享实验设备与公共资源预约',
    titleEn: 'Shared Resources & Equipment Claims',
    summaryZh: '在顶部可折叠资源条查看仪器、服务器、共享数据集或会议室使用倒计时，一键预约使用或提前释放。',
    summaryEn: 'Inspect busy/idle lab instruments, servers, rooms, or datasets and reserve/release shared slots cleanly.',
    whereZh: '导航栏下方「共享资源与设备」折叠条 →「预约使用」',
    whereEn: 'Foldable "Shared Resources" strip below header -> "Reserve"',
    actionLabelZh: '管理共享资源',
    actionLabelEn: 'Manage Resources',
    keywords: '设备 仪器 资源 数据集 房间 节点 认领 预约 resource instrument equipment server',
    icon: <Cpu className="w-4 h-4" />,
    accentClass: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    actionId: 'resources',
  },
  {
    id: 'appearance',
    category: 'system',
    access: 'all',
    titleZh: '24 种字体混搭 · Light 默认主题 & Obsidian Gold 配色',
    titleEn: '12+12 Fonts · Light Default & Obsidian Gold Accent',
    summaryZh: '默认明亮浅色模式，内置 Classic Indigo、Obsidian & Gold（曜黑金）等多款强调色与 24 种中英文字体混搭。',
    summaryEn: 'Light mode default with 12+12 font combinations plus built-in Classic Indigo, Obsidian & Gold, and custom accent themes.',
    whereZh: '顶部「系统设置」→「外观与字体」/ 账户菜单 ☀️🌙 切换',
    whereEn: 'Top "Settings" -> "Appearance & Fonts" / Account menu Light/Dark toggle',
    actionLabelZh: '配置字体与主题',
    actionLabelEn: 'Open Appearance Settings',
    keywords: '字体 幼圆 中文 英文 主题 黑色 白色 浅色 深色 曜黑金 font theme obsidian gold light dark',
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
    startTour,
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

  const openProtectedSettingsTab = (tab: 'members' | 'venues' | 'backup') => {
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
      case 'settingsVenues':
        openProtectedSettingsTab('venues');
        break;
      case 'settingsBackup':
        openProtectedSettingsTab('backup');
        break;
    }
  };

  const categories: Array<{ id: GuideCategory; label: string }> = [
    { id: 'all', label: isZh ? `全部功能 (${GUIDE_FEATURES.length})` : `All (${GUIDE_FEATURES.length})` },
    { id: 'views', label: isZh ? '核心视图' : 'Core Views' },
    { id: 'planning', label: isZh ? '排期与外链' : 'Planning & Links' },
    { id: 'collab', label: isZh ? '协同与设备' : 'Collab & Resources' },
    { id: 'system', label: isZh ? '主题与备份' : 'Theme & Sync' },
  ];

  const activeRoleGuide = ROLE_QUICK_STARTS[roleTab];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl h-[88vh] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-indigo-500/8 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-sm shrink-0">
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

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsFeatureGuideOpen(false);
                startTour();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{isZh ? '启动分步箭头引导' : 'Launch Guided Tour'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsFeatureGuideOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              aria-label={isZh ? '关闭功能一览' : 'Close feature guide'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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
                      <CheckSquare className="w-3 h-3 text-indigo-500 shrink-0 mt-0.5" />
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
              <Users className="w-3.5 h-3.5 text-indigo-500" />
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
            className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors"
          >
            {isZh ? '我已了解，开始使用' : 'Got It'}
          </button>
        </div>
      </div>
    </div>
  );
};
