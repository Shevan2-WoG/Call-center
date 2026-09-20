import { Contact, Caller, Assignment, ReassignmentRecord } from '../types';

export interface DistributionPlanItem {
  caller: Caller;
  count: number;
  contacts: Contact[];
}

export interface DistributionResult {
  plan: DistributionPlanItem[];
  assignments: Omit<Assignment, 'id'>[];
  totalContacts: number;
  totalCallers: number;
  remainder: number;
}

/**
 * Calculates fair equal distribution of contacts among available callers
 * Example: 100 contacts / 4 callers = 25 each
 * Example: 103 contacts / 4 callers = 26, 26, 26, 25
 */
export function calculateDistribution(
  contactsToDistribute: Contact[],
  availableCallers: Caller[],
  callingDate: string,
  teamId: string
): DistributionResult {
  const nContacts = contactsToDistribute.length;
  const nCallers = availableCallers.length;

  if (nCallers === 0 || nContacts === 0) {
    return {
      plan: availableCallers.map((caller) => ({ caller, count: 0, contacts: [] })),
      assignments: [],
      totalContacts: nContacts,
      totalCallers: nCallers,
      remainder: 0,
    };
  }

  const basePerCaller = Math.floor(nContacts / nCallers);
  const remainder = nContacts % nCallers;

  // Initialize plan items for all parties
  const plan: DistributionPlanItem[] = availableCallers.map((caller) => ({
    caller,
    count: 0,
    contacts: [],
  }));

  const assignments: Omit<Assignment, 'id'>[] = [];
  const now = new Date().toISOString();

  // Equal round-robin distribution to all parties:
  // Contact i is allocated to caller (i % nCallers)
  // Guarantees:
  // 1. Every contact is assigned (100% distribution with zero contacts left behind)
  // 2. All parties get Math.floor(nContacts / nCallers) contacts
  // 3. The remainder (nContacts % nCallers) contacts are distributed 1-by-1 to callers
  // 4. Contacts from the Excel sheet are evenly dispersed among all parties
  for (let i = 0; i < nContacts; i++) {
    const callerIdx = i % nCallers;
    const contact = contactsToDistribute[i];
    const caller = availableCallers[callerIdx];

    plan[callerIdx].count += 1;
    plan[callerIdx].contacts.push(contact);

    assignments.push({
      contactId: contact.id,
      contactName: contact.name,
      contactPhone: contact.phone,
      contactLocation: contact.location,
      contactCategory: contact.category,
      contactNotes: contact.notes,
      callerId: caller.id,
      callerName: caller.name,
      teamId,
      callingDate,
      status: 'Assigned',
      originalCallerId: caller.id,
      currentCallerId: caller.id,
      assignedAt: now,
      reassignmentHistory: [],
    });
  }

  return {
    plan,
    assignments,
    totalContacts: nContacts,
    totalCallers: nCallers,
    remainder,
  };
}

/**
 * Formats a WhatsApp-ready dispatch message for a caller
 * Spec Section 10:
 * - Calling date
 * - Number of assigned contacts
 * - Contact names
 * - Contact numbers
 * - Relevant notes
 */
/**
 * Scriptural Start Message requested for assignment layout (Hebrews 6:10 AMPC)
 */
export const HEBREWS_6_10_START_MESSAGE =
  `🕊️ *Hebrew 6:10 says... Your effort and availability is not in vain*\n` +
  `*Hebrews 6:10 AMPC*\n` +
  `_[10] For God is not unrighteous to forget or overlook your labor and the love which you have shown for His name's sake in ministering to the needs of the saints (His own consecrated people), as you still do._\n\n` +
  `━━━━━━━━━━━━━━━━━━━━\n\n`;

export function formatWhatsAppAssignmentMessage(
  callerName: string,
  callingDate: string,
  assignedContacts: { name: string; phone: string; location?: string; category?: string; notes?: string }[]
): string {
  const startMessage = HEBREWS_6_10_START_MESSAGE;

  const header = `📞 *KIU MANIFEST CALL CENTER ASSIGNMENTS*\n` +
    `📅 Date: ${callingDate}\n` +
    `👤 Caller: ${callerName}\n` +
    `📊 Workload: ${assignedContacts.length} Contacts assigned\n` +
    `━━━━━━━━━━━━━━━━━━━━\n\n`;

  const body = assignedContacts.map((c, i) => {
    let item = `*${i + 1}. ${c.name}*\n` +
      `   📱 ${c.phone}\n`;
    if (c.location && c.location !== 'Unspecified') {
      item += `   📍 Location: ${c.location}\n`;
    }
    if (c.category && c.category !== 'General') {
      item += `   🏷 Category: ${c.category}\n`;
    }
    if (c.notes) {
      item += `   📝 Note: ${c.notes}\n`;
    }
    return item;
  }).join('\n');

  const footer = `\n━━━━━━━━━━━━━━━━━━━━\n` +
    `✅ Please login to your Caller Portal to record call outcomes immediately after each call!\n` +
    `🏢 Operations Owner: Muhindo • Platform: Arnible\n` +
    `Good luck with today's calls!`;

  return startMessage + header + body + footer;
}

/**
 * Generates direct wa.me link for WhatsApp Web or Mobile
 */
export function generateWhatsAppUrl(whatsappNumber: string, message: string): string {
  const cleanPhone = whatsappNumber.replace(/[^0-9]/g, '');
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}

/**
 * Redistribute unfinished assignments of an unavailable caller among active callers
 * Spec Section 14
 */
export function calculateReassignment(
  unfinishedAssignments: Assignment[],
  unavailableCaller: Caller,
  availableCallers: Caller[],
  reason: string
): {
  updatedAssignments: Assignment[];
  reassignmentRecords: Omit<ReassignmentRecord, 'id'>[];
  planSummary: { toCaller: Caller; count: number }[];
} {
  const nUnfinished = unfinishedAssignments.length;
  const nCallers = availableCallers.length;

  if (nUnfinished === 0 || nCallers === 0) {
    return {
      updatedAssignments: [],
      reassignmentRecords: [],
      planSummary: [],
    };
  }

  const baseCount = Math.floor(nUnfinished / nCallers);
  const remainder = nUnfinished % nCallers;

  const now = new Date().toISOString();
  const updatedAssignments: Assignment[] = [];
  const reassignmentRecords: Omit<ReassignmentRecord, 'id'>[] = [];
  const planSummary: { toCaller: Caller; count: number }[] = [];

  let cursor = 0;

  for (let i = 0; i < nCallers; i++) {
    const toCaller = availableCallers[i];
    const takeCount = baseCount + (i < remainder ? 1 : 0);
    const slice = unfinishedAssignments.slice(cursor, cursor + takeCount);
    cursor += takeCount;

    planSummary.push({
      toCaller,
      count: takeCount,
    });

    slice.forEach(asg => {
      const historyItem = {
        fromCallerId: unavailableCaller.id,
        fromCallerName: unavailableCaller.name,
        toCallerId: toCaller.id,
        toCallerName: toCaller.name,
        reason,
        reassignedAt: now,
      };

      const updated: Assignment = {
        ...asg,
        callerId: toCaller.id,
        callerName: toCaller.name,
        currentCallerId: toCaller.id,
        status: 'Assigned',
        reassignmentHistory: [...(asg.reassignmentHistory || []), historyItem],
      };

      updatedAssignments.push(updated);

      reassignmentRecords.push({
        assignmentId: asg.id,
        contactId: asg.contactId,
        fromCallerId: unavailableCaller.id,
        fromCallerName: unavailableCaller.name,
        toCallerId: toCaller.id,
        toCallerName: toCaller.name,
        reason,
        reassignedAt: now,
      });
    });
  }

  return {
    updatedAssignments,
    reassignmentRecords,
    planSummary,
  };
}
