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
  ExternalLink,
  ArrowRight,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
import { UserRole, Caller, AvailabilityStatus } from '../types';

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
  onSaveCaller,
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

  const handleQuickStatusChange = async (newStatus: AvailabilityStatus) => {
    if (!currentCaller || !onSaveCaller) return;
    await onSaveCaller({
      ...currentCaller,
      availabilityStatus: newStatus,
    });
  };

  return (
    <header className="bg-[#240c54] text-white border-b border-[#3b1580] sticky top-0 z-40 shadow-lg shadow-purple-950/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Level Bar: Branding, Portal Switcher & Controls */}
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Logo & Portal Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#6c28f5] flex items-center justify-center text-white shadow-md shadow-purple-600/30">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-white text-base sm:text-lg tracking-tight">
                  Muhindo Call Center<span className="text-[#ff2a85]">.</span>
                </span>

                {/* Active Portal Indicator Badge */}
                {activePortal === 'admin' ? (
                  <span className="text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full bg-[#6c28f5] text-white font-extrabold uppercase tracking-wider flex items-center gap-1 border border-purple-300/30">
                    <Shield className="w-3 h-3" />
                    Admin Portal
                  </span>
                ) : (
                  <span className="text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full bg-[#88d600] text-[#1e1b4b] font-extrabold uppercase tracking-wider flex items-center gap-1">
                    <Headset className="w-3 h-3" />
                    Caller Portal
                  </span>
                )}

                {isSyncing && (
                  <span className="hidden sm:flex items-center gap-1 text-xs text-purple-200">
                    <RefreshCw className="w-3 h-3 animate-spin text-[#88d600]" />
                    Syncing
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-purple-200/90 font-medium mt-0.5">
                <span className="text-white font-bold">Owned by Muhindo</span>
                <span className="text-purple-400">•</span>
                <span className="text-purple-200">Developed by <strong className="text-white font-semibold">Arnible</strong></span>
              </div>
            </div>
          </div>

          {/* Center / Right: Primary Portal Switcher & Specific Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* The Dedicated Portal Switcher */}
            <div className="flex items-center bg-[#170638] p-1 rounded-2xl border border-white/20 shadow-inner">
              <button
                type="button"
                onClick={() => setActivePortal('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activePortal === 'admin'
                    ? 'bg-[#6c28f5] text-white shadow-md shadow-purple-950/50'
                    : 'text-purple-200/80 hover:text-white'
                }`}
                title="Open Admin Command Center"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Portal</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePortal('caller')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activePortal === 'caller'
                    ? 'bg-[#88d600] text-[#1e1b4b] shadow-md shadow-lime-950/30'
                    : 'text-purple-200/80 hover:text-white'
                }`}
                title="Open Caller Agent Workspace"
              >
                <Headset className="w-3.5 h-3.5" />
                <span>Caller Portal</span>
              </button>
            </div>

            {/* Calling Date Picker (Universal / Admin) */}
            <div className="hidden md:flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-xl px-2.5 py-1.5 text-xs text-purple-100">
              <Calendar className="w-3.5 h-3.5 text-purple-300" />
              <span className="font-bold text-purple-200">Date:</span>
              <input
                type="date"
                value={callingDate}
                onChange={(e) => setCallingDate(e.target.value)}
                className="bg-transparent font-bold text-white outline-none cursor-pointer"
                title="Calling Date"
              />
            </div>

            {/* If in CALLER PORTAL: Show Active Caller Selector & Quick Status */}
            {activePortal === 'caller' && callers.length > 0 && (
              <div className="flex items-center gap-2">
                {/* Agent Dropdown */}
                {setSelectedCallerId && (
                  <div className="flex items-center gap-1.5 bg-[#6c28f5]/50 border border-purple-300/30 rounded-xl px-2.5 py-1.5 text-xs text-white">
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
              </div>
            )}

            {/* If in ADMIN PORTAL: Show Empty Database and Sample Demo buttons */}
            {activePortal === 'admin' && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onEmptyData}
                  title="Empty database and wipe contacts, callers, and assignments"
                  className="text-xs px-2.5 py-1.5 rounded-xl border border-red-400/30 bg-red-500/20 hover:bg-red-500/30 text-red-100 flex items-center gap-1 transition-colors cursor-pointer font-bold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">Empty DB</span>
                </button>

                <button
                  type="button"
                  onClick={onResetData}
                  title="Load sample demonstration data"
                  className="text-xs px-2.5 py-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-purple-100 flex items-center gap-1 transition-colors cursor-pointer font-bold"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">Sample Demo</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Portal-Specific Sub-Navigation Bar */}
        <div className="flex items-center justify-between border-t border-purple-900/40 py-2 overflow-x-auto scrollbar-none">
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

              {/* Quick Jump Back to Admin Portal */}
              <button
                type="button"
                onClick={() => setActivePortal('admin')}
                className="hidden sm:flex items-center gap-1 text-xs text-purple-200 hover:text-white font-bold px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
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
