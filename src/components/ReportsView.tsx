import React from 'react';
import { Assignment, CallAttempt, Caller, DailyReportSummary, CALL_OUTCOMES } from '../types';
import { buildDailyReportSummary } from '../services/dbService';
import { exportDaily12SheetReport } from '../services/excelService';
import {
  BarChart3,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Clock,
  PhoneCall,
  Users,
  PieChart,
  Calendar,
  Layers,
} from 'lucide-react';

interface ReportsViewProps {
  callingDate: string;
  assignments: Assignment[];
  attempts: CallAttempt[];
  callers: Caller[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  callingDate,
  assignments,
  attempts,
  callers,
}) => {
  const dailyAssignments = assignments.filter((a) => a.callingDate === callingDate);
  const summary: DailyReportSummary = buildDailyReportSummary(
    callingDate,
    dailyAssignments,
    attempts,
    callers
  );

  const handleExportExcel = () => {
    exportDaily12SheetReport(callingDate, summary, dailyAssignments, attempts);
  };

  return (
    <div className="space-y-6">
      {/* Header & 12-Sheet Export Action */}
      <div className="bg-[#fbf7fe] rounded-3xl border border-[#e2d0fa] p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-[#f3efff] text-[#6c28f5] flex items-center justify-center shadow-xs">
              <BarChart3 className="w-5 h-5 text-[#6c28f5]" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-[#1e1b4b]">
                  KIU Manifest Daily Call Center Report
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#f3efff] text-[#6c28f5] border border-[#e8e1f9]">
                  {callingDate}
                </span>
              </div>
              <p className="text-xs text-[#7c7896] mt-0.5 font-medium">
                Consolidated call outcomes, agent performance statistics, and automated 12-sheet Excel reporting.
              </p>
            </div>
          </div>
        </div>

        {/* Big Export Button */}
        <button
          type="button"
          onClick={handleExportExcel}
          className="px-5 py-3 bg-[#6c28f5] hover:bg-[#5816d6] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-md shadow-purple-600/20 cursor-pointer self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-5 h-5" />
          Export 12-Sheet Excel Report
          <Download className="w-4 h-4 ml-1" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#fbf7fe] p-5 rounded-3xl border border-[#e2d0fa] shadow-sm">
          <span className="text-xs font-bold text-[#7c7896] uppercase tracking-wider">
            Total Assigned
          </span>
          <div className="text-2xl font-black text-[#1e1b4b] mt-1">{summary.totalAssigned}</div>
          <span className="text-[11px] text-[#7c7896] mt-0.5 block font-medium">Contacts distributed</span>
        </div>

        <div className="bg-[#fbf7fe] p-5 rounded-3xl border border-[#e2d0fa] shadow-sm">
          <span className="text-xs font-bold text-[#7c7896] uppercase tracking-wider">
            Calls Attempted
          </span>
          <div className="text-2xl font-black text-[#6c28f5] mt-1">{summary.callsAttempted}</div>
          <span className="text-[11px] text-[#7c7896] mt-0.5 block font-medium">Recorded in database</span>
        </div>

        <div className="bg-[#fbf7fe] p-5 rounded-3xl border border-[#e2d0fa] shadow-sm">
          <span className="text-xs font-bold text-[#7c7896] uppercase tracking-wider">
            Completed Contacts
          </span>
          <div className="text-2xl font-black text-[#88d600] mt-1">{summary.completed}</div>
          <span className="text-[11px] text-[#7c7896] mt-0.5 block font-medium">With final feedback</span>
        </div>

        <div className="bg-[#fbf7fe] p-5 rounded-3xl border border-[#e2d0fa] shadow-sm">
          <span className="text-xs font-bold text-[#7c7896] uppercase tracking-wider">
            Pending Contacts
          </span>
          <div className="text-2xl font-black text-[#ffb800] mt-1">{summary.pending}</div>
          <span className="text-[11px] text-[#7c7896] mt-0.5 block font-medium">Awaiting calls</span>
        </div>
      </div>

      {/* Breakdown of Call Outcomes */}
      <div className="bg-[#fbf7fe] rounded-3xl border border-[#e2d0fa] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#e2d0fa] bg-[#f3e8fd] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-[#1e1b4b] flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#6c28f5]" />
              Categorized Call Outcomes Summary
            </h3>
            <p className="text-xs text-[#7c7896] mt-0.5 font-medium">
              Distribution of outcomes recorded across all contacts on {callingDate}.
            </p>
          </div>
          <span className="text-xs text-[#6c28f5] font-bold px-2.5 py-0.5 bg-[#f3efff] rounded-full border border-[#e8e1f9]">
            12 Categories
          </span>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {CALL_OUTCOMES.map((outcome) => {
              const count = summary.outcomeCounts[outcome] || 0;
              const percent = summary.completed > 0 ? Math.round((count / summary.completed) * 100) : 0;

              return (
                <div
                  key={outcome}
                  className="p-3.5 rounded-2xl border border-[#e2d0fa] bg-[#f8f2fe] hover:bg-[#efe0fc] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1e1b4b] truncate" title={outcome}>
                      {outcome}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#6c28f5] bg-[#f3efff] px-2 py-0.5 rounded-lg border border-[#e8e1f9]">
                      {count}
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-[#7c7896] flex items-center justify-between font-medium">
                    <span>Share of calls</span>
                    <span className="font-bold text-[#1e1b4b]">{percent}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Caller Performance Table */}
      <div className="bg-[#fbf7fe] rounded-3xl border border-[#e2d0fa] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#e2d0fa] bg-[#f3e8fd] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#6c28f5]" />
            <span className="font-black text-sm text-[#1e1b4b]">Caller Performance Ledger</span>
          </div>
          <span className="text-xs text-[#7c7896] font-medium">
            Sheet 12 in exported Excel workbook
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8f2fe] border-b border-[#e2d0fa] text-[#7c7896] uppercase font-bold text-[11px] tracking-wider">
              <tr>
                <th className="p-3.5 pl-5">Caller Name</th>
                <th className="p-3.5">WhatsApp Number</th>
                <th className="p-3.5">Assigned</th>
                <th className="p-3.5">Calls Attempted</th>
                <th className="p-3.5">Completed</th>
                <th className="p-3.5">Pending</th>
                <th className="p-3.5 pr-5">Completion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2d0fa]">
              {summary.callerPerformance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#7c7896] font-medium">
                    No callers registered for this calling date.
                  </td>
                </tr>
              ) : (
                summary.callerPerformance.map((cp) => (
                  <tr key={cp.callerId} className="hover:bg-[#f3e9fd] transition-colors">
                    <td className="p-3.5 pl-5 font-bold text-[#1e1b4b]">{cp.callerName}</td>
                    <td className="p-3.5 font-mono text-[#7c7896] font-medium">{cp.whatsappNumber}</td>
                    <td className="p-3.5 font-bold text-[#1e1b4b]">{cp.assigned}</td>
                    <td className="p-3.5 font-bold text-[#6c28f5]">{cp.callsCount}</td>
                    <td className="p-3.5 font-bold text-[#88d600]">{cp.completed}</td>
                    <td className="p-3.5 font-bold text-[#ffb800]">{cp.pending}</td>
                    <td className="p-3.5 pr-5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-[#dfcafa] rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-[#88d600] h-2 rounded-full"
                            style={{ width: `${cp.completionRate}%` }}
                          />
                        </div>
                        <span className="font-bold text-[#1e1b4b]">{cp.completionRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 12-Sheet Structure Documentation */}
      <div className="bg-[#f8f2fe] border border-[#e2d0fa] rounded-3xl p-6 text-xs">
        <h4 className="font-black text-[#1e1b4b] mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#6c28f5]" />
          Included Workbook Sheets (Automated 12-Sheet Generation):
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-[#1e1b4b] font-medium">
          <span className="p-2.5 bg-[#fbf7fe] rounded-xl border border-[#e2d0fa] shadow-xs">1. Summary</span>
          <span className="p-2.5 bg-[#fbf7fe] rounded-xl border border-[#e2d0fa] shadow-xs">2. Available</span>
          <span className="p-2.5 bg-[#fbf7fe] rounded-xl border border-[#e2d0fa] shadow-xs">3. Unavailable</span>
          <span className="p-2.5 bg-[#fbf7fe] rounded-xl border border-[#e2d0fa] shadow-xs">4. Recall</span>
          <span className="p-2.5 bg-[#fbf7fe] rounded-xl border border-[#e2d0fa] shadow-xs">5. Phone Off</span>
          <span className="p-2.5 bg-[#fbf7fe] rounded-xl border border-[#e2d0fa] shadow-xs">6. No Answer</span>
          <span className="p-2.5 bg-[#fbf7fe] rounded-xl border border-[#e2d0fa] shadow-xs">7. Busy</span>
          <span className="p-2.5 bg-[#fbf7fe] rounded-xl border border-[#e2d0fa] shadow-xs">8. Not Interested</span>
          <span className="p-2.5 bg-[#fbf7fe] rounded-xl border border-[#e2d0fa] shadow-xs">9. Wrong Number</span>
          <span className="p-2.5 bg-[#fbf7fe] rounded-xl border border-[#e2d0fa] shadow-xs">10. Follow Up</span>
          <span className="p-2.5 bg-[#fbf7fe] rounded-xl border border-[#e2d0fa] shadow-xs">11. Call History</span>
          <span className="p-2.5 bg-[#fbf7fe] rounded-xl border border-[#e2d0fa] shadow-xs">12. Caller Performance</span>
        </div>
      </div>
    </div>
  );
};
