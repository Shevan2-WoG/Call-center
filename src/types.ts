export type UserRole = 'admin' | 'caller' | 'tech_lead';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

export type ContactStatus = 'unassigned' | 'assigned' | 'completed' | 'pending';

export interface Contact {
  id: string;
  name: string;
  phone: string;
  normalizedPhone: string;
  location?: string;
  category?: string;
  notes?: string;
  source?: string;
  status: ContactStatus;
  createdAt: string;
  updatedAt?: string;
}

export type AvailabilityStatus = 'available' | 'unavailable' | 'busy';

export interface Caller {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  whatsappNumber: string;
  availabilityStatus: AvailabilityStatus;
  teamGroup?: string;
  targetCalls?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface DailyTeam {
  id: string;
  callingDate: string; // YYYY-MM-DD
  createdBy: string;
  status: 'draft' | 'active' | 'completed';
  totalContacts: number;
  totalAssigned: number;
  createdAt: string;
}

export interface DailyTeamMember {
  id: string;
  teamId: string;
  callerId: string;
  callerName: string;
  whatsappNumber: string;
  status: AvailabilityStatus;
  assignedCount: number;
  completedCount: number;
  pendingCount: number;
  joinedAt: string;
}

export type AssignmentStatus =
  | 'Assigned'
  | 'In Progress'
  | 'Completed'
  | 'Pending'
  | 'Reassigned'
  | 'Cancelled';

export interface ReassignmentHistoryItem {
  fromCallerId: string;
  fromCallerName: string;
  toCallerId: string;
  toCallerName: string;
  reason: string;
  reassignedAt: string;
}

export interface Assignment {
  id: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  contactLocation?: string;
  contactCategory?: string;
  contactNotes?: string;
  callerId: string;
  callerName: string;
  teamId: string;
  callingDate: string;
  status: AssignmentStatus;
  originalCallerId: string;
  currentCallerId: string;
  reassignmentHistory?: ReassignmentHistoryItem[];
  assignedAt: string;
  completedAt?: string;
  lastOutcome?: string;
}

export type CallOutcome =
  | 'Available'
  | 'Unavailable'
  | 'Recall'
  | 'Phone Off'
  | 'No Answer'
  | 'Busy'
  | 'Not Interested'
  | 'Wrong Number'
  | 'Already Registered'
  | 'Interested'
  | 'Follow-up Required'
  | 'Other';

export const CALL_OUTCOMES: CallOutcome[] = [
  'Available',
  'Unavailable',
  'Recall',
  'Phone Off',
  'No Answer',
  'Busy',
  'Not Interested',
  'Wrong Number',
  'Already Registered',
  'Interested',
  'Follow-up Required',
  'Other',
];

export interface CallAttempt {
  id: string;
  contactId: string;
  callerId: string;
  callerName: string;
  assignmentId?: string;
  outcome: CallOutcome;
  comment?: string;
  followUpDate?: string;
  preferredCallbackTime?: string;
  additionalNotes?: string;
  calledAt: string;
}

export interface ReassignmentRecord {
  id: string;
  assignmentId: string;
  contactId: string;
  fromCallerId: string;
  fromCallerName: string;
  toCallerId: string;
  toCallerName: string;
  reason: string;
  reassignedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface DailyReportSummary {
  callingDate: string;
  totalContacts: number;
  totalAssigned: number;
  callsAttempted: number;
  completed: number;
  pending: number;
  outcomeCounts: Record<CallOutcome, number>;
  callerPerformance: {
    callerId: string;
    callerName: string;
    whatsappNumber: string;
    assigned: number;
    completed: number;
    pending: number;
    callsCount: number;
    completionRate: number;
  }[];
}
