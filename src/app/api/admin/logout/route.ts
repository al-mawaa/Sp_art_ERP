import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/jwt";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out successfully" });
  response.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
