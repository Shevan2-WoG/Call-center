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
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Daily Call Center Report (Spec Section 15 & 16)
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700">
                  {callingDate}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Consolidated call outcomes, agent performance statistics, and automated 12-sheet Excel reporting.
              </p>
            </div>
          </div>
        </div>

        {/* Big Export Button */}
        <button
          type="button"
          onClick={handleExportExcel}
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-5 h-5" />
          Export 12-Sheet Excel Report
          <Download className="w-4 h-4 ml-1" />
        </button>
      </div>

      {/* KPI Cards (Section 15 example) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Assigned
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{summary.totalAssigned}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Contacts distributed</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Calls Attempted
          </span>
          <div className="text-2xl font-bold text-blue-600 mt-1">{summary.callsAttempted}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Recorded in database</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Completed Contacts
          </span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{summary.completed}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">With final feedback</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Pending Contacts
          </span>
          <div className="text-2xl font-bold text-amber-600 mt-1">{summary.pending}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Awaiting calls</span>
        </div>
      </div>

      {/* Breakdown of Call Outcomes (Section 15) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-600" />
              Categorized Call Outcomes Summary
            </h3>
            <p className="text-xs text-slate-500">
              Distribution of outcomes recorded across all contacts on {callingDate}.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            12 Outcome Categories
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
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 truncate" title={outcome}>
                      {outcome}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {count}
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Share of calls</span>
                    <span className="font-semibold text-slate-600">{percent}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Caller Performance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-600" />
            <span className="font-bold text-sm text-slate-900">Caller Performance Ledger</span>
          </div>
          <span className="text-xs text-slate-500">
            Sheet 12 in exported Excel workbook
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="p-3">Caller Name</th>
                <th className="p-3">WhatsApp Number</th>
                <th className="p-3">Assigned</th>
                <th className="p-3">Calls Attempted</th>
                <th className="p-3">Completed</th>
                <th className="p-3">Pending</th>
                <th className="p-3">Completion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary.callerPerformance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No callers registered for this calling date.
                  </td>
                </tr>
              ) : (
                summary.callerPerformance.map((cp) => (
                  <tr key={cp.callerId} className="hover:bg-slate-50/75">
                    <td className="p-3 font-semibold text-slate-900">{cp.callerName}</td>
                    <td className="p-3 font-mono text-slate-600">{cp.whatsappNumber}</td>
                    <td className="p-3 font-bold text-slate-800">{cp.assigned}</td>
                    <td className="p-3 font-bold text-blue-700">{cp.callsCount}</td>
                    <td className="p-3 font-bold text-emerald-700">{cp.completed}</td>
                    <td className="p-3 font-bold text-amber-700">{cp.pending}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-2 rounded-full"
                            style={{ width: `${cp.completionRate}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-800">{cp.completionRate}%</span>
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
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs">
        <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-600" />
          Included Workbook Sheets (Spec Section 16):
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-slate-600">
          <span className="p-2 bg-white rounded border border-slate-200">1. Summary</span>
          <span className="p-2 bg-white rounded border border-slate-200">2. Available</span>
          <span className="p-2 bg-white rounded border border-slate-200">3. Unavailable</span>
          <span className="p-2 bg-white rounded border border-slate-200">4. Recall</span>
          <span className="p-2 bg-white rounded border border-slate-200">5. Phone Off</span>
          <span className="p-2 bg-white rounded border border-slate-200">6. No Answer</span>
          <span className="p-2 bg-white rounded border border-slate-200">7. Busy</span>
          <span className="p-2 bg-white rounded border border-slate-200">8. Not Interested</span>
          <span className="p-2 bg-white rounded border border-slate-200">9. Wrong Number</span>
          <span className="p-2 bg-white rounded border border-slate-200">10. Follow Up</span>
          <span className="p-2 bg-white rounded border border-slate-200">11. Call History</span>
          <span className="p-2 bg-white rounded border border-slate-200">12. Caller Performance</span>
        </div>
      </div>
    </div>
  );
};
