import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { INITIAL_PROJECTS, INITIAL_RESOURCES, INITIAL_TASKS, LAB_MEMBERS } from '@/data/mockData';
import { getPublicWorkspaceState, saveWorkspaceData } from '@/lib/store';
import { DirectRequest, LabMember } from '@/types';
import {
  assetLinksToEditableRows,
  editableRowsToAssetLinks,
  extractNormalizedAssetEntries,
  sanitizeAssetLinks,
} from '@/utils/assets';
import {
  computeMemberWorkloadMap,
  findDuplicateMemberGroups,
  findMatchingMembersByName,
} from '@/utils/memberWorkload';
import {
  DEFAULT_OUTREACH_TRACKS,
  matchesProjectWorkshopFilter,
  normalizeWorkshopTargetDate,
  normalizeWorkshopTranslationStatus,
  sanitizeOutreachTracks,
  sanitizeWorkshopPrograms,
} from '@/utils/outreachTracks';
import {
  DEFAULT_UNIVERSAL_VENUES,
  normalizeExternalUrl,
  parseVenueImportText,
  resolveVenueUrl,
} from '@/utils/venues';

describe('Universal v2 Research Workflow Features', () => {
  it('normalizes venue URLs securely and batch-parses pasted venue URLs', () => {
    expect(normalizeExternalUrl('javascript:alert(1)')).toBeUndefined();
    expect(normalizeExternalUrl('data:text/html,hi')).toBeUndefined();
    expect(normalizeExternalUrl('pubsonline.informs.org/journal/mnsc')).toBe(
      'https://pubsonline.informs.org/journal/mnsc'
    );

    const parsed = parseVenueImportText(
      [
        'https://www.nature.com/ncomms/',
        'Quarterly Journal of Economics | https://academic.oup.com/qje',
        'ICML 2027 | ICML | icml.cc',
      ].join('\n'),
      'member-student1'
    );

    expect(parsed).toHaveLength(3);
    expect(parsed[0].name).toBe('Nature Communications');
    expect(parsed[0].tag).toBe('Nature Comms');
    expect(parsed[1].name).toBe('Quarterly Journal of Economics');
    expect(parsed[1].url).toBe('https://academic.oup.com/qje');
    expect(parsed[2].tag).toBe('ICML');
    expect(parsed[2].url).toBe('https://icml.cc/');

    expect(
      resolveVenueUrl('NeurIPS 2027', DEFAULT_UNIVERSAL_VENUES, 'https://custom.org/paper')
    ).toBe('https://custom.org/paper');
    expect(resolveVenueUrl('NeurIPS 2027', DEFAULT_UNIVERSAL_VENUES)).toBe('https://neurips.cc/');
  });

  it('round-trips standard and custom asset links cleanly while sanitizing unsafe URLs', () => {
    const sanitized = sanitizeAssetLinks({
      overleaf: 'overleaf.com/project/demo',
      github: 'javascript:void(0)',
      customLinks: [
        { id: 'c1', label: 'Qualtrics / Survey', url: 'qualtrics.com/jfe/demo' },
        { id: 'c2', label: 'Bad Script', url: 'javascript:alert(1)' },
        { id: 'c3', label: 'Pre-registration', url: 'https://osf.io/abcd' },
      ],
    });

    expect(sanitized.overleaf).toBe('https://overleaf.com/project/demo');
    expect(sanitized.github).toBeUndefined();
    expect(sanitized.customLinks).toHaveLength(2);

    const rows = assetLinksToEditableRows(sanitized);
    expect(rows.map((r) => r.label)).toEqual(['Overleaf', 'Qualtrics / Survey', 'Pre-registration']);

    const rebuilt = editableRowsToAssetLinks([
      ...rows,
      { id: 'c4', label: 'IRB / Protocol', url: 'https://irb.university.edu/123' },
    ]);
    expect(rebuilt.overleaf).toBe('https://overleaf.com/project/demo');
    expect(rebuilt.customLinks?.map((c) => c.label)).toEqual([
      'Qualtrics / Survey',
      'Pre-registration',
      'IRB / Protocol',
    ]);
    expect(extractNormalizedAssetEntries(rebuilt)).toHaveLength(4);
  });

  it('manages customizable outreach tracks, translation status, and project filter matching', () => {
    expect(sanitizeOutreachTracks(undefined)).toEqual([...DEFAULT_OUTREACH_TRACKS]);
    expect(sanitizeOutreachTracks([])).toEqual([...DEFAULT_OUTREACH_TRACKS]);
    expect(sanitizeOutreachTracks(['  Clinical Trial  ', 'clinical trial', 'Policy Brief'])).toEqual([
      'Clinical Trial',
      'Policy Brief',
    ]);

    expect(normalizeWorkshopTranslationStatus(' in_prep ')).toBe('IN_PREP');
    expect(normalizeWorkshopTranslationStatus('INVALID')).toBeUndefined();
    expect(normalizeWorkshopTargetDate('2026-12-15T10:00:00Z')).toBe('2026-12-15');
    expect(normalizeWorkshopTargetDate('invalid')).toBeUndefined();

    const projectWithTracks = {
      workshopPrograms: sanitizeWorkshopPrograms(['Policy Brief & Public Outreach']),
    };
    const projectWithoutTracks = { workshopPrograms: [] };

    expect(matchesProjectWorkshopFilter(projectWithTracks, 'ALL')).toBe(true);
    expect(matchesProjectWorkshopFilter(projectWithTracks, 'Policy Brief & Public Outreach')).toBe(true);
    expect(matchesProjectWorkshopFilter(projectWithoutTracks, 'UNLINKED')).toBe(true);
    expect(matchesProjectWorkshopFilter(projectWithTracks, 'UNLINKED')).toBe(false);
  });

  it('detects duplicate member names case-insensitively and computes accurate workload summaries', () => {
    const duplicateMembers: LabMember[] = [
      ...LAB_MEMBERS,
      {
        ...LAB_MEMBERS[2],
        id: 'member-student1-dup',
        nameEn: '  student   1 ',
      },
    ];

    expect(findMatchingMembersByName(duplicateMembers, 'Student 1').map((m) => m.id)).toEqual([
      'member-student1',
      'member-student1-dup',
    ]);

    const dupGroups = findDuplicateMemberGroups(duplicateMembers);
    expect(dupGroups).toHaveLength(1);
    expect(dupGroups[0].members.map((m) => m.id)).toEqual([
      'member-student1',
      'member-student1-dup',
    ]);

    const openReq: DirectRequest = {
      id: 'req-w1',
      kind: 'REVIEW',
      title: 'Please check manuscript proof',
      content: 'Ready for PI pass.',
      senderId: 'member-student2',
      recipientId: 'member-pi',
      visibility: 'PRIVATE',
      status: 'OPEN',
      replies: [],
      createdAt: '2026-11-10T00:00:00Z',
      updatedAt: '2026-11-10T00:00:00Z',
    };

    const workload = computeMemberWorkloadMap(LAB_MEMBERS, INITIAL_PROJECTS, INITIAL_TASKS, [openReq]);
    expect(workload['member-student2'].blockedCount).toBe(1);
    expect(workload['member-pi'].escalatedBlockerCount).toBe(1);
    expect(workload['member-pi'].openRequestsToMeCount).toBe(1);
    expect(workload['member-pi'].attentionCount).toBe(2);
    expect(INITIAL_RESOURCES.some((r) => r.type === 'EQUIPMENT')).toBe(true);
  });
});

describe('Workspace Persistence of Universal v2 Fields', () => {
  let tempDir = '';
  const prevDataDir = process.env.LABFLOW_DATA_DIR;
  const prevDatabaseUrl = process.env.DATABASE_URL;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'labflow-v2-'));
    process.env.LABFLOW_DATA_DIR = tempDir;
    delete process.env.DATABASE_URL;
  });

  afterAll(async () => {
    if (prevDataDir !== undefined) {
      process.env.LABFLOW_DATA_DIR = prevDataDir;
    } else {
      delete process.env.LABFLOW_DATA_DIR;
    }
    if (prevDatabaseUrl !== undefined) {
      process.env.DATABASE_URL = prevDatabaseUrl;
    }
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('persists custom outreachTracks, targetVenueUrl, and customAssets across save/load cycle', async () => {
    const initial = await getPublicWorkspaceState();
    expect(initial.data.outreachTracks).toEqual([...DEFAULT_OUTREACH_TRACKS]);

    const updatedProject = {
      ...initial.data.projects[0],
      targetVenueUrl: 'https://www.science.org/',
      workshopPrograms: ['Clinical Translation Track'],
      workshopTranslationStatus: 'WORKSHOP_READY' as const,
      workshopTargetDate: '2027-02-01',
    };

    const updatedTask = {
      ...initial.data.tasks[0],
      targetVenueUrl: 'https://www.science.org/',
      assets: {
        ...initial.data.tasks[0].assets,
        customLinks: [{ id: 'cl-v2', label: 'Lab Notebook', url: 'https://benchling.com/demo' }],
      },
    };

    const saved = await saveWorkspaceData(
      {
        ...initial.data,
        outreachTracks: ['Clinical Translation Track', 'Open-Source Toolkit'],
        projects: [updatedProject, ...initial.data.projects.slice(1)],
        tasks: [updatedTask, ...initial.data.tasks.slice(1)],
      },
      initial.revision
    );

    expect(saved.conflict).toBe(false);
    expect(saved.data.outreachTracks).toEqual([
      'Clinical Translation Track',
      'Open-Source Toolkit',
    ]);
    expect(saved.data.projects[0].targetVenueUrl).toBe('https://www.science.org/');
    expect(saved.data.projects[0].workshopPrograms).toEqual(['Clinical Translation Track']);
    expect(saved.data.projects[0].workshopTranslationStatus).toBe('WORKSHOP_READY');
    expect(saved.data.tasks[0].assets.customLinks).toHaveLength(1);
  });
});
