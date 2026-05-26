import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireStudentFromRequest } from "@/lib/auth/require-student";
import { findStudentById } from "@/lib/student-portal";
import {
  applyCourseFilters,
  courseFilterMeta,
  findCatalogCoursesForStudent,
  type CourseListFilters,
} from "@/lib/student/studentCourses";
import { getPublicRazorpayKeyId } from "@/lib/razorpay/server";

export const runtime = "nodejs";

function parseFilters(searchParams: URLSearchParams): CourseListFilters {
  return {
    search: (searchParams.get("search") || "").trim().toLowerCase(),
    status: (searchParams.get("status") || "").trim(),
    teacher: (searchParams.get("teacher") || "").trim().toLowerCase(),
    batch: (searchParams.get("batch") || "").trim().toLowerCase(),
    paymentStatus: (searchParams.get("paymentStatus") || "").trim().toLowerCase(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireStudentFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();
    const student = await findStudentById(auth.student.id);
    if (!student) return apiError("Student not found", 404);

    const courses = await findCatalogCoursesForStudent(student);
    const { searchParams } = new URL(request.url);
    const filtered = applyCourseFilters(courses, parseFilters(searchParams));

    return apiSuccess({
      courses: filtered,
      count: filtered.length,
      filters: courseFilterMeta(filtered),
      razorpayKeyId: getPublicRazorpayKeyId(),
    });
  } catch (e) {
    console.error("[student/courses GET]", e);
    return apiError("Failed to load courses", 500);
  }
}
