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
  Trash2,
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
  onEmptyData: () => void;
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
  onEmptyData,
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
    <header className="bg-[#240c54] text-white border-b border-[#3b1580] sticky top-0 z-40 shadow-lg shadow-purple-950/20">
      {/* Top Banner with Brand and Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#6c28f5] flex items-center justify-center text-white shadow-md shadow-purple-600/30">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-base sm:text-lg tracking-tight">
                  Call Center Hub<span className="text-[#ff2a85]">.</span>
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#ff2a85] text-white font-extrabold uppercase tracking-wider">
                  MVP v1.0
                </span>
                {isSyncing && (
                  <span className="flex items-center gap-1 text-xs text-purple-200">
                    <RefreshCw className="w-3 h-3 animate-spin text-[#88d600]" />
                    Syncing
                  </span>
                )}
              </div>
              <p className="text-xs text-purple-200/80 hidden sm:block font-medium">
                Contact Distribution, WhatsApp Dispatch & Feedback Tracking
              </p>
            </div>
          </div>

          {/* Right Toolbar: Date & Role Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Calling Date Picker */}
            <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-xl px-2.5 py-1.5 text-xs text-purple-100">
              <Calendar className="w-3.5 h-3.5 text-purple-300" />
              <span className="hidden md:inline font-bold text-purple-200">Date:</span>
              <input
                type="date"
                value={callingDate}
                onChange={(e) => setCallingDate(e.target.value)}
                className="bg-transparent font-bold text-white outline-none cursor-pointer"
                title="Calling Date"
              />
            </div>

            {/* Active Caller selector if in caller dashboard mode */}
            {currentRole === 'caller' && setSelectedCallerId && callers.length > 0 && (
              <div className="flex items-center gap-1 bg-[#6c28f5]/60 border border-purple-300/40 rounded-xl px-2.5 py-1.5 text-xs text-white">
                <Headset className="w-3.5 h-3.5 text-purple-200" />
                <span className="font-bold text-purple-200 hidden sm:inline">Agent:</span>
                <select
                  value={selectedCallerId}
                  onChange={(e) => setSelectedCallerId(e.target.value)}
                  aria-label="Active Agent"
                  className="bg-transparent text-white font-bold outline-none cursor-pointer"
                >
                  {callers.map((c) => (
                    <option key={c.id} value={c.id} className="text-[#1e1b4b]">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Role Switcher */}
            <div className="flex items-center bg-[#170638] p-1 rounded-xl border border-white/15">
              <button
                type="button"
                onClick={() => setCurrentRole('admin')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  currentRole === 'admin'
                    ? 'bg-[#6c28f5] text-white shadow-sm'
                    : 'text-purple-200/80 hover:text-white'
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
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  currentRole === 'caller'
                    ? 'bg-[#6c28f5] text-white shadow-sm'
                    : 'text-purple-200/80 hover:text-white'
                }`}
              >
                Caller
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentRole('tech_lead');
                }}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                  currentRole === 'tech_lead'
                    ? 'bg-[#6c28f5] text-white shadow-sm'
                    : 'text-purple-200/80 hover:text-white'
                }`}
                title="Technical Lead / System Logs"
              >
                <Shield className="w-3.5 h-3.5 inline mr-1" />
                Tech
              </button>
            </div>

            {/* Empty Database / Start Fresh Session */}
            <button
              type="button"
              onClick={onEmptyData}
              title="Empty database and wipe contacts, callers, and assignments to start fresh"
              className="text-xs px-2.5 py-1.5 rounded-xl border border-red-400/30 bg-red-500/20 hover:bg-red-500/30 text-red-100 flex items-center gap-1 transition-colors cursor-pointer font-bold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Empty Database</span>
            </button>

            {/* Reset / Seed Demo Data */}
            <button
              type="button"
              onClick={onResetData}
              title="Load sample demonstration data for testing"
              className="text-xs px-2.5 py-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-purple-100 flex items-center gap-1 transition-colors cursor-pointer font-bold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Sample Demo</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1.5 overflow-x-auto scrollbar-none border-t border-purple-900/40 py-2">
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
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#6c28f5] text-white shadow-md shadow-purple-950/40 border border-purple-400/40'
                      : 'text-purple-200/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-purple-300'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
        </div>
      </div>
    </header>
  );
};
