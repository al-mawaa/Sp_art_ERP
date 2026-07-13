import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { apiSuccess, apiError } from '@/lib/api-response';
import { requireStudentFromRequest } from '@/lib/auth/require-student';
import DrawingTest from '@/lib/models/DrawingTest';
import StudentEvaluation from '@/lib/models/StudentEvaluation';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireStudentFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();

    const studentId = new mongoose.Types.ObjectId(auth.student.id);

    console.log('[student/evaluations GET] fetching evaluations for student', { studentId: studentId.toString() });

    // Fetch evaluations for the logged-in student only
    const evaluations = await StudentEvaluation.find({ studentId })
      .sort({ evaluatedAt: -1 })
      .lean();

    if (evaluations.length === 0) {
      console.log('[student/evaluations GET] no evaluations found for student');
      return apiSuccess({ evaluations: [], totalDrawingTests: 0 });
    }

    // Get submission IDs to fetch drawing test details
    const submissionIds = evaluations.map(e => e.submissionId);
    const drawingTests = await DrawingTest.find({ _id: { $in: submissionIds } })
      .select('testTitle batchName courseName studentDrawingImage studentName teacherName timeTaken submittedAt')
      .lean();

    const drawingTestMap = new Map(drawingTests.map(dt => [String(dt._id), dt]));

    // Build payload with evaluation and drawing test data
    const payload = evaluations.map(evaluation => {
      const drawingTest = drawingTestMap.get(String(evaluation.submissionId));
      return {
        id: String(evaluation._id),
        submissionId: String(evaluation.submissionId),
        taskId: evaluation.taskId ? String(evaluation.taskId) : null,
        testTitle: drawingTest?.testTitle || 'Drawing Test',
        batchName: drawingTest?.batchName || '',
        courseName: drawingTest?.courseName || '',
        studentDrawingImage: drawingTest?.studentDrawingImage || '',
        studentName: drawingTest?.studentName || '',
        teacherName: drawingTest?.teacherName || '',
        timeTaken: drawingTest?.timeTaken || 0,
        submittedAt: drawingTest?.submittedAt?.toISOString?.() || null,
        evaluation: {
          id: String(evaluation._id),
          drawingMarks: evaluation.drawingMarks,
          coloringMarks: evaluation.coloringMarks,
          speedMarks: evaluation.speedMarks,
          neatnessMarks: evaluation.neatnessMarks,
          creativityMarks: evaluation.creativityMarks,
          accuracyMarks: evaluation.accuracyMarks,
          obtainedMarks: evaluation.obtainedMarks,
          maxMarks: evaluation.maxMarks,
          performancePercentage: evaluation.performancePercentage,
          remarks: evaluation.remarks,
          evaluatedAt: evaluation.evaluatedAt?.toISOString?.() || null,
        },
      };
    });

    // Get total drawing tests submitted by this student
    const totalDrawingTests = await DrawingTest.countDocuments({ studentId });

    console.log('[student/evaluations GET] success', {
      evaluationsCount: payload.length,
      totalDrawingTests,
    });

    return apiSuccess({ evaluations: payload, totalDrawingTests });
  } catch (error) {
    console.error('[student/evaluations GET]', error);
    return apiError('Unable to load student evaluations', 500);
  }
}
