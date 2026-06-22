import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { requireTeacherFromRequest } from '@/lib/auth/require-teacher';
import DrawingTest from '@/lib/models/DrawingTest';
import StudentEvaluation from '@/lib/models/StudentEvaluation';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireTeacherFromRequest(request);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const taskId = (searchParams.get('taskId') || '').trim();
    await dbConnect();
    const teacherOid = new mongoose.Types.ObjectId(auth.teacher.id);
    const filter: Record<string, unknown> = { teacherId: teacherOid };
    if (taskId) {
      if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return NextResponse.json({ success: false, error: 'Invalid taskId' }, { status: 400 });
      }
      filter.taskId = new mongoose.Types.ObjectId(taskId);
    }
    const rows = await DrawingTest.find(filter).sort({ createdAt: -1 }).lean();

    const submissionIds = rows.map(r => r._id);
    const evaluations = submissionIds.length
      ? await StudentEvaluation.find({ submissionId: { $in: submissionIds } })
          .select('submissionId performancePercentage evaluatedAt')
          .lean()
      : [];
    const evaluationMap = new Map(evaluations.map(e => [String(e.submissionId), e]));

    const payload = rows.map(r => {
      const evaluation = evaluationMap.get(String(r._id));
      return {
        id: String(r._id),
        teacherId: String(r.teacherId),
        teacherName: r.teacherName,
        batchId: String(r.batchId),
        batchName: r.batchName,
        courseName: r.courseName,
        batchMonth: r.batchMonth || '',
        studentId: String(r.studentId),
        studentName: r.studentName,
        testTitle: r.testTitle,
        timeTaken: r.timeTaken,
        teacherDrawingImage: r.teacherDrawingImage,
        studentDrawingImage: r.studentDrawingImage,
        status: r.status,
        submittedAt: r.submittedAt,
        createdAt: r.createdAt,
        performancePercentage: evaluation?.performancePercentage ?? null,
        evaluatedAt: evaluation?.evaluatedAt?.toISOString?.() ?? null,
      };
    });

    return NextResponse.json({ success: true, data: { tests: payload } });
  } catch (e) {
    console.error('[drawing-tests/teacher GET]', e);
    return NextResponse.json({ success: false, error: 'Failed to load tests' }, { status: 500 });
  }
}
