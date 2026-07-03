import { NextRequest, NextResponse } from "next/server";
import { readDB, writeDB } from "@/lib/storage";
import { verifyToken } from "@/lib/auth";
import { genMeetingId } from "@/lib/utils";
import { Meeting } from "@/lib/types";

function authed(req: NextRequest): boolean {
  return verifyToken(req.cookies.get("mqa_token")?.value);
}

export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await readDB();
  return NextResponse.json(db.meetings.slice().reverse());
}

export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.name || !body.date || !body.time) {
    return NextResponse.json({ error: "Name, date and time are required" }, { status: 400 });
  }
  const db = await readDB();
  db.seq += 1;
  const meeting: Meeting = {
    id: genMeetingId(db.seq),
    name: body.name.trim(),
    date: body.date,
    time: body.time,
    venue: body.venue || "",
    organizer: body.organizer || "",
    department: body.department || "",
    description: body.description || "",
    status: body.status || "Upcoming",
    attStart: body.attStart || "",
    attEnd: body.attEnd || "",
    requireGps: Boolean(body.requireGps),
    requireRemarks: Boolean(body.requireRemarks),
    createdAt: new Date().toISOString(),
  };
  db.meetings.push(meeting);
  await writeDB(db);
  return NextResponse.json(meeting);
}
