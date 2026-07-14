import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import InventoryRequest from "@/lib/models/InventoryRequest";
import InventoryItem from "@/lib/models/InventoryItem";
import Student from "@/lib/models/Student";
import Teacher from "@/lib/models/Teacher";
import SeniorTeacher from "@/lib/models/SeniorTeacher";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();
    const requests = await InventoryRequest.find()
      .populate({ path: "items.itemId", model: InventoryItem, select: "itemName itemCode unit" })
      .sort({ createdAt: -1 })
      .lean();
      
    // Manually populate the requester since it's dynamic
    const studentIds = requests.filter(r => r.requesterType === "Student").map(r => r.requesterId);
    const teacherIds = requests.filter(r => r.requesterType === "Teacher").map(r => r.requesterId);
    const seniorTeacherIds = requests.filter(r => r.requesterType === "SeniorTeacher").map(r => r.requesterId);
    
    const [students, teachers, seniorTeachers] = await Promise.all([
      Student.find({ _id: { $in: studentIds } }).select("fullName").lean(),
      Teacher.find({ _id: { $in: teacherIds } }).select("fullName").lean(),
      SeniorTeacher.find({ _id: { $in: seniorTeacherIds } }).select("fullName").lean(),
    ]);

    const studentMap = new Map(students.map(s => [s._id.toString(), s.fullName]));
    const teacherMap = new Map(teachers.map(t => [t._id.toString(), t.fullName]));
    const seniorTeacherMap = new Map(seniorTeachers.map(st => [st._id.toString(), st.fullName]));

    const mappedRequests = requests.map((req: any) => {
      let requesterName = "Unknown";
      if (req.requesterType === "Student") requesterName = studentMap.get(req.requesterId.toString()) || "Unknown Student";
      else if (req.requesterType === "Teacher") requesterName = teacherMap.get(req.requesterId.toString()) || "Unknown Teacher";
      else if (req.requesterType === "SeniorTeacher") requesterName = seniorTeacherMap.get(req.requesterId.toString()) || "Unknown Senior Teacher";

      return {
        ...req,
        requesterName,
      };
    });

    return NextResponse.json({ success: true, requests: mappedRequests });
  } catch (error: any) {
    console.error("Error fetching requests:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch requests" }, { status: 500 });
  }
}
