import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, checkPassword, cookieMaxAge, signToken } from "@/lib/auth";
import { features } from "@/lib/env";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!features.admin) {
    return NextResponse.json({ ok: false, error: "Admin is not configured." }, { status: 503 });
  }
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
  if (!rateLimit(`login:${ip}`, 8, 60_000).ok) {
    return NextResponse.json({ ok: false, error: "Too many attempts." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  if (!checkPassword(String(body.password || ""))) {
    return NextResponse.json({ ok: false, error: "Incorrect password." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, signToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: cookieMaxAge,
  });
  return res;
}
