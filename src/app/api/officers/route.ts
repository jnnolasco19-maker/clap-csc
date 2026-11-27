import { NextRequest, NextResponse } from "next/server";
import { buildAppState, readDb, writeDb } from "@/lib/store";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, officerId, note, name, roleTitle, activeStudentId } = body as {
    action: "clock_in" | "clock_out" | "add_officer";
    officerId?: string;
    note?: string;
    name?: string;
    roleTitle?: string;
    activeStudentId?: string;
  };

  const db = readDb();
  const now = new Date();
  const nowIso = now.toISOString();

  if (action === "add_officer") {
    const cleanName = String(name || "").trim();
    if (!cleanName) {
      return NextResponse.json(
        { error: "Officer name is required." },
        { status: 400 }
      );
    }
    const newOfficer = {
      id: `off-${Date.now()}`,
      name: cleanName,
      roleTitle: String(roleTitle || "CSC Officer").trim(),
    };
    db.officers.push(newOfficer);
    writeDb(db);
    return NextResponse.json({
      ...buildAppState(activeStudentId),
      addedOfficer: newOfficer,
    });
  }

  const officer = db.officers.find((o) => o.id === officerId);
  if (!officer) {
    return NextResponse.json({ error: "Officer not found." }, { status: 404 });
  }

  if (action === "clock_in") {
    const alreadyOn = db.officerShifts.find(
      (s) => s.officerId === officer.id && s.timeOut === null
    );
    if (alreadyOn) {
      return NextResponse.json(
        { error: `${officer.name} is already timed in.` },
        { status: 400 }
      );
    }
    db.officerShifts.push({
      id: `sh-${Date.now()}`,
      officerId: officer.id,
      officerName: officer.name,
      timeIn: nowIso,
      timeOut: null,
      durationMins: 0,
      note: note?.trim() || "On duty",
    });
    writeDb(db);
    return NextResponse.json(buildAppState(activeStudentId));
  }

  if (action === "clock_out") {
    const active = db.officerShifts.find(
      (s) => s.officerId === officer.id && s.timeOut === null
    );
    if (!active) {
      return NextResponse.json(
        { error: `${officer.name} is not currently timed in.` },
        { status: 400 }
      );
    }
    active.timeOut = nowIso;
    active.durationMins = Math.max(
      1,
      Math.round((now.getTime() - new Date(active.timeIn).getTime()) / 60000)
    );
    if (note?.trim()) {
      active.note = note.trim();
    }
    writeDb(db);
    return NextResponse.json(buildAppState(activeStudentId));
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
