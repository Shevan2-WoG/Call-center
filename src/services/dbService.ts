import {
  db,
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from '../lib/firebase';
import {
  User,
  Contact,
  Caller,
  DailyTeam,
  DailyTeamMember,
  Assignment,
  CallAttempt,
  ReassignmentRecord,
  AuditLog,
  CallOutcome,
  DailyReportSummary,
  CALL_OUTCOMES,
} from '../types';

const STORAGE_KEYS = {
  USERS: 'cc_users',
  CONTACTS: 'cc_contacts',
  CALLERS: 'cc_callers',
  TEAMS: 'cc_daily_teams',
  TEAM_MEMBERS: 'cc_daily_team_members',
  ASSIGNMENTS: 'cc_assignments',
  CALL_ATTEMPTS: 'cc_call_attempts',
  REASSIGNMENTS: 'cc_reassignments',
  AUDIT_LOGS: 'cc_audit_logs',
};

// Local storage fallback helpers for resilience and snappy offline preview
function getLocal<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

function setLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

// ------------------- USERS -------------------
export async function getUsers(): Promise<User[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
    setLocal(STORAGE_KEYS.USERS, list);
    return list;
  } catch (err) {
    console.warn('Firestore read error, using local state for users', err);
    return getLocal<User[]>(STORAGE_KEYS.USERS, []);
  }
}

// ------------------- CALLERS -------------------
export async function getCallers(): Promise<Caller[]> {
  try {
    const snap = await getDocs(collection(db, 'callers'));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Caller));
    setLocal(STORAGE_KEYS.CALLERS, list);
    return list;
  } catch (err) {
    console.warn('Firestore read error for callers', err);
    return getLocal<Caller[]>(STORAGE_KEYS.CALLERS, []);
  }
}

export async function saveCaller(caller: Caller): Promise<void> {
  const callers = getLocal<Caller[]>(STORAGE_KEYS.CALLERS, []);
  const idx = callers.findIndex(c => c.id === caller.id);
  if (idx >= 0) {
    callers[idx] = caller;
  } else {
    callers.push(caller);
  }
  setLocal(STORAGE_KEYS.CALLERS, callers);

  try {
    await setDoc(doc(db, 'callers', caller.id), caller, { merge: true });
  } catch (err) {
    console.warn('Firestore save caller error', err);
  }
}

export async function deleteCaller(callerId: string): Promise<void> {
  const callers = getLocal<Caller[]>(STORAGE_KEYS.CALLERS, []).filter(c => c.id !== callerId);
  setLocal(STORAGE_KEYS.CALLERS, callers);

  try {
    await deleteDoc(doc(db, 'callers', callerId));
  } catch (err) {
    console.warn('Firestore delete caller error', err);
  }
}

// ------------------- CONTACTS -------------------
export async function getContacts(): Promise<Contact[]> {
  try {
    const snap = await getDocs(collection(db, 'contacts'));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Contact));
    setLocal(STORAGE_KEYS.CONTACTS, list);
    return list;
  } catch (err) {
    console.warn('Firestore read contacts error', err);
    return getLocal<Contact[]>(STORAGE_KEYS.CONTACTS, []);
  }
}

export async function saveContactsBatch(newContacts: Omit<Contact, 'id' | 'createdAt' | 'status'>[]): Promise<Contact[]> {
  const existing = getLocal<Contact[]>(STORAGE_KEYS.CONTACTS, []);
  const now = new Date().toISOString();
  
  const created: Contact[] = newContacts.map((c, i) => ({
    ...c,
    id: `cnt_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`,
    status: 'unassigned',
    createdAt: now,
  }));

  const updated = [...created, ...existing];
  setLocal(STORAGE_KEYS.CONTACTS, updated);

  try {
    // Write in chunks of 400 to comply with Firestore batch limits
    for (let i = 0; i < created.length; i += 400) {
      const batch = writeBatch(db);
      created.slice(i, i + 400).forEach(contact => {
        batch.set(doc(db, 'contacts', contact.id), contact);
      });
      await batch.commit();
    }
  } catch (err) {
    console.warn('Firestore batch save contacts error', err);
  }

  return created;
}

export async function deleteContact(contactId: string): Promise<void> {
  const contacts = getLocal<Contact[]>(STORAGE_KEYS.CONTACTS, []).filter(c => c.id !== contactId);
  setLocal(STORAGE_KEYS.CONTACTS, contacts);

  try {
    await deleteDoc(doc(db, 'contacts', contactId));
  } catch (err) {
    console.warn('Firestore delete contact error', err);
  }
}

export async function updateContactStatus(contactId: string, status: Contact['status']): Promise<void> {
  const contacts = getLocal<Contact[]>(STORAGE_KEYS.CONTACTS, []);
  const idx = contacts.findIndex(c => c.id === contactId);
  if (idx >= 0) {
    contacts[idx].status = status;
    contacts[idx].updatedAt = new Date().toISOString();
    setLocal(STORAGE_KEYS.CONTACTS, contacts);
  }

  try {
    await updateDoc(doc(db, 'contacts', contactId), {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Firestore update contact error', err);
  }
}

// ------------------- DAILY TEAMS -------------------
export async function getDailyTeams(): Promise<DailyTeam[]> {
  try {
    const snap = await getDocs(collection(db, 'dailyTeams'));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as DailyTeam));
    setLocal(STORAGE_KEYS.TEAMS, list);
    return list;
  } catch (err) {
    console.warn('Firestore read dailyTeams error', err);
    return getLocal<DailyTeam[]>(STORAGE_KEYS.TEAMS, []);
  }
}

export async function saveDailyTeam(team: DailyTeam): Promise<void> {
  const teams = getLocal<DailyTeam[]>(STORAGE_KEYS.TEAMS, []);
  const idx = teams.findIndex(t => t.id === team.id);
  if (idx >= 0) {
    teams[idx] = team;
  } else {
    teams.push(team);
  }
  setLocal(STORAGE_KEYS.TEAMS, teams);

  try {
    await setDoc(doc(db, 'dailyTeams', team.id), team, { merge: true });
  } catch (err) {
    console.warn('Firestore save dailyTeam error', err);
  }
}

// ------------------- ASSIGNMENTS -------------------
export async function getAssignments(callingDate?: string): Promise<Assignment[]> {
  let list: Assignment[] = [];
  try {
    const snap = await getDocs(collection(db, 'assignments'));
    list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Assignment));
    setLocal(STORAGE_KEYS.ASSIGNMENTS, list);
  } catch (err) {
    console.warn('Firestore read assignments error', err);
    list = getLocal<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, []);
  }

  if (callingDate) {
    return list.filter(a => a.callingDate === callingDate);
  }
  return list;
}

export async function saveAssignmentsBatch(newAssignments: Omit<Assignment, 'id'>[]): Promise<Assignment[]> {
  const existing = getLocal<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, []);
  const created: Assignment[] = newAssignments.map((a, i) => ({
    ...a,
    id: `asg_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`,
  }));

  const updated = [...existing, ...created];
  setLocal(STORAGE_KEYS.ASSIGNMENTS, updated);

  // Also update contacts status to 'assigned'
  const contactIds = new Set(created.map(a => a.contactId));
  const contacts = getLocal<Contact[]>(STORAGE_KEYS.CONTACTS, []);
  contacts.forEach(c => {
    if (contactIds.has(c.id)) {
      c.status = 'assigned';
    }
  });
  setLocal(STORAGE_KEYS.CONTACTS, contacts);

  try {
    const batch = writeBatch(db);
    created.slice(0, 100).forEach(asg => {
      batch.set(doc(db, 'assignments', asg.id), asg);
    });
    await batch.commit();
  } catch (err) {
    console.warn('Firestore batch save assignments error', err);
  }

  return created;
}

export async function updateAssignmentsBatch(updatedList: Assignment[]): Promise<void> {
  const map = new Map(updatedList.map(a => [a.id, a]));
  const existing = getLocal<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, []);
  const updated = existing.map(a => map.get(a.id) || a);
  setLocal(STORAGE_KEYS.ASSIGNMENTS, updated);

  try {
    const batch = writeBatch(db);
    updatedList.slice(0, 100).forEach(asg => {
      batch.set(doc(db, 'assignments', asg.id), asg, { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.warn('Firestore batch update assignments error', err);
  }
}

// ------------------- CALL ATTEMPTS (PERMANENT HISTORY) -------------------
export async function getCallAttempts(): Promise<CallAttempt[]> {
  try {
    const snap = await getDocs(collection(db, 'callAttempts'));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as CallAttempt));
    setLocal(STORAGE_KEYS.CALL_ATTEMPTS, list);
    return list;
  } catch (err) {
    console.warn('Firestore read callAttempts error', err);
    return getLocal<CallAttempt[]>(STORAGE_KEYS.CALL_ATTEMPTS, []);
  }
}

/**
 * Saves a call attempt permanently (never overwrites previous attempts)
 * Spec Section 12 & 13
 */
export async function recordCallAttempt(attemptData: Omit<CallAttempt, 'id' | 'calledAt'>): Promise<CallAttempt> {
  const attempts = getLocal<CallAttempt[]>(STORAGE_KEYS.CALL_ATTEMPTS, []);
  const now = new Date().toISOString();
  
  const attempt: CallAttempt = {
    ...attemptData,
    id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    calledAt: now,
  };

  attempts.push(attempt);
  setLocal(STORAGE_KEYS.CALL_ATTEMPTS, attempts);

  // Update corresponding assignment
  const assignments = getLocal<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, []);
  const asgIdx = assignments.findIndex(a => 
    (attempt.assignmentId && a.id === attempt.assignmentId) || 
    (a.contactId === attempt.contactId && a.status !== 'Completed')
  );

  if (asgIdx >= 0) {
    assignments[asgIdx].status = 'Completed';
    assignments[asgIdx].lastOutcome = attempt.outcome;
    assignments[asgIdx].completedAt = now;
    setLocal(STORAGE_KEYS.ASSIGNMENTS, assignments);

    try {
      await updateDoc(doc(db, 'assignments', assignments[asgIdx].id), {
        status: 'Completed',
        lastOutcome: attempt.outcome,
        completedAt: now,
      });
    } catch (e) {
      // ignore
    }
  }

  // Update contact status
  const contacts = getLocal<Contact[]>(STORAGE_KEYS.CONTACTS, []);
  const cntIdx = contacts.findIndex(c => c.id === attempt.contactId);
  if (cntIdx >= 0) {
    contacts[cntIdx].status = 'completed';
    setLocal(STORAGE_KEYS.CONTACTS, contacts);
    try {
      await updateDoc(doc(db, 'contacts', attempt.contactId), {
        status: 'completed',
        updatedAt: now,
      });
    } catch (e) {
      // ignore
    }
  }

  try {
    await setDoc(doc(db, 'callAttempts', attempt.id), attempt);
  } catch (err) {
    console.warn('Firestore recordCallAttempt error', err);
  }

  return attempt;
}

// ------------------- REASSIGNMENTS -------------------
export async function getReassignments(): Promise<ReassignmentRecord[]> {
  try {
    const snap = await getDocs(collection(db, 'reassignments'));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ReassignmentRecord));
    setLocal(STORAGE_KEYS.REASSIGNMENTS, list);
    return list;
  } catch (err) {
    console.warn('Firestore read reassignments error', err);
    return getLocal<ReassignmentRecord[]>(STORAGE_KEYS.REASSIGNMENTS, []);
  }
}

export async function saveReassignmentsBatch(records: Omit<ReassignmentRecord, 'id'>[]): Promise<void> {
  const existing = getLocal<ReassignmentRecord[]>(STORAGE_KEYS.REASSIGNMENTS, []);
  const created: ReassignmentRecord[] = records.map((r, i) => ({
    ...r,
    id: `rea_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`,
  }));

  setLocal(STORAGE_KEYS.REASSIGNMENTS, [...existing, ...created]);

  try {
    const batch = writeBatch(db);
    created.slice(0, 100).forEach(r => {
      batch.set(doc(db, 'reassignments', r.id), r);
    });
    await batch.commit();
  } catch (err) {
    console.warn('Firestore save reassignments error', err);
  }
}

// ------------------- AUDIT LOGS -------------------
export async function getAuditLogs(): Promise<AuditLog[]> {
  try {
    const snap = await getDocs(collection(db, 'auditLogs'));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog));
    setLocal(STORAGE_KEYS.AUDIT_LOGS, list);
    return list;
  } catch (err) {
    console.warn('Firestore read auditLogs error', err);
    return getLocal<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  }
}

export async function logAudit(logData: Omit<AuditLog, 'id' | 'createdAt'>): Promise<void> {
  const logs = getLocal<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  const item: AuditLog = {
    ...logData,
    id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  logs.unshift(item);
  setLocal(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 200));

  try {
    await setDoc(doc(db, 'auditLogs', item.id), item);
  } catch (err) {
    console.warn('Firestore save auditLog error', err);
  }
}

// ------------------- REPORT CONSOLIDATION -------------------
export function buildDailyReportSummary(
  callingDate: string,
  dailyAssignments: Assignment[],
  attempts: CallAttempt[],
  callers: Caller[]
): DailyReportSummary {
  const totalAssigned = dailyAssignments.length;
  const completed = dailyAssignments.filter(a => a.status === 'Completed').length;
  const pending = totalAssigned - completed;

  // Filter attempts matching assignments or contacts for this date
  const asgContactIds = new Set(dailyAssignments.map(a => a.contactId));
  const dateAttempts = attempts.filter(att => asgContactIds.has(att.contactId) || att.calledAt.startsWith(callingDate));

  const outcomeCounts = CALL_OUTCOMES.reduce((acc, outcome) => {
    acc[outcome] = 0;
    return acc;
  }, {} as Record<CallOutcome, number>);

  // Count latest outcome per assigned contact
  dailyAssignments.forEach(asg => {
    if (asg.lastOutcome && outcomeCounts[asg.lastOutcome as CallOutcome] !== undefined) {
      outcomeCounts[asg.lastOutcome as CallOutcome]++;
    }
  });

  const callerPerformance = callers.map(caller => {
    const callerAsgs = dailyAssignments.filter(a => a.callerId === caller.id || a.currentCallerId === caller.id);
    const callerAssigned = callerAsgs.length;
    const callerCompleted = callerAsgs.filter(a => a.status === 'Completed').length;
    const callerPending = callerAssigned - callerCompleted;
    const callerCalls = dateAttempts.filter(att => att.callerId === caller.id).length;
    const completionRate = callerAssigned > 0 ? Math.round((callerCompleted / callerAssigned) * 100) : 0;

    return {
      callerId: caller.id,
      callerName: caller.name,
      whatsappNumber: caller.whatsappNumber,
      assigned: callerAssigned,
      completed: callerCompleted,
      pending: callerPending,
      callsCount: callerCalls,
      completionRate,
    };
  });

  return {
    callingDate,
    totalContacts: totalAssigned,
    totalAssigned,
    callsAttempted: dateAttempts.length,
    completed,
    pending,
    outcomeCounts,
    callerPerformance,
  };
}

// ------------------- INITIAL SEED DATA -------------------
export async function seedInitialDataIfEmpty(currentCallingDate = '2026-09-09', force = false): Promise<void> {
  // Respect user intent: only seed if explicitly forced by the user
  if (!force) {
    return;
  }

  const existingCallers = await getCallers();
  const existingContacts = await getContacts();

  if (!force && existingCallers.length > 0 && existingContacts.length > 0) {
    return; // Already initialized
  }

  // 1. Seed Callers (4 callers as in specification: Caller A, B, C, D)
  const initialCallers: Caller[] = [
    {
      id: 'caller_1',
      name: 'Caller A (Sarah Namukasa)',
      phone: '+256701111222',
      whatsappNumber: '+256701111222',
      availabilityStatus: 'available',
      teamGroup: 'Kampala Central',
      targetCalls: 30,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'caller_2',
      name: 'Caller B (David Kato)',
      phone: '+256702222333',
      whatsappNumber: '+256702222333',
      availabilityStatus: 'available',
      teamGroup: 'Kampala Central',
      targetCalls: 30,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'caller_3',
      name: 'Caller C (Brenda Akello)',
      phone: '+256703333444',
      whatsappNumber: '+256703333444',
      availabilityStatus: 'available',
      teamGroup: 'Wakiso West',
      targetCalls: 30,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'caller_4',
      name: 'Caller D (Joseph Ochieng)',
      phone: '+256704444555',
      whatsappNumber: '+256704444555',
      availabilityStatus: 'available',
      teamGroup: 'Wakiso West',
      targetCalls: 30,
      createdAt: new Date().toISOString(),
    },
  ];

  for (const c of initialCallers) {
    await saveCaller(c);
  }

  // 2. Seed Initial Sample Contacts
  const sampleContactsData: Omit<Contact, 'id' | 'createdAt' | 'status'>[] = [
    { name: 'John Doe', phone: '256700000001', normalizedPhone: '+256700000001', location: 'Kampala', category: 'Student', notes: 'Interested in tech training', source: 'Initial Import' },
    { name: 'Jane Doe', phone: '256710000002', normalizedPhone: '+256710000002', location: 'Wakiso', category: 'Visitor', notes: 'Follow up regarding admission', source: 'Initial Import' },
    { name: 'Michael Kigozi', phone: '256772123403', normalizedPhone: '+256772123403', location: 'Entebbe', category: 'Corporate', notes: 'Requested brochure', source: 'Initial Import' },
    { name: 'Amina Hassan', phone: '256755987604', normalizedPhone: '+256755987604', location: 'Jinja', category: 'Entrepreneur', notes: 'Preferred callback in afternoon', source: 'Initial Import' },
    { name: 'Grace Nakato', phone: '256784112205', normalizedPhone: '+256784112205', location: 'Mbarara', category: 'Student', notes: 'Inquired about fee structure', source: 'Initial Import' },
    { name: 'Patrick Musoke', phone: '256705123406', normalizedPhone: '+256705123406', location: 'Kampala', category: 'Lead', notes: 'Call after 2 PM', source: 'Initial Import' },
    { name: 'Beatrice Nalwanga', phone: '256782345607', normalizedPhone: '+256782345607', location: 'Mukono', category: 'Corporate', notes: 'Decision maker for training', source: 'Initial Import' },
    { name: 'Samuel Opio', phone: '256773456708', normalizedPhone: '+256773456708', location: 'Gulu', category: 'Visitor', notes: 'Needs schedule details', source: 'Initial Import' },
    { name: 'Evelyn Nabirye', phone: '256754567809', normalizedPhone: '+256754567809', location: 'Iganga', category: 'Entrepreneur', notes: 'Seeking partnership information', source: 'Initial Import' },
    { name: 'Robert Tumwine', phone: '256785678910', normalizedPhone: '+256785678910', location: 'Kabale', category: 'Student', notes: 'Wants weekend cohort info', source: 'Initial Import' },
    { name: 'Florence Babirye', phone: '256706789011', normalizedPhone: '+256706789011', location: 'Kampala', category: 'Lead', notes: 'Urgent follow-up', source: 'Initial Import' },
    { name: 'Denis Okello', phone: '256777890112', normalizedPhone: '+256777890112', location: 'Lira', category: 'Student', notes: 'Financial aid inquiry', source: 'Initial Import' },
    { name: 'Ritah Asiimwe', phone: '256788901213', normalizedPhone: '+256788901213', location: 'Fort Portal', category: 'Corporate', notes: 'Sponsorship inquiry', source: 'Initial Import' },
    { name: 'Emmanuel Ssenyonjo', phone: '256709012314', normalizedPhone: '+256709012314', location: 'Masaka', category: 'Visitor', notes: 'Visited booth at expo', source: 'Initial Import' },
    { name: 'Doreen Namubiru', phone: '256751123415', normalizedPhone: '+256751123415', location: 'Wakiso', category: 'Entrepreneur', notes: 'Ready to register next week', source: 'Initial Import' },
    { name: 'Brian Mugisha', phone: '256782234516', normalizedPhone: '+256782234516', location: 'Mbarara', category: 'Student', notes: 'Morning calls preferred', source: 'Initial Import' },
    { name: 'Harriet Nankya', phone: '256773345617', normalizedPhone: '+256773345617', location: 'Kampala', category: 'Lead', notes: 'Referred by alumni', source: 'Initial Import' },
    { name: 'Timothy Kintu', phone: '256704456718', normalizedPhone: '+256704456718', location: 'Entebbe', category: 'Corporate', notes: 'HR coordinator', source: 'Initial Import' },
    { name: 'Prossy Namutebi', phone: '256755567819', normalizedPhone: '+256755567819', location: 'Jinja', category: 'Student', notes: 'Online course details', source: 'Initial Import' },
    { name: 'Geoffrey Ouma', phone: '256786678920', normalizedPhone: '+256786678920', location: 'Tororo', category: 'Lead', notes: 'Requested call back at 10 AM', source: 'Initial Import' },
  ];

  const seededContacts = await saveContactsBatch(sampleContactsData);

  // 3. Create Daily Team for today
  const teamId = `team_${currentCallingDate}`;
  const dailyTeam: DailyTeam = {
    id: teamId,
    callingDate: currentCallingDate,
    createdBy: 'System Administrator',
    status: 'active',
    totalContacts: seededContacts.length,
    totalAssigned: 0,
    createdAt: new Date().toISOString(),
  };
  await saveDailyTeam(dailyTeam);

  // 4. Create initial fair distribution (20 contacts / 4 callers = 5 each)
  const initialAssignments: Omit<Assignment, 'id'>[] = [];
  const now = new Date().toISOString();

  seededContacts.forEach((contact, index) => {
    const caller = initialCallers[index % initialCallers.length];
    initialAssignments.push({
      contactId: contact.id,
      contactName: contact.name,
      contactPhone: contact.phone,
      contactLocation: contact.location,
      contactCategory: contact.category,
      contactNotes: contact.notes,
      callerId: caller.id,
      callerName: caller.name,
      teamId,
      callingDate: currentCallingDate,
      status: 'Assigned',
      originalCallerId: caller.id,
      currentCallerId: caller.id,
      assignedAt: now,
      reassignmentHistory: [],
    });
  });

  const createdAsgs = await saveAssignmentsBatch(initialAssignments);

  // 5. Seed some sample attempts to showcase reporting, historical logging, and feedback module immediately
  if (createdAsgs.length > 0) {
    // Attempt 1: Available
    await recordCallAttempt({
      contactId: createdAsgs[0].contactId,
      callerId: createdAsgs[0].callerId,
      callerName: createdAsgs[0].callerName,
      assignmentId: createdAsgs[0].id,
      outcome: 'Available',
      comment: 'Very enthusiastic, confirmed attendance for next intake.',
      followUpDate: '2026-09-12',
      preferredCallbackTime: '10:00 AM',
    });

    // Attempt 2: Phone Off
    await recordCallAttempt({
      contactId: createdAsgs[1].contactId,
      callerId: createdAsgs[1].callerId,
      callerName: createdAsgs[1].callerName,
      assignmentId: createdAsgs[1].id,
      outcome: 'Phone Off',
      comment: 'Phone went straight to voicemail. Will retry later.',
    });

    // Attempt 3: Follow-up Required
    if (createdAsgs.length > 2) {
      await recordCallAttempt({
        contactId: createdAsgs[2].contactId,
        callerId: createdAsgs[2].callerId,
        callerName: createdAsgs[2].callerName,
        assignmentId: createdAsgs[2].id,
        outcome: 'Follow-up Required',
        comment: 'Traveling today, requested callback on Friday morning.',
        followUpDate: '2026-09-11',
        preferredCallbackTime: '09:30 AM',
      });
    }

    // Historical attempt demonstration (Attempt 1 then Attempt 2 for John Doe as requested in spec Section 13!)
    await recordCallAttempt({
      contactId: createdAsgs[0].contactId,
      callerId: 'caller_2',
      callerName: 'Caller B (David Kato)',
      assignmentId: createdAsgs[0].id,
      outcome: 'Interested',
      comment: 'Follow-up second attempt: Payment link dispatched via WhatsApp.',
    });
  }

  // 6. Log Audit
  await logAudit({
    userId: 'admin_sys',
    userName: 'System Administrator',
    userRole: 'admin',
    action: 'SYSTEM_INITIALIZED',
    entity: 'system',
    metadata: {
      callersCount: initialCallers.length,
      contactsCount: seededContacts.length,
      date: currentCallingDate,
    },
  });
}

// ------------------- CLEAR / EMPTY ALL DATA -------------------
export async function clearAllDatabaseData(): Promise<void> {
  // Clear local storage entirely
  try {
    localStorage.clear();
  } catch (e) {
    // ignore
  }

  // Explicitly remove all individual keys
  Object.values(STORAGE_KEYS).forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // ignore
    }
  });

  // Purge Firestore collections in chunked batches of 400
  const collections = [
    'contacts',
    'callers',
    'dailyTeams',
    'assignments',
    'callAttempts',
    'reassignments',
    'auditLogs',
    'users',
  ];

  for (const colName of collections) {
    try {
      const snap = await getDocs(collection(db, colName));
      if (!snap.empty) {
        for (let i = 0; i < snap.docs.length; i += 400) {
          const batch = writeBatch(db);
          snap.docs.slice(i, i + 400).forEach((docSnap) => {
            batch.delete(docSnap.ref);
          });
          await batch.commit();
        }
      }
    } catch (err) {
      console.warn(`Firestore clear error on ${colName}:`, err);
    }
  }
}

