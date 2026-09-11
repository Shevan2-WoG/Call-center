import React, { useState } from 'react';
import { Assignment, CallAttempt, Caller } from '../types';
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
} from 'lucide-react';

interface CallerDashboardViewProps {
  currentCaller?: Caller;
  assignments: Assignment[];
  callingDate: string;
  attempts: CallAttempt[];
  onSaveAttempt: (attempt: Omit<CallAttempt, 'id' | 'calledAt'>) => Promise<void>;
  allCallers: Caller[];
  onSwitchCaller?: (callerId: string) => void;
}

export const CallerDashboardView: React.FC<CallerDashboardViewProps> = ({
  currentCaller,
  assignments,
  callingDate,
  attempts,
  onSaveAttempt,
  allCallers,
  onSwitchCaller,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'completed' | 'followup'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFeedbackAssignment, setActiveFeedbackAssignment] = useState<Assignment | null>(null);
  const [historyContact, setHistoryContact] = useState<{ id: string; name: string } | null>(null);

  if (!currentCaller) {
    return (
      <div className="bg-white rounded-3xl border border-[#efe8fc] p-12 text-center max-w-xl mx-auto my-8 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-[#f3efff] text-[#6c28f5] flex items-center justify-center mx-auto mb-4 shadow-xs">
          <Headset className="w-7 h-7" />
        </div>
        <h3 className="text-base font-black text-[#1e1b4b] mb-1">No Active Caller Available</h3>
        <p className="text-xs text-[#7c7896] font-medium leading-relaxed">
          There are no callers registered in the system yet. Register daily callers in the "Daily Callers" tab to begin calling operations.
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
  const followUpCount = myAssignments.filter(
    (a) => a.lastOutcome === 'Follow-up Required' || a.lastOutcome === 'Recall'
  ).length;

  const filteredAssignments = myAssignments.filter((a) => {
    const matchesSearch =
      a.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.contactPhone.includes(searchTerm) ||
      (a.contactLocation && a.contactLocation.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterTab === 'pending') return a.status !== 'Completed';
    if (filterTab === 'completed') return a.status === 'Completed';
    if (filterTab === 'followup') return a.lastOutcome === 'Follow-up Required' || a.lastOutcome === 'Recall';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Agent Workspace Banner & Workload Tracker */}
      <div className="bg-white rounded-3xl border border-[#efe8fc] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#efe8fc]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#6c28f5] text-white flex items-center justify-center shadow-md shadow-purple-600/25">
              <Headset className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-[#1e1b4b]">{currentCaller.name}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#88d600]/15 text-[#629c00] border border-[#88d600]/30">
                  {currentCaller.availabilityStatus}
                </span>
              </div>
              <p className="text-xs text-[#7c7896] mt-0.5 font-medium">
                Calling Date: <strong className="text-[#1e1b4b]">{callingDate}</strong> • WhatsApp:{' '}
                <strong className="text-[#6c28f5] font-mono">{currentCaller.whatsappNumber}</strong>
              </p>
            </div>
          </div>

          {/* Quick Caller Switcher */}
          {onSwitchCaller && allCallers.length > 1 && (
            <div className="flex items-center gap-2 bg-[#fbf9ff] border border-[#efe8fc] rounded-xl p-1.5 self-start md:self-auto">
              <span className="text-xs text-[#7c7896] font-bold pl-1">Switch Agent:</span>
              <select
                value={currentCaller.id}
                onChange={(e) => onSwitchCaller(e.target.value)}
                aria-label="Switch Agent"
                className="bg-white text-xs font-bold text-[#1e1b4b] border border-[#efe8fc] rounded-lg px-2.5 py-1 outline-none cursor-pointer"
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

        {/* Workload Metrics: Total, Completed, Pending, Follow-ups */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#fbf9ff] p-4 rounded-2xl border border-[#efe8fc]">
            <span className="text-[11px] font-bold text-[#7c7896] uppercase tracking-wider">
              Total Assigned
            </span>
            <div className="text-2xl font-black text-[#1e1b4b] mt-1">{totalAssigned}</div>
          </div>

          <div className="bg-[#88d600]/10 p-4 rounded-2xl border border-[#88d600]/20">
            <span className="text-[11px] font-bold text-[#629c00] uppercase tracking-wider">
              Completed
            </span>
            <div className="text-2xl font-black text-[#4a7700] mt-1">{completedCount}</div>
          </div>

          <div className="bg-[#ffb800]/10 p-4 rounded-2xl border border-[#ffb800]/20">
            <span className="text-[11px] font-bold text-[#b47800] uppercase tracking-wider">
              Pending Calls
            </span>
            <div className="text-2xl font-black text-[#925f00] mt-1">{pendingCount}</div>
          </div>

          <div className="bg-[#ff2a85]/10 p-4 rounded-2xl border border-[#ff2a85]/20">
            <span className="text-[11px] font-bold text-[#ff2a85] uppercase tracking-wider">
              Follow-ups
            </span>
            <div className="text-2xl font-black text-[#d61168] mt-1">{followUpCount}</div>
          </div>
        </div>

        {/* Work Progress Bar */}
        <div className="mt-5 bg-[#fbf9ff] p-4 rounded-2xl border border-[#efe8fc]">
          <div className="flex items-center justify-between text-xs font-bold text-[#1e1b4b] mb-2">
            <span>Overall Workload Progress</span>
            <span className="font-black text-[#6c28f5]">{progressPercent}%</span>
          </div>
          <div className="w-full bg-[#efe8fc] rounded-full h-3 overflow-hidden p-0.5">
            <div
              className="bg-[#6c28f5] h-2 rounded-full transition-all duration-500 shadow-xs"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Assigned Contacts List & Calling Actions */}
      <div className="bg-white rounded-3xl border border-[#efe8fc] shadow-sm overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-[#efe8fc] bg-[#fbf9ff] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterTab('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterTab === 'pending'
                  ? 'bg-[#ffb800] text-white shadow-xs'
                  : 'bg-white text-[#1e1b4b] border border-[#efe8fc] hover:bg-[#f3efff]'
              }`}
            >
              Pending Calls ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterTab === 'completed'
                  ? 'bg-[#88d600] text-white shadow-xs'
                  : 'bg-white text-[#1e1b4b] border border-[#efe8fc] hover:bg-[#f3efff]'
              }`}
            >
              Completed ({completedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('followup')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterTab === 'followup'
                  ? 'bg-[#ff2a85] text-white shadow-xs'
                  : 'bg-white text-[#1e1b4b] border border-[#efe8fc] hover:bg-[#f3efff]'
              }`}
            >
              Follow-ups ({followUpCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterTab === 'all'
                  ? 'bg-[#6c28f5] text-white shadow-xs'
                  : 'bg-white text-[#1e1b4b] border border-[#efe8fc] hover:bg-[#f3efff]'
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
              placeholder="Search assigned contacts..."
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-[#efe8fc] rounded-xl outline-none focus:border-[#6c28f5] w-full sm:w-56 font-medium text-[#1e1b4b]"
            />
          </div>
        </div>

        {/* Contacts Roster */}
        <div className="divide-y divide-[#efe8fc]">
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-12 text-[#7c7896] text-xs font-medium">
              {totalAssigned === 0
                ? 'No contacts have been assigned to you for today yet.'
                : 'No contacts found matching the active filter.'}
            </div>
          ) : (
            filteredAssignments.map((asg, index) => {
              const isCompleted = asg.status === 'Completed';
              const isReassigned =
                asg.reassignmentHistory && asg.reassignmentHistory.length > 0;
              const cleanPhone = asg.contactPhone.replace(/[^0-9]/g, '');

              return (
                <div
                  key={asg.id}
                  className={`p-4 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isCompleted ? 'bg-[#faf8ff]/60' : 'hover:bg-[#faf8ff] bg-white'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
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
                        Note: {asg.contactNotes}
                      </p>
                    )}
                  </div>

                  {/* Actions for Caller */}
                  <div className="flex items-center gap-2 pl-8 md:pl-0">
                    {/* Direct Tel link */}
                    <a
                      href={`tel:${asg.contactPhone}`}
                      className="px-3 py-1.5 bg-[#f3efff] hover:bg-[#efe8fc] text-[#6c28f5] rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                      title="Direct phone call"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-[#6c28f5]" />
                      <span className="hidden sm:inline">Call</span>
                    </a>

                    {/* WhatsApp Chat link */}
                    <a
                      href={`https://wa.me/${cleanPhone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] border border-[#25D366]/30 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                      title="Open WhatsApp chat with contact"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </a>

                    {/* Record Feedback Button */}
                    <button
                      type="button"
                      onClick={() => setActiveFeedbackAssignment(asg)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1 ${
                        isCompleted
                          ? 'bg-[#fbf9ff] hover:bg-[#f3efff] text-[#7c7896] hover:text-[#1e1b4b] border border-[#efe8fc]'
                          : 'bg-[#6c28f5] hover:bg-[#5816d6] text-white shadow-purple-600/20'
                      }`}
                    >
                      {isCompleted ? 'Update Feedback' : 'Log Feedback'}
                    </button>

                    {/* History button */}
                    <button
                      type="button"
                      onClick={() => setHistoryContact({ id: asg.contactId, name: asg.contactName })}
                      className="p-2 text-[#7c7896] hover:text-[#1e1b4b] hover:bg-[#f3efff] rounded-xl transition-colors cursor-pointer"
                      title="View complete call history"
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
