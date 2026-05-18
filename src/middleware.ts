import { NextRequest } from "next/server";
import { authMiddleware } from "@/middleware/authMiddleware";

export async function middleware(request: NextRequest) {
  return authMiddleware(request);
}

export const config = {
  matcher: ["/admin/:path*"],
};
