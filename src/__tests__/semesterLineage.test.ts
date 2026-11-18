import { describe, expect, it } from 'vitest';
import {
  buildSemesterLineageGraph,
  compareAcademicTerms,
  computeFocusedLineageSet,
  inferTermFromDeadline,
  parseAcademicTerm,
  suggestNextAcademicTerm,
} from '@/utils/semesterLineage';
import { sanitizeProjectInheritanceLinks, sanitizeProjects } from '@/utils/projectAnalytics';
import { buildCabLabPresetWorkspace } from '@/data/cabLabPreset';
import { ProjectItem } from '@/types';

describe('North American Semester Term Chronology & Parsing', () => {
  it('parses English and Chinese semester names and sorts strictly Spring -> Summer -> Fall + Year', () => {
    expect(parseAcademicTerm('Spring 2026')).toMatchObject({
      canonical: 'Spring 2026',
      year: 2026,
      season: 'SPRING',
      seasonOrder: 1,
    });
    expect(parseAcademicTerm('2026 夏')).toMatchObject({
      canonical: 'Summer 2026',
      year: 2026,
      season: 'SUMMER',
      seasonOrder: 2,
    });
    expect(parseAcademicTerm('FA26')).toMatchObject({
      canonical: 'Fall 2026',
      year: 2026,
      season: 'FALL',
      seasonOrder: 3,
    });
    expect(parseAcademicTerm('2027 春季')).toMatchObject({
      canonical: 'Spring 2027',
      year: 2027,
      season: 'SPRING',
    });

    const unsorted = [
      'Spring 2027',
      'Fall 2026',
      'Spring 2026',
      '2026 夏季',
      '2025 秋季',
    ];
    const sorted = [...unsorted]
      .map((t) => parseAcademicTerm(t).canonical)
      .sort(compareAcademicTerms);

    expect(sorted).toEqual([
      'Fall 2025',
      'Spring 2026',
      'Summer 2026',
      'Fall 2026',
      'Spring 2027',
    ]);
  });

  it('infers terms from deadlines and suggests next chronological terms', () => {
    expect(inferTermFromDeadline('2026-03-15')).toBe('Spring 2026');
    expect(inferTermFromDeadline('2026-06-20')).toBe('Summer 2026');
    expect(inferTermFromDeadline('2026-11-10')).toBe('Fall 2026');

    expect(suggestNextAcademicTerm('Spring 2026')).toBe('Fall 2026');
    expect(suggestNextAcademicTerm('Spring 2026', true)).toBe('Summer 2026');
    expect(suggestNextAcademicTerm('Summer 2026')).toBe('Fall 2026');
    expect(suggestNextAcademicTerm('Fall 2026')).toBe('Spring 2027');
  });
});

describe('Semester Project Lineage Graph, Handoffs & Inheritance', () => {
  it('sanitizes inheritedFrom links and filters self-referential parent edges', () => {
    const cleaned = sanitizeProjectInheritanceLinks(
      [
        { id: '1', parentProjectId: 'p-self', relationType: 'SPINOFF' },
        { id: '2', parentProjectId: 'p-parent', relationType: 'SPINOFF', fromTerm: 'Spring 2026' },
        { id: 'dup', parentProjectId: 'p-parent', relationType: 'SPINOFF', fromTerm: 'Spring 2026' },
      ],
      'p-self'
    );
    expect(cleaned).toHaveLength(1);
    expect(cleaned[0]?.parentProjectId).toBe('p-parent');

    const [sanitizedProj] = sanitizeProjects([
      {
        id: 'p-child',
        title: 'Child Study',
        targetVenue: 'AJAE',
        tag: 'Child',
        status: 'IDEATION',
        leadAuthorId: 'm1',
        piId: 'pi1',
        assets: {},
        inheritedFrom: [{ id: 'x', parentProjectId: 'p-child', relationType: 'CONTINUATION' }],
      } as ProjectItem,
    ]);
    expect(sanitizedProj?.inheritedFrom).toBeUndefined();
  });

  it('constructs chronological columns, cross-term handoffs, spinoff forks, dataset links, and focus subgraphs on CAB Lab preset', () => {
    const preset = buildCabLabPresetWorkspace('2026-W47');
    const graph = buildSemesterLineageGraph(preset.projects, preset.tasks, preset.members, {
      extraTerms: ['Summer 2026', 'Spring 2027'],
      showSharedDatasetLinks: true,
    });

    expect(graph.columns.map((c) => c.termKey)).toEqual([
      'Spring 2026',
      'Summer 2026',
      'Fall 2026',
      'Spring 2027',
    ]);

    // Verify cross-term progression on Sustainability Policy (Kyra Spring 2026 -> Cassidy Fall 2026)
    const policySpringNode = graph.nodesById.get('proj-cab-sustainability-policy::Spring 2026');
    const policyFallNode = graph.nodesById.get('proj-cab-sustainability-policy::Fall 2026');
    expect(policySpringNode?.entries[0]?.memberName).toBe('Kyra');
    expect(policyFallNode?.entries[0]?.memberName).toBe('Cassidy');

    // Verify multiple contributors within the exact same semester collapse onto one node card
    const coLeadGraph = buildSemesterLineageGraph(
      [
        {
          id: 'p-same-term',
          title: 'Dual-Lead Fall Initiative',
          targetVenue: 'AJAE',
          tag: 'DualLead',
          status: 'DRAFTING',
          leadAuthorId: 'm1',
          piId: 'pi1',
          assets: {},
          handoffHistory: [
            { id: 'h1', term: 'Fall 2026', memberName: 'Alice', status: 'CO_LEAD' },
            { id: 'h2', term: '2026 秋', memberName: 'Bob', status: 'CO_LEAD' },
          ],
        },
      ],
      [],
      []
    );
    expect(coLeadGraph.columns).toHaveLength(1);
    expect(coLeadGraph.nodesById.get('p-same-term::Fall 2026')?.entries).toHaveLength(2);

    // Verify cross-term baton handoff edge label (Ryder -> Iris)
    const agSaasEdge = graph.edges.find(
      (e) =>
        e.kind === 'handoff' &&
        e.sourceProjectId === 'proj-cab-ag-service'
    );
    expect(agSaasEdge?.label).toContain('Ryder');
    expect(agSaasEdge?.label).toContain('Iris');

    // Verify cross-project inheritance fork (proj-cab-vuca -> proj-cab-supply-chain)
    const inheritanceEdge = graph.edges.find(
      (e) =>
        e.kind === 'inheritance' &&
        e.sourceProjectId === 'proj-cab-vuca' &&
        e.targetProjectId === 'proj-cab-supply-chain'
    );
    expect(inheritanceEdge).toBeDefined();
    expect(inheritanceEdge?.relationType).toBe('SPINOFF');

    // Verify focus traversal connects VUCA <-> SupplyChain cleanly without pulling unrelated Sustainability Policy
    const focus = computeFocusedLineageSet('proj-cab-supply-chain', graph);
    expect(focus.activeProjectIds.has('proj-cab-vuca')).toBe(true);
    expect(focus.activeProjectIds.has('proj-cab-supply-chain')).toBe(true);
    expect(focus.activeProjectIds.has('proj-cab-sustainability-policy')).toBe(false);
  });
});
