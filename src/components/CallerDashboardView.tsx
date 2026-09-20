import React, { useState } from 'react';
import { Assignment, CallAttempt, Caller, AvailabilityStatus, CallOutcome } from '../types';
import { formatFriendlyDate, isToday } from '../utils/dateUtils';
import { CallFeedbackModal } from './CallFeedbackModal';
import { ContactHistoryModal } from './ContactHistoryModal';
import {
  Headset,
  PhoneCall,
  MessageSquare,
  CheckCircle2,
  Clock,
  Search,
  RotateCcw,
  Calendar,
  History,
  AlertCircle,
  Tag,
  MapPin,
  Target,
  BarChart3,
  ListTodo,
  TrendingUp,
  UserCheck,
  Zap,
} from 'lucide-react';

interface CallerDashboardViewProps {
  currentCaller?: Caller;
  assignments: Assignment[];
  callingDate: string;
  attempts: CallAttempt[];
  onSaveAttempt: (attempt: Omit<CallAttempt, 'id' | 'calledAt'>) => Promise<void>;
  allCallers: Caller[];
  onSwitchCaller?: (callerId: string) => void;
  onSaveCaller?: (caller: Caller) => Promise<void>;
  activeSubTab?: 'queue' | 'performance' | 'history';
  onSubTabChange?: (tab: 'queue' | 'performance' | 'history') => void;
}

export const CallerDashboardView: React.FC<CallerDashboardViewProps> = ({
  currentCaller,
  assignments,
  callingDate,
  attempts,
  onSaveAttempt,
  allCallers,
  onSwitchCaller,
  onSaveCaller,
  activeSubTab: externalSubTab,
  onSubTabChange,
}) => {
  const [internalSubTab, setInternalSubTab] = useState<'queue' | 'performance' | 'history'>('queue');
  const subTab = externalSubTab || internalSubTab;
  const setSubTab = (tab: 'queue' | 'performance' | 'history') => {
    if (onSubTabChange) onSubTabChange(tab);
    setInternalSubTab(tab);
  };

  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'completed' | 'followup'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFeedbackAssignment, setActiveFeedbackAssignment] = useState<Assignment | null>(null);
  const [historyContact, setHistoryContact] = useState<{ id: string; name: string } | null>(null);
  const [quickActionLoadingId, setQuickActionLoadingId] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  if (!currentCaller) {
    return (
      <div className="bg-[#fbf7fe] rounded-3xl border border-[#e2d0fa] p-12 text-center max-w-xl mx-auto my-8 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-[#f3efff] text-[#6c28f5] flex items-center justify-center mx-auto mb-4 shadow-xs">
          <Headset className="w-7 h-7" />
        </div>
        <h3 className="text-base font-black text-[#1e1b4b] mb-1">No Active Caller Available</h3>
        <p className="text-xs text-[#7c7896] font-medium leading-relaxed">
          There are no callers registered in the system yet. Add callers in the Admin Portal. Callers abide permanently and remain constant across all dates.
        </p>
      </div>
    );
  }

  // Filter assignments for this caller on this date
  const myAssignments = assignments.filter(
    (a) => (a.callerId === currentCaller.id || a.currentCallerId === currentCaller.id) && a.callingDate === callingDate
  );

  const totalAssigned = myAssignments.length;
  const completedList = myAssignments.filter((a) => a.status === 'Completed');
  const pendingList = myAssignments.filter((a) => a.status !== 'Completed');
  const completedCount = completedList.length;
  const pendingCount = pendingList.length;
  const progressPercent = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;

  // Follow-up count
  const followUpAssignments = myAssignments.filter(
    (a) => a.lastOutcome === 'Follow-up Required' || a.lastOutcome === 'Recall'
  );
  const followUpCount = followUpAssignments.length;

  // Caller's call attempts made today
  const myAttempts = attempts.filter((att) => att.callerId === currentCaller.id);

  // Outcome statistics for this caller today
  const outcomeCounts: Record<string, number> = {};
  myAttempts.forEach((att) => {
    outcomeCounts[att.outcome] = (outcomeCounts[att.outcome] || 0) + 1;
  });

  const targetCalls = currentCaller.targetCalls || 30;
  const targetPercent = Math.min(100, Math.round((completedCount / targetCalls) * 100));

  const filteredAssignments = myAssignments.filter((a) => {
    const matchesSearch =
      a.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.contactPhone.includes(searchTerm) ||
      (a.contactLocation && a.contactLocation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.contactCategory && a.contactCategory.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterTab === 'pending') return a.status !== 'Completed';
    if (filterTab === 'completed') return a.status === 'Completed';
    if (filterTab === 'followup') return a.lastOutcome === 'Follow-up Required' || a.lastOutcome === 'Recall';
    return true;
  });

  // Handler to toggle shift availability status directly
  const handleUpdateStatus = async (newStatus: AvailabilityStatus) => {
    if (!onSaveCaller) return;
    setStatusUpdating(true);
    try {
      await onSaveCaller({
        ...currentCaller,
        availabilityStatus: newStatus,
      });
    } finally {
      setStatusUpdating(false);
    }
  };

  // Quick 1-click outcome logger
  const handleQuickOutcome = async (asg: Assignment, outcome: CallOutcome) => {
    setQuickActionLoadingId(asg.id + outcome);
    try {
      await onSaveAttempt({
        contactId: asg.contactId,
        callerId: currentCaller.id,
        callerName: currentCaller.name,
        assignmentId: asg.id,
        outcome,
        comment: `Quick logged as ${outcome}`,
      });
    } finally {
      setQuickActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Caller Portal Top Card: Profile, Shift Status & Sub-Navigation */}
      <div className="bg-[#fbf7fe] rounded-3xl border border-[#e2d0fa] p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#e2d0fa]">
          {/* Caller Identity */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#6c28f5] text-white flex items-center justify-center shadow-md shadow-purple-600/25 relative">
              <Headset className="w-6 h-6" />
              <span
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                  currentCaller.availabilityStatus === 'available'
                    ? 'bg-[#88d600]'
                    : currentCaller.availabilityStatus === 'busy'
                    ? 'bg-[#ffb800]'
                    : 'bg-[#ff2a85]'
                }`}
                title={`Status: ${currentCaller.availabilityStatus}`}
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-black text-[#1e1b4b]">{currentCaller.name}</h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-[#f3efff] text-[#6c28f5] border border-[#e2d0fa]">
                  KIU Manifest Agent Workspace
                </span>
              </div>
              <p className="text-xs text-[#7c7896] mt-0.5 font-medium flex flex-wrap items-center gap-1.5">
                <span>Calling Date:</span>
                <strong className="text-[#1e1b4b]">{formatFriendlyDate(callingDate, 'medium')}</strong>
                {isToday(callingDate) && (
                  <span className="px-1.5 py-0.2 rounded-md text-[10px] font-extrabold bg-[#88d600]/20 text-[#4c7a00]">
                    Today (Auto)
                  </span>
                )}
                <span>• WhatsApp:</span>
                <strong className="text-[#6c28f5] font-mono">{currentCaller.whatsappNumber}</strong>
              </p>
            </div>
          </div>

          {/* Right Controls: Shift Status & Switch Agent */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Shift Status Selector */}
            <div className="flex items-center gap-1.5 bg-[#f5ecfd] border border-[#e2d0fa] p-1.5 rounded-2xl">
              <span className="text-[11px] font-bold text-[#7c7896] px-1.5 hidden sm:inline">
                Shift:
              </span>
              <button
                type="button"
                onClick={() => handleUpdateStatus('available')}
                disabled={statusUpdating}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  currentCaller.availabilityStatus === 'available'
                    ? 'bg-[#88d600] text-white shadow-xs'
                    : 'text-[#7c7896] hover:text-[#1e1b4b]'
                }`}
                title="Mark shift as Available"
              >
                <span className="w-2 h-2 rounded-full bg-white inline-block sm:hidden" />
                Available
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus('busy')}
                disabled={statusUpdating}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  currentCaller.availabilityStatus === 'busy'
                    ? 'bg-[#ffb800] text-white shadow-xs'
                    : 'text-[#7c7896] hover:text-[#1e1b4b]'
                }`}
                title="Mark shift as Busy"
              >
                <span className="w-2 h-2 rounded-full bg-white inline-block sm:hidden" />
                Busy
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus('unavailable')}
                disabled={statusUpdating}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  currentCaller.availabilityStatus === 'unavailable'
                    ? 'bg-[#ff2a85] text-white shadow-xs'
                    : 'text-[#7c7896] hover:text-[#1e1b4b]'
                }`}
                title="Mark shift as Unavailable"
              >
                <span className="w-2 h-2 rounded-full bg-white inline-block sm:hidden" />
                Off Shift
              </button>
            </div>

            {/* Quick Switch Agent (for supervisor or testing) */}
            {onSwitchCaller && allCallers.length > 1 && (
              <div className="flex items-center gap-2 bg-[#f8f2fe] border border-[#e2d0fa] rounded-2xl p-1.5">
                <span className="text-xs text-[#7c7896] font-bold pl-1 hidden lg:inline">Switch:</span>
                <select
                  value={currentCaller.id}
                  onChange={(e) => onSwitchCaller(e.target.value)}
                  aria-label="Switch Caller"
                  className="bg-[#fbf7fe] text-xs font-bold text-[#1e1b4b] border border-[#e2d0fa] rounded-xl px-2.5 py-1 outline-none cursor-pointer"
                >
                  {allCallers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Status Warning if marked Unavailable */}
        {currentCaller.availabilityStatus === 'unavailable' && (
          <div className="mt-4 p-3.5 bg-[#fff1f2] border border-[#fecdd3] rounded-2xl text-xs text-[#ff2a85] flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              You are marked as <strong>Off Shift / Unavailable</strong>. Your remaining {pendingCount} pending leads can be reassigned by the administrator to active callers.
            </span>
          </div>
        )}

        {/* Workload Metrics Row */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#f5ecfd] p-3.5 sm:p-4 rounded-2xl border border-[#e2d0fa]">
            <span className="text-[11px] font-bold text-[#7c7896] uppercase tracking-wider">
              Total Assigned
            </span>
            <div className="text-xl sm:text-2xl font-black text-[#1e1b4b] mt-1">{totalAssigned}</div>
          </div>

          <div className="bg-[#88d600]/10 p-3.5 sm:p-4 rounded-2xl border border-[#88d600]/20">
            <span className="text-[11px] font-bold text-[#629c00] uppercase tracking-wider">
              Completed
            </span>
            <div className="text-xl sm:text-2xl font-black text-[#4a7700] mt-1">{completedCount}</div>
          </div>

          <div className="bg-[#ffb800]/10 p-3.5 sm:p-4 rounded-2xl border border-[#ffb800]/20">
            <span className="text-[11px] font-bold text-[#b47800] uppercase tracking-wider">
              Pending Calls
            </span>
            <div className="text-xl sm:text-2xl font-black text-[#925f00] mt-1">{pendingCount}</div>
          </div>

          <div className="bg-[#ff2a85]/10 p-3.5 sm:p-4 rounded-2xl border border-[#ff2a85]/20">
            <span className="text-[11px] font-bold text-[#ff2a85] uppercase tracking-wider">
              Follow-ups Due
            </span>
            <div className="text-xl sm:text-2xl font-black text-[#d61168] mt-1">{followUpCount}</div>
          </div>
        </div>

        {/* Target Progress Bar */}
        <div className="mt-4 bg-[#f5ecfd] p-3.5 sm:p-4 rounded-2xl border border-[#e2d0fa]">
          <div className="flex items-center justify-between text-xs font-bold text-[#1e1b4b] mb-2">
            <span className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#6c28f5]" />
              Daily Shift Target: {completedCount} / {targetCalls} calls completed
            </span>
            <span className="font-black text-[#6c28f5]">{targetPercent}%</span>
          </div>
          <div className="w-full bg-[#dfcafa] rounded-full h-2.5 overflow-hidden p-0.5">
            <div
              className="bg-[#6c28f5] h-1.5 rounded-full transition-all duration-500 shadow-xs"
              style={{ width: `${targetPercent}%` }}
            />
          </div>
        </div>

        {/* Caller Portal Sub-tabs: Queue, Performance, History */}
        <div className="mt-5 pt-3 border-t border-[#e2d0fa] flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSubTab('queue')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'queue'
                ? 'bg-[#6c28f5] text-white shadow-md shadow-purple-950/20'
                : 'bg-[#f8f2fe] text-[#7c7896] hover:text-[#1e1b4b] hover:bg-[#f3efff] border border-[#e2d0fa]'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            <span>My Call Queue ({pendingCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('performance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'performance'
                ? 'bg-[#6c28f5] text-white shadow-md shadow-purple-950/20'
                : 'bg-[#f8f2fe] text-[#7c7896] hover:text-[#1e1b4b] hover:bg-[#f3efff] border border-[#e2d0fa]'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Shift Target & Performance</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'history'
                ? 'bg-[#6c28f5] text-white shadow-md shadow-purple-950/20'
                : 'bg-[#f8f2fe] text-[#7c7896] hover:text-[#1e1b4b] hover:bg-[#f3efff] border border-[#e2d0fa]'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Call Activity Log ({myAttempts.length})</span>
          </button>
        </div>
      </div>

      {/* ==================== SUB-VIEW 1: CALL QUEUE ==================== */}
      {subTab === 'queue' && (
        <div className="bg-[#fbf7fe] rounded-3xl border border-[#e2d0fa] shadow-sm overflow-hidden">
          {/* Scriptural Start Message for Caller Assignment Layout: Hebrews 6:10 AMPC */}
          <div className="m-4 p-4 bg-gradient-to-r from-[#fbf7fe] via-[#f5eaff] to-[#fbf7fe] border border-[#cbaff8] rounded-2xl shadow-2xs">
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5" role="img" aria-label="dove">🕊️</span>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#6c28f5] bg-white px-2 py-0.5 rounded-full border border-[#cbaff8]">
                    Hebrews 6:10 AMPC
                  </span>
                  <span className="text-xs font-bold text-[#1e1b4b]">
                    Hebrew 6:10 says... Your effort and availability is not in vain
                  </span>
                </div>
                <p className="text-xs text-[#1e1b4b] font-medium italic leading-relaxed bg-white/60 p-2.5 rounded-xl border border-[#e2d0fa]">
                  &ldquo;[10] For God is not unrighteous to forget or overlook your labor and the love which you have shown for His name&apos;s sake in ministering to the needs of the saints (His own consecrated people), as you still do.&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="p-4 border-b border-[#e2d0fa] bg-[#f3e8fd] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setFilterTab('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterTab === 'pending'
                    ? 'bg-[#ffb800] text-white shadow-xs'
                    : 'bg-[#f8f2fe] text-[#1e1b4b] border border-[#e2d0fa] hover:bg-[#efe0fc]'
                }`}
              >
                Pending Calls ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('followup')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterTab === 'followup'
                    ? 'bg-[#ff2a85] text-white shadow-xs'
                    : 'bg-[#f8f2fe] text-[#1e1b4b] border border-[#e2d0fa] hover:bg-[#efe0fc]'
                }`}
              >
                Follow-ups ({followUpCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('completed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterTab === 'completed'
                    ? 'bg-[#88d600] text-white shadow-xs'
                    : 'bg-[#f8f2fe] text-[#1e1b4b] border border-[#e2d0fa] hover:bg-[#efe0fc]'
                }`}
              >
                Completed ({completedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterTab === 'all'
                    ? 'bg-[#6c28f5] text-white shadow-xs'
                    : 'bg-[#f8f2fe] text-[#1e1b4b] border border-[#e2d0fa] hover:bg-[#efe0fc]'
                }`}
              >
                All Assigned ({totalAssigned})
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#7c7896]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, phone, district..."
                className="pl-8 pr-3 py-1.5 text-xs bg-[#f8f2fe] border border-[#e2d0fa] rounded-xl outline-none focus:border-[#6c28f5] focus:bg-white w-full sm:w-60 font-medium text-[#1e1b4b]"
              />
            </div>
          </div>

          {/* Contact Queue Items */}
          <div className="divide-y divide-[#e2d0fa]">
            {filteredAssignments.length === 0 ? (
              <div className="text-center py-12 text-[#7c7896] text-xs font-medium">
                {totalAssigned === 0
                  ? 'No contacts have been assigned to you for today yet. Contact the Administrator to distribute leads.'
                  : 'No contacts found matching the active filter.'}
              </div>
            ) : (
              filteredAssignments.map((asg, index) => {
                const isCompleted = asg.status === 'Completed';
                const isReassigned =
                  asg.reassignmentHistory && asg.reassignmentHistory.length > 0;
                const cleanPhone = asg.contactPhone.replace(/[^0-9]/g, '');
                const waGreeting = encodeURIComponent(
                  `Hello ${asg.contactName}, this is ${currentCaller.name} following up with you today regarding your inquiry.`
                );

                return (
                  <div
                    key={asg.id}
                    className={`p-4 transition-colors flex flex-col xl:flex-row xl:items-center justify-between gap-4 ${
                      isCompleted ? 'bg-[#f8f2fe]/60' : 'hover:bg-[#f3e9fd] bg-[#fbf7fe]'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[#7c7896] font-mono text-xs w-6">
                          #{index + 1}
                        </span>
                        <h4 className="font-bold text-[#1e1b4b] text-sm">{asg.contactName}</h4>
                        {isCompleted ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#88d600]/15 text-[#629c00] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {asg.lastOutcome || 'Completed'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ffb800]/15 text-[#b47800] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Pending Call
                          </span>
                        )}

                        {isReassigned && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f3efff] text-[#6c28f5] flex items-center gap-1 border border-[#e8e1f9]">
                            <RotateCcw className="w-3 h-3" />
                            Reassigned
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#7c7896] pl-8 font-medium">
                        <span className="font-mono text-[#6c28f5] font-bold">
                          {asg.contactPhone}
                        </span>
                        {asg.contactLocation && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#7c7896]" />
                            {asg.contactLocation}
                          </span>
                        )}
                        {asg.contactCategory && (
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3 text-[#6c28f5]" />
                            {asg.contactCategory}
                          </span>
                        )}
                      </div>

                      {asg.contactNotes && (
                        <p className="text-xs text-[#7c7896] pl-8 italic">
                          Notes: {asg.contactNotes}
                        </p>
                      )}

                      {/* Quick 1-Click Outcome Buttons for Fast Logging */}
                      <div className="flex flex-wrap items-center gap-1.5 pl-8 pt-1">
                        <span className="text-[10px] font-bold text-[#7c7896] uppercase tracking-wider mr-1 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-[#ffb800]" /> Quick Log:
                        </span>
                        {(['Available', 'Recall', 'Busy', 'No Answer', 'Phone Off', 'Interested'] as CallOutcome[]).map((oc) => (
                          <button
                            key={oc}
                            type="button"
                            onClick={() => handleQuickOutcome(asg, oc)}
                            disabled={quickActionLoadingId === asg.id + oc}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#f0e7fe] hover:bg-[#6c28f5] text-[#5816d6] hover:text-white border border-[#e2d0fa] transition-colors cursor-pointer"
                          >
                            {quickActionLoadingId === asg.id + oc ? '...' : oc}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Primary Calling and Feedback Actions */}
                    <div className="flex flex-wrap items-center gap-2 pl-8 xl:pl-0">
                      {/* Direct Tel Call */}
                      <a
                        href={`tel:${asg.contactPhone}`}
                        className="px-3 py-1.5 bg-[#f3efff] hover:bg-[#efe8fc] text-[#6c28f5] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                        title="Direct phone call"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-[#6c28f5]" />
                        <span>Call</span>
                      </a>

                      {/* WhatsApp Chat Link */}
                      <a
                        href={`https://wa.me/${cleanPhone}?text=${waGreeting}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] border border-[#25D366]/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                        title="Open WhatsApp chat with contact"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>

                      {/* Record Detailed Feedback */}
                      <button
                        type="button"
                        onClick={() => setActiveFeedbackAssignment(asg)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5 ${
                          isCompleted
                            ? 'bg-[#fbf9ff] hover:bg-[#f3efff] text-[#7c7896] hover:text-[#1e1b4b] border border-[#efe8fc]'
                            : 'bg-[#6c28f5] hover:bg-[#5816d6] text-white shadow-purple-600/20'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isCompleted ? 'Edit Feedback' : 'Log Feedback'}</span>
                      </button>

                      {/* History button */}
                      <button
                        type="button"
                        onClick={() => setHistoryContact({ id: asg.contactId, name: asg.contactName })}
                        className="p-2 text-[#7c7896] hover:text-[#1e1b4b] hover:bg-[#f3efff] rounded-xl transition-colors cursor-pointer"
                        title="View contact call history"
                      >
                        <History className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ==================== SUB-VIEW 2: SHIFT PERFORMANCE ==================== */}
      {subTab === 'performance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Target Completion Card */}
            <div className="bg-[#fbf7fe] rounded-3xl border border-[#e2d0fa] p-6 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-[#7c7896] uppercase tracking-wider">
                  Target Fulfillment
                </span>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#1e1b4b]">{completedCount}</span>
                  <span className="text-sm font-bold text-[#7c7896]">/ {targetCalls} calls target</span>
                </div>
                <div className="mt-4 w-full bg-[#dfcafa] rounded-full h-3 overflow-hidden p-0.5">
                  <div
                    className="bg-[#6c28f5] h-2 rounded-full transition-all duration-500 shadow-xs"
                    style={{ width: `${targetPercent}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-[#7c7896] mt-4 font-medium">
                {targetPercent >= 100
                  ? 'Outstanding work! Daily target has been achieved.'
                  : `${targetCalls - completedCount} more calls needed to meet your target.`}
              </p>
            </div>

            {/* Completion Rate */}
            <div className="bg-[#fbf7fe] rounded-3xl border border-[#e2d0fa] p-6 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-[#7c7896] uppercase tracking-wider">
                  Assigned Queue Pacing
                </span>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#629c00]">{progressPercent}%</span>
                  <span className="text-sm font-bold text-[#7c7896]">of today’s queue handled</span>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-[#7c7896] font-semibold">
                  <span>Pending: {pendingCount}</span>
                  <span>Handled: {completedCount}</span>
                </div>
              </div>
              <p className="text-xs text-[#7c7896] mt-4 font-medium">
                Keep an eye on contacts with scheduled callbacks to ensure zero missed follow-ups.
              </p>
            </div>

            {/* Total Call Attempts */}
            <div className="bg-[#fbf7fe] rounded-3xl border border-[#e2d0fa] p-6 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-[#7c7896] uppercase tracking-wider">
                  Call Logs Recorded
                </span>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#ff2a85]">{myAttempts.length}</span>
                  <span className="text-sm font-bold text-[#7c7896]">total attempts logged</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#e2d0fa] flex items-center justify-between text-xs">
                <span className="text-[#7c7896] font-medium">Follow-ups scheduled:</span>
                <span className="font-bold text-[#ff2a85]">{followUpCount}</span>
              </div>
            </div>
          </div>

          {/* Outcome Breakdown Grid */}
          <div className="bg-[#fbf7fe] rounded-3xl border border-[#e2d0fa] p-6 shadow-sm">
            <h3 className="text-sm font-black text-[#1e1b4b] mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#6c28f5]" />
              Breakdown of Call Outcomes Logged Today
            </h3>
            {Object.keys(outcomeCounts).length === 0 ? (
              <p className="text-xs text-[#7c7896] font-medium">
                No outcomes logged yet. Start dialing contacts from your call queue.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {Object.entries(outcomeCounts).map(([outcomeName, count]) => (
                  <div
                    key={outcomeName}
                    className="p-3 bg-[#f5ecfd] rounded-2xl border border-[#e2d0fa] flex items-center justify-between"
                  >
                    <span className="text-xs font-bold text-[#1e1b4b]">{outcomeName}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-black bg-[#6c28f5] text-white">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== SUB-VIEW 3: CALL ACTIVITY HISTORY ==================== */}
      {subTab === 'history' && (
        <div className="bg-[#fbf7fe] rounded-3xl border border-[#e2d0fa] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#e2d0fa] bg-[#f3e8fd] flex items-center justify-between">
            <h3 className="text-sm font-black text-[#1e1b4b] flex items-center gap-2">
              <History className="w-4 h-4 text-[#6c28f5]" />
              Call Attempt History for {currentCaller.name} ({myAttempts.length})
            </h3>
            <span className="text-xs font-bold text-[#7c7896]">
              Date: {formatFriendlyDate(callingDate, 'short')} {isToday(callingDate) ? '(Today)' : ''}
            </span>
          </div>

          {myAttempts.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#7c7896] font-medium">
              No calls have been logged yet for this agent today.
            </div>
          ) : (
            <div className="divide-y divide-[#e2d0fa]">
              {myAttempts
                .slice()
                .reverse()
                .map((att) => {
                  const asg = assignments.find((a) => a.id === att.assignmentId);
                  const contactName = asg ? asg.contactName : `Contact #${att.contactId}`;
                  const contactPhone = asg ? asg.contactPhone : '';

                  return (
                    <div key={att.id} className="p-4 hover:bg-[#f3e9fd] transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#1e1b4b] text-sm">{contactName}</span>
                            <span className="font-mono text-xs text-[#6c28f5] font-semibold">
                              {contactPhone}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#88d600]/15 text-[#629c00]">
                              {att.outcome}
                            </span>
                          </div>

                          {att.comment && (
                            <p className="text-xs text-[#7c7896] italic">"{att.comment}"</p>
                          )}

                          {att.followUpDate && (
                            <div className="text-[11px] text-[#ff2a85] font-semibold flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Scheduled Follow-up: {att.followUpDate} {att.preferredCallbackTime && `at ${att.preferredCallbackTime}`}
                            </div>
                          )}
                        </div>

                        <div className="text-right text-[11px] text-[#7c7896] font-mono">
                          {new Date(att.calledAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {activeFeedbackAssignment && (
        <CallFeedbackModal
          assignment={activeFeedbackAssignment}
          callerName={currentCaller.name}
          callerId={currentCaller.id}
          onSaveAttempt={onSaveAttempt}
          onClose={() => setActiveFeedbackAssignment(null)}
          onViewHistory={(id, name) => {
            setActiveFeedbackAssignment(null);
            setHistoryContact({ id, name });
          }}
        />
      )}

      {historyContact && (
        <ContactHistoryModal
          contactId={historyContact.id}
          contactName={historyContact.name}
          attempts={attempts}
          onClose={() => setHistoryContact(null)}
        />
      )}
    </div>
  );
};
