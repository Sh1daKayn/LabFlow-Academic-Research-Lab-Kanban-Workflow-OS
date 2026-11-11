import { LocaleTranslations } from './en';

export const zh: LocaleTranslations = {
  brand: 'LabFlow',
  academicOS: '学术操作系统',
  labTitle: '计算系统与决策实验室',
  labSub: '科研课题组',

  // View modes
  kanban: '学术看板',
  gantt: '学术甘特图',
  meeting: '组会投屏',
  pipelineSettings: '流程设置',

  // Top action buttons
  onlyBlockers: '仅看卡点',
  reverseDDL: '投稿倒排期',
  newTask: '新建任务',
  resetDemo: '重置示例',
  toggleTheme: '切换主题',
  switchLang: 'EN',

  // Search & Filters
  searchPlaceholder: '搜索论文题目、目标会议或负责人...',
  allMembers: '全实验室成员',
  activeFilters: '当前生效的筛选条件',
  showingTasks: '展示匹配当前条件的论文任务',
  noTasksInStage: '该阶段暂无任务',
  dragHint: '拖拽卡片至此或点击上方 + 号添加',

  // Resource Strip
  computeTitle: '公共算力与设施状态',
  busyNodes: '运行中',
  idleNodes: '空闲',
  claimManage: '认领与管理节点',
  readyForRuns: '空闲可用，可直接跑批',
  reservedFor: '已预约',
  hoursRemaining: '小时剩余',

  // Blocker Modal
  reportBlocker: '标记学术卡点',
  activeBlockerAlert: '当前技术卡点',
  whereStuck: '具体卡在什么技术点？',
  whatTried: '已尝试过的解法与推导',
  escalateTo: '求助与决断对象',
  resolveBlocker: '解除卡点 (恢复推进)',
  updateBlocker: '更新卡点信息',
  escalateBlockerBtn: '提交并向全组求助',
  blockerCategory: '卡点类别',

  // Reverse DDL Modal
  reverseDDLTitle: '投稿倒推排期生成器',
  reverseDDLDesc: '输入目标会议截稿期，系统将根据顶会发表规范自动倒推生成 4 项协同里程碑任务。',
  paperTitle: '论文 / 课题完整标题',
  targetVenue: '目标会议或期刊',
  submissionDDL: '投稿截稿日期 (T 日)',
  leadAuthor: '第一作者 / 负责人',
  badgeTag: '简短标签',
  generatePipelineBtn: '生成全流程排期并加入看板',
  milestoneSchedule: '自动推导的里程碑时间表',

  // Group Meeting Standup
  standupTitle: '无 PPT 组会投屏仪表盘',
  standupDesc: '用于每周组会无纸化高效汇报、同行卡点疏通与导师即时决断。',
  timerLabel: '汇报计时器',
  exportMinutes: '导出组会纪要',
  downloadMinutes: '下载纪要文档',
  colCompleted: '1. 近期进展与录用',
  colCompletedSub: '已归档发表的论文与已结项里程碑',
  colActive: '2. 当前实验与撰写推进',
  colActiveSub: '正在进行的模型训练、实证估计与初稿',
  colBlockers: '3. 核心卡点与导师决断',
  colBlockersSub: '亟需组会讨论或导师拍板的技术死锁',
  noBlockers: '当前全组无活跃卡点，研发进展平稳顺利！',

  // Gantt Chart View
  ganttTitle: '学术项目进度甘特图',
  ganttDesc: '按时间轴直观展现各个论文课题的推进周期、实验跨度与截止日期倒计时。',
  timeScale: '时间轴粒度',
  weekly: '按周排期',
  monthly: '按月排期',
  progress: '完成进度',
  editDates: '自主调整工期',
  startDate: '起始日期',
  endDate: '截止日期',
  saveTimeline: '保存排期调整',

  // Stage Customization Settings
  settingsTitle: '自定义学术研发阶段',
  settingsDesc: '根据本学科（经管实证、生化实验、理论计算机等）特点自由增删与重命名阶段。',
  stageName: '阶段名称',
  stageSubtitle: '阶段描述与指引',
  addNewStage: '新增自定义阶段',
  deleteStageConfirm: '确认删除该阶段吗？该阶段下的任务将自动移至第一阶段。',
  defaultStagesRestored: '已恢复系统默认阶段设置',
  restoreDefaults: '恢复默认阶段',

  // Card & Drawer details
  inspector: '任务属性检查器',
  priority: '优先级',
  academicStage: '所属学术阶段',
  methodologyDesc: '研究方案与任务详述',
  checklist: '执行清单与验收项',
  addSubtask: '添加子任务清单...',
  assets: '科研资源快捷直达',
  resolveAction: '解除',
  editAction: '编辑',
  cancel: '取消',
  save: '保存修改',
  delete: '删除任务',
  confirmDelete: '确定要彻底删除该学术任务吗？',
};
