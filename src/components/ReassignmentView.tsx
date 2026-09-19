import React, { useState } from 'react';
import { Caller, Assignment, ReassignmentRecord } from '../types';
import { calculateReassignment } from '../services/distributionEngine';
import {
  RotateCcw,
  AlertTriangle,
  Users,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Clock,
  MessageSquare,
} from 'lucide-react';

interface ReassignmentViewProps {
  callers: Caller[];
  assignments: Assignment[];
  callingDate: string;
  reassignments: ReassignmentRecord[];
  onExecuteReassignment: (
    updatedAssignments: Assignment[],
    records: Omit<ReassignmentRecord, 'id'>[]
  ) => Promise<void>;
  preselectedCallerId?: string;
}

export const ReassignmentView: React.FC<ReassignmentViewProps> = ({
  callers,
  assignments,
  callingDate,
  reassignments,
  onExecuteReassignment,
  preselectedCallerId,
}) => {
  const [selectedUnavailableId, setSelectedUnavailableId] = useState<string>(
    preselectedCallerId || (callers.find((c) => c.availabilityStatus === 'unavailable')?.id || callers[0]?.id || '')
  );
  const [reason, setReason] = useState('Emergency leave / Caller unavailable');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Unavailable caller
  const unavailableCaller = callers.find((c) => c.id === selectedUnavailableId);

  // Unfinished assignments for this caller on this date
  const unfinishedAssignments = assignments.filter(
    (a) =>
      a.callingDate === callingDate &&
      (a.callerId === selectedUnavailableId || a.currentCallerId === selectedUnavailableId) &&
      a.status !== 'Completed'
  );

  // Available target callers (excluding the unavailable one)
  const availableTargetCallers = callers.filter(
    (c) => c.id !== selectedUnavailableId && c.availabilityStatus === 'available'
  );

  // Reassignment calculation preview
  const preview = unavailableCaller
    ? calculateReassignment(
        unfinishedAssignments,
        unavailableCaller,
        availableTargetCallers,
        reason
      )
    : { updatedAssignments: [], reassignmentRecords: [], planSummary: [] };

  const handleExecute = async () => {
    if (!unavailableCaller || unfinishedAssignments.length === 0 || availableTargetCallers.length === 0) return;
    setIsProcessing(true);
    try {
      await onExecuteReassignment(preview.updatedAssignments, preview.reassignmentRecords);
      setSuccessMessage(
        `Successfully redistributed ${unfinishedAssignments.length} contacts from ${unavailableCaller.name} to ${availableTargetCallers.length} active callers!`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (callers.length === 0) {
    return (
      <div className="bg-[#fbf7fe] rounded-3xl border border-[#e2d0fa] p-12 text-center max-w-xl mx-auto my-8 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-[#f3efff] text-[#6c28f5] flex items-center justify-center mx-auto mb-4 shadow-xs">
          <RotateCcw className="w-7 h-7" />
        </div>
        <h3 className="text-base font-black text-[#1e1b4b] mb-1">No Callers Registered Yet</h3>
        <p className="text-xs text-[#7c7896] font-medium">
          Workload reassignment will be enabled once callers are registered in the permanent roster and contacts have been distributed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview header */}
      <div className="bg-[#fbf7fe] rounded-3xl border border-[#e2d0fa] p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#f3efff] text-[#6c28f5] flex items-center justify-center shadow-xs">
            <RotateCcw className="w-5 h-5 text-[#6c28f5]" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#1e1b4b]">
              Workload Reassignment Center
            </h2>
            <p className="text-xs text-[#7c7896] mt-0.5 font-medium">
              When an agent becomes unavailable or leaves early, dynamically redistribute their pending contacts among active callers while preserving original assignment logs.
            </p>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-[#88d600]/10 border border-[#88d600]/30 rounded-2xl flex items-center justify-between text-xs text-[#4b7700] font-bold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#88d600] shrink-0" />
            {successMessage}
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-xs text-[#4b7700] hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Reassignment Wizard */}
      <div className="bg-[#fbf7fe] rounded-3xl border border-[#e2d0fa] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#e2d0fa] bg-[#f3e8fd]">
          <h3 className="text-sm font-black text-[#1e1b4b]">
            Initiate Contact Redistribution
          </h3>
          <p className="text-xs text-[#7c7896] mt-0.5 font-medium">
            Select the caller who has become unavailable and review the fair division among available callers.
          </p>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {/* Caller Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-[#1e1b4b] mb-1.5">
                Unavailable Caller *
              </label>
              <select
                value={selectedUnavailableId}
                onChange={(e) => setSelectedUnavailableId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#e2d0fa] rounded-xl outline-none focus:border-[#6c28f5] bg-[#f8f2fe] text-[#1e1b4b] font-bold cursor-pointer transition-all"
              >
                {callers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.availabilityStatus})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#1e1b4b] mb-1.5">
                Reassignment Reason *
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Caller fell ill, shifted to emergency team"
                className="w-full px-3.5 py-2.5 border border-[#e2d0fa] rounded-xl outline-none focus:border-[#6c28f5] focus:bg-white bg-[#f8f2fe] text-[#1e1b4b] font-medium transition-all"
              />
            </div>
          </div>

          {/* Pending Contacts Count */}
          <div className="p-5 bg-[#f8f2fe] border border-[#e2d0fa] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[#7c7896] block font-bold">Unfinished Workload:</span>
              <span className="text-2xl font-black text-[#1e1b4b] mt-0.5 block">
                {unfinishedAssignments.length} Pending Contacts
              </span>
              <span className="text-[#7c7896] text-[11px] block mt-0.5 font-medium">
                from <strong className="text-[#1e1b4b]">{unavailableCaller?.name || 'Selected Caller'}</strong> on {callingDate}
              </span>
            </div>

            <div className="text-right sm:text-left">
              <span className="text-[#7c7896] block font-bold">Eligible Active Callers:</span>
              <span className="text-2xl font-black text-[#88d600] mt-0.5 block">
                {availableTargetCallers.length} Callers Available
              </span>
              <span className="text-[#7c7896] text-[11px] block mt-0.5 font-medium">
                ready to absorb contacts
              </span>
            </div>
          </div>

          {/* Redistribution Plan Preview */}
          {unfinishedAssignments.length > 0 && availableTargetCallers.length > 0 ? (
            <div>
              <label className="block font-bold text-[#1e1b4b] mb-2">
                Redistribution Plan Preview (Equal Fair Division):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {preview.planSummary.map((item) => (
                  <div
                    key={item.toCaller.id}
                    className="p-3.5 bg-[#fbf7fe] border border-[#e2d0fa] rounded-2xl shadow-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-black text-[#1e1b4b] block text-xs">
                        {item.toCaller.name}
                      </span>
                      <span className="text-[11px] text-[#7c7896] font-mono font-medium">
                        {item.toCaller.whatsappNumber}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-[#f3efff] text-[#6c28f5] font-black text-xs border border-[#e8e1f9]">
                      +{item.count}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-[#e2d0fa] flex justify-end">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleExecute}
                  className="px-6 py-2.5 bg-[#6c28f5] hover:bg-[#5816d6] disabled:bg-slate-300 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-md shadow-purple-600/20 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  {isProcessing
                    ? 'Reassigning...'
                    : `Execute Reassignment of ${unfinishedAssignments.length} Contacts`}
                </button>
              </div>
            </div>
          ) : unfinishedAssignments.length === 0 ? (
            <div className="p-4 bg-[#88d600]/10 border border-[#88d600]/30 rounded-2xl text-[#4b7700] text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#88d600]" />
              {unavailableCaller?.name} has no unfinished contacts for {callingDate}. No reassignment needed!
            </div>
          ) : (
            <div className="p-4 bg-[#ffb800]/10 border border-[#ffb800]/30 rounded-2xl text-[#a16207] text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#ffb800]" />
              There are no other available callers active right now to receive contacts. Please mark another caller available in the Permanent Callers tab first.
            </div>
          )}
        </div>
      </div>

      {/* Reassignment Audit History Table */}
      <div className="bg-[#fbf7fe] rounded-3xl border border-[#e2d0fa] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#e2d0fa] bg-[#f3e8fd] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-black text-sm text-[#1e1b4b]">Reassignment Audit Log</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#f3efff] text-[#6c28f5] border border-[#e8e1f9] font-bold">
              {reassignments.length} events
            </span>
          </div>
        </div>

        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8f2fe] border-b border-[#e2d0fa] text-[#7c7896] uppercase font-bold text-[11px] tracking-wider">
              <tr>
                <th className="p-3.5 pl-5">#</th>
                <th className="p-3.5">Original Caller</th>
                <th className="p-3.5">New Caller</th>
                <th className="p-3.5">Reason</th>
                <th className="p-3.5 pr-5">Reassigned At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2d0fa]">
              {reassignments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#7c7896] font-medium">
                    No reassignment events recorded yet.
                  </td>
                </tr>
              ) : (
                reassignments.map((record, index) => (
                  <tr key={record.id} className="hover:bg-[#f3e9fd] transition-colors">
                    <td className="p-3.5 pl-5 font-mono text-[#7c7896] font-bold">{index + 1}</td>
                    <td className="p-3.5 font-bold text-[#1e1b4b]">{record.fromCallerName}</td>
                    <td className="p-3.5 font-bold text-[#6c28f5] flex items-center gap-1.5">
                      <ArrowRight className="w-3 h-3 text-[#7c7896]" />
                      {record.toCallerName}
                    </td>
                    <td className="p-3.5 text-[#1e1b4b] font-medium">{record.reason}</td>
                    <td className="p-3.5 pr-5 font-mono text-[#7c7896] text-[11px] font-medium">
                      {new Date(record.reassignedAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
