import React from 'react';
import {
  PhoneCall,
  Users,
  Calendar,
  Shield,
  FileSpreadsheet,
  Headset,
  Share2,
  BarChart3,
  History,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  callingDate: string;
  setCallingDate: (date: string) => void;
  selectedCallerId?: string;
  setSelectedCallerId?: (id: string) => void;
  callers: { id: string; name: string }[];
  onResetData: () => void;
  isSyncing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentRole,
  setCurrentRole,
  callingDate,
  setCallingDate,
  selectedCallerId,
  setSelectedCallerId,
  callers,
  onResetData,
  isSyncing,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Distribution & Ops', icon: Share2, roles: ['admin', 'tech_lead'] },
    { id: 'contacts', label: 'Contacts & Import', icon: FileSpreadsheet, roles: ['admin', 'tech_lead'] },
    { id: 'callers', label: 'Daily Callers', icon: Users, roles: ['admin', 'tech_lead'] },
    { id: 'reassignment', label: 'Reassignment', icon: RotateCcw, roles: ['admin', 'tech_lead'] },
    { id: 'caller_dashboard', label: 'Caller Dashboard', icon: Headset, roles: ['admin', 'caller', 'tech_lead'] },
    { id: 'reports', label: 'Reports & Export', icon: BarChart3, roles: ['admin', 'tech_lead'] },
    { id: 'audit', label: 'Audit & Tech Log', icon: History, roles: ['tech_lead', 'admin'] },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Banner with Brand and Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">
                  Call Center Hub
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                  MVP v1.0
                </span>
                {isSyncing && (
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />
                    Syncing
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Contact Distribution, WhatsApp Dispatch & Feedback Tracking
              </p>
            </div>
          </div>

          {/* Right Toolbar: Date & Role Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Calling Date Picker */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline font-medium text-slate-500">Date:</span>
              <input
                type="date"
                value={callingDate}
                onChange={(e) => setCallingDate(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
                title="Calling Date"
              />
            </div>

            {/* Active Caller selector if in caller dashboard mode */}
            {currentRole === 'caller' && setSelectedCallerId && callers.length > 0 && (
              <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 text-xs">
                <Headset className="w-3.5 h-3.5 text-emerald-700" />
                <span className="font-medium text-emerald-800 hidden sm:inline">Agent:</span>
                <select
                  value={selectedCallerId}
                  onChange={(e) => setSelectedCallerId(e.target.value)}
                  aria-label="Active Agent"
                  className="bg-transparent text-emerald-900 font-semibold outline-none cursor-pointer"
                >
                  {callers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Role Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setCurrentRole('admin')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  currentRole === 'admin'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentRole('caller');
                  setActiveTab('caller_dashboard');
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  currentRole === 'caller'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Caller
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentRole('tech_lead');
                }}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  currentRole === 'tech_lead'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Technical Lead / System Logs"
              >
                <Shield className="w-3.5 h-3.5 inline mr-1" />
                Tech
              </button>
            </div>

            {/* Reset / Seed Demo Data */}
            <button
              type="button"
              onClick={onResetData}
              title="Reset or re-seed standard demonstration data"
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Reset Demo</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 overflow-x-auto scrollbar-none border-t border-slate-100 py-1.5">
          {tabs
            .filter((t) => t.roles.includes(currentRole))
            .map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
        </div>
      </div>
    </header>
  );
};
