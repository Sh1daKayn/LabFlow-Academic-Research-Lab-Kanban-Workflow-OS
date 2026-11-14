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

    const enResult = parseAIDocumentText(AI_SAMPLE_OUTPUT_EN);
    expect(enResult.success).toBe(true);
    expect(enResult.data?.members[0].accessRole).toBe('ADMIN_PI');
  });

  it('returns clear error on malformed JSON payloads', () => {
    const bad = parseAIDocumentText('```json\n{ invalid json }\n```');
    expect(bad.success).toBe(false);
    expect(bad.error).toBeTruthy();
  });
});
