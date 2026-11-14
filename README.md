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

Academic research is fundamentally governed by publication deadlines (DDLs), Overleaf LaTeX drafts, complex empirical pipelines, shared GPU cluster contention, and sudden mathematical/algorithmic bottlenecks. Generic project tools like **Jira** (built for software agile sprints) or **Notion** (unstructured blank canvases) fail to capture the reality of academic labs.

**LabFlow** is purpose-built from the ground up for Principal Investigators (PIs), Postdocs, PhD candidates, and Research Assistants (RAs). It unifies:
1. **Paper-Driven Academic Kanban**: 6-stage lifecycle (`IDEATION` → `DATA_EXP` → `DRAFTING` → `PI_REVIEW` → `REVISION` → `ACCEPTED`).
2. **Reverse DDL Scheduler**: Auto-deriving $T-45$, $T-30$, $T-14$, and $T-3$ milestones backwards from submission deadlines.
3. **AI Smart Document Importer**: Feed messy lab notes/proposals to any AI with our prompt to auto-populate members, projects, and milestones with 1 click.
4. **4-Tier Academic RBAC**: PI Advisor, Project Lead, Student RA, and Auditor Guest roles guarded by an Admin Master Password.
5. **Academic Gantt Chart**: Multi-project timeline breakdown and countdown visualization.
6. **No-PPT Group Meeting Mode**: 3-column presenter dashboard with instant Markdown minutes export.
7. **Academic Theme Palettes & Times New Roman Typography**: Curated Black Gold, Deep Blue, Deep Red, Teal Green, Crimson, Indigo, plus interactive color palette swatches.

---

## 🇨🇳 中文简介 / Chinese Overview

学术科研管理的核心是**论文发表周期、投稿 Deadline 倒推、LaTeX/Overleaf 实时写作、复杂实验跑批、GPU 算力抢占以及突发的数学证明与收敛性卡点**。通用的项目管理工具（如 Jira、Trello、Notion）无法适配学术团队的真实场景：
- **Jira / Linear**：专为软件工程敏捷冲刺（Sprint）设计，充斥着学术场景完全用不到的故事点（Story Points）与燃尽图；
- **Notion**：自由度过高缺乏学术流程约束，易沦为散乱的笔记垃圾堆，无法自动倒排论文截稿期或在组会中高效投屏。

**LabFlow** 是专为高校与科研院所课题组打造的现代化学术操作系统（Academic Research Lab OS）。通过 6 阶段学术看板、投稿倒推排期生成器（Reverse DDL Planner）、AI 智能冷启动导入、四级科研权限隔离、数学与算力卡点闭环求助机制、无 PPT 组会投屏模式及名校学术主题系统，全面赋能顶尖实验室的高效协作与成果产出。

---

## ⚖️ Why LabFlow vs. Jira & Notion? (核心维度对比)

| 核心维度 / Feature Dimension | Jira / Linear | Notion / Trello | **LabFlow (Academic OS)** |
| :--- | :--- | :--- | :--- |
| **工作流哲学 (Paradigm)** | 软件工程敏捷冲刺 (Sprint / Backlog) | 自由文档笔记 / 通用看板 | **论文与课题全生命周期导向 (Paper-Driven Pipeline)** |
| **流转阶段 (Board Stages)** | Todo / In Progress / Done | 自定义列 (无学术语义) | **灵感文献 → 数据实验 → 初稿撰写 → 导师审阅 → 投稿返修 → 录用归档** |
| **投稿倒排机制 (Reverse DDL)** | ❌ 无 (需手动计算工期) | ❌ 静态日历 (无法自动生成里程碑) | **⚡ 自动倒推生成 T-45/T-30/T-14/T-3 关键学术节点并注入看板** |
| **冷启动导入 (Cold-Start)** | 需繁琐配置 CSV 导入 | 纯手动复制黏贴 | **✨ 专属 AI 提示词 + 自动化容错解析，文档秒变全组看板** |
| **卡点求助 (Blocker Handling)** | 仅有简单 Flag 标记 | 评论区艾特 (极易淹没) | **🔥 细分卡点类型 (数学推导/算法收敛/算力瓶颈)，直接呼叫导师拍板** |
| **科研资产直达 (Assets)** | 自定义字段 (折叠层级深) | 链接嵌入 | **统一低饱和度灰阶标签：Overleaf、GitHub、Zenodo、Zotero 一键直达** |
| **科研权限制 (Academic RBAC)** | 企业级复杂权限树 | 全员可乱改或全员只读 | **👑 导师全权 + 🔬 骨干管课题 + 🧑‍💻 组员仅管自己 + 👁️ 访客只读** |
| **组会汇报 (Group Standup)** | ❌ 无法直观投屏 | 需学生耗费半天准备 PPT | **🖥️ 无 PPT 投屏模式：3 栏汇报视图 + 1 秒导出 Markdown 周报与纪要** |
| **算力资源调度 (Compute Strip)** | ❌ 无关联 | 需单独维护表格 | **内置 GPU/HPC 节点状态、占用者、剩余机时与防误释放保护** |
| **学术排版审美 (Typography)** | 现代无衬线体 (UI 风) | 常见系统字体 | **标准学术 Times New Roman 衬线体、三级字号与名校经典主题配色** |

---

## 🚀 核心功能详解 (Core Features Breakdown)

### 1. 📌 论文全生命周期学术看板 (Paper-First Academic Pipeline)
提供贴合高校科研规律的 6 阶段学术研发流水线：
1. `IDEATION` (灵感与文献): 假说构思、文献调研、创新点论证与实验方案设计；
2. `DATA_EXP` (数据与实验): 数据清洗、模型训练、仿真调优与 SOTA 基线评测；
3. `DRAFTING` (初稿撰写): Overleaf LaTeX 协作、高分辨率矢量图表绘制、附录整理；
4. `PI_REVIEW` (导师审阅): 论文结构把关、定理严谨性核验、导师批注与修改；
5. `REVISION` (投稿与返修): 审稿人意见回复 (Rebuttal)、补充安慰剂检验、差异对比排版；
6. `ACCEPTED` (录用归档): 论文录用发表、代码开源归档、全屏庆祝彩带（Confetti）！

- **卡片关键学术要素**：课题标签 (`AAAI 2027`, `Nature Comm`, `青年基金`)、截止日期倒计时（3天内红脉冲警示）、统一纯净灰阶资源标签 (`Overleaf`, `GitHub`, `Dataset`, `Zotero`)、一作与导师徽标。
- **项目详情下拉抽屉**：点击任务直接在当前板块下方优雅展开下拉抽屉，无需右侧弹窗，支持就地编辑实验方案、修改 DDL 与勾选双盲匿名合规清单。

---

### 2. ✨ AI 智能文档导入与系统冷启动 (AI Smart Document Importer)
初次使用 LabFlow 时，老师或负责人无需手动一个个录入人员与任务：
1. **一键复制 AI 提示词**：系统内置精心设计的学术架构师提取提示词，支持中英双语；
2. **连接任意 AI**：将该提示词连同您手头现有的**实验室文档、周报、立项书、学生花名册或会议纪要**，一并粘贴给 ChatGPT、Claude、DeepSeek、Kimi 或 Gemini 等任意 AI；
3. **自动化容错解析**：将 AI 返回的文段粘贴回 LabFlow，内置脚本自动清洗 Markdown 代码块、修复尾部多余逗号、智能映射学术阶段与身份角色；
4. **双模式导入**：
   - 🚀 **【覆盖并全新初始化】**：清空示例数据，直接生成老师团队的真实项目与名单；
   - ➕ **【增量追加合并】**：保留现有卡片，仅将新提取的任务与课题无损追加进来。

---

### 3. 👑 四级科研权限体系与主密码保护 (4-Tier Academic RBAC)
完全免除配置外部邮箱验证码或注册服务器的繁琐门槛，通过**管理员主密码 (默认: `admin888`)** 兼顾即开即用与团队防误改：
- 👑 **导师 / 实验室管理员 (`ADMIN_PI`)**：全权掌控，可查阅绝密卡片、修改/删除任意成员任务、强制释放被死锁的 GPU 算力、调整阶段与系统初始化；
- 🔬 **课题负责人 / 骨干 (`PROJECT_LEAD`)**：可创建并完全管理自己课题下的所有任务与里程碑，可推进论文至录用归档；
- 🧑‍💻 **组内成员 / 研究生 (`STUDENT_RA`)**：**仅管自己**。只能编辑、拖拽自己为负责人或参与者的卡片；他人卡片强制加锁；若试图将卡片移入「录用归档」，系统会自动触发学术把关拦截提示（需导师核验）；只能释放自己登记占用的设备；
- 👁️ **只读访客 / 旁听 (`AUDITOR_GUEST`)**：全局只读模式，禁用新建、拖拽与修改，适用于学术汇报、外部评审或新生旁听。
- ⚡ **5 秒极速登记新成员**：在顶部身份栏直接点击「+ 登记新成员」，输入姓名即可立即开始协作。

---

### 4. 🔒 课题保密与可见性分级 (Confidentiality & Privacy Scope)
创建任务、立项与排期时，支持自由配置保密级别：
- 🌐 **全组公开 (`PUBLIC`)**：课题组全体成员均可查看；
- 👥 **课题内可见 (`TEAM_ONLY`)**：仅课题参与成员与导师可见，避免不同研究方向互相打扰；
- 🔒 **绝密 (`PI_ONLY`)**：仅导师与一作可见，用于未发表的核心创新点、高密基金本子或专利草案。

---

### 5. ⚡ 投稿反向排期生成器 (Reverse DDL Scheduler)
顶级会议与期刊（NeurIPS, ICML, CVPR, AAAI, Nature 子刊, AER 等）需要极其严格的倒排工期计划：
- 输入论文题目、目标会议和截稿日期（$T$ 日）；
- 自动按科学工期生成并关联 4 大协同里程碑：
  - $T - 45\text{ 天}$ (`DATA_EXP`): **基线锁定与实验评测冻结**
  - $T - 30\text{ 天}$ (`DRAFTING`): **论文完整初稿完成 (Overleaf)**
  - $T - 14\text{ 天}$ (`PI_REVIEW`): **提交导师深入审阅与组内把关**
  - $T - 3\text{ 天}$ (`PI_REVIEW`): **双盲匿名复核、格式排版与可复现包核验**
- 步长天数与步骤名称支持自由增加、删除与自定义。

---

### 6. 🔥 科研卡点上报与闭环决断 (Blocker Escalation)
学术项目极易因某些技术暗礁导致停滞。LabFlow 将隐形阻力转化为公开协作决断：
- 顶部支持一键筛选 **「🔥 仅看卡点」**，全组红灯任务一览无余；
- 细分学术卡点类别：`数学推导卡点`、`算法模型收敛异常`、`算力与显存短缺`、`数据缺失`、`等待审阅`、`经验复现差异`；
- 明确填写：*具体卡在哪里？* + *已尝试过的推导/解法* + *亟需谁介入决断 (导师/骨干)*；
- 解决卡点后一键解除，自动更新状态并恢复顺畅推进。

---

### 7. 📊 学术项目进度甘特图 (Academic Gantt View)
- 支持 **按周 (Weekly)** 和 **按月 (Monthly)** 时间轴粒度缩放；
- 支持 **按课题分类筛选与分组**，避免全实验室几十个任务堆积过大；
- 支持在时间轴上直接拖动滑块调整完成进度（0~100%），自主编辑工期起始与截止日期。

---

### 8. 🖥️ 无 PPT 组会投屏模式 (Group Standup Mode)
告别全组学生每周花半天做 PPT 却只汇报 5 分钟的内卷痛点：
- 专为会议室 4K 大屏与腾讯会议/Zoom 屏幕共享设计的高对比度投屏面板；
- **三栏学术汇报看板**：
  1. *近期进展与录用*：已录用论文与阶段成果；
  2. *当前实验与初稿推进*：正在进行的模型调优、实证分析与初稿章节；
  3. *核心卡点与导师决断*：亟需组会集体讨论或导师拍板的技术难点。
- **一键导出纪要与个人周报**：自动生成格式工整的 Markdown 汇报周报，支持一键复制到剪贴板，秒发微信群或邮件！

---

### 9. 🎨 经典学术主题配色、色卡拾色器与 Times New Roman 学术排版
- **主题配色预设**：
  - 🌟 **黑金 (`#C28E0E`)**：沉稳高级黑金质感，完美契合暗黑与深灰底色；
  - 🌊 **深蓝 (`#002147`)**：严谨深邃的经典学术深蓝；
  - 🔴 **深红 (`#8C1515`)**：沉着大气的质感深红；
  - 🍃 **青绿 (`#0D9488`)**：清爽聚焦的自然青绿；
  - 🍷 **酒红 (`#A31F34`)**：沉稳坚韧的暗调酒红；
  - 🌌 经典蓝紫、计算青、翠绿、琥珀金、玫瑰红等。
- **色卡与拾色器直接点选**：
  - 内置经典学术色卡阵列，点击色卡立即全局生效；
  - 支持 HTML5 原生吸色笔 / 拾色器与 HEX 色值输入，任意色号皆可完美驱动界面。
- **学术专业排版**：
  - 英文字体全面统一为国际学术期刊通用 **Times New Roman** 衬线体；
  - 支持 **紧凑小号**、**标准常规**、**舒适大号** 三级字号调节；
  - **色调统一规范**：所有科研资源外链（GitHub, Overleaf, Zotero, Dataset）统一采用优雅低饱和度学术灰阶微胶囊，彻底去除多余花哨杂色。

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
     - 启动后，顶部状态胶囊会显示 **「服务器DB已同步」**（PostgreSQL）或 **「本机服务已保存」**（`.data/labflow-state.json`）。

#### 5. 生产环境构建与打包
```bash
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
      "accessRole": "ADMIN_PI | PROJECT_LEAD | STUDENT_RA | AUDITOR_GUEST",
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
- **样式系统**: [Tailwind CSS 3.4](https://tailwindcss.com/) (含实时 CSS 变量全局动态注入)
- **交互拖拽**: [@hello-pangea/dnd](https://github.com/hello-pangea/dnd) (流畅丝滑的拖拽排序与跨阶段流转)
- **学术图标**: [Lucide React](https://lucide.dev/)
- **数据持久化**: 双模服务端持久化引擎 — 零配置本机服务端文件存储（`.data/labflow-state.json` + 原子写盘锁 + 乐观并发修订号）与 PostgreSQL + Prisma ORM 云端/多用户数据库无缝切换，搭配浏览器离线缓存与 JSON 灾备导入导出
- **字体标准**: 学术标准 Times New Roman 衬线字体族

---

## 📄 开源许可证 (License)

本项目采用 [MIT License](LICENSE) 开源许可证。欢迎全球高校科研人员、导师、博士生与实验室管理员免费使用、二次开发与定制推广！
