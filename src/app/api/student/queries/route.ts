import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireStudentFromRequest } from "@/lib/auth/require-student";
import { findStudentById } from "@/lib/student-portal";
import Query from "@/lib/models/Query";
import { createUserQuery } from "@/lib/queries/createQuery";
import { getCategoryLabel } from "@/lib/queries/queryCategories";
import {
  getStudentProfileEditAccess,
  migrateAllQueriesCollections,
  serializeStudentQuery,
} from "@/lib/student/studentQueryAccess";
import { sendNewStudentQueryEmails } from "@/lib/email/queryEmail";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireStudentFromRequest(request);
    if (!auth.ok) return (auth as { ok: false; response: import("next/server").NextResponse }).response;

    await dbConnect();
    await migrateAllQueriesCollections();
    const access = await getStudentProfileEditAccess(auth.student.id);
    const rows = await Query.find({ role: "student", userId: auth.student.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return apiSuccess({
      queries: rows.map(r => serializeStudentQuery(r)),
      latestQuery: access.latestQuery,
      canEditProfile: access.canEditProfile,
    });
  } catch (e) {
    console.error("[student/queries GET]", e);
    return apiError("Failed to load queries", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireStudentFromRequest(request);
    if (!auth.ok) return (auth as { ok: false; response: import("next/server").NextResponse }).response;

    const body = await request.json();
    await dbConnect();
    const student = await findStudentById(auth.student.id);
    if (!student) return apiError("Student not found", 404);

    const result = await createUserQuery({
      role: "student",
      userId: auth.student.id,
      personName: student.fullName,
      personEmail: student.email,
      body,
      nameKey: "studentName",
      emailKey: "studentEmail",
    });

    if (!result.ok) {
      return apiError(result.error, result.status ?? 422);
    }

    const doc = result.doc;
    const emailWarnings = await sendNewStudentQueryEmails({
      studentName: doc.personName,
      studentEmail: doc.personEmail,
      category: getCategoryLabel(doc.category),
      remarks: doc.remarks,
    }).catch(err => {
      console.error("[student/queries POST] email", err);
      return ["Email could not be sent — check SMTP settings"];
    });

    const access = await getStudentProfileEditAccess(auth.student.id);

    return apiSuccess(
      {
        query: serializeStudentQuery(doc),
        canEditProfile: access.canEditProfile,
        emailWarnings,
      },
      { message: "Query submitted successfully", status: 201 },
    );
  } catch (e) {
    console.error("[student/queries POST]", e);
    return apiError("Failed to submit query", 500);
  }
}
