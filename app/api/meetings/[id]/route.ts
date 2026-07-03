import { NextRequest, NextResponse } from "next/server";
import { readDB, writeDB } from "@/lib/storage";
import { verifyToken } from "@/lib/auth";
import { isAttendanceOpen } from "@/lib/utils";

function authed(req: NextRequest): boolean {
  return verifyToken(req.cookies.get("mqa_token")?.value);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await readDB();
  const meeting = db.meetings.find((m) => m.id === id);
  if (!meeting) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  const win = isAttendanceOpen(meeting);
  // Public info only (for the attendance page)
  return NextResponse.json({
    id: meeting.id,
    name: meeting.name,
    date: meeting.date,
    time: meeting.time,
    venue: meeting.venue,
    department: meeting.department,
    requireGps: meeting.requireGps,
    requireRemarks: meeting.requireRemarks,
    open: win.open,
    reason: win.reason,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!authed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const db = await readDB();
  const idx = db.meetings.findIndex((m) => m.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  db.meetings[idx] = { ...db.meetings[idx], ...body, id }; // id immutable
  await writeDB(db);
  return NextResponse.json(db.meetings[idx]);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!authed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const db = await readDB();
  db.meetings = db.meetings.filter((m) => m.id !== id);
  db.attendance = db.attendance.filter((a) => a.meetingId !== id);
  await writeDB(db);
  return NextResponse.json({ success: true });
}
