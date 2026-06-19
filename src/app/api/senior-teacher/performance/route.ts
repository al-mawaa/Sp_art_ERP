import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { requireSeniorTeacherFromRequest } from '@/lib/auth/require-senior-teacher';
import { getTeacherPerformance } from '@/lib/drawing-tasks/performanceCalc';
import StudentEvaluation from '@/lib/models/StudentEvaluation';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSeniorTeacherFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();

    const performance = await getTeacherPerformance(auth.seniorTeacher.id);
    const teacherOid = new mongoose.Types.ObjectId(auth.seniorTeacher.id);

    const evaluations = await StudentEvaluation.find({ teacherId: teacherOid })
      .select('performancePercentage evaluatedAt')
      .sort({ evaluatedAt: 1 })
      .lean();

    const history = evaluations.map((evaluation) => ({
      date: evaluation.evaluatedAt?.toISOString() || new Date().toISOString(),
      performancePercentage: evaluation.performancePercentage,
    }));

    return NextResponse.json({
      success: true,
      data: {
        performance: performance || {
          totalStudentsEvaluated: 0,
          averagePerformance: 0,
          incentiveEligible: false,
          incentivePercentage: 0,
          lastEvaluatedAt: null,
        },
        history,
      },
    });
  } catch (e) {
    console.error('[senior-teacher/performance GET]', e);
    return NextResponse.json(
      { success: false, error: 'Failed to load performance data' },
      { status: 500 },
    );
  }
}
