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
  currentCaller: Caller;
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
      {/* Agent Workspace Banner & Workload Tracker (Spec Section 11) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Headset className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{currentCaller.name}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {currentCaller.availabilityStatus}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Calling Date: <strong>{callingDate}</strong> • WhatsApp:{' '}
                <strong className="text-slate-700">{currentCaller.whatsappNumber}</strong>
              </p>
            </div>
          </div>

          {/* Quick Caller Switcher for evaluator convenience */}
          {onSwitchCaller && allCallers.length > 1 && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 self-start md:self-auto">
              <span className="text-xs text-slate-500 font-medium pl-1">Switch Agent:</span>
              <select
                value={currentCaller.id}
                onChange={(e) => onSwitchCaller(e.target.value)}
                aria-label="Switch Agent"
                className="bg-white text-xs font-semibold text-slate-800 border border-slate-200 rounded px-2 py-1 outline-none cursor-pointer"
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

        {/* Section 11 Metrics: Assigned, Completed, Pending, Progress */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Assigned
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{totalAssigned}</div>
          </div>

          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-100">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Completed
            </span>
            <div className="text-2xl font-bold text-emerald-800 mt-1">{completedCount}</div>
          </div>

          <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-100">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Pending Calls
            </span>
            <div className="text-2xl font-bold text-amber-800 mt-1">{pendingCount}</div>
          </div>

          <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-100">
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
              Follow-ups
            </span>
            <div className="text-2xl font-bold text-indigo-800 mt-1">{followUpCount}</div>
          </div>
        </div>

        {/* Work Progress Bar */}
        <div className="mt-5 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1.5">
            <span>Overall Workload Progress</span>
            <span className="font-bold text-emerald-700">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Assigned Contacts List & Calling Actions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterTab('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterTab === 'pending'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Pending Calls ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterTab === 'completed'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Completed ({completedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('followup')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterTab === 'followup'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Follow-ups ({followUpCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterTab === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Assigned ({totalAssigned})
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search assigned contacts..."
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 w-full sm:w-56"
            />
          </div>
        </div>

        {/* Contacts Roster */}
        <div className="divide-y divide-slate-100">
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
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
                    isCompleted ? 'bg-slate-50/50' : 'hover:bg-slate-50/80 bg-white'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-mono text-xs w-6">
                        #{index + 1}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">{asg.contactName}</h4>
                      {isCompleted ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {asg.lastOutcome || 'Completed'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Pending Call
                        </span>
                      )}

                      {isReassigned && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800 flex items-center gap-1">
                          <RotateCcw className="w-3 h-3" />
                          Reassigned
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pl-8">
                      <span className="font-mono text-slate-700 font-medium">
                        {asg.contactPhone}
                      </span>
                      {asg.contactLocation && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {asg.contactLocation}
                        </span>
                      )}
                      {asg.contactCategory && (
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {asg.contactCategory}
                        </span>
                      )}
                    </div>

                    {asg.contactNotes && (
                      <p className="text-xs text-slate-600 pl-8 italic">
                        Note: {asg.contactNotes}
                      </p>
                    )}
                  </div>

                  {/* Actions for Caller */}
                  <div className="flex items-center gap-2 pl-8 md:pl-0">
                    {/* Direct Tel link */}
                    <a
                      href={`tel:${asg.contactPhone}`}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Direct phone call"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="hidden sm:inline">Call</span>
                    </a>

                    {/* WhatsApp Chat link */}
                    <a
                      href={`https://wa.me/${cleanPhone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Open WhatsApp chat with contact"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </a>

                    {/* Record Feedback Button */}
                    <button
                      type="button"
                      onClick={() => setActiveFeedbackAssignment(asg)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1 ${
                        isCompleted
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {isCompleted ? 'Update Feedback' : 'Log Feedback'}
                    </button>

                    {/* History button */}
                    <button
                      type="button"
                      onClick={() => setHistoryContact({ id: asg.contactId, name: asg.contactName })}
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
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
