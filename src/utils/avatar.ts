/**
 * Generates an offline-safe inline SVG data URI avatar with deterministic color and initials.
 */
const AVATAR_PALETTE = [
  '#4f46e5',
  '#0891b2',
  '#059669',
  '#d97706',
  '#be123c',
  '#7c3aed',
  '#1e40af',
];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateInitialsAvatar(name: string, seed = ''): string {
  const cleanName = (name || 'LF').trim();
  const initials = cleanName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || cleanName.slice(0, 2).toUpperCase();

  const hashSource = seed || cleanName;
  let hash = 0;
  for (let i = 0; i < hashSource.length; i += 1) {
    hash = (hash * 31 + hashSource.charCodeAt(i)) >>> 0;
  }
  const bg = AVATAR_PALETTE[hash % AVATAR_PALETTE.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="${bg}"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="system-ui,-apple-system,sans-serif" font-size="34" font-weight="700">${escapeXml(initials)}</text></svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
