"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface MeetingInfo {
  id: string;
  name: string;
  date: string;
  time: string;
  venue: string;
  department: string;
  requireGps: boolean;
  requireRemarks: boolean;
  open: boolean;
  reason: string;
}

type Status = "loading" | "form" | "success" | "duplicate" | "closed" | "notfound";

export default function AttendanceFormPage() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const [meeting, setMeeting] = useState<MeetingInfo | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [form, setForm] = useState({ name: "", mobile: "", designation: "", department: "", remarks: "" });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gps, setGps] = useState<"idle" | "locating" | "got" | "denied">("idle");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ name: string; time: string } | null>(null);

  useEffect(() => {
    fetch(`/api/meetings/${meetingId}`)
      .then((r) => {
        if (r.status === 404) { setStatus("notfound"); return null; }
        return r.json();
      })
      .then((m: MeetingInfo | null) => {
        if (!m) return;
        setMeeting(m);
        if (!m.open) { setStatus("closed"); return; }
        setStatus("form");
        if (m.requireGps) requestLocation();
      })
      .catch(() => setStatus("notfound"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId]);

  function requestLocation() {
    setGps("locating");
    if (!navigator.geolocation) { setGps("denied"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGps("got"); },
      () => setGps("denied"),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.mobile.trim() || !form.designation.trim() || !form.department.trim()) {
      setError("Please fill in all required fields."); return;
    }
    if (!/^\d{10}$/.test(form.mobile)) { setError("Mobile number must be exactly 10 digits."); return; }
    if (meeting?.requireGps && !coords) {
      setError("Location permission is required. Please allow location access and retry."); return;
    }
    if (meeting?.requireRemarks && !form.remarks.trim()) { setError("Remarks are required for this meeting."); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId,
          ...form,
          latitude: coords?.lat ?? null,
          longitude: coords?.lng ?? null,
        }),
      });
      const data = await res.json();
      if (res.status === 409) { setStatus("duplicate"); return; }
      if (res.status === 403) { setMeeting((m) => (m ? { ...m, reason: data.error } : m)); setStatus("closed"); return; }
      if (!res.ok) { setError(data.error || "Submission failed."); return; }
      setSuccessData({ name: form.name, time: data.record.attTime });
      setStatus("success");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const Header = () => (
    <div className="bg-gov-800 text-white text-center py-5 px-4">
      <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-white/15 flex items-center justify-center font-bold">
        QR
      </div>
      <h1 className="font-bold">Meeting Attendance</h1>
      {meeting && <p className="text-xs opacity-80 mt-0.5">{meeting.name}</p>}
    </div>
  );

  const Wrap = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-gradient-to-b from-gov-50 to-gov-100 dark:from-slate-950 dark:to-slate-900">
      <Header />
      <div className="mx-auto max-w-md p-4 -mt-2">{children}</div>
    </div>
  );

  if (status === "loading")
    return (
      <Wrap>
        <div className="card p-10 text-center text-slate-400">Loading meeting details...</div>
      </Wrap>
    );

  if (status === "notfound")
    return (
      <Wrap>
        <div className="card p-10 text-center">
          <div className="text-5xl mb-3">❓</div>
          <h2 className="font-bold text-lg mb-2">Invalid Meeting</h2>
          <p className="text-sm text-slate-500">This QR code is not valid. Please contact the organizer.</p>
        </div>
      </Wrap>
    );

  if (status === "closed")
    return (
      <Wrap>
        <div className="card p-10 text-center">
          <div className="text-5xl mb-3">🔒</div>
          <h2 className="font-bold text-lg mb-2">Meeting Closed</h2>
          <p className="text-sm text-slate-500">{meeting?.reason || "Attendance is not open for this meeting."}</p>
        </div>
      </Wrap>
    );

  if (status === "duplicate")
    return (
      <Wrap>
        <div className="card p-10 text-center">
          <div className="text-5xl mb-3">⚠️</div>
          <h2 className="font-bold text-lg mb-2">Already Registered</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
            You have already marked your attendance for this meeting.
          </p>
        </div>
      </Wrap>
    );

  if (status === "success")
    return (
      <Wrap>
        <div className="card p-8 text-center">
          <div className="text-6xl mb-3">✅</div>
          <h2 className="font-bold text-xl text-emerald-700 dark:text-emerald-400 mb-1">
            Attendance Submitted Successfully
          </h2>
          <p className="font-semibold mt-3">{successData?.name}</p>
          <p className="text-sm text-slate-500">{meeting?.name}</p>
          <div className="mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300">
            <p>Time: {successData?.time}</p>
            {coords && (
              <p className="mt-1 text-xs">
                Location: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </p>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-5">You may close this page.</p>
        </div>
      </Wrap>
    );

  return (
    <Wrap>
      <div className="card p-6">
        <div className="rounded-xl bg-gov-50 dark:bg-slate-800 border border-gov-100 dark:border-slate-700 px-4 py-3 mb-5 text-sm">
          <p className="font-semibold text-gov-800 dark:text-gov-100">{meeting?.name}</p>
          <p className="text-slate-500 text-xs mt-0.5">
            {meeting?.date} at {meeting?.time}
            {meeting?.venue && ` • ${meeting.venue}`}
          </p>
        </div>

        {meeting?.requireGps && (
          <div
            className={`rounded-lg px-4 py-2.5 text-sm mb-4 flex items-center justify-between gap-2 ${
              gps === "got"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                : gps === "denied"
                ? "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
                : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
            }`}
          >
            <span>
              {gps === "got" && "Location captured"}
              {gps === "locating" && "Getting your location..."}
              {gps === "denied" && "Location access denied"}
              {gps === "idle" && "Location pending"}
            </span>
            {gps === "denied" && (
              <button onClick={requestLocation} className="text-xs font-semibold underline">
                Retry
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm px-4 py-2.5 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Your full name" required />
          </div>
          <div>
            <label className="label">Mobile Number *</label>
            <input
              className="input"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={form.mobile}
              onChange={(e) => set("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="10-digit mobile number"
              required
            />
          </div>
          <div>
            <label className="label">Designation *</label>
            <input className="input" value={form.designation} onChange={(e) => set("designation", e.target.value)} placeholder="e.g., Assistant, VAO, Manager" required />
          </div>
          <div>
            <label className="label">Department *</label>
            <input className="input" value={form.department} onChange={(e) => set("department", e.target.value)} placeholder="e.g., Revenue, Health" required />
          </div>
          <div>
            <label className="label">Remarks {meeting?.requireRemarks ? "*" : "(Optional)"}</label>
            <textarea className="input" rows={2} value={form.remarks} onChange={(e) => set("remarks", e.target.value)} placeholder="Any remarks..." />
          </div>

          <button className="btn btn-primary w-full py-3 text-base" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Attendance"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-4">
          Your data is stored securely for official records only.
        </p>
      </div>
    </Wrap>
  );
}
