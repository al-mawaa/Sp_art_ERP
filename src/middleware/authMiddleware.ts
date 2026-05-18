import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/jwt";

const ADMIN_LOGIN_PATH = "/login";
const ADMIN_DASHBOARD_PREFIX = "/admin";

/** Routes that require a valid admin JWT cookie */
export function isAdminProtectedPath(pathname: string): boolean {
  return pathname === ADMIN_DASHBOARD_PREFIX || pathname.startsWith(`${ADMIN_DASHBOARD_PREFIX}/`);
}

/** Public routes (login, static assets handled by matcher) */
export function isPublicPath(pathname: string): boolean {
  return pathname === ADMIN_LOGIN_PATH || pathname.startsWith("/api/admin/login");
}

export async function authMiddleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (!isAdminProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE)?.value;

  if (!token) {
    return redirectToLogin(request);
  }

  const admin = await verifyAdminToken(token);
  if (!admin || admin.role !== "admin") {
    const response = redirectToLogin(request);
    response.cookies.delete(ADMIN_COOKIE);
    return response;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-admin-id", admin.id);
  requestHeaders.set("x-admin-email", admin.email);
  requestHeaders.set("x-admin-role", admin.role);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

function redirectToLogin(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = ADMIN_LOGIN_PATH;
  url.searchParams.set("from", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

/** Use in API route handlers to require admin cookie */
export async function requireAdminFromRequest(
  request: NextRequest,
): Promise<{ ok: true; admin: { id: string; email: string; role: "admin" } } | { ok: false; response: NextResponse }> {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const admin = await verifyAdminToken(token);
  if (!admin) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid or expired session" }, { status: 401 }),
    };
  }

  return { ok: true, admin };
}
