import React, { useState } from 'react';
import { Assignment, CallAttempt, Caller, AvailabilityStatus, CallOutcome } from '../types';
import { formatFriendlyDate, isToday } from '../utils/dateUtils';
import {
  Headset,
  PhoneCall,
  MessageSquare,
  CheckCircle2,
  Search,
  RotateCcw,
  MapPin,
  Tag,
  Check,
  Zap,
  AlertCircle,
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
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [savingFeedbackKey, setSavingFeedbackKey] = useState<string | null>(null);
  const [justSavedId, setJustSavedId] = useState<string | null>(null);
  const [notesDrafts, setNotesDrafts] = useState<Record<string, string>>({});
  const [statusUpdating, setStatusUpdating] = useState(false);

  if (!currentCaller) {
    return (
      <div className="bg-[#fbf7fe] rounded-3xl border border-[#e2d0fa] p-12 text-center max-w-xl mx-auto my-8 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-[#f3efff] text-[#6c28f5] flex items-center justify-center mx-auto mb-4 shadow-xs">
          <Headset className="w-7 h-7" />
        </div>
        <h3 className="text-base font-black text-[#1e1b4b] mb-1">No Active Caller Available</h3>
        <p className="text-xs text-[#7c7896] font-medium leading-relaxed">
          There are no callers registered in the system yet. Add callers in the Admin Portal.
        </p>
      </div>
    );
  }

  // Filter assignments for this caller on this date
  const myAssignments = assignments.filter(
    (a) =>
      (a.callerId === currentCaller.id || a.currentCallerId === currentCaller.id) &&
      a.callingDate === callingDate
  );

  const totalAssigned = myAssignments.length;
  const completedList = myAssignments.filter((a) => a.status === 'Completed');
  const pendingList = myAssignments.filter((a) => a.status !== 'Completed');
  const completedCount = completedList.length;
  const pendingCount = pendingList.length;

  const filteredAssignments = myAssignments.filter((a) => {
    const matchesSearch =
      a.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.contactPhone.includes(searchTerm) ||
      (a.contactLocation && a.contactLocation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.contactCategory && a.contactCategory.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterTab === 'pending') return a.status !== 'Completed';
    if (filterTab === 'completed') return a.status === 'Completed';
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

  // 1-Click Box Feedback Selector
  const handleSelectFeedback = async (asg: Assignment, outcome: CallOutcome) => {
    const key = `${asg.id}-${outcome}`;
    setSavingFeedbackKey(key);
    try {
      const draftNote = notesDrafts[asg.id] || asg.contactNotes || '';
      await onSaveAttempt({
        contactId: asg.contactId,
        callerId: currentCaller.id,
        callerName: currentCaller.name,
        assignmentId: asg.id,
        outcome,
        comment: draftNote ? `${outcome}: ${draftNote}` : outcome,
      });
      setJustSavedId(asg.id);
      setTimeout(() => setJustSavedId(null), 2500);
    } catch (err) {
      console.error('Failed to record feedback:', err);
    } finally {
      setSavingFeedbackKey(null);
    }
  };

  // Feedback outcomes matching user specifications:
  // Availability boxes + Column 1 boxes with confirmed, unconfirmed, needs follow-up, be reminded, etc.
  const availabilityOptions: { label: string; outcome: CallOutcome; color: string }[] = [
    { label: 'Available', outcome: 'Available', color: 'emerald' },
    { label: 'Unavailable', outcome: 'Unavailable', color: 'rose' },
  ];

  const primaryFeedbackBoxes: { label: string; outcome: CallOutcome; color: string }[] = [
    { label: 'Confirmed', outcome: 'Confirmed', color: 'emerald' },
    { label: 'Unconfirmed', outcome: 'Unconfirmed', color: 'amber' },
    { label: 'Needs Follow-up', outcome: 'Needs Follow-up', color: 'purple' },
    { label: 'Be Reminded', outcome: 'Be Reminded', color: 'blue' },
    { label: 'Recall / Busy', outcome: 'Busy', color: 'slate' },
    { label: 'Wrong Number', outcome: 'Wrong Number', color: 'pink' },
  ];

  return (
    <div className="space-y-6">
      {/* Caller Portal Top Card: Profile, Shift Status & Workload Counts */}
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
                  Caller Workspace
                </span>
              </div>
              <p className="text-xs text-[#7c7896] mt-0.5 font-medium flex flex-wrap items-center gap-1.5">
                <span>Date:</span>
                <strong className="text-[#1e1b4b]">{formatFriendlyDate(callingDate, 'medium')}</strong>
                {isToday(callingDate) && (
                  <span className="px-1.5 py-0.2 rounded-md text-[10px] font-extrabold bg-[#88d600]/20 text-[#4c7a00]">
                    Today
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
              >
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
              >
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
              >
                Off
              </button>
            </div>

            {/* Quick Switch Agent (for admin/testing) */}
            {onSwitchCaller && allCallers.length > 1 && (
              <div className="flex items-center gap-2 bg-[#f8f2fe] border border-[#e2d0fa] rounded-2xl p-1.5">
                <span className="text-xs text-[#7c7896] font-bold pl-1 hidden lg:inline">Caller:</span>
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

        {/* Workload Counts */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-[#f5ecfd] p-3.5 rounded-2xl border border-[#e2d0fa] text-center sm:text-left">
            <span className="text-[11px] font-bold text-[#7c7896] uppercase tracking-wider">
              Total Assigned
            </span>
            <div className="text-xl sm:text-2xl font-black text-[#1e1b4b] mt-0.5">{totalAssigned}</div>
          </div>

          <div className="bg-[#88d600]/10 p-3.5 rounded-2xl border border-[#88d600]/20 text-center sm:text-left">
            <span className="text-[11px] font-bold text-[#629c00] uppercase tracking-wider">
              Completed
            </span>
            <div className="text-xl sm:text-2xl font-black text-[#4a7700] mt-0.5">{completedCount}</div>
          </div>

          <div className="bg-[#ffb800]/10 p-3.5 rounded-2xl border border-[#ffb800]/20 text-center sm:text-left">
            <span className="text-[11px] font-bold text-[#b47800] uppercase tracking-wider">
              Pending
            </span>
            <div className="text-xl sm:text-2xl font-black text-[#925f00] mt-0.5">{pendingCount}</div>
          </div>
        </div>
      </div>

      {/* CALL QUEUE & DIRECT FEEDBACK AREA */}
      <div className="bg-[#fbf7fe] rounded-3xl border border-[#e2d0fa] shadow-sm overflow-hidden">
        {/* Scriptural Start Message: Hebrews 6:10 AMPC */}
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
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterTab === 'all'
                  ? 'bg-[#6c28f5] text-white shadow-xs'
                  : 'bg-[#f8f2fe] text-[#1e1b4b] border border-[#e2d0fa] hover:bg-[#efe0fc]'
              }`}
            >
              All Assigned ({totalAssigned})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterTab === 'pending'
                  ? 'bg-[#ffb800] text-white shadow-xs'
                  : 'bg-[#f8f2fe] text-[#1e1b4b] border border-[#e2d0fa] hover:bg-[#efe0fc]'
              }`}
            >
              Pending ({pendingCount})
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
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#7c7896]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search assigned leads..."
              className="pl-8 pr-3 py-1.5 text-xs bg-[#f8f2fe] border border-[#e2d0fa] rounded-xl outline-none focus:border-[#6c28f5] focus:bg-white w-full sm:w-60 font-medium text-[#1e1b4b]"
            />
          </div>
        </div>

        {/* Assigned Contacts with Direct Feedback Column */}
        <div className="divide-y divide-[#e2d0fa]">
          {filteredAssignments.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#7c7896] font-medium">
              {searchTerm
                ? 'No matching contacts found.'
                : filterTab === 'completed'
                ? 'No completed calls yet.'
                : 'No contacts assigned to your queue for this date.'}
            </div>
          ) : (
            filteredAssignments.map((asg, index) => {
              const cleanPhone = asg.contactPhone.replace(/[^0-9]/g, '');
              const waGreeting = encodeURIComponent(
                `Hello ${asg.contactName}, this is ${currentCaller.name} following up with you from KIU Manifest.`
              );
              const isCompleted = asg.status === 'Completed';
              const currentOutcome = asg.lastOutcome;
              const isSavedJustNow = justSavedId === asg.id;

              return (
                <div
                  key={asg.id}
                  className={`p-4 sm:p-5 transition-colors ${
                    isCompleted ? 'bg-[#fbfaff]' : 'hover:bg-[#f6eeff]'
                  }`}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                    {/* COLUMN 1: Contact Details & Quick Calling Actions (lg: 5 cols) */}
                    <div className="lg:col-span-5 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#f3efff] text-[#6c28f5] text-[11px] font-black flex items-center justify-center border border-[#e2d0fa] shrink-0">
                          {index + 1}
                        </span>
                        <h4 className="text-sm font-black text-[#1e1b4b] truncate">
                          {asg.contactName}
                        </h4>

                        {isCompleted && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#88d600]/20 text-[#4c7a00] border border-[#88d600]/30 flex items-center gap-1 shrink-0">
                            <Check className="w-3 h-3" /> Done
                          </span>
                        )}

                        {asg.reassignmentHistory && asg.reassignmentHistory.length > 0 && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#ffb800]/20 text-[#925f00] flex items-center gap-0.5 shrink-0">
                            <RotateCcw className="w-2.5 h-2.5" /> Reassigned
                          </span>
                        )}
                      </div>

                      {/* Phone & Location Metadata */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#7c7896] font-medium">
                        <span className="font-mono text-[#6c28f5] font-bold text-xs sm:text-sm">
                          {asg.contactPhone}
                        </span>
                        {asg.contactLocation && asg.contactLocation !== 'Unspecified' && (
                          <span className="flex items-center gap-1 text-[11px]">
                            <MapPin className="w-3 h-3 text-[#7c7896]" />
                            {asg.contactLocation}
                          </span>
                        )}
                        {asg.contactCategory && asg.contactCategory !== 'General' && (
                          <span className="flex items-center gap-1 text-[11px]">
                            <Tag className="w-3 h-3 text-[#6c28f5]" />
                            {asg.contactCategory}
                          </span>
                        )}
                      </div>

                      {asg.contactNotes && (
                        <p className="text-[11px] text-[#7c7896] italic bg-white/70 px-2 py-1 rounded-lg border border-[#e2d0fa] max-w-md">
                          Note: {asg.contactNotes}
                        </p>
                      )}

                      {/* Action buttons: Call / WhatsApp */}
                      <div className="flex items-center gap-2 pt-1">
                        <a
                          href={`tel:${asg.contactPhone}`}
                          className="px-3 py-1 bg-[#f3efff] hover:bg-[#6c28f5] text-[#6c28f5] hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#e2d0fa]"
                          title="Dial contact"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </a>

                        <a
                          href={`https://wa.me/${cleanPhone}?text=${waGreeting}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 bg-[#25D366]/15 hover:bg-[#25D366] text-[#128C7E] hover:text-white border border-[#25D366]/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                          title="Open WhatsApp message"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>

                        {currentOutcome && (
                          <span className="ml-auto text-[11px] font-black px-2 py-0.5 rounded-lg bg-[#6c28f5]/10 text-[#6c28f5] border border-[#6c28f5]/20">
                            Logged: {currentOutcome}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* COLUMN 2: Direct Feedback Tick-Boxes (lg: 7 cols) */}
                    <div className="lg:col-span-7 bg-[#fbf7fe] p-3.5 rounded-2xl border border-[#e2d0fa] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-[#1e1b4b] uppercase tracking-wider flex items-center gap-1">
                          <Zap className="w-3 h-3 text-[#ffb800]" />
                          Input Feedback (Click to Record Outcome):
                        </span>
                        {isSavedJustNow && (
                          <span className="text-[11px] font-black text-[#4c7a00] bg-[#88d600]/20 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                            <Check className="w-3 h-3" /> Saved!
                          </span>
                        )}
                      </div>

                      {/* Row 1: Availability Checkboxes */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold text-[#7c7896] uppercase">Availability:</span>
                        {availabilityOptions.map((opt) => {
                          const isSelected = currentOutcome === opt.outcome;
                          const isSaving = savingFeedbackKey === `${asg.id}-${opt.outcome}`;

                          return (
                            <button
                              key={opt.outcome}
                              type="button"
                              onClick={() => handleSelectFeedback(asg, opt.outcome)}
                              disabled={isSaving}
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                                isSelected
                                  ? opt.color === 'emerald'
                                    ? 'bg-[#88d600] text-white border-[#88d600] shadow-xs'
                                    : 'bg-[#ff2a85] text-white border-[#ff2a85] shadow-xs'
                                  : 'bg-white text-[#1e1b4b] border-[#e2d0fa] hover:border-[#6c28f5] hover:bg-[#f5ecfd]'
                              }`}
                            >
                              <span
                                className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                                  isSelected
                                    ? 'bg-white text-[#1e1b4b] border-white'
                                    : 'border-[#cbaff8]'
                                }`}
                              >
                                {isSelected ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : null}
                              </span>
                              <span>{isSaving ? 'Saving...' : opt.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Row 2: Feedback Outcome Column Boxes (Confirmed, Unconfirmed, Needs Follow-up, Be Reminded, etc.) */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {primaryFeedbackBoxes.map((box) => {
                          const isSelected = currentOutcome === box.outcome;
                          const isSaving = savingFeedbackKey === `${asg.id}-${box.outcome}`;

                          return (
                            <button
                              key={box.outcome}
                              type="button"
                              onClick={() => handleSelectFeedback(asg, box.outcome)}
                              disabled={isSaving}
                              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer text-left ${
                                isSelected
                                  ? 'bg-[#6c28f5] text-white border-[#6c28f5] shadow-xs'
                                  : 'bg-white text-[#1e1b4b] border-[#e2d0fa] hover:border-[#6c28f5] hover:bg-[#f5ecfd]'
                              }`}
                            >
                              <span
                                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? 'bg-white text-[#6c28f5] border-white'
                                    : 'border-[#cbaff8]'
                                }`}
                              >
                                {isSelected ? <Check className="w-3 h-3 stroke-[3]" /> : null}
                              </span>
                              <span className="truncate">{isSaving ? '...' : box.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Optional inline quick note */}
                      <div className="pt-1">
                        <input
                          type="text"
                          placeholder="Quick feedback notes (e.g. Call back at 3 PM, agreed)..."
                          value={notesDrafts[asg.id] ?? ''}
                          onChange={(e) =>
                            setNotesDrafts((prev) => ({ ...prev, [asg.id]: e.target.value }))
                          }
                          onBlur={() => {
                            const val = notesDrafts[asg.id];
                            if (val && currentOutcome) {
                              handleSelectFeedback(asg, currentOutcome);
                            }
                          }}
                          className="w-full text-xs px-3 py-1.5 bg-white border border-[#e2d0fa] rounded-xl outline-none focus:border-[#6c28f5] font-medium text-[#1e1b4b] placeholder-[#a6a1c2]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
