export type Role = "student" | "officer";

export type AttendanceStatus = "present" | "late" | "absent" | "excused";

export type FineStatus = "unpaid" | "paid" | "waived" | "exempted";

export type SettlementType = "cash" | "item" | "exempted";

export type TicketStatus =
  | "waiting"
  | "called"
  | "completed"
  | "no_show"
  | "cancelled";

export interface StudentProfile {
  id: string;
  studentId: string; // e.g. "2211600004"
  fullName: string;  // e.g. "Dela Cruz, Juan"
  course: "BSIT" | "BSCS" | "BSCE" | string;
  yearSection: string; // e.g. "3-A"
  isParticipant?: boolean;
  participantNote?: string; // e.g. "Palaro - Bench Yell Competition"
}

export interface EventItem {
  id: string;
  title: string;
  venue: string;
  attendanceStart: string;
  attendanceEnd: string;
  gracePeriodMins: number;
  absentFine: number;
  lateFine: number;
  finesGenerated: boolean;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  eventId: string;
  studentId: string;
  status: AttendanceStatus;
  checkedInAt: string | null;
  remarks?: string;
}

export interface FineRecord {
  id: string;
  studentId: string;
  eventId: string | null;
  attendanceId: string | null;
  amount: number;
  reason: string;
  status: FineStatus;
  settlementType?: SettlementType | null;
  settlementItem?: string | null;
  settledBy?: string | null;
  receiptNo: string | null;
  settledAt: string | null;
  createdAt: string;
}

export interface QueueSession {
  id: string;
  name: string;
  isOpen: boolean;
  chairCapacity: number;
  lastTicketNumber: number;
  currentServingNumber: number;
  avgServiceMins: number;
}

export interface QueueTicket {
  id: string;
  sessionId: string;
  studentId: string;
  ticketNumber: number;
  status: TicketStatus;
  counterLabel: string | null;
  handledBy?: string | null;
  actionNote?: string | null;
  calledAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface StudentClearanceSummary {
  student: StudentProfile;
  unpaidTotal: number;
  isCleared: boolean;
  fines: FineRecord[];
  lastSettlementSummary: string;
  lastHandledBy: string;
  lastSettledAt: string;
}

export interface OfficerProfile {
  id: string;
  name: string;
  roleTitle: string; // e.g. "Treasurer / Fines Collector", "Queue Officer"
}

export interface OfficerShift {
  id: string;
  officerId: string;
  officerName: string;
  timeIn: string;
  timeOut: string | null;
  durationMins: number;
  note?: string;
}

export interface OfficerWorkSummary {
  officer: OfficerProfile;
  isOnDuty: boolean;
  activeShift: OfficerShift | null;
  totalMinutes: number;
  shiftsCount: number;
  finesHandledCount: number;
  ticketsHandledCount: number;
}

export interface DatabaseState {
  students: StudentProfile[];
  officers: OfficerProfile[];
  officerShifts: OfficerShift[];
  events: EventItem[];
  attendance: AttendanceRecord[];
  fines: FineRecord[];
  queueSession: QueueSession;
  queueTickets: QueueTicket[];
}

export interface EnrichedTicket extends QueueTicket {
  studentName: string;
  studentNumber: string;
  course: string;
  yearSection: string;
}

export interface EnrichedAttendance extends AttendanceRecord {
  eventTitle: string;
  eventStart: string;
  eventEnd: string;
  venue: string;
}

export interface StudentClearanceSummary {
  student: StudentProfile;
  unpaidTotal: number;
  isCleared: boolean;
  fines: FineRecord[];
  lastSettlementSummary: string;
  lastHandledBy: string;
  lastSettledAt: string;
}

export interface AppStateResponse {
  students: StudentProfile[];
  officers: OfficerProfile[];
  officerShifts: OfficerShift[];
  officerWorkSummaries: OfficerWorkSummary[];
  activeStudent: StudentProfile;
  events: EventItem[];
  studentAttendance: EnrichedAttendance[];
  allAttendance: AttendanceRecord[];
  studentFines: FineRecord[];
  allFines: (FineRecord & {
    studentName: string;
    studentNumber: string;
    course: string;
  })[];
  studentSummaries: StudentClearanceSummary[];
  totalUnpaidFines: number;
  isCleared: boolean;
  queueSession: QueueSession;
  liveTickets: EnrichedTicket[];
  historyTickets: EnrichedTicket[];
  myTicket: EnrichedTicket | null;
  myHistoryTickets: EnrichedTicket[];
  aheadCount: number;
  estimatedWaitMins: number;
  serverTime: string;
}
