"use client";

import { useState } from "react";
import {
  Award,
  BarChart3,
  Check,
  Clock,
  Coins,
  Download,
  History,
  LogIn,
  LogOut,
  Pause,
  Play,
  Plus,
  QrCode,
  Search,
  SkipForward,
  UserCheck,
  UserCog,
  UserX,
  Users,
} from "lucide-react";
import type { AppStateResponse, SettlementType } from "@/lib/types";

interface OfficerViewProps {
  state: AppStateResponse;
  activeOfficerId: string;
  onOfficerChange: (officerId: string) => void;
  onClockAction: (action: "clock_in" | "clock_out", note?: string) => Promise<void>;
  onAddOfficer: (name: string, roleTitle: string) => Promise<void>;
  onQueueAction: (
    action: string,
    extra?: {
      ticketId?: string;
      chairCapacity?: number;
      actionNote?: string;
      mode?: "single" | "fill";
    }
  ) => Promise<void>;
  onCheckIn: (eventId: string, studentQuery: string) => Promise<void>;
  onFinalizeEvent: (eventId: string) => Promise<void>;
  onCreateEvent: (payload: {
    title: string;
    venue: string;
    attendanceStart: string;
    attendanceEnd: string;
    gracePeriodMins: number;
    absentFine: number;
    lateFine: number;
  }) => Promise<void>;
  onFineAction: (
    action: "pay" | "waive" | "exempt",
    fineId: string,
    settlementType?: SettlementType,
    settlementItem?: string
  ) => Promise<void>;
  onSetParticipant: (
    targetStudentId: string,
    isParticipant: boolean,
    participantNote?: string
  ) => Promise<void>;
  busy: boolean;
}

const CET_COURSES = ["ALL", "BSIT", "BSCS", "BSCE"] as const;

export default function OfficerView({
  state,
  activeOfficerId,
  onOfficerChange,
  onClockAction,
  onAddOfficer,
  onQueueAction,
  onCheckIn,
  onFinalizeEvent,
  onCreateEvent,
  onFineAction,
  onSetParticipant,
  busy,
}: OfficerViewProps) {
  const {
    queueSession,
    liveTickets,
    historyTickets,
    events,
    students,
    studentSummaries,
    officers,
    officerShifts,
    officerWorkSummaries,
    allFines,
  } = state;

  const [shiftNote, setShiftNote] = useState("");
  const [showAddOfficer, setShowAddOfficer] = useState(false);
  const [newOfficerName, setNewOfficerName] = useState("");
  const [newOfficerRole, setNewOfficerRole] = useState("Treasurer / Fines Collector");
  const [graphOfficerId, setGraphOfficerId] = useState<string>(activeOfficerId);
  const [overviewDate, setOverviewDate] = useState<string>(() =>
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10)
  );

  const activeOfficerSummary = officerWorkSummaries.find(
    (o) => o.officer.id === activeOfficerId
  );

  const calledTickets = liveTickets.filter((t) => t.status === "called");
  const waitingTickets = liveTickets.filter((t) => t.status === "waiting");

  // Queue controls
  const [chairInput, setChairInput] = useState(queueSession.chairCapacity);
  const [ticketNotes, setTicketNotes] = useState<Record<string, string>>({});

  // Course filter & student search
  const [courseFilter, setCourseFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Per-fine settlement inputs
  const [fineTypeMap, setFineTypeMap] = useState<Record<string, "cash" | "item">>({});
  const [fineItemMap, setFineItemMap] = useState<Record<string, string>>({});
  const [participantNoteMap, setParticipantNoteMap] = useState<Record<string, string>>({});

  // Event check-in & creation
  const [selectedEventId, setSelectedEventId] = useState(
    events.find((e) => !e.finesGenerated)?.id ?? events[0]?.id ?? ""
  );
  const [scanInput, setScanInput] = useState("");
  const [showNewEvent, setShowNewEvent] = useState(false);

  const nowLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  const twoHoursLocal = new Date(
    Date.now() + 2 * 3600000 - new Date().getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 16);

  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("University Gymnasium");
  const [attendanceStart, setAttendanceStart] = useState(nowLocal);
  const [attendanceEnd, setAttendanceEnd] = useState(twoHoursLocal);
  const [gracePeriodMins, setGracePeriodMins] = useState(15);
  const [absentFine, setAbsentFine] = useState(50);
  const [lateFine, setLateFine] = useState(20);

  const filteredSummaries = studentSummaries.filter((row) => {
    const matchCourse =
      courseFilter === "ALL" || row.student.course === courseFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      row.student.studentId.toLowerCase().includes(q) ||
      row.student.fullName.toLowerCase().includes(q) ||
      row.student.course.toLowerCase().includes(q);
    return matchCourse && matchSearch;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onCreateEvent({
      title,
      venue,
      attendanceStart,
      attendanceEnd,
      gracePeriodMins,
      absentFine,
      lateFine,
    });
    setTitle("");
    setShowNewEvent(false);
  };

  const handleExportExcel = () => {
    const params = new URLSearchParams({
      course: courseFilter,
      q: searchQuery,
    });
    window.location.href = `/api/export?${params.toString()}`;
  };

  return (
    <div className="space-y-4">
      {/* Officer Profile & Duty Time-In / Time-Out (Officer-Only) */}
      <section className="rounded-2xl bg-indigo-950 text-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs">
            <UserCog className="w-4 h-4 text-indigo-300 shrink-0" />
            <span className="text-indigo-200 font-semibold">Officer On Duty</span>
          </div>
          <button
            onClick={() => setShowAddOfficer((v) => !v)}
            className="text-[11px] font-semibold text-indigo-200 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Officer
          </button>
        </div>

        <select
          value={activeOfficerId}
          onChange={(e) => onOfficerChange(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-indigo-900 border border-indigo-700 text-xs font-semibold text-white"
        >
          {officers.map((off) => (
            <option key={off.id} value={off.id}>
              {off.name} — {off.roleTitle}
            </option>
          ))}
        </select>

        {showAddOfficer && (
          <div className="p-2.5 rounded-xl bg-indigo-900/70 border border-indigo-700 space-y-2 text-xs">
            <input
              type="text"
              placeholder="Officer Name (e.g. Officer Villanueva)"
              value={newOfficerName}
              onChange={(e) => setNewOfficerName(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-indigo-950 border border-indigo-700 text-white placeholder:text-indigo-400"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Role (e.g. Fines Collector)"
                value={newOfficerRole}
                onChange={(e) => setNewOfficerRole(e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded-lg bg-indigo-950 border border-indigo-700 text-white placeholder:text-indigo-400"
              />
              <button
                onClick={async () => {
                  if (!newOfficerName.trim()) return;
                  await onAddOfficer(newOfficerName, newOfficerRole);
                  setNewOfficerName("");
                  setShowAddOfficer(false);
                }}
                disabled={busy || !newOfficerName.trim()}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-semibold cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* Time-In / Time-Out Controls */}
        <div className="rounded-xl bg-indigo-900/60 border border-indigo-800 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-indigo-200">
              {activeOfficerSummary?.isOnDuty && activeOfficerSummary.activeShift ? (
                <>
                  Timed In at{" "}
                  <strong className="text-emerald-300">
                    {new Date(
                      activeOfficerSummary.activeShift.timeIn
                    ).toLocaleTimeString("en-PH", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </strong>
                </>
              ) : (
                "Currently Off Duty"
              )}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeOfficerSummary?.isOnDuty
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                  : "bg-slate-700 text-slate-300"
              }`}
            >
              {activeOfficerSummary?.isOnDuty ? "ON DUTY" : "OFF DUTY"}
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Shift note (e.g. Fines Desk / Queue)"
              value={shiftNote}
              onChange={(e) => setShiftNote(e.target.value)}
              className="flex-1 px-2.5 py-1.5 rounded-lg bg-indigo-950 border border-indigo-700 text-xs text-white placeholder:text-indigo-400"
            />
            {activeOfficerSummary?.isOnDuty ? (
              <button
                onClick={async () => {
                  await onClockAction("clock_out", shiftNote);
                  setShiftNote("");
                }}
                disabled={busy}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" /> Time Out
              </button>
            ) : (
              <button
                onClick={async () => {
                  await onClockAction("clock_in", shiftNote);
                  setShiftNote("");
                }}
                disabled={busy}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" /> Time In
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Multi-Chair Queue Counter Controls */}
      <section className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Office Chair Queue ({calledTickets.length}/{queueSession.chairCapacity})
            </h2>
            <p className="text-xs text-slate-500">
              {waitingTickets.length} waiting outside
            </p>
          </div>
          <button
            onClick={() => onQueueAction("toggle_session")}
            disabled={busy}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              queueSession.isOpen
                ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
            }`}
          >
            {queueSession.isOpen ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Open
              </>
            )}
          </button>
        </div>

        {/* Chair Capacity Setting */}
        <div className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
          <span className="text-slate-600 font-medium">
            Chairs inside office:
          </span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={1}
              max={20}
              value={chairInput}
              onChange={(e) => setChairInput(Number(e.target.value))}
              className="w-14 px-2 py-1 rounded-lg border border-slate-300 bg-white text-center font-bold"
            />
            <button
              onClick={() =>
                onQueueAction("set_capacity", { chairCapacity: chairInput })
              }
              disabled={busy}
              className="px-2.5 py-1 rounded-lg bg-slate-800 text-white font-semibold cursor-pointer"
            >
              Set
            </button>
          </div>
        </div>

        {/* Active Chairs List */}
        <div className="space-y-2">
          {calledTickets.length === 0 ? (
            <div className="rounded-xl bg-slate-900 text-slate-400 p-4 text-xs text-center">
              All {queueSession.chairCapacity} chairs are empty. Click{" "}
              <strong className="text-white">Fill Chairs</strong> below to call
              students inside.
            </div>
          ) : (
            calledTickets.map((ct) => (
              <div
                key={ct.id}
                className="rounded-xl bg-slate-900 text-white p-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold">
                        {ct.counterLabel ?? "Chair"}
                      </span>
                      <span className="text-base font-black">
                        #{String(ct.ticketNumber).padStart(3, "0")}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {ct.course}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      {ct.studentName} ({ct.studentNumber})
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() =>
                        onQueueAction("complete", {
                          ticketId: ct.id,
                          actionNote: ticketNotes[ct.id],
                        })
                      }
                      disabled={busy}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Done
                    </button>
                    <button
                      onClick={() =>
                        onQueueAction("no_show", {
                          ticketId: ct.id,
                          actionNote:
                            ticketNotes[ct.id] || "Skipped (Late / No-show)",
                        })
                      }
                      disabled={busy}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <UserX className="w-3.5 h-3.5" /> Skip
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Note (e.g. Paid 1x Eraser, Exempted, or Late)"
                  value={ticketNotes[ct.id] ?? ""}
                  onChange={(e) =>
                    setTicketNotes((prev) => ({
                      ...prev,
                      [ct.id]: e.target.value,
                    }))
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-[11px] text-white placeholder:text-slate-400"
                />
              </div>
            ))
          )}
        </div>

        {/* Batch Call + Single Add */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onQueueAction("call_next", { mode: "fill" })}
            disabled={
              busy ||
              waitingTickets.length === 0 ||
              calledTickets.length >= queueSession.chairCapacity
            }
            className="col-span-2 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <SkipForward className="w-4 h-4" />
            Fill Chairs (Up to {queueSession.chairCapacity})
          </button>
          <button
            onClick={() => onQueueAction("call_next", { mode: "single" })}
            disabled={busy || waitingTickets.length === 0}
            className="py-2.5 px-3 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-800 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> +1 Call
          </button>
        </div>

        {/* Queue Audit Log */}
        {historyTickets.length > 0 && (
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" /> Queue Proof & Audit Log
            </p>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {historyTickets.slice(0, 8).map((ht) => (
                <div
                  key={ht.id}
                  className="rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1.5 text-[11px]"
                >
                  <div className="flex justify-between font-semibold text-slate-800">
                    <span>
                      #{String(ht.ticketNumber).padStart(3, "0")} • {ht.studentName}{" "}
                      ({ht.course})
                    </span>
                    <span
                      className={
                        ht.status === "completed"
                          ? "text-emerald-700"
                          : "text-rose-600"
                      }
                    >
                      {ht.status === "completed" ? "DONE" : "SKIPPED"}
                    </span>
                  </div>
                  <p className="text-slate-600">
                    {ht.actionNote} • <strong>{ht.handledBy}</strong> •{" "}
                    {ht.completedAt
                      ? new Date(ht.completedAt).toLocaleTimeString("en-PH", {
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* CET Course Filter, Student Search, Participant Exemption & In-Kind / Cash Fines + Excel Export */}
      <section className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" /> CET Clearance & Fines
            </h2>
            <p className="text-[11px] text-slate-500">
              Filter by course, exempt participants, or settle via cash/item
            </p>
          </div>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5" /> Export Excel
          </button>
        </div>

        {/* Course Filter Pills */}
        <div className="flex flex-wrap gap-1.5">
          {CET_COURSES.map((c) => (
            <button
              key={c}
              onClick={() => setCourseFilter(c)}
              className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                courseFilter === c
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Search by ID or Name */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search ID number (e.g. 2211600004) or Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs"
          />
        </div>

        {/* Filtered Student Cards */}
        <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
          {filteredSummaries.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">
              No matching students found.
            </p>
          ) : (
            filteredSummaries.map((row) => {
              const { student, unpaidTotal, isCleared, fines } = row;
              const unpaidFines = fines.filter((f) => f.status === "unpaid");
              return (
                <div
                  key={student.id}
                  className="p-3 rounded-xl border border-slate-200 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-900">
                        {student.fullName}
                      </p>
                      <p className="text-slate-500">
                        ID:{" "}
                        <span className="font-mono font-semibold">
                          {student.studentId}
                        </span>{" "}
                        •{" "}
                        <span className="font-semibold text-indigo-700">
                          {student.course}
                        </span>{" "}
                        {student.yearSection}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full shrink-0 ${
                        isCleared
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {isCleared ? "CLEARED" : `DUE ₱${unpaidTotal}`}
                    </span>
                  </div>

                  {/* Participant / Exemption Control */}
                  <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg p-2">
                    <Award className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    {student.isParticipant ? (
                      <div className="flex-1 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-indigo-900 font-medium">
                          Exempted: {student.participantNote}
                        </span>
                        <button
                          onClick={() => onSetParticipant(student.id, false)}
                          disabled={busy}
                          className="text-[10px] text-slate-500 hover:text-rose-600 underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <>
                        <input
                          type="text"
                          placeholder="Event joined (e.g. Palaro - Bench Yell)"
                          value={participantNoteMap[student.id] ?? ""}
                          onChange={(e) =>
                            setParticipantNoteMap((p) => ({
                              ...p,
                              [student.id]: e.target.value,
                            }))
                          }
                          className="flex-1 px-2 py-1 rounded border border-slate-200 bg-white text-[11px]"
                        />
                        <button
                          onClick={() =>
                            onSetParticipant(
                              student.id,
                              true,
                              participantNoteMap[student.id] ||
                                "Palaro - Bench Yell Competition"
                            )
                          }
                          disabled={busy}
                          className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold cursor-pointer shrink-0"
                        >
                          Exempt
                        </button>
                      </>
                    )}
                  </div>

                  {/* Unpaid Fines Settlement (Cash or Item) */}
                  {unpaidFines.map((fine) => {
                    const fType = fineTypeMap[fine.id] ?? "item";
                    return (
                      <div
                        key={fine.id}
                        className="p-2 rounded-lg bg-rose-50/60 border border-rose-200 space-y-1.5"
                      >
                        <div className="flex justify-between font-medium text-rose-900">
                          <span>{fine.reason}</span>
                          <span>₱{fine.amount}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <select
                            value={fType}
                            onChange={(e) =>
                              setFineTypeMap((p) => ({
                                ...p,
                                [fine.id]: e.target.value as "cash" | "item",
                              }))
                            }
                            className="px-2 py-1 rounded border border-slate-300 bg-white text-[11px] font-medium"
                          >
                            <option value="item">Item / In-Kind</option>
                            <option value="cash">Cash</option>
                          </select>
                          {fType === "item" && (
                            <input
                              type="text"
                              placeholder="Item (e.g. 1x Eraser)"
                              value={fineItemMap[fine.id] ?? ""}
                              onChange={(e) =>
                                setFineItemMap((p) => ({
                                  ...p,
                                  [fine.id]: e.target.value,
                                }))
                              }
                              className="flex-1 min-w-[110px] px-2 py-1 rounded border border-slate-300 bg-white text-[11px]"
                            />
                          )}
                          <button
                            onClick={() =>
                              onFineAction(
                                "pay",
                                fine.id,
                                fType,
                                fType === "item"
                                  ? fineItemMap[fine.id] || "1x Whiteboard Eraser"
                                  : `₱${fine.amount} Cash`
                              )
                            }
                            disabled={busy}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3" /> Settle
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Last Settlement Summary */}
                  {unpaidFines.length === 0 && row.lastSettlementSummary !== "No fines" && (
                    <p className="text-[11px] text-emerald-700 font-medium">
                      ✓ {row.lastSettlementSummary}
                      {row.lastHandledBy ? ` • Received by ${row.lastHandledBy}` : ""}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Cash & Items Received Summary (Who received money / items + totals) */}
        {(() => {
          const paidFines = allFines.filter((f) => f.status === "paid");
          const cashFines = paidFines.filter((f) => f.settlementType === "cash");
          const itemFines = paidFines.filter((f) => f.settlementType === "item");
          const totalCash = cashFines.reduce((sum, f) => sum + f.amount, 0);

          const byOfficer = new Map<
            string,
            { cash: number; items: string[] }
          >();
          for (const f of paidFines) {
            const receiver = f.settledBy || "CSC Officer";
            const entry = byOfficer.get(receiver) ?? { cash: 0, items: [] };
            if (f.settlementType === "cash") {
              entry.cash += f.amount;
            } else if (f.settlementType === "item") {
              entry.items.push(`${f.settlementItem || "Item"} (${f.studentName})`);
            }
            byOfficer.set(receiver, entry);
          }

          return (
            <div className="pt-3 border-t border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-emerald-600" /> Cash & Items
                  Received
                </h3>
                <span className="text-xs font-bold text-emerald-700">
                  Total Cash: ₱{totalCash.toFixed(2)} • {itemFines.length} Item(s)
                </span>
              </div>

              {paidFines.length === 0 ? (
                <p className="text-[11px] text-slate-400">
                  No cash or items collected yet.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {Array.from(byOfficer.entries()).map(([receiver, info]) => (
                    <div
                      key={receiver}
                      className="rounded-lg bg-emerald-50/70 border border-emerald-200 px-3 py-2 text-[11px]"
                    >
                      <div className="flex justify-between font-semibold text-emerald-950">
                        <span>Received by: {receiver}</span>
                        <span>Cash: ₱{info.cash.toFixed(2)}</span>
                      </div>
                      {info.items.length > 0 && (
                        <p className="text-emerald-800 mt-0.5">
                          Items: {info.items.join(" • ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </section>

      {/* Event Attendance Scanner & Scheduler */}
      <section className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-indigo-600" /> Event Attendance
          </h2>
          <button
            onClick={() => setShowNewEvent((v) => !v)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> New Event
          </button>
        </div>

        {showNewEvent && (
          <form
            onSubmit={handleCreate}
            className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs"
          >
            <input
              type="text"
              placeholder="Event Title (e.g. CET Acquaintance Party)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              required
            />
            <input
              type="text"
              placeholder="Venue"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="text-slate-600 font-medium">Start Time</span>
                <input
                  type="datetime-local"
                  value={attendanceStart}
                  onChange={(e) => setAttendanceStart(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                  required
                />
              </label>
              <label className="space-y-1">
                <span className="text-slate-600 font-medium">End Time</span>
                <input
                  type="datetime-local"
                  value={attendanceEnd}
                  onChange={(e) => setAttendanceEnd(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                  required
                />
              </label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <label className="space-y-1">
                <span className="text-slate-600">Grace (mins)</span>
                <input
                  type="number"
                  value={gracePeriodMins}
                  onChange={(e) => setGracePeriodMins(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </label>
              <label className="space-y-1">
                <span className="text-slate-600">Absent Fine (₱)</span>
                <input
                  type="number"
                  value={absentFine}
                  onChange={(e) => setAbsentFine(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </label>
              <label className="space-y-1">
                <span className="text-slate-600">Late Fine (₱)</span>
                <input
                  type="number"
                  value={lateFine}
                  onChange={(e) => setLateFine(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full py-2 rounded-lg bg-indigo-600 text-white font-semibold cursor-pointer"
            >
              Create Event Schedule
            </button>
          </form>
        )}

        <div className="space-y-2">
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white"
          >
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.title} {evt.finesGenerated ? "(Finalized)" : ""}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Student ID (e.g. 2211600004)"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <button
              onClick={async () => {
                if (!scanInput.trim() || !selectedEventId) return;
                await onCheckIn(selectedEventId, scanInput);
                setScanInput("");
              }}
              disabled={busy || !scanInput.trim()}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-semibold cursor-pointer"
            >
              Check In
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] text-slate-400 self-center mr-1">
              Quick scan:
            </span>
            {students.map((s) => (
              <button
                key={s.id}
                onClick={() => onCheckIn(selectedEventId, s.studentId)}
                disabled={busy}
                className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-[11px] text-slate-700 font-medium cursor-pointer"
              >
                {s.studentId}
              </button>
            ))}
          </div>

          {selectedEventId && (
            <button
              onClick={() => onFinalizeEvent(selectedEventId)}
              disabled={
                busy ||
                events.find((e) => e.id === selectedEventId)?.finesGenerated
              }
              className="w-full py-2 px-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-700 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              Close Window & Auto-Generate Absent Fines
            </button>
          )}
        </div>
      </section>

      {/* Officer-Only Duty Attendance Overview & Monthly/Weekly Work Graph */}
      <section className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" /> Officer Attendance
              Overview
            </h2>
            <p className="text-[11px] text-slate-500">
              Officer-only view: today&apos;s Time In, Time Out &amp; total hours per officer
            </p>
          </div>
        </div>

        {/* Date-Selectable Attendance Overview Table (Every Officer) */}
        {(() => {
          const [yr, mo, dy] = overviewDate.split("-").map(Number);
          const selectedDateKey = new Date(yr, mo - 1, dy).toDateString();
          const nowMs = new Date(state.serverTime).getTime();

          const toLocalDateStr = (offsetDays: number) =>
            new Date(
              Date.now() +
                offsetDays * 86400000 -
                new Date().getTimezoneOffset() * 60000
            )
              .toISOString()
              .slice(0, 10);

          return (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setOverviewDate(toLocalDateStr(0))}
                    className={`px-2 py-1 rounded-md font-semibold cursor-pointer ${
                      overviewDate === toLocalDateStr(0)
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setOverviewDate(toLocalDateStr(-1))}
                    className={`px-2 py-1 rounded-md font-semibold cursor-pointer ${
                      overviewDate === toLocalDateStr(-1)
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Yesterday
                  </button>
                </div>
                <input
                  type="date"
                  value={overviewDate}
                  onChange={(e) => {
                    if (e.target.value) setOverviewDate(e.target.value);
                  }}
                  className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800"
                />
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-100 px-3 py-2 grid grid-cols-12 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  <span className="col-span-4">Officer</span>
                  <span className="col-span-3">In</span>
                  <span className="col-span-3">Out</span>
                  <span className="col-span-2 text-right">Total</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {officers.map((off) => {
                    const dayShifts = officerShifts.filter(
                      (s) =>
                        s.officerId === off.id &&
                        new Date(s.timeIn).toDateString() === selectedDateKey
                    );
                    const sortedDay = [...dayShifts].sort(
                      (a, b) =>
                        new Date(a.timeIn).getTime() -
                        new Date(b.timeIn).getTime()
                    );
                    const firstIn = sortedDay[0]?.timeIn ?? null;
                    const activeShift = sortedDay.find(
                      (s) => s.timeOut === null
                    );
                    const lastOut = activeShift
                      ? null
                      : sortedDay[sortedDay.length - 1]?.timeOut ?? null;

                    const totalDayMins = sortedDay.reduce(
                      (sum, s) =>
                        sum +
                        (s.timeOut
                          ? s.durationMins
                          : Math.max(
                              0,
                              Math.round(
                                (nowMs - new Date(s.timeIn).getTime()) / 60000
                              )
                            )),
                      0
                    );

                    const hrs = Math.floor(totalDayMins / 60);
                    const mins = totalDayMins % 60;
                    const totalLabel =
                      totalDayMins === 0
                        ? "0m"
                        : hrs > 0
                        ? `${hrs}h ${mins}m`
                        : `${mins}m`;

                    return (
                      <div
                        key={off.id}
                        className="px-3 py-2 grid grid-cols-12 items-center text-[11px] bg-white"
                      >
                        <div className="col-span-4 pr-1">
                          <p className="font-semibold text-slate-900 truncate">
                            {off.name}
                          </p>
                        </div>
                        <span className="col-span-3 text-slate-600">
                          {firstIn
                            ? new Date(firstIn).toLocaleTimeString("en-PH", {
                                hour: "numeric",
                                minute: "2-digit",
                              })
                            : "—"}
                        </span>
                        <span className="col-span-3 text-slate-600">
                          {activeShift ? (
                            <span className="text-emerald-700 font-semibold">
                              On Duty
                            </span>
                          ) : lastOut ? (
                            new Date(lastOut).toLocaleTimeString("en-PH", {
                              hour: "numeric",
                              minute: "2-digit",
                            })
                          ) : (
                            "—"
                          )}
                        </span>
                        <span className="col-span-2 text-right font-mono font-bold text-slate-900">
                          {totalLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Select Officer for Monthly/Weekly Graph */}
        {(() => {
          const selectedOff =
            officers.find((o) => o.id === graphOfficerId) ?? officers[0];
          const offShifts = officerShifts.filter(
            (s) => s.officerId === selectedOff?.id
          );
          const nowMs = new Date(state.serverTime).getTime();
          const weekMs = 7 * 24 * 60 * 60 * 1000;

          const weeks = [
            { label: "3 wks ago", mins: 0 },
            { label: "2 wks ago", mins: 0 },
            { label: "Last wk", mins: 0 },
            { label: "This wk", mins: 0 },
          ];

          for (const sh of offShifts) {
            const ageMs = nowMs - new Date(sh.timeIn).getTime();
            const mins = sh.timeOut
              ? sh.durationMins
              : Math.max(0, Math.round(ageMs / 60000));
            const weekIdx = 3 - Math.floor(ageMs / weekMs);
            if (weekIdx >= 0 && weekIdx <= 3) {
              weeks[weekIdx].mins += mins;
            }
          }

          const maxMins = Math.max(60, ...weeks.map((w) => w.mins));
          const totalMins = offShifts.reduce(
            (sum, sh) =>
              sum +
              (sh.timeOut
                ? sh.durationMins
                : Math.max(
                    0,
                    Math.round((nowMs - new Date(sh.timeIn).getTime()) / 60000)
                  )),
            0
          );
          const totalHrs = (totalMins / 60).toFixed(1);

          return (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <select
                  value={selectedOff?.id ?? ""}
                  onChange={(e) => setGraphOfficerId(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800"
                >
                  {officers.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.roleTitle})
                    </option>
                  ))}
                </select>
                <span className="text-xs font-bold text-indigo-700 shrink-0">
                  {totalHrs} hrs (4 wks)
                </span>
              </div>

              {/* 4-Week Bar Chart */}
              <div className="grid grid-cols-4 gap-2 items-end h-24 pt-2">
                {weeks.map((w) => {
                  const pct = Math.max(8, Math.round((w.mins / maxMins) * 100));
                  const hrsLabel =
                    w.mins >= 60
                      ? `${(w.mins / 60).toFixed(1)}h`
                      : `${w.mins}m`;
                  return (
                    <div
                      key={w.label}
                      className="flex flex-col items-center justify-end h-full gap-1"
                    >
                      <span className="text-[10px] font-semibold text-slate-600">
                        {hrsLabel}
                      </span>
                      <div className="w-full max-w-[36px] bg-slate-200 rounded-t-md h-14 flex items-end overflow-hidden">
                        <div
                          className="w-full bg-indigo-600 rounded-t-md transition-all"
                          style={{ height: `${w.mins === 0 ? 4 : pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {w.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Officer Time-In / Time-Out Attendance Log */}
        {officerShifts.length > 0 && (
          <div className="pt-1 space-y-1.5">
            <p className="text-xs font-bold text-slate-600">
              Time-In / Time-Out Attendance Log
            </p>
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {officerShifts.slice(0, 12).map((sh) => {
                const inDate = new Date(sh.timeIn);
                const dateStr = inDate.toLocaleDateString("en-PH", {
                  month: "short",
                  day: "numeric",
                });
                const inStr = inDate.toLocaleTimeString("en-PH", {
                  hour: "numeric",
                  minute: "2-digit",
                });
                const outStr = sh.timeOut
                  ? new Date(sh.timeOut).toLocaleTimeString("en-PH", {
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : "Active";
                return (
                  <div
                    key={sh.id}
                    className="rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1.5 text-[11px] flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">
                        {sh.officerName}
                      </span>
                      <span className="text-slate-500">
                        {" "}
                        • {dateStr} • In: {inStr} • Out: {outStr}
                      </span>
                      {sh.note && (
                        <p className="text-slate-500 text-[10px]">{sh.note}</p>
                      )}
                    </div>
                    <span className="font-mono font-bold text-slate-700 shrink-0">
                      {sh.timeOut ? `${sh.durationMins}m` : "ON DUTY"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
