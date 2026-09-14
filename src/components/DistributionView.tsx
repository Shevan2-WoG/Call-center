import React, { useState } from 'react';
import {
  Contact,
  Caller,
  Assignment,
  DailyTeam,
} from '../types';
import {
  calculateDistribution,
  formatWhatsAppAssignmentMessage,
  generateWhatsAppUrl,
  DistributionResult,
} from '../services/distributionEngine';
import {
  Share2,
  Users,
  CheckCircle2,
  Copy,
  ExternalLink,
  PhoneForwarded,
  Sparkles,
  AlertCircle,
  MessageSquare,
  ArrowRight,
  Database,
  UserCheck,
  Clock,
  Activity,
  BarChart3,
} from 'lucide-react';

interface DistributionViewProps {
  contacts: Contact[];
  callers: Caller[];
  assignments: Assignment[];
  callingDate: string;
  onDistribute: (newAssignments: Omit<Assignment, 'id'>[], team: DailyTeam) => Promise<void>;
  onRedistributeAll?: (newAssignments: Omit<Assignment, 'id'>[], team: DailyTeam) => Promise<void>;
  onSwitchToCaller: (callerId: string) => void;
}

export const DistributionView: React.FC<DistributionViewProps> = ({
  contacts,
  callers,
  assignments,
  callingDate,
  onDistribute,
  onRedistributeAll,
  onSwitchToCaller,
}) => {
  // Default to selecting ALL callers in the system to ensure equal distribution across all parties
  const [selectedCallerIds, setSelectedCallerIds] = useState<string[]>(() =>
    callers.map((c) => c.id)
  );

  React.useEffect(() => {
    setSelectedCallerIds((prev) => {
      // If none selected or callers list changed, include all registered callers
      const validPrev = prev.filter((id) => callers.some((c) => c.id === id));
      return validPrev.length > 0 ? validPrev : callers.map((c) => c.id);
    });
  }, [callers]);

  const [isDistributing, setIsDistributing] = useState(false);
  const [copiedCallerId, setCopiedCallerId] = useState<string | null>(null);
  const [activePreviewCallerId, setActivePreviewCallerId] = useState<string | null>(null);
  const [distributionScope, setDistributionScope] = useState<'unassigned' | 'all'>('unassigned');

  // Unassigned contacts pool
  const unassignedContacts = contacts.filter((c) => c.status === 'unassigned');
  const availableCallers = callers.filter((c) => selectedCallerIds.includes(c.id));

  // Determine contacts pool based on scope
  const targetContactsPool = distributionScope === 'all' ? contacts : unassignedContacts;

  // Current date assignments
  const dateAssignments = assignments.filter((a) => a.callingDate === callingDate);
  const completedCount = dateAssignments.filter((a) => a.status === 'Completed').length;
  const pendingCount = dateAssignments.length - completedCount;
  const progressPercent =
    dateAssignments.length > 0
      ? Math.round((completedCount / dateAssignments.length) * 100)
      : 0;

  // Summary stats calculations for top dashboard section
  const totalContactsCount = contacts.length;
  const assignedContactsCount = contacts.filter((c) => c.status === 'assigned').length;
  const unassignedContactsCount = unassignedContacts.length;
  const contactAssignedPct =
    totalContactsCount > 0
      ? Math.round((assignedContactsCount / totalContactsCount) * 100)
      : 0;
  const contactUnassignedPct =
    totalContactsCount > 0 ? 100 - contactAssignedPct : 0;

  const totalRegisteredCallers = callers.length;
  const activeCallersCount = callers.filter((c) => c.availabilityStatus === 'available').length;
  const offDutyCallersCount = totalRegisteredCallers - activeCallersCount;
  const callerActivePct =
    totalRegisteredCallers > 0
      ? Math.round((activeCallersCount / totalRegisteredCallers) * 100)
      : 0;

  const totalDateAssignments = dateAssignments.length;
  const pendingPct =
    totalDateAssignments > 0
      ? Math.round((pendingCount / totalDateAssignments) * 100)
      : 0;

  // Calculate preview plan for the target contacts pool
  const previewPlan: DistributionResult = calculateDistribution(
    targetContactsPool,
    availableCallers,
    callingDate,
    `team_${callingDate}`
  );

  const toggleCaller = (id: string) => {
    setSelectedCallerIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllCallers = () => {
    setSelectedCallerIds(callers.map((c) => c.id));
  };

  const handleSelectAvailableOnly = () => {
    setSelectedCallerIds(
      callers
        .filter((c) => c.availabilityStatus === 'available')
        .map((c) => c.id)
    );
  };

  const handleDeselectAll = () => {
    setSelectedCallerIds([]);
  };

  const handleExecuteDistribution = async () => {
    if (previewPlan.assignments.length === 0 || availableCallers.length === 0) return;
    setIsDistributing(true);
    try {
      const team: DailyTeam = {
        id: `team_${callingDate}`,
        callingDate,
        createdBy: 'Admin',
        status: 'active',
        totalContacts: previewPlan.assignments.length,
        totalAssigned: previewPlan.assignments.length,
        createdAt: new Date().toISOString(),
      };

      if (distributionScope === 'all' && onRedistributeAll) {
        await onRedistributeAll(previewPlan.assignments, team);
      } else {
        await onDistribute(previewPlan.assignments, team);
      }
    } finally {
      setIsDistributing(false);
    }
  };

  const handleCopy = (callerId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCallerId(callerId);
    setTimeout(() => setCopiedCallerId(null), 2500);
  };

  // Group assignments by caller for dispatch
  const callerAssignmentMap = new Map<string, Assignment[]>();
  dateAssignments.forEach((a) => {
    const list = callerAssignmentMap.get(a.callerId) || [];
    list.push(a);
    callerAssignmentMap.set(a.callerId, list);
  });

  return (
    <div className="space-y-6">
      {/* Empty Database Guidance Notice */}
      {contacts.length === 0 && callers.length === 0 && (
        <div className="bg-[#f5ecfd] border border-[#e2d0fa] rounded-3xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-[#6c28f5] text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-[#1e1b4b]">Database Ready for Today&apos;s Campaign</h3>
                <span className="bg-[#ff2a85] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Clean Slate
                </span>
              </div>
              <p className="text-xs text-[#7c7896] leading-relaxed max-w-2xl font-medium">
                All previous logs have been cleared. Follow the 3-step workflow to import contacts and dispatch equal workloads:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="bg-[#fbf7fe] border border-[#e2d0fa] rounded-2xl p-3.5 shadow-xs">
                  <strong className="block text-[#1e1b4b] font-black mb-1">1. Import Contacts</strong>
                  <span className="text-[#7c7896]">Go to <strong>Contacts & Import</strong> to upload your Excel (.xlsx) sheet.</span>
                </div>
                <div className="bg-[#fbf7fe] border border-[#e2d0fa] rounded-2xl p-3.5 shadow-xs">
                  <strong className="block text-[#1e1b4b] font-black mb-1">2. Register Callers</strong>
                  <span className="text-[#7c7896]">Go to <strong>Daily Callers</strong> to enter agents & WhatsApp numbers.</span>
                </div>
                <div className="bg-[#fbf7fe] border border-[#e2d0fa] rounded-2xl p-3.5 shadow-xs">
                  <strong className="block text-[#1e1b4b] font-black mb-1">3. Distribute Fairly</strong>
                  <span className="text-[#7c7896]">Run equal distribution and send WhatsApp assignment rosters.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUMMARY STATS CARD SECTION: Total Contacts, Active Callers, Pending Assignments */}
      {/* ========================================================================= */}
      <section id="admin-summary-stats-section" aria-label="Campaign Summary Statistics" className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#6c28f5]" />
            <h2 className="text-xs font-black uppercase tracking-wider text-[#1e1b4b]">
              Campaign &amp; Fleet Operations Summary
            </h2>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-bold">
            <span className="px-2.5 py-0.5 rounded-full bg-[#f3efff] text-[#6c28f5] border border-[#e2d0fa]">
              Active Date: {callingDate}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#88d600]/15 text-[#558800] border border-[#88d600]/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#88d600] animate-pulse" />
              Live Telemetry
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CARD 1: Total Contacts */}
          <div
            id="admin-stats-total-contacts"
            className="bg-[#fbf7fe] p-5 rounded-3xl border border-[#e2d0fa] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#f3efff] text-[#6c28f5] flex items-center justify-center font-bold shadow-xs shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-black uppercase tracking-wider text-[#7c7896]">
                      Total Contacts
                    </span>
                    <span className="text-[11px] text-[#7c7896] font-medium">
                      Excel Master Database
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[#6c28f5]/10 text-[#6c28f5] border border-[#6c28f5]/20 whitespace-nowrap">
                  100% In System
                </span>
              </div>

              {/* Big Metric Display */}
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-[#1e1b4b] tracking-tight">
                  {totalContactsCount.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-[#7c7896]">
                  records
                </span>
              </div>

              {/* Highlighted Badges */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-[#6c28f5]/10 text-[#6c28f5] border border-[#6c28f5]/20 whitespace-nowrap">
                  {assignedContactsCount} Dispatched ({contactAssignedPct}%)
                </span>
                <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-[#88d600]/15 text-[#558800] border border-[#88d600]/30 whitespace-nowrap">
                  {unassignedContactsCount} Pool Ready
                </span>
              </div>
            </div>

            {/* Simple Data Visualization: Dual-Tone Distribution Bar */}
            <div className="mt-5 pt-3 border-t border-[#e2d0fa]/80">
              <div className="flex items-center justify-between text-[11px] font-bold mb-1.5 text-[#7c7896]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#6c28f5]" />
                  Assigned: {contactAssignedPct}%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#dfc7fc]" />
                  In Pool: {contactUnassignedPct}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#ede1fa] rounded-full overflow-hidden flex">
                <div
                  className="bg-[#6c28f5] h-full transition-all duration-500"
                  style={{ width: `${contactAssignedPct}%` }}
                  title={`${assignedContactsCount} Assigned (${contactAssignedPct}%)`}
                />
                <div
                  className="bg-[#dfc7fc] h-full transition-all duration-500"
                  style={{ width: `${contactUnassignedPct}%` }}
                  title={`${unassignedContactsCount} Ready in Pool (${contactUnassignedPct}%)`}
                />
              </div>
              <p className="text-[10px] text-[#7c7896] mt-1.5 font-medium">
                {totalContactsCount > 0
                  ? `${assignedContactsCount} assigned to callers • ${unassignedContactsCount} awaiting round-robin dispatch`
                  : 'Import Excel (.xlsx) file in Contacts view to seed the campaign pool'}
              </p>
            </div>
          </div>

          {/* CARD 2: Active Callers */}
          <div
            id="admin-stats-active-callers"
            className="bg-[#fbf7fe] p-5 rounded-3xl border border-[#e2d0fa] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#f0fdf4] text-[#88d600] flex items-center justify-center font-bold shadow-xs shrink-0">
                    <UserCheck className="w-5 h-5 text-[#558800]" />
                  </div>
                  <div>
                    <span className="block text-xs font-black uppercase tracking-wider text-[#7c7896]">
                      Active Callers
                    </span>
                    <span className="text-[11px] text-[#7c7896] font-medium">
                      Duty Fleet Roster
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[#88d600]/15 text-[#558800] border border-[#88d600]/30 flex items-center gap-1.5 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#88d600] animate-ping" />
                  {callerActivePct}% Shift Active
                </span>
              </div>

              {/* Big Metric Display */}
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-[#1e1b4b] tracking-tight">
                  {activeCallersCount}
                </span>
                <span className="text-xs font-bold text-[#7c7896]">
                  of {totalRegisteredCallers} callers available
                </span>
              </div>

              {/* Highlighted Badges */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-[#88d600]/15 text-[#558800] border border-[#88d600]/30 whitespace-nowrap">
                  {activeCallersCount} Online for Distribution
                </span>
                <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-[#f3efff] text-[#6c28f5] border border-[#e2d0fa] whitespace-nowrap">
                  Fleet Kept Constant
                </span>
              </div>
            </div>

            {/* Simple Data Visualization: Fleet Segments & Capacity Bar */}
            <div className="mt-5 pt-3 border-t border-[#e2d0fa]/80">
              <div className="flex items-center justify-between text-[11px] font-bold mb-1.5 text-[#7c7896]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#88d600]" />
                  Active: {activeCallersCount}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#cbd5e1]" />
                  Off Duty: {offDutyCallersCount}
                </span>
              </div>

              {/* Caller Fleet Dot Pills */}
              <div className="flex items-center gap-1.5 mb-2 overflow-x-auto py-0.5">
                {callers.slice(0, 8).map((caller) => {
                  const isAvailable = caller.availabilityStatus === 'available';
                  return (
                    <div
                      key={caller.id}
                      title={`${caller.name} (${caller.availabilityStatus})`}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 border transition-all ${
                        isAvailable
                          ? 'bg-[#88d600]/20 text-[#365700] border-[#88d600]/50 ring-1 ring-[#88d600]/30'
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}
                    >
                      {caller.name.charAt(0)}
                    </div>
                  );
                })}
                {callers.length > 8 && (
                  <span className="text-[10px] font-bold text-[#7c7896] px-1">
                    +{callers.length - 8} more
                  </span>
                )}
                {callers.length === 0 && (
                  <span className="text-[11px] text-[#7c7896] italic">
                    No callers registered
                  </span>
                )}
              </div>

              <div className="w-full h-2 bg-[#ede1fa] rounded-full overflow-hidden">
                <div
                  className="bg-[#88d600] h-full transition-all duration-500 rounded-full"
                  style={{ width: `${callerActivePct}%` }}
                />
              </div>
              <p className="text-[10px] text-[#7c7896] mt-1.5 font-medium">
                Callers are strictly preserved across data erase actions
              </p>
            </div>
          </div>

          {/* CARD 3: Pending Assignments */}
          <div
            id="admin-stats-pending-assignments"
            className="bg-[#fbf7fe] p-5 rounded-3xl border border-[#e2d0fa] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#fff1f2] text-[#ff2a85] flex items-center justify-center font-bold shadow-xs shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-black uppercase tracking-wider text-[#7c7896]">
                      Pending Assignments
                    </span>
                    <span className="text-[11px] text-[#7c7896] font-medium">
                      Active Shift Queue
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[#ff2a85]/10 text-[#d01464] border border-[#ff2a85]/20 whitespace-nowrap">
                  {pendingPct}% Remaining
                </span>
              </div>

              {/* Big Metric Display */}
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-[#1e1b4b] tracking-tight">
                  {pendingCount}
                </span>
                <span className="text-xs font-bold text-[#7c7896]">
                  calls to complete today
                </span>
              </div>

              {/* Highlighted Badges */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-[#fff1f2] text-[#ff2a85] border border-[#fecdd3] whitespace-nowrap">
                  {pendingCount} Awaiting Feedback
                </span>
                <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 whitespace-nowrap">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {completedCount} Completed ({progressPercent}%)
                </span>
              </div>
            </div>

            {/* Simple Data Visualization: Dual Progress Completion Tracker */}
            <div className="mt-5 pt-3 border-t border-[#e2d0fa]/80">
              <div className="flex items-center justify-between text-[11px] font-bold mb-1.5 text-[#7c7896]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#88d600]" />
                  Completed: {progressPercent}%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#ff2a85]" />
                  Pending: {pendingPct}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#ede1fa] rounded-full overflow-hidden flex">
                <div
                  className="bg-[#88d600] h-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                  title={`${completedCount} Completed (${progressPercent}%)`}
                />
                <div
                  className="bg-[#ff2a85] h-full transition-all duration-500"
                  style={{ width: `${pendingPct}%` }}
                  title={`${pendingCount} Pending (${pendingPct}%)`}
                />
              </div>
              <p className="text-[10px] text-[#7c7896] mt-1.5 font-medium">
                {totalDateAssignments > 0
                  ? `${completedCount} of ${totalDateAssignments} contacts called • ${pendingCount} remaining in caller queues`
                  : 'Run distribution engine below to assign contacts to callers'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Distribution Action Section */}
      <div className="bg-[#fbf7fe] rounded-3xl border border-[#e2d0fa] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#e2d0fa] bg-[#f3e8fd] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-[#1e1b4b] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#6c28f5]" />
                Automated Equal Contact Distribution Engine
              </h2>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#88d600]/15 text-[#558800] border border-[#88d600]/30">
                100% Equal Roster Guarantee
              </span>
            </div>
            <p className="text-xs text-[#7c7896] mt-0.5 font-medium">
              Equally distributes contacts among all registered parties regardless of fleet size or roster count.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={targetContactsPool.length === 0 || availableCallers.length === 0 || isDistributing}
              onClick={handleExecuteDistribution}
              className="px-5 py-2.5 bg-[#6c28f5] hover:bg-[#5816d6] disabled:bg-[#dfcaf8] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-purple-700/20 cursor-pointer disabled:cursor-not-allowed"
            >
              <Share2 className="w-4 h-4" />
              {isDistributing
                ? 'Distributing...'
                : `Distribute ${targetContactsPool.length} Contacts Equally`}
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Scope Selection (Unassigned vs All contacts) */}
          {contacts.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#f8f2fe] p-3 rounded-2xl border border-[#e2d0fa]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1e1b4b]">
                <span>Distribution Scope:</span>
                <div className="inline-flex rounded-xl bg-white/70 p-1 border border-[#e2d0fa]">
                  <button
                    type="button"
                    onClick={() => setDistributionScope('unassigned')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      distributionScope === 'unassigned'
                        ? 'bg-[#6c28f5] text-white shadow-xs'
                        : 'text-[#7c7896] hover:text-[#1e1b4b]'
                    }`}
                  >
                    Unassigned Contacts ({unassignedContacts.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDistributionScope('all')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      distributionScope === 'all'
                        ? 'bg-[#6c28f5] text-white shadow-xs'
                        : 'text-[#7c7896] hover:text-[#1e1b4b]'
                    }`}
                  >
                    All Contacts Full Re-balance ({contacts.length})
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-[#7c7896]">
                Target Pool:{' '}
                <strong className="text-[#6c28f5] font-extrabold">
                  {targetContactsPool.length} contacts
                </strong>{' '}
                to divide equally across{' '}
                <strong className="text-[#6c28f5] font-extrabold">
                  {availableCallers.length} callers
                </strong>
              </div>
            </div>
          )}

          {/* Active Callers Selection */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <label className="text-xs font-bold text-[#1e1b4b] uppercase tracking-wider">
                Select Callers Included in This Distribution ({selectedCallerIds.length} of {callers.length} selected):
              </label>

              {/* Quick selection helper buttons */}
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={handleSelectAllCallers}
                  className="px-2.5 py-1 rounded-lg bg-[#f3efff] text-[#6c28f5] hover:bg-[#6c28f5] hover:text-white font-bold transition-colors cursor-pointer border border-[#e8e1f9]"
                >
                  Select All ({callers.length})
                </button>
                <button
                  type="button"
                  onClick={handleSelectAvailableOnly}
                  className="px-2.5 py-1 rounded-lg bg-[#f0fdf4] text-[#15803d] hover:bg-[#15803d] hover:text-white font-bold transition-colors cursor-pointer border border-[#dcfce7]"
                >
                  Available Only ({callers.filter((c) => c.availabilityStatus === 'available').length})
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {callers.map((c) => {
                const isSelected = selectedCallerIds.includes(c.id);
                const isAvail = c.availabilityStatus === 'available';
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCaller(c.id)}
                    className={`p-3.5 rounded-2xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#6c28f5] bg-[#f3efff] ring-2 ring-[#6c28f5]/20 shadow-xs'
                        : 'border-[#e2d0fa] bg-[#f8f2fe] hover:bg-[#f3e9fd] opacity-75'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-sm text-[#1e1b4b] block">{c.name}</span>
                      <span className="text-xs text-[#7c7896] flex items-center gap-1 mt-0.5">
                        <MessageSquare className="w-3 h-3 text-[#6c28f5]" />
                        {c.whatsappNumber}
                      </span>
                      <span
                        className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          isAvail
                            ? 'bg-[#88d600]/15 text-[#629c00]'
                            : 'bg-[#ffb800]/20 text-[#b47800]'
                        }`}
                      >
                        {c.availabilityStatus}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="mt-1 accent-[#6c28f5] w-4 h-4 rounded cursor-pointer"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Distribution Simulation & Mathematical Equality Breakdown */}
          {targetContactsPool.length > 0 && availableCallers.length > 0 ? (
            <div className="bg-[#f3e8fd] rounded-2xl p-4 border border-[#e2d0fa] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e2d0fa] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1e1b4b] uppercase tracking-wider">
                      Equal Distribution Mathematical Verification
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#88d600]/20 text-[#4c8000]">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-[#6c28f5] font-semibold mt-0.5">
                    {targetContactsPool.length} contacts ÷ {availableCallers.length} callers ={' '}
                    <strong>{Math.floor(targetContactsPool.length / availableCallers.length)}</strong> contacts per caller
                    {targetContactsPool.length % availableCallers.length > 0 && (
                      <span className="text-[#7c7896] font-normal">
                        {' '}(+1 each for the first {targetContactsPool.length % availableCallers.length} callers to allocate 100% of contacts)
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-[#1e1b4b] font-bold bg-[#fbf7fe] px-3 py-1.5 rounded-xl border border-[#e2d0fa]">
                  <CheckCircle2 className="w-4 h-4 text-[#88d600]" />
                  <span>100% Distributed ({previewPlan.assignments.length} Contacts, 0 Leftover)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {previewPlan.plan.map((item, idx) => {
                  const sharePct =
                    targetContactsPool.length > 0
                      ? Math.round((item.count / targetContactsPool.length) * 100)
                      : 0;
                  return (
                    <div key={item.caller.id} className="bg-[#fbf7fe] p-3.5 rounded-xl border border-[#e2d0fa] shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#7c7896]">Party #{idx + 1}</span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-[#f3efff] text-[#6c28f5] font-extrabold">
                          {item.count} contacts ({sharePct}%)
                        </span>
                      </div>
                      <span className="font-bold text-sm text-[#1e1b4b] block mt-1.5 truncate">
                        {item.caller.name}
                      </span>
                      <span className="text-xs text-[#7c7896] mt-1 block">
                        WhatsApp: {item.caller.whatsappNumber}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : targetContactsPool.length === 0 ? (
            <div className="p-4 bg-[#f3e8fd] rounded-2xl border border-[#e2d0fa] flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#88d600] shrink-0" />
              <div className="text-xs text-[#1e1b4b]">
                <span className="font-bold">No contacts pending distribution!</span> Upload more contacts in the &quot;Contacts &amp; Import&quot; tab or select &quot;All Contacts Full Re-balance&quot; above to re-distribute existing rosters equally.
              </div>
            </div>
          ) : (
            <div className="p-4 bg-[#fffbeb] rounded-2xl border border-[#fef3c7] flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-[#ffb800] shrink-0" />
              <span className="text-xs text-[#92400e] font-semibold">
                Please select at least one caller above to distribute the {targetContactsPool.length} contacts.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Distribution Section */}
      <div className="bg-[#fbf7fe] rounded-3xl border border-[#e2d0fa] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#e2d0fa] bg-[#f3e8fd]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-[#1e1b4b] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#6c28f5]" />
                WhatsApp Assignment Dispatch Hub
              </h2>
              <p className="text-xs text-[#7c7896] mt-0.5 font-medium">
                Send callers their daily assignments directly to WhatsApp or copy formatted rosters.
              </p>
            </div>
            <span className="text-xs bg-[#f3efff] text-[#6c28f5] px-3 py-1 rounded-full font-bold border border-[#e8e1f9]">
              Date: {callingDate}
            </span>
          </div>
        </div>

        <div className="p-5">
          {callers.length === 0 ? (
            <div className="text-center py-8 text-[#7c7896] text-sm">
              No callers registered. Register callers in the &quot;Daily Callers&quot; tab.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {callers.map((caller) => {
                const assignedList = callerAssignmentMap.get(caller.id) || [];
                const completed = assignedList.filter((a) => a.status === 'Completed').length;
                const formattedMsg = formatWhatsAppAssignmentMessage(
                  caller.name,
                  callingDate,
                  assignedList.map((a) => ({
                    name: a.contactName,
                    phone: a.contactPhone,
                    location: a.contactLocation,
                    category: a.contactCategory,
                    notes: a.contactNotes,
                  }))
                );
                const waUrl = generateWhatsAppUrl(caller.whatsappNumber, formattedMsg);
                const isCopied = copiedCallerId === caller.id;
                const isPreviewOpen = activePreviewCallerId === caller.id;

                return (
                  <div
                    key={caller.id}
                    className="border border-[#e2d0fa] rounded-2xl p-4 bg-[#f8f2fe] hover:border-[#6c28f5]/40 hover:bg-[#f4ebfd] hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-[#1e1b4b] text-sm sm:text-base">
                              {caller.name}
                            </h3>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                caller.availabilityStatus === 'available'
                                   ? 'bg-[#88d600]/15 text-[#629c00]'
                                   : 'bg-[#ffb800]/20 text-[#b47800]'
                              }`}
                            >
                              {caller.availabilityStatus}
                            </span>
                          </div>
                          <p className="text-xs text-[#7c7896] mt-1 flex items-center gap-1">
                            WhatsApp: <span className="font-mono text-[#1e1b4b] font-semibold">{caller.whatsappNumber}</span>
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-xl font-black text-[#1e1b4b]">{assignedList.length}</span>
                          <span className="text-[11px] text-[#7c7896] block font-semibold">Assigned</span>
                        </div>
                      </div>

                      {/* Work progress bar */}
                      <div className="mt-3 bg-[#ede0fc] p-2.5 rounded-xl border border-[#dfcafa]">
                        <div className="flex items-center justify-between text-xs text-[#7c7896] mb-1 font-medium">
                          <span>Progress: {completed}/{assignedList.length} completed</span>
                          <span className="font-bold text-[#88d600]">
                            {assignedList.length > 0 ? Math.round((completed / assignedList.length) * 100) : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-[#dfcafa] rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-[#88d600] h-1.5 rounded-full"
                            style={{
                              width: `${assignedList.length > 0 ? (completed / assignedList.length) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Preview toggle */}
                      {isPreviewOpen && (
                        <div className="mt-3 p-3 bg-[#1e1b4b] text-purple-200 font-mono text-[11px] rounded-xl overflow-x-auto max-h-48 whitespace-pre-wrap leading-relaxed border border-purple-900">
                          {formattedMsg}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 pt-3 border-t border-[#dfcafa] flex flex-wrap items-center gap-2">
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-[#88d600] hover:bg-[#78be00] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Send via WhatsApp
                      </a>

                      <button
                        type="button"
                        onClick={() => handleCopy(caller.id, formattedMsg)}
                        className="px-3 py-1.5 bg-[#f3efff] hover:bg-[#eae3fe] text-[#6c28f5] rounded-xl text-xs font-bold flex items-center gap-1.5 border border-[#e8e1f9] transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {isCopied ? 'Copied!' : 'Copy Roster'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setActivePreviewCallerId(isPreviewOpen ? null : caller.id)}
                        className="px-2.5 py-1.5 text-xs text-[#7c7896] hover:text-[#1e1b4b] font-semibold"
                      >
                        {isPreviewOpen ? 'Hide Text' : 'Preview Text'}
                      </button>

                      <button
                        type="button"
                        onClick={() => onSwitchToCaller(caller.id)}
                        className="ml-auto px-2.5 py-1.5 text-xs text-[#6c28f5] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        Open Workspace
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

