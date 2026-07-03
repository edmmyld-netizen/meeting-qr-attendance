"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import QRModal from "@/components/QRModal";
import { Meeting } from "@/lib/types";

const STATUS_STYLE: Record<string, string> = {
  Upcoming: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  Active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  Closed: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

export default function MeetingsPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [search, setSearch] = useState("");
  const [qrMeeting, setQrMeeting] = useState<Meeting | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/meetings")
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setMeetings(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = meetings.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase()) ||
      m.department.toLowerCase().includes(search.toLowerCase())
  );

  async function updateStatus(m: Meeting, status: string) {
    setBusy(m.id);
    await fetch(`/api/meetings/${m.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    load();
  }

  async function remove(m: Meeting) {
    if (!confirm(`Delete "${m.name}" and all its attendance records?`)) return;
    setBusy(m.id);
    await fetch(`/api/meetings/${m.id}`, { method: "DELETE" });
    setBusy(null);
    load();
  }

  async function duplicate(m: Meeting) {
    setBusy(m.id);
    await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...m,
        name: `${m.name} (Copy)`,
        status: "Upcoming",
      }),
    });
    setBusy(null);
    load();
  }

  return (
    <Shell>
      {qrMeeting && <QRModal meeting={qrMeeting} onClose={() => setQrMeeting(null)} />}

      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 className="text-xl font-bold">Meetings ({meetings.length})</h1>
        <Link href="/dashboard/meetings/new" className="btn btn-primary">
          + Create New Meeting
        </Link>
      </div>

      <div className="card p-4 mb-4">
        <input
          className="input"
          placeholder="Search by meeting name, ID or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {!filtered.length && (
        <div className="card p-12 text-center text-slate-400">No meetings found</div>
      )}

      <div className="grid gap-4">
        {filtered.map((m) => (
          <div key={m.id} className="card p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold">{m.name}</h3>
                  <span className={`badge ${STATUS_STYLE[m.status]}`}>{m.status}</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {m.date} at {m.time}
                  {m.venue && ` • ${m.venue}`}
                  {m.department && ` • ${m.department}`}
                </p>
                <p className="text-xs font-mono text-slate-400 mt-1">{m.id}</p>
                {(m.attStart || m.attEnd) && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    Attendance window: {m.attStart || "—"} to {m.attEnd || "—"}
                  </p>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                <button className="btn btn-primary" onClick={() => setQrMeeting(m)}>
                  QR Code
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => router.push(`/dashboard/meetings/${m.id}`)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => duplicate(m)}
                  disabled={busy === m.id}
                >
                  Duplicate
                </button>
                {m.status !== "Closed" ? (
                  <button
                    className="btn btn-secondary"
                    onClick={() => updateStatus(m, "Closed")}
                    disabled={busy === m.id}
                  >
                    Close
                  </button>
                ) : (
                  <button
                    className="btn btn-success"
                    onClick={() => updateStatus(m, "Active")}
                    disabled={busy === m.id}
                  >
                    Reopen
                  </button>
                )}
                <button
                  className="btn btn-danger"
                  onClick={() => remove(m)}
                  disabled={busy === m.id}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}
