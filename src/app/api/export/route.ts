import { NextRequest, NextResponse } from "next/server";
import { buildAppState } from "@/lib/store";

function csvEscape(val: string | number | undefined | null): string {
  const str = String(val ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  const courseFilter = req.nextUrl.searchParams.get("course") ?? "ALL";
  const query = (req.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();

  const state = buildAppState();
  const filtered = state.studentSummaries.filter((row) => {
    const matchCourse =
      courseFilter === "ALL" || row.student.course === courseFilter;
    const matchQuery =
      !query ||
      row.student.studentId.toLowerCase().includes(query) ||
      row.student.fullName.toLowerCase().includes(query) ||
      row.student.course.toLowerCase().includes(query);
    return matchCourse && matchQuery;
  });

  const headers = [
    "ID Number",
    "Full Name",
    "Course",
    "Year & Section",
    "Clearance Status",
    "Participant Exemption",
    "Unpaid Fines (PHP)",
    "Settlement / Item Details",
    "Handled By",
    "Last Settled At",
  ];

  const lines = [
    headers.map(csvEscape).join(","),
    ...filtered.map((row) =>
      [
        row.student.studentId,
        row.student.fullName,
        row.student.course,
        row.student.yearSection,
        row.isCleared ? "CLEARED" : "PENDING",
        row.student.isParticipant
          ? `YES (${row.student.participantNote || "Participant"})`
          : "NO",
        row.unpaidTotal.toFixed(2),
        row.lastSettlementSummary,
        row.lastHandledBy || "-",
        row.lastSettledAt
          ? new Date(row.lastSettledAt).toLocaleString("en-PH")
          : "-",
      ]
        .map(csvEscape)
        .join(",")
    ),
  ];

  // UTF-8 BOM so Microsoft Excel opens special characters (₱) cleanly
  const csvContent = "\uFEFF" + lines.join("\r\n");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clap-csc-clearance-${courseFilter.toLowerCase()}.csv"`,
    },
  });
}
