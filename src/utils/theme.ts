import { AccentColor } from '@/types';

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
