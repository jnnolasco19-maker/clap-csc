import fs from "fs";
import path from "path";
import type {
  AppStateResponse,
  DatabaseState,
  EnrichedTicket,
  EventItem,
  StudentClearanceSummary,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "clap-db.json");

function createSeedData(): DatabaseState {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  const min = 60 * 1000;

  const students = [
    {
      id: "stu-1",
      studentId: "2211600004",
      fullName: "Dela Cruz, Juan",
      course: "BSIT",
      yearSection: "3-A",
      isParticipant: false,
      participantNote: "",
    },
    {
      id: "stu-2",
      studentId: "2211600012",
      fullName: "Santos, Maria",
      course: "BSCS",
      yearSection: "2-B",
      isParticipant: true,
      participantNote: "Palaro - Bench Yell Competition",
    },
    {
      id: "stu-3",
      studentId: "2211600025",
      fullName: "Mendoza, Carlo",
      course: "BSCE",
      yearSection: "3-A",
      isParticipant: false,
      participantNote: "",
    },
    {
      id: "stu-4",
      studentId: "2211600031",
      fullName: "Alonzo, Bea",
      course: "BSIT",
      yearSection: "4-A",
      isParticipant: false,
      participantNote: "",
    },
    {
      id: "stu-5",
      studentId: "2211600048",
      fullName: "Reyes, Rafael",
      course: "BSCE",
      yearSection: "2-A",
      isParticipant: false,
      participantNote: "",
    },
    {
      id: "stu-6",
      studentId: "2211600059",
      fullName: "Garcia, Alyssa",
      course: "BSCS",
      yearSection: "1-A",
      isParticipant: false,
      participantNote: "",
    },
  ];

  const events: EventItem[] = [
    {
      id: "evt-1",
      title: "CET General Assembly",
      venue: "University Gymnasium",
      attendanceStart: new Date(now - 72 * hour).toISOString(),
      attendanceEnd: new Date(now - 70 * hour).toISOString(),
      gracePeriodMins: 15,
      absentFine: 50,
      lateFine: 20,
      finesGenerated: true,
      createdAt: new Date(now - 96 * hour).toISOString(),
    },
    {
      id: "evt-2",
      title: "Palaro & Bench Yell Competition",
      venue: "Campus Grounds",
      attendanceStart: new Date(now - 30 * min).toISOString(),
      attendanceEnd: new Date(now + 90 * min).toISOString(),
      gracePeriodMins: 15,
      absentFine: 75,
      lateFine: 25,
      finesGenerated: false,
      createdAt: new Date(now - 24 * hour).toISOString(),
    },
    {
      id: "evt-3",
      title: "Engineering & Tech Week Opening",
      venue: "AVR / Main Auditorium",
      attendanceStart: new Date(now + 48 * hour).toISOString(),
      attendanceEnd: new Date(now + 50 * hour).toISOString(),
      gracePeriodMins: 20,
      absentFine: 100,
      lateFine: 30,
      finesGenerated: false,
      createdAt: new Date(now - 12 * hour).toISOString(),
    },
  ];

  const attendance = [
    {
      id: "att-1",
      eventId: "evt-1",
      studentId: "stu-1",
      status: "absent" as const,
      checkedInAt: null,
      remarks: "Auto-marked absent after window closed",
    },
    {
      id: "att-2",
      eventId: "evt-1",
      studentId: "stu-2",
      status: "excused" as const,
      checkedInAt: null,
      remarks: "Exempted: Palaro - Bench Yell Competition",
    },
    {
      id: "att-3",
      eventId: "evt-1",
      studentId: "stu-3",
      status: "late" as const,
      checkedInAt: new Date(now - 71.4 * hour).toISOString(),
    },
    {
      id: "att-4",
      eventId: "evt-1",
      studentId: "stu-4",
      status: "present" as const,
      checkedInAt: new Date(now - 71.8 * hour).toISOString(),
    },
    {
      id: "att-5",
      eventId: "evt-1",
      studentId: "stu-5",
      status: "absent" as const,
      checkedInAt: null,
      remarks: "Auto-marked absent after window closed",
    },
    {
      id: "att-6",
      eventId: "evt-1",
      studentId: "stu-6",
      status: "absent" as const,
      checkedInAt: null,
      remarks: "Auto-marked absent after window closed",
    },
  ];

  const fines = [
    {
      id: "fine-1",
      studentId: "stu-1",
      eventId: "evt-1",
      attendanceId: "att-1",
      amount: 50,
      reason: "Absent: CET General Assembly",
      status: "unpaid" as const,
      settlementType: null,
      settlementItem: null,
      settledBy: null,
      receiptNo: null,
      settledAt: null,
      createdAt: new Date(now - 70 * hour).toISOString(),
    },
    {
      id: "fine-2",
      studentId: "stu-3",
      eventId: "evt-1",
      attendanceId: "att-3",
      amount: 20,
      reason: "Late: CET General Assembly",
      status: "paid" as const,
      settlementType: "item" as const,
      settlementItem: "1x Whiteboard Eraser",
      settledBy: "Officer Bautista",
      receiptNo: "CLAP-1001",
      settledAt: new Date(now - 24 * hour).toISOString(),
      createdAt: new Date(now - 70 * hour).toISOString(),
    },
    {
      id: "fine-3",
      studentId: "stu-5",
      eventId: "evt-1",
      attendanceId: "att-5",
      amount: 50,
      reason: "Absent: CET General Assembly",
      status: "unpaid" as const,
      settlementType: null,
      settlementItem: null,
      settledBy: null,
      receiptNo: null,
      settledAt: null,
      createdAt: new Date(now - 70 * hour).toISOString(),
    },
    {
      id: "fine-4",
      studentId: "stu-6",
      eventId: "evt-1",
      attendanceId: "att-6",
      amount: 50,
      reason: "Absent: CET General Assembly",
      status: "unpaid" as const,
      settlementType: null,
      settlementItem: null,
      settledBy: null,
      receiptNo: null,
      settledAt: null,
      createdAt: new Date(now - 70 * hour).toISOString(),
    },
  ];

  const queueSession = {
    id: "qs-1",
    name: "CET 1st Sem Clearance — Day 1",
    isOpen: true,
    chairCapacity: 5,
    lastTicketNumber: 7,
    currentServingNumber: 4,
    avgServiceMins: 3,
  };

  const queueTickets = [
    {
      id: "qt-2",
      sessionId: "qs-1",
      studentId: "stu-4",
      ticketNumber: 2,
      status: "completed" as const,
      counterLabel: "Chair 1",
      handledBy: "Officer Bautista",
      actionNote: "Cleared (No unpaid fines)",
      calledAt: new Date(now - 20 * min).toISOString(),
      completedAt: new Date(now - 16 * min).toISOString(),
      createdAt: new Date(now - 35 * min).toISOString(),
    },
    {
      id: "qt-3",
      sessionId: "qs-1",
      studentId: "stu-3",
      ticketNumber: 3,
      status: "completed" as const,
      counterLabel: "Chair 2",
      handledBy: "Officer Bautista",
      actionNote: "Submitted 1x Whiteboard Eraser — Cleared",
      calledAt: new Date(now - 15 * min).toISOString(),
      completedAt: new Date(now - 11 * min).toISOString(),
      createdAt: new Date(now - 30 * min).toISOString(),
    },
    {
      id: "qt-4",
      sessionId: "qs-1",
      studentId: "stu-2",
      ticketNumber: 4,
      status: "called" as const,
      counterLabel: "Chair 1",
      handledBy: null,
      actionNote: null,
      calledAt: new Date(now - 2 * min).toISOString(),
      completedAt: null,
      createdAt: new Date(now - 20 * min).toISOString(),
    },
    {
      id: "qt-5",
      sessionId: "qs-1",
      studentId: "stu-5",
      ticketNumber: 5,
      status: "called" as const,
      counterLabel: "Chair 2",
      handledBy: null,
      actionNote: null,
      calledAt: new Date(now - 2 * min).toISOString(),
      completedAt: null,
      createdAt: new Date(now - 18 * min).toISOString(),
    },
    {
      id: "qt-6",
      sessionId: "qs-1",
      studentId: "stu-6",
      ticketNumber: 6,
      status: "waiting" as const,
      counterLabel: null,
      handledBy: null,
      actionNote: null,
      calledAt: null,
      completedAt: null,
      createdAt: new Date(now - 10 * min).toISOString(),
    },
    {
      id: "qt-7",
      sessionId: "qs-1",
      studentId: "stu-1",
      ticketNumber: 7,
      status: "waiting" as const,
      counterLabel: null,
      handledBy: null,
      actionNote: null,
      calledAt: null,
      completedAt: null,
      createdAt: new Date(now - 8 * min).toISOString(),
    },
  ];

  const officers = [
    {
      id: "off-1",
      name: "Officer Bautista",
      roleTitle: "Queue & Clearance Officer",
    },
    {
      id: "off-2",
      name: "Officer Reyes",
      roleTitle: "Treasurer / Fines Collector",
    },
    {
      id: "off-3",
      name: "Officer Cruz",
      roleTitle: "Attendance Scanner",
    },
    {
      id: "off-4",
      name: "Officer Lim",
      roleTitle: "CSC Secretary",
    },
  ];

  const day = 24 * hour;
  const officerShifts = [
    {
      id: "sh-1",
      officerId: "off-1",
      officerName: "Officer Bautista",
      timeIn: new Date(now - 3.5 * hour).toISOString(),
      timeOut: new Date(now - 0.5 * hour).toISOString(),
      durationMins: 180,
      note: "Morning clearance shift",
    },
    {
      id: "sh-1b",
      officerId: "off-1",
      officerName: "Officer Bautista",
      timeIn: new Date(now - 7 * day - 2 * hour).toISOString(),
      timeOut: new Date(now - 7 * day).toISOString(),
      durationMins: 120,
      note: "Last week clearance prep",
    },
    {
      id: "sh-1c",
      officerId: "off-1",
      officerName: "Officer Bautista",
      timeIn: new Date(now - 14 * day - 4 * hour).toISOString(),
      timeOut: new Date(now - 14 * day).toISOString(),
      durationMins: 240,
      note: "General Assembly booth",
    },
    {
      id: "sh-2",
      officerId: "off-2",
      officerName: "Officer Reyes",
      timeIn: new Date(now - 2.5 * hour).toISOString(),
      timeOut: new Date(now - 0.5 * hour).toISOString(),
      durationMins: 120,
      note: "Fines & item collection desk",
    },
    {
      id: "sh-2b",
      officerId: "off-2",
      officerName: "Officer Reyes",
      timeIn: new Date(now - 10 * day - 3 * hour).toISOString(),
      timeOut: new Date(now - 10 * day).toISOString(),
      durationMins: 180,
      note: "Treasury audit",
    },
    {
      id: "sh-3",
      officerId: "off-3",
      officerName: "Officer Cruz",
      timeIn: new Date(now - 1 * hour).toISOString(),
      timeOut: new Date(now - 0.5 * hour).toISOString(),
      durationMins: 30,
      note: "Event gate check-in",
    },
  ];

  return {
    students,
    officers,
    officerShifts,
    events,
    attendance,
    fines,
    queueSession,
    queueTickets,
  };
}

/** Reads the persistent JSON database, resetting/migrating if old seed format is detected. */
export function readDb(): DatabaseState {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const seed = createSeedData();
    fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2), "utf-8");
    return seed;
  }
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  const parsed = JSON.parse(raw) as DatabaseState;
  if (!parsed.officers || parsed.officers.length === 0) {
    const seed = createSeedData();
    parsed.officers = seed.officers;
  }
  if (!parsed.officerShifts) {
    parsed.officerShifts = createSeedData().officerShifts;
  }
  // Ensure new fields exist if upgrading from earlier prototype DB
  if (typeof parsed.queueSession.chairCapacity !== "number") {
    parsed.queueSession.chairCapacity = 5;
  }
  for (const s of parsed.students) {
    const legacy = s as unknown as {
      course?: string;
      yearSection?: string;
      courseYearSection?: string;
    };
    if (!legacy.course) {
      const parts = (legacy.courseYearSection ?? "BSIT 3-A").split(" ");
      legacy.course = parts[0] || "BSIT";
      legacy.yearSection = parts[1] || "3-A";
    }
  }
  return parsed;
}

/** Writes the updated database state to disk. */
export function writeDb(state: DatabaseState): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2), "utf-8");
}

/** Builds the enriched state payload for a given student ID. */
export function buildAppState(studentIdParam?: string | null): AppStateResponse {
  const db = readDb();
  const activeStudent =
    db.students.find((s) => s.id === studentIdParam) ?? db.students[0];

  const studentMap = new Map(db.students.map((s) => [s.id, s]));
  const eventMap = new Map(db.events.map((e) => [e.id, e]));

  const enrichTicket = (t: (typeof db.queueTickets)[number]): EnrichedTicket => {
    const stu = studentMap.get(t.studentId);
    return {
      ...t,
      studentName: stu?.fullName ?? "Unknown Student",
      studentNumber: stu?.studentId ?? "N/A",
      course: stu?.course ?? "",
      yearSection: stu?.yearSection ?? "",
    };
  };

  const liveTickets = db.queueTickets
    .filter((t) => t.status === "called" || t.status === "waiting")
    .sort((a, b) => a.ticketNumber - b.ticketNumber)
    .map(enrichTicket);

  const historyTickets = db.queueTickets
    .filter((t) => t.status === "completed" || t.status === "no_show")
    .sort(
      (a, b) =>
        new Date(b.completedAt ?? b.createdAt).getTime() -
        new Date(a.completedAt ?? a.createdAt).getTime()
    )
    .map(enrichTicket);

  const myTicket =
    liveTickets.find((t) => t.studentId === activeStudent.id) ?? null;

  const myHistoryTickets = historyTickets.filter(
    (t) => t.studentId === activeStudent.id
  );

  const aheadCount = myTicket
    ? liveTickets.filter(
        (t) => t.status === "waiting" && t.ticketNumber < myTicket.ticketNumber
      ).length
    : 0;

  const capacity = Math.max(1, db.queueSession.chairCapacity || 1);
  const estimatedWaitMins =
    myTicket?.status === "called"
      ? 0
      : Math.ceil(aheadCount / capacity) * db.queueSession.avgServiceMins;

  const studentAttendance = db.attendance
    .filter((a) => a.studentId === activeStudent.id)
    .map((a) => {
      const evt = eventMap.get(a.eventId);
      return {
        ...a,
        eventTitle: evt?.title ?? "Deleted Event",
        eventStart: evt?.attendanceStart ?? "",
        eventEnd: evt?.attendanceEnd ?? "",
        venue: evt?.venue ?? "",
      };
    });

  const studentFines = db.fines.filter((f) => f.studentId === activeStudent.id);
  const totalUnpaidFines = studentFines
    .filter((f) => f.status === "unpaid")
    .reduce((sum, f) => sum + f.amount, 0);

  const allFines = db.fines.map((f) => {
    const stu = studentMap.get(f.studentId);
    return {
      ...f,
      studentName: stu?.fullName ?? "Unknown",
      studentNumber: stu?.studentId ?? "N/A",
      course: stu?.course ?? "",
    };
  });

  const studentSummaries: StudentClearanceSummary[] = db.students.map((stu) => {
    const stuFines = db.fines.filter((f) => f.studentId === stu.id);
    const unpaidTotal = stuFines
      .filter((f) => f.status === "unpaid")
      .reduce((sum, f) => sum + f.amount, 0);
    const settled = stuFines
      .filter((f) => f.status !== "unpaid")
      .sort(
        (a, b) =>
          new Date(b.settledAt ?? 0).getTime() -
          new Date(a.settledAt ?? 0).getTime()
      )[0];

    let lastSettlementSummary = "No fines";
    if (stu.isParticipant) {
      lastSettlementSummary = `Exempted (${stu.participantNote || "Participant"})`;
    } else if (unpaidTotal > 0) {
      lastSettlementSummary = `Unpaid: ₱${unpaidTotal}`;
    } else if (settled) {
      lastSettlementSummary =
        settled.settlementItem ??
        (settled.status === "exempted" ? "Exempted" : `Paid ₱${settled.amount}`);
    }

    return {
      student: stu,
      unpaidTotal,
      isCleared: unpaidTotal === 0,
      fines: stuFines,
      lastSettlementSummary,
      lastHandledBy: settled?.settledBy ?? "",
      lastSettledAt: settled?.settledAt ?? "",
    };
  });

  const officerWorkSummaries = db.officers
    .map((officer) => {
      const shifts = db.officerShifts.filter((s) => s.officerId === officer.id);
      const activeShift = shifts.find((s) => s.timeOut === null) ?? null;
      const completedMins = shifts.reduce(
        (sum, s) => sum + (s.timeOut ? s.durationMins : 0),
        0
      );
      const liveMins = activeShift
        ? Math.max(
            0,
            Math.round(
              (Date.now() - new Date(activeShift.timeIn).getTime()) / 60000
            )
          )
        : 0;

      const finesHandledCount = db.fines.filter(
        (f) => f.settledBy === officer.name
      ).length;
      const ticketsHandledCount = db.queueTickets.filter(
        (t) => t.handledBy === officer.name
      ).length;

      return {
        officer,
        isOnDuty: Boolean(activeShift),
        activeShift,
        totalMinutes: completedMins + liveMins,
        shiftsCount: shifts.length,
        finesHandledCount,
        ticketsHandledCount,
      };
    });

  const sortedShifts = [...db.officerShifts].sort(
    (a, b) => new Date(b.timeIn).getTime() - new Date(a.timeIn).getTime()
  );

  return {
    students: db.students,
    officers: db.officers,
    officerShifts: sortedShifts,
    officerWorkSummaries,
    activeStudent,
    events: db.events,
    studentAttendance,
    allAttendance: db.attendance,
    studentFines,
    allFines,
    studentSummaries,
    totalUnpaidFines,
    isCleared: totalUnpaidFines === 0,
    queueSession: db.queueSession,
    liveTickets,
    historyTickets,
    myTicket,
    myHistoryTickets,
    aheadCount,
    estimatedWaitMins,
    serverTime: new Date().toISOString(),
  };
}
