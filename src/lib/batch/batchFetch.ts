import { adminSessionAuthHeaders } from "@/lib/auth/admin-session-client";

/** Fetch batch APIs with cookies + admin Bearer token fallback. */
export function batchFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  const auth = adminSessionAuthHeaders();
  for (const [k, v] of Object.entries(auth)) {
    if (!headers.has(k)) headers.set(k, v);
  }
  return fetch(input, {
    ...init,
    credentials: init?.credentials ?? "include",
    headers,
  });
}
