import { describe, expect, it } from 'vitest';
import {
  ENGLISH_FONT_PRESETS,
  CHINESE_FONT_PRESETS,
  buildBilingualFontFamily,
} from '@/utils/theme';
import {
  aggregateProjectsByCategory,
  buildWordCloudTerms,
  getProjectMembers,
  sanitizeProjectHandoffs,
  sanitizeProjects,
} from '@/utils/projectAnalytics';
import {
  buildCabLabImportPackJson,
  buildCabLabPresetWorkspace,
} from '@/data/cabLabPreset';
import { sanitizeWorkspaceData } from '@/lib/store';
import {
  applyTodoToggleToTasks,
  canAcceptWeeklyTodo,
  canAssignWeeklyTodos,
  extractWorkspaceAcceptanceFlags,
  getWeekKey,
  sanitizeWeeklyTodos,
  syncTaskChecklistChangesToTodos,
} from '@/utils/weeklyTodos';
import {
  addChildLogicNode,
  addSiblingLogicNode,
  countLogicTreeStats,
  deleteLogicNode,
  generateInitialLogicTree,
  moveLogicNodeOrder,
  reparentLogicNode,
  updateLogicNode,
} from '@/utils/taskLogicTree';
import { DEFAULT_STAGES, LAB_MEMBERS, INITIAL_PROJECTS, INITIAL_TASKS } from '@/data/mockData';
import { isTaskInPersonalScope } from '@/utils/rbac';
import { ProjectItem, TaskItem, WeeklyTodoItem } from '@/types';

describe('Expanded Typography Presets (12 EN + 12 ZH)', () => {
  it('provides exactly 12 unique English presets and 12 unique Chinese presets including YouYuan', () => {
    expect(ENGLISH_FONT_PRESETS).toHaveLength(12);
    expect(CHINESE_FONT_PRESETS).toHaveLength(12);

    const enIds = new Set(ENGLISH_FONT_PRESETS.map((p) => p.id));
    const zhIds = new Set(CHINESE_FONT_PRESETS.map((p) => p.id));
    expect(enIds.size).toBe(12);
    expect(zhIds.size).toBe(12);
    expect(zhIds.has('youyuan')).toBe(true);

    const stack = buildBilingualFontFamily('georgia', 'youyuan');
    expect(stack).toContain('Georgia');
    expect(stack).toContain('YouYuan');
  });
});

describe('Project Categories, Headcounts & Research Word Cloud', () => {
  it('deduplicates responsible members per project and aggregates unique member counts by category', () => {
    const m1 = LAB_MEMBERS[0];
    const m2 = LAB_MEMBERS[1];
    const m3 = LAB_MEMBERS[2];

    const projects: ProjectItem[] = [
      {
        id: 'p1',
        title: 'Quantum Error Mitigation',
        category: 'AI for Science',
        targetVenue: 'NeurIPS 2027',
        tag: 'QEM',
        status: 'DATA_EXP',
        leadAuthorId: m2.id,
        piId: m1.id,
        memberIds: [m2.id, m3.id],
        assets: {},
      },
      {
        id: 'p2',
        title: 'Molecular Diffusion Sampler',
        category: 'AI for Science',
        targetVenue: 'ICML 2027',
        tag: 'MolDiff',
        status: 'DRAFTING',
        leadAuthorId: m2.id,
        piId: m1.id,
        assets: {},
      },
    ];

    const tasks: TaskItem[] = [
      {
        ...INITIAL_TASKS[0],
        id: 't-cat-1',
        projectId: 'p1',
        projectTag: 'QEM',
        title: 'Zero-Noise Extrapolation Benchmark',
        progress: 60,
        leadAuthor: m2,
        pi: m1,
        tags: ['Quantum', 'Diffusion'],
      },
      {
        ...INITIAL_TASKS[0],
        id: 't-cat-2',
        projectId: 'p2',
        projectTag: 'MolDiff',
        title: 'Equivariant Score Matching',
        progress: 40,
        leadAuthor: m3,
        pi: m1,
        tags: ['Diffusion'],
      },
    ];

    const p1Members = getProjectMembers(projects[0], tasks, LAB_MEMBERS);
    expect(p1Members.map((m) => m.id).sort()).toEqual([m1.id, m2.id, m3.id].sort());

    const summaries = aggregateProjectsByCategory(projects, tasks, LAB_MEMBERS, 'zh');
    expect(summaries).toHaveLength(1);
    expect(summaries[0].category).toBe('AI for Science');
    expect(summaries[0].projects).toHaveLength(2);
    expect(summaries[0].memberCount).toBe(3); // m1, m2, m3 deduplicated
    expect(summaries[0].avgProgress).toBe(50);

    const terms = buildWordCloudTerms(projects, tasks, DEFAULT_STAGES, 'zh');
    const diffusionTerm = terms.find((t) => t.text.toLowerCase() === 'diffusion');
    expect(diffusionTerm).toBeDefined();
    expect(diffusionTerm?.matchedProjectIds).toContain('p1');
    expect(diffusionTerm?.matchedProjectIds).toContain('p2');
  });
});

describe('Weekly To-Do List, Two-Way Checklist Sync & Peer Acceptance Mode', () => {
  it('allows any lab member to perform item acceptance when non-lock peer mode is enabled', () => {
    const sampleTodo: WeeklyTodoItem = {
      id: 'todo-1',
      memberId: LAB_MEMBERS[2].id,
      weekKey: getWeekKey(),
      title: 'Verify calibration curves',
      done: true,
      projectId: INITIAL_PROJECTS[0].id,
      acceptanceStatus: 'SUBMITTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Strict mode: an unrelated student RA cannot verify
    expect(
      canAcceptWeeklyTodo({
        todo: sampleTodo,
        currentUserId: LAB_MEMBERS[3]?.id || 'member-other',
        currentAccessRole: 'STUDENT_RA',
        effectiveIsAdmin: false,
        isAdminUnlocked: false,
        allowPeerAcceptance: false,
      })
    ).toBe(false);

    // Strict mode: designated System Admin can verify across all students
    expect(
      canAcceptWeeklyTodo({
        todo: sampleTodo,
        currentUserId: LAB_MEMBERS[3]?.id || 'member-other',
        currentAccessRole: 'SYS_ADMIN',
        effectiveIsAdmin: false,
        isAdminUnlocked: false,
        allowPeerAcceptance: false,
      })
    ).toBe(true);

    // Non-lock peer acceptance mode: all members can verify each other
    expect(
      canAcceptWeeklyTodo({
        todo: sampleTodo,
        currentUserId: LAB_MEMBERS[3]?.id || 'member-other',
        currentAccessRole: 'STUDENT_RA',
        effectiveIsAdmin: false,
        isAdminUnlocked: false,
        allowPeerAcceptance: true,
      })
    ).toBe(true);
  });

  it('synchronizes completion between WeeklyTodoItem and linked TaskItem checklist bi-directionally', () => {
    const task: TaskItem = {
      ...INITIAL_TASKS[0],
      id: 'task-sync',
      progress: 0,
      checklist: [
        { id: 'chk-1', text: 'Run 5-seed ablation', done: false },
        { id: 'chk-2', text: 'Plot training loss', done: false },
      ],
    };

    const linkedTodo: WeeklyTodoItem = {
      id: 'todo-sync',
      memberId: task.leadAuthor.id,
      weekKey: getWeekKey(),
      title: 'Run 5-seed ablation',
      done: false,
      projectId: task.projectId,
      taskId: task.id,
      checklistItemId: 'chk-1',
      acceptanceStatus: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextTasks = applyTodoToggleToTasks([task], linkedTodo, true);
    expect(nextTasks[0].checklist?.[0].done).toBe(true);
    expect(nextTasks[0].progress).toBe(50);

    const revertedTodos = syncTaskChecklistChangesToTodos([linkedTodo], task.id, [
      { id: 'chk-1', text: 'Run 5-seed ablation (revised)', done: false },
      { id: 'chk-2', text: 'Plot training loss', done: true },
    ]);
    expect(revertedTodos[0].done).toBe(false);
    expect(revertedTodos[0].title).toBe('Run 5-seed ablation (revised)');
    expect(revertedTodos[0].acceptanceStatus).toBe('PENDING');
  });

  it('sanitizes weeklyTodos including assignedById and allowPeerAcceptance flags safely', () => {
    const cleaned = sanitizeWeeklyTodos([
      { id: 'w1', memberId: 'm1', title: 'Draft Intro', done: true, assignedById: 'pi-1' },
      { id: '', memberId: 'm1', title: 'Invalid missing id' },
    ]);
    expect(cleaned).toHaveLength(1);
    expect(cleaned[0].acceptanceStatus).toBe('SUBMITTED');
    expect(cleaned[0].assignedById).toBe('pi-1');

    expect(canAssignWeeklyTodos('ADMIN_PI', false)).toBe(true);
    expect(canAssignWeeklyTodos('SYS_ADMIN', false)).toBe(true);
    expect(canAssignWeeklyTodos('PROJECT_LEAD', false)).toBe(true);
    expect(canAssignWeeklyTodos('STUDENT_RA', false)).toBe(false);
    expect(canAssignWeeklyTodos('STUDENT_RA', true)).toBe(true);
    expect(canAssignWeeklyTodos('AUDITOR_GUEST', false)).toBe(false);

    const extracted = extractWorkspaceAcceptanceFlags({
      allowPeerAcceptance: true,
      weeklyTodos: cleaned,
    });
    expect(extracted.allowPeerAcceptance).toBe(true);
    expect(extracted.weeklyTodos).toHaveLength(1);
  });
});

describe('Task Logic Tree Generation, Editing & Cycle Protection', () => {
  it('generates an initial multi-branch logic tree and supports full CRUD + cycle-safe reparenting', () => {
    const task: TaskItem = {
      ...INITIAL_TASKS[0],
      description: 'Formalize convergence bound. Evaluate on Imagenet-1K benchmark.',
      checklist: [{ id: 'c1', text: 'Run baseline', done: true }],
    };

    const root = generateInitialLogicTree(task, 'zh');
    expect(root.nodeType).toBe('goal');
    expect(root.children).toHaveLength(3);
    expect(countLogicTreeStats(root).total).toBeGreaterThanOrEqual(7);

    const firstBranch = root.children[0];
    const secondBranch = root.children[1];

    const customChild = {
      id: 'node-custom-1',
      label: 'Derive variance Lemma 2',
      nodeType: 'method' as const,
      status: 'todo' as const,
      children: [
        {
          id: 'node-grandchild',
          label: 'Verify Cauchy step',
          nodeType: 'validation' as const,
          status: 'todo' as const,
          children: [],
        },
      ],
    };

    let tree = addChildLogicNode(root, firstBranch.id, customChild);
    tree = addSiblingLogicNode(tree, 'node-custom-1', {
      id: 'node-custom-2',
      label: 'Ablate batch size',
      nodeType: 'experiment',
      status: 'doing',
      children: [],
    });
    tree = updateLogicNode(tree, 'node-custom-2', { status: 'done' });
    tree = moveLogicNodeOrder(tree, 'node-custom-2', 'up');

    const branch1Updated = tree.children.find((c) => c.id === firstBranch.id)!;
    const idx2 = branch1Updated.children.findIndex((c) => c.id === 'node-custom-2');
    const idx1 = branch1Updated.children.findIndex((c) => c.id === 'node-custom-1');
    expect(idx2).toBeLessThan(idx1);

    // Reject moving node into its own grandchild (cycle prevention)
    const cycleAttempt = reparentLogicNode(tree, 'node-custom-1', 'node-grandchild');
    expect(
      cycleAttempt.children.find((c) => c.id === firstBranch.id)?.children.some((c) => c.id === 'node-custom-1')
    ).toBe(true);

    // Valid reparent to secondBranch
    const reparented = reparentLogicNode(tree, 'node-custom-1', secondBranch.id);
    expect(
      reparented.children.find((c) => c.id === secondBranch.id)?.children.some((c) => c.id === 'node-custom-1')
    ).toBe(true);

    // Delete subtree cleanly, but protect root node
    const afterDelete = deleteLogicNode(reparented, 'node-custom-1');
    expect(
      afterDelete.children.find((c) => c.id === secondBranch.id)?.children.some((c) => c.id === 'node-custom-1')
    ).toBe(false);
    expect(deleteLogicNode(afterDelete, afterDelete.id).id).toBe(afterDelete.id);
  });
});

describe('Cross-Term Project Handoffs, Shared Datasets, Research Questions & CAB Lab Preset', () => {
  it('sanitizes handoff timelines & project coordination fields and indexes shared datasets in word cloud', () => {
    const cleaned = sanitizeProjectHandoffs([
      {
        term: ' Spring 2026 ',
        memberName: ' Emma ',
        roleLabel: 'Original Lead',
        phaseSummary: 'Framed Caplan (2001) survey comparison',
        status: 'HANDED_OFF',
      },
      {
        term: 'Fall 2026',
        memberId: 'member-daniel',
        memberName: 'Daniel',
        status: 'INVALID_STATUS',
      },
      { term: '  ', memberName: '' },
    ]);
    expect(cleaned).toHaveLength(2);
    expect(cleaned[0].status).toBe('HANDED_OFF');
    expect(cleaned[1].status).toBe('ACTIVE');

    const [proj] = sanitizeProjects([
      {
        ...INITIAL_PROJECTS[0],
        researchQuestion: '  Do retailers misread producer priorities? ',
        sharedDataset: '  Large Commercial Producer Survey ',
        handoffHistory: cleaned,
      },
    ]);
    expect(proj.researchQuestion).toBe('Do retailers misread producer priorities?');
    expect(proj.sharedDataset).toBe('Large Commercial Producer Survey');
    expect(proj.handoffHistory).toHaveLength(2);

    const terms = buildWordCloudTerms([proj], [], DEFAULT_STAGES, 'en');
    expect(terms.some((t) => t.text === 'Large Commercial Producer Survey')).toBe(true);
    expect(terms.some((t) => t.text.toLowerCase() === 'misread')).toBe(true);
  });

  it('excludes HANDED_OFF alumni without accounts from active roster counts while crediting ACTIVE/CO_LEAD members', () => {
    const [activeLead, coLead] = [LAB_MEMBERS[2], LAB_MEMBERS[3]];
    const project: ProjectItem = {
      id: 'proj-handoff-headcount',
      title: 'Sustainability vs. Regenerative',
      targetVenue: 'Farm Foundation',
      tag: 'Policy',
      status: 'DRAFTING',
      leadAuthorId: activeLead.id,
      piId: LAB_MEMBERS[0].id,
      assets: {},
      handoffHistory: [
        {
          id: 'h1',
          term: 'Spring 2026',
          memberId: LAB_MEMBERS[4].id,
          memberName: LAB_MEMBERS[4].nameEn,
          status: 'HANDED_OFF',
        },
        {
          id: 'h2',
          term: 'Fall 2026',
          memberId: coLead.id,
          memberName: coLead.nameEn,
          status: 'CO_LEAD',
        },
      ],
    };

    const activeMembers = getProjectMembers(project, [], LAB_MEMBERS);
    expect(activeMembers.map((m) => m.id)).toContain(coLead.id);
    expect(activeMembers.map((m) => m.id)).not.toContain(LAB_MEMBERS[4].id);
  });

  it('builds valid CAB Lab 2026 coordination preset with cross-term handoffs and Martin kept as shared support', () => {
    const preset = buildCabLabPresetWorkspace('2026-W47');
    expect(preset.members.some((m) => m.nameEn === 'Trey Malone' && m.accessRole === 'ADMIN_PI')).toBe(
      true
    );
    expect(preset.members.some((m) => m.nameEn === 'Masie' && m.accessRole === 'SYS_ADMIN')).toBe(
      true
    );
    expect(preset.projects).toHaveLength(10);

    // Flagship cross-term Emma -> Daniel & Kyra -> Cassidy co-lead projects
    const retailer = preset.projects.find((p) => p.id === 'proj-cab-retailer-misalignment');
    expect(retailer?.handoffHistory?.map((h) => h.memberName)).toEqual(['Emma', 'Daniel']);
    expect(retailer?.researchQuestion).toContain('sensemaking shortcuts');

    const policy = preset.projects.find((p) => p.id === 'proj-cab-sustainability-policy');
    expect(policy?.handoffHistory?.every((h) => h.status === 'CO_LEAD')).toBe(true);

    // Every CAB Lab project must have >= 1 starter task so Categories and Tasks stay populated
    expect(preset.tasks).toHaveLength(11);
    expect(
      preset.projects.every((p) => preset.tasks.some((t) => t.projectId === p.id))
    ).toBe(true);

    // Personal workspace scope (`MINE`) surfaces PI & project-member tasks cleanly while keeping student isolation
    const treyTasks = preset.tasks.filter((t) =>
      isTaskInPersonalScope(t, 'member-trey', preset.projects)
    );
    expect(treyTasks).toHaveLength(preset.tasks.length);

    const asaTasks = preset.tasks.filter((t) =>
      isTaskInPersonalScope(t, 'member-asa', preset.projects)
    );
    expect(asaTasks.map((t) => t.id)).toContain('task-cab-1');
    expect(asaTasks.map((t) => t.id)).toContain('task-cab-2');
    expect(asaTasks.map((t) => t.id)).not.toContain('task-cab-4');

    // Martin supports clusters as shared technical resource, never project/task owner
    expect(preset.projects.every((p) => p.leadAuthorId !== 'member-martin')).toBe(true);
    expect(preset.tasks.every((t) => t.leadAuthor.id !== 'member-martin')).toBe(true);
    expect(
      preset.directRequests?.some(
        (r) => r.recipientId === 'member-martin' && r.kind === 'BLOCKER_HELP'
      )
    ).toBe(true);

    // Round-trips cleanly through JSON backup & workspace sanitizer
    const json = buildCabLabImportPackJson();
    const parsed = JSON.parse(json);
    const sanitized = sanitizeWorkspaceData(parsed);
    expect(sanitized.projects).toHaveLength(10);
    expect(sanitized.tasks).toHaveLength(11);
    expect(
      sanitized.projects.find((p) => p.id === 'proj-cab-growth-expectations')?.sharedDataset
    ).toBe('Large Commercial Producer Survey');
  });
});
