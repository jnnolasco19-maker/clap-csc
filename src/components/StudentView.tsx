"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Award,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  History,
  MapPin,
  PackageCheck,
  Receipt,
  Ticket,
  Users,
  XCircle,
} from "lucide-react";
import type { AppStateResponse } from "@/lib/types";

interface StudentViewProps {
  state: AppStateResponse;
  onJoinQueue: () => Promise<void>;
  onCancelQueue: (ticketId: string) => Promise<void>;
  busy: boolean;
}

function formatTimeRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const datePart = start.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
  const sTime = start.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });
  const eTime = end.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${datePart} • ${sTime} – ${eTime}`;
}

export default function StudentView({
  state,
  onJoinQueue,
  onCancelQueue,
  busy,
}: StudentViewProps) {
  const [tab, setTab] = useState<"events" | "attendance" | "fines">("events");
  const {
    activeStudent,
    isCleared,
    totalUnpaidFines,
    queueSession,
    liveTickets,
    myTicket,
    myHistoryTickets,
    aheadCount,
    estimatedWaitMins,
    events,
    studentAttendance,
    studentFines,
    serverTime,
  } = state;

  const nowMs = new Date(serverTime).getTime();
  const calledTickets = liveTickets.filter((t) => t.status === "called");

  const getTicketAlert = () => {
    if (!myTicket) return null;
    if (myTicket.status === "called") {
      return {
        tone: "bg-emerald-600 text-white border-emerald-500 animate-pulse",
        icon: <Bell className="w-5 h-5 shrink-0" />,
        title: `IT'S YOUR TURN! (${myTicket.counterLabel ?? "Inside Office"})`,
        desc: `Please enter the CSC office and take ${myTicket.counterLabel ?? "your chair"} now.`,
      };
    }
    if (aheadCount <= queueSession.chairCapacity) {
      return {
        tone: "bg-amber-50 text-amber-900 border-amber-300",
        icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
        title: "Get Ready — Next Batch",
        desc: `Only ${aheadCount} ${aheadCount === 1 ? "person" : "people"} ahead (${queueSession.chairCapacity} chairs inside). Walk toward the CSC office.`,
      };
    }
    return {
      tone: "bg-sky-50 text-sky-900 border-sky-200",
      icon: <Clock className="w-5 h-5 text-sky-600 shrink-0" />,
      title: "Stay in the Shade",
      desc: `We serve ${queueSession.chairCapacity} students at a time. Track the live board below.`,
    };
  };

  const alert = getTicketAlert();

  return (
    <div className="space-y-4">
      {/* Clearance Status Card */}
      <section className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              CET Student Profile
            </p>
            <h2 className="text-lg font-bold text-slate-900">
              {activeStudent.fullName}
            </h2>
            <p className="text-sm text-slate-600">
              ID: <span className="font-mono font-semibold">{activeStudent.studentId}</span> •{" "}
              <span className="font-semibold text-indigo-700">
                {activeStudent.course}
              </span>{" "}
              {activeStudent.yearSection}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${
              isCleared
                ? "bg-emerald-100 text-emerald-800"
                : "bg-rose-100 text-rose-800"
            }`}
          >
            {isCleared ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" /> CLEARED
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5" /> ₱{totalUnpaidFines.toFixed(0)} DUE
              </>
            )}
          </span>
        </div>

        {activeStudent.isParticipant && (
          <div className="rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-2 flex items-center gap-2 text-xs text-indigo-900">
            <Award className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              <strong>Participant Exempted:</strong>{" "}
              {activeStudent.participantNote || "Event Participant"} (No fines required)
            </span>
          </div>
        )}
      </section>

      {/* In-App Live Queue Board */}
      <section className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {queueSession.isOpen && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  queueSession.isOpen ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Live Clearance Queue
              </h3>
              <p className="text-xs text-slate-500">
                {queueSession.name} • {queueSession.chairCapacity} chairs inside
              </p>
            </div>
          </div>
          <span
            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
              queueSession.isOpen
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            {queueSession.isOpen ? "OPEN" : "PAUSED"}
          </span>
        </div>

        {/* Now Serving Chairs + My Ticket */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-900 text-white p-3.5 flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
              Serving Inside ({calledTickets.length}/{queueSession.chairCapacity})
            </span>
            {calledTickets.length > 0 ? (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {calledTickets.map((ct) => (
                  <span
                    key={ct.id}
                    className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono text-xs font-bold"
                  >
                    #{String(ct.ticketNumber).padStart(3, "0")}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-lg font-bold text-slate-400 mt-1">None</div>
            )}
            <span className="text-[11px] text-slate-400 mt-2">
              {queueSession.chairCapacity} chairs active
            </span>
          </div>

          <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3.5 flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-wider text-indigo-600 font-medium">
              Your Ticket
            </span>
            {myTicket ? (
              <>
                <div className="text-3xl font-black text-indigo-950 tracking-tight mt-1">
                  #{String(myTicket.ticketNumber).padStart(3, "0")}
                </div>
                <span className="text-[11px] text-indigo-700 font-medium mt-1">
                  {myTicket.status === "called"
                    ? `${myTicket.counterLabel ?? "Inside"} — Go now!`
                    : `${aheadCount} ahead • ~${estimatedWaitMins}m wait`}
                </span>
              </>
            ) : (
              <>
                <div className="text-xl font-bold text-indigo-900/50 mt-1">
                  —
                </div>
                <span className="text-[11px] text-indigo-600/80 mt-1">
                  Not in line yet
                </span>
              </>
            )}
          </div>
        </div>

        {/* Smart Alert Banner */}
        {alert && (
          <div
            className={`rounded-xl border p-3 flex items-start gap-2.5 ${alert.tone}`}
          >
            {alert.icon}
            <div className="text-xs">
              <p className="font-bold">{alert.title}</p>
              <p className="opacity-90 mt-0.5">{alert.desc}</p>
            </div>
          </div>
        )}

        {/* Action Button */}
        {!myTicket ? (
          <button
            onClick={onJoinQueue}
            disabled={busy || !queueSession.isOpen}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Ticket className="w-4 h-4" />
            {queueSession.isOpen
              ? "Join Online Clearance Queue"
              : "Queue Currently Paused"}
          </button>
        ) : (
          <button
            onClick={() => onCancelQueue(myTicket.id)}
            disabled={busy}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium text-xs transition cursor-pointer"
          >
            Leave Queue (#{String(myTicket.ticketNumber).padStart(3, "0")})
          </button>
        )}

        {/* Live Queue Lineup on Phone */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Live Lineup ({liveTickets.length})
            </span>
            <span>Auto-updates</span>
          </div>
          {liveTickets.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-3">
              No active tickets in the queue right now.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {liveTickets.map((t) => {
                const isMe = t.studentId === activeStudent.id;
                return (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                      t.status === "called"
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold"
                        : isMe
                        ? "bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold"
                        : "bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold">
                        #{String(t.ticketNumber).padStart(3, "0")}
                      </span>
                      <span>
                        {isMe ? `${t.studentName} (You)` : t.studentName}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/80 border border-slate-200 text-slate-600">
                        {t.course}
                      </span>
                    </div>
                    <span className="uppercase text-[10px] font-bold tracking-wide">
                      {t.status === "called"
                        ? t.counterLabel ?? "Inside"
                        : "Waiting"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Student's Own Queue Completion / Skip Proof */}
        {myHistoryTickets.length > 0 && (
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" /> Your Recent Queue Log
            </p>
            {myHistoryTickets.slice(0, 3).map((ht) => (
              <div
                key={ht.id}
                className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-[11px] text-slate-700"
              >
                <div className="flex justify-between font-semibold">
                  <span>
                    Ticket #{String(ht.ticketNumber).padStart(3, "0")} (
                    {ht.status === "completed" ? "Completed" : "Skipped"})
                  </span>
                  <span className="text-slate-500">
                    {ht.completedAt
                      ? new Date(ht.completedAt).toLocaleTimeString("en-PH", {
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : ""}
                  </span>
                </div>
                <p className="text-slate-600 mt-0.5">
                  {ht.actionNote} •{" "}
                  <span className="font-medium">By {ht.handledBy}</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bottom Tabs: Events / Attendance / Fines */}
      <section className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-3 border-b border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setTab("events")}
            className={`py-3 flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === "events"
                ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/40"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> Events
          </button>
          <button
            onClick={() => setTab("attendance")}
            className={`py-3 flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === "attendance"
                ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/40"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Attendance
          </button>
          <button
            onClick={() => setTab("fines")}
            className={`py-3 flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === "fines"
                ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/40"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" /> Fines ({studentFines.length})
          </button>
        </div>

        <div className="p-4 space-y-3">
          {tab === "events" &&
            events.map((evt) => {
              const sMs = new Date(evt.attendanceStart).getTime();
              const eMs = new Date(evt.attendanceEnd).getTime();
              const isOpen = nowMs >= sMs && nowMs <= eMs;
              const isUpcoming = nowMs < sMs;
              return (
                <div
                  key={evt.id}
                  className="p-3 rounded-xl border border-slate-200 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-slate-900">
                      {evt.title}
                    </h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isOpen
                          ? "bg-emerald-100 text-emerald-800"
                          : isUpcoming
                          ? "bg-sky-100 text-sky-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {isOpen ? "OPEN NOW" : isUpcoming ? "UPCOMING" : "CLOSED"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {formatTimeRange(evt.attendanceStart, evt.attendanceEnd)}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {evt.venue}
                  </p>
                  <div className="pt-1 flex items-center gap-3 text-[11px] text-slate-500">
                    <span>Grace: {evt.gracePeriodMins}m</span>
                    <span>•</span>
                    <span className="text-rose-600 font-medium">
                      Absent Fine: ₱{evt.absentFine}
                    </span>
                  </div>
                </div>
              );
            })}

          {tab === "attendance" &&
            (studentAttendance.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                No attendance records yet.
              </p>
            ) : (
              studentAttendance.map((att) => (
                <div
                  key={att.id}
                  className="p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900">
                      {att.eventTitle}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {att.checkedInAt
                        ? `Checked in at ${new Date(
                            att.checkedInAt
                          ).toLocaleTimeString("en-PH", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}`
                        : att.remarks ?? "No check-in recorded"}
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-full ${
                      att.status === "present"
                        ? "bg-emerald-100 text-emerald-800"
                        : att.status === "late"
                        ? "bg-amber-100 text-amber-800"
                        : att.status === "excused"
                        ? "bg-indigo-100 text-indigo-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {att.status === "excused" ? "EXEMPTED" : att.status}
                  </span>
                </div>
              ))
            ))}

          {tab === "fines" &&
            (studentFines.length === 0 ? (
              <p className="text-xs text-emerald-600 text-center py-6 font-medium">
                You have no fines. You are cleared!
              </p>
            ) : (
              studentFines.map((fine) => (
                <div
                  key={fine.id}
                  className="p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <h4 className="font-semibold text-sm text-slate-900">
                      {fine.reason}
                    </h4>
                    {fine.settlementItem ? (
                      <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                        <PackageCheck className="w-3.5 h-3.5" />
                        {fine.settlementItem}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500">
                        Settle via Cash or Requested Item at CSC Booth
                      </p>
                    )}
                    {(fine.receiptNo || fine.settledBy) && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Receipt className="w-3 h-3" />
                        {fine.receiptNo}
                        {fine.settledBy ? ` • By ${fine.settledBy}` : ""}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm text-slate-900">
                      ₱{fine.amount.toFixed(2)}
                    </p>
                    <span
                      className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        fine.status === "paid"
                          ? "bg-emerald-100 text-emerald-800"
                          : fine.status === "exempted"
                          ? "bg-indigo-100 text-indigo-800"
                          : fine.status === "waived"
                          ? "bg-slate-100 text-slate-600"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {fine.status}
                    </span>
                  </div>
                </div>
              ))
            ))}
        </div>
      </section>
    </div>
  );
}
