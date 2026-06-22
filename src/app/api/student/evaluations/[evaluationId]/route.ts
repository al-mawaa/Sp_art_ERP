import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { apiSuccess, apiError } from '@/lib/api-response';
import { requireStudentFromRequest } from '@/lib/auth/require-student';
import StudentEvaluation from '@/lib/models/StudentEvaluation';
import DrawingTest from '@/lib/models/DrawingTest';
import Student from '@/lib/models/Student';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ evaluationId: string }> }
) {
  try {
    const auth = await requireStudentFromRequest(request);
    if (!auth.ok) return auth.response;

    const { evaluationId } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
      return apiError('Invalid evaluation id', 400);
    }

    await dbConnect();

    let evalDoc = await StudentEvaluation.findById(evaluationId).lean();

    if (!evalDoc) {
      // If the route was passed a submissionId instead of an evaluationId,
      // try to resolve the evaluation from the drawing test submission.
      const submission = await DrawingTest.findById(evaluationId).lean().catch(() => null);
      if (submission) {
        evalDoc = await StudentEvaluation.findOne({ submissionId: submission._id }).lean();
      }
    }

    if (!evalDoc) {
      return apiError('Evaluation not found', 404);
    }

    const student = await Student.findById(auth.student.id).lean();
    const submission = await DrawingTest.findById(evalDoc.submissionId).lean().catch(() => null);
    const authorizedBySubmission = submission && String(submission.studentId) === String(auth.student.id);
    const authorizedByName = submission && student?.fullName && submission.studentName
      ? submission.studentName.trim().toLowerCase() === student.fullName.trim().toLowerCase()
      : false;

    if (String(evalDoc.studentId) !== String(auth.student.id) && !authorizedBySubmission && !authorizedByName) {
      console.warn('[student/evaluations/[id] GET] unauthorized evaluation access', {
        authStudentId: auth.student.id,
        evaluationStudentId: String(evalDoc.studentId),
        submissionStudentId: submission?.studentId?.toString?.(),
        submissionStudentName: submission?.studentName,
        studentFullName: student?.fullName,
        evaluationId,
      });
      return apiError('Unauthorized', 401);
    }
    
    return apiSuccess({
      evaluation: {
        id: evalDoc._id.toString(),
        taskId: String(evalDoc.taskId),
        submissionId: String(evalDoc.submissionId),
        drawingMarks: evalDoc.drawingMarks,
        coloringMarks: evalDoc.coloringMarks,
        speedMarks: evalDoc.speedMarks,
        neatnessMarks: evalDoc.neatnessMarks,
        creativityMarks: evalDoc.creativityMarks,
        accuracyMarks: evalDoc.accuracyMarks,
        obtainedMarks: evalDoc.obtainedMarks,
        maxMarks: evalDoc.maxMarks,
        performancePercentage: evalDoc.performancePercentage,
        remarks: evalDoc.remarks,
        evaluatedAt: evalDoc.evaluatedAt?.toISOString?.() ?? null,
      },
      submission: submission
        ? {
            id: submission._id?.toString?.() ?? '',
            testTitle: submission.testTitle ?? '',
            teacherDrawingImage: submission.teacherDrawingImage ?? '',
            studentDrawingImage: submission.studentDrawingImage ?? '',
            timeTaken: submission.timeTaken ?? 0,
          }
        : null,
    });
  } catch (error) {
    console.error('[student/evaluations/[id] GET]', error);
    return apiError('Failed to load evaluation', 500);
  }
}
