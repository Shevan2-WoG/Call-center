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
  Home,
  LogOut,
  Lock,
} from 'lucide-react';
import { Caller } from '../types';
import { isToday, formatFriendlyDate, getTodayDateString } from '../utils/dateUtils';

interface NavbarProps {
  activeView: 'home' | 'caller' | 'admin';
  setActiveView: (view: 'home' | 'caller' | 'admin') => void;
  onLockAdmin: () => void;
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
  onResetData: () => void;
  onEmptyData: () => void;
  isSyncing: boolean;
  isAdminAuthenticated: boolean;
  isAutoRenewEnabled?: boolean;
  onResetToToday?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  onLockAdmin,
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
  isAdminAuthenticated,
  isAutoRenewEnabled = true,
  onResetToToday,
}) => {
  // Admin tabs list (only visible when in Admin mode)
  const adminTabs = [
    { id: 'dashboard', label: 'Distribution & Ops', icon: Share2 },
    { id: 'contacts', label: 'Contacts & Import', icon: FileSpreadsheet },
    { id: 'callers', label: 'Permanent Callers', icon: Users },
    { id: 'reports', label: 'Reports & Export', icon: BarChart3 },
  ];

  // Caller tabs list
  const callerTabs = [
    { id: 'queue', label: 'My Call Queue & Feedback', icon: ListTodo },
  ];

  return (
    <header className="bg-[#240c54] text-white border-b border-[#3b1580] sticky top-0 z-40 shadow-lg shadow-purple-950/30">
      {/* Top Bar: Brand, Navigation Access & Quick Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Main Hub Branding (clickable to return Home) */}
          <button
            type="button"
            onClick={() => setActiveView('home')}
            className="flex items-center gap-3 text-left cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#6c28f5] group-hover:bg-[#7b38fd] flex items-center justify-center text-white shadow-md shadow-purple-600/40 shrink-0 transition-colors">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-black text-white text-lg sm:text-xl tracking-tight">
                KIU Manifest Call Center Hub<span className="text-[#ff2a85]">.</span>
              </span>
              {isSyncing && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-[#88d600] font-bold bg-[#88d600]/10 px-2 py-0.5 rounded-md border border-[#88d600]/20">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Syncing
                </span>
              )}
            </div>
          </button>

          {/* Center/Right Navigation controls (Notice: Admin is completely removed from the top!) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Home navigation button */}
            {activeView !== 'home' && (
              <button
                type="button"
                onClick={() => setActiveView('home')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-purple-200 hover:text-white bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
                title="Go to Homepage"
              >
                <Home className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Home</span>
              </button>
            )}

            {/* Calling Date Picker & Daily Auto-Renew Status */}
            <div className="hidden sm:flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-xl px-2.5 py-1 text-xs text-purple-100">
              <Calendar className="w-3.5 h-3.5 text-purple-300 shrink-0" />
              <span className="font-bold text-purple-200 hidden md:inline">Date:</span>
              <input
                type="date"
                value={callingDate}
                onChange={(e) => setCallingDate(e.target.value)}
                className="bg-transparent font-bold text-white outline-none cursor-pointer"
                title={`Calling Date: ${formatFriendlyDate(callingDate, 'long')}`}
              />
              {isToday(callingDate) ? (
                <span
                  className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#88d600]/20 text-[#88d600] border border-[#88d600]/40 flex items-center gap-1 shrink-0 select-none"
                  title="Date auto-renews automatically every single day"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#88d600] animate-pulse" />
                  <span>Today (Auto)</span>
                </span>
              ) : (
                onResetToToday && (
                  <button
                    type="button"
                    onClick={onResetToToday}
                    className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#88d600] hover:bg-[#99ee00] text-[#1e1b4b] flex items-center gap-1 shrink-0 transition-colors cursor-pointer shadow-xs"
                    title={`Snap back to today's auto-renewing date (${formatFriendlyDate(getTodayDateString(), 'short')})`}
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Today</span>
                  </button>
                )
              )}
            </div>

            {/* CALLER PORTAL BUTTON: Open & readily accessible for all users */}
            {activeView !== 'caller' && (
              <button
                type="button"
                onClick={() => setActiveView('caller')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-[#88d600] hover:bg-[#99ee00] text-[#1e1b4b] shadow-md shadow-lime-950/30 transition-all cursor-pointer"
                title="Open Caller Portal"
              >
                <Headset className="w-4 h-4" />
                <span>Call Portal</span>
              </button>
            )}

            {/* If in CALLER PORTAL: Active Agent Switcher */}
            {activeView === 'caller' && callers.length > 0 && setSelectedCallerId && (
              <div className="flex items-center gap-1.5 bg-[#6c28f5]/60 border border-purple-300/30 rounded-xl px-2.5 py-1.5 text-xs text-white">
                <UserCheck className="w-3.5 h-3.5 text-[#88d600]" />
                <span className="font-bold text-purple-200 hidden lg:inline">Agent:</span>
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

            {/* If currently in ADMIN VIEW (unlocked via bottom password): show lock/exit and maintenance actions */}
            {activeView === 'admin' && (
              <div className="flex items-center gap-2">
                {/* Caller Constancy Status Badge */}
                <div
                  title="Callers are permanent and abide in the system without daily re-registration"
                  className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-xl bg-[#88d600]/15 border border-[#88d600]/30 text-[#88d600] text-[11px] font-bold"
                >
                  <UserCheck className="w-3.5 h-3.5 text-[#88d600]" />
                  <span>Callers: {callers.length} (Abiding)</span>
                </div>

                <button
                  type="button"
                  onClick={onEmptyData}
                  title="Selectively erase specific uploaded Excel spreadsheets or clear model items. Callers are permanent and protected."
                  className="text-xs px-2.5 py-1.5 rounded-xl border border-red-400/30 bg-red-500/20 hover:bg-red-500/30 text-red-100 flex items-center gap-1.5 transition-colors cursor-pointer font-bold"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-300" />
                  <span>Selective Erase</span>
                </button>

                <button
                  type="button"
                  onClick={onResetData}
                  title="Load sample demo data"
                  className="text-xs px-2.5 py-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-purple-100 flex items-center gap-1 transition-colors cursor-pointer font-bold"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">Sample Demo</span>
                </button>

                <button
                  type="button"
                  onClick={onLockAdmin}
                  title="Lock and exit Admin Portal"
                  className="text-xs px-3 py-1.5 rounded-xl bg-purple-900/60 border border-purple-400/30 hover:bg-purple-800 text-purple-200 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer font-bold"
                >
                  <Lock className="w-3.5 h-3.5 text-[#ff2a85]" />
                  <span>Lock Admin</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Tabs Row: Only shown if inside CALLER PORTAL or ADMIN PORTAL (Keeps homepage clean and uncluttered) */}
      {activeView === 'caller' && (
        <div className="border-t border-[#311070] bg-[#1a0742]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between overflow-x-auto scrollbar-none gap-2">
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

            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-purple-300 font-semibold">
              <Headset className="w-3.5 h-3.5 text-[#88d600]" />
              Agent: <strong className="text-white">{currentCaller ? currentCaller.name : 'All Queue'}</strong>
            </span>
          </div>
        </div>
      )}

      {activeView === 'admin' && (
        <div className="border-t border-[#311070] bg-[#1a0742]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 overflow-x-auto scrollbar-none">
            <div className="flex items-center space-x-1.5">
              <div className="hidden sm:flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-purple-300/80 mr-2 bg-purple-950/60 px-2.5 py-1 rounded-lg border border-purple-500/30">
                <Shield className="w-3 h-3 text-[#ff2a85]" />
                <span>Admin Modules:</span>
              </div>
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
          </div>
        </div>
      )}
    </header>
  );
};
