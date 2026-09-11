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
} from 'lucide-react';

interface DistributionViewProps {
  contacts: Contact[];
  callers: Caller[];
  assignments: Assignment[];
  callingDate: string;
  onDistribute: (newAssignments: Omit<Assignment, 'id'>[], team: DailyTeam) => Promise<void>;
  onSwitchToCaller: (callerId: string) => void;
}

export const DistributionView: React.FC<DistributionViewProps> = ({
  contacts,
  callers,
  assignments,
  callingDate,
  onDistribute,
  onSwitchToCaller,
}) => {
  const [selectedCallerIds, setSelectedCallerIds] = useState<string[]>(
    callers.filter((c) => c.availabilityStatus === 'available').map((c) => c.id)
  );

  React.useEffect(() => {
    setSelectedCallerIds(
      callers.filter((c) => c.availabilityStatus === 'available').map((c) => c.id)
    );
  }, [callers]);
  const [isDistributing, setIsDistributing] = useState(false);
  const [copiedCallerId, setCopiedCallerId] = useState<string | null>(null);
  const [activePreviewCallerId, setActivePreviewCallerId] = useState<string | null>(null);

  // Unassigned contacts pool
  const unassignedContacts = contacts.filter((c) => c.status === 'unassigned');
  const availableCallers = callers.filter((c) => selectedCallerIds.includes(c.id));

  // Current date assignments
  const dateAssignments = assignments.filter((a) => a.callingDate === callingDate);
  const completedCount = dateAssignments.filter((a) => a.status === 'Completed').length;
  const pendingCount = dateAssignments.length - completedCount;
  const progressPercent = dateAssignments.length > 0
    ? Math.round((completedCount / dateAssignments.length) * 100)
    : 0;

  // Calculate preview plan
  const previewPlan: DistributionResult = calculateDistribution(
    unassignedContacts,
    availableCallers,
    callingDate,
    `team_${callingDate}`
  );

  const toggleCaller = (id: string) => {
    setSelectedCallerIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExecuteDistribution = async () => {
    if (previewPlan.assignments.length === 0) return;
    setIsDistributing(true);
    try {
      const team: DailyTeam = {
        id: `team_${callingDate}`,
        callingDate,
        createdBy: 'Admin',
        status: 'active',
        totalContacts: dateAssignments.length + previewPlan.assignments.length,
        totalAssigned: dateAssignments.length + previewPlan.assignments.length,
        createdAt: new Date().toISOString(),
      };
      await onDistribute(previewPlan.assignments, team);
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
        <div className="bg-[#f8f6ff] border border-[#efe8fc] rounded-3xl p-6 shadow-sm">
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
                <div className="bg-white border border-[#efe8fc] rounded-2xl p-3.5 shadow-xs">
                  <strong className="block text-[#1e1b4b] font-black mb-1">1. Import Contacts</strong>
                  <span className="text-[#7c7896]">Go to <strong>Contacts & Import</strong> to upload your Excel (.xlsx) sheet.</span>
                </div>
                <div className="bg-white border border-[#efe8fc] rounded-2xl p-3.5 shadow-xs">
                  <strong className="block text-[#1e1b4b] font-black mb-1">2. Register Callers</strong>
                  <span className="text-[#7c7896]">Go to <strong>Daily Callers</strong> to enter agents & WhatsApp numbers.</span>
                </div>
                <div className="bg-white border border-[#efe8fc] rounded-2xl p-3.5 shadow-xs">
                  <strong className="block text-[#1e1b4b] font-black mb-1">3. Distribute Fairly</strong>
                  <span className="text-[#7c7896]">Run equal distribution and send WhatsApp assignment rosters.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner & KPI metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#efe8fc] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7c7896] uppercase tracking-wider">Unassigned Pool</span>
            <span className="w-9 h-9 rounded-xl bg-[#f3efff] text-[#6c28f5] flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#1e1b4b]">{unassignedContacts.length}</span>
            <span className="text-xs text-[#7c7896] font-medium">contacts ready</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#efe8fc] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7c7896] uppercase tracking-wider">Available Callers</span>
            <span className="w-9 h-9 rounded-xl bg-[#f3efff] text-[#6c28f5] flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#1e1b4b]">{availableCallers.length}</span>
            <span className="text-xs text-[#7c7896] font-medium">of {callers.length} active</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#efe8fc] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7c7896] uppercase tracking-wider">Assigned Today</span>
            <span className="w-9 h-9 rounded-xl bg-[#eef2ff] text-[#4f46e5] flex items-center justify-center">
              <PhoneForwarded className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#1e1b4b]">{dateAssignments.length}</span>
            <span className="text-xs text-[#7c7896] font-medium">dispatched</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#efe8fc] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7c7896] uppercase tracking-wider">Calls Completed</span>
            <span className="w-9 h-9 rounded-xl bg-[#f0fdf4] text-[#88d600] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#1e1b4b]">{completedCount}</span>
            <span className="text-xs font-bold text-[#88d600]">({progressPercent}%)</span>
          </div>
          <div className="w-full bg-[#f1eef9] rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-[#88d600] h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Distribution Action Section */}
      <div className="bg-white rounded-3xl border border-[#efe8fc] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#efe8fc] bg-[#fbf9ff] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-black text-[#1e1b4b] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#6c28f5]" />
              Automated Contact Distribution Engine
            </h2>
            <p className="text-xs text-[#7c7896] mt-0.5 font-medium">
              Calculates equal divisions according to Section 8: e.g. 103 contacts among 4 callers = 26, 26, 26, 25.
            </p>
          </div>

          <button
            type="button"
            disabled={unassignedContacts.length === 0 || availableCallers.length === 0 || isDistributing}
            onClick={handleExecuteDistribution}
            className="px-5 py-2.5 bg-[#6c28f5] hover:bg-[#5816d6] disabled:bg-slate-200 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-purple-700/20 cursor-pointer disabled:cursor-not-allowed"
          >
            <Share2 className="w-4 h-4" />
            {isDistributing ? 'Distributing...' : `Distribute ${unassignedContacts.length} Contacts Equally`}
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Active Callers Selection */}
          <div>
            <label className="block text-xs font-bold text-[#1e1b4b] uppercase tracking-wider mb-2">
              Select Callers Included in This Distribution:
            </label>
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
                        : 'border-[#efe8fc] bg-white hover:bg-[#faf8ff] opacity-75'
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

          {/* Distribution Simulation & Preview Math */}
          {unassignedContacts.length > 0 && availableCallers.length > 0 ? (
            <div className="bg-[#f8f6ff] rounded-2xl p-4 border border-[#efe8fc]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#1e1b4b] uppercase tracking-wider">
                  Fair Distribution Calculation Preview:
                </span>
                <span className="text-xs font-semibold text-[#6c28f5]">
                  {unassignedContacts.length} contacts ÷ {availableCallers.length} callers
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {previewPlan.plan.map((item, idx) => (
                  <div key={item.caller.id} className="bg-white p-3.5 rounded-xl border border-[#efe8fc] shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[#7c7896]">Caller #{idx + 1}</span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-[#f3efff] text-[#6c28f5] font-extrabold">
                        +{item.count} contacts
                      </span>
                    </div>
                    <span className="font-bold text-sm text-[#1e1b4b] block mt-1.5">
                      {item.caller.name}
                    </span>
                    <span className="text-xs text-[#7c7896] mt-1 block">
                      WhatsApp: {item.caller.whatsappNumber}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : unassignedContacts.length === 0 ? (
            <div className="p-4 bg-[#f8f6ff] rounded-2xl border border-[#efe8fc] flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#88d600] shrink-0" />
              <div className="text-xs text-[#1e1b4b]">
                <span className="font-bold">All contacts are distributed!</span> Upload more contacts in the &quot;Contacts &amp; Import&quot; tab to dispatch additional rosters.
              </div>
            </div>
          ) : (
            <div className="p-4 bg-[#fffbeb] rounded-2xl border border-[#fef3c7] flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-[#ffb800] shrink-0" />
              <span className="text-xs text-[#92400e] font-semibold">
                Please select at least one caller above to distribute the {unassignedContacts.length} unassigned contacts.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Distribution Section */}
      <div className="bg-white rounded-3xl border border-[#efe8fc] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#efe8fc] bg-[#fbf9ff]">
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
                    className="border border-[#efe8fc] rounded-2xl p-4 bg-white hover:border-[#6c28f5]/40 hover:shadow-md transition-all flex flex-col justify-between"
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
                      <div className="mt-3 bg-[#f8f6ff] p-2.5 rounded-xl border border-[#efe8fc]">
                        <div className="flex items-center justify-between text-xs text-[#7c7896] mb-1 font-medium">
                          <span>Progress: {completed}/{assignedList.length} completed</span>
                          <span className="font-bold text-[#88d600]">
                            {assignedList.length > 0 ? Math.round((completed / assignedList.length) * 100) : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-[#e8e1f9] rounded-full h-1.5 overflow-hidden">
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
                    <div className="mt-4 pt-3 border-t border-[#efe8fc] flex flex-wrap items-center gap-2">
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

