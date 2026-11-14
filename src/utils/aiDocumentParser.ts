import {
  LabMember,
  ProjectItem,
  LabResource,
  StageConfig,
  Priority,
  VisibilityLevel,
  AccessRole,
} from '@/types';
import { generateInitialsAvatar } from '@/utils/avatar';

export interface ParsedMember {
  id: string;
  nameZh: string;
  nameEn: string;
  role: LabMember['role'];
  accessRole: AccessRole;
  titleZh: string;
  titleEn: string;
  email: string;
  avatar: string;
}

export interface ParsedProject {
  id: string;
  title: string;
  targetVenue: string;
  tag: string;
  abstract: string;
  leadAuthorName: string;
  leadAuthorId: string;
  status: string;
}

export interface ParsedTask {
  id: string;
  title: string;
  description: string;
  stage: string;
  projectName: string;
  projectId: string;
  leadAuthorName: string;
  leadAuthorId: string;
  priority: Priority;
  visibility: VisibilityLevel;
  deadline: string;
  progress: number;
}

export interface ParsedResource {
  id: string;
  nameZh: string;
  nameEn: string;
  type: LabResource['type'];
  specs: string;
  status: LabResource['status'];
}

export interface ParsedAIData {
  members: ParsedMember[];
  projects: ParsedProject[];
  tasks: ParsedTask[];
  resources: ParsedResource[];
}

export const AI_IMPORT_PROMPT_ZH = `你是一位顶尖的高校与科研实验室管理架构师。
请仔细阅读我提供的【课题组文档 / 周报 / 项目立项书 / 人员名单 / 论文规划 / 会议纪要】。
请将提取出的课题组成员、科研课题、学术推进任务以及计算设施，整理成符合 LabFlow 学术操作系统规范的 JSON 数据格式。

【输出规范】：
1. 只能输出一个包含合法 JSON 的 markdown 代码块（以 \`\`\`json 开头，以 \`\`\` 结尾），不要输出任何多余的寒暄或解释。
2. 即使我提供的文档信息不完整，也请根据常识合理推断并补全（如根据人名生成英文名、根据任务推进状态推测其所属学术阶段与截止日期）。
3. JSON 格式字段必须严格遵循以下结构：

\`\`\`json
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
\`\`\`

【学术阶段(stage)候选值】：
- IDEATION: 灵感与文献调研、假说构思、可行性论证
- DATA_EXP: 数据清洗、模型训练、仿真调优、核心实验评测
- DRAFTING: 论文初稿撰写、图表绘制、附录整理
- PI_REVIEW: 提交导师修改、组内深入审阅把关
- REVISION: 审稿意见回复(Rebuttal)、修改返修
- ACCEPTED: 论文已录用发表、代码开源、结项归档

请根据我接下来粘贴的实验室文档开始提取：`;

export const AI_IMPORT_PROMPT_EN = `You are a Principal Academic Lab Operations Architect.
Please analyze the provided academic laboratory documents (weekly reports, grant proposals, student rosters, paper plans, or meeting notes).
Extract the lab members, research projects, academic tasks, and compute resources into the standard LabFlow OS JSON schema.

Output Rules:
1. Output ONLY a valid JSON markdown code block (starting with \`\`\`json and ending with \`\`\`), with zero conversational filler.
2. If any fields are missing, intelligently infer them based on context.
3. Schema format:
\`\`\`json
{
  "members": [
    {
      "nameZh": "Chinese Name",
      "nameEn": "English Name",
      "role": "PI | POSTDOC | SENIOR_PHD | PHD_CANDIDATE | RA | VISITING_SCHOLAR",
      "accessRole": "ADMIN_PI | PROJECT_LEAD | STUDENT_RA | AUDITOR_GUEST",
      "titleZh": "Role or research focus",
      "email": "Email address"
    }
  ],
  "projects": [
    {
      "title": "Full Paper / Project Title",
      "targetVenue": "Target Conference or Journal (e.g. CVPR 2027, Nature Comm)",
      "tag": "Short Tag (e.g. CVPR'27)",
      "abstract": "Brief objective",
      "leadAuthorName": "Lead author name"
    }
  ],
  "tasks": [
    {
      "title": "Specific milestone or paper task",
      "description": "Details & deliverables",
      "stage": "IDEATION | DATA_EXP | DRAFTING | PI_REVIEW | REVISION | ACCEPTED",
      "projectName": "Project Title",
      "leadAuthorName": "Lead author name",
      "priority": "LOW | MEDIUM | HIGH | URGENT",
      "visibility": "PUBLIC | TEAM_ONLY | PI_ONLY",
      "deadline": "YYYY-MM-DD",
      "progress": 50
    }
  ],
  "resources": [
    {
      "nameZh": "Resource Name",
      "nameEn": "Resource Name En",
      "type": "GPU | SERVER | CLUSTER | EQUIPMENT",
      "specs": "Hardware specs"
    }
  ]
}
\`\`\``;

export const AI_SAMPLE_OUTPUT_ZH = `{
  "members": [
    {
      "nameZh": "张文远",
      "nameEn": "Prof. Wenyuan Zhang",
      "role": "PI",
      "accessRole": "ADMIN_PI",
      "titleZh": "实验室负责人 / 教授",
      "email": "wyzhang@univ.edu.cn"
    },
    {
      "nameZh": "李晨阳",
      "nameEn": "Chenyang Li",
      "role": "SENIOR_PHD",
      "accessRole": "PROJECT_LEAD",
      "titleZh": "具身智能与大模型博士生",
      "email": "li.cy@univ.edu.cn"
    },
    {
      "nameZh": "赵雪晴",
      "nameEn": "Xueqing Zhao",
      "role": "PHD_CANDIDATE",
      "accessRole": "STUDENT_RA",
      "titleZh": "神经符号推理方向博士生",
      "email": "zhao.xq@univ.edu.cn"
    },
    {
      "nameZh": "刘浩然",
      "nameEn": "Haoran Liu",
      "role": "RA",
      "accessRole": "STUDENT_RA",
      "titleZh": "强化学习科研助理 (RA)",
      "email": "liu.hr@univ.edu.cn"
    }
  ],
  "projects": [
    {
      "title": "基于多模态大模型的机械臂自适应装配规划",
      "targetVenue": "CVPR 2027",
      "tag": "CVPR '27",
      "abstract": "解决非结构化工业场景下机械臂精细操作的跨域泛化难题",
      "leadAuthorName": "李晨阳"
    },
    {
      "title": "知识图谱增强的时空因果推理网络",
      "targetVenue": "NeurIPS 2027",
      "tag": "NeurIPS '27",
      "abstract": "突破复杂动力系统反事实预测中的分布偏移瓶颈",
      "leadAuthorName": "赵雪晴"
    }
  ],
  "tasks": [
    {
      "title": "Mujoco 物理仿真器基线数据与SOTA方法对比评测",
      "description": "跑通 DexArm 环境的 5 种基线算法，记录成功率与动作抖动方差",
      "stage": "DATA_EXP",
      "projectName": "基于多模态大模型的机械臂自适应装配规划",
      "leadAuthorName": "李晨阳",
      "priority": "HIGH",
      "visibility": "PUBLIC",
      "deadline": "2026-12-20",
      "progress": 70
    },
    {
      "title": "论文核心架构图与前言初稿撰写 (Overleaf)",
      "description": "绘制高质量系统流程图，清晰阐述对比现有方案的 3 大贡献点",
      "stage": "DRAFTING",
      "projectName": "基于多模态大模型的机械臂自适应装配规划",
      "leadAuthorName": "李晨阳",
      "priority": "MEDIUM",
      "visibility": "PUBLIC",
      "deadline": "2027-01-15",
      "progress": 35
    },
    {
      "title": "反事实推理理论边界数学推导与引理证明",
      "description": "完成 Theorem 1 和 Lemma 2 的收敛性界限数学推导，撰写附录草稿",
      "stage": "IDEATION",
      "projectName": "知识图谱增强的时空因果推理网络",
      "leadAuthorName": "赵雪晴",
      "priority": "URGENT",
      "visibility": "TEAM_ONLY",
      "deadline": "2026-12-05",
      "progress": 20
    },
    {
      "title": "大规模交通与气象数据集特征清洗及图嵌入生成",
      "description": "处理 1.2TB 时空轨迹数据，生成图神经网络训练所需的稀疏邻接矩阵",
      "stage": "DATA_EXP",
      "projectName": "知识图谱增强的时空因果推理网络",
      "leadAuthorName": "刘浩然",
      "priority": "MEDIUM",
      "visibility": "PUBLIC",
      "deadline": "2026-12-18",
      "progress": 55
    }
  ],
  "resources": [
    {
      "nameZh": "算力集群 #01 (8卡 H100)",
      "nameEn": "H100 Node 01",
      "type": "GPU",
      "specs": "8x NVIDIA H100 80GB SXM5, 100Gbps InfiniBand"
    },
    {
      "nameZh": "仿真工作站 #02 (4卡 RTX 4090)",
      "nameEn": "RTX 4090 Station",
      "type": "SERVER",
      "specs": "4x RTX 4090 24GB, AMD EPYC 64-Core"
    }
  ]
}`;

export const AI_SAMPLE_OUTPUT_EN = `{
  "members": [
    {
      "nameZh": "张文远",
      "nameEn": "Prof. Wenyuan Zhang",
      "role": "PI",
      "accessRole": "ADMIN_PI",
      "titleZh": "实验室负责人 / 教授",
      "email": "wyzhang@univ.edu.cn"
    },
    {
      "nameZh": "李晨阳",
      "nameEn": "Chenyang Li",
      "role": "SENIOR_PHD",
      "accessRole": "PROJECT_LEAD",
      "titleZh": "具身智能与大模型博士生",
      "email": "li.cy@univ.edu.cn"
    },
    {
      "nameZh": "赵雪晴",
      "nameEn": "Xueqing Zhao",
      "role": "PHD_CANDIDATE",
      "accessRole": "STUDENT_RA",
      "titleZh": "神经符号推理方向博士生",
      "email": "zhao.xq@univ.edu.cn"
    }
  ],
  "projects": [
    {
      "title": "Embodied Multimodal Foundation Models for Robotic Assembly",
      "targetVenue": "CVPR 2027",
      "tag": "CVPR '27",
      "abstract": "Cross-domain generalization for high-precision robotic manipulation.",
      "leadAuthorName": "李晨阳"
    }
  ],
  "tasks": [
    {
      "title": "Mujoco DexArm Benchmark Simulation Evaluation",
      "description": "Benchmark 5 baseline methods and measure task success rate.",
      "stage": "DATA_EXP",
      "projectName": "Embodied Multimodal Foundation Models for Robotic Assembly",
      "leadAuthorName": "李晨阳",
      "priority": "HIGH",
      "visibility": "PUBLIC",
      "deadline": "2026-12-20",
      "progress": 65
    },
    {
      "title": "System Architecture Diagram & Introduction Draft",
      "description": "Draft high-resolution architecture diagram and formal introduction on Overleaf.",
      "stage": "DRAFTING",
      "projectName": "Embodied Multimodal Foundation Models for Robotic Assembly",
      "leadAuthorName": "李晨阳",
      "priority": "MEDIUM",
      "visibility": "PUBLIC",
      "deadline": "2027-01-15",
      "progress": 30
    }
  ],
  "resources": [
    {
      "nameZh": "算力集群 #01 (8卡 H100)",
      "nameEn": "DGX H100 Cluster 01",
      "type": "GPU",
      "specs": "8x NVIDIA H100 80GB SXM5"
    }
  ]
}`;

/**
 * Robust JSON Extractor & Sanitizer
 */
export function extractJsonFromText(rawText: string): string {
  let cleaned = rawText.trim();

  // 1. Look for ```json ... ``` or ``` ... ```
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    cleaned = codeBlockMatch[1].trim();
  } else {
    // 2. Look for outermost curly braces { ... }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1).trim();
    }
  }

  // 3. Remove trailing commas in objects and arrays (which break JSON.parse)
  cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');

  return cleaned;
}

/**
 * Intelligent stage matcher
 */
function normalizeStage(stageInput: string | undefined, validStages: StageConfig[]): string {
  if (!stageInput) return validStages[0]?.id || 'IDEATION';

  const inputUpper = stageInput.trim().toUpperCase();

  // Exact ID match
  const matchedById = validStages.find((s) => s.id.toUpperCase() === inputUpper);
  if (matchedById) return matchedById.id;

  // Exact or fuzzy label match
  const matchedByLabel = validStages.find(
    (s) =>
      s.labelZh.toLowerCase().includes(stageInput.toLowerCase()) ||
      s.labelEn.toLowerCase().includes(stageInput.toLowerCase())
  );
  if (matchedByLabel) return matchedByLabel.id;

  // Semantic keyword heuristics
  const lower = stageInput.toLowerCase();
  if (lower.includes('灵感') || lower.includes('调研') || lower.includes('文献') || lower.includes('idea') || lower.includes('lit')) {
    const s = validStages.find((st) => st.id === 'IDEATION');
    if (s) return s.id;
  }
  if (lower.includes('实验') || lower.includes('数据') || lower.includes('训练') || lower.includes('exp') || lower.includes('data') || lower.includes('model')) {
    const s = validStages.find((st) => st.id === 'DATA_EXP');
    if (s) return s.id;
  }
  if (lower.includes('初稿') || lower.includes('撰写') || lower.includes('草稿') || lower.includes('draft') || lower.includes('write')) {
    const s = validStages.find((st) => st.id === 'DRAFTING');
    if (s) return s.id;
  }
  if (lower.includes('审阅') || lower.includes('老师') || lower.includes('导师') || lower.includes('review') || lower.includes('pi')) {
    const s = validStages.find((st) => st.id === 'PI_REVIEW');
    if (s) return s.id;
  }
  if (lower.includes('返修') || lower.includes('投稿') || lower.includes('rebuttal') || lower.includes('revision') || lower.includes('r&r')) {
    const s = validStages.find((st) => st.id === 'REVISION');
    if (s) return s.id;
  }
  if (lower.includes('录用') || lower.includes('中稿') || lower.includes('发表') || lower.includes('accept') || lower.includes('archive')) {
    const s = validStages.find((st) => st.id === 'ACCEPTED');
    if (s) return s.id;
  }

  // Fallback to first stage or second stage
  return validStages[1]?.id || validStages[0]?.id || 'DATA_EXP';
}

/**
 * Intelligent role & accessRole normalizer
 */
function normalizeMemberRole(
  roleInput: string | undefined,
  titleInput?: string
): { role: LabMember['role']; accessRole: AccessRole } {
  const text = `${roleInput || ''} ${titleInput || ''}`.toLowerCase();

  if (text.includes('pi') || text.includes('导师') || text.includes('教授') || text.includes('负责人')) {
    return { role: 'PI', accessRole: 'ADMIN_PI' };
  }
  if (text.includes('postdoc') || text.includes('博士后') || text.includes('博后')) {
    return { role: 'POSTDOC', accessRole: 'PROJECT_LEAD' };
  }
  if (text.includes('senior') || text.includes('高年级') || text.includes('高博') || text.includes('大博')) {
    return { role: 'SENIOR_PHD', accessRole: 'PROJECT_LEAD' };
  }
  if (text.includes('phd') || text.includes('博士')) {
    return { role: 'PHD_CANDIDATE', accessRole: 'STUDENT_RA' };
  }
  if (text.includes('visiting') || text.includes('访问') || text.includes('学者') || text.includes('旁听')) {
    return { role: 'VISITING_SCHOLAR', accessRole: 'AUDITOR_GUEST' };
  }
  return { role: 'RA', accessRole: 'STUDENT_RA' };
}

interface RawMemberInput {
  id?: string;
  nameZh?: string;
  nameEn?: string;
  name?: string;
  role?: string;
  accessRole?: string;
  titleZh?: string;
  titleEn?: string;
  email?: string;
  avatar?: string;
}

interface RawProjectInput {
  id?: string;
  title?: string;
  targetVenue?: string;
  venue?: string;
  tag?: string;
  abstract?: string;
  description?: string;
  leadAuthorName?: string;
  lead?: string;
  status?: string;
}

interface RawTaskInput {
  id?: string;
  title?: string;
  description?: string;
  stage?: string;
  projectName?: string;
  project?: string;
  targetVenue?: string;
  leadAuthorName?: string;
  author?: string;
  deadline?: string;
  priority?: string;
  visibility?: string;
  progress?: number;
}

interface RawResourceInput {
  id?: string;
  nameZh?: string;
  nameEn?: string;
  name?: string;
  type?: string;
  specs?: string;
}

interface RawPayload {
  members?: RawMemberInput[];
  projects?: RawProjectInput[];
  tasks?: RawTaskInput[];
  resources?: RawResourceInput[];
}

/**
 * Main parser function: Converts raw text from any AI into clean LabFlow state
 */
export function parseAIDocumentText(
  rawText: string,
  existingMembers: LabMember[] = [],
  existingProjects: ProjectItem[] = [],
  stages: StageConfig[] = []
): { success: boolean; data?: ParsedAIData; error?: string } {
  try {
    const jsonStr = extractJsonFromText(rawText);
    if (!jsonStr) {
      return { success: false, error: '未能检测到有效的 JSON 数据块，请检查 AI 输出格式。' };
    }

    const parsed = JSON.parse(jsonStr) as RawPayload;

    // 1. Process Members
    const membersMap = new Map<string, ParsedMember>();

    // Helper to generate a stable pseudo-id
    const makeMemberId = (name: string) =>
      `member-${name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user'}-${Math.random().toString(36).substring(2, 6)}`;

    const rawMembers = Array.isArray(parsed.members) ? parsed.members : [];
    rawMembers.forEach((rm) => {
      const nameZh = rm.nameZh || rm.name || rm.nameEn || '新成员';
      const nameEn = rm.nameEn || rm.nameZh || rm.name || 'Member';
      const { role, accessRole } = normalizeMemberRole(rm.role, rm.titleZh);

      const member: ParsedMember = {
        id: rm.id || makeMemberId(nameEn),
        nameZh,
        nameEn,
        role: rm.role && ['PI', 'POSTDOC', 'SENIOR_PHD', 'PHD_CANDIDATE', 'RA', 'VISITING_SCHOLAR'].includes(rm.role) ? (rm.role as LabMember['role']) : role,
        accessRole: rm.accessRole && ['ADMIN_PI', 'PROJECT_LEAD', 'STUDENT_RA', 'AUDITOR_GUEST'].includes(rm.accessRole) ? (rm.accessRole as AccessRole) : accessRole,
        titleZh: rm.titleZh || `${nameZh} 的研究方向`,
        titleEn: rm.titleEn || nameEn,
        email: rm.email || `${nameEn.toLowerCase().replace(/\s+/g, '.')}@lab.edu.cn`,
        avatar: rm.avatar || generateInitialsAvatar(nameEn, nameZh),
      };
      membersMap.set(nameZh, member);
      membersMap.set(nameEn, member);
    });

    // 2. Process Projects
    const projectsMap = new Map<string, ParsedProject>();
    const rawProjects = Array.isArray(parsed.projects) ? parsed.projects : [];

    rawProjects.forEach((rp, idx) => {
      const title = rp.title || `学术课题 #${idx + 1}`;
      const leadName = rp.leadAuthorName || rp.lead || '';
      let leadMember = membersMap.get(leadName);

      // Auto-create member if not already extracted
      if (!leadMember && leadName) {
        leadMember = {
          id: makeMemberId(leadName),
          nameZh: leadName,
          nameEn: leadName,
          role: 'PHD_CANDIDATE',
          accessRole: 'STUDENT_RA',
          titleZh: '课题负责人',
          titleEn: 'Project Lead',
          email: '',
          avatar: generateInitialsAvatar(leadName),
        };
        membersMap.set(leadName, leadMember);
      }

      const matchedExisting = existingProjects.find(
        (ep) => ep.title.toLowerCase() === title.toLowerCase()
      );
      const projId = rp.id || matchedExisting?.id || `proj-ai-${Math.random().toString(36).substring(2, 7)}`;
      const proj: ParsedProject = {
        id: projId,
        title,
        targetVenue: rp.targetVenue || rp.venue || 'Top Conference',
        tag: rp.tag || rp.targetVenue || 'LAB-AI',
        abstract: rp.abstract || rp.description || '',
        leadAuthorName: leadMember ? leadMember.nameZh : (leadName || '未指定'),
        leadAuthorId: leadMember ? leadMember.id : '',
        status: normalizeStage(rp.status, stages),
      };

      projectsMap.set(title, proj);
    });

    // 3. Process Tasks
    const parsedTasks: ParsedTask[] = [];
    const rawTasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];

    // Default future deadline (30 days from now)
    const defaultDDL = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];

    rawTasks.forEach((rt, idx) => {
      const title = rt.title || `研究任务 #${idx + 1}`;
      const projName = rt.projectName || rt.project || '';
      let project = projectsMap.get(projName);

      // Auto-create project if referenced but not in projects list
      if (!project && projName) {
        const newProjId = `proj-ai-${Math.random().toString(36).substring(2, 7)}`;
        project = {
          id: newProjId,
          title: projName,
          targetVenue: rt.targetVenue || 'Academic Venue',
          tag: projName.slice(0, 8),
          abstract: '',
          leadAuthorName: rt.leadAuthorName || '',
          leadAuthorId: '',
          status: 'DATA_EXP',
        };
        projectsMap.set(projName, project);
      }

      const authorName = rt.leadAuthorName || rt.author || '';
      let author = membersMap.get(authorName);
      if (!author && authorName) {
        author = {
          id: makeMemberId(authorName),
          nameZh: authorName,
          nameEn: authorName,
          role: 'RA',
          accessRole: 'STUDENT_RA',
          titleZh: '学术骨干',
          titleEn: 'Researcher',
          email: '',
          avatar: generateInitialsAvatar(authorName),
        };
        membersMap.set(authorName, author);
      }

      // Format deadline
      let deadline = defaultDDL;
      if (rt.deadline && /^\d{4}-\d{2}-\d{2}/.test(rt.deadline)) {
        deadline = rt.deadline.slice(0, 10);
      }

      // Priority
      let priority: Priority = 'MEDIUM';
      const prioUpper = (rt.priority || '').toUpperCase();
      if (['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(prioUpper)) {
        priority = prioUpper as Priority;
      } else if (rt.priority?.includes('急') || rt.priority?.includes('最高')) {
        priority = 'URGENT';
      } else if (rt.priority?.includes('高')) {
        priority = 'HIGH';
      }

      // Visibility
      let visibility: VisibilityLevel = 'PUBLIC';
      const visUpper = (rt.visibility || '').toUpperCase();
      if (['PUBLIC', 'TEAM_ONLY', 'PI_ONLY'].includes(visUpper)) {
        visibility = visUpper as VisibilityLevel;
      } else if (rt.visibility?.includes('密') || rt.visibility?.includes('私')) {
        visibility = 'PI_ONLY';
      } else if (rt.visibility?.includes('组内') || rt.visibility?.includes('课题')) {
        visibility = 'TEAM_ONLY';
      }

      parsedTasks.push({
        id: rt.id || `task-ai-${Date.now()}-${idx}`,
        title,
        description: rt.description || '',
        stage: normalizeStage(rt.stage, stages),
        projectName: project ? project.title : (projName || '通用学术任务'),
        projectId: project ? project.id : 'proj-general',
        leadAuthorName: author ? author.nameZh : (authorName || '待认领'),
        leadAuthorId: author ? author.id : (existingMembers[0]?.id || 'member-pi'),
        priority,
        visibility,
        deadline,
        progress: typeof rt.progress === 'number' ? Math.max(0, Math.min(100, rt.progress)) : 0,
      });
    });

    // 4. Process Resources
    const parsedResources: ParsedResource[] = [];
    const rawResources = Array.isArray(parsed.resources) ? parsed.resources : [];
    rawResources.forEach((rr, idx) => {
      parsedResources.push({
        id: rr.id || `res-ai-${idx + 1}`,
        nameZh: rr.nameZh || rr.name || `计算资源 #${idx + 1}`,
        nameEn: rr.nameEn || rr.nameZh || `Resource #${idx + 1}`,
        type: rr.type && ['GPU', 'SERVER', 'CLUSTER', 'EQUIPMENT'].includes(rr.type) ? (rr.type as LabResource['type']) : 'GPU',
        specs: rr.specs || '标准配置',
        status: 'IDLE',
      });
    });

    // Deduplicate members list
    const uniqueMembers = Array.from(new Set(membersMap.values()));
    const uniqueProjects = Array.from(projectsMap.values());

    return {
      success: true,
      data: {
        members: uniqueMembers,
        projects: uniqueProjects,
        tasks: parsedTasks,
        resources: parsedResources,
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `JSON 解析异常: ${errorMsg}。请确保输出包含严格的闭合括号与双引号。`,
    };
  }
}
