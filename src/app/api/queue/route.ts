import { NextRequest, NextResponse } from "next/server";
import { buildAppState, readDb, writeDb } from "@/lib/store";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    action,
    studentId,
    ticketId,
    chairCapacity,
    handledBy,
    actionNote,
    mode,
  } = body as {
    action: string;
    studentId?: string;
    ticketId?: string;
    chairCapacity?: number;
    handledBy?: string;
    actionNote?: string;
    mode?: "single" | "fill";
  };

  const db = readDb();
  const nowIso = new Date().toISOString();

  if (action === "join") {
    if (!db.queueSession.isOpen) {
      return NextResponse.json(
        { error: "Clearance queue is currently paused." },
        { status: 400 }
      );
    }
    if (!studentId) {
      return NextResponse.json({ error: "Missing studentId" }, { status: 400 });
    }
    const existing = db.queueTickets.find(
      (t) =>
        t.studentId === studentId &&
        (t.status === "waiting" || t.status === "called")
    );
    if (existing) {
      return NextResponse.json(
        { error: `You already have active ticket #${existing.ticketNumber}.` },
        { status: 400 }
      );
    }

    db.queueSession.lastTicketNumber += 1;
    db.queueTickets.push({
      id: `qt-${Date.now()}`,
      sessionId: db.queueSession.id,
      studentId,
      ticketNumber: db.queueSession.lastTicketNumber,
      status: "waiting",
      counterLabel: null,
      handledBy: null,
      actionNote: null,
      calledAt: null,
      completedAt: null,
      createdAt: nowIso,
    });
    writeDb(db);
    return NextResponse.json(buildAppState(studentId));
  }

  if (action === "cancel") {
    const ticket = db.queueTickets.find(
      (t) =>
        (ticketId ? t.id === ticketId : t.studentId === studentId) &&
        (t.status === "waiting" || t.status === "called")
    );
    if (ticket) {
      ticket.status = "cancelled";
      writeDb(db);
    }
    return NextResponse.json(buildAppState(studentId));
  }

  if (action === "set_capacity") {
    const cap = Math.max(1, Math.min(20, Number(chairCapacity) || 5));
    db.queueSession.chairCapacity = cap;
    writeDb(db);
    return NextResponse.json(buildAppState(studentId));
  }

  if (action === "call_next") {
    const activeCalled = db.queueTickets.filter((t) => t.status === "called");
    const waiting = db.queueTickets
      .filter((t) => t.status === "waiting")
      .sort((a, b) => a.ticketNumber - b.ticketNumber);

    if (waiting.length === 0) {
      return NextResponse.json(
        { error: "No students currently waiting in queue." },
        { status: 400 }
      );
    }

    const capacity = Math.max(1, db.queueSession.chairCapacity || 5);
    const availableSlots =
      mode === "single"
        ? 1
        : Math.max(1, capacity - activeCalled.length);

    if (mode !== "single" && activeCalled.length >= capacity) {
      return NextResponse.json(
        {
          error: `All ${capacity} chairs are currently occupied. Mark someone Done or Skip first, or increase Chair Capacity.`,
        },
        { status: 400 }
      );
    }

    // Find unused chair labels first
    const usedLabels = new Set(activeCalled.map((t) => t.counterLabel));
    const freeLabels: string[] = [];
    for (let i = 1; i <= Math.max(capacity, activeCalled.length + availableSlots); i++) {
      const label = `Chair ${i}`;
      if (!usedLabels.has(label)) freeLabels.push(label);
    }

    const toCall = waiting.slice(0, availableSlots);
    toCall.forEach((ticket, idx) => {
      ticket.status = "called";
      ticket.counterLabel = freeLabels[idx] ?? `Chair ${activeCalled.length + idx + 1}`;
      ticket.calledAt = nowIso;
      db.queueSession.currentServingNumber = ticket.ticketNumber;
    });

    writeDb(db);
    return NextResponse.json(buildAppState(studentId));
  }

  if (action === "complete" || action === "no_show") {
    const target = db.queueTickets.find((t) =>
      ticketId ? t.id === ticketId : t.status === "called"
    );
    if (!target) {
      return NextResponse.json(
        { error: "No active called ticket found." },
        { status: 400 }
      );
    }
    target.status = action === "complete" ? "completed" : "no_show";
    target.handledBy = handledBy?.trim() || "CSC Officer";
    target.actionNote =
      actionNote?.trim() ||
      (action === "complete"
        ? "Clearance completed"
        : "Skipped (Late / No-show)");
    target.completedAt = nowIso;
    writeDb(db);
    return NextResponse.json(buildAppState(studentId));
  }

  if (action === "toggle_session") {
    db.queueSession.isOpen = !db.queueSession.isOpen;
    writeDb(db);
    return NextResponse.json(buildAppState(studentId));
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
