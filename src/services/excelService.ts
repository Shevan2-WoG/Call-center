import * as XLSX from 'xlsx';
import { Contact, CallAttempt, Assignment, DailyReportSummary, CALL_OUTCOMES } from '../types';

export interface SheetParseSummary {
  sheetName: string;
  sheetIndex: number;
  totalRows: number;
  validCount: number;
  duplicateCount: number;
  invalidCount: number;
  columnsDetected: string[];
}

export interface ParseExcelResult {
  valid: (Omit<Contact, 'id' | 'createdAt' | 'status'> & { sheetName?: string })[];
  invalid: { row: number; data: any; reason: string; sheetName?: string }[];
  duplicates: { row: number; data: any; reason: string; sheetName?: string }[];
  totalRows: number;
  sheetsFound: string[];
  sheetSummaries: SheetParseSummary[];
  multiSheet: boolean;
}

/**
 * Safely converts any cell value to string, handling:
 * - null / undefined
 * - large numbers and integers without scientific notation
 * - string scientific notation (e.g. 2.56701E+11)
 * - floating point decimals (e.g. 701234567.0)
 */
export function cellToString(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) return '';
    // If integer or near-integer, format as big integer string without scientific notation
    if (Math.abs(val - Math.round(val)) < 1e-4) {
      return BigInt(Math.round(val)).toString();
    }
    return val.toLocaleString('fullwide', { useGrouping: false });
  }
  let str = String(val).trim();
  // Handle string scientific notation like "2.56701E+11" or "2.56701e11"
  if (/^[+\-]?\d+(\.\d+)?[eE][+\-]?\d+$/.test(str)) {
    const num = Number(str);
    if (!isNaN(num) && Number.isFinite(num)) {
      str = BigInt(Math.round(num)).toString();
    }
  }
  // Strip trailing .0 if present from Excel float conversion
  if (/^\d+\.0$/.test(str)) {
    str = str.replace(/\.0$/, '');
  }
  return str;
}

/**
 * Universal Phone Number Normalizer & Cleaner:
 * - Handles numeric inputs from Excel, floating points, scientific notation
 * - Strips whitespace, dashes, parentheses, dots
 * - Auto-corrects common OCR/typing errors (letter 'O' or 'o' in place of '0')
 * - Recognizes local Ugandan/East African formats:
 *     - 10 digits starting with 0: 0700000000 -> +256700000000
 *     - 9 digits starting with 7, 3, 4 (Excel stripped leading 0): 701234567 -> +256701234567
 *     - 12 digits starting with 256: 256701234567 -> +256701234567
 * - Recognizes standard international formats (+..., 00...)
 * - Extracts valid phone digits even if surrounded by text ("Airtel: 0701234567")
 * - Handles multiple numbers in one cell (takes primary, records secondary)
 * - Ultra-forgiving: Accepts any digits (>= 4) and auto-normalizes cleanly
 */
export function normalizePhoneNumber(
  rawPhone: any,
  defaultCountryCode = '256'
): { normalized: string; isValid: boolean; error?: string; secondaryPhone?: string } {
  const rawStr = cellToString(rawPhone);
  if (!rawStr) {
    return { normalized: '', isValid: false, error: 'Phone number is empty' };
  }

  // Check if multiple phone numbers exist in the string (separated by /, ,, ;, &, or, and)
  const parts = rawStr.split(/[\/,\;\&|]|\bor\b|\band\b/i).map(s => s.trim()).filter(Boolean);

  const cleanPhoneString = (input: string): string => {
    // Replace typos where letter O or o was typed instead of 0 in digit context
    let s = input.replace(/([0-9+])o([0-9])/gi, '$10$2').replace(/^o([0-9])/gi, '0$1');
    // Remove formatting characters, spaces, dots, dashes
    s = s.replace(/[\s\-\(\)\.]/g, '');
    return s;
  };

  const primaryCandidate = cleanPhoneString(parts[0] || rawStr);
  const secondaryCandidate = parts.length > 1 ? cleanPhoneString(parts[1]) : undefined;

  const processDigits = (cand: string): string => {
    let s = cand;
    if (s.startsWith('+')) {
      s = '+' + s.substring(1).replace(/\D/g, '');
    } else if (s.startsWith('00')) {
      s = '+' + s.substring(2).replace(/\D/g, '');
    } else {
      const digits = s.replace(/\D/g, '');
      // If local format like 0700000000 (10 digits starting with 0)
      if (digits.startsWith('0') && digits.length === 10) {
        s = '+' + defaultCountryCode + digits.substring(1);
      }
      // If 9 digits starting with 7, 3, 4 (Excel stripped leading 0!)
      else if (digits.length === 9 && /^[734]/.test(digits)) {
        s = '+' + defaultCountryCode + digits;
      }
      // If 12 digits starting with country code 256
      else if (digits.length === 12 && digits.startsWith('25')) {
        s = '+' + digits;
      }
      // If 10-15 digits starting with known regional country codes
      else if (digits.length >= 10 && (digits.startsWith('1') || digits.startsWith('234') || digits.startsWith('254') || digits.startsWith('255') || digits.startsWith('250') || digits.startsWith('44'))) {
        s = '+' + digits;
      }
      // If starts with 0 and 8+ digits
      else if (digits.startsWith('0') && digits.length >= 8) {
        s = '+' + defaultCountryCode + digits.substring(1);
      }
      // If 8 to 15 digits
      else if (digits.length >= 8 && digits.length <= 15) {
        s = '+' + (digits.startsWith(defaultCountryCode) ? digits : defaultCountryCode + digits);
      }
      // Forgiving fallback for shorter local numbers / landlines (4+ digits)
      else if (digits.length >= 4) {
        s = '+' + (digits.startsWith(defaultCountryCode) ? digits : defaultCountryCode + digits);
      } else {
        s = digits;
      }
    }
    return s;
  };

  let normalizedPrimary = processDigits(primaryCandidate);
  const normalizedSecondary = secondaryCandidate ? processDigits(secondaryCandidate) : undefined;

  // If normalizedPrimary still lacks digits, search for any digit sequence in rawStr
  if (normalizedPrimary.replace(/\D/g, '').length < 4) {
    const match = rawStr.match(/\d{4,15}/);
    if (match) {
      normalizedPrimary = processDigits(match[0]);
    }
  }

  const digitCount = normalizedPrimary.replace(/\D/g, '').length;
  if (digitCount < 4) {
    return {
      normalized: normalizedPrimary,
      isValid: false,
      error: 'Phone number has insufficient digits',
    };
  }

  return {
    normalized: normalizedPrimary,
    isValid: true,
    secondaryPhone: normalizedSecondary,
  };
}

/**
 * Universal Intelligent Contact Excel Parser:
 * - Scans all sheets to find data
 * - Auto-detects header row (row 1..15) or operates completely headerless
 * - Handles ANY column naming variation or casing (Name, Full Name, Client, FName+LName, Tel, Mobile, etc.)
 * - Auto-detects columns by content frequency if headers are missing or unusual
 * - Silently filters out title banners, instruction lines, page numbers, sub-headings, and empty rows
 * - Auto-generates fallback name for nameless rows (e.g. "Contact +256...")
 * - Auto-rescues phone numbers from ANY column in the row
 * - For records missing phones, auto-assigns a valid provisional ID so the sheet imports 100% cleanly without showing "invalid" errors
 * - Preserves extra columns (email, company, notes) inside contact notes
 */
// Shared Keywords definitions for intelligent column auto-detection
const matchesKeyword = (str: string, keywords: string[]): boolean => {
  const lower = str.toLowerCase().trim();
  return keywords.some(k => lower === k || lower.includes(k));
};

const NAME_KEYWORDS = [
  'full name', 'contact name', 'customer name', 'client name', 'student name', 'member name',
  'participant name', 'person name', 'lead name', 'first name', 'last name', 'surname',
  'given name', 'other name', 'names', 'name', 'nom', 'nombre', 'client', 'customer',
  'student', 'member', 'person', 'lead', 'applicant', 'patient', 'attendee', 'caller', 'user',
  'beneficiary', 'recipient', 'contact_person', 'title'
];

const PHONE_KEYWORDS = [
  'phone number', 'phone no', 'phone_no', 'phone_number', 'phonenumber', 'mobile number',
  'mobile no', 'mobile_no', 'mobile_number', 'telephone number', 'telephone no', 'tel no',
  'tel_no', 'whatsapp number', 'whatsapp no', 'contact number', 'contact no', 'cell number',
  'cell no', 'cellphone', 'cellular', 'msisdn', 'phone', 'mobile', 'telephone', 'tel',
  'cell', 'whatsapp', 'number', 'no.', 'digits', 'line', 'dial', 'calling', 'contact', 'telecom'
];

const LOCATION_KEYWORDS = [
  'location', 'district', 'city', 'town', 'address', 'region', 'area', 'village',
  'subcounty', 'country', 'place', 'residence', 'zone', 'parish', 'state', 'station', 'branch'
];

const CATEGORY_KEYWORDS = [
  'category', 'type', 'segment', 'group', 'role', 'tag', 'class', 'status',
  'grade', 'department', 'batch', 'cohort', 'tier', 'level', 'classification'
];

const NOTES_KEYWORDS = [
  'notes', 'note', 'remarks', 'remark', 'comment', 'comments', 'description',
  'details', 'info', 'reason', 'feedback', 'message', 'background', 'preference', 'extra'
];

/**
 * Parses an individual sheet from an Excel workbook with independent header & column detection
 */
function parseSingleSheet(
  sheetRows: any[][],
  sheetName: string,
  sheetIndex: number,
  fileName: string,
  existingPhones: Set<string>,
  seenInFile: Set<string>,
  isMultiSheet: boolean
): {
  valid: (Omit<Contact, 'id' | 'createdAt' | 'status'> & { sheetName?: string })[];
  invalid: { row: number; data: any; reason: string; sheetName?: string }[];
  duplicates: { row: number; data: any; reason: string; sheetName?: string }[];
  summary: SheetParseSummary;
} {
  const valid: (Omit<Contact, 'id' | 'createdAt' | 'status'> & { sheetName?: string })[] = [];
  const invalid: { row: number; data: any; reason: string; sheetName?: string }[] = [];
  const duplicates: { row: number; data: any; reason: string; sheetName?: string }[] = [];

  const nonEmptyRows = sheetRows.filter(r => r && r.some(c => cellToString(c).trim().length > 0));
  if (nonEmptyRows.length === 0) {
    return {
      valid,
      invalid,
      duplicates,
      summary: {
        sheetName,
        sheetIndex,
        totalRows: 0,
        validCount: 0,
        duplicateCount: 0,
        invalidCount: 0,
        columnsDetected: [],
      },
    };
  }

  // 1. Detect header row in this sheet by scoring top 20 rows
  let headerRowIndex = -1;
  let bestScore = 0;
  const rowsToScan = Math.min(20, sheetRows.length);

  for (let r = 0; r < rowsToScan; r++) {
    const row = sheetRows[r];
    if (!row || row.every(c => !cellToString(c))) continue;

    let rowScore = 0;
    let hasPhoneLikeNumber = false;

    row.forEach(cell => {
      const str = cellToString(cell);
      if (!str) return;
      const digitsOnly = str.replace(/\D/g, '');
      if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
        hasPhoneLikeNumber = true;
      }
      if (matchesKeyword(str, PHONE_KEYWORDS)) rowScore += 10;
      if (matchesKeyword(str, NAME_KEYWORDS)) rowScore += 10;
      if (matchesKeyword(str, LOCATION_KEYWORDS)) rowScore += 5;
      if (matchesKeyword(str, CATEGORY_KEYWORDS)) rowScore += 4;
      if (matchesKeyword(str, NOTES_KEYWORDS)) rowScore += 4;
    });

    if (hasPhoneLikeNumber) {
      rowScore -= 15;
    }

    if (rowScore > bestScore && rowScore >= 8) {
      bestScore = rowScore;
      headerRowIndex = r;
    }
  }

  // 2. Map columns for this sheet
  let nameCol = -1;
  let firstNameCol = -1;
  let lastNameCol = -1;
  let phoneCol = -1;
  let altPhoneCol = -1;
  let locationCol = -1;
  let categoryCol = -1;
  let notesCol = -1;
  const otherCols: { index: number; label: string }[] = [];
  const columnsDetected: string[] = [];

  if (headerRowIndex >= 0) {
    const headerRow = sheetRows[headerRowIndex];
    headerRow.forEach((cell, c) => {
      const label = cellToString(cell).trim();
      const lower = label.toLowerCase();
      if (!label) return;

      columnsDetected.push(label);

      if (matchesKeyword(lower, ['first name', 'fname', 'given name'])) {
        firstNameCol = c;
      } else if (matchesKeyword(lower, ['last name', 'lname', 'surname', 'second name'])) {
        lastNameCol = c;
      } else if (nameCol === -1 && matchesKeyword(lower, NAME_KEYWORDS)) {
        nameCol = c;
      } else if (matchesKeyword(lower, PHONE_KEYWORDS)) {
        if (phoneCol === -1) {
          phoneCol = c;
        } else if (altPhoneCol === -1) {
          altPhoneCol = c;
        }
      } else if (locationCol === -1 && matchesKeyword(lower, LOCATION_KEYWORDS)) {
        locationCol = c;
      } else if (categoryCol === -1 && matchesKeyword(lower, CATEGORY_KEYWORDS)) {
        categoryCol = c;
      } else if (notesCol === -1 && matchesKeyword(lower, NOTES_KEYWORDS)) {
        notesCol = c;
      } else {
        otherCols.push({ index: c, label });
      }
    });
  }

  const dataStartIndex = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;

  // Fallback: If phone column wasn't detected by header, detect by cell data frequency
  if (phoneCol === -1) {
    const colPhoneCounts = new Map<number, number>();
    for (let r = dataStartIndex; r < Math.min(dataStartIndex + 40, sheetRows.length); r++) {
      const row = sheetRows[r];
      if (!row) continue;
      row.forEach((cell, c) => {
        const str = cellToString(cell).replace(/\D/g, '');
        if (str.length >= 6 && str.length <= 15) {
          colPhoneCounts.set(c, (colPhoneCounts.get(c) || 0) + 1);
        }
      });
    }
    let maxCount = 0;
    colPhoneCounts.forEach((count, c) => {
      if (count > maxCount) {
        maxCount = count;
        phoneCol = c;
      }
    });
  }

  // Fallback: If name column wasn't detected, detect by text frequency
  if (nameCol === -1 && firstNameCol === -1) {
    const colNameCounts = new Map<number, number>();
    for (let r = dataStartIndex; r < Math.min(dataStartIndex + 40, sheetRows.length); r++) {
      const row = sheetRows[r];
      if (!row) continue;
      row.forEach((cell, c) => {
        if (c === phoneCol || c === altPhoneCol) return;
        const str = cellToString(cell).trim();
        if (/^[A-Za-z\s\.'\-]{2,45}$/.test(str) && !/total|summary|phone|tel|district|kampala/i.test(str)) {
          colNameCounts.set(c, (colNameCounts.get(c) || 0) + 1);
        }
      });
    }
    let maxCount = 0;
    colNameCounts.forEach((count, c) => {
      if (count > maxCount) {
        maxCount = count;
        nameCol = c;
      }
    });
  }

  let sheetRowsProcessed = 0;

  for (let r = dataStartIndex; r < sheetRows.length; r++) {
    const row = sheetRows[r];
    if (!row) continue;

    // Skip completely empty rows
    const isRowEmpty = row.every(cell => !cellToString(cell).trim());
    if (isRowEmpty) {
      continue;
    }

    const rowCells = row.map(cellToString).map(s => s.trim()).filter(Boolean);
    const combinedRowText = rowCells.join(' ');

    // Skip document banners, summary rows, or footers
    if (
      rowCells.length === 1 &&
      (combinedRowText.length < 3 || /total|summary|sheet|report|page|confidential|approved|date:|prepared/i.test(combinedRowText))
    ) {
      continue;
    }
    if (/^(total|grand total|subtotal|summary|count|prepared by|approved by|signature)/i.test(combinedRowText)) {
      continue;
    }

    sheetRowsProcessed++;
    const rowNumber = r + 1;

    // Extract phone
    let rawPhone = phoneCol >= 0 ? cellToString(row[phoneCol]) : '';
    let altPhone = altPhoneCol >= 0 ? cellToString(row[altPhoneCol]) : '';

    if (rawPhone.replace(/\D/g, '').length < 4) {
      for (let c = 0; c < row.length; c++) {
        if (c === nameCol || c === firstNameCol || c === lastNameCol) continue;
        const candidate = cellToString(row[c]);
        if (candidate.replace(/\D/g, '').length >= 6) {
          rawPhone = candidate;
          break;
        }
      }
    }

    let phoneRes = normalizePhoneNumber(rawPhone);
    let normalizedPhone = phoneRes.isValid ? phoneRes.normalized : '';

    if (!normalizedPhone) {
      for (let c = 0; c < row.length; c++) {
        const cellText = cellToString(row[c]);
        const match = cellText.match(/\d{4,15}/);
        if (match) {
          const fallbackNorm = normalizePhoneNumber(match[0]);
          if (fallbackNorm.isValid) {
            normalizedPhone = fallbackNorm.normalized;
            rawPhone = match[0];
            break;
          }
        }
      }
    }

    // Extract Name
    let name = '';
    if (firstNameCol >= 0 && lastNameCol >= 0) {
      const fn = cellToString(row[firstNameCol]);
      const ln = cellToString(row[lastNameCol]);
      name = `${fn} ${ln}`.trim();
    }
    if (!name && nameCol >= 0) {
      name = cellToString(row[nameCol]);
    }
    if (!name) {
      for (let c = 0; c < row.length; c++) {
        if (c === phoneCol || c === altPhoneCol || c === locationCol) continue;
        const text = cellToString(row[c]);
        if (/^[A-Za-z\s\.'\-]{2,40}$/.test(text) && !/total|summary|sheet/i.test(text)) {
          name = text;
          break;
        }
      }
    }

    // If still no phone: Assign resilient clean provisional ID with sheet identifier
    if (!normalizedPhone) {
      if (name || rowCells.length >= 2) {
        normalizedPhone = `+256-REF-S${sheetIndex}-R${rowNumber}`;
        rawPhone = 'Pending Phone Number';
        if (!name) {
          name = `Lead #${rowNumber} (${sheetName})`;
        }
      } else {
        continue;
      }
    }

    if (!name) {
      name = `Contact ${normalizedPhone}`;
    }

    // Extract Location
    let location = locationCol >= 0 ? cellToString(row[locationCol]) : '';
    if (!location) {
      location = 'Unspecified';
    }

    // Extract Category: If no explicit category column, use sheetName if it's descriptive
    let category = categoryCol >= 0 ? cellToString(row[categoryCol]) : '';
    if (!category) {
      if (sheetName && !/^sheet\d+$/i.test(sheetName.trim())) {
        category = sheetName.trim();
      } else {
        category = 'General';
      }
    }

    // Extract Notes and include sheet tag if workbook is multi-sheet
    let notes = notesCol >= 0 ? cellToString(row[notesCol]) : '';
    if (phoneRes.secondaryPhone) {
      notes = notes ? `${notes} | Alt Phone: ${phoneRes.secondaryPhone}` : `Alt Phone: ${phoneRes.secondaryPhone}`;
    } else if (altPhone && altPhone !== rawPhone) {
      notes = notes ? `${notes} | Alt Phone: ${altPhone}` : `Alt Phone: ${altPhone}`;
    }

    const extraPieces: string[] = [];
    otherCols.forEach(col => {
      const val = cellToString(row[col.index]);
      if (val && val !== name && val !== rawPhone && val !== location) {
        extraPieces.push(`${col.label}: ${val}`);
      }
    });

    if (isMultiSheet) {
      extraPieces.push(`Sheet: ${sheetName}`);
    }

    if (extraPieces.length > 0) {
      notes = notes ? `${notes} | ${extraPieces.join(' | ')}` : extraPieces.join(' | ');
    }

    // Deduplication within file across all sheets
    if (seenInFile.has(normalizedPhone)) {
      duplicates.push({
        row: rowNumber,
        sheetName,
        data: row,
        reason: `Duplicate phone number (${normalizedPhone}) in sheet "${sheetName}"`,
      });
      continue;
    }
    seenInFile.add(normalizedPhone);

    const isExistingInDb = existingPhones.has(normalizedPhone);

    valid.push({
      name: name.trim(),
      phone: String(rawPhone || normalizedPhone).trim(),
      normalizedPhone,
      location: location.trim() || 'Unspecified',
      category: category.trim() || 'General',
      notes: notes.trim() + (isExistingInDb ? (notes ? ' | [Existing Contact]' : '[Existing Contact]') : ''),
      source: fileName,
      sheetName,
    });
  }

  return {
    valid,
    invalid,
    duplicates,
    summary: {
      sheetName,
      sheetIndex,
      totalRows: sheetRowsProcessed,
      validCount: valid.length,
      duplicateCount: duplicates.length,
      invalidCount: invalid.length,
      columnsDetected,
    },
  };
}

/**
 * Universal Intelligent Multi-Sheet Contact Excel Parser:
 * - Reads ALL sheets in the uploaded workbook (whether 1, 3, 7, or more sheets)
 * - Detects independent headers & columns for each sheet separately
 * - Handles varied layouts across sheets seamlessly
 * - Aggregates all sheets into a unified import list while preserving sheet source metadata
 * - Provides per-sheet and total validation statistics
 */
export async function parseContactExcel(
  file: File,
  existingPhones: Set<string>
): Promise<ParseExcelResult> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  const sheetNames = workbook.SheetNames || [];
  if (sheetNames.length === 0) {
    return {
      valid: [],
      invalid: [],
      duplicates: [],
      totalRows: 0,
      sheetsFound: [],
      sheetSummaries: [],
      multiSheet: false,
    };
  }

  const isMultiSheet = sheetNames.length > 1;
  const allValid: (Omit<Contact, 'id' | 'createdAt' | 'status'> & { sheetName?: string })[] = [];
  const allInvalid: { row: number; data: any; reason: string; sheetName?: string }[] = [];
  const allDuplicates: { row: number; data: any; reason: string; sheetName?: string }[] = [];
  const sheetSummaries: SheetParseSummary[] = [];
  const seenInFile = new Set<string>();
  let grandTotalRows = 0;

  // Process EVERY single sheet in the workbook
  for (let s = 0; s < sheetNames.length; s++) {
    const sheetName = sheetNames[s];
    const ws = workbook.Sheets[sheetName];
    if (!ws) continue;

    const sheetRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    const sheetRes = parseSingleSheet(
      sheetRows,
      sheetName,
      s + 1,
      file.name,
      existingPhones,
      seenInFile,
      isMultiSheet
    );

    allValid.push(...sheetRes.valid);
    allInvalid.push(...sheetRes.invalid);
    allDuplicates.push(...sheetRes.duplicates);
    sheetSummaries.push(sheetRes.summary);
    grandTotalRows += sheetRes.summary.totalRows;
  }

  return {
    valid: allValid,
    invalid: allInvalid,
    duplicates: allDuplicates,
    totalRows: grandTotalRows,
    sheetsFound: sheetNames,
    sheetSummaries,
    multiSheet: isMultiSheet,
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
  XLSX.writeFile(workbook, 'KIU_Manifest_Contact_Import_Template.xlsx');
}

/**
 * Generates a realistic sample 7-sheet Excel workbook to demonstrate multi-sheet parsing
 */
export function downloadMultiSheetExcelDemo() {
  const workbook = XLSX.utils.book_new();

  const sheetsData: { name: string; rows: Record<string, string>[] }[] = [
    {
      name: 'Kampala_Campus',
      rows: [
        { 'Full Name': 'Derrick Ssebunya', 'Phone Number': '0701234101', 'Location': 'Kampala Central', 'Category': 'Undergraduate', 'Notes': 'Morning session preferred' },
        { 'Full Name': 'Rachael Nakimera', 'Phone Number': '0772345102', 'Location': 'Ntinda', 'Category': 'Postgraduate', 'Notes': 'Wants MBA course outline' },
        { 'Full Name': 'Brian Okot', 'Phone Number': '0753456103', 'Location': 'Kansanga', 'Category': 'Diploma', 'Notes': 'Inquired about hostel accommodations' },
      ],
    },
    {
      name: 'Wakiso_District',
      rows: [
        { 'Customer Name': 'Agnes Nabukenya', 'Mobile No': '0784567104', 'Town': 'Nansana', 'Role': 'Applicant', 'Remarks': 'Called via radio advertisement' },
        { 'Customer Name': 'Isaac Kato', 'Mobile No': '0705678105', 'Town': 'Kira', 'Role': 'Student', 'Remarks': 'Needs weekend class details' },
        { 'Customer Name': 'Sarah Namusisi', 'Mobile No': '0776789106', 'Town': 'Entebbe', 'Role': 'Parent', 'Remarks': 'Inquiring for son in engineering' },
      ],
    },
    {
      name: 'Jinja_Inquiries',
      rows: [
        { 'Contact Name': 'Moses Waiswa', 'Tel': '0757890107', 'District': 'Jinja', 'Type': 'Lead', 'Details': 'Interested in IT certifications' },
        { 'Contact Name': 'Fatuma Nabirye', 'Tel': '0788901108', 'District': 'Bugembe', 'Type': 'Applicant', 'Details': 'Wants tuition breakdown' },
      ],
    },
    {
      name: 'Mbarara_Hub',
      rows: [
        { 'Participant Name': 'Edison Tumuhimbise', 'Phone': '0709012109', 'City': 'Mbarara', 'Status': 'Student', 'Note': 'Nursing program applicant' },
        { 'Participant Name': 'Peace Kemigisha', 'Phone': '0770123110', 'City': 'Kashari', 'Status': 'Visitor', 'Note': 'Follow-up requested on Monday' },
      ],
    },
    {
      name: 'Gulu_Regional',
      rows: [
        { 'Client': 'Denis Opiyo', 'Telephone': '0781234111', 'Area': 'Gulu City', 'Group': 'Student', 'Comment': 'Agriculture degree interest' },
        { 'Client': 'Lucy Auma', 'Telephone': '0752345112', 'Area': 'Layibi', 'Group': 'Scholarship', 'Comment': 'Seeking merit scholarship guidance' },
      ],
    },
    {
      name: 'Corporate_Leads',
      rows: [
        { 'Contact Person': 'Charles Mukasa', 'Office Line': '0703456113', 'Station': 'Industrial Area', 'Department': 'Corporate HR', 'Info': 'Executive training for 15 staff members' },
        { 'Contact Person': 'Brenda Atuhaire', 'Office Line': '0774567114', 'Station': 'Kololo', 'Department': 'Finance', 'Info': 'Custom data science boot camp' },
      ],
    },
    {
      name: 'Alumni_Referrals',
      rows: [
        { 'Candidate': 'Samuel Baguma', 'Cell': '0785678115', 'Region': 'Fort Portal', 'Cohort': 'Referral', 'Extra': 'Referred by Eng. Kenneth (Class of 2022)' },
        { 'Candidate': 'Christine Akello', 'Cell': '0706789116', 'Region': 'Soroti', 'Cohort': 'Referral', 'Extra': 'Recommended by Dr. Betty' },
      ],
    },
  ];

  sheetsData.forEach((sheet) => {
    const ws = XLSX.utils.json_to_sheet(sheet.rows);
    ws['!cols'] = [{ wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 38 }];
    XLSX.utils.book_append_sheet(workbook, ws, sheet.name);
  });

  XLSX.writeFile(workbook, 'KIU_7_Sheets_MultiSheet_Demo.xlsx');
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
    { 'Metric': 'System Owner', 'Value': 'Muhindo' },
    { 'Metric': 'Developed By', 'Value': 'Arnible' },
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
  XLSX.writeFile(workbook, `KIU_Manifest_Call_Center_Daily_Report_${callingDate}.xlsx`);
}
