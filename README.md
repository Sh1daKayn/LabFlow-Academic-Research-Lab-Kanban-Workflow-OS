# LabFlow 🧪

> **Paper-Driven & Blocker-Aware Workflow OS for Academic Research Labs**  
> **面向学术科研团队与高校实验室的“论文导向与科研卡点驱动”工作流操作系统**

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Desktop%20Installable-emerald?style=flat-square)](https://web.dev/progressive-web-apps/)
[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg?style=flat-square)](LICENSE)

---

## 🌟 English Introduction / 英文概览

Academic research is fundamentally governed by publication deadlines (DDLs), Overleaf LaTeX drafts, complex empirical pipelines, shared GPU cluster contention, weekly deliverable verification, and sudden mathematical/algorithmic bottlenecks. Generic project tools like **Jira** (built for software agile sprints) or **Notion** (unstructured blank canvases) fail to capture the reality of academic labs.

**LabFlow** is purpose-built from the ground up for Principal Investigators (PIs), Student System Admins, Postdocs, PhD candidates, and Research Assistants (RAs). It unifies **5 core views** under a crisp, distraction-free **two-tier top navigation**:

1. **Paper-Driven Academic Kanban & Stage Drag Matrix**: 6-stage customizable lifecycle (`IDEATION` → `DATA_EXP` → `DRAFTING` → `PI_REVIEW` → `REVISION` → `ACCEPTED`) supporting full drag-and-drop, bidirectional stage forward/rollback arrows (`←` / `→`), and a **Project & Task Stage Drag Matrix**.
2. **Academic Gantt Chart**: Multi-project timeline breakdown, weekly/monthly zooming, progress sliders, and countdown visualization synced with Kanban.
3. **Lab Architecture Tree & Research Word Cloud**: Project categorization with automatic member headcounts, interactive Lab → Category → Project → Task hierarchy tree, and auto-generated keyword cloud.
4. **Weekly To-Dos & Peer Acceptance Verification**: Per-member weekly deliverable tracking bidirectionally linked to task checklists & acceptance criteria, with flexible **Advisor-only** or **Open Peer Verification** mode.
5. **No-PPT Group Meeting Standup**: High-contrast 3-column presenter dashboard (with automatic Light/Dark theme adaptation and auto-collapsed header sub-bar) + instant Markdown minutes & personal weekly digest export.
6. **Custom Checklist & Acceptance Templates**: Save reusable verification rubrics & experimental pipelines and **1-click inject** them into any task or member's weekly list.
7. **Editable Task Logic Trees**: Auto-generate and freely edit multi-level reasoning/experiment trees per task and sync leaf nodes back to checklists.
8. **5-Tier Academic RBAC & Personal Profiles**: `PI Advisor > Student SysAdmin > Project Lead > Student RA > Auditor Guest`, plus editable member names, titles, and uploaded custom photo avatars.
9. **Bilingual Typography & Curated Palettes**: **12 English + 12 Chinese font presets** (from Times New Roman, Georgia, Garamond to YouYuan 幼圆, Songti 宋体, LXGW WenKai 霞鹜文楷, plus custom CSS fonts), adaptive Dark/Light themes, and a built-in **Feature Guide (`功能一览`)**.

---

## 🇨🇳 中文简介 / Chinese Overview

学术科研管理的核心是**论文发表周期、投稿 Deadline 倒推、LaTeX/Overleaf 协作、复杂实验消融、GPU 算力协调、每周待办项验收以及突发的数学/算法卡点**。通用工具无法适配学术团队的真实场景：
- **Jira / Linear**：专为软件敏捷冲刺（Sprint）设计，充斥学术场景用不到的故事点（Story Points）与燃尽图；
- **Notion / Trello**：缺乏学术阶段流转约束、反向倒排期、周验收联动与大屏组会投屏支持，易沦为散乱笔记堆。

**LabFlow** 是专为高校与科研院所课题组打造的现代化学术工作流操作系统。通过 **五大核心视图（看板｜甘特｜架构与云图｜周待办与验收｜组会）**、**双层轻量顶栏**、**五级科研权限与学生系统管理员**、**项目分类树与自动词云**、**任务树状逻辑图**、**执行清单与验收项自定义模板库**、**AI 冷启动导入**、**12+12 中英混排字体体系**及**内置「功能一览」上手引导**，全面赋能顶尖课题组的日常科研协作与高效产出。

---

## ⚖️ Why LabFlow vs. Jira & Notion? (核心维度对比)

| 核心维度 / Feature Dimension | Jira / Linear | Notion / Trello | **LabFlow (Academic OS)** |
| :--- | :--- | :--- | :--- |
| **工作流哲学 (Paradigm)** | 软件工程敏捷冲刺 (Sprint / Backlog) | 自由文档笔记 / 通用看板 | **论文与课题全生命周期导向 + 双层清爽顶栏** |
| **阶段流转与回退 (Stages)** | Todo / In Progress / Done | 自定义列 (无学术语义) | **6 阶段双向推进/回退 +「阶段拖拽单元格」项目/任务矩阵** |
| **课题全景与词云 (Analytics)** | 需第三方插件或 BI 看板 | 需手动整理关系表 | **自动生成课题大类统计、实验室架构树状图与研究高频词云** |
| **周待办与项验收 (Weekly QA)** | Subtask 状态流无学术验收语义 | 勾选框无互验与权限控制 | **成员周待办双向绑定任务清单，支持导师验收与全员非锁互验切换** |
| **模板一键注入 (Templates)** | 仅限 Issue 描述文本模板 | 页面模板较重 | **自定义清单+验收标准+优先级模板库，支持一键注入任务或某周待办** |
| **投稿倒排机制 (Reverse DDL)** | ❌ 无 (需手动计算) | ❌ 静态日历 | **⚡ 自动倒推生成 T-45/T-30/T-14/T-3 关键学术节点并注入看板** |
| **冷启动导入 (Cold-Start)** | 繁琐 CSV 字段映射 | 手动逐条录入 | **✨ 专属 AI 提示词 + 自动化容错解析，文档秒变全组看板** |
| **科研权限制 (Academic RBAC)** | 企业级复杂权限树 | 全员可乱改或全员只读 | **👑 导师 > 🛡️ 学生系统管理员 > 🔬 骨干 > 🧑‍💻 组员 > 👁️ 访客** |
| **组会汇报 (Group Standup)** | ❌ 无法直观投屏 | 需耗时制作汇报 PPT | **🖥️ 无 PPT 投屏模式（黑/白模式自适应）：3 栏看板 + 一键周报纪要** |
| **学术排版审美 (Typography)** | 固定现代 UI 无衬线体 | 仅有少数内置字体 | **12 种中文（含幼圆/宋体/楷体/霞鹜文楷）+ 12 种英文字体自由混排** |

---

## 🚀 核心功能详解 (Core Features Breakdown)

### 1. 📌 论文全生命周期看板与「阶段拖拽单元格」
提供贴合高校科研规律的 6 阶段学术研发流水线（且阶段名称/颜色/数量支持自定义）：
1. `IDEATION` (灵感与文献)：假说构思、文献调研、创新点论证与实验方案设计；
2. `DATA_EXP` (数据与实验)：数据清洗、模型训练、仿真调优与 SOTA 基线评测；
3. `DRAFTING` (初稿撰写)：Overleaf LaTeX 协作、矢量图表绘制、附录整理；
4. `PI_REVIEW` (导师审阅)：论文结构把关、定理严谨性核验、导师批注与修改；
5. `REVISION` (投稿与返修)：审稿人意见回复 (Rebuttal)、补充检验、差异对比排版；
6. `ACCEPTED` (录用归档)：论文录用发表、代码开源归档、全屏庆祝彩带（Confetti）！

- **双向阶段推进与回退**：看板卡片既支持跨列拖拽，也可在卡片底部使用「← / →」直接前推或回退阶段（从已录用回退时自动清除完结标记）；
- **阶段拖拽单元格 (`StageDragMatrix`)**：看板右上角可一键切换至「矩阵单元格」视角，将**项目（Project）与任务（Task）**同时按所属阶段平铺展示，支持跨阶段单元格直接拖拽改变位置。
- **双层轻量顶栏**：第一行专注品牌、`5 大核心视图 Tab` 与系统身份（不再挤压左上角视图空间）；第二行聚合搜索、成员筛选、`仅看卡点` 与 `模板库`、`投稿倒排期`、`AI 导入`（支持一键收起，并在组会投屏视图下默认自动折叠）。

---

### 2. 🌳 课题大类、实验室架构树状图与研究词云 (`Architecture & Cloud`)
- **课题大类归类与人力统计**：项目支持设定所属研究大类（如 `大模型与多模态`、`具身智能` 等），自动统计每个大类下的项目数、关联任务数与参与成员数；
- **实验室全览架构树状图**：以交互式树状结构层级展开 `实验室 -> 研究大类 -> 具体课题 -> 任务与负责成员`，并支持直接在项目节点调整阶段进展；
- **自动研究词云 (`Word Cloud`)**：实时从全部课题名称、投稿会议/期刊、摘要与任务标题中提取核心关键词并按权重排版渲染，点击关键词即可反查相关项目与任务。

---

### 3. ✅ 周待办、任务清单联动与「项验收」闭环 (`Weekly Todos & Acceptance`)
- **每位成员的本周推进清单**：顶部切换成员头像即可查看个人本周 To-Do List，并可按「全部 / 推进中 / 待验收 / 已验收 / 需修改」快速过滤；
- **与看板执行清单双向同步**：可将任务中的某一条 Checklist 直接推入对应成员的本周待办；在周待办勾选完成提交或修改状态时，自动双向同步回原任务清单进度与完成率；
- **灵活可控的「项验收」机制**：
  - 导师解锁后可在页面顶部切换开关：**开启「自由互验（非锁模式）」**时，全实验室成员（含同级学生）可互相进行验收通过（`ACCEPTED`）或打回修改（`REVISION_REQUESTED`）并附验收评语；关闭时则严格限定由导师/系统管理员/项目骨干验收。

---

### 4. 📑 执行清单与验收项自定义模板库 + 🌿 任务树状逻辑图
- **自定义模板保存与一键注入 (`Checklist Templates`)**：
  - 内置 3 套科研起始模板（顶会投稿与双盲核查、模型实验与消融验证周模板、论文初稿与图表规范），支持新建、编辑、复制副本与多行文本快速粘贴拆解（支持 `条目标题 | 验收标准` 语法）；
  - 可在**任务卡片内嵌编辑器**、**任务详情抽屉**、**周待办页**或**顶部「模板库」**一键将模板注入为任务 Checklist（或同步推成带验收标准的本周待办），也可把现有任务清单或某成员的本周待办反存为新模板。
- **任务树状逻辑图 (`Task Logic Tree`)**：
  - 每张任务卡均支持一键生成并自由编辑层级化树状逻辑图（增删子节点、同级节点、拖拽或上下调整顺序、更改节点状态），并支持将叶节点一键同步入任务执行清单。

---

### 5. 👑 五级科研权限体系、学生系统管理员与自定义头像资料
完全免除配置外部邮箱验证码的繁琐门槛，通过**管理员主密码（默认: `admin888`）**兼顾即开即用与团队防误改：
- 👑 **导师 / 实验室最高管理员 (`ADMIN_PI`)**：全权掌控，解锁后可委任或撤销学生的「系统管理员」身份、配置管理员密码、查阅绝密卡片、切换全局非锁互验模式、执行全库重置/初始化；
- 🛡️ **系统管理员（学生委任, `SYS_ADMIN`)**：权限仅次于导师、高于所有普通学生与骨干！可协助导师分担人员纳新、日常权限调配、算力设施统筹、阶段与目标会议管理及非破坏性文档导入，方便与同学高效沟通；
- 🔬 **课题负责人 / 骨干 (`PROJECT_LEAD`)**：管理自己负责/参与课题下的任务流转与成果归档；
- 🧑‍💻 **组内成员 / 研究生 (`STUDENT_RA`)**：**仅管自己**。可维护个人负责或参与的任务、提交个人本周待办验收（非锁模式下也可帮同学互验），跨成员任务只读防误触；
- 👁️ **只读访客 (`AUDITOR_GUEST`)**：全局只读模式，适用于学术汇报、外部评审或新生旁听。
- 🖼️ **随时改名与上传自定义照片头像**：所有成员均可随时在右上角个人资料弹窗修改中英文姓名、研究头衔、邮箱，并上传本地图片（客户端自动裁剪压缩为适配 PNG/JPEG）作为全系统个人头像。

---

### 6. ✨ AI 智能文档导入、投稿倒排期与卡点求助
- **AI 冷启动导入 (`AI Importer`)**：内置中英双语提示词与容错 JSON 解析器，将现有立项书、周报或人员名单发给任意大模型后粘贴即可**覆盖初始化**或**增量追加合并**全组数据；
- **投稿反向排期生成器 (`Reverse DDL`)**：输入截稿日（$T$ 日），自动按 $T-45$、$T-30$、$T-14$、$T-3$（均支持自定义天数与步骤）生成全流程里程碑并注入看板；
- **科研卡点上报 (`Blocker Escalation`)**：细分 `数学推导卡点`、`算法模型收敛异常`、`算力与显存短缺`、`数据缺失`、`等待审阅`、`经验复现差异`，明确标注尝试过的解法与求助决断人；解决后一键解除。

---

### 7. 📊 学术甘特图、无 PPT 组会投屏与 🧭 内置「功能一览」
- **学术甘特图 (`Gantt View`)**：支持按周/按月粒度缩放、按课题或阶段分组，以及进度滑块与起止日期就地调整；
- **无 PPT 组会投屏模式 (`Group Standup`)**：完整适配**浅色（白天会议室）/ 深色（暗调演示）**模式，自动展示「近期录用与进展 / 当前实验与撰写 / 核心卡点与导师决断」三栏看板，支持汇报计时器与一键导出 Markdown 周报及会议纪要；
- **内置「功能一览」上手引导 (`Feature Guide`)**：顶部导航右上角可随时打开，支持按**学生 / 系统管理员 / 导师**切换快速上手路径、关键词检索与点击一键跳转对应视图或工具窗口。

---

### 8. 🎨 12+12 中英混排学术字体、色卡拾色器与灰阶资源外链
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
启动完成后，在浏览器访问 **`http://localhost:3000`** 即可开始使用。

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

项目内置了 3 种免重装、保留全部用户数据（`.data/`、`.env` 与 Postgres 卷）的平滑升级方案：

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
