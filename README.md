# LabFlow · 科研管理系统 🧪

> **Research Management System for Academic Labs & Industry-University Projects**  
> **面向高校实验室与科研团队的「科研管理系统」——覆盖学术论文、纵向科研项目与横向企业项目全周期协同**

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Desktop%20Installable-emerald?style=flat-square)](https://web.dev/progressive-web-apps/)
[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg?style=flat-square)](LICENSE)

---

## 🌟 English Introduction / 英文概览

Academic research is fundamentally governed by publication deadlines (DDLs), Overleaf LaTeX drafts, complex empirical pipelines, shared GPU cluster contention, weekly deliverable verification, and sudden mathematical/algorithmic bottlenecks. Generic project tools like **Jira** (built for software agile sprints) or **Notion** (unstructured blank canvases) fail to capture the reality of academic labs.

**LabFlow** (`科研管理系统`) is purpose-built from the ground up for Principal Investigators (PIs), Student System Admins, Postdocs, PhD candidates, and Research Assistants (RAs). To reduce cognitive overload, it starts in **PIN-protected personal isolation mode** (`Mine`) and unifies **6 customizable views** under a clean **two-tier top navigation**:

1. **PIN-Gated Account Creation, Initial View Customization & Personal Isolation**: Students register a personal account protected by a 4+ character PIN (plain-username account selection), customize which views stay pinned in the top bar (defaulting to **Tasks · Weekly To-Do · 1-on-1 Requests**, with extra views tucked under **More**), and work in **"My Workspace" (`仅看我的`)** by default with a 1-click toggle to **"Lab Public" (`组内公开`)**.
2. **Three Work Categories (`PAPER` / `VERTICAL_PROJECT` / `HORIZONTAL_PROJECT`)**: Clearly separates **Academic Papers**, **Vertical Government/Grant Projects**, and **Horizontal Enterprise Projects** (supporting partner/sponsor info and strict delivery milestone nodes) across filtering, grouped board display, and reverse deadline scheduling.
3. **1-on-1 Direct Requests & Privacy Control**: Every request, review approval, or blocker help escalation targets **strictly one chosen recipient**—never broadcast noise—with per-request **Private (default, sender & recipient only)** or **Public (Lab Feed)** visibility and inline reply threads.
4. **Academic Kanban, Grouped Category Board & Stage Drag Matrix**: 6-stage customizable lifecycle (`IDEATION` → `DATA_EXP` → `DRAFTING` → `PI_REVIEW` → `REVISION` → `ACCEPTED`) supporting full drag-and-drop, bidirectional stage forward/rollback arrows (`←` / `→`), **Columns / By Category / Stage Cells Matrix** switching, and project timeline breakdown (**Gantt View**).
5. **Project Categorization Tree & Research Word Cloud**: Grouped by the 3 work categories (`Paper / Vertical / Enterprise`) with member headcounts, interactive Lab → Category → Project → Task hierarchy tree, and auto-generated keyword cloud.
6. **Weekly To-Dos & Peer Acceptance Verification**: Per-member weekly deliverable tracking bidirectionally linked to task checklists & acceptance criteria, with flexible **Advisor-only** or **Open Peer Verification** mode.
7. **No-PPT Group Meeting Standup**: High-contrast 3-column presenter dashboard (with automatic Light/Dark theme adaptation and auto-collapsed header sub-bar) + instant Markdown minutes & personal weekly digest export.
8. **Custom Checklist Templates, Editable Task Logic Trees & 5-Tier RBAC**: Save reusable verification rubrics, edit per-task logic trees synced to checklists, manage 5 academic RBAC tiers (`PI Advisor > Student SysAdmin > Project Lead > Student RA > Auditor Guest`) with photo avatars, and customize **12 EN + 12 ZH** font presets plus built-in **Feature Guide (`功能一览`)**.

---

## 🇨🇳 中文简介 / Chinese Overview

学术科研管理既要兼顾**学术论文发表周期与投稿 Deadline 倒排**，也常常涵盖**纵向科研攻关课题**以及时间节点严格的**横向企业研发项目**，同时还需要把控日常待办验收、卡点求助与组会汇报。通用工具无法适配科研团队的真实工作流：
- **Jira / Linear**：专为软件敏捷冲刺（Sprint）设计，充斥科研场景用不到的故事点与燃尽图，且对学生日常使用门槛偏高；
- **Notion / Trello**：全员视图容易一上来信息过载，缺乏三类科研成果区分、点对点隐私交流、投稿倒排期与周验收联动。

**LabFlow 科研管理系统**（品牌 Logo 下方统一展示「**科研管理系统**」 / *Research Management System*）专为高校科研团队打造：
- **先注册、后隔离、低负担**：每位同学创建带 **个人密码 / PIN** 的账户并自定义保留的初始导航视图（默认仅保留 **任务看板｜本周待办｜1对1沟通**，其余收纳于 **更多视图**）；登录后默认进入 **「仅看我的」** 个人聚焦视角，需要全组协同参考时再一键切至 **「组内公开」**。
- **三大类别清晰归类**：明确区分 **学术论文 (`PAPER`)**、**纵向科研项目 (`VERTICAL_PROJECT`)** 与 **横向企业项目 (`HORIZONTAL_PROJECT`，支持合作单位与明确节点日期)**，看板支持按类别一键筛选及 **「看板列 / 三类归类 / 阶段单元格」** 切换。
- **严格 1 对 1 申请与交流**：进度对接、导师审阅、卡点求助、算力申请均只向**选定的单人**发出；每条请求可单独设为 **「隐私（默认，仅我与对方可见）」** 或 **「公开（组内可见）」**。
- **六大视图与全套科研工具链**：整合 **任务看板｜本周待办｜1对1沟通｜时间轴甘特｜项目分类总览与词云｜组会汇报**，以及双层轻量顶栏、五级科研权限、执行清单模板库、任务树状逻辑图、AI 冷启动导入、12+12 中英混排字体体系与内置「功能一览」。

---

## ⚖️ Why LabFlow vs. Jira & Notion? (核心维度对比)

| 核心维度 / Feature Dimension | Jira / Linear | Notion / Trello | **LabFlow · 科研管理系统** |
| :--- | :--- | :--- | :--- |
| **工作流与减负设计 (Focus)** | 软件冲刺看板，入口与字段复杂 | 自由画布，全员信息混杂 | **个人 PIN 登录 + 自定义初始视图 + 默认「仅看我的」隔离** |
| **科研成果归类 (Categories)** | 无学术/纵横向课题区分 | 需手动建库与维护标签 | **论文 / 纵向科研项目 / 横向企业项目（含甲方与节点要求）原生归类** |
| **点对点协作 (1-on-1 Requests)** | 公开评论区易产生噪音 | 缺少定向审批与隐私开关 | **严格单人接收 1 对 1 申请，支持「隐私 / 公开」单条可控** |
| **阶段流转与回退 (Stages)** | Todo / In Progress / Done | 自定义列 (无学术语义) | **6 阶段双向推进/回退 +「看板列 / 三类归类 / 阶段单元格」切换** |
| **课题全景与词云 (Analytics)** | 需第三方插件或 BI 看板 | 需手动整理关系表 | **三类项目汇总、实验室架构树状图与研究高频词云** |
| **周待办与项验收 (Weekly QA)** | Subtask 状态流无学术验收语义 | 勾选框无互验与权限控制 | **成员周待办双向绑定任务清单，支持导师验收与全员非锁互验切换** |
| **模板一键注入 (Templates)** | 仅限 Issue 描述文本模板 | 页面模板较重 | **自定义清单+验收标准+优先级模板库，支持一键注入任务或某周待办** |
| **投稿倒排机制 (Reverse DDL)** | ❌ 无 (需手动计算) | ❌ 静态日历 | **⚡ 自动倒推生成 T-45/T-30/T-14/T-3 关键节点（论文/纵横向通用）** |
| **冷启动导入 (Cold-Start)** | 繁琐 CSV 字段映射 | 手动逐条录入 | **✨ 专属 AI 提示词 + 自动化容错解析，文档秒变全组看板** |
| **科研权限制 (Academic RBAC)** | 企业级复杂权限树 | 全员可乱改或全员只读 | **👑 导师 > 🛡️ 学生系统管理员 > 🔬 骨干 > 🧑‍💻 组员 > 👁️ 访客** |
| **组会汇报 (Group Standup)** | ❌ 无法直观投屏 | 需耗时制作汇报 PPT | **🖥️ 无 PPT 投屏模式（黑/白模式自适应）：3 栏看板 + 一键周报纪要** |
| **学术排版审美 (Typography)** | 固定现代 UI 无衬线体 | 仅有少数内置字体 | **12 种中文（含幼圆/宋体/楷体/霞鹜文楷）+ 12 种英文字体自由混排** |

---

## 🚀 核心功能详解 (Core Features Breakdown)

### 1. 🔐 个人 PIN 账户、自定义初始视图与「仅看我的」隔离
- **学生自助创建账户 + 个人 PIN 保护 (`AccountGate`)**：首次进入系统即可创建个人账户并设置 **至少 4 位的个人密码 / PIN**；切换或登录「已有账户」时，「选择你的账户」下拉列表**仅展示纯净用户名**（预置账户首次认领也会引导绑定 PIN，PI 账号仍通过管理员主密码验证）。
- **自定义保留的初始视图 (`ViewCustomizerModal`)**：注册时或登录后随时可选择自己常驻顶栏的视图及默认落地页——学生默认聚焦 **「任务看板｜本周待办｜1对1沟通」** 3 项，其余视图统一收拢在 **「更多视图」** 菜单中，保持界面清爽。
- **「仅看我的」↔「组内公开」范围切换**：登录后默认进入 **「仅看我的」 (`MINE`)**，只展示本人负责/参与的任务与项目及自己的 1 对 1 沟通；点击顶栏 **「组内公开」 (`PUBLIC_LAB`)** 可按需查看组内公开动态与成员任务。

---

### 2. 📌 三大成果归类（论文 / 纵向 / 横向企业）与多模式看板
- **三大独立业务分类 (`WorkCategory`)**：
  - **学术论文 (`PAPER`)**：聚焦投稿目标会议/期刊与发表周期；
  - **纵向科研项目 (`VERTICAL_PROJECT`)**：服务国家/省部级基金与长期科研攻关；
  - **横向企业项目 (`HORIZONTAL_PROJECT`)**：面向企业合作研发，支持填写**合作单位 / 课题来源 (`partnerOrg`)** 与**关键时间节点要求 (`milestoneNode`)**（具备明确交付日期约束）。
- **贴合科研与项目推进的 6 阶段流水线**（阶段名称/颜色/数量支持自定义）：
  1. `IDEATION` (灵感与文献)：假说构思、文献调研、需求对齐与方案设计；
  2. `DATA_EXP` (数据与实验)：数据清洗、模型训练、原型联调与基准评测；
  3. `DRAFTING` (初稿撰写)：LaTeX 撰写、图表绘制或企业验收文档整理；
  4. `PI_REVIEW` (导师审阅)：导师把关、内部评测与修改；
  5. `REVISION` (投稿与返修)：审稿回复 (Rebuttal)、补充验证或现场整改；
  6. `ACCEPTED` (录用归档)：论文录用、代码开源或项目结题验收。
- **看板三种视图布局 + 类别过滤**：看板顶部支持按「全部分类 / 学术论文 / 纵向科研项目 / 横向企业项目」过滤，并支持一键切换 **「看板列 (`Columns`) / 三类归类 (`By Category`) / 阶段单元格 (`Stage Cells`)」**（矩阵视图支持项目与任务跨阶段直接拖拽与双向 `← / →` 推进回退）。
- **双层轻量顶栏**：第一行专注品牌（Logo 下方显示「科研管理系统」）、自定义视图与身份胶囊；第二行聚合搜索、筛选、`仅看卡点` 与 `模板库`、`投稿倒排期`、`AI 导入`（默认收起或组会自动折叠，减少干扰）。

---

### 3. 💬 1 对 1 申请与交流（点对点定向 + 隐私可控）
- **严格单人接收 (`DirectRequestModal`)**：支持向指定某一位成员发起 **进度汇报/对接**、**审阅/审批申请**、**技术卡点求助**、**算力/资源申请** 或 **一对一交流**，选人列表仅展示纯净用户名，避免群发打扰。
- **单条请求自主控隐私**：普通学生发起或管理自己发出的请求时，可随时切换 **「隐私（默认，仅我与对方可见）」 (`PRIVATE`)** 或 **「公开（组内可见）」 (`PUBLIC`)**；即便其他成员切到「组内公开」，隐私请求也依然严格隐藏。
- **完整处理闭环 (`RequestsView`)**：支持「发给我的 / 我发出的 / 组内公开动态」分栏、三大类别与状态筛选、卡片内直接回复与「待处理 / 已回复 / 已解决」切换，并在收发人与回复列表统一渲染头像徽章 (`MemberAvatar`)。

---

### 4. 🌳 项目分类总览、实验室架构树状图与研究词云 (`Architecture & Cloud`)
- **三类项目汇总与大类人力统计**：按 **学术论文 / 纵向科研项目 / 横向企业项目** 清晰分组，同时保留研究大类下的项目数、关联任务数与参与成员数统计；横向企业项目重点突出合作单位与关键时间节点。
- **实验室全览架构树状图**：以交互式树状结构层级展开 `实验室 -> 研究大类 -> 具体课题 -> 任务与负责成员`，并支持直接在项目节点调整阶段进展；
- **自动研究词云 (`Word Cloud`)**：实时从全部课题名称、投稿会议/期刊、摘要与任务标题中提取核心关键词并按权重排版渲染，点击关键词即可反查相关项目与任务。

---

### 5. ✅ 周待办、任务清单联动与「项验收」闭环 (`Weekly Todos & Acceptance`)
- **每位成员的本周推进清单**：顶部切换成员头像即可查看个人本周 To-Do List，并可按「全部 / 推进中 / 待验收 / 已验收 / 需修改」快速过滤；
- **与看板执行清单双向同步**：可将任务中的某一条 Checklist 直接推入对应成员的本周待办；在周待办勾选完成提交或修改状态时，自动双向同步回原任务清单进度与完成率；
- **灵活可控的「项验收」机制**：
  - 导师解锁后可在页面顶部切换开关：**开启「自由互验（非锁模式）」**时，全实验室成员（含同级学生）可互相进行验收通过（`ACCEPTED`）或打回修改（`REVISION_REQUESTED`）并附验收评语；关闭时则严格限定由导师/系统管理员/项目骨干验收。

---

### 6. 📑 执行清单与验收项自定义模板库 + 🌿 任务树状逻辑图
- **自定义模板保存与一键注入 (`Checklist Templates`)**：
  - 内置 3 套科研起始模板（顶会投稿与双盲核查、模型实验与消融验证周模板、论文初稿与图表规范），支持新建、编辑、复制副本与多行文本快速粘贴拆解（支持 `条目标题 | 验收标准` 语法）；
  - 可在**任务卡片内嵌编辑器**、**任务详情抽屉**、**周待办页**或**顶部「模板库」**一键将模板注入为任务 Checklist（或同步推成带验收标准的本周待办），也可把现有任务清单或某成员的本周待办反存为新模板。
- **任务树状逻辑图 (`Task Logic Tree`)**：
  - 每张任务卡均支持一键生成并自由编辑层级化树状逻辑图（增删子节点、同级节点、拖拽或上下调整顺序、更改节点状态），并支持将叶节点一键同步入任务执行清单。

---

### 7. 👑 五级科研权限体系、学生系统管理员与自定义头像资料
完全免除配置外部邮箱验证码的繁琐门槛，通过**管理员主密码（默认: `admin888`）**兼顾即开即用与团队防误改：
- 👑 **导师 / 实验室最高管理员 (`ADMIN_PI`)**：全权掌控，解锁后可委任或撤销学生的「系统管理员」身份、配置管理员密码、查阅绝密卡片、切换全局非锁互验模式、执行全库重置/初始化；
- 🛡️ **系统管理员（学生委任, `SYS_ADMIN`)**：权限仅次于导师、高于所有普通学生与骨干！可协助导师分担人员纳新、日常权限调配、算力设施统筹、阶段与目标会议管理及非破坏性文档导入，方便与同学高效沟通；
- 🔬 **课题负责人 / 骨干 (`PROJECT_LEAD`)**：管理自己负责/参与课题下的任务流转与成果归档；
- 🧑‍💻 **组内成员 / 研究生 (`STUDENT_RA`)**：**仅管自己**。可维护个人负责或参与的任务、提交个人本周待办验收（非锁模式下也可帮同学互验），跨成员任务只读防误触；
- 👁️ **只读访客 (`AUDITOR_GUEST`)**：全局只读模式，适用于学术汇报、外部评审或新生旁听。
- 🖼️ **随时改名与上传自定义照片头像**：所有成员均可随时在右上角个人资料弹窗修改中英文姓名、研究头衔、邮箱，并上传本地图片（客户端自动裁剪压缩为适配 PNG/JPEG）作为全系统个人头像。

---

### 8. ✨ AI 智能文档导入、投稿倒排期与 1 对 1 卡点求助
- **AI 冷启动导入 (`AI Importer`)**：内置中英双语提示词与容错 JSON 解析器，将现有立项书、周报或人员名单发给任意大模型后粘贴即可**覆盖初始化**或**增量追加合并**全组数据；
- **投稿 / 节点反向排期生成器 (`Reverse DDL`)**：输入截稿或交付日（$T$ 日），选择所属类别（论文 / 纵向 / 横向企业，支持填入合作单位与节点要求），自动按 $T-45$、$T-30$、$T-14$、$T-3$（均支持自定义天数与步骤）生成全流程里程碑并注入看板；
- **1 对 1 科研卡点求助 (`Blocker Escalation`)**：细分 `数学推导卡点`、`算法模型收敛异常`、`算力与显存短缺`、`数据缺失`、`等待审阅`、`经验复现差异`，明确标注尝试过的解法后向**指定的某一位成员**发出 1 对 1 卡点求助；解决后一键解除。

---

### 9. 📊 学术甘特图、无 PPT 组会投屏与 🧭 内置「功能一览」
- **学术甘特图 (`Gantt View`)**：支持按周/按月粒度缩放、按课题或阶段分组，以及进度滑块与起止日期就地调整；
- **无 PPT 组会投屏模式 (`Group Standup`)**：完整适配**浅色（白天会议室）/ 深色（暗调演示）**模式，自动展示「近期录用与进展 / 当前实验与撰写 / 核心卡点与导师决断」三栏看板，支持汇报计时器与一键导出 Markdown 周报及会议纪要；
- **内置「功能一览」上手引导 (`Feature Guide`)**：顶部导航右上角可随时打开，支持按**学生 / 系统管理员 / 导师**切换快速上手路径、关键词检索与点击一键跳转对应视图或工具窗口。

---

### 10. 🎨 12+12 中英混排学术字体、色卡拾色器与灰阶资源外链
- **12 种英文字体 + 12 种中文字体自由搭配（含自定义输入）**：
  - 英文涵盖 `Times New Roman`、`Georgia`、`Palatino`、`Garamond`、`Baskerville`、`Cambria`、`Geist Sans`、`Inter`、`Helvetica/Arial`、`Segoe/System Sans`、`JetBrains Mono`、`Fira Code`；
  - 中文涵盖 `苹方/微软雅黑`、`幼圆（圆润亲和）`、`宋体/思源宋体`、`华文中宋`、`楷体/华文楷体`、`霞鹜文楷`、`仿宋/华文仿宋`、`黑体/思源黑体`、`隶书`、`华文行楷`、`等线` 等；同时支持直接输入本机已安装字体名；
- **名校主题色卡 + 吸色器**：黑金 (`#C28E0E`)、牛津深蓝 (`#002147`)、斯坦福深红 (`#8C1515`)、青绿、酒红、靛紫等色卡 + HTML5 拾色器实时切换；
- **三级字号与纯净外链规范**：紧凑小号 / 标准常规 / 舒适大号自由调节；Overleaf、GitHub、Dataset、Zotero 外链统一低饱和度学术灰阶展示。

---

## 🛠️ 快速安装与本地部署指南 (Installation & Setup)

### 方案 A：从 GitHub 克隆部署（开发者 / 课题组内部服务器）

#### 1. 前置依赖
- [Node.js](https://nodejs.org/) (推荐 v18.17+ 或 v20+)
- [Git](https://git-scm.com/)

#### 2. 下载并安装依赖
```bash
# 1. 克隆代码仓库
git clone https://github.com/Sh1daKayn/LabFlow-Academic-Research-Lab-Kanban-Workflow-OS.git

# 2. 进入项目目录
cd LabFlow-Academic-Research-Lab-Kanban-Workflow-OS

# 3. 安装依赖包
npm install
```

#### 3. 启动本地开发服务
```bash
npm run dev
```
Windows 用户也可直接双击根目录的 [`Start-LabFlow.bat`](Start-LabFlow.bat)（或运行 [`Start-LabFlow.ps1`](Start-LabFlow.ps1)）一键检查依赖并启动。启动完成后，在浏览器访问 **`http://localhost:3000`** 即可开始使用。

#### 4. 服务器持久化与跨设备协作说明 (重要)
默认不配置 `.env` 时，所有更新会自动保存到**运行 Next.js 的这台主机硬盘上**（`.data/labflow-state.json`），属于「零配置本机服务端存储」——不会自动推送到 GitHub，也不能在只读的无服务器环境（如未挂数据库的 Vercel）持久化写入。

根据您的使用场景，可按以下两种方式实现跨设备 / 远程服务器保存：
- **实验室局域网共享本机数据（最轻量）**：
  ```bash
  npm run dev:lan
  ```
  同课题组成员在局域网内访问 `http://<运行主机的局域网IP>:3000`，所有人的修改都会实时同步写入该主机的 `.data/labflow-state.json`。
- **云端 / 独立 Linux 服务器 + PostgreSQL 数据库（推荐多人长期协作 & 公网部署）**：
  1. **Docker Compose 一键部署（内置 PostgreSQL 16 + 自动建表）**：
     ```bash
     docker compose up -d --build
     ```
  2. **裸机 Linux + Node.js 20 部署**：
     - 复制 `.env.example` 为 `.env`，填入 PostgreSQL 的 `DATABASE_URL`（如自建 Postgres、Neon 或 Supabase）；
     - 安装依赖、同步表结构、构建并以全网卡监听模式启动：
       ```bash
       npm ci
       npx prisma db push
       npm run build
       npm run start:lan
       ```
     - 若暂不装 PostgreSQL，直接执行 `npm run build && npm run start:lan` 也会自动持久保存在服务器磁盘 `.data/labflow-state.json` 中。
     - 启动后，顶部状态胶囊悬停可查看详情（PostgreSQL 同步或本机服务端 `.data/labflow-state.json` 保存）。

#### 5. 后续一键升级与自动化运维 (One-Click Upgrade)

> [!TIP]
> **升级代码无需删除旧目录或重新 `git clone`！**  
> `.gitignore` 已忽略 `.data/`、`.env`、`.deploy.local` 与 `postgres_data/`。只有首次部署需要 `git clone`；后续在原目录直接更新即可，**删掉整个目录反而会删掉本机 `.data/labflow-state.json` 里的数据**（也可随时在页面「系统整体设置」→「数据与备份」导出 JSON 快照留底）。

项目内置了多种免重装、保留全部用户数据（`.data/`、`.env` 与 Postgres 卷）的平滑升级方案：

- **方案 0：Windows 本机原地更新**
  直接在原有 `LabFlow*` 目录执行 `git pull origin main`（如依赖有变化再跑 `npm install`），重启 `npm run dev` 即可，原有数据自动保留。
- **方案 1：Linux 服务器一键更新脚本（免 `sudo`）**
  首次部署后，每次有新版本发布时，只需在服务器项目目录执行：
  ```bash
  chmod +x update.sh
  ./update.sh           # 默认拉取最新代码、自动停旧服务、构建并用后台守护模式重启
  # 可选参数：./update.sh --mirror（使用国内 npm 镜像）、--port 3001、--bundle ~/包路径
  ```
- **方案 2：Docker + GHCR 自动镜像 + Watchtower 自动升级**
  仓库配置了 GitHub Actions 流水线（`.github/workflows/docker.yml`），推送到 `main` 后会自动构建并发布 Docker 镜像到 `ghcr.io`。其他服务器可直接用预构建模板启动，并由 Watchtower 每小时自动检查更新：
  ```bash
  docker compose -f docker-compose.ghcr.yml up -d
  ```
- **方案 3：本地 Windows 一键推包到国内云服务器（绕开服务器连 GitHub 超时）**
  本地执行 `deploy-ubuntu.ps1`（或在本地仓库新建受忽略的 `.deploy.local` 文件写入 `用户名@服务器IP` 后直接执行 `.\deploy-ubuntu.ps1`）：
  ```powershell
  .\deploy-ubuntu.ps1 -Target "user@your-server-ip"
  ```
  脚本会自动在本地打包轻量 `git bundle` 并通过 `scp` 传至服务器调用 `update.sh` 完成构建重启。

#### 6. 生产环境构建与测试
```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
npm run start
```

---

### 方案 B：作为桌面本地独立应用免安装运行 (PWA Desktop App)
LabFlow 深度集成了 Progressive Web App (PWA) 协议：
1. 按照上述步骤在本地启动服务后，使用 **Google Chrome** 或 **Microsoft Edge** 访问 `http://localhost:3000`；
2. 浏览器地址栏右侧会出现 **「安装应用」 (Install LabFlow)** 图标；
3. 点击安装后，系统会自动在您的 Windows / macOS 桌面生成 **LabFlow 学术操作系统独立应用图标**，拥有原生应用级窗口体验，无需记端口号，双击即用！

---

## 📋 附录：AI 冷启动导入标准提示词 (Prompt Template)

如果需要从已有的实验室文档一次性生成全套课题组看板，将以下提示词与您的文档一起发给任意 AI：

```markdown
你是一位顶尖的高校与科研实验室管理架构师。
请仔细阅读我提供的【课题组文档 / 周报 / 项目立项书 / 人员名单 / 论文规划 / 会议纪要】。
请将提取出的课题组成员、科研课题、学术推进任务以及计算设施，整理成符合 LabFlow 学术操作系统规范的 JSON 数据格式。

【输出规范】：
1. 只能输出一个包含合法 JSON 的 markdown 代码块（以 ```json 开头，以 ``` 结尾），不要输出任何多余的寒暄或解释。
2. 即使我提供的文档信息不完整，也请根据常识合理推断并补全（如根据人名生成英文名、根据任务推进状态推测其所属学术阶段与截止日期）。
3. JSON 格式字段必须严格遵循以下结构：

```json
{
  "members": [
    {
      "nameZh": "中文名（如：王伟）",
      "nameEn": "英文或拼音（如：Wei Wang）",
      "role": "PI | POSTDOC | SENIOR_PHD | PHD_CANDIDATE | RA | VISITING_SCHOLAR",
      "accessRole": "ADMIN_PI | SYS_ADMIN | PROJECT_LEAD | STUDENT_RA | AUDITOR_GUEST",
      "titleZh": "身份或研究方向（如：副教授 / 具身智能方向）",
      "email": "工作邮箱（如无写空字符串）"
    }
  ],
  "projects": [
    {
      "title": "项目或论文完整标题",
      "targetVenue": "目标会议或期刊（如：CVPR 2027, Nature Machine Intelligence, 青年基金）",
      "tag": "简写代号标签（如：CVPR'27, NMI, NSFC）",
      "abstract": "核心创新点或目标简述",
      "leadAuthorName": "第一作者或负责人的中文姓名"
    }
  ],
  "tasks": [
    {
      "title": "具体任务或里程碑名称（如：SOTA模型基准评测跑通）",
      "description": "任务实施方案与交付要求",
      "stage": "IDEATION | DATA_EXP | DRAFTING | PI_REVIEW | REVISION | ACCEPTED",
      "projectName": "所属项目的完整标题",
      "leadAuthorName": "负责人姓名",
      "priority": "LOW | MEDIUM | HIGH | URGENT",
      "visibility": "PUBLIC | TEAM_ONLY | PI_ONLY",
      "deadline": "YYYY-MM-DD",
      "progress": 60
    }
  ],
  "resources": [
    {
      "nameZh": "算力节点或设施名称（如：DGX H100 8卡计算节点）",
      "nameEn": "DGX H100 Node 01",
      "type": "GPU | SERVER | CLUSTER | EQUIPMENT",
      "specs": "8x NVIDIA H100 80GB SXM5, 512GB RAM"
    }
  ]
}
```

【学术阶段(stage)候选值】：
- IDEATION: 灵感与文献调研、假说构思、可行性论证
- DATA_EXP: 数据清洗、模型训练、仿真调优、核心实验评测
- DRAFTING: 论文初稿撰写、图表绘制、附录整理
- PI_REVIEW: 提交导师修改、组内深入审阅把关
- REVISION: 审稿意见回复(Rebuttal)、修改返修
- ACCEPTED: 论文已录用发表、代码开源、结项归档
```

---

## 🏛️ 技术栈 (Technology Stack)

- **核心框架**: [Next.js 14](https://nextjs.org/) (React 18, App Router)
- **开发语言**: [TypeScript 5](https://www.typescriptlang.org/) (全静态严格类型定义)
- **样式系统**: [Tailwind CSS 3.4](https://tailwindcss.com/) (明暗双色自适应 + 实时 CSS 变量注入)
- **交互拖拽**: [@hello-pangea/dnd](https://github.com/hello-pangea/dnd) + 阶段单元格原生拖拽矩阵
- **自动化测试**: [Vitest](https://vitest.dev/) (涵盖权限模型、任务操作、排期工具、模板引擎、主题字体与 API 路由测试)
- **学术图标**: [Lucide React](https://lucide.dev/)
- **数据持久化**: 双模服务端持久化引擎 — 零配置本机服务端文件存储（`.data/labflow-state.json` + 原子写盘锁 + 乐观并发修订号）与 PostgreSQL + Prisma ORM 云端/多用户数据库无缝切换，搭配浏览器离线缓存与 JSON 灾备导入导出
- **字体体系**: 12 种英文字体 + 12 种中文字体自由混排（含幼圆、宋体、楷体、霞鹜文楷、Times New Roman、Georgia 等）及自定义字体输入

---

## 📄 开源许可证 (License)

本项目采用 [MIT License](LICENSE) 开源许可证。欢迎全球高校科研人员、导师、博士生与实验室管理员免费使用、二次开发与定制推广！
