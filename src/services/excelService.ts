import * as XLSX from 'xlsx';
import { Contact, CallAttempt, Assignment, DailyReportSummary, CALL_OUTCOMES } from '../types';

export interface ParseExcelResult {
  valid: Omit<Contact, 'id' | 'createdAt' | 'status'>[];
  invalid: { row: number; data: any; reason: string }[];
  duplicates: { row: number; data: any; reason: string }[];
  totalRows: number;
}

/**
 * Normalizes phone numbers:
 * - strips whitespace, dashes, parentheses
 * - handles + or leading 00
 * - normalizes e.g. 07... to +2567... if 10 digits starting with 07
 */
export function normalizePhoneNumber(rawPhone: any, defaultCountryCode = '256'): { normalized: string; isValid: boolean; error?: string } {
  if (!rawPhone) {
    return { normalized: '', isValid: false, error: 'Phone number is empty' };
  }

  let cleaned = String(rawPhone).trim().replace(/[\s\-\(\)\.]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }

  // If local format like 0700000000 (10 digits starting with 0)
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = defaultCountryCode + cleaned.substring(1);
  }

  // Must contain only digits
  if (!/^\d+$/.test(cleaned)) {
    return { normalized: cleaned, isValid: false, error: 'Phone contains invalid characters' };
  }

  // Must be between 8 and 15 digits (E.164 standard)
  if (cleaned.length < 8 || cleaned.length > 15) {
    return { normalized: cleaned, isValid: false, error: `Invalid phone length (${cleaned.length} digits)` };
  }

  return { normalized: '+' + cleaned, isValid: true };
}

/**
 * Parses an uploaded .xlsx or .xls file
 */
export async function parseContactExcel(
  file: File,
  existingPhones: Set<string>
): Promise<ParseExcelResult> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to JSON array of objects
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const valid: Omit<Contact, 'id' | 'createdAt' | 'status'>[] = [];
  const invalid: { row: number; data: any; reason: string }[] = [];
  const duplicates: { row: number; data: any; reason: string }[] = [];

  const seenInFile = new Set<string>();

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2; // considering 1-based index + header

    // Map column aliases
    const name = row['Name'] || row['Full Name'] || row['Contact Name'] || row['Customer Name'] || row['name'] || '';
    const rawPhone = row['Phone Number'] || row['Phone'] || row['Mobile'] || row['Telephone'] || row['Contact'] || row['phone'] || '';
    const location = row['Location'] || row['City'] || row['Address'] || row['District'] || row['location'] || '';
    const category = row['Category'] || row['Type'] || row['Segment'] || row['Role'] || row['category'] || 'General';
    const notes = row['Notes'] || row['Note'] || row['Remarks'] || row['Comment'] || row['notes'] || '';

    if (!name || String(name).trim() === '') {
      invalid.push({ row: rowNumber, data: row, reason: 'Missing Name' });
      return;
    }

    const phoneRes = normalizePhoneNumber(rawPhone);
    if (!phoneRes.isValid) {
      invalid.push({ row: rowNumber, data: row, reason: phoneRes.error || 'Invalid phone' });
      return;
    }

    const normalized = phoneRes.normalized;

    if (seenInFile.has(normalized)) {
      duplicates.push({ row: rowNumber, data: row, reason: 'Duplicate phone in uploaded file' });
      return;
    }

    if (existingPhones.has(normalized)) {
      duplicates.push({ row: rowNumber, data: row, reason: 'Contact already exists in database' });
      return;
    }

    seenInFile.add(normalized);

    valid.push({
      name: String(name).trim(),
      phone: String(rawPhone).trim(),
      normalizedPhone: normalized,
      location: String(location).trim() || 'Unspecified',
      category: String(category).trim() || 'General',
      notes: String(notes).trim(),
      source: file.name,
    });
  });

  return {
    valid,
    invalid,
    duplicates,
    totalRows: rawRows.length,
  };
}

/**
 * Generates sample downloadable Excel template
 */
export function downloadExcelTemplate() {
  const templateData = [
    {
      'Name': 'John Doe',
      'Phone Number': '256700000000',
      'Location': 'Kampala',
      'Category': 'Student',
      'Notes': 'Interested in tech courses',
    },
    {
      'Name': 'Jane Doe',
      'Phone Number': '256710000000',
      'Location': 'Wakiso',
      'Category': 'Visitor',
      'Notes': 'Follow up regarding registration',
    },
    {
      'Name': 'Michael Kigozi',
      'Phone Number': '256772123456',
      'Location': 'Entebbe',
      'Category': 'Corporate',
      'Notes': 'Requesting brochure via WhatsApp',
    },
    {
      'Name': 'Amina Hassan',
      'Phone Number': '256755987654',
      'Location': 'Jinja',
      'Category': 'Entrepreneur',
      'Notes': 'Preferred callback in afternoon',
    },
    {
      'Name': 'Grace Nakato',
      'Phone Number': '256784112233',
      'Location': 'Mbarara',
      'Category': 'Student',
      'Notes': 'Inquired about weekend schedule',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  worksheet['!cols'] = [
    { wch: 20 },
    { wch: 18 },
    { wch: 15 },
    { wch: 15 },
    { wch: 35 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts_Template');
  XLSX.writeFile(workbook, 'Call_Center_Contact_Import_Template.xlsx');
}

/**
 * Generates organized 12-sheet Excel Report as specified in Section 16
 */
export function exportDaily12SheetReport(
  callingDate: string,
  summary: DailyReportSummary,
  assignments: Assignment[],
  attempts: CallAttempt[]
) {
  const workbook = XLSX.utils.book_new();

  // Helper map for contact latest attempts
  const contactAttemptsMap = new Map<string, CallAttempt[]>();
  attempts.forEach(a => {
    const list = contactAttemptsMap.get(a.contactId) || [];
    list.push(a);
    contactAttemptsMap.set(a.contactId, list);
  });

  // Sheet 1 - Summary
  const summaryRows = [
    { 'Metric': 'Calling Date', 'Value': callingDate },
    { 'Metric': 'Total Contacts in Team', 'Value': summary.totalContacts },
    { 'Metric': 'Total Assigned', 'Value': summary.totalAssigned },
    { 'Metric': 'Calls Attempted', 'Value': summary.callsAttempted },
    { 'Metric': 'Completed Contacts', 'Value': summary.completed },
    { 'Metric': 'Pending Contacts', 'Value': summary.pending },
    { 'Metric': 'Overall Completion Rate', 'Value': `${summary.totalAssigned > 0 ? Math.round((summary.completed / summary.totalAssigned) * 100) : 0}%` },
    { 'Metric': '--- OUTCOMES BREAKDOWN ---', 'Value': '----------------' },
    ...CALL_OUTCOMES.map(outcome => ({
      'Metric': outcome,
      'Value': summary.outcomeCounts[outcome] || 0,
    }))
  ];
  const sheet1 = XLSX.utils.json_to_sheet(summaryRows);
  sheet1['!cols'] = [{ wch: 28 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, sheet1, 'Summary');

  // Sheets 2-10 for individual outcomes
  const outcomeSheetNames: { outcome: string; sheetName: string }[] = [
    { outcome: 'Available', sheetName: 'Available' },
    { outcome: 'Unavailable', sheetName: 'Unavailable' },
    { outcome: 'Recall', sheetName: 'Recall' },
    { outcome: 'Phone Off', sheetName: 'Phone Off' },
    { outcome: 'No Answer', sheetName: 'No Answer' },
    { outcome: 'Busy', sheetName: 'Busy' },
    { outcome: 'Not Interested', sheetName: 'Not Interested' },
    { outcome: 'Wrong Number', sheetName: 'Wrong Number' },
    { outcome: 'Follow-up Required', sheetName: 'Follow Up' },
  ];

  outcomeSheetNames.forEach(({ outcome, sheetName }) => {
    // Filter assignments that had this outcome as their latest outcome or in attempts
    const matchingAssignments = assignments.filter(asg => {
      const atts = contactAttemptsMap.get(asg.contactId) || [];
      const latest = atts[atts.length - 1];
      return latest && latest.outcome === outcome;
    });

    const rows = matchingAssignments.map((asg, i) => {
      const atts = contactAttemptsMap.get(asg.contactId) || [];
      const latest = atts[atts.length - 1];
      return {
        '#': i + 1,
        'Contact Name': asg.contactName,
        'Phone Number': asg.contactPhone,
        'Location': asg.contactLocation || 'N/A',
        'Category': asg.contactCategory || 'N/A',
        'Assigned Caller': asg.callerName,
        'Outcome': outcome,
        'Comments': latest?.comment || asg.contactNotes || '',
        'Follow-up Date': latest?.followUpDate || '',
        'Callback Time': latest?.preferredCallbackTime || '',
        'Recorded At': latest ? new Date(latest.calledAt).toLocaleTimeString() : '',
      };
    });

    const ws = rows.length > 0 
      ? XLSX.utils.json_to_sheet(rows) 
      : XLSX.utils.json_to_sheet([{ 'Message': `No contacts marked as '${outcome}' on ${callingDate}` }]);
    ws['!cols'] = [{ wch: 5 }, { wch: 22 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 18 }, { wch: 30 }, { wch: 16 }, { wch: 16 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(workbook, ws, sheetName);
  });

  // Sheet 11 - Call History (Complete call-attempt history)
  const historyRows = attempts.map((att, i) => ({
    '#': i + 1,
    'Attempt ID': att.id,
    'Contact ID': att.contactId,
    'Caller Name': att.callerName,
    'Outcome': att.outcome,
    'Comment': att.comment || '',
    'Follow-up Date': att.followUpDate || '',
    'Callback Time': att.preferredCallbackTime || '',
    'Additional Notes': att.additionalNotes || '',
    'Timestamp': new Date(att.calledAt).toLocaleString(),
  }));

  const sheet11 = historyRows.length > 0
    ? XLSX.utils.json_to_sheet(historyRows)
    : XLSX.utils.json_to_sheet([{ 'Message': 'No call attempts recorded yet for this date' }]);
  sheet11['!cols'] = [{ wch: 5 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 18 }, { wch: 30 }, { wch: 16 }, { wch: 16 }, { wch: 25 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(workbook, sheet11, 'Call History');

  // Sheet 12 - Caller Performance
  const performanceRows = summary.callerPerformance.map((cp, i) => ({
    '#': i + 1,
    'Caller Name': cp.callerName,
    'WhatsApp Number': cp.whatsappNumber,
    'Assigned': cp.assigned,
    'Calls Attempted': cp.callsCount,
    'Completed': cp.completed,
    'Pending': cp.pending,
    'Completion Rate': `${cp.completionRate}%`,
  }));

  const sheet12 = performanceRows.length > 0
    ? XLSX.utils.json_to_sheet(performanceRows)
    : XLSX.utils.json_to_sheet([{ 'Message': 'No callers registered for this date' }]);
  sheet12['!cols'] = [{ wch: 5 }, { wch: 22 }, { wch: 18 }, { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(workbook, sheet12, 'Caller Performance');

  // Download the workbook
  XLSX.writeFile(workbook, `Daily_Call_Center_Report_${callingDate}.xlsx`);
}
