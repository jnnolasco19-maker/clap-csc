import { NextRequest, NextResponse } from "next/server";
import { buildAppState, readDb, writeDb } from "@/lib/store";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body as { action: string };
  const db = readDb();
  const now = new Date();
  const nowIso = now.toISOString();

  if (action === "create") {
    const {
      title,
      venue,
      attendanceStart,
      attendanceEnd,
      gracePeriodMins,
      absentFine,
      lateFine,
      activeStudentId,
    } = body;

    if (!title || !attendanceStart || !attendanceEnd) {
      return NextResponse.json(
        { error: "Title, start time, and end time are required." },
        { status: 400 }
      );
    }

    db.events.unshift({
      id: `evt-${Date.now()}`,
      title: String(title).trim(),
      venue: String(venue || "Campus Venue").trim(),
      attendanceStart: new Date(attendanceStart).toISOString(),
      attendanceEnd: new Date(attendanceEnd).toISOString(),
      gracePeriodMins: Number(gracePeriodMins ?? 15),
      absentFine: Number(absentFine ?? 50),
      lateFine: Number(lateFine ?? 20),
      finesGenerated: false,
      createdAt: nowIso,
    });
    writeDb(db);
    return NextResponse.json(buildAppState(activeStudentId));
  }

  if (action === "checkin") {
    const { eventId, studentNumberOrId, activeStudentId } = body as {
      eventId: string;
      studentNumberOrId: string;
      activeStudentId?: string;
    };

    const event = db.events.find((e) => e.id === eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const query = String(studentNumberOrId || "").trim().toLowerCase();
    const student = db.students.find(
      (s) =>
        s.id.toLowerCase() === query ||
        s.studentId.toLowerCase() === query ||
        s.fullName.toLowerCase().includes(query)
    );

    if (!student) {
      return NextResponse.json(
        { error: `Student "${studentNumberOrId}" not found.` },
        { status: 404 }
      );
    }

    const startMs = new Date(event.attendanceStart).getTime();
    const endMs = new Date(event.attendanceEnd).getTime();
    const graceMs = event.gracePeriodMins * 60 * 1000;
    const nowMs = now.getTime();

    if (nowMs < startMs) {
      return NextResponse.json(
        { error: "Attendance window has not started yet." },
        { status: 400 }
      );
    }
    if (nowMs > endMs) {
      return NextResponse.json(
        { error: "Attendance window has already ended." },
        { status: 400 }
      );
    }

    const already = db.attendance.find(
      (a) => a.eventId === event.id && a.studentId === student.id
    );
    if (already) {
      return NextResponse.json(
        {
          error: `${student.fullName} is already marked ${already.status.toUpperCase()}.`,
        },
        { status: 400 }
      );
    }

    const isLate = nowMs > startMs + graceMs;
    const status = isLate ? "late" : "present";
    const attId = `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    db.attendance.push({
      id: attId,
      eventId: event.id,
      studentId: student.id,
      status,
      checkedInAt: nowIso,
    });

    if (isLate && event.lateFine > 0) {
      db.fines.push({
        id: `fine-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        studentId: student.id,
        eventId: event.id,
        attendanceId: attId,
        amount: event.lateFine,
        reason: `Late: ${event.title}`,
        status: "unpaid",
        receiptNo: null,
        settledAt: null,
        createdAt: nowIso,
      });
    }

    writeDb(db);
    return NextResponse.json({
      ...buildAppState(activeStudentId),
      checkedInStudent: student.fullName,
      checkedInStatus: status,
    });
  }

  if (action === "finalize") {
    const { eventId, activeStudentId } = body as {
      eventId: string;
      activeStudentId?: string;
    };
    const event = db.events.find((e) => e.id === eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }
    if (event.finesGenerated) {
      return NextResponse.json(
        { error: "Absences and fines already finalized for this event." },
        { status: 400 }
      );
    }

    // Close the window if still open so it's clearly finalized
    if (new Date(event.attendanceEnd).getTime() > now.getTime()) {
      event.attendanceEnd = nowIso;
    }

    let absentCount = 0;
    for (const student of db.students) {
      const hasRecord = db.attendance.some(
        (a) => a.eventId === event.id && a.studentId === student.id
      );
      if (!hasRecord) {
        absentCount += 1;
        const attId = `att-${Date.now()}-${student.id}`;
        db.attendance.push({
          id: attId,
          eventId: event.id,
          studentId: student.id,
          status: "absent",
          checkedInAt: null,
          remarks: "Auto-marked absent when attendance window closed",
        });

        if (event.absentFine > 0) {
          db.fines.push({
            id: `fine-${Date.now()}-${student.id}`,
            studentId: student.id,
            eventId: event.id,
            attendanceId: attId,
            amount: event.absentFine,
            reason: `Absent: ${event.title}`,
            status: "unpaid",
            receiptNo: null,
            settledAt: null,
            createdAt: nowIso,
          });
        }
      }
    }

    event.finesGenerated = true;
    writeDb(db);
    return NextResponse.json({
      ...buildAppState(activeStudentId),
      absentCount,
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
