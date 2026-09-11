import React from 'react';
import {
  Search,
  MessageSquare,
  Bell,
  SlidersHorizontal,
  Calendar,
  Headset,
  RefreshCw,
  Trash2,
  Shield,
  Menu,
  X,
} from 'lucide-react';
import { UserRole } from '../types';

interface TopHeaderProps {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  callingDate: string;
  setCallingDate: (date: string) => void;
  selectedCallerId?: string;
  setSelectedCallerId?: (id: string) => void;
  callers: { id: string; name: string }[];
  onEmptyData: () => void;
  isSyncing: boolean;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentRole,
  setCurrentRole,
  callingDate,
  setCallingDate,
  selectedCallerId,
  setSelectedCallerId,
  callers,
  onEmptyData,
  isSyncing,
  mobileMenuOpen,
  setMobileMenuOpen,
  searchTerm = '',
  setSearchTerm,
}) => {
  const selectedCaller = callers.find((c) => c.id === selectedCallerId);

  return (
    <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-[#efe8fc]">
      {/* Left: Greeting matching "Hey, Rohit" */}
      <div className="flex items-center justify-between w-full md:w-auto gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-[#f3efff] text-[#6c28f5] hover:bg-[#eae3fe] cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#1e1b4b] tracking-tight">
              Hey, {currentRole === 'caller' && selectedCaller ? selectedCaller.name : 'Elizabeth'}
            </h1>
            <p className="text-xs text-[#7c7896] font-medium hidden sm:block">
              {currentRole === 'caller'
                ? 'Your assigned contact roster & calling workspace'
                : 'Call center contact distribution & operational dispatch'}
            </p>
          </div>
        </div>

        {isSyncing && (
          <span className="flex items-center gap-1.5 text-xs text-[#6c28f5] bg-[#f3efff] px-2.5 py-1 rounded-full font-semibold border border-[#e8e1f9]">
            <RefreshCw className="w-3 h-3 animate-spin text-[#6c28f5]" />
            Syncing
          </span>
        )}
      </div>

      {/* Center: Search pill matching "What do you want to eat today..." */}
      <div className="w-full md:max-w-xs lg:max-w-sm">
        <div className="relative flex items-center bg-[#f8f6ff] border border-[#efe8fc] hover:border-[#6c28f5]/40 focus-within:border-[#6c28f5] rounded-full px-4 py-2 transition-all">
          <Search className="w-4 h-4 text-[#7c7896] shrink-0 mr-2" />
          <input
            type="text"
            placeholder="Search leads, phone, or caller..."
            value={searchTerm}
            onChange={(e) => setSearchTerm?.(e.target.value)}
            className="w-full bg-transparent text-xs sm:text-sm text-[#1e1b4b] placeholder:text-[#9ca3af] outline-none font-medium"
          />
        </div>
      </div>

      {/* Right Controls: Exactly matching the 3 square action buttons + Profile in PNG */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap self-end md:self-auto">
        {/* Calling Date Selector */}
        <div className="flex items-center gap-1.5 bg-[#f8f6ff] border border-[#efe8fc] rounded-xl px-2.5 py-1.5 text-xs text-[#1e1b4b]">
          <Calendar className="w-3.5 h-3.5 text-[#6c28f5]" />
          <input
            type="date"
            value={callingDate}
            onChange={(e) => setCallingDate(e.target.value)}
            className="bg-transparent font-bold text-[#1e1b4b] outline-none cursor-pointer text-xs"
            title="Campaign Calling Date"
          />
        </div>

        {/* Role Switcher */}
        <div className="flex items-center bg-[#f8f6ff] p-0.5 rounded-xl border border-[#efe8fc]">
          <button
            type="button"
            onClick={() => setCurrentRole('admin')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              currentRole === 'admin'
                ? 'bg-[#6c28f5] text-white shadow-xs'
                : 'text-[#7c7896] hover:text-[#1e1b4b]'
            }`}
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => setCurrentRole('caller')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              currentRole === 'caller'
                ? 'bg-[#6c28f5] text-white shadow-xs'
                : 'text-[#7c7896] hover:text-[#1e1b4b]'
            }`}
          >
            Caller
          </button>
          <button
            type="button"
            onClick={() => setCurrentRole('tech_lead')}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              currentRole === 'tech_lead'
                ? 'bg-[#1e1b4b] text-white shadow-xs'
                : 'text-[#7c7896] hover:text-[#1e1b4b]'
            }`}
            title="Tech Lead System Audit"
          >
            <Shield className="w-3 h-3 inline mr-0.5" />
            Tech
          </button>
        </div>

        {/* Caller selection dropdown if in caller mode */}
        {currentRole === 'caller' && setSelectedCallerId && callers.length > 0 && (
          <div className="flex items-center gap-1 bg-[#f3efff] border border-[#e8e1f9] rounded-xl px-2.5 py-1 text-xs">
            <Headset className="w-3.5 h-3.5 text-[#6c28f5]" />
            <select
              value={selectedCallerId}
              onChange={(e) => setSelectedCallerId(e.target.value)}
              aria-label="Active Agent"
              className="bg-transparent text-[#6c28f5] font-bold outline-none cursor-pointer text-xs"
            >
              {callers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 1. Dark Purple Chat Icon Button (#4a15a3) */}
        <button
          type="button"
          title="WhatsApp Dispatch & Messages"
          className="w-9 h-9 rounded-xl bg-[#4a15a3] hover:bg-[#3b0f85] text-white flex items-center justify-center shadow-sm cursor-pointer transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        {/* 2. Indigo/Purple Notification Bell (#5d28e0) */}
        <div className="relative">
          <button
            type="button"
            title="Notifications & Alerts"
            className="w-9 h-9 rounded-xl bg-[#5d28e0] hover:bg-[#4d1fc0] text-white flex items-center justify-center shadow-sm cursor-pointer transition-colors"
          >
            <Bell className="w-4 h-4" />
          </button>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#ff2a85] rounded-full border-2 border-white" />
        </div>

        {/* 3. Golden Amber Settings / Data Management Button (#ffb800) */}
        <button
          type="button"
          onClick={onEmptyData}
          title="Empty database and wipe records to start fresh"
          className="w-9 h-9 rounded-xl bg-[#ffb800] hover:bg-[#e6a600] text-white flex items-center justify-center shadow-sm cursor-pointer transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Profile Avatar matching PNG top-right photo */}
        <div className="w-9 h-9 rounded-xl bg-[#1e1b4b] text-white flex items-center justify-center text-xs font-bold overflow-hidden ring-2 ring-[#efe8fc] shadow-xs">
          <span>ER</span>
        </div>
      </div>
    </header>
  );
};
