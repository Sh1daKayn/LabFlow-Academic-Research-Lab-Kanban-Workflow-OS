/**
 * Generates an offline-safe inline SVG data URI avatar with deterministic color and initials,
 * plus client-side image compression for uploaded member photo avatars.
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
  const initials =
    cleanName
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

export function isCustomPhotoAvatar(avatar?: string): boolean {
  if (!avatar) return false;
  return (
    avatar.startsWith('data:image/jpeg') ||
    avatar.startsWith('data:image/png') ||
    avatar.startsWith('data:image/webp') ||
    avatar.startsWith('http://') ||
    avatar.startsWith('https://')
  );
}

/**
 * Center-crops and resizes an uploaded image file to a compact 160x160 data URI
 * so member photos persist fast in both JSON and PostgreSQL without payload bloat.
 */
export async function compressAvatarImageFile(
  file: File,
  targetSize = 160,
  quality = 0.8
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a valid image file (PNG / JPG / WebP).');
  }

  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Invalid image format'));
    image.src = rawDataUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  const minSide = Math.min(img.width, img.height);
  const sx = Math.max(0, (img.width - minSide) / 2);
  const sy = Math.max(0, (img.height - minSide) / 2);
  ctx.clearRect(0, 0, targetSize, targetSize);
  ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetSize, targetSize);

  const webp = canvas.toDataURL('image/webp', quality);
  if (webp.startsWith('data:image/webp')) {
    return webp;
  }
  return canvas.toDataURL('image/jpeg', quality);
}
