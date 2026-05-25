import type { CredentialDocument } from "@/lib/models/Credentials";
import Credential from "@/lib/models/Credentials";
import { normalizeEmail } from "@/lib/auth/normalizeEmail";

/** Find credential by email (normalized + legacy case-insensitive fallback). */
export async function findCredentialByEmail(email: string): Promise<CredentialDocument | null> {
  const norm = normalizeEmail(email);
  const byNorm = await Credential.findOne({ email: norm });
  if (byNorm) return byNorm;

  const esc = norm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return Credential.findOne({ email: { $regex: new RegExp(`^${esc}$`, "i") } });
}

/** Find credential by email or username (login identifier). */
export async function findCredentialByLogin(identifier: string): Promise<CredentialDocument | null> {
  const trimmed = identifier.trim();
  if (!trimmed) return null;

  if (trimmed.includes("@")) {
    return findCredentialByEmail(trimmed);
  }

  const username = trimmed.toLowerCase();
  const byUsername = await Credential.findOne({ username });
  if (byUsername) return byUsername;

  const esc = username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return Credential.findOne({ username: { $regex: new RegExp(`^${esc}$`, "i") } });
}
