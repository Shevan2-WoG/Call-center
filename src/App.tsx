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
  clearUploadedContacts,
  clearDailyAssignments,
} from './services/dbService';
import { Navbar } from './components/Navbar';
import { DistributionView } from './components/DistributionView';
import { ContactsView } from './components/ContactsView';
import { CallerTeamView } from './components/CallerTeamView';
import { CallerDashboardView } from './components/CallerDashboardView';
import { ReassignmentView } from './components/ReassignmentView';
import { ReportsView } from './components/ReportsView';
import { AuditView } from './components/AuditView';
import { HomeView } from './components/HomeView';
import { AdminLoginModal } from './components/AdminLoginModal';
import { Lock } from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState<'home' | 'caller' | 'admin'>('home');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('kiu_admin_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

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

  // Clear uploaded Excel contacts & operational campaign data (Registered callers are kept constant!)
  const handleEmptyAllData = async () => {
    if (
      window.confirm(
        'Clear all uploaded Excel contacts, assignments, and calling records?\n\nNote: All registered callers and their details will remain constant and will NOT be deleted.'
      )
    ) {
      setIsSyncing(true);
      try {
        await clearAllDatabaseData();
        setContacts([]);
        // Strictly preserve callers
        const retainedCallers = await getCallers();
        setCallers(retainedCallers);
        setAssignments([]);
        setAttempts([]);
        setReassignments([]);
        setAuditLogs([]);
        if (retainedCallers.length > 0) {
          setSelectedCallerId((prev) =>
            retainedCallers.some((c) => c.id === prev) ? prev : retainedCallers[0].id
          );
        }
      } catch (err) {
        console.error('Error emptying database:', err);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Clear ONLY uploaded Excel contacts (Callers remain 100% constant and protected)
  const handleClearExcelContacts = async () => {
    if (
      window.confirm(
        'Delete all uploaded Excel contacts and active assignments?\n\nNote: All registered callers and their details will remain completely safe and untouched.'
      )
    ) {
      setIsSyncing(true);
      try {
        await clearUploadedContacts();
        await logAudit({
          userId: 'admin',
          userName: 'Administrator',
          userRole: 'admin',
          action: 'EXCEL_CONTACTS_PURGED',
          entity: 'contacts',
          metadata: { callersPreserved: callers.length },
        });
        await loadData();
      } catch (err) {
        console.error('Error clearing Excel contacts:', err);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Equal full redistribution of contacts across callers
  const handleRedistributeAll = async (
    newAssignments: Omit<Assignment, 'id'>[],
    team: DailyTeam
  ) => {
    setIsSyncing(true);
    try {
      await clearDailyAssignments(callingDate);
      const created = await saveAssignmentsBatch(newAssignments);
      await logAudit({
        userId: 'admin',
        userName: 'Administrator',
        userRole: 'admin',
        action: 'ALL_CONTACTS_REDISTRIBUTED_EQUALLY',
        entity: 'assignments',
        metadata: {
          count: created.length,
          callingDate,
          teamId: team.id,
        },
      });
      await loadData();
    } catch (err) {
      console.error('Error redistributing all contacts:', err);
    } finally {
      setIsSyncing(false);
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
    setActiveView('caller');
    setCallerSubTab('queue');
  };

  const handleTriggerReassignment = (caller: Caller) => {
    setReassignmentTargetCallerId(caller.id);
    if (!isAdminAuthenticated) {
      setIsAdminModalOpen(true);
      return;
    }
    setActiveView('admin');
    setAdminTab('reassignment');
  };

  const handleAdminBottomClick = () => {
    if (isAdminAuthenticated) {
      setActiveView('admin');
    } else {
      setIsAdminModalOpen(true);
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    try {
      sessionStorage.setItem('kiu_admin_auth', 'true');
    } catch (e) {
      console.error(e);
    }
    setIsAdminModalOpen(false);
    setActiveView('admin');
  };

  const handleLockAdmin = () => {
    setIsAdminAuthenticated(false);
    try {
      sessionStorage.removeItem('kiu_admin_auth');
    } catch (e) {
      console.error(e);
    }
    setActiveView('home');
  };

  // Active caller for Caller Dashboard
  const currentCaller = callers.find((c) => c.id === selectedCallerId) || callers[0];

  return (
    <div className={`min-h-screen ${activeView === 'home' ? 'bg-[#1b0840]' : 'bg-[#ebdffc]'} text-[#1e1b4b] flex flex-col font-sans selection:bg-[#6c28f5] selection:text-white`}>
      {/* Navigation & Header (Admin removed from top bar) */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        onLockAdmin={handleLockAdmin}
        isAdminAuthenticated={isAdminAuthenticated}
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

      {/* ==================== HOMEPAGE VIEW ==================== */}
      {activeView === 'home' && (
        <HomeView
          onEnterCallerPortal={(callerId) => {
            if (callerId) setSelectedCallerId(callerId);
            setActiveView('caller');
          }}
          onOpenAdminLogin={handleAdminBottomClick}
          callers={callers}
          assignments={assignments}
          attempts={attempts}
          callingDate={callingDate}
          selectedCallerId={selectedCallerId}
          onSelectCallerId={setSelectedCallerId}
        />
      )}

      {/* ==================== CALLER PORTAL VIEW ==================== */}
      {activeView === 'caller' && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {currentCaller ? (
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
                No callers registered in the system yet. Please access the Admin Portal below to configure the daily team.
              </p>
              <button
                type="button"
                onClick={handleAdminBottomClick}
                className="mt-4 px-4 py-2 bg-[#6c28f5] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                Access Admin Portal
              </button>
            </div>
          )}
        </main>
      )}

      {/* ==================== ADMIN PORTAL VIEWS (Only if authenticated) ==================== */}
      {activeView === 'admin' && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {adminTab === 'dashboard' && (
            <DistributionView
              contacts={contacts}
              callers={callers}
              assignments={assignments}
              callingDate={callingDate}
              onDistribute={handleDistribute}
              onRedistributeAll={handleRedistributeAll}
              onSwitchToCaller={handleSwitchToCaller}
            />
          )}

          {adminTab === 'contacts' && (
            <ContactsView
              contacts={contacts}
              onImportContacts={handleImportContacts}
              onDeleteContact={handleDeleteContact}
              onClearAllContacts={handleClearExcelContacts}
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
        </main>
      )}

      {/* Footer with Attribution and Discreet Admin Portal Access */}
      <footer className="bg-[#240c54] border-t border-[#3b1580] py-4 text-xs text-purple-200/80">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveView('home')}
              className="font-bold text-white hover:text-purple-200 transition-colors cursor-pointer text-left"
            >
              KIU Manifest Call Center Hub
            </button>
            <span className="text-purple-400">•</span>
            <span className="text-purple-200">
              Owned by <strong className="text-white font-semibold">Muhindo</strong>
            </span>
            <span className="text-purple-400">•</span>
            <span className="text-purple-200">
              Developed by <strong className="text-[#88d600] font-bold">Arnible</strong>
            </span>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-mono text-[11px] text-purple-300">
              Firestore ({assignments.length} assignments, {attempts.length} attempts)
            </span>

            {/* Discreet Admin Portal Access Button */}
            <button
              type="button"
              onClick={handleAdminBottomClick}
              className="inline-flex items-center gap-1.5 text-purple-200 hover:text-white transition-all cursor-pointer text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-900/50 hover:bg-purple-800/80 border border-purple-400/30 shadow-sm"
              title="Restricted Administrator Access"
            >
              <Lock className="w-3 h-3 text-[#ff2a85]" />
              <span>
                {isAdminAuthenticated && activeView === 'admin'
                  ? 'Admin Active'
                  : 'Admin Portal'}
              </span>
            </button>
          </div>
        </div>
      </footer>

      {/* Password Modal for Admin Access */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />
    </div>
  );
}
