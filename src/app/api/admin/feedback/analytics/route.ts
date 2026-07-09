import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/require-admin";
import dbConnect from "@/lib/mongodb";
import StudentFeedback from "@/lib/models/StudentFeedback";
import Teacher from "@/lib/models/Teacher";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();

    // 1. Get Teacher Analytics via Aggregation
    const teacherStats = await StudentFeedback.aggregate([
      {
        $group: {
          _id: "$teacherId",
          totalFeedback: { $sum: 1 },
          averageRating: { $avg: "$overallRating" },
          positiveFeedback: {
            $sum: { $cond: [{ $gte: ["$overallRating", 4] }, 1, 0] }
          },
          negativeFeedback: {
            $sum: { $cond: [{ $lte: ["$overallRating", 2] }, 1, 0] }
          },
        }
      }
    ]);

    // Populate teacher details
    const populatedTeacherStats = await Teacher.populate(teacherStats, { path: "_id", select: "fullName" });

    type TeacherStatRaw = {
      _id?: { _id: string; fullName: string };
      totalFeedback: number;
      averageRating: number;
      positiveFeedback: number;
      negativeFeedback: number;
    };

    const formattedTeacherStats = (populatedTeacherStats as unknown[]).map((stat) => {
      const s = stat as TeacherStatRaw;
      return {
        teacherId: s._id?._id,
        teacherName: s._id?.fullName || "Unknown",
        totalFeedback: s.totalFeedback,
        averageRating: parseFloat(s.averageRating.toFixed(1)),
        positiveFeedback: s.positiveFeedback,
        negativeFeedback: s.negativeFeedback,
      };
    }).filter(t => t.teacherId); // Filter out any null teachers

    // Top and Bottom Rated Teachers
    const sortedTeachers = [...formattedTeacherStats].sort((a, b) => b.averageRating - a.averageRating);
    const topTeachers = sortedTeachers.slice(0, 5);
    const lowestTeachers = sortedTeachers.filter(t => t.totalFeedback >= 3).reverse().slice(0, 5); // Minimum 3 feedback to be "lowest"

    // 2. Monthly Trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrends = await StudentFeedback.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          averageRating: { $avg: "$overallRating" },
          totalFeedback: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // 3. Category Distribution
    const categoryStats = await StudentFeedback.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          averageRating: { $avg: "$overallRating" }
        }
      },
      { $sort: { count: -1 } }
    ]);

    return NextResponse.json({
      success: true,
      teacherStats: sortedTeachers,
      topTeachers,
      lowestTeachers,
      monthlyTrends: monthlyTrends.map(m => ({ month: m._id, averageRating: parseFloat(m.averageRating.toFixed(1)), totalFeedback: m.totalFeedback })),
      categoryStats: categoryStats.map(c => ({ category: c._id, count: c.count, averageRating: parseFloat(c.averageRating.toFixed(1)) })),
    });
  } catch (error) {
    console.error("Admin feedback analytics GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load analytics" },
      { status: 500 }
    );
  }
}
