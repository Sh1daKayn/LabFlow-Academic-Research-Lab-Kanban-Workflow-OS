'use client';

import React, { useEffect, useState } from 'react';
import { X, LayoutGrid, Check, KeyRound, AlertCircle } from 'lucide-react';
import { useLabFlow } from '@/context/LabFlowContext';
import { ViewMode } from '@/types';
import {
  ALL_VIEW_MODES,
  DEFAULT_STUDENT_VIEWS,
  VIEW_META,
  sanitizePreferredViews,
} from '@/utils/viewPreferences';
import { hasMemberPin } from '@/utils/pin';

export const ViewCustomizerModal: React.FC = () => {
  const {
    isViewCustomizerOpen,
    setIsViewCustomizerOpen,
    preferredViews,
    defaultView,
    updateMyViewPreferences,
    currentMember,
    updateMyPin,
    language,
    addToast,
  } = useLabFlow();

  const isZh = language === 'zh';
  const [selectedViews, setSelectedViews] = useState<ViewMode[]>(preferredViews);
  const [selectedDefault, setSelectedDefault] = useState<ViewMode>(defaultView);

  // Optional personal PIN update section
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    if (!isViewCustomizerOpen) return;
    setSelectedViews(preferredViews);
    setSelectedDefault(defaultView);
    setCurrentPin('');
    setNewPin('');
    setConfirmNewPin('');
    setPinError('');
  }, [isViewCustomizerOpen, preferredViews, defaultView]);

  if (!isViewCustomizerOpen) return null;

  const memberHasPin = hasMemberPin(currentMember);
  const isPIAccount = currentMember?.accessRole === 'ADMIN_PI';

  const toggleView = (view: ViewMode) => {
    setSelectedViews((prev) => {
      const exists = prev.includes(view);
      if (exists && prev.length === 1) return prev;
      const next = sanitizePreferredViews(
        exists ? prev.filter((v) => v !== view) : [...prev, view]
      );
      if (!next.includes(selectedDefault)) {
        setSelectedDefault(next[0]);
      }
      return next;
    });
  };

  const handleSaveViews = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanViews = sanitizePreferredViews(selectedViews);
    const cleanDefault = cleanViews.includes(selectedDefault)
      ? selectedDefault
      : cleanViews[0];
    updateMyViewPreferences(cleanViews, cleanDefault);
    setIsViewCustomizerOpen(false);
  };

  const handleUpdatePin = () => {
    setPinError('');
    if (newPin.trim().length < 4) {
      setPinError(
        isZh ? '新密码 / PIN 至少需要 4 位' : 'New PIN must be at least 4 characters'
      );
      return;
    }
    if (newPin.trim() !== confirmNewPin.trim()) {
      setPinError(isZh ? '两次输入的新 PIN 不一致' : 'PINs do not match');
      return;
    }
    const res = updateMyPin(currentPin.trim(), newPin.trim());
    if (!res.ok) {
      setPinError(res.error || (isZh ? '修改失败' : 'Failed to update PIN'));
      return;
    }
    setCurrentPin('');
    setNewPin('');
    setConfirmNewPin('');
    addToast(
      isZh ? '个人密码 / PIN 已更新' : 'Personal PIN updated',
      '',
      'success'
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
      onClick={() => setIsViewCustomizerOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              {isZh ? '自定义工作台视图与个人密码' : 'Customize Views & Personal PIN'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isZh
                ? '精简顶部导航栏保留的视图，未勾选的可随时从「更多视图」访问'
                : 'Keep only the views you use on the top bar; others stay accessible under More'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsViewCustomizerOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSaveViews} className="p-5 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* View Pinning */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {isZh ? '顶部导航保留的常用视图' : 'Pinned Navigation Views'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedViews(DEFAULT_STUDENT_VIEWS);
                  setSelectedDefault(DEFAULT_STUDENT_VIEWS[0]);
                }}
                className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {isZh ? '恢复精简推荐 (3项)' : 'Reset to Minimal (3)'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ALL_VIEW_MODES.map((view) => {
                const active = selectedViews.includes(view);
                const meta = VIEW_META[view];
                return (
                  <button
                    key={view}
                    type="button"
                    onClick={() => toggleView(view)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-colors ${
                      active
                        ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/35 text-slate-900 dark:text-slate-100'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <span
                      className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                        active
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {active && <Check className="w-3 h-3" />}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold">
                        {isZh ? meta.labelZh : meta.labelEn}
                      </div>
                      <div className="text-[11px] opacity-75 leading-snug mt-0.5">
                        {isZh ? meta.descZh : meta.descEn}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {isZh ? '登录后默认进入：' : 'Default landing view:'}
              </label>
              <select
                value={selectedDefault}
                onChange={(e) => setSelectedDefault(e.target.value as ViewMode)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs"
              >
                {selectedViews.map((v) => (
                  <option key={v} value={v}>
                    {isZh ? VIEW_META[v].labelZh : VIEW_META[v].labelEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Personal PIN Section (for students / non-PI or optional pin change) */}
          {!isPIAccount && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-3.5 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                <KeyRound className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                {memberHasPin
                  ? isZh
                    ? '修改个人登录密码 / PIN'
                    : 'Change Personal PIN'
                  : isZh
                    ? '设置个人登录密码 / PIN'
                    : 'Set Personal PIN'}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {memberHasPin && (
                  <input
                    type="password"
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value)}
                    placeholder={isZh ? '当前 PIN' : 'Current PIN'}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs"
                  />
                )}
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder={isZh ? '新 PIN (至少4位)' : 'New PIN (4+ chars)'}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs"
                />
                <input
                  type="password"
                  value={confirmNewPin}
                  onChange={(e) => setConfirmNewPin(e.target.value)}
                  placeholder={isZh ? '确认新 PIN' : 'Confirm PIN'}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs"
                />
              </div>

              {pinError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleUpdatePin}
                  className="px-3 py-1.5 rounded-lg border border-indigo-300 dark:border-indigo-700 text-xs font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                >
                  {isZh ? '更新 PIN' : 'Update PIN'}
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsViewCustomizerOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {isZh ? '取消' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm"
            >
              {isZh ? '保存视图偏好' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
