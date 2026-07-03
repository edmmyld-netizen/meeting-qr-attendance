import { NextRequest, NextResponse } from "next/server";
import { readDB, writeDB } from "@/lib/storage";
import { verifyToken } from "@/lib/auth";
import { isAttendanceOpen, todayStr, nowFullTime, detectBrowser, detectDevice } from "@/lib/utils";
import { AttendanceRecord } from "@/lib/types";

function authed(req: NextRequest): boolean {
  return verifyToken(req.cookies.get("mqa_token")?.value);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { meetingId, name, mobile, designation, department, remarks, latitude, longitude } = body;

  if (!meetingId || !name?.trim() || !mobile?.trim() || !designation?.trim() || !department?.trim()) {
    return NextResponse.json({ error: "All required fields must be filled" }, { status: 400 });
  }
  if (!/^\d{10}$/.test(mobile)) {
    return NextResponse.json({ error: "Mobile number must be 10 digits" }, { status: 400 });
  }

  const db = await readDB();
  const meeting = db.meetings.find((m) => m.id === meetingId);
  if (!meeting) return NextResponse.json({ error: "Invalid meeting" }, { status: 404 });

  const win = isAttendanceOpen(meeting);
  if (!win.open) return NextResponse.json({ error: win.reason || "Meeting Closed" }, { status: 403 });

  if (meeting.requireGps && (latitude == null || longitude == null)) {
    return NextResponse.json({ error: "Location is required for this meeting" }, { status: 400 });
  }
  if (meeting.requireRemarks && !remarks?.trim()) {
    return NextResponse.json({ error: "Remarks are required for this meeting" }, { status: 400 });
  }

  const dup = db.attendance.find((a) => a.meetingId === meetingId && a.mobile === mobile);
  if (dup) {
    return NextResponse.json(
      { error: "duplicate", message: "You have already marked your attendance for this meeting." },
      { status: 409 }
    );
  }

  const ua = req.headers.get("user-agent") || "";
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "";

  const record: AttendanceRecord = {
    id: `ATT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    meetingId,
    meetingName: meeting.name,
    meetingDate: meeting.date,
    meetingTime: meeting.time,
    name: name.trim(),
    mobile: mobile.trim(),
    designation: designation.trim(),
    department: department.trim(),
    remarks: (remarks || "").trim(),
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    browser: detectBrowser(ua),
    device: detectDevice(ua),
    ip,
    attDate: todayStr(),
    attTime: nowFullTime(),
    createdAt: new Date().toISOString(),
  };

  db.attendance.push(record);
  await writeDB(db);
  return NextResponse.json({ success: true, record });
}

export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await readDB();
  return NextResponse.json(db.attendance.slice().reverse());
}

export async function DELETE(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  const db = await readDB();
  db.attendance = db.attendance.filter((a) => a.id !== id);
  await writeDB(db);
  return NextResponse.json({ success: true });
}
