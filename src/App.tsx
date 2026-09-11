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
  deleteContact,
  saveCaller,
  deleteCaller,
  saveAssignmentsBatch,
  updateAssignmentsBatch,
  recordCallAttempt,
  saveReassignmentsBatch,
  logAudit,
  seedInitialDataIfEmpty,
  clearAllDatabaseData,
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
  const [activePortal, setActivePortal] = useState<'admin' | 'caller'>('admin');
  const [adminTab, setAdminTab] = useState<string>('dashboard');
  const [callerSubTab, setCallerSubTab] = useState<'queue' | 'performance' | 'history'>('queue');
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

      if (clrList.length > 0) {
        if (!selectedCallerId || !clrList.some(c => c.id === selectedCallerId)) {
          setSelectedCallerId(clrList[0].id);
        }
      } else {
        setSelectedCallerId('');
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [selectedCallerId]);

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

  // Single Contact Delete Handler
  const handleDeleteContact = async (contactId: string) => {
    setIsSyncing(true);
    try {
      await deleteContact(contactId);
      await logAudit({
        userId: 'admin',
        userName: 'Administrator',
        userRole: 'admin',
        action: 'CONTACT_DELETED',
        entity: 'contacts',
        metadata: { contactId },
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

  // Empty all database data to start completely fresh
  const handleEmptyAllData = async () => {
    if (
      window.confirm(
        'Empty the entire database? All contacts, callers, assignments, and calling records will be cleared so you can fill new data from scratch.'
      )
    ) {
      setIsSyncing(true);
      try {
        await clearAllDatabaseData();
        setContacts([]);
        setCallers([]);
        setAssignments([]);
        setAttempts([]);
        setReassignments([]);
        setAuditLogs([]);
        setSelectedCallerId('');
      } catch (err) {
        console.error('Error emptying database:', err);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Reset / seed demo data handler
  const handleResetDemoData = async () => {
    if (
      window.confirm(
        'Load sample demonstration callers and contacts for testing?'
      )
    ) {
      setIsSyncing(true);
      try {
        await seedInitialDataIfEmpty(callingDate, true);
        await loadData();
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Switch to specific caller in the Caller Portal
  const handleSwitchToCaller = (callerId: string) => {
    setSelectedCallerId(callerId);
    setActivePortal('caller');
    setCallerSubTab('queue');
  };

  const handleTriggerReassignment = (caller: Caller) => {
    setReassignmentTargetCallerId(caller.id);
    setActivePortal('admin');
    setAdminTab('reassignment');
  };

  // Active caller for Caller Dashboard
  const currentCaller = callers.find((c) => c.id === selectedCallerId) || callers[0];

  return (
    <div className="min-h-screen bg-[#ebdffc] text-[#1e1b4b] flex flex-col font-sans selection:bg-[#6c28f5] selection:text-white">
      {/* Navigation & Header */}
      <Navbar
        activePortal={activePortal}
        setActivePortal={setActivePortal}
        adminTab={adminTab}
        setAdminTab={setAdminTab}
        callerSubTab={callerSubTab}
        setCallerSubTab={setCallerSubTab}
        callingDate={callingDate}
        setCallingDate={setCallingDate}
        selectedCallerId={selectedCallerId}
        setSelectedCallerId={setSelectedCallerId}
        callers={callers}
        currentCaller={currentCaller}
        onSaveCaller={handleSaveCaller}
        onResetData={handleResetDemoData}
        onEmptyData={handleEmptyAllData}
        isSyncing={isSyncing}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ==================== ADMIN PORTAL VIEWS ==================== */}
        {activePortal === 'admin' && (
          <>
            {adminTab === 'dashboard' && (
              <DistributionView
                contacts={contacts}
                callers={callers}
                assignments={assignments}
                callingDate={callingDate}
                onDistribute={handleDistribute}
                onSwitchToCaller={handleSwitchToCaller}
              />
            )}

            {adminTab === 'contacts' && (
              <ContactsView
                contacts={contacts}
                onImportContacts={handleImportContacts}
                onDeleteContact={handleDeleteContact}
                onRefresh={loadData}
              />
            )}

            {adminTab === 'callers' && (
              <CallerTeamView
                callers={callers}
                callingDate={callingDate}
                onSaveCaller={handleSaveCaller}
                onDeleteCaller={handleDeleteCaller}
                onTriggerReassignment={handleTriggerReassignment}
                onSwitchToCaller={handleSwitchToCaller}
              />
            )}

            {adminTab === 'reassignment' && (
              <ReassignmentView
                callers={callers}
                assignments={assignments}
                callingDate={callingDate}
                reassignments={reassignments}
                onExecuteReassignment={handleExecuteReassignment}
                preselectedCallerId={reassignmentTargetCallerId}
              />
            )}

            {adminTab === 'reports' && (
              <ReportsView
                callingDate={callingDate}
                assignments={assignments}
                attempts={attempts}
                callers={callers}
              />
            )}

            {adminTab === 'audit' && (
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
          </>
        )}

        {/* ==================== CALLER PORTAL VIEW ==================== */}
        {activePortal === 'caller' && (
          currentCaller ? (
            <CallerDashboardView
              currentCaller={currentCaller}
              assignments={assignments}
              callingDate={callingDate}
              attempts={attempts}
              onSaveAttempt={handleSaveAttempt}
              allCallers={callers}
              onSwitchCaller={setSelectedCallerId}
              onSaveCaller={handleSaveCaller}
              activeSubTab={callerSubTab}
              onSubTabChange={setCallerSubTab}
            />
          ) : (
            <div className="p-8 text-center bg-[#fbf7fe] rounded-3xl border border-[#e2d0fa] shadow-sm">
              <p className="text-sm text-[#7c7896] font-medium">
                No callers registered in the system yet. Please switch to the Admin Portal and register callers in the "Daily Callers Fleet" tab first.
              </p>
              <button
                type="button"
                onClick={() => setActivePortal('admin')}
                className="mt-4 px-4 py-2 bg-[#6c28f5] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                Go to Admin Portal
              </button>
            </div>
          )
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#240c54] border-t border-[#3b1580] py-4 text-xs text-purple-200/80">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white">KIU Manifest Call Center Hub</span>
            <span className="text-purple-400">•</span>
            <span className="text-purple-200">
              Owned by <strong className="text-white font-semibold">Muhindo</strong>
            </span>
            <span className="text-purple-400">•</span>
            <span className="text-purple-200">
              Developed by <strong className="text-[#88d600] font-bold">Arnible</strong>
            </span>
          </div>
          <span className="font-mono text-[11px] text-purple-300">
            Database: Cloud Firestore ({assignments.length} assignments, {attempts.length} attempts)
          </span>
        </div>
      </footer>
    </div>
  );
}
