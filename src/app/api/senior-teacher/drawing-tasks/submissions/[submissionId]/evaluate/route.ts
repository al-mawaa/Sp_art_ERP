import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { requireSeniorTeacherFromRequest } from '@/lib/auth/require-senior-teacher';
import StudentEvaluation from '@/lib/models/StudentEvaluation';
import DrawingTest from '@/lib/models/DrawingTest';
import {
  calculateStudentPerformance,
  recalculateTeacherPerformance,
} from '@/lib/drawing-tasks/performanceCalc';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ submissionId: string }> },
) {
  try {
    const auth = await requireSeniorTeacherFromRequest(request);
    if (!auth.ok) return auth.response;

    const { submissionId } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return NextResponse.json({ success: false, error: 'Invalid submission id' }, { status: 400 });
    }

    const body = await request.json();
    const {
      drawingMarks,
      coloringMarks,
      speedMarks,
      neatnessMarks,
      creativityMarks,
      accuracyMarks,
      remarks,
    } = body || {};

    // Validate marks
    if (
      drawingMarks == null ||
      coloringMarks == null ||
      speedMarks == null ||
      neatnessMarks == null ||
      creativityMarks == null ||
      accuracyMarks == null
    ) {
      return NextResponse.json(
        { success: false, error: 'All marks are required' },
        { status: 400 },
      );
    }

    const marks = {
      drawing: Number(drawingMarks),
      coloring: Number(coloringMarks),
      speed: Number(speedMarks),
      neatness: Number(neatnessMarks),
      creativity: Number(creativityMarks),
      accuracy: Number(accuracyMarks),
    };

    // Validate ranges
    for (const [key, value] of Object.entries(marks)) {
      if (value < 0 || value > 5) {
        return NextResponse.json(
          { success: false, error: `${key} marks must be between 0 and 5` },
          { status: 400 },
        );
      }
    }

    await dbConnect();

    const subId = new mongoose.Types.ObjectId(submissionId);
    const seniorOid = new mongoose.Types.ObjectId(auth.seniorTeacher.id);

    // Get submission details
    const submission = await DrawingTest.findById(subId).select(
      'studentId teacherId taskId batchId',
    );

    if (!submission) {
      return NextResponse.json({ success: false, error: 'Submission not found' }, { status: 404 });
    }

    // Calculate performance
    const { obtained, percentage } = calculateStudentPerformance(marks);

    // Create or update evaluation
    const evaluation = await StudentEvaluation.findOneAndUpdate(
      { submissionId: subId },
      {
        submissionId: subId,
        taskId: submission.taskId,
        studentId: submission.studentId,
        teacherId: submission.teacherId,
        drawingMarks: marks.drawing,
        coloringMarks: marks.coloring,
        speedMarks: marks.speed,
        neatnessMarks: marks.neatness,
        creativityMarks: marks.creativity,
        accuracyMarks: marks.accuracy,
        obtainedMarks: obtained,
        maxMarks: 30,
        performancePercentage: percentage,
        remarks: remarks || '',
        evaluatedBy: seniorOid,
        evaluatedAt: new Date(),
      },
      { upsert: true, new: true },
    );

    // Mark the drawing submission as reviewed after evaluation
    await DrawingTest.updateOne({ _id: subId }, { status: 'Reviewed' });

    // Update teacher performance
    await recalculateTeacherPerformance(submission.teacherId.toString());

    return NextResponse.json({
      success: true,
      data: {
        evaluation: {
          id: evaluation._id.toString(),
          obtainedMarks: obtained,
          performancePercentage: percentage,
          evaluatedAt: evaluation.evaluatedAt,
        },
      },
    });
  } catch (e) {
    console.error('[senior-teacher/drawing-tasks/submissions POST]', e);
    return NextResponse.json(
      { success: false, error: 'Failed to submit evaluation' },
      { status: 500 },
    );
  }
}
