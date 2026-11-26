import { MilestoneTemplate, VenuePreset } from '@/types';

export const STANDARD_PAPER_MILESTONES: MilestoneTemplate[] = [
  {
    nameEn: 'Empirical / Experimental Analysis Freeze',
    nameZh: '实验/实证分析锁定',
    offsetDays: 45,
    stageId: 'DATA_EXP',
  },
  {
    nameEn: 'Full Manuscript & Figures Draft',
    nameZh: '论文完整初稿与图表就绪',
    offsetDays: 30,
    stageId: 'DRAFTING',
  },
  {
    nameEn: 'Advisor & Co-Author Review',
    nameZh: '导师与合作者审阅',
    offsetDays: 14,
    stageId: 'PI_REVIEW',
  },
  {
    nameEn: 'Replication Pack & Submission Formatting',
    nameZh: '复现资料与投稿格式核对',
    offsetDays: 3,
    stageId: 'PI_REVIEW',
  },
];

export const DEFAULT_UNIVERSAL_VENUES: VenuePreset[] = [
  {
    id: 'venue-nature-comms',
    name: 'Nature Communications',
    tag: 'Nature Comms',
    url: 'https://www.nature.com/ncomms/',
    defaultLeadId: 'member-student1',
    milestones: [
      {
        nameEn: 'Multi-Center Data & Analysis Freeze',
        nameZh: '核心实验与数据验证冻结',
        offsetDays: 60,
        stageId: 'DATA_EXP',
      },
      {
        nameEn: 'Full Article & Extended Data Draft',
        nameZh: '正文与扩展图表初稿就绪',
        offsetDays: 35,
        stageId: 'DRAFTING',
      },
      {
        nameEn: 'PI & Co-Author Consortium Sign-off',
        nameZh: '导师与合著者联盟审阅确认',
        offsetDays: 15,
        stageId: 'PI_REVIEW',
      },
      {
        nameEn: 'Editorial Formatting & Archive Check',
        nameZh: '期刊排版核验与数据归档',
        offsetDays: 4,
        stageId: 'PI_REVIEW',
      },
    ],
  },
  {
    id: 'venue-pnas',
    name: 'Proceedings of the National Academy of Sciences (PNAS)',
    tag: 'PNAS',
    url: 'https://www.pnas.org/',
    defaultLeadId: 'member-postdoc1',
    milestones: structuredClone(STANDARD_PAPER_MILESTONES),
  },
  {
    id: 'venue-neurips',
    name: 'NeurIPS 2027',
    tag: "NeurIPS '27",
    url: 'https://neurips.cc/',
    defaultLeadId: 'member-student1',
    milestones: [
      {
        nameEn: 'Core Empirical & Baseline Freeze',
        nameZh: '基线对比与主实验结果锁定',
        offsetDays: 50,
        stageId: 'DATA_EXP',
      },
      {
        nameEn: 'Complete Overleaf Draft & Appendix',
        nameZh: '正文及附录初稿完成',
        offsetDays: 30,
        stageId: 'DRAFTING',
      },
      {
        nameEn: 'Internal Lab Dry-run Review',
        nameZh: '组内预评审与导师把关',
        offsetDays: 14,
        stageId: 'PI_REVIEW',
      },
      {
        nameEn: 'Reproducibility & Portal Upload Check',
        nameZh: '可复现包与双盲格式复核',
        offsetDays: 3,
        stageId: 'PI_REVIEW',
      },
    ],
  },
  {
    id: 'venue-aaai',
    name: 'AAAI 2027',
    tag: 'AAAI 2027',
    url: 'https://aaai.org/',
    defaultLeadId: 'member-student2',
    milestones: structuredClone(STANDARD_PAPER_MILESTONES),
  },
  {
    id: 'venue-mgt-sci',
    name: 'INFORMS Management Science',
    tag: 'Mgt Sci',
    url: 'https://pubsonline.informs.org/journal/mnsc',
    defaultLeadId: 'member-student2',
    milestones: [
      {
        nameEn: 'Identification & Robustness Freeze',
        nameZh: '计量/理论估计与稳健性收敛',
        offsetDays: 60,
        stageId: 'DATA_EXP',
      },
      {
        nameEn: 'Working Paper Draft Complete',
        nameZh: '工作论文完整初稿定稿',
        offsetDays: 35,
        stageId: 'DRAFTING',
      },
      {
        nameEn: 'Advisor Critique & Co-Author Review',
        nameZh: '导师精修批注与修改',
        offsetDays: 14,
        stageId: 'PI_REVIEW',
      },
      {
        nameEn: 'Journal Package Submission',
        nameZh: '投稿材料与附录代码上传',
        offsetDays: 3,
        stageId: 'PI_REVIEW',
      },
    ],
  },
  {
    id: 'venue-aer',
    name: 'American Economic Review (AER)',
    tag: 'AER',
    url: 'https://www.aeaweb.org/journals/aer',
    defaultLeadId: 'member-student3',
    milestones: structuredClone(STANDARD_PAPER_MILESTONES),
  },
  {
    id: 'venue-psych-sci',
    name: 'Psychological Science',
    tag: 'Psych Sci',
    url: 'https://journals.sagepub.com/home/pss',
    defaultLeadId: 'member-student3',
    milestones: structuredClone(STANDARD_PAPER_MILESTONES),
  },
  {
    id: 'venue-grant-milestone',
    name: 'Funded Grant / Policy Deliverable',
    tag: 'Grant Report',
    url: 'https://www.nsf.gov/',
    defaultLeadId: 'member-pi',
    milestones: [
      {
        nameEn: 'Data Collection & Interim Outcomes Audit',
        nameZh: '阶段数据汇总与指标核查',
        offsetDays: 35,
        stageId: 'DATA_EXP',
      },
      {
        nameEn: 'Technical Narrative & Budget Summary',
        nameZh: '进展报告与经费说明撰写',
        offsetDays: 18,
        stageId: 'DRAFTING',
      },
      {
        nameEn: 'PI & Sponsor Alignment Sign-Off',
        nameZh: 'PI 与资助方要求核对签字',
        offsetDays: 5,
        stageId: 'PI_REVIEW',
      },
    ],
  },
];

interface KnownJournalCatalogEntry {
  matchTokens: string[];
  name: string;
  tag: string;
}

const KNOWN_JOURNAL_URL_CATALOG: KnownJournalCatalogEntry[] = [
  { matchTokens: ['nature.com/ncomms', 'ncomms'], name: 'Nature Communications', tag: 'Nature Comms' },
  { matchTokens: ['nature.com/nature', 'nature.com/articles'], name: 'Nature', tag: 'Nature' },
  { matchTokens: ['science.org/journal/science', 'science.org'], name: 'Science', tag: 'Science' },
  { matchTokens: ['cell.com'], name: 'Cell Press Journal', tag: 'Cell' },
  { matchTokens: ['pnas.org'], name: 'Proceedings of the National Academy of Sciences (PNAS)', tag: 'PNAS' },
  { matchTokens: ['neurips.cc'], name: 'NeurIPS', tag: 'NeurIPS' },
  { matchTokens: ['icml.cc'], name: 'ICML', tag: 'ICML' },
  { matchTokens: ['iclr.cc'], name: 'ICLR', tag: 'ICLR' },
  { matchTokens: ['aaai.org'], name: 'AAAI Conference on Artificial Intelligence', tag: 'AAAI' },
  { matchTokens: ['aclweb.org', 'aclanthology.org'], name: 'ACL / Computational Linguistics', tag: 'ACL' },
  { matchTokens: ['pubsonline.informs.org/journal/mnsc', 'mnsc'], name: 'INFORMS Management Science', tag: 'Mgt Sci' },
  { matchTokens: ['aeaweb.org/journals/aer'], name: 'American Economic Review (AER)', tag: 'AER' },
  { matchTokens: ['14678276', 'ajae'], name: 'American Journal of Agricultural Economics (AJAE)', tag: 'AJAE' },
  { matchTokens: ['20405790', 'aepp'], name: 'Applied Economic Perspectives and Policy (AEPP)', tag: 'AEPP' },
  { matchTokens: ['ifam', 'ifamr'], name: 'International Food and Agribusiness Management Review (IFAMR)', tag: 'IFAMR' },
  { matchTokens: ['journals.sagepub.com/home/pss'], name: 'Psychological Science', tag: 'Psych Sci' },
  { matchTokens: ['ieee.org'], name: 'IEEE Transactions / Conference', tag: 'IEEE' },
  { matchTokens: ['dl.acm.org', 'acm.org'], name: 'ACM Digital Library Venue', tag: 'ACM' },
];

/**
 * Validates and normalizes an external journal, conference, or program URL cleanly (`https://` default).
 */
export function normalizeExternalUrl(raw?: string): string | undefined {
  if (!raw || typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return undefined;
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

/**
 * Matches one or more saved venue presets against a project/task's `targetVenue` string.
 */
export function resolveMatchingVenues(
  targetVenue: string | undefined,
  venues: VenuePreset[]
): VenuePreset[] {
  if (!targetVenue || !Array.isArray(venues) || venues.length === 0) return [];
  const rawLower = targetVenue.trim().toLowerCase();
  if (!rawLower) return [];

  const tokens = rawLower
    .split(/[\/,|;]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const matched: VenuePreset[] = [];
  const seen = new Set<string>();

  const scoreMatch = (v: VenuePreset): boolean => {
    const vName = v.name.toLowerCase();
    const vTag = v.tag.toLowerCase();
    if (vName === rawLower || vTag === rawLower) return true;
    for (const tok of tokens) {
      if (tok === vTag || tok === vName) return true;
      if (vTag.length >= 3 && (tok.includes(vTag) || vName.includes(tok))) return true;
    }
    if (vTag.length >= 3 && rawLower.includes(vTag)) return true;
    return false;
  };

  for (const v of venues) {
    if (!seen.has(v.id) && scoreMatch(v)) {
      seen.add(v.id);
      matched.push(v);
    }
  }

  return matched;
}

/**
 * Resolves the primary clickable URL for a `targetVenue` string.
 */
export function resolveVenueUrl(
  targetVenue: string | undefined,
  venues: VenuePreset[],
  explicitUrl?: string
): string | undefined {
  const direct = normalizeExternalUrl(explicitUrl);
  if (direct) return direct;
  const matches = resolveMatchingVenues(targetVenue, venues);
  for (const m of matches) {
    const u = normalizeExternalUrl(m.url);
    if (u) return u;
  }
  return undefined;
}

function inferVenueTitleFromUrl(url: string): { name: string; tag: string } {
  const lower = url.toLowerCase();
  for (const item of KNOWN_JOURNAL_URL_CATALOG) {
    if (item.matchTokens.some((tok) => lower.includes(tok))) {
      return { name: item.name, tag: item.tag };
    }
  }
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname
      .split('/')
      .map((s) => s.trim())
      .filter((s) => s && !/^(journal|journals|core|home|view|overview|index\.html?)$/i.test(s));
    const slug = segments[segments.length - 1] || parsed.hostname.replace(/^www\./, '');
    const cleanedSlug = slug.replace(/\.(html?|xml|php)$/i, '').replace(/[-_]+/g, ' ').trim();
    const title = cleanedSlug
      ? cleanedSlug.replace(/\b\w/g, (ch) => ch.toUpperCase())
      : parsed.hostname;
    const words = title.split(/\s+/).filter((w) => w.length > 2);
    const acronym =
      words.length >= 2
        ? words
            .slice(0, 5)
            .map((w) => w[0].toUpperCase())
            .join('')
        : title.slice(0, 14);
    return { name: title, tag: acronym || 'Venue' };
  } catch {
    return { name: url, tag: 'Venue' };
  }
}

/**
 * Parses pasted journal/conference URLs or `Venue Name | Short Tag | URL` lines into importable presets.
 */
export function parseVenueImportText(
  rawText: string,
  defaultLeadId: string
): VenuePreset[] {
  if (!rawText || typeof rawText !== 'string') return [];
  const lines = rawText
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const imported: VenuePreset[] = [];
  const timestamp = Date.now();

  lines.forEach((line, idx) => {
    const parts = line.split(/\s*\|\s*/).map((p) => p.trim()).filter(Boolean);
    let name = '';
    let tag = '';
    let url: string | undefined;

    if (parts.length >= 3) {
      name = parts[0];
      tag = parts[1];
      url = normalizeExternalUrl(parts[2]);
    } else if (parts.length === 2) {
      const maybeSecondUrl = normalizeExternalUrl(parts[1]);
      if (maybeSecondUrl) {
        name = parts[0];
        url = maybeSecondUrl;
        tag = inferVenueTitleFromUrl(maybeSecondUrl).tag;
      } else {
        name = parts[0];
        tag = parts[1];
      }
    } else {
      const maybeUrl = normalizeExternalUrl(line);
      if (maybeUrl) {
        url = maybeUrl;
        const guessed = inferVenueTitleFromUrl(maybeUrl);
        name = guessed.name;
        tag = guessed.tag;
      } else {
        name = line;
        tag = line.split(/\s+/)[0].slice(0, 14) || 'Venue';
      }
    }

    if (!name) return;
    if (!tag) {
      tag = name.split(/\s+/)[0].slice(0, 14) || 'Venue';
    }

    imported.push({
      id: `venue-imp-${timestamp}-${idx}`,
      name,
      tag,
      url,
      defaultLeadId,
      milestones: structuredClone(STANDARD_PAPER_MILESTONES),
    });
  });

  return imported;
}
