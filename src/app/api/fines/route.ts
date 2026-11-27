import { NextRequest, NextResponse } from "next/server";
import { buildAppState, readDb, writeDb } from "@/lib/store";
import type { SettlementType } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    action,
    fineId,
    settlementType,
    settlementItem,
    settledBy,
    activeStudentId,
  } = body as {
    action: "pay" | "waive" | "exempt";
    fineId: string;
    settlementType?: SettlementType;
    settlementItem?: string;
    settledBy?: string;
    activeStudentId?: string;
  };

  const db = readDb();
  const fine = db.fines.find((f) => f.id === fineId);
  if (!fine) {
    return NextResponse.json({ error: "Fine not found." }, { status: 404 });
  }

  const officer = settledBy?.trim() || "CSC Officer";
  const nowIso = new Date().toISOString();

  if (action === "pay") {
    const type: SettlementType = settlementType === "item" ? "item" : "cash";
    fine.status = "paid";
    fine.settlementType = type;
    fine.settlementItem =
      type === "item"
        ? settlementItem?.trim() || "In-kind item submitted"
        : `₱${fine.amount} Cash`;
    fine.settledBy = officer;
    fine.settledAt = nowIso;
    fine.receiptNo = `CLAP-${Math.floor(1000 + Math.random() * 9000)}`;
  } else if (action === "exempt") {
    fine.status = "exempted";
    fine.settlementType = "exempted";
    fine.settlementItem = settlementItem?.trim() || "Event Participant Exemption";
    fine.settledBy = officer;
    fine.settledAt = nowIso;
    fine.receiptNo = "EXEMPTED";
  } else if (action === "waive") {
    fine.status = "waived";
    fine.settlementType = "exempted";
    fine.settlementItem = settlementItem?.trim() || "Waived by CSC Officer";
    fine.settledBy = officer;
    fine.settledAt = nowIso;
    fine.receiptNo = "WAIVED";
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  writeDb(db);
  return NextResponse.json(buildAppState(activeStudentId));
}
