import { AssetLinks, CustomAssetLink } from '@/types';
import { normalizeExternalUrl } from '@/utils/venues';

export type AssetIconKind = 'overleaf' | 'github' | 'dataset' | 'zotero' | 'custom';
export type LegacyAssetKey = 'overleaf' | 'github' | 'dataset' | 'zotero';

export interface NormalizedAssetEntry {
  id: string;
  label: string;
  url: string;
  iconKind: AssetIconKind;
  legacyKey?: LegacyAssetKey;
}

export interface EditableAssetRow {
  id: string;
  label: string;
  url: string;
}

export interface AssetQuickPreset {
  label: string;
  placeholder: string;
  legacyKey?: LegacyAssetKey;
}

export const ASSET_QUICK_PRESETS: readonly AssetQuickPreset[] = [
  { label: 'Overleaf', placeholder: 'https://www.overleaf.com/project/...', legacyKey: 'overleaf' },
  { label: 'GitHub', placeholder: 'https://github.com/...', legacyKey: 'github' },
  { label: 'Dataset', placeholder: 'https://...', legacyKey: 'dataset' },
  { label: 'Zotero', placeholder: 'https://www.zotero.org/...', legacyKey: 'zotero' },
  { label: 'Lab Notebook', placeholder: 'https://benchling.com/...' },
  { label: 'Pre-registration', placeholder: 'https://osf.io/...' },
  { label: 'Qualtrics / Survey', placeholder: 'https://...' },
  { label: 'Box / Google Drive', placeholder: 'https://drive.google.com/...' },
  { label: 'IRB / Protocol', placeholder: 'https://...' },
  { label: 'Model / Analysis Code', placeholder: 'https://huggingface.co/...' },
  { label: 'Slides / Deck', placeholder: 'https://...' },
] as const;

const LEGACY_DEFS: ReadonlyArray<{
  key: LegacyAssetKey;
  label: string;
  aliases: readonly string[];
}> = [
  { key: 'overleaf', label: 'Overleaf', aliases: ['overleaf', 'overleaf url'] },
  { key: 'github', label: 'GitHub', aliases: ['github', 'github url', 'repo'] },
  { key: 'dataset', label: 'Dataset', aliases: ['dataset', 'dataset url', 'data'] },
  { key: 'zotero', label: 'Zotero', aliases: ['zotero', 'zotero url', 'references'] },
];

export function matchLegacyAssetKey(label: string): LegacyAssetKey | undefined {
  const normalized = label.trim().toLowerCase();
  if (!normalized) return undefined;
  const hit = LEGACY_DEFS.find((def) => def.aliases.includes(normalized));
  return hit?.key;
}

/**
 * Sanitizes custom asset link arrays imported from backups or database records.
 */
export function sanitizeCustomAssetLinks(raw: unknown): CustomAssetLink[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const result: CustomAssetLink[] = [];
  raw.forEach((item, index) => {
    if (!item || typeof item !== 'object') return;
    const obj = item as Partial<CustomAssetLink>;
    const cleanUrl = normalizeExternalUrl(typeof obj.url === 'string' ? obj.url : undefined);
    if (!cleanUrl) return;
    const rawLabel = typeof obj.label === 'string' ? obj.label.trim() : '';
    const label = rawLabel || 'Resource Link';
    const dedupKey = `${label.toLowerCase()}::${cleanUrl.toLowerCase()}`;
    if (seen.has(dedupKey)) return;
    seen.add(dedupKey);
    result.push({
      id: typeof obj.id === 'string' && obj.id.trim() ? obj.id.trim() : `asset-${index + 1}`,
      label,
      url: cleanUrl,
    });
  });
  return result;
}

/**
 * Normalizes mixed legacy + custom asset link structures cleanly.
 */
export function sanitizeAssetLinks(raw: unknown): AssetLinks {
  if (!raw || typeof raw !== 'object') return {};
  const obj = raw as AssetLinks;
  const overleaf = normalizeExternalUrl(obj.overleaf);
  const github = normalizeExternalUrl(obj.github);
  const dataset = normalizeExternalUrl(obj.dataset);
  const zotero = normalizeExternalUrl(obj.zotero);
  const customLinks = sanitizeCustomAssetLinks(obj.customLinks);

  const sanitized: AssetLinks = {};
  if (overleaf) sanitized.overleaf = overleaf;
  if (github) sanitized.github = github;
  if (dataset) sanitized.dataset = dataset;
  if (zotero) sanitized.zotero = zotero;
  if (customLinks.length > 0) sanitized.customLinks = customLinks;
  return sanitized;
}

/**
 * Produces an ordered, deduplicated list of clickable resource links from a task or project's `assets`.
 */
export function extractNormalizedAssetEntries(assets?: AssetLinks | null): NormalizedAssetEntry[] {
  if (!assets) return [];
  const entries: NormalizedAssetEntry[] = [];
  const seen = new Set<string>();

  for (const def of LEGACY_DEFS) {
    const cleanUrl = normalizeExternalUrl(assets[def.key]);
    if (!cleanUrl) continue;
    const key = `${def.label.toLowerCase()}::${cleanUrl.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({
      id: `legacy-${def.key}`,
      label: def.label,
      url: cleanUrl,
      iconKind: def.key,
      legacyKey: def.key,
    });
  }

  for (const custom of sanitizeCustomAssetLinks(assets.customLinks)) {
    const dedupKey = `${custom.label.toLowerCase()}::${custom.url.toLowerCase()}`;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);
    const matchedLegacy = matchLegacyAssetKey(custom.label);
    entries.push({
      id: custom.id,
      label: custom.label,
      url: custom.url,
      iconKind: matchedLegacy || 'custom',
    });
  }

  return entries;
}

export function hasAnyAssetLinks(assets?: AssetLinks | null): boolean {
  return extractNormalizedAssetEntries(assets).length > 0;
}

/**
 * Converts editable link rows back into an `AssetLinks` payload while preserving legacy columns
 * when the first matching row uses Overleaf / GitHub / Dataset / Zotero.
 */
export function editableRowsToAssetLinks(rows: EditableAssetRow[]): AssetLinks {
  const assets: AssetLinks = {};
  const customLinks: CustomAssetLink[] = [];
  const usedLegacy = new Set<LegacyAssetKey>();
  const seenUrls = new Set<string>();

  rows.forEach((row, index) => {
    const cleanUrl = normalizeExternalUrl(row.url);
    if (!cleanUrl) return;
    const cleanLabel = row.label.trim() || 'Resource Link';
    const dedupKey = `${cleanLabel.toLowerCase()}::${cleanUrl.toLowerCase()}`;
    if (seenUrls.has(dedupKey)) return;
    seenUrls.add(dedupKey);

    const legacyMatch = matchLegacyAssetKey(cleanLabel);
    if (legacyMatch && !usedLegacy.has(legacyMatch)) {
      usedLegacy.add(legacyMatch);
      assets[legacyMatch] = cleanUrl;
      return;
    }

    customLinks.push({
      id: row.id && row.id.trim() ? row.id.trim() : `asset-${Date.now()}-${index + 1}`,
      label: cleanLabel,
      url: cleanUrl,
    });
  });

  if (customLinks.length > 0) {
    assets.customLinks = customLinks;
  }
  return assets;
}

/**
 * Initializes editable form rows from existing `AssetLinks`.
 */
export function assetLinksToEditableRows(assets?: AssetLinks | null): EditableAssetRow[] {
  return extractNormalizedAssetEntries(assets).map((entry) => ({
    id: entry.id,
    label: entry.label,
    url: entry.url,
  }));
}
