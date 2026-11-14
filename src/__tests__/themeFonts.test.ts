import { describe, expect, it } from 'vitest';
import {
  buildBilingualFontFamily,
  CHINESE_FONT_PRESETS,
  ENGLISH_FONT_PRESETS,
  sanitizeCustomFontFamily,
} from '@/utils/theme';

describe('Bilingual Font Customization Utilities', () => {
  it('places English preset first and Chinese preset second in CSS stack', () => {
    const css = buildBilingualFontFamily('times', 'songti');
    expect(css.startsWith("'Times New Roman'")).toBe(true);
    expect(css).toContain("'Songti SC'");
    expect(css.endsWith('serif')).toBe(true);

    const sansCss = buildBilingualFontFamily('geist', 'heiti');
    expect(sansCss.startsWith('var(--font-geist-sans)')).toBe(true);
    expect(sansCss).toContain("'Source Han Sans SC'");
    expect(sansCss.endsWith('sans-serif')).toBe(true);
  });

  it('sanitizes custom font names cleanly and removes CSS injection chars', () => {
    expect(sanitizeCustomFontFamily('LXGW WenKai')).toBe("'LXGW WenKai'");
    expect(sanitizeCustomFontFamily('  "Source Han Serif SC", sans-serif  ')).toBe(
      "'Source Han Serif SC', sans-serif"
    );
    expect(sanitizeCustomFontFamily('Arial; color: red; {}')).toBe("'Arial color red'");
    expect(sanitizeCustomFontFamily(';;;')).toBe('');
  });

  it('falls back safely when custom font input is blank while keeping CJK fallback', () => {
    const blankCustom = buildBilingualFontFamily('custom', 'custom', '   ', '');
    expect(blankCustom).toContain(ENGLISH_FONT_PRESETS[0].stack);
    expect(blankCustom).toContain(CHINESE_FONT_PRESETS[0].stack);

    const customZhOnly = buildBilingualFontFamily('georgia', 'custom', '', '霞鹜文楷');
    expect(customZhOnly.startsWith('Georgia')).toBe(true);
    expect(customZhOnly).toContain("'霞鹜文楷', 'PingFang SC', 'Microsoft YaHei'");
    expect(customZhOnly.endsWith('serif')).toBe(true);
  });
});
