import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Credential, { type CredentialDocument } from "@/lib/models/Credentials";
import Student, { type StudentDocument } from "@/lib/models/Student";
import Teacher, { type TeacherDocument } from "@/lib/models/Teacher";
import SeniorTeacher, { type SeniorTeacherDocument } from "@/lib/models/SeniorTeacher";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";

export const runtime = "nodejs";

const allowedRoles = ["student", "teacher", "senior_teacher", "admin"] as const;

type SuperAdminCredentialRole = (typeof allowedRoles)[number];

type CredentialRow = {
  id: string;
  name: string;
  email: string;
  password?: string;
  mobileNumber?: string;
  role: "student" | "teacher" | "senior_teacher";
  accountStatus: "Active" | "Inactive";
  institutionName: string;
  createdAt: Date;
};

function getInstitutionNameForCredential(
  role: SuperAdminCredentialRole,
  email: string,
  studentMap: Map<string, StudentDocument | undefined>,
  teacherMap: Map<string, TeacherDocument | undefined>,
  seniorTeacherMap: Map<string, SeniorTeacherDocument | undefined>
) {
  const normalizedEmail = email.toLowerCase();

  if (role === "student") {
    const student = studentMap.get(normalizedEmail);
    if (student) {
      return (
        student.school?.trim() ||
        student.college?.trim() ||
        student.occupation?.trim() ||
        "Unknown"
      );
    }
  }

  if (role === "teacher") {
    const teacher = teacherMap.get(normalizedEmail);
    if (teacher) {
      return (
        teacher.schoolCollege?.trim() ||
        teacher.school?.trim() ||
        teacher.branchName?.trim() ||
        "Unknown"
      );
    }
  }

  if (role === "senior_teacher") {
    const seniorTeacher = seniorTeacherMap.get(normalizedEmail);
    if (seniorTeacher) {
      return (
        seniorTeacher.branchName?.trim() ||
        seniorTeacher.courseName?.trim() ||
        "Unknown"
      );
    }
  }

  return "Unknown";
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminFromRequest(request, "super-admin");
  if (!auth.ok) return auth.response;

  try {
    await dbConnect();
    const url = new URL(request.url);
    const roleParam = url.searchParams.get("role")?.trim();
    const searchParam = url.searchParams.get("search")?.trim();
    const normalizedSearch = searchParam ? searchParam.toLowerCase() : "";
    const institutionParam = url.searchParams.get("institution")?.trim().toLowerCase();

    if (roleParam && !allowedRoles.includes(roleParam as SuperAdminCredentialRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    if (roleParam === "admin") {
      return NextResponse.json({ credentials: [] });
    }

    const filter: Record<string, unknown> = {};
    if (roleParam) {
      filter.role = roleParam;
    }

    const credentials = await Credential.find(filter).sort({ createdAt: -1 }).lean<CredentialDocument[]>();
    const emails = credentials.map((doc) => String(doc.email || "").toLowerCase()).filter(Boolean);

    const [students, teachers, seniorTeachers] = await Promise.all([
      Student.find({ email: { $in: emails } }).lean<StudentDocument[]>(),
      Teacher.find({ email: { $in: emails } }).lean<TeacherDocument[]>(),
      SeniorTeacher.find({ email: { $in: emails } }).lean<SeniorTeacherDocument[]>(),
    ]);

    const studentMap = new Map(students.map((doc) => [String(doc.email || "").toLowerCase(), doc]));
    const teacherMap = new Map(teachers.map((doc) => [String(doc.email || "").toLowerCase(), doc]));
    const seniorTeacherMap = new Map(seniorTeachers.map((doc) => [String(doc.email || "").toLowerCase(), doc]));

    const rows: CredentialRow[] = credentials.map((doc) => ({
      id: doc._id.toString(),
      name: doc.name,
      email: doc.email,
      password: doc.password,
      mobileNumber: doc.mobileNumber,
      role: doc.role,
      accountStatus: doc.accountStatus,
      institutionName: getInstitutionNameForCredential(
        doc.role,
        doc.email,
        studentMap,
        teacherMap,
        seniorTeacherMap
      ),
      createdAt: doc.createdAt,
    }));

    const filteredRows = rows.filter((row) => {
      if (normalizedSearch) {
        const haystack = [row.name, row.email, row.mobileNumber || "", row.institutionName, row.role]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(normalizedSearch)) {
          return false;
        }
      }
      if (institutionParam) {
        return row.institutionName.toLowerCase().includes(institutionParam);
      }
      return true;
    });

    return NextResponse.json({ credentials: filteredRows });
  } catch (error) {
    console.error("Error fetching super-admin credentials:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
