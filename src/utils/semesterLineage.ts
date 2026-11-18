import {
  LabMember,
  ProjectHandoffEntry,
  ProjectInheritanceType,
  ProjectItem,
  TaskItem,
} from '@/types';

export type AcademicSeason = 'SPRING' | 'SUMMER' | 'FALL' | 'WINTER' | 'OTHER';

export interface ParsedAcademicTerm {
  raw: string;
  canonical: string;
  year: number | null;
  season: AcademicSeason;
  seasonOrder: number;
}

const SEASON_ORDER: Record<AcademicSeason, number> = {
  SPRING: 1,
  SUMMER: 2,
  FALL: 3,
  WINTER: 4,
  OTHER: 9,
};

const SEASON_CANONICAL: Record<Exclude<AcademicSeason, 'OTHER'>, string> = {
  SPRING: 'Spring',
  SUMMER: 'Summer',
  FALL: 'Fall',
  WINTER: 'Winter',
};

function normalizeTwoOrFourDigitYear(rawYear: string): number {
  const num = Number(rawYear);
  if (!Number.isFinite(num)) return 2026;
  return rawYear.length <= 2 ? 2000 + num : num;
}

function mapSeasonToken(token: string): Exclude<AcademicSeason, 'OTHER'> | null {
  const lower = token.trim().toLowerCase();
  if (lower === 'spring' || lower === 'sp' || lower === '春') return 'SPRING';
  if (lower === 'summer' || lower === 'su' || lower === 'sum' || lower === '夏') return 'SUMMER';
  if (lower === 'fall' || lower === 'autumn' || lower === 'fa' || lower === '秋') return 'FALL';
  if (lower === 'winter' || lower === 'wi' || lower === '冬') return 'WINTER';
  return null;
}

/**
 * Parses bilingual semester/term strings into North American chronological keys:
 * Spring (1) -> Summer (2) -> Fall (3) -> Winter (4) + Year.
 */
export function parseAcademicTerm(rawTerm: string): ParsedAcademicTerm {
  const cleaned = rawTerm.trim();
  if (!cleaned) {
    return {
      raw: '',
      canonical: 'Unscheduled',
      year: null,
      season: 'OTHER',
      seasonOrder: SEASON_ORDER.OTHER,
    };
  }

  // Pattern 1: "Spring 2026", "Fall '26", "FA26", "SP 2026"
  const enFront = /^(spring|sp|summer|sum|su|fall|autumn|fa|winter|wi)\s*['’\-_/]?\s*(\d{2,4})$/i.exec(
    cleaned
  );
  if (enFront) {
    const season = mapSeasonToken(enFront[1]);
    const year = normalizeTwoOrFourDigitYear(enFront[2]);
    if (season) {
      return {
        raw: cleaned,
        canonical: `${SEASON_CANONICAL[season]} ${year}`,
        year,
        season,
        seasonOrder: SEASON_ORDER[season],
      };
    }
  }

  // Pattern 2: "2026 Fall", "2026-Spring"
  const enBack = /^(\d{2,4})\s*[-_/]?\s*(spring|sp|summer|sum|su|fall|autumn|fa|winter|wi)$/i.exec(
    cleaned
  );
  if (enBack) {
    const year = normalizeTwoOrFourDigitYear(enBack[1]);
    const season = mapSeasonToken(enBack[2]);
    if (season) {
      return {
        raw: cleaned,
        canonical: `${SEASON_CANONICAL[season]} ${year}`,
        year,
        season,
        seasonOrder: SEASON_ORDER[season],
      };
    }
  }

  // Pattern 3: Chinese "2026 春", "2026年秋季", "2026春"
  const zhFront = /^(\d{2,4})\s*年?\s*(春|夏|秋|冬)[季期]?$/.exec(cleaned);
  if (zhFront) {
    const year = normalizeTwoOrFourDigitYear(zhFront[1]);
    const season = mapSeasonToken(zhFront[2]);
    if (season) {
      return {
        raw: cleaned,
        canonical: `${SEASON_CANONICAL[season]} ${year}`,
        year,
        season,
        seasonOrder: SEASON_ORDER[season],
      };
    }
  }

  // Pattern 4: Chinese "秋季 2026" / "春 2026"
  const zhBack = /^(春|夏|秋|冬)[季期]?\s*(\d{2,4})年?$/.exec(cleaned);
  if (zhBack) {
    const season = mapSeasonToken(zhBack[1]);
    const year = normalizeTwoOrFourDigitYear(zhBack[2]);
    if (season) {
      return {
        raw: cleaned,
        canonical: `${SEASON_CANONICAL[season]} ${year}`,
        year,
        season,
        seasonOrder: SEASON_ORDER[season],
      };
    }
  }

  return {
    raw: cleaned,
    canonical: cleaned,
    year: null,
    season: 'OTHER',
    seasonOrder: SEASON_ORDER.OTHER,
  };
}

/**
 * Chronological comparator for semester columns following Spring -> Summer -> Fall + Year.
 */
export function compareAcademicTerms(a: string, b: string): number {
  const pa = parseAcademicTerm(a);
  const pb = parseAcademicTerm(b);

  if (pa.year !== null && pb.year !== null) {
    if (pa.year !== pb.year) return pa.year - pb.year;
    if (pa.seasonOrder !== pb.seasonOrder) return pa.seasonOrder - pb.seasonOrder;
  } else if (pa.year !== null) {
    return -1;
  } else if (pb.year !== null) {
    return 1;
  }

  return pa.canonical.localeCompare(pb.canonical);
}

/**
 * Maps a project's submissionDeadline (or current date) into a canonical academic term.
 */
export function inferTermFromDeadline(deadline?: string, fallbackYear = 2026): string {
  if (deadline) {
    const match = /^(\d{4})-(\d{2})/.exec(deadline.trim());
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      if (month >= 1 && month <= 4) return `Spring ${year}`;
      if (month >= 5 && month <= 7) return `Summer ${year}`;
      return `Fall ${year}`;
    }
  }
  return `Fall ${fallbackYear}`;
}

/**
 * Suggests the next chronological North American semester after a given term.
 */
export function suggestNextAcademicTerm(term: string, includeSummer = false): string {
  const parsed = parseAcademicTerm(term);
  if (parsed.year === null) return 'Spring 2027';
  if (parsed.season === 'SPRING') {
    return `${includeSummer ? 'Summer' : 'Fall'} ${parsed.year}`;
  }
  if (parsed.season === 'SUMMER') {
    return `Fall ${parsed.year}`;
  }
  if (parsed.season === 'FALL' || parsed.season === 'WINTER') {
    return `Spring ${parsed.year + 1}`;
  }
  return `Spring ${parsed.year + 1}`;
}

export type SemesterNodeRoleBadge = 'NEW' | 'CARRIED_OVER' | 'SPINOFF' | 'HANDED_OFF';

export interface SemesterProjectNode {
  nodeId: string;
  projectId: string;
  project: ProjectItem;
  termKey: string;
  termIndex: number;
  entries: ProjectHandoffEntry[];
  badge: SemesterNodeRoleBadge;
  isFirstTermOfProject: boolean;
  isLastTermOfProject: boolean;
  taskCount: number;
  avgProgress: number;
}

export type SemesterLineageEdgeKind = 'handoff' | 'inheritance' | 'shared_dataset';

export interface SemesterLineageEdge {
  id: string;
  kind: SemesterLineageEdgeKind;
  relationType?: ProjectInheritanceType;
  sourceNodeId: string;
  targetNodeId: string;
  sourceProjectId: string;
  targetProjectId: string;
  label: string;
  note?: string;
}

export interface SemesterColumn {
  termKey: string;
  parsed: ParsedAcademicTerm;
  nodes: SemesterProjectNode[];
}

export interface SemesterLineageGraph {
  columns: SemesterColumn[];
  nodesById: Map<string, SemesterProjectNode>;
  edges: SemesterLineageEdge[];
}

function makeNodeId(projectId: string, termKey: string): string {
  return `${projectId}::${termKey}`;
}

function formatHandoffTransitionLabel(
  fromEntries: ProjectHandoffEntry[],
  toEntries: ProjectHandoffEntry[],
  memberMap: Map<string, LabMember>
): string {
  const resolveNames = (entries: ProjectHandoffEntry[]) =>
    Array.from(
      new Set(
        entries
          .map((e) => (e.memberId ? memberMap.get(e.memberId)?.nameEn || e.memberName : e.memberName))
          .filter(Boolean)
      )
    );

  const fromNames = resolveNames(fromEntries);
  const toNames = resolveNames(toEntries);
  if (fromNames.length === 0 && toNames.length === 0) return '';
  if (fromNames.join(', ') === toNames.join(', ')) {
    return toNames.join(' & ');
  }
  return `${fromNames.join(' & ')} -> ${toNames.join(' & ')}`;
}

/**
 * Builds the complete semester-by-semester project lineage graph:
 * - Columns sorted strictly by North American semester chronology (Spring -> Summer -> Fall + Year)
 * - Cross-term handoff edges within each project
 * - Cross-project inheritance / spin-off edges across projects
 * - Optional shared-dataset lineage dashed edges
 */
export function buildSemesterLineageGraph(
  projects: ProjectItem[],
  tasks: TaskItem[],
  members: LabMember[],
  options?: {
    extraTerms?: string[];
    showSharedDatasetLinks?: boolean;
  }
): SemesterLineageGraph {
  const termSet = new Set<string>();
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const projectTermEntries = new Map<string, Map<string, ProjectHandoffEntry[]>>();
  const projectTermsOrdered = new Map<string, string[]>();

  // 1. Collect all referenced terms cleanly per project
  for (const project of projects) {
    const perTerm = new Map<string, ProjectHandoffEntry[]>();
    const handoffs = Array.isArray(project.handoffHistory) ? project.handoffHistory : [];

    if (handoffs.length > 0) {
      for (const entry of handoffs) {
        const canonicalTerm = parseAcademicTerm(entry.term).canonical;
        termSet.add(canonicalTerm);
        const list = perTerm.get(canonicalTerm) || [];
        list.push(entry);
        perTerm.set(canonicalTerm, list);
      }
    } else {
      const inferred = inferTermFromDeadline(project.submissionDeadline);
      const canonicalTerm = parseAcademicTerm(inferred).canonical;
      termSet.add(canonicalTerm);
      const leadName = memberMap.get(project.leadAuthorId)?.nameEn || 'Lead';
      perTerm.set(canonicalTerm, [
        {
          id: `auto-${project.id}`,
          term: canonicalTerm,
          memberId: project.leadAuthorId,
          memberName: leadName,
          status: 'ACTIVE',
        },
      ]);
    }

    if (Array.isArray(project.inheritedFrom)) {
      for (const link of project.inheritedFrom) {
        if (link.fromTerm?.trim()) {
          termSet.add(parseAcademicTerm(link.fromTerm).canonical);
        }
        if (link.toTerm?.trim()) {
          termSet.add(parseAcademicTerm(link.toTerm).canonical);
        }
      }
    }

    projectTermEntries.set(project.id, perTerm);
  }

  for (const extra of options?.extraTerms || []) {
    const clean = extra.trim();
    if (clean) termSet.add(parseAcademicTerm(clean).canonical);
  }

  if (termSet.size === 0) {
    termSet.add('Fall 2026');
  }

  const sortedTerms = Array.from(termSet).sort(compareAcademicTerms);
  const termIndexMap = new Map(sortedTerms.map((termKey, idx) => [termKey, idx]));

  // Task metrics lookup per project
  const taskStatsByProj = new Map<string, { count: number; avgProgress: number }>();
  for (const project of projects) {
    const projTasks = tasks.filter((t) => t.projectId === project.id);
    const avgProgress =
      projTasks.length > 0
        ? Math.round(
            projTasks.reduce((acc, item) => acc + (typeof item.progress === 'number' ? item.progress : 0), 0) /
              projTasks.length
          )
        : 0;
    taskStatsByProj.set(project.id, { count: projTasks.length, avgProgress });
  }

  // 2. Build columns & nodes
  const nodesById = new Map<string, SemesterProjectNode>();
  const columnsMap = new Map<string, SemesterProjectNode[]>(
    sortedTerms.map((termKey) => [termKey, []])
  );

  for (const project of projects) {
    const perTerm = projectTermEntries.get(project.id);
    if (!perTerm) continue;
    const orderedProjTerms = Array.from(perTerm.keys()).sort(compareAcademicTerms);
    projectTermsOrdered.set(project.id, orderedProjTerms);

    const hasInheritanceParent =
      Array.isArray(project.inheritedFrom) &&
      project.inheritedFrom.some((l) => projectMap.has(l.parentProjectId));
    const stats = taskStatsByProj.get(project.id) || { count: 0, avgProgress: 0 };

    orderedProjTerms.forEach((termKey, idx) => {
      const entries = perTerm.get(termKey) || [];
      const isFirst = idx === 0;
      const isLast = idx === orderedProjTerms.length - 1;
      const allHandedOff =
        entries.length > 0 && entries.every((entry) => entry.status === 'HANDED_OFF');

      let badge: SemesterNodeRoleBadge = 'NEW';
      if (!isFirst) {
        badge = 'CARRIED_OVER';
      } else if (hasInheritanceParent) {
        badge = 'SPINOFF';
      } else if (allHandedOff && orderedProjTerms.length === 1) {
        badge = 'HANDED_OFF';
      }

      const node: SemesterProjectNode = {
        nodeId: makeNodeId(project.id, termKey),
        projectId: project.id,
        project,
        termKey,
        termIndex: termIndexMap.get(termKey) ?? 0,
        entries,
        badge,
        isFirstTermOfProject: isFirst,
        isLastTermOfProject: isLast,
        taskCount: stats.count,
        avgProgress: stats.avgProgress,
      };
      nodesById.set(node.nodeId, node);
      columnsMap.get(termKey)?.push(node);
    });
  }

  const columns: SemesterColumn[] = sortedTerms.map((termKey) => ({
    termKey,
    parsed: parseAcademicTerm(termKey),
    nodes: columnsMap.get(termKey) || [],
  }));

  // 3. Build edges: Handoff + Cross-Project Inheritance + Optional Shared Dataset
  const edges: SemesterLineageEdge[] = [];
  const directPairs = new Set<string>();

  for (const project of projects) {
    const orderedTerms = projectTermsOrdered.get(project.id) || [];
    const perTerm = projectTermEntries.get(project.id);
    for (let i = 0; i < orderedTerms.length - 1; i += 1) {
      const fromTerm = orderedTerms[i];
      const toTerm = orderedTerms[i + 1];
      const sourceNodeId = makeNodeId(project.id, fromTerm);
      const targetNodeId = makeNodeId(project.id, toTerm);
      const label = perTerm
        ? formatHandoffTransitionLabel(
            perTerm.get(fromTerm) || [],
            perTerm.get(toTerm) || [],
            memberMap
          )
        : '';

      edges.push({
        id: `ho-edge::${sourceNodeId}::${targetNodeId}`,
        kind: 'handoff',
        sourceNodeId,
        targetNodeId,
        sourceProjectId: project.id,
        targetProjectId: project.id,
        label,
      });
    }

    if (Array.isArray(project.inheritedFrom)) {
      for (const link of project.inheritedFrom) {
        const parentTerms = projectTermsOrdered.get(link.parentProjectId);
        if (!parentTerms || parentTerms.length === 0 || orderedTerms.length === 0) continue;

        const preferredTarget = link.toTerm
          ? parseAcademicTerm(link.toTerm).canonical
          : orderedTerms[0];
        const targetTerm = orderedTerms.includes(preferredTarget)
          ? preferredTarget
          : orderedTerms[0];
        const targetIdx = termIndexMap.get(targetTerm) ?? 0;

        let sourceTerm = link.fromTerm ? parseAcademicTerm(link.fromTerm).canonical : '';
        if (!sourceTerm || !parentTerms.includes(sourceTerm)) {
          const priorTerms = parentTerms.filter((t) => (termIndexMap.get(t) ?? 0) <= targetIdx);
          sourceTerm =
            priorTerms.length > 0 ? priorTerms[priorTerms.length - 1] : parentTerms[0];
        }

        const sourceNodeId = makeNodeId(link.parentProjectId, sourceTerm);
        const targetNodeId = makeNodeId(project.id, targetTerm);
        if (!nodesById.has(sourceNodeId) || !nodesById.has(targetNodeId)) continue;

        directPairs.add(`${link.parentProjectId}->${project.id}`);
        directPairs.add(`${project.id}->${link.parentProjectId}`);

        const relationLabel =
          link.relationType === 'SPINOFF'
            ? 'Spinoff'
            : link.relationType === 'METHOD_OR_DATA'
            ? 'Method / Data'
            : 'Continuation';

        edges.push({
          id: `inh-edge::${link.id}::${sourceNodeId}::${targetNodeId}`,
          kind: 'inheritance',
          relationType: link.relationType,
          sourceNodeId,
          targetNodeId,
          sourceProjectId: link.parentProjectId,
          targetProjectId: project.id,
          label: relationLabel,
          note: link.note,
        });
      }
    }
  }

  // Optional Shared Dataset dotted lineage across distinct projects
  if (options?.showSharedDatasetLinks) {
    const byDataset = new Map<string, SemesterProjectNode[]>();
    for (const node of Array.from(nodesById.values())) {
      if (!node.isFirstTermOfProject) continue;
      const ds = (node.project.sharedDataset || '').trim();
      if (!ds) continue;
      const key = ds.toLowerCase();
      const group = byDataset.get(key) || [];
      group.push(node);
      byDataset.set(key, group);
    }

    for (const [, group] of Array.from(byDataset.entries())) {
      if (group.length < 2) continue;
      const sorted = [...group].sort(
        (a, b) => a.termIndex - b.termIndex || a.project.title.localeCompare(b.project.title)
      );
      const anchor = sorted[0];
      for (let i = 1; i < sorted.length; i += 1) {
        const follower = sorted[i];
        if (directPairs.has(`${anchor.projectId}->${follower.projectId}`)) continue;
        edges.push({
          id: `ds-edge::${anchor.nodeId}::${follower.nodeId}`,
          kind: 'shared_dataset',
          sourceNodeId: anchor.nodeId,
          targetNodeId: follower.nodeId,
          sourceProjectId: anchor.projectId,
          targetProjectId: follower.projectId,
          label: anchor.project.sharedDataset || 'Shared Dataset',
        });
      }
    }
  }

  return { columns, nodesById, edges };
}

/**
 * Cycle-safe graph traversal collecting all upstream ancestors and downstream descendants
 * connected to `focusedProjectId`, so hovering/clicking spotlights its complete lineage.
 */
export function computeFocusedLineageSet(
  focusedProjectId: string | null,
  graph: SemesterLineageGraph
): {
  activeProjectIds: Set<string>;
  activeNodeIds: Set<string>;
  activeEdgeIds: Set<string>;
} {
  const activeProjectIds = new Set<string>();
  const activeNodeIds = new Set<string>();
  const activeEdgeIds = new Set<string>();

  if (!focusedProjectId) {
    return { activeProjectIds, activeNodeIds, activeEdgeIds };
  }

  activeProjectIds.add(focusedProjectId);

  // Walk upstream inheritance ancestors (cycle-safe BFS)
  const upQueue = [focusedProjectId];
  const upVisited = new Set(upQueue);
  while (upQueue.length > 0) {
    const cur = upQueue.shift()!;
    for (const edge of graph.edges) {
      if (edge.kind === 'shared_dataset') continue;
      if (edge.targetProjectId === cur && !upVisited.has(edge.sourceProjectId)) {
        upVisited.add(edge.sourceProjectId);
        activeProjectIds.add(edge.sourceProjectId);
        upQueue.push(edge.sourceProjectId);
      }
    }
  }

  // Walk downstream inheritance descendants (cycle-safe BFS)
  const downQueue = [focusedProjectId];
  const downVisited = new Set(downQueue);
  while (downQueue.length > 0) {
    const cur = downQueue.shift()!;
    for (const edge of graph.edges) {
      if (edge.kind === 'shared_dataset') continue;
      if (edge.sourceProjectId === cur && !downVisited.has(edge.targetProjectId)) {
        downVisited.add(edge.targetProjectId);
        activeProjectIds.add(edge.targetProjectId);
        downQueue.push(edge.targetProjectId);
      }
    }
  }

  // Highlight nodes belonging to active lineage + edges connecting them
  for (const node of Array.from(graph.nodesById.values())) {
    if (activeProjectIds.has(node.projectId)) {
      activeNodeIds.add(node.nodeId);
    }
  }

  for (const edge of graph.edges) {
    const bothInLineage =
      activeProjectIds.has(edge.sourceProjectId) && activeProjectIds.has(edge.targetProjectId);
    const isDirectSharedDatasetPeer =
      edge.kind === 'shared_dataset' &&
      (edge.sourceProjectId === focusedProjectId || edge.targetProjectId === focusedProjectId);

    if (bothInLineage || isDirectSharedDatasetPeer) {
      activeEdgeIds.add(edge.id);
      activeNodeIds.add(edge.sourceNodeId);
      activeNodeIds.add(edge.targetNodeId);
      activeProjectIds.add(edge.sourceProjectId);
      activeProjectIds.add(edge.targetProjectId);
    }
  }

  return { activeProjectIds, activeNodeIds, activeEdgeIds };
}
