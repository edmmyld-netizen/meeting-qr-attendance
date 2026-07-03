"use client";
import { useState } from "react";
import { Meeting } from "@/lib/types";

const EMPTY = {
  name: "",
  date: "",
  time: "",
  venue: "",
  organizer: "",
  department: "",
  description: "",
  status: "Upcoming",
  attStart: "",
  attEnd: "",
  requireGps: true,
  requireRemarks: false,
};

export default function MeetingForm({
  initial,
  onSubmit,
  submitLabel,
}: {
  initial?: Partial<Meeting>;
  onSubmit: (data: typeof EMPTY) => Promise<void>;
  submitLabel: string;
}) {
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.date || !form.time) {
      setError("Meeting Name, Date and Time are required.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4 max-w-3xl">
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm px-4 py-2.5">
          {error}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Meeting Name *</label>
          <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g., District Review Meeting" required />
        </div>

        <div>
          <label className="label">Meeting Date *</label>
          <input className="input" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} required />
        </div>
        <div>
          <label className="label">Meeting Time *</label>
          <input className="input" type="time" value={form.time} onChange={(e) => set("time", e.target.value)} required />
        </div>

        <div>
          <label className="label">Venue</label>
          <input className="input" value={form.venue} onChange={(e) => set("venue", e.target.value)} placeholder="e.g., Collectorate Hall" />
        </div>
        <div>
          <label className="label">Organizer</label>
          <input className="input" value={form.organizer} onChange={(e) => set("organizer", e.target.value)} placeholder="e.g., District Administration" />
        </div>

        <div>
          <label className="label">Department</label>
          <input className="input" value={form.department} onChange={(e) => set("department", e.target.value)} placeholder="e.g., Revenue" />
        </div>
        <div>
          <label className="label">Meeting Status</label>
          <select className="input" value={form.status} onChange={(e) => set("status", e.target.value)}>
            <option>Upcoming</option>
            <option>Active</option>
            <option>Closed</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="label">Meeting Description</label>
          <textarea className="input" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Agenda / details..." />
        </div>

        <div>
          <label className="label">Attendance Start Time</label>
          <input className="input" type="time" value={form.attStart} onChange={(e) => set("attStart", e.target.value)} />
        </div>
        <div>
          <label className="label">Attendance End Time</label>
          <input className="input" type="time" value={form.attEnd} onChange={(e) => set("attEnd", e.target.value)} />
        </div>

        <label className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3 cursor-pointer">
          <input type="checkbox" className="h-4 w-4 accent-gov-800" checked={form.requireGps} onChange={(e) => set("requireGps", e.target.checked)} />
          <span className="text-sm font-medium">Require GPS Location</span>
        </label>
        <label className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3 cursor-pointer">
          <input type="checkbox" className="h-4 w-4 accent-gov-800" checked={form.requireRemarks} onChange={(e) => set("requireRemarks", e.target.checked)} />
          <span className="text-sm font-medium">Require Remarks</span>
        </label>
      </div>

      <button className="btn btn-primary w-full sm:w-auto px-8" disabled={saving}>
        {saving ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
