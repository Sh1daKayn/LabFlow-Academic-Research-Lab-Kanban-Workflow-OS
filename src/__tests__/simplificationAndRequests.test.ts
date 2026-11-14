import { describe, expect, it } from 'vitest';
import {
  sha256Hex,
  hashMemberPin,
  verifyMemberPin,
  hasMemberPin,
} from '@/utils/pin';
import {
  WORK_CATEGORIES,
  WORK_CATEGORY_META,
  normalizeWorkCategory,
  resolveProjectWorkCategory,
  resolveTaskWorkCategory,
  getWorkCategoryLabel,
} from '@/utils/workCategory';
import {
  DIRECT_REQUEST_KINDS,
  canViewDirectRequest,
  sanitizeDirectRequests,
} from '@/utils/directRequests';
import {
  ALL_VIEW_MODES,
  DEFAULT_STUDENT_VIEWS,
  isValidViewMode,
  sanitizePreferredViews,
  resolveMemberDefaultView,
} from '@/utils/viewPreferences';
import { DirectRequest, ProjectItem, TaskItem } from '@/types';

describe('Personal PIN hashing & verification (HTTP LAN safe)', () => {
  it('computes deterministic NIST SHA-256 hex digest for "abc"', () => {
    expect(sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    );
  });

  it('hashes PIN with random salt and verifies matching vs wrong PIN', () => {
    const h1 = hashMemberPin('2026');
    const h2 = hashMemberPin('2026');
    expect(h1.startsWith('sha256$')).toBe(true);
    expect(h1).not.toBe(h2);
    expect(verifyMemberPin('2026', h1)).toBe(true);
    expect(verifyMemberPin(' 2026 ', h1)).toBe(true);
    expect(verifyMemberPin('9999', h1)).toBe(false);
    expect(verifyMemberPin('', h1)).toBe(false);
  });

  it('supports legacy plaintext PIN verification and detects unset PIN', () => {
    expect(verifyMemberPin('1234', '1234')).toBe(true);
    expect(verifyMemberPin('0000', '1234')).toBe(false);
    expect(hasMemberPin({ pin: 'sha256$a$b' })).toBe(true);
    expect(hasMemberPin({ pin: '   ' })).toBe(false);
    expect(hasMemberPin(undefined)).toBe(false);
  });
});

describe('Three-category work classification (论文 / 纵向科研项目 / 横向企业项目)', () => {
  it('exposes exactly the 3 distinct categories and labels', () => {
    expect(WORK_CATEGORIES).toEqual([
      'PAPER',
      'VERTICAL_PROJECT',
      'HORIZONTAL_PROJECT',
    ]);
    expect(WORK_CATEGORY_META.PAPER.labelZh).toBe('学术论文');
    expect(WORK_CATEGORY_META.VERTICAL_PROJECT.labelZh).toBe('纵向科研项目');
    expect(WORK_CATEGORY_META.HORIZONTAL_PROJECT.labelZh).toBe('横向企业项目');
    expect(getWorkCategoryLabel('HORIZONTAL_PROJECT', 'zh', true)).toBe('横向项目');
  });

  it('normalizes unknown categories safely and inherits from parent project', () => {
    expect(normalizeWorkCategory('UNKNOWN')).toBe('PAPER');
    expect(normalizeWorkCategory('HORIZONTAL_PROJECT')).toBe('HORIZONTAL_PROJECT');

    const projects: Pick<ProjectItem, 'id' | 'workCategory'>[] = [
      { id: 'p-vert', workCategory: 'VERTICAL_PROJECT' },
      { id: 'p-horiz', workCategory: 'HORIZONTAL_PROJECT' },
    ];
    expect(resolveProjectWorkCategory(projects[1])).toBe('HORIZONTAL_PROJECT');

    const inheritedTask: Pick<TaskItem, 'workCategory' | 'projectId'> = {
      projectId: 'p-horiz',
    };
    const explicitTask: Pick<TaskItem, 'workCategory' | 'projectId'> = {
      projectId: 'p-vert',
      workCategory: 'PAPER',
    };
    expect(resolveTaskWorkCategory(inheritedTask, projects)).toBe('HORIZONTAL_PROJECT');
    expect(resolveTaskWorkCategory(explicitTask, projects)).toBe('PAPER');
  });
});

describe('1-on-1 DirectRequests & private/public visibility isolation', () => {
  const privateReq: DirectRequest = {
    id: 'req-1',
    kind: 'REVIEW',
    title: '请PI单独审阅企业节点报告',
    content: '附件已更新',
    senderId: 'stu-1',
    recipientId: 'pi-1',
    visibility: 'PRIVATE',
    status: 'OPEN',
    replies: [],
    createdAt: '2026-11-14T00:00:00.000Z',
    updatedAt: '2026-11-14T00:00:00.000Z',
  };

  const publicReq: DirectRequest = {
    ...privateReq,
    id: 'req-2',
    visibility: 'PUBLIC',
  };

  it('keeps PRIVATE 1-on-1 requests strictly hidden from peers even in PUBLIC_LAB scope', () => {
    expect(canViewDirectRequest(privateReq, 'stu-1', 'MINE')).toBe(true);
    expect(canViewDirectRequest(privateReq, 'pi-1', 'MINE')).toBe(true);
    expect(canViewDirectRequest(privateReq, 'stu-2', 'MINE')).toBe(false);
    expect(canViewDirectRequest(privateReq, 'stu-2', 'PUBLIC_LAB')).toBe(false);
  });

  it('isolates PUBLIC requests in MINE scope and reveals them in PUBLIC_LAB scope', () => {
    expect(canViewDirectRequest(publicReq, 'stu-2', 'MINE')).toBe(false);
    expect(canViewDirectRequest(publicReq, 'stu-1', 'MINE')).toBe(true);
    expect(canViewDirectRequest(publicReq, 'stu-2', 'PUBLIC_LAB')).toBe(true);
  });

  it('sanitizes persisted directRequests safely and ignores malformed entries', () => {
    expect(DIRECT_REQUEST_KINDS.length).toBeGreaterThanOrEqual(5);
    const cleaned = sanitizeDirectRequests([
      {
        id: 'ok-1',
        kind: 'BAD_KIND',
        senderId: 'stu-1',
        recipientId: 'pi-1',
        title: '测试申请',
        visibility: 'PUBLIC',
        status: 'BAD_STATUS',
        workCategory: 'HORIZONTAL_PROJECT',
        replies: [{ authorId: 'pi-1', content: '收到' }, { content: '   ' }],
      },
      { senderId: 'stu-1', title: 'Missing recipientId' },
      null,
    ]);
    expect(cleaned).toHaveLength(1);
    expect(cleaned[0].kind).toBe('CHAT');
    expect(cleaned[0].status).toBe('OPEN');
    expect(cleaned[0].visibility).toBe('PUBLIC');
    expect(cleaned[0].workCategory).toBe('HORIZONTAL_PROJECT');
    expect(cleaned[0].replies).toHaveLength(1);
    expect(cleaned[0].replies[0].content).toBe('收到');
  });
});

describe('Customizable student initial view preferences', () => {
  it('defaults students to focused 3-view workspace and validates views', () => {
    expect(DEFAULT_STUDENT_VIEWS).toEqual(['kanban', 'todos', 'requests']);
    expect(ALL_VIEW_MODES).toContain('requests');
    expect(isValidViewMode('requests')).toBe(true);
    expect(isValidViewMode('nonexistent')).toBe(false);
  });

  it('deduplicates and falls back cleanly on invalid or empty preferredViews', () => {
    expect(sanitizePreferredViews(['todos', 'todos', 'invalid', 'gantt'])).toEqual([
      'todos',
      'gantt',
    ]);
    expect(sanitizePreferredViews([])).toEqual(DEFAULT_STUDENT_VIEWS);
    expect(
      resolveMemberDefaultView({
        preferredViews: ['todos', 'requests'],
        defaultView: 'requests',
      })
    ).toBe('requests');
    expect(
      resolveMemberDefaultView({
        preferredViews: ['todos', 'requests'],
        defaultView: 'kanban',
      })
    ).toBe('kanban');
  });
});
