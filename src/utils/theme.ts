import { AccentColor, ChineseFontPreset, EnglishFontPreset } from '@/types';

export interface FontPresetMeta<T extends string> {
  id: T;
  nameZh: string;
  nameEn: string;
  descZh: string;
  descEn: string;
  stack: string;
}

export const ENGLISH_FONT_PRESETS: FontPresetMeta<Exclude<EnglishFontPreset, 'custom'>>[] = [
  {
    id: 'times',
    nameZh: 'Times New Roman',
    nameEn: 'Times New Roman',
    descZh: '国际期刊标准衬线体',
    descEn: 'Publication serif standard',
    stack: "'Times New Roman', Times, 'Liberation Serif'",
  },
  {
    id: 'georgia',
    nameZh: 'Georgia 衬线',
    nameEn: 'Georgia Serif',
    descZh: '屏幕长文优雅耐读',
    descEn: 'Warm screen editorial serif',
    stack: "Georgia, 'Nimbus Roman', Cambria",
  },
  {
    id: 'palatino',
    nameZh: 'Palatino 典雅',
    nameEn: 'Palatino Antiqua',
    descZh: '学位论文/专著质感',
    descEn: 'Monograph classic serif',
    stack: "'Palatino Linotype', 'Book Antiqua', Palatino",
  },
  {
    id: 'geist',
    nameZh: 'Geist Sans（内置）',
    nameEn: 'Geist Sans (Bundled)',
    descZh: '现代科研界面无衬线',
    descEn: 'Built-in modern UI sans',
    stack: "var(--font-geist-sans), 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI'",
  },
  {
    id: 'system-sans',
    nameZh: 'Inter / 系统无衬线',
    nameEn: 'Inter / System Sans',
    descZh: 'Linear 风格利落现代',
    descEn: 'Clean crisp workspace sans',
    stack: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
  },
  {
    id: 'jetbrains',
    nameZh: 'Geist / JetBrains 等宽',
    nameEn: 'Geist / JetBrains Mono',
    descZh: '算法工程数值精准对齐',
    descEn: 'Technical tabular monospace',
    stack: "var(--font-geist-mono), 'JetBrains Mono', 'Fira Code', Consolas",
  },
];

export interface ChineseFontPresetMeta extends FontPresetMeta<Exclude<ChineseFontPreset, 'custom'>> {
  genericFallback: 'serif' | 'sans-serif';
}

export const CHINESE_FONT_PRESETS: ChineseFontPresetMeta[] = [
  {
    id: 'yahei-pingfang',
    nameZh: '苹方 / 微软雅黑',
    nameEn: 'PingFang / YaHei',
    descZh: '默认高清晰跨平台正文字体',
    descEn: 'Crisp cross-platform default',
    stack: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', 'WenQuanYi Micro Hei'",
    genericFallback: 'sans-serif',
  },
  {
    id: 'songti',
    nameZh: '宋体 / 思源宋体',
    nameEn: 'Songti / Noto Serif SC',
    descZh: '中文学术期刊正统排版',
    descEn: 'Chinese academic paper serif',
    stack: "'Songti SC', 'SimSun', 'NSimSun', 'Noto Serif SC', 'Source Han Serif SC', 'STSong'",
    genericFallback: 'serif',
  },
  {
    id: 'kaiti',
    nameZh: '楷体 / 华文楷体',
    nameEn: 'Kaiti / STKaiti',
    descZh: '文稿笔记与人文典雅风格',
    descEn: 'Classical humanist script',
    stack: "'Kaiti SC', 'KaiTi', 'STKaiti', 'LXGW WenKai', 'BiauKai'",
    genericFallback: 'serif',
  },
  {
    id: 'fangsong',
    nameZh: '仿宋 / 华文仿宋',
    nameEn: 'FangSong / Official',
    descZh: '国自然标书与公文体例',
    descEn: 'Grant proposal & formal doc',
    stack: "'FangSong', 'STFangsong', 'FangSong_GB2312'",
    genericFallback: 'serif',
  },
  {
    id: 'heiti',
    nameZh: '黑体 / 思源黑体',
    nameEn: 'Heiti / Noto Sans SC',
    descZh: '扁平现代高辨识度屏显',
    descEn: 'Modern geometric CJK sans',
    stack: "'PingFang SC', 'Source Han Sans SC', 'Noto Sans CJK SC', 'Heiti SC', 'SimHei'",
    genericFallback: 'sans-serif',
  },
  {
    id: 'system-zh',
    nameZh: '系统原生字体',
    nameEn: 'System Native UI',
    descZh: '随当前操作系统默认风格',
    descEn: 'Follow OS native font stack',
    stack: "system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei'",
    genericFallback: 'sans-serif',
  },
];

const GENERIC_CSS_FAMILIES = new Set([
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  '-apple-system',
  'ui-sans-serif',
  'ui-serif',
  'ui-monospace',
]);

/**
 * Sanitizes a user-typed font family string (single name or comma-separated list)
 * to prevent malformed CSS declarations while preserving CJK & multi-word font names.
 */
export function sanitizeCustomFontFamily(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  const cleaned = raw.replace(/[;{}:<>\\/\r\n]/g, '').trim();
  if (!cleaned) return '';

  const parts = cleaned
    .split(',')
    .map((part) => part.replace(/['"`]/g, '').trim())
    .filter(Boolean)
    .map((name) => (GENERIC_CSS_FAMILIES.has(name.toLowerCase()) ? name : `'${name}'`));

  return parts.join(', ');
}

/**
 * Combines English (placed first for Latin/numeric glyphs) and Chinese (CJK fallback)
 * font selections into a single deterministic CSS font-family stack.
 */
export function buildBilingualFontFamily(
  englishPreset: EnglishFontPreset,
  chinesePreset: ChineseFontPreset,
  customEnglish = '',
  customChinese = ''
): string {
  const defaultEn = ENGLISH_FONT_PRESETS[0];
  const defaultZh = CHINESE_FONT_PRESETS[0];

  const matchedEn = ENGLISH_FONT_PRESETS.find((item) => item.id === englishPreset);
  const customEnStack = englishPreset === 'custom' ? sanitizeCustomFontFamily(customEnglish) : '';
  const enStack = customEnStack || matchedEn?.stack || defaultEn.stack;

  const matchedZh = CHINESE_FONT_PRESETS.find((item) => item.id === chinesePreset);
  const customZhStack = chinesePreset === 'custom' ? sanitizeCustomFontFamily(customChinese) : '';
  const zhStack = customZhStack
    ? `${customZhStack}, 'PingFang SC', 'Microsoft YaHei'`
    : matchedZh?.stack || defaultZh.stack;

  const useSerifFallback =
    matchedZh?.genericFallback === 'serif' ||
    englishPreset === 'times' ||
    englishPreset === 'georgia' ||
    englishPreset === 'palatino';

  const generic = useSerifFallback ? 'serif' : 'sans-serif';
  return `${enStack}, ${zhStack}, ${generic}`;
}

export const ACCENT_MAP: Record<string, string> = {
  purdue: '#C28E0E',
  oxford: '#1e40af',
  cardinal: '#8c1515',
  cambridge: '#0f766e',
  crimson: '#991b1b',
  indigo: '#6366f1',
  cyan: '#06b6d4',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  violet: '#8b5cf6',
};

export function resolveAccentHex(accentColor: AccentColor): string {
  return ACCENT_MAP[accentColor] || (accentColor.startsWith('#') ? accentColor : '#6366f1');
}

export function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(99, 102, 241, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function hexToHsl(hex: string): [number, number, number] {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return [240, 70, 60];
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hue = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        hue = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        hue = (b - r) / d + 2;
        break;
      case b:
        hue = (r - g) / d + 4;
        break;
    }
    hue *= 60;
  }
  return [Math.round(hue), Math.round(s * 100), Math.round(l * 100)];
}

export function computeThemeCssVariables(accentColor: AccentColor): Record<string, string> {
  const hex = resolveAccentHex(accentColor);
  const [hue, sat] = hexToHsl(hex);
  const darkSat = Math.min(Math.max(Math.round(sat * 0.38), 16), 30);
  const lightSat = Math.min(Math.max(Math.round(sat * 0.32), 14), 28);

  return {
    '--lab-accent': hex,
    '--lab-accent-light': hexToRgba(hex, 0.15),
    '--lab-accent-border': hexToRgba(hex, 0.35),
    '--lab-accent-hover': hexToRgba(hex, 0.88),
    '--lab-hue': String(hue),
    '--lab-sat': `${sat}%`,
    '--lab-bg-canvas': `hsl(${hue}, ${darkSat}%, 4%)`,
    '--lab-bg-surface': `hsl(${hue}, ${darkSat}%, 7.5%)`,
    '--lab-bg-card': `hsl(${hue}, ${Math.max(10, darkSat - 3)}%, 11%)`,
    '--lab-bg-elevated': `hsl(${hue}, ${Math.max(8, darkSat - 5)}%, 15.5%)`,
    '--lab-bg-hover': `hsl(${hue}, ${Math.min(darkSat + 4, 32)}%, 19%)`,
    '--lab-border-subtle': `hsl(${hue}, ${darkSat}%, 18%)`,
    '--lab-border-strong': `hsl(${hue}, ${Math.min(sat, 36)}%, 26%)`,
    '--lab-bg-backdrop': `hsla(${hue}, ${darkSat}%, 4%, 0.78)`,
    '--lab-bg-canvas-light': `hsl(${hue}, ${lightSat}%, 98.2%)`,
    '--lab-bg-surface-light': `hsl(${hue}, ${Math.max(10, lightSat - 3)}%, 95.5%)`,
    '--lab-bg-card-light': `hsl(${hue}, ${Math.max(8, lightSat - 5)}%, 93%)`,
    '--lab-bg-elevated-light': `hsl(${hue}, ${Math.max(6, lightSat - 7)}%, 89%)`,
    '--lab-border-subtle-light': `hsl(${hue}, ${lightSat}%, 86%)`,
    '--lab-border-strong-light': `hsl(${hue}, ${Math.min(sat, 35)}%, 76%)`,
  };
}
