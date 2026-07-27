import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Student from "@/lib/models/Student";
import SeniorTeacher from "@/lib/models/SeniorTeacher";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();

    // Fetch latest 5 students as CRM leads
    const students = await Student.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Enrich with assigned staff (Senior Teacher who created the student)
    const leads = await Promise.all(
      students.map(async (student) => {
        let assignedStaff = "Unassigned";
        if (student.createdBy) {
          const seniorTeacher = await SeniorTeacher.findById(student.createdBy).lean();
          if (seniorTeacher) {
            assignedStaff = seniorTeacher.fullName || "Staff";
          }
        }

        return {
          id: student._id?.toString() || "",
          name: student.fullName || "Unknown",
          source: student.howYouKnowUs || "Unknown",
          assignedStaff,
          status: student.feeStatus === "Paid" ? "Enrolled" : "Lead",
          followUpDate: student.createdAt ? new Date(student.createdAt).toISOString().split('T')[0] : "",
          phone: student.phone || "",
        };
      })
    );

    return NextResponse.json({ success: true, leads });
  } catch (error: any) {
    console.error("Error fetching CRM leads:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch CRM leads" }, { status: 500 });
  }
}
