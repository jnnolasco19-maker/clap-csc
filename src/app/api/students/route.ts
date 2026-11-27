import { NextRequest, NextResponse } from "next/server";
import { buildAppState, readDb, writeDb } from "@/lib/store";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    action,
    targetStudentId,
    isParticipant,
    participantNote,
    handledBy,
    activeStudentId,
  } = body as {
    action: "set_participant";
    targetStudentId: string;
    isParticipant: boolean;
    participantNote?: string;
    handledBy?: string;
    activeStudentId?: string;
  };

  if (action !== "set_participant") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const db = readDb();
  const student = db.students.find((s) => s.id === targetStudentId);
  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const officer = handledBy?.trim() || "CSC Officer";
  const note = participantNote?.trim() || "Event Participant";
  const nowIso = new Date().toISOString();

  student.isParticipant = isParticipant;
  student.participantNote = isParticipant ? note : "";

  if (isParticipant) {
    // Automatically exempt any unpaid fines for this participant
    for (const fine of db.fines) {
      if (fine.studentId === student.id && fine.status === "unpaid") {
        fine.status = "exempted";
        fine.settlementType = "exempted";
        fine.settlementItem = `Exempted: ${note}`;
        fine.settledBy = officer;
        fine.settledAt = nowIso;
        fine.receiptNo = "EXEMPTED";
      }
    }
  }

  writeDb(db);
  return NextResponse.json(buildAppState(activeStudentId));
}
