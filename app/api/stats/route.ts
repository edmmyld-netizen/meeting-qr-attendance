import { NextRequest, NextResponse } from "next/server";
import { readDB } from "@/lib/storage";
import { verifyToken } from "@/lib/auth";
import { todayStr } from "@/lib/utils";

export async function GET(req: NextRequest) {
  if (!verifyToken(req.cookies.get("mqa_token")?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = await readDB();
  const today = todayStr();

  const byDept: Record<string, number> = {};
  const byMeeting: Record<string, number> = {};
  const trend: Record<string, number> = {};

  for (const a of db.attendance) {
    byDept[a.department] = (byDept[a.department] || 0) + 1;
    byMeeting[a.meetingName] = (byMeeting[a.meetingName] || 0) + 1;
    trend[a.attDate] = (trend[a.attDate] || 0) + 1;
  }

  return NextResponse.json({
    totalMeetings: db.meetings.length,
    todaysMeetings: db.meetings.filter((m) => m.date === today).length,
    totalAttendance: db.attendance.length,
    presentToday: db.attendance.filter((a) => a.attDate === today).length,
    byDept,
    byMeeting,
    trend: Object.entries(trend).sort((a, b) => a[0].localeCompare(b[0])).slice(-14),
    recent: db.attendance.slice(-5).reverse(),
  });
}
