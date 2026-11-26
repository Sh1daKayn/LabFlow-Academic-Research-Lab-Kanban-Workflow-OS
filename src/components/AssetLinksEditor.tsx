'use client';

import React from 'react';
import { AssetLinks, Language } from '@/types';
import {
  ASSET_QUICK_PRESETS,
  EditableAssetRow,
  assetLinksToEditableRows,
  editableRowsToAssetLinks,
} from '@/utils/assets';
import { normalizeExternalUrl } from '@/utils/venues';
import { ExternalLink, Link2, Plus, Trash2 } from 'lucide-react';

interface AssetLinksEditorProps {
  value?: AssetLinks | null;
  onChange: (nextAssets: AssetLinks) => void;
  disabled?: boolean;
  compact?: boolean;
  label?: string;
  language?: Language;
}

/**
 * Shared dynamic link editor allowing researchers to add, rename, edit, and remove
 * classic academic links (Overleaf/GitHub/Dataset/Zotero) and custom links (OSF, Lab Notebook, Box, IRB, Qualtrics).
 */
export const AssetLinksEditor: React.FC<AssetLinksEditorProps> = ({
  value,
  onChange,
  disabled = false,
  compact = false,
  label,
  language = 'en',
}) => {
  const isZh = language === 'zh';
  const resolvedLabel = label || (isZh ? '研究资源外链' : 'Resource Links');

  const [rows, setRows] = React.useState<EditableAssetRow[]>(() =>
    assetLinksToEditableRows(value)
  );
  const [showPresets, setShowPresets] = React.useState(false);

  const lastSerializedRef = React.useRef<string>(JSON.stringify(value || {}));
  React.useEffect(() => {
    const incoming = JSON.stringify(value || {});
    if (incoming !== lastSerializedRef.current) {
      lastSerializedRef.current = incoming;
      setRows(assetLinksToEditableRows(value));
    }
  }, [value]);

  const commitRows = (nextRows: EditableAssetRow[]) => {
    setRows(nextRows);
    const nextAssets = editableRowsToAssetLinks(nextRows);
    lastSerializedRef.current = JSON.stringify(nextAssets);
    onChange(nextAssets);
  };

  const handleRowChange = (id: string, patch: Partial<EditableAssetRow>) => {
    const nextRows = rows.map((row) => (row.id === id ? { ...row, ...patch } : row));
    commitRows(nextRows);
  };

  const handleAddRow = (presetLabel = '') => {
    if (disabled) return;
    const newRow: EditableAssetRow = {
      id: `asset-${Date.now()}-${rows.length + 1}`,
      label: presetLabel || (isZh ? '资源链接' : 'Resource Link'),
      url: '',
    };
    setRows([...rows, newRow]);
    setShowPresets(false);
  };

  const handleRemoveRow = (id: string) => {
    if (disabled) return;
    commitRows(rows.filter((row) => row.id !== id));
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
          <Link2 className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
          <span>{resolvedLabel}</span>
          {rows.length > 0 && (
            <span className="text-[10px] font-normal text-slate-400">({rows.length})</span>
          )}
        </span>

        {!disabled && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowPresets((prev) => !prev)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>{isZh ? '添加外链' : 'Add Link'}</span>
            </button>
          </div>
        )}
      </div>

      {!disabled && showPresets && (
        <div className="flex flex-wrap gap-1 p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          {ASSET_QUICK_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handleAddRow(preset.label)}
              className="px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-500 text-[10px] font-medium text-slate-700 dark:text-slate-200 transition-colors"
            >
              + {preset.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleAddRow(isZh ? '自定义外链' : 'Custom Link')}
            className="px-2 py-0.5 rounded-md border border-dashed border-indigo-500/50 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
          >
            + {isZh ? '自定义名称' : 'Custom Field'}
          </button>
        </div>
      )}

      {rows.length === 0 ? (
        <p className="text-[10px] text-slate-400 italic">
          {disabled
            ? isZh
              ? '暂无关联外链。'
              : 'No links attached.'
            : isZh
            ? '暂未添加外链。点击「添加外链」即可挂接 Overleaf、实验记录、OSF、数据集或自定义工具。'
            : 'No resource links attached yet. Click "+ Add Link" to attach Overleaf, GitHub, OSF, Lab Notebook, or custom links.'}
        </p>
      ) : (
        <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
          {rows.map((row) => {
            const safeUrl = normalizeExternalUrl(row.url);
            return (
              <div key={row.id} className="flex items-center gap-1.5">
                <input
                  type="text"
                  disabled={disabled}
                  value={row.label}
                  onChange={(e) => handleRowChange(row.id, { label: e.target.value })}
                  placeholder={isZh ? '标签 (如 实验记录)' : 'Label (e.g. Overleaf)'}
                  aria-label="Resource label"
                  className="w-28 sm:w-32 shrink-0 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-800 dark:text-slate-200 disabled:opacity-70 focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="url"
                  disabled={disabled}
                  value={row.url}
                  onChange={(e) => handleRowChange(row.id, { url: e.target.value })}
                  placeholder="https://..."
                  aria-label="Resource URL"
                  className="flex-1 min-w-0 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-800 dark:text-slate-200 disabled:opacity-70 focus:outline-none focus:border-indigo-500"
                />
                {safeUrl && (
                  <a
                    href={safeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Open ${row.label || 'link'}`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 shrink-0"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(row.id)}
                    title={`Remove ${row.label || 'link'}`}
                    aria-label={`Remove ${row.label || 'link'}`}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
