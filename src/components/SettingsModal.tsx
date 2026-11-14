'use client';

import React from 'react';
import { useLabFlow } from '@/context/LabFlowContext';
import { SettingsTab } from '@/types';
import {
  Bookmark,
  Database,
  Layers,
  Lock,
  Palette,
  Server,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { AppearanceTab } from '@/components/settings/AppearanceTab';
import { MembersTab } from '@/components/settings/MembersTab';
import { ResourcesTab } from '@/components/settings/ResourcesTab';
import { StagesTab } from '@/components/settings/StagesTab';
import { VenuesTab } from '@/components/settings/VenuesTab';
import { BackupTab } from '@/components/settings/BackupTab';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    activeSettingsTab,
    setActiveSettingsTab,
    effectiveIsAdmin,
    requireAdminAuth,
    t,
  } = useLabFlow();

  if (!isSettingsOpen) return null;

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'appearance', label: t.tabAppearance, icon: <Palette className="w-4 h-4" /> },
    { id: 'members', label: t.tabMembers, icon: <Users className="w-4 h-4" /> },
    { id: 'resources', label: t.tabResources, icon: <Server className="w-4 h-4" /> },
    { id: 'stages', label: t.tabStages, icon: <Layers className="w-4 h-4" /> },
    { id: 'venues', label: t.tabVenues, icon: <Bookmark className="w-4 h-4" /> },
    { id: 'backup', label: t.tabBackup, icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[88vh] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {t.settingsCenter}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.settingsCenterDesc}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Left Sidebar Tabs + Right Content Panel */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          <div className="w-full sm:w-56 shrink-0 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-800 p-2.5 sm:p-4 space-y-1 bg-slate-50/60 dark:bg-slate-950/50 overflow-x-auto sm:overflow-y-auto flex sm:flex-col gap-1 sm:gap-0">
            {tabs.map((tab) => {
              const isActive = activeSettingsTab === tab.id;
              const isRestricted = tab.id !== 'appearance' && !effectiveIsAdmin;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (isRestricted) {
                      requireAdminAuth(() => setActiveSettingsTab(tab.id));
                    } else {
                      setActiveSettingsTab(tab.id);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 text-left ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {tab.icon}
                    <span>{tab.label}</span>
                  </div>
                  {isRestricted && (
                    <span
                      className="p-1 rounded text-amber-500 opacity-80"
                      title={t.requireAdminNotice}
                    >
                      <Lock className="w-3 h-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex-1 p-5 sm:p-7 overflow-y-auto space-y-6">
            {activeSettingsTab === 'appearance' && <AppearanceTab />}
            {activeSettingsTab === 'members' && <MembersTab />}
            {activeSettingsTab === 'resources' && <ResourcesTab />}
            {activeSettingsTab === 'stages' && <StagesTab />}
            {activeSettingsTab === 'venues' && <VenuesTab />}
            {activeSettingsTab === 'backup' && <BackupTab />}
          </div>
        </div>
      </div>
    </div>
  );
};
