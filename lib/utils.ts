import { Meeting } from "./types";

export function todayStr(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD
}

export function nowTimeStr(): string {
  return new Date().toLocaleTimeString("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
  }); // HH:mm
}

export function nowFullTime(): string {
  return new Date().toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour12: true,
  });
}

export function genMeetingId(seq: number): string {
  const d = new Date();
  const ymd = d
    .toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
    .replace(/-/g, "");
  return `MTG-${ymd}-${String(seq).padStart(3, "0")}`;
}

/** Is attendance window open for this meeting right now? */
export function isAttendanceOpen(m: Meeting): { open: boolean; reason: string } {
  if (m.status === "Closed") return { open: false, reason: "Meeting Closed" };
  const today = todayStr();
  if (m.date !== today)
    return {
      open: false,
      reason: m.date > today ? "Meeting has not started yet" : "Meeting Closed",
    };
  const now = nowTimeStr();
  if (m.attStart && now < m.attStart)
    return { open: false, reason: `Attendance opens at ${m.attStart}` };
  if (m.attEnd && now > m.attEnd) return { open: false, reason: "Meeting Closed" };
  return { open: true, reason: "" };
}

export function detectDevice(ua: string): string {
  if (/mobile/i.test(ua)) return "Mobile";
  if (/tablet|ipad/i.test(ua)) return "Tablet";
  return "Desktop";
}

export function detectBrowser(ua: string): string {
  if (/edg/i.test(ua)) return "Edge";
  if (/chrome/i.test(ua)) return "Chrome";
  if (/safari/i.test(ua)) return "Safari";
  if (/firefox/i.test(ua)) return "Firefox";
  return "Other";
}
