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

  return (
    <div className="space-y-6">
      {/* Overview header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">
            Workload Reassignment Center (Spec Section 14)
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          When an agent becomes unavailable or leaves early, dynamically redistribute their pending contacts among active callers while permanently preserving original assignment records.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {successMessage}
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Reassignment Wizard */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-900">
            Initiate Contact Redistribution
          </h3>
          <p className="text-xs text-slate-500">
            Select the caller who has become unavailable and review the fair division among available callers.
          </p>
        </div>

        <div className="p-5 space-y-5 text-xs">
          {/* Caller Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Unavailable Caller *
              </label>
              <select
                value={selectedUnavailableId}
                onChange={(e) => setSelectedUnavailableId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white font-medium cursor-pointer"
              >
                {callers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.availabilityStatus})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Reassignment Reason *
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Caller fell ill, shifted to emergency team"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white"
              />
            </div>
          </div>

          {/* Pending Contacts Count */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-slate-500 block font-medium">Unfinished Workload:</span>
              <span className="text-xl font-bold text-slate-900">
                {unfinishedAssignments.length} Pending Contacts
              </span>
              <span className="text-slate-500 text-[11px] block mt-0.5">
                from {unavailableCaller?.name || 'Selected Caller'} on {callingDate}
              </span>
            </div>

            <div className="text-right sm:text-left">
              <span className="text-slate-500 block font-medium">Eligible Active Callers:</span>
              <span className="text-xl font-bold text-emerald-700">
                {availableTargetCallers.length} Callers Available
              </span>
              <span className="text-slate-500 text-[11px] block mt-0.5">
                ready to absorb contacts
              </span>
            </div>
          </div>

          {/* Redistribution Plan Preview */}
          {unfinishedAssignments.length > 0 && availableTargetCallers.length > 0 ? (
            <div>
              <label className="block font-bold text-slate-700 mb-2">
                Redistribution Plan Preview (Equal Fair Division):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {preview.planSummary.map((item) => (
                  <div
                    key={item.toCaller.id}
                    className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 block text-xs">
                        {item.toCaller.name}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {item.toCaller.whatsappNumber}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-xs">
                      +{item.count} contacts
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 flex justify-end">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleExecute}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-lg transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  {isProcessing
                    ? 'Reassigning...'
                    : `Execute Reassignment of ${unfinishedAssignments.length} Contacts`}
                </button>
              </div>
            </div>
          ) : unfinishedAssignments.length === 0 ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 inline mr-1.5" />
              {unavailableCaller?.name} has no unfinished contacts for {callingDate}. No reassignment needed!
            </div>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 inline mr-1.5" />
              There are no other available callers active right now to receive contacts. Please mark another caller available in the Daily Callers tab first.
            </div>
          )}
        </div>
      </div>

      {/* Reassignment Audit History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900">Reassignment Audit Log</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
              {reassignments.length} total events
            </span>
          </div>
        </div>

        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Original Caller</th>
                <th className="p-3">New Caller</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Reassigned At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reassignments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400">
                    No reassignment events recorded yet.
                  </td>
                </tr>
              ) : (
                reassignments.map((record, index) => (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-slate-400">{index + 1}</td>
                    <td className="p-3 font-semibold text-slate-700">{record.fromCallerName}</td>
                    <td className="p-3 font-semibold text-emerald-700 flex items-center gap-1.5">
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      {record.toCallerName}
                    </td>
                    <td className="p-3 text-slate-600">{record.reason}</td>
                    <td className="p-3 font-mono text-slate-400 text-[11px]">
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
