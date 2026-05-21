import { NextResponse } from "next/server";
import type { CredentialDocument, CredentialRole } from "@/lib/models/Credentials";
import Teacher from "@/lib/models/Teacher";
import SeniorTeacher from "@/lib/models/SeniorTeacher";
import { normalizeEmail } from "@/lib/auth/normalizeEmail";

function emailRegex(emailNorm: string) {
  const esc = emailNorm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return { $regex: new RegExp(`^${esc}$`, "i") };
}

export type RoleCheckResult =
  | { ok: true; credential: CredentialDocument }
  | { ok: false; response: NextResponse };

/**
 * Ensures credential role matches login portal; fixes common admin mismatches
 * (e.g. Senior Teacher staff record exists but credential was saved as teacher).
 */
export async function resolveLoginRole(
  credential: CredentialDocument,
  expectedRole: Extract<CredentialRole, "teacher" | "senior_teacher">,
): Promise<RoleCheckResult> {
  if (credential.role === expectedRole) {
    return { ok: true as const, credential };
  }

  const emailNorm = normalizeEmail(credential.email);

  if (expectedRole === "senior_teacher" && credential.role === "teacher") {
    const senior = await SeniorTeacher.findOne({ email: emailRegex(emailNorm) });
    if (senior) {
      credential.role = "senior_teacher";
      await credential.save();
      return { ok: true as const, credential };
    }
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          error:
            "This email is registered as a Teacher account. On login, select Teacher — or ask admin to create a Senior Teacher credential (Admin → Credentials → Senior Teachers tab).",
        },
        { status: 403 },
      ),
    };
  }

  if (expectedRole === "teacher" && credential.role === "senior_teacher") {
    const teacher = await Teacher.findOne({ email: emailRegex(emailNorm) });
    if (teacher) {
      return {
        ok: false as const,
        response: NextResponse.json(
          {
            error:
              "This email is registered as a Senior Teacher account. On login, select Senior Teacher.",
          },
          { status: 403 },
        ),
      };
    }
  }

  const label =
    credential.role === "senior_teacher"
      ? "Senior Teacher"
      : credential.role === "teacher"
        ? "Teacher"
        : "Student";

  return {
    ok: false as const,
    response: NextResponse.json(
      {
        error: `This account is registered as ${label}. Select ${label} on the login screen.`,
      },
      { status: 403 },
    ),
  };
}
