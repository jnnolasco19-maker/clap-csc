"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ShieldCheck, Smartphone } from "lucide-react";
import StudentView from "@/components/StudentView";
import OfficerView from "@/components/OfficerView";
import type { AppStateResponse, Role, SettlementType } from "@/lib/types";

export default function HomePage() {
  const [role, setRole] = useState<Role>("student");
  const [studentId, setStudentId] = useState<string>("stu-1");
  const [activeOfficerId, setActiveOfficerId] = useState<string>("off-1");
  const [state, setState] = useState<AppStateResponse | null>(null);
  const [busy, setBusy] = useState(false);

  const activeOfficer =
    state?.officers.find((o) => o.id === activeOfficerId) ??
    state?.officers[0];
  const officerName = activeOfficer?.name ?? "Officer Bautista";
  const [toast, setToast] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const lastCalledTicketRef = useRef<number | null>(null);

  const showToast = (type: "ok" | "err", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/state?studentId=${studentId}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as AppStateResponse;
      setState(data);

      if (
        data.myTicket?.status === "called" &&
        lastCalledTicketRef.current !== data.myTicket.ticketNumber
      ) {
        lastCalledTicketRef.current = data.myTicket.ticketNumber;
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate([200, 100, 200]);
        }
      }
    } catch {
      // Ignore transient poll errors
    }
  }, [studentId]);

  useEffect(() => {
    fetchState();
    const timer = setInterval(fetchState, 2500);
    return () => clearInterval(timer);
  }, [fetchState]);

  const postJson = async (url: string, body: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("err", data.error ?? "Action failed");
        return null;
      }
      setState(data as AppStateResponse);
      return data;
    } finally {
      setBusy(false);
    }
  };

  const handleClockAction = async (
    action: "clock_in" | "clock_out",
    note?: string
  ) => {
    const res = await postJson("/api/officers", {
      action,
      officerId: activeOfficer?.id ?? activeOfficerId,
      note,
      activeStudentId: studentId,
    });
    if (res) {
      showToast(
        "ok",
        action === "clock_in"
          ? `${officerName} timed IN.`
          : `${officerName} timed OUT.`
      );
    }
  };

  const handleAddOfficer = async (name: string, roleTitle: string) => {
    const res = await postJson("/api/officers", {
      action: "add_officer",
      name,
      roleTitle,
      activeStudentId: studentId,
    });
    if (res?.addedOfficer) {
      setActiveOfficerId(res.addedOfficer.id);
      showToast("ok", `Added ${res.addedOfficer.name}.`);
    }
  };

  const handleJoinQueue = async () => {
    const res = await postJson("/api/queue", { action: "join", studentId });
    if (res) showToast("ok", "Joined the online clearance queue!");
  };

  const handleCancelQueue = async (ticketId: string) => {
    const res = await postJson("/api/queue", {
      action: "cancel",
      studentId,
      ticketId,
    });
    if (res) showToast("ok", "Left the queue.");
  };

  const handleOfficerQueue = async (
    action: string,
    extra?: {
      ticketId?: string;
      chairCapacity?: number;
      actionNote?: string;
      mode?: "single" | "fill";
    }
  ) => {
    const res = await postJson("/api/queue", {
      action,
      studentId,
      handledBy: officerName,
      ...extra,
    });
    if (res) showToast("ok", "Queue updated.");
  };

  const handleCheckIn = async (eventId: string, studentNumberOrId: string) => {
    const res = await postJson("/api/events", {
      action: "checkin",
      eventId,
      studentNumberOrId,
      activeStudentId: studentId,
    });
    if (res) {
      showToast(
        "ok",
        `${res.checkedInStudent} marked ${String(
          res.checkedInStatus
        ).toUpperCase()}`
      );
    }
  };

  const handleFinalizeEvent = async (eventId: string) => {
    const res = await postJson("/api/events", {
      action: "finalize",
      eventId,
      activeStudentId: studentId,
    });
    if (res) {
      showToast(
        "ok",
        `Event finalized. ${res.absentCount} absent student(s) billed.`
      );
    }
  };

  const handleCreateEvent = async (payload: {
    title: string;
    venue: string;
    attendanceStart: string;
    attendanceEnd: string;
    gracePeriodMins: number;
    absentFine: number;
    lateFine: number;
  }) => {
    const res = await postJson("/api/events", {
      action: "create",
      ...payload,
      activeStudentId: studentId,
    });
    if (res) showToast("ok", "Event schedule created!");
  };

  const handleFineAction = async (
    action: "pay" | "waive" | "exempt",
    fineId: string,
    settlementType?: SettlementType,
    settlementItem?: string
  ) => {
    const res = await postJson("/api/fines", {
      action,
      fineId,
      settlementType,
      settlementItem,
      settledBy: officerName,
      activeStudentId: studentId,
    });
    if (res) {
      showToast(
        "ok",
        action === "pay"
          ? `Settled (${settlementItem ?? "Paid"}).`
          : "Fine updated."
      );
    }
  };

  const handleSetParticipant = async (
    targetStudentId: string,
    isParticipant: boolean,
    participantNote?: string
  ) => {
    const res = await postJson("/api/students", {
      action: "set_participant",
      targetStudentId,
      isParticipant,
      participantNote,
      handledBy: officerName,
      activeStudentId: studentId,
    });
    if (res) {
      showToast(
        "ok",
        isParticipant
          ? "Marked as Participant (Exempted & Cleared)."
          : "Participant exemption removed."
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-12">
      {/* Mobile-First Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-md mx-auto px-4 py-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-black tracking-tight text-indigo-700">
                CLAP-CSC
              </h1>
              <p className="text-[11px] text-slate-500">
                CET Clearance, Line & Attendance Portal
              </p>
            </div>
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              <button
                onClick={() => setRole("student")}
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer ${
                  role === "student"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> Student
              </button>
              <button
                onClick={() => setRole("officer")}
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer ${
                  role === "officer"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Officer
              </button>
            </div>
          </div>

          {/* Demo Student Switcher */}
          {role === "student" && state && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 shrink-0">Viewing as:</span>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-800"
              >
                {state.students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.studentId} • {s.course})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </header>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-sm">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg text-xs font-semibold text-white text-center ${
              toast.type === "ok" ? "bg-slate-900" : "bg-rose-600"
            }`}
          >
            {toast.text}
          </div>
        </div>
      )}

      {/* Main Mobile Container */}
      <main className="max-w-md mx-auto px-4 pt-4">
        {!state ? (
          <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 border border-slate-200">
            Loading CLAP-CSC...
          </div>
        ) : role === "student" ? (
          <StudentView
            state={state}
            onJoinQueue={handleJoinQueue}
            onCancelQueue={handleCancelQueue}
            busy={busy}
          />
        ) : (
          <OfficerView
            state={state}
            activeOfficerId={activeOfficer?.id ?? activeOfficerId}
            onOfficerChange={setActiveOfficerId}
            onClockAction={handleClockAction}
            onAddOfficer={handleAddOfficer}
            onQueueAction={handleOfficerQueue}
            onCheckIn={handleCheckIn}
            onFinalizeEvent={handleFinalizeEvent}
            onCreateEvent={handleCreateEvent}
            onFineAction={handleFineAction}
            onSetParticipant={handleSetParticipant}
            busy={busy}
          />
        )}
      </main>
    </div>
  );
}
