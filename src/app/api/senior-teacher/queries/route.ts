import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SeniorTeacher from "@/lib/models/SeniorTeacher";
import Query from "@/lib/models/Query";
import { createUserQuery } from "@/lib/queries/createQuery";
import { getCategoryLabel } from "@/lib/queries/queryCategories";
import { migrateAllQueriesCollections } from "@/lib/queries/queryAccess";
import { requireSeniorTeacherFromRequest } from "@/lib/auth/require-senior-teacher";
import {
  getSeniorTeacherProfileEditAccess,
  serializeSeniorTeacherQuery,
} from "@/lib/senior-teacher/seniorTeacherQueryAccess";
import { sendNewSeniorTeacherQueryEmails } from "@/lib/email/seniorTeacherQueryEmail";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSeniorTeacherFromRequest(request);
    if (!auth.ok) return (auth as { ok: false; response: import("next/server").NextResponse }).response;

    await dbConnect();
    await migrateAllQueriesCollections();
    const access = await getSeniorTeacherProfileEditAccess(auth.seniorTeacher.id);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10) || 10));
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      Query.find({ role: "senior_teacher", userId: auth.seniorTeacher.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Query.countDocuments({ role: "senior_teacher", userId: auth.seniorTeacher.id }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        queries: rows.map(r => serializeSeniorTeacherQuery(r)),
        latestQuery: access.latestQuery,
        canEditProfile: access.canEditProfile,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      },
    });
  } catch (e) {
    console.error("[senior-teacher/queries GET]", e);
    return NextResponse.json({ success: false, error: "Failed to load queries" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSeniorTeacherFromRequest(request);
    if (!auth.ok) return (auth as { ok: false; response: import("next/server").NextResponse }).response;

    const body = await request.json();
    await dbConnect();
    const senior = await SeniorTeacher.findById(auth.seniorTeacher.id);
    if (!senior) {
      return NextResponse.json({ success: false, error: "Senior teacher not found" }, { status: 404 });
    }

    const result = await createUserQuery({
      role: "senior_teacher",
      userId: auth.seniorTeacher.id,
      personName: senior.fullName,
      personEmail: senior.email,
      body,
      nameKey: "seniorTeacherName",
      emailKey: "seniorTeacherEmail",
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status ?? 422 },
      );
    }

    const doc = result.doc;
    const emailWarnings = await sendNewSeniorTeacherQueryEmails({
      seniorTeacherName: doc.personName,
      seniorTeacherEmail: doc.personEmail,
      category: getCategoryLabel(doc.category),
      remarks: doc.remarks,
    }).catch(err => {
      console.error("[senior-teacher/queries POST] email", err);
      return ["Email could not be sent — check SMTP settings"];
    });

    const access = await getSeniorTeacherProfileEditAccess(auth.seniorTeacher.id);

    return NextResponse.json(
      {
        success: true,
        message: "Query submitted successfully",
        data: {
          query: serializeSeniorTeacherQuery(doc),
          canEditProfile: access.canEditProfile,
          emailWarnings,
        },
      },
      { status: 201 },
    );
  } catch (e) {
    console.error("[senior-teacher/queries POST]", e);
    return NextResponse.json({ success: false, error: "Failed to submit query" }, { status: 500 });
  }
}
