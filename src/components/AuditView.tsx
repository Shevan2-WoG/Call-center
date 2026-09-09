import React from 'react';
import { AuditLog } from '../types';
import {
  Shield,
  Activity,
  Database,
  CheckCircle2,
  Clock,
  Server,
  Terminal,
} from 'lucide-react';

interface AuditViewProps {
  logs: AuditLog[];
  counts: {
    contacts: number;
    callers: number;
    assignments: number;
    attempts: number;
  };
}

export const AuditView: React.FC<AuditViewProps> = ({ logs, counts }) => {
  return (
    <div className="space-y-6">
      {/* System Architecture & Health Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              System Architecture & Audit Ledger (Spec Section 3.3 & 17)
            </h2>
            <p className="text-xs text-slate-500">
              Technical monitoring, role-based action tracking, and database integrity.
            </p>
          </div>
        </div>

        {/* Database Health Cards */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-semibold">Contacts Stored</span>
              <Database className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-xl font-bold text-slate-900">{counts.contacts}</div>
            <span className="text-[11px] text-emerald-600 font-medium">Validated records</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-semibold">Registered Callers</span>
              <Server className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-xl font-bold text-slate-900">{counts.callers}</div>
            <span className="text-[11px] text-emerald-600 font-medium">WhatsApp verified</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-semibold">Total Assignments</span>
              <Activity className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-xl font-bold text-slate-900">{counts.assignments}</div>
            <span className="text-[11px] text-emerald-600 font-medium">Fair distribution</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-semibold">Call Attempts Log</span>
              <Terminal className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-xl font-bold text-slate-900">{counts.attempts}</div>
            <span className="text-[11px] text-emerald-600 font-medium">Permanent history</span>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="font-bold text-sm text-slate-900">System Action Logs</span>
          </div>
          <span className="text-xs text-slate-500">
            {logs.length} logged administrative & calling operations
          </span>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">User</th>
                <th className="p-3">Role</th>
                <th className="p-3">Action</th>
                <th className="p-3">Entity</th>
                <th className="p-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No audit logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{log.userName}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-mono font-semibold text-emerald-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{log.entity}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-500 max-w-xs truncate">
                      {log.metadata ? JSON.stringify(log.metadata) : '-'}
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
