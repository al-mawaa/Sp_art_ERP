import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SeniorTeacher from "@/lib/models/SeniorTeacher";
import SeniorTeacherLeave from "@/lib/models/SeniorTeacherLeave";
import { requireSeniorTeacherFromRequest } from "@/lib/auth/require-senior-teacher";
import {
  countLeaveDays,
  getOrCreateSeniorBalance,
  serializeSeniorLeave,
} from "@/lib/leave/seniorTeacherUtils";
import { balanceKeyForType } from "@/lib/leave/utils";
import { getAdminNotifyEmails, sendSeniorTeacherNewLeaveEmails } from "@/lib/leave/leaveEmail";
import type { LeaveType } from "@/lib/models/Leave";

export const runtime = "nodejs";

const LEAVE_TYPES: LeaveType[] = ["Casual", "Sick", "Personal"];

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSeniorTeacherFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();
    const [leaves, balance] = await Promise.all([
      SeniorTeacherLeave.find({ seniorTeacherId: auth.seniorTeacher.id }).sort({ createdAt: -1 }),
      getOrCreateSeniorBalance(auth.seniorTeacher.id),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        leaves: leaves.map(serializeSeniorLeave),
        balance: { casual: balance.casual, sick: balance.sick, personal: balance.personal },
      },
    });
  } catch (e) {
    console.error("[senior-teacher/leaves GET]", e);
    return NextResponse.json({ success: false, error: "Failed to load leaves" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSeniorTeacherFromRequest(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const leaveType = (body.leaveType || body.type || "").trim() as LeaveType;
    const fromDate = (body.fromDate || body.from || "").trim();
    const toDate = (body.toDate || body.to || "").trim();
    const reason = (body.reason || "").trim();

    if (!LEAVE_TYPES.includes(leaveType)) {
      return NextResponse.json({ success: false, error: "Invalid leave type" }, { status: 400 });
    }
    if (!fromDate || !toDate) {
      return NextResponse.json({ success: false, error: "From and To dates are required" }, { status: 400 });
    }
    if (fromDate > toDate) {
      return NextResponse.json({ success: false, error: "From date cannot be after To date" }, { status: 400 });
    }

    await dbConnect();
    const senior = await SeniorTeacher.findById(auth.seniorTeacher.id);
    if (!senior) {
      return NextResponse.json({ success: false, error: "Senior teacher not found" }, { status: 404 });
    }

    const daysCount = countLeaveDays(fromDate, toDate);
    const balance = await getOrCreateSeniorBalance(auth.seniorTeacher.id);
    const balanceKey = balanceKeyForType(leaveType);
    if (balance[balanceKey] < daysCount) {
      return NextResponse.json(
        {
          success: false,
          error: `Not enough ${leaveType} leave balance. You have ${balance[balanceKey]} day(s) remaining.`,
        },
        { status: 400 },
      );
    }

    const doc = await SeniorTeacherLeave.create({
      seniorTeacherId: senior._id,
      seniorTeacherName: senior.fullName,
      seniorTeacherEmail: (senior.email || "").toLowerCase(),
      leaveType,
      fromDate,
      toDate,
      reason: reason || "—",
      status: "Pending",
      adminRemark: "",
      daysCount,
    });

    const notifyEmails = [...getAdminNotifyEmails()];
    const emailFields = {
      seniorTeacherName: doc.seniorTeacherName,
      leaveType: doc.leaveType,
      fromDate: doc.fromDate,
      toDate: doc.toDate,
      reason: doc.reason,
      status: "Pending",
    };

    let emailWarning: string | undefined;
    try {
      const failed = await sendSeniorTeacherNewLeaveEmails(emailFields, notifyEmails);
      if (failed.length) emailWarning = "Leave saved; some notification emails could not be sent.";
    } catch (err) {
      console.error("[senior-teacher/leaves email]", err);
      emailWarning = "Leave saved; email notification failed.";
    }

    return NextResponse.json({
      success: true,
      data: { leave: serializeSeniorLeave(doc) },
      message: emailWarning || "Leave request submitted successfully",
    });
  } catch (e) {
    console.error("[senior-teacher/leaves POST]", e);
    return NextResponse.json({ success: false, error: "Failed to submit leave request" }, { status: 500 });
  }
}
