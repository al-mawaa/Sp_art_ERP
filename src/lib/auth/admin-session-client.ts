const STORAGE_KEY = "lba_admin_session_token";

export function setAdminSessionToken(token: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, token);
}

export function clearAdminSessionToken() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export function getAdminSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(STORAGE_KEY);
}

/** Headers for batch/admin APIs when cookie may not be sent (localhost / strict browsers). */
export function adminSessionAuthHeaders(): Record<string, string> {
  const token = getAdminSessionToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
