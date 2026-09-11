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
  ListTodo,
  TrendingUp,
  UserCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Caller } from '../types';

interface NavbarProps {
  activePortal: 'admin' | 'caller';
  setActivePortal: (portal: 'admin' | 'caller') => void;
  adminTab: string;
  setAdminTab: (tab: string) => void;
  callerSubTab: 'queue' | 'performance' | 'history';
  setCallerSubTab: (tab: 'queue' | 'performance' | 'history') => void;
  callingDate: string;
  setCallingDate: (date: string) => void;
  selectedCallerId?: string;
  setSelectedCallerId?: (id: string) => void;
  callers: Caller[];
  currentCaller?: Caller;
  onSaveCaller?: (caller: Caller) => Promise<void>;
  onResetData: () => void;
  onEmptyData: () => void;
  isSyncing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePortal,
  setActivePortal,
  adminTab,
  setAdminTab,
  callerSubTab,
  setCallerSubTab,
  callingDate,
  setCallingDate,
  selectedCallerId,
  setSelectedCallerId,
  callers,
  currentCaller,
  onResetData,
  onEmptyData,
  isSyncing,
}) => {
  // Admin tabs list
  const adminTabs = [
    { id: 'dashboard', label: 'Distribution & Ops', icon: Share2 },
    { id: 'contacts', label: 'Contacts & Import', icon: FileSpreadsheet },
    { id: 'callers', label: 'Daily Callers Fleet', icon: Users },
    { id: 'reassignment', label: 'Smart Reassignment', icon: RotateCcw },
    { id: 'reports', label: 'Reports & Export', icon: BarChart3 },
    { id: 'audit', label: 'Audit & Tech Log', icon: History },
  ];

  // Caller tabs list
  const callerTabs = [
    { id: 'queue', label: 'My Call Queue', icon: ListTodo },
    { id: 'performance', label: 'Shift Target & Stats', icon: TrendingUp },
    { id: 'history', label: 'Call Activity History', icon: History },
  ];

  return (
    <header className="bg-[#240c54] text-white border-b border-[#3b1580] sticky top-0 z-40 shadow-lg shadow-purple-950/30">
      {/* Top Main Bar: Clear Name as KIU Manifest Call Center Hub */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Main Hub Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#6c28f5] flex items-center justify-center text-white shadow-md shadow-purple-600/40">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-white text-lg sm:text-xl tracking-tight leading-tight">
                  KIU Manifest Call Center Hub<span className="text-[#ff2a85]">.</span>
                </h1>
                {isSyncing && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-[#88d600] font-bold bg-[#88d600]/10 px-2 py-0.5 rounded-md border border-[#88d600]/20">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Syncing
                  </span>
                )}
              </div>
              <p className="text-[11px] text-purple-200/80 font-medium">
                Campaign Operations, Contact Distribution & Live Feedback System
              </p>
            </div>
          </div>

          {/* Quick Date and Utility Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Calling Date Picker */}
            <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-xl px-2.5 py-1.5 text-xs text-purple-100">
              <Calendar className="w-3.5 h-3.5 text-purple-300" />
              <span className="font-bold text-purple-200 hidden sm:inline">Date:</span>
              <input
                type="date"
                value={callingDate}
                onChange={(e) => setCallingDate(e.target.value)}
                className="bg-transparent font-bold text-white outline-none cursor-pointer"
                title="Calling Date"
              />
            </div>

            {/* If in CALLER PORTAL: Active Agent Switcher */}
            {activePortal === 'caller' && callers.length > 0 && setSelectedCallerId && (
              <div className="flex items-center gap-1.5 bg-[#6c28f5]/60 border border-purple-300/30 rounded-xl px-2.5 py-1.5 text-xs text-white">
                <UserCheck className="w-3.5 h-3.5 text-[#88d600]" />
                <span className="font-bold text-purple-200 hidden md:inline">Agent:</span>
                <select
                  value={selectedCallerId}
                  onChange={(e) => setSelectedCallerId(e.target.value)}
                  aria-label="Active Agent"
                  className="bg-transparent text-white font-bold outline-none cursor-pointer text-xs"
                >
                  {callers.map((c) => (
                    <option key={c.id} value={c.id} className="text-[#1e1b4b]">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* If in ADMIN PORTAL: Empty DB and Sample Demo */}
            {activePortal === 'admin' && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onEmptyData}
                  title="Empty database to start fresh"
                  className="text-xs px-2.5 py-1.5 rounded-xl border border-red-400/30 bg-red-500/20 hover:bg-red-500/30 text-red-100 flex items-center gap-1 transition-colors cursor-pointer font-bold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Empty DB</span>
                </button>

                <button
                  type="button"
                  onClick={onResetData}
                  title="Load sample demonstration data"
                  className="text-xs px-2.5 py-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-purple-100 flex items-center gap-1 transition-colors cursor-pointer font-bold"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Sample Demo</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DEDICATED LINE BENEATH: Admin & Call Portal Access */}
      <div className="border-t border-[#38137e] bg-[#1a0742]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-3">
          {/* Clear Portal Switcher Line */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-300/80 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#ff2a85]" />
              Portal Access:
            </span>

            <div className="inline-flex p-1 bg-[#10042a] rounded-2xl border border-purple-400/25 shadow-inner">
              <button
                type="button"
                onClick={() => setActivePortal('admin')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activePortal === 'admin'
                    ? 'bg-[#6c28f5] text-white shadow-md shadow-purple-950/60 border border-purple-300/40'
                    : 'text-purple-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Portal</span>
                {activePortal === 'admin' && (
                  <span className="w-2 h-2 rounded-full bg-[#88d600] ring-2 ring-[#88d600]/40" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActivePortal('caller')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activePortal === 'caller'
                    ? 'bg-[#88d600] text-[#1e1b4b] shadow-md shadow-lime-950/40 border border-lime-300'
                    : 'text-purple-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Headset className="w-3.5 h-3.5" />
                <span>Call Portal</span>
                {activePortal === 'caller' && (
                  <span className="w-2 h-2 rounded-full bg-[#1e1b4b]" />
                )}
              </button>
            </div>
          </div>

          {/* Right side context tag */}
          <div className="text-xs text-purple-200/90 font-semibold flex items-center gap-2">
            {activePortal === 'admin' ? (
              <span className="flex items-center gap-1.5 bg-purple-900/50 px-2.5 py-1 rounded-lg border border-purple-400/20 text-[11px]">
                <Shield className="w-3 h-3 text-purple-300" />
                <span>Admin Workspace • 6 Functional Modules</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 bg-[#88d600]/10 px-2.5 py-1 rounded-lg border border-[#88d600]/30 text-[11px] text-[#88d600]">
                <Headset className="w-3 h-3" />
                <span>Call Agent Workspace • {currentCaller ? currentCaller.name : 'Active Agent'}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Portal-Specific Tabs Row */}
      <div className="border-t border-[#311070] bg-[#200a4d]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 overflow-x-auto scrollbar-none">
          {activePortal === 'admin' ? (
            /* ADMIN NAVIGATION TABS */
            <div className="flex items-center space-x-1.5">
              {adminTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = adminTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setAdminTab(tab.id)}
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
          ) : (
            /* CALLER NAVIGATION TABS */
            <div className="flex items-center space-x-2 w-full justify-between">
              <div className="flex items-center space-x-1.5">
                {callerTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = callerSubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCallerSubTab(tab.id as 'queue' | 'performance' | 'history')}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#88d600] text-[#1e1b4b] shadow-md shadow-lime-950/20 border border-lime-300'
                          : 'text-purple-200/80 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#1e1b4b]' : 'text-purple-300'}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Quick Switch back to Admin Portal */}
              <button
                type="button"
                onClick={() => setActivePortal('admin')}
                className="hidden sm:flex items-center gap-1 text-xs text-purple-200 hover:text-white font-bold px-2 py-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <span>Switch to Admin Portal</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
