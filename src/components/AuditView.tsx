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
      <div className="bg-white rounded-3xl border border-[#efe8fc] p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#f3efff] text-[#6c28f5] flex items-center justify-center shadow-xs">
            <Shield className="w-5 h-5 text-[#6c28f5]" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#1e1b4b]">
              System Architecture & Audit Ledger
            </h2>
            <p className="text-xs text-[#7c7896] mt-0.5 font-medium">
              Technical monitoring, role-based action tracking, and database integrity.
            </p>
          </div>
        </div>

        {/* Database Health Cards */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-[#fbf9ff] rounded-2xl border border-[#efe8fc]">
            <div className="flex items-center justify-between text-xs text-[#7c7896] mb-1">
              <span className="font-bold">Contacts Stored</span>
              <Database className="w-3.5 h-3.5 text-[#6c28f5]" />
            </div>
            <div className="text-2xl font-black text-[#1e1b4b]">{counts.contacts}</div>
            <span className="text-[11px] text-[#88d600] font-bold">Validated records</span>
          </div>

          <div className="p-4 bg-[#fbf9ff] rounded-2xl border border-[#efe8fc]">
            <div className="flex items-center justify-between text-xs text-[#7c7896] mb-1">
              <span className="font-bold">Registered Callers</span>
              <Server className="w-3.5 h-3.5 text-[#6c28f5]" />
            </div>
            <div className="text-2xl font-black text-[#1e1b4b]">{counts.callers}</div>
            <span className="text-[11px] text-[#88d600] font-bold">WhatsApp verified</span>
          </div>

          <div className="p-4 bg-[#fbf9ff] rounded-2xl border border-[#efe8fc]">
            <div className="flex items-center justify-between text-xs text-[#7c7896] mb-1">
              <span className="font-bold">Total Assignments</span>
              <Activity className="w-3.5 h-3.5 text-[#6c28f5]" />
            </div>
            <div className="text-2xl font-black text-[#1e1b4b]">{counts.assignments}</div>
            <span className="text-[11px] text-[#88d600] font-bold">Fair distribution</span>
          </div>

          <div className="p-4 bg-[#fbf9ff] rounded-2xl border border-[#efe8fc]">
            <div className="flex items-center justify-between text-xs text-[#7c7896] mb-1">
              <span className="font-bold">Call Attempts Log</span>
              <Terminal className="w-3.5 h-3.5 text-[#6c28f5]" />
            </div>
            <div className="text-2xl font-black text-[#1e1b4b]">{counts.attempts}</div>
            <span className="text-[11px] text-[#88d600] font-bold">Permanent history</span>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-3xl border border-[#efe8fc] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#efe8fc] bg-[#fbf9ff] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#6c28f5]" />
            <span className="font-black text-sm text-[#1e1b4b]">System Action Logs</span>
          </div>
          <span className="text-xs text-[#7c7896] font-medium">
            {logs.length} logged operations
          </span>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#fbf9ff] border-b border-[#efe8fc] text-[#7c7896] uppercase font-bold text-[11px] tracking-wider">
              <tr>
                <th className="p-3.5 pl-5">Timestamp</th>
                <th className="p-3.5">User</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Entity</th>
                <th className="p-3.5 pr-5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#efe8fc]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#7c7896] font-medium">
                    No audit logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#fbf9ff] transition-colors">
                    <td className="p-3.5 pl-5 font-mono text-[#7c7896] text-[11px] whitespace-nowrap font-medium">
                      {new Date(log.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="p-3.5 font-bold text-[#1e1b4b]">{log.userName}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f3efff] text-[#6c28f5] border border-[#e8e1f9]">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-[#6c28f5]">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 text-[#1e1b4b] font-medium">{log.entity}</td>
                    <td className="p-3.5 pr-5 font-mono text-[11px] text-[#7c7896] max-w-xs truncate">
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
