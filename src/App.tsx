import React, { useState, useEffect, useCallback } from 'react';
import {
  Contact,
  Caller,
  Assignment,
  CallAttempt,
  ReassignmentRecord,
  AuditLog,
  UserRole,
  DailyTeam,
} from './types';
import {
  getContacts,
  getCallers,
  getAssignments,
  getCallAttempts,
  getReassignments,
  getAuditLogs,
  saveContactsBatch,
  saveCaller,
  deleteCaller,
  saveAssignmentsBatch,
  updateAssignmentsBatch,
  recordCallAttempt,
  saveReassignmentsBatch,
  logAudit,
  seedInitialDataIfEmpty,
} from './services/dbService';
import { Navbar } from './components/Navbar';
import { DistributionView } from './components/DistributionView';
import { ContactsView } from './components/ContactsView';
import { CallerTeamView } from './components/CallerTeamView';
import { CallerDashboardView } from './components/CallerDashboardView';
import { ReassignmentView } from './components/ReassignmentView';
import { ReportsView } from './components/ReportsView';
import { AuditView } from './components/AuditView';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [callingDate, setCallingDate] = useState('2026-09-09');
  const [isSyncing, setIsSyncing] = useState(false);

  // Entities state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [callers, setCallers] = useState<Caller[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [attempts, setAttempts] = useState<CallAttempt[]>([]);
  const [reassignments, setReassignments] = useState<ReassignmentRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Selected caller for agent dashboard
  const [selectedCallerId, setSelectedCallerId] = useState<string>('');
  // For quick jump from caller status toggle to reassignment
  const [reassignmentTargetCallerId, setReassignmentTargetCallerId] = useState<string | undefined>(undefined);

  // Load all data
  const loadData = useCallback(async () => {
    setIsSyncing(true);
    try {
      await seedInitialDataIfEmpty(callingDate);
      const [
        cntList,
        clrList,
        asgList,
        attList,
        reaList,
        audList,
      ] = await Promise.all([
        getContacts(),
        getCallers(),
        getAssignments(),
        getCallAttempts(),
        getReassignments(),
        getAuditLogs(),
      ]);

      setContacts(cntList);
      setCallers(clrList);
      setAssignments(asgList);
      setAttempts(attList);
      setReassignments(reaList);
      setAuditLogs(audList);

      if (!selectedCallerId && clrList.length > 0) {
        setSelectedCallerId(clrList[0].id);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [callingDate, selectedCallerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Distribution Handler
  const handleDistribute = async (newAssignments: Omit<Assignment, 'id'>[], team: DailyTeam) => {
    setIsSyncing(true);
    try {
      const created = await saveAssignmentsBatch(newAssignments);
      await logAudit({
        userId: 'admin',
        userName: 'Administrator',
        userRole: 'admin',
        action: 'CONTACTS_DISTRIBUTED',
        entity: 'assignments',
        metadata: {
          count: created.length,
          callingDate,
          teamId: team.id,
        },
      });
      await loadData();
    } finally {
      setIsSyncing(false);
    }
  };

  // Contacts Import Handler
  const handleImportContacts = async (newContacts: Omit<Contact, 'id' | 'createdAt' | 'status'>[]) => {
    setIsSyncing(true);
    try {
      const created = await saveContactsBatch(newContacts);
      await logAudit({
        userId: 'admin',
        userName: 'Administrator',
        userRole: 'admin',
        action: 'CONTACTS_IMPORTED_EXCEL',
        entity: 'contacts',
        metadata: {
          importedCount: created.length,
        },
      });
      await loadData();
    } finally {
      setIsSyncing(false);
    }
  };

  // Caller Save Handler
  const handleSaveCaller = async (caller: Caller) => {
    setIsSyncing(true);
    try {
      await saveCaller(caller);
      await logAudit({
        userId: 'admin',
        userName: 'Administrator',
        userRole: 'admin',
        action: 'CALLER_UPDATED',
        entity: 'callers',
        metadata: {
          callerName: caller.name,
          status: caller.availabilityStatus,
        },
      });
      await loadData();
    } finally {
      setIsSyncing(false);
    }
  };

  // Caller Delete Handler
  const handleDeleteCaller = async (id: string) => {
    setIsSyncing(true);
    try {
      await deleteCaller(id);
      await logAudit({
        userId: 'admin',
        userName: 'Administrator',
        userRole: 'admin',
        action: 'CALLER_DELETED',
        entity: 'callers',
        metadata: { callerId: id },
      });
      await loadData();
    } finally {
      setIsSyncing(false);
    }
  };

  // Call Feedback Attempt Save Handler
  const handleSaveAttempt = async (attemptData: Omit<CallAttempt, 'id' | 'calledAt'>) => {
    setIsSyncing(true);
    try {
      const created = await recordCallAttempt(attemptData);
      await logAudit({
        userId: attemptData.callerId,
        userName: attemptData.callerName,
        userRole: 'caller',
        action: 'CALL_FEEDBACK_RECORDED',
        entity: 'callAttempts',
        metadata: {
          outcome: created.outcome,
          contactId: created.contactId,
        },
      });
      await loadData();
    } finally {
      setIsSyncing(false);
    }
  };

  // Reassignment Execution Handler
  const handleExecuteReassignment = async (
    updatedAssignments: Assignment[],
    records: Omit<ReassignmentRecord, 'id'>[]
  ) => {
    setIsSyncing(true);
    try {
      await updateAssignmentsBatch(updatedAssignments);
      await saveReassignmentsBatch(records);
      await logAudit({
        userId: 'admin',
        userName: 'Administrator',
        userRole: 'admin',
        action: 'CONTACTS_REASSIGNED',
        entity: 'reassignments',
        metadata: {
          reassignedCount: updatedAssignments.length,
          callingDate,
        },
      });
      await loadData();
    } finally {
      setIsSyncing(false);
    }
  };

  // Reset demo data handler
  const handleResetDemoData = async () => {
    if (confirm('Re-seed the system with standard demo callers, contacts, and calling roster for 2026-09-09?')) {
      localStorage.clear();
      await seedInitialDataIfEmpty(callingDate);
      await loadData();
    }
  };

  // Switch to specific caller view
  const handleSwitchToCaller = (callerId: string) => {
    setSelectedCallerId(callerId);
    setCurrentRole('caller');
    setActiveTab('caller_dashboard');
  };

  const handleTriggerReassignment = (caller: Caller) => {
    setReassignmentTargetCallerId(caller.id);
    setActiveTab('reassignment');
  };

  // Active caller for Caller Dashboard
  const currentCaller = callers.find((c) => c.id === selectedCallerId) || callers[0];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Navigation & Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        callingDate={callingDate}
        setCallingDate={setCallingDate}
        selectedCallerId={selectedCallerId}
        setSelectedCallerId={setSelectedCallerId}
        callers={callers.map((c) => ({ id: c.id, name: c.name }))}
        onResetData={handleResetDemoData}
        isSyncing={isSyncing}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DistributionView
            contacts={contacts}
            callers={callers}
            assignments={assignments}
            callingDate={callingDate}
            onDistribute={handleDistribute}
            onSwitchToCaller={handleSwitchToCaller}
          />
        )}

        {activeTab === 'contacts' && (
          <ContactsView
            contacts={contacts}
            onImportContacts={handleImportContacts}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'callers' && (
          <CallerTeamView
            callers={callers}
            callingDate={callingDate}
            onSaveCaller={handleSaveCaller}
            onDeleteCaller={handleDeleteCaller}
            onTriggerReassignment={handleTriggerReassignment}
          />
        )}

        {activeTab === 'reassignment' && (
          <ReassignmentView
            callers={callers}
            assignments={assignments}
            callingDate={callingDate}
            reassignments={reassignments}
            onExecuteReassignment={handleExecuteReassignment}
            preselectedCallerId={reassignmentTargetCallerId}
          />
        )}

        {activeTab === 'caller_dashboard' && (
          currentCaller ? (
            <CallerDashboardView
              currentCaller={currentCaller}
              assignments={assignments}
              callingDate={callingDate}
              attempts={attempts}
              onSaveAttempt={handleSaveAttempt}
              allCallers={callers}
              onSwitchCaller={setSelectedCallerId}
            />
          ) : (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
              <p className="text-sm text-slate-500">
                No callers registered in the system yet. Please register callers in the "Daily Callers" tab first.
              </p>
            </div>
          )
        )}

        {activeTab === 'reports' && (
          <ReportsView
            callingDate={callingDate}
            assignments={assignments}
            attempts={attempts}
            callers={callers}
          />
        )}

        {activeTab === 'audit' && (
          <AuditView
            logs={auditLogs}
            counts={{
              contacts: contacts.length,
              callers: callers.length,
              assignments: assignments.length,
              attempts: attempts.length,
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Call Center Contact Distribution & Feedback System • MVP v1.0</span>
          <span className="font-mono text-[11px]">
            Database: Cloud Firestore ({assignments.length} assignments, {attempts.length} attempts)
          </span>
        </div>
      </footer>
    </div>
  );
}
