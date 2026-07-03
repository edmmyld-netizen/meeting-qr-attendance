import { NextRequest, NextResponse } from "next/server";
import { checkCredentials, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!checkCredentials(username, password)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const token = signToken(username);
  const res = NextResponse.json({ success: true });
  res.cookies.set("mqa_token", token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 12 * 60 * 60,
    path: "/",
  });
  return res;
}
