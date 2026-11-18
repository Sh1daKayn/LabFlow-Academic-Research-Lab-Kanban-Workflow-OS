import { describe, expect, it } from 'vitest';
import {
  AI_SAMPLE_OUTPUT_EN,
  AI_SAMPLE_OUTPUT_ZH,
  extractJsonFromText,
  parseAIDocumentText,
} from '@/utils/aiDocumentParser';

describe('AI Document Parser', () => {
  it('extracts JSON cleanly from fenced code blocks, prose wrappers, and trailing commas', () => {
    const fenced = 'Here is the plan:\n```json\n{"members": [], "tasks": [],}\n```\nHope this helps!';
    expect(extractJsonFromText(fenced)).toBe('{"members": [], "tasks": []}');

    const prose = 'Sure! {"members": [], "projects": []} Done.';
    expect(extractJsonFromText(prose)).toBe('{"members": [], "projects": []}');
    expect(extractJsonFromText('No JSON here')).toBe('No JSON here');
  });

  it('parses Chinese & English AI sample exports with offline inline SVG avatars', () => {
    const zhResult = parseAIDocumentText(AI_SAMPLE_OUTPUT_ZH);
    expect(zhResult.success).toBe(true);
    expect(zhResult.data?.members.length).toBeGreaterThan(0);
    expect(zhResult.data?.projects.length).toBeGreaterThan(0);
    expect(zhResult.data?.tasks.length).toBeGreaterThan(0);

    zhResult.data?.members.forEach((m) => {
      expect(m.avatar).toMatch(/^data:image\/svg\+xml/);
    });

    const enResult = parseAIDocumentText(AI_SAMPLE_OUTPUT_EN, [], [], [], 'en');
    expect(enResult.success).toBe(true);
    expect(enResult.data?.members[0].accessRole).toBe('ADMIN_PI');
    expect(enResult.data?.members[0].nameEn).toBe('Prof. Eleanor Vance');
    expect(enResult.data?.projects[0].leadAuthorName).toBe('Alex Rivera');
    expect(enResult.data?.tasks[0].leadAuthorName).toBe('Alex Rivera');
  });

  it('returns clear localized errors on malformed JSON payloads', () => {
    const badZh = parseAIDocumentText('```json\n{ invalid json }\n```', [], [], [], 'zh');
    expect(badZh.success).toBe(false);
    expect(badZh.error).toContain('JSON');

    const badEn = parseAIDocumentText('```json\n{ invalid json }\n```', [], [], [], 'en');
    expect(badEn.success).toBe(false);
    expect(badEn.error).toContain('Invalid JSON');
    expect(badEn.error).not.toMatch(/[\u4e00-\u9fff]/);
  });
});
