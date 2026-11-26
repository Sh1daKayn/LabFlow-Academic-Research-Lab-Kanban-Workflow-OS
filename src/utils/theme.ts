import { AccentColor, ChineseFontPreset, EnglishFontPreset } from '@/types';

export interface FontPresetMeta<T extends string> {
  id: T;
  nameZh: string;
  nameEn: string;
  descZh: string;
  descEn: string;
  stack: string;
  genericFallback?: 'serif' | 'sans-serif' | 'monospace';
}

export const ENGLISH_FONT_PRESETS: FontPresetMeta<Exclude<EnglishFontPreset, 'custom'>>[] = [
  {
    id: 'times',
    nameZh: 'Times New Roman',
    nameEn: 'Times New Roman',
    descZh: '国际期刊标准衬线体',
    descEn: 'Publication serif standard',
    stack: "'Times New Roman', Times, 'Liberation Serif'",
    genericFallback: 'serif',
  },
  {
    id: 'georgia',
    nameZh: 'Georgia 衬线',
    nameEn: 'Georgia Serif',
    descZh: '屏幕长文优雅耐读',
    descEn: 'Warm screen editorial serif',
    stack: "Georgia, 'Nimbus Roman', Cambria",
    genericFallback: 'serif',
  },
  {
    id: 'palatino',
    nameZh: 'Palatino 典雅',
    nameEn: 'Palatino Antiqua',
    descZh: '学位论文/专著质感',
    descEn: 'Monograph classic serif',
    stack: "'Palatino Linotype', 'Book Antiqua', Palatino",
    genericFallback: 'serif',
  },
  {
    id: 'garamond',
    nameZh: 'Garamond 古典',
    nameEn: 'Garamond Classic',
    descZh: '经典图书出版人文衬线',
    descEn: 'Classic book publishing serif',
    stack: "'EB Garamond', Garamond, 'Hoefler Text', Georgia",
    genericFallback: 'serif',
  },
  {
    id: 'baskerville',
    nameZh: 'Baskerville 高对比',
    nameEn: 'Baskerville Editorial',
    descZh: '学术专刊犀利标题衬线',
    descEn: 'Crisp high-contrast serif',
    stack: "'Baskerville Old Face', Baskerville, 'Libre Baskerville', Georgia",
    genericFallback: 'serif',
  },
  {
    id: 'cambria',
    nameZh: 'Cambria 数学论文',
    nameEn: 'Cambria Academic',
    descZh: 'Office 公式与英文汇报清晰',
    descEn: 'Clear technical & math prose',
    stack: "Cambria, Caladea, Georgia",
    genericFallback: 'serif',
  },
  {
    id: 'geist',
    nameZh: 'Geist Sans（内置）',
    nameEn: 'Geist Sans (Bundled)',
    descZh: '现代科研界面无衬线',
    descEn: 'Built-in modern UI sans',
    stack: "var(--font-geist-sans), 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI'",
    genericFallback: 'sans-serif',
  },
  {
    id: 'inter',
    nameZh: 'Inter 现代界面',
    nameEn: 'Inter Modern UI',
    descZh: '数字与小字号高辨识度',
    descEn: 'High-legibility SaaS workspace',
    stack: "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI'",
    genericFallback: 'sans-serif',
  },
  {
    id: 'helvetica',
    nameZh: 'Helvetica / Arial',
    nameEn: 'Helvetica / Arial',
    descZh: '国际简明现代黑体无衬线',
    descEn: 'Swiss clean neo-grotesque',
    stack: "'Helvetica Neue', Helvetica, Arial, 'Liberation Sans'",
    genericFallback: 'sans-serif',
  },
  {
    id: 'system-sans',
    nameZh: 'Segoe / 系统无衬线',
    nameEn: 'Segoe / System Sans',
    descZh: '顺滑贴合本机桌面观感',
    descEn: 'Crisp OS native UI sans',
    stack: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
    genericFallback: 'sans-serif',
  },
  {
    id: 'jetbrains',
    nameZh: 'Geist / JetBrains 等宽',
    nameEn: 'Geist / JetBrains Mono',
    descZh: '算法工程数值精准对齐',
    descEn: 'Technical tabular monospace',
    stack: "var(--font-geist-mono), 'JetBrains Mono', Consolas, 'Courier New'",
    genericFallback: 'monospace',
  },
  {
    id: 'fira-code',
    nameZh: 'Fira Code 代码等宽',
    nameEn: 'Fira Code Mono',
    descZh: '实验日志与代码连字风格',
    descEn: 'Developer ligature monospace',
    stack: "'Fira Code', 'JetBrains Mono', var(--font-geist-mono), Consolas",
    genericFallback: 'monospace',
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
    id: 'youyuan',
    nameZh: '幼圆（圆润亲和）',
    nameEn: 'YouYuan (Rounded)',
    descZh: '温润柔和圆头体，轻松护眼',
    descEn: 'Soft rounded friendly Chinese font',
    stack: "'YouYuan', '幼圆', 'Yuanti SC', 'STYuanti-SC-Regular', 'Hiragino Maru Gothic ProN', 'PingFang SC', 'Microsoft YaHei'",
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
    id: 'zhongsong',
    nameZh: '华文中宋',
    nameEn: 'STZhongsong Serif',
    descZh: '稳重厚实适合报告标题与正文',
    descEn: 'Authoritative medium Song serif',
    stack: "'STZhongsong', '华文中宋', 'Noto Serif SC', 'Source Han Serif SC', 'SimSun'",
    genericFallback: 'serif',
  },
  {
    id: 'kaiti',
    nameZh: '楷体 / 华文楷体',
    nameEn: 'Kaiti / STKaiti',
    descZh: '文稿笔记与人文典雅风格',
    descEn: 'Classical humanist script',
    stack: "'Kaiti SC', 'KaiTi', '楷体', 'STKaiti', 'BiauKai'",
    genericFallback: 'serif',
  },
  {
    id: 'lxgw-wenkai',
    nameZh: '霞鹜文楷',
    nameEn: 'LXGW WenKai',
    descZh: '清秀现代手写感笔记楷书',
    descEn: 'Modern open-source WenKai script',
    stack: "'LXGW WenKai', 'LXGW WenKai Screen', 'Kaiti SC', 'KaiTi', 'STKaiti'",
    genericFallback: 'serif',
  },
  {
    id: 'fangsong',
    nameZh: '仿宋 / 华文仿宋',
    nameEn: 'FangSong / Official',
    descZh: '国自然标书与公文体例',
    descEn: 'Grant proposal & formal doc',
    stack: "'FangSong', '仿宋', 'STFangsong', 'FangSong_GB2312'",
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
    id: 'lishu',
    nameZh: '隶书（古风碑帖）',
    nameEn: 'LiSu (Clerical Script)',
    descZh: '传统端庄汉隶装饰与展示风',
    descEn: 'Classical clerical brushwork',
    stack: "'LiSu', '隶书', 'STLiti', 'Songti SC', 'SimSun'",
    genericFallback: 'serif',
  },
  {
    id: 'xingkai',
    nameZh: '华文行楷',
    nameEn: 'STXingkai (Calligraphy)',
    descZh: '潇洒飘逸书法行楷质感',
    descEn: 'Expressive running script style',
    stack: "'STXingkai', '华文行楷', 'Xingkai SC', 'KaiTi', 'STKaiti'",
    genericFallback: 'serif',
  },
  {
    id: 'dengxian',
    nameZh: '等线（轻量几何）',
    nameEn: 'DengXian Light Sans',
    descZh: 'Office 现代匀称轻量黑体',
    descEn: 'Clean uniform stroke CJK sans',
    stack: "'DengXian', '等线', 'PingFang SC', 'Microsoft YaHei Light', 'Microsoft YaHei'",
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
    matchedZh?.genericFallback === 'serif' || matchedEn?.genericFallback === 'serif';

  const generic = useSerifFallback ? 'serif' : 'sans-serif';
  return `${enStack}, ${zhStack}, ${generic}`;
}

export const ACCENT_MAP: Record<string, string> = {
  indigo: '#6366f1',
  'obsidian-gold': '#8E6F3E',
  purdue: '#8E6F3E',
  boilermaker: '#CFB991',
  steel: '#555960',
  oxford: '#1e40af',
  cardinal: '#8c1515',
  cambridge: '#0f766e',
  crimson: '#991b1b',
  cyan: '#06b6d4',
  emerald: '#10b981',
  amber: '#DAAA00',
  rose: '#f43f5e',
  violet: '#8b5cf6',
};

const OBSIDIAN_GOLD_PALETTE_HEXES = new Set([
  '#8E6F3E',
  '#CFB991',
  '#DAAA00',
  '#DDB945',
  '#EBD99F',
  '#000000',
  '#555960',
  '#6F727B',
]);

export function resolveAccentHex(accentColor: AccentColor): string {
  return ACCENT_MAP[accentColor] || (accentColor.startsWith('#') ? accentColor : '#6366f1');
}

function parseHexRgb(hex: string): [number, number, number] | null {
  let c = hex.replace('#', '').trim();
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  if (c.length !== 6) return null;
  const num = parseInt(c, 16);
  if (isNaN(num)) return null;
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function darkenHex(hex: string, factor = 0.16): string {
  const rgb = parseHexRgb(hex);
  if (!rgb) return hexToRgba(hex, 0.88);
  if (rgb[0] === 0 && rgb[1] === 0 && rgb[2] === 0) {
    return '#26282A';
  }
  const toHex = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  const r = toHex(rgb[0] * (1 - factor));
  const g = toHex(rgb[1] * (1 - factor));
  const b = toHex(rgb[2] * (1 - factor));
  return `#${r}${g}${b}`;
}

/**
 * Returns black or white foreground hex to maintain crisp contrast against an accent swatch.
 */
export function getAccentForegroundHex(hex: string): string {
  const rgb = parseHexRgb(hex);
  if (!rgb) return '#ffffff';
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.38 ? '#000000' : '#ffffff';
}

export function hexToRgba(hex: string, alpha: number): string {
  const rgb = parseHexRgb(hex);
  if (!rgb) return `rgba(99, 102, 241, ${alpha})`;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

export function hexToHsl(hex: string): [number, number, number] {
  const rgb = parseHexRgb(hex);
  if (!rgb) return [240, 70, 60];
  const r = rgb[0] / 255;
  const g = rgb[1] / 255;
  const b = rgb[2] / 255;

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
  const normalizedHex = hex.toUpperCase();
  const isObsidianGold =
    accentColor === 'obsidian-gold' ||
    accentColor === 'purdue' ||
    accentColor === 'boilermaker' ||
    accentColor === 'steel' ||
    OBSIDIAN_GOLD_PALETTE_HEXES.has(normalizedHex);

  const [hue, sat] = hexToHsl(hex);
  const darkSat = Math.min(Math.max(Math.round(sat * 0.38), 16), 30);
  const lightSat = Math.min(Math.max(Math.round(sat * 0.32), 14), 28);
  const accentFg = getAccentForegroundHex(hex);
  const accentHover = darkenHex(hex, 0.16);

  const surfaceVars = isObsidianGold
    ? {
        '--lab-bg-canvas': '#050505',
        '--lab-bg-surface': '#11100E',
        '--lab-bg-card': '#181613',
        '--lab-bg-elevated': '#23201B',
        '--lab-bg-hover': '#2E2B25',
        '--lab-border-subtle': '#322F2A',
        '--lab-border-strong': '#555960',
        '--lab-bg-backdrop': 'rgba(0, 0, 0, 0.78)',
        '--lab-bg-canvas-light': '#FAF8F4',
        '--lab-bg-surface-light': '#F4EFE6',
        '--lab-bg-card-light': '#EDE5D6',
        '--lab-bg-elevated-light': '#E6DDD0',
        '--lab-border-subtle-light': '#DDD5C7',
        '--lab-border-strong-light': '#C4BFC0',
      }
    : {
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

  return {
    '--lab-accent': hex,
    '--lab-accent-fg': accentFg,
    '--lab-accent-light': isObsidianGold
      ? 'rgba(207, 185, 145, 0.24)'
      : hexToRgba(hex, 0.15),
    '--lab-accent-border': isObsidianGold
      ? 'rgba(142, 111, 62, 0.42)'
      : hexToRgba(hex, 0.35),
    '--lab-accent-hover': accentHover,
    '--lab-hue': String(hue),
    '--lab-sat': `${sat}%`,
    ...surfaceVars,
  };
}
