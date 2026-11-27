import { NextRequest, NextResponse } from "next/server";
import { buildAppState } from "@/lib/store";

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("studentId");
  const state = buildAppState(studentId);
  return NextResponse.json(state);
}
