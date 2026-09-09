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
      {/* Top Banner & KPI metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unassigned Pool</span>
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{unassignedContacts.length}</span>
            <span className="text-xs text-slate-500">contacts ready</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Callers</span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{availableCallers.length}</span>
            <span className="text-xs text-slate-500">of {callers.length} total</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Today</span>
            <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <PhoneForwarded className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{dateAssignments.length}</span>
            <span className="text-xs text-slate-500">contacts distributed</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Calls Completed</span>
            <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{completedCount}</span>
            <span className="text-xs text-slate-500 font-medium">({progressPercent}% completed)</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Distribution Action Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Automated Contact Distribution Engine
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Calculates equal divisions according to Section 8: e.g. 103 contacts among 4 callers = 26, 26, 26, 25.
            </p>
          </div>

          <button
            type="button"
            disabled={unassignedContacts.length === 0 || availableCallers.length === 0 || isDistributing}
            onClick={handleExecuteDistribution}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:cursor-not-allowed"
          >
            <Share2 className="w-4 h-4" />
            {isDistributing ? 'Distributing...' : `Distribute ${unassignedContacts.length} Contacts Equally`}
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Active Callers Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
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
                    className={`p-3 rounded-lg border text-left flex items-start justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-400'
                        : 'border-slate-200 bg-white hover:bg-slate-50 opacity-70'
                    }`}
                  >
                    <div>
                      <span className="font-semibold text-sm text-slate-900 block">{c.name}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MessageSquare className="w-3 h-3 text-emerald-600" />
                        {c.whatsappNumber}
                      </span>
                      <span
                        className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          isAvail
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {c.availabilityStatus}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="mt-1 accent-emerald-600"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Distribution Simulation & Preview Math */}
          {unassignedContacts.length > 0 && availableCallers.length > 0 ? (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Fair Distribution Calculation Preview:
                </span>
                <span className="text-xs text-slate-500">
                  {unassignedContacts.length} contacts ÷ {availableCallers.length} callers
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {previewPlan.plan.map((item, idx) => (
                  <div key={item.caller.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">Caller #{idx + 1}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                        +{item.count} contacts
                      </span>
                    </div>
                    <span className="font-semibold text-sm text-slate-900 block mt-1">
                      {item.caller.name}
                    </span>
                    <span className="text-xs text-slate-400 mt-1 block">
                      WhatsApp: {item.caller.whatsappNumber}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : unassignedContacts.length === 0 ? (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs text-emerald-900">
                <span className="font-semibold">All contacts are currently distributed!</span> If you have new contacts, upload an Excel file from the "Contacts & Import" tab to distribute more.
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <span className="text-xs text-amber-800">
                Please select at least one available caller above to distribute the {unassignedContacts.length} unassigned contacts.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Distribution Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                WhatsApp Assignment Dispatch Hub
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Send callers their daily assignments directly to WhatsApp or copy formatted assignment rosters.
              </p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium border border-slate-200">
              Date: {callingDate}
            </span>
          </div>
        </div>

        <div className="p-5">
          {callers.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No callers registered. Register callers in the "Daily Callers" tab.
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
                    className="border border-slate-200 rounded-xl p-4 bg-white hover:border-slate-300 transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                              {caller.name}
                            </h3>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                caller.availabilityStatus === 'available'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {caller.availabilityStatus}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            WhatsApp: <span className="font-mono text-slate-700">{caller.whatsappNumber}</span>
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-lg font-bold text-slate-900">{assignedList.length}</span>
                          <span className="text-xs text-slate-400 block">Assigned</span>
                        </div>
                      </div>

                      {/* Work progress bar */}
                      <div className="mt-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                          <span>Progress: {completed}/{assignedList.length} completed</span>
                          <span className="font-semibold text-emerald-600">
                            {assignedList.length > 0 ? Math.round((completed / assignedList.length) * 100) : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-1.5 rounded-full"
                            style={{
                              width: `${assignedList.length > 0 ? (completed / assignedList.length) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Preview toggle */}
                      {isPreviewOpen && (
                        <div className="mt-3 p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg overflow-x-auto max-h-48 whitespace-pre-wrap leading-relaxed border border-slate-800">
                          {formattedMsg}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                        title="Send via WhatsApp Web or App"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Send WhatsApp
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        type="button"
                        onClick={() => handleCopy(caller.id, formattedMsg)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        {isCopied ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-medium">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copy Roster
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setActivePreviewCallerId(isPreviewOpen ? null : caller.id)}
                        className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
                      >
                        {isPreviewOpen ? 'Hide Text' : 'View Text'}
                      </button>

                      <button
                        type="button"
                        onClick={() => onSwitchToCaller(caller.id)}
                        className="ml-auto px-2.5 py-1.5 text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 hover:underline"
                        title="View Caller Workspace"
                      >
                        Agent View
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
