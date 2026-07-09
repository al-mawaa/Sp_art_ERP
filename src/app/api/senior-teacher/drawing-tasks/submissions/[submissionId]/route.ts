import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { requireSeniorTeacherFromRequest } from '@/lib/auth/require-senior-teacher';
import DrawingTest from '@/lib/models/DrawingTest';
import StudentEvaluation from '@/lib/models/StudentEvaluation';
import Batch from '@/lib/models/Batch';

export const runtime = 'nodejs';

export async function GET(
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

    await dbConnect();

    const subId = new mongoose.Types.ObjectId(submissionId);
    const seniorTeacherId = new mongoose.Types.ObjectId(auth.seniorTeacher.id);

    // Get submission (drawing test)
    const submission = await DrawingTest.findById(subId)
      .populate('studentId', 'fullName badgeId email')
      .populate('teacherId', 'fullName email')
      .populate('batchId', 'batchName courseName')
      .populate('taskId', 'taskName taskDate')
      .lean();

    if (!submission) {
      return NextResponse.json({ success: false, error: 'Submission not found' }, { status: 404 });
    }

    // Verify that the senior teacher is assigned to this batch
    const batchId = submission.batchId as mongoose.Types.ObjectId;
    const batch = await Batch.findById(batchId).select('seniorTeacherIds').lean();

    if (!batch || !batch.seniorTeacherIds.some((id: mongoose.Types.ObjectId) => id.equals(seniorTeacherId))) {
      return NextResponse.json(
        { success: false, error: 'You are not authorized to view this submission' },
        { status: 403 },
      );
    }

    // Get existing evaluation if any
    const evaluation = await StudentEvaluation.findOne({
      submissionId: subId,
    }).lean();

    // Build a safe submission payload that tolerates missing populated refs
    const safeSubmission = (sub: unknown) => {
      const row = sub as Record<string, unknown>;
      const studentObj = row.studentId && typeof row.studentId === 'object' ? (row.studentId as unknown as Record<string, unknown>) : null;
      const teacherObj = row.teacherId && typeof row.teacherId === 'object' ? (row.teacherId as unknown as Record<string, unknown>) : null;
      const batchObj = row.batchId && typeof row.batchId === 'object' ? (row.batchId as unknown as Record<string, unknown>) : null;
      const taskObj = row.taskId && typeof row.taskId === 'object' ? (row.taskId as unknown as Record<string, unknown>) : null;

      return {
        id: row._id?.toString?.() ?? '',
        studentId: studentObj?._id?.toString?.() ?? (row.studentId ? String(row.studentId) : ''),
        studentName: (studentObj?.fullName as string) ?? (row.studentName as string) ?? 'Student',
        badgeId: (studentObj?.badgeId as string) ?? null,
        teacherName: (teacherObj?.fullName as string) ?? (row.teacherName as string) ?? 'Teacher',
        batchName: (batchObj?.batchName as string) ?? (row.batchName as string) ?? '',
        courseName: (batchObj?.courseName as string) ?? (row.courseName as string) ?? '',
        taskName: (taskObj?.taskName as string) ?? (row.taskName as string) ?? '',
        taskDate: taskObj?.taskDate ?? row.taskDate ?? null,
        submissionDate: row.submittedAt,
        teacherImage: row.teacherDrawingImage,
        studentImage: row.studentDrawingImage,
        timeTaken: row.timeTaken,
      };
    };

    return NextResponse.json({
      success: true,
      data: {
        submission: safeSubmission(submission),
        evaluation: evaluation
          ? {
              id: evaluation._id.toString(),
              drawingMarks: evaluation.drawingMarks,
              coloringMarks: evaluation.coloringMarks,
              speedMarks: evaluation.speedMarks,
              neatnessMarks: evaluation.neatnessMarks,
              creativityMarks: evaluation.creativityMarks,
              accuracyMarks: evaluation.accuracyMarks,
              remarks: evaluation.remarks,
              performancePercentage: evaluation.performancePercentage,
              evaluatedAt: evaluation.evaluatedAt,
            }
          : null,
      },
    });
  } catch (e) {
    console.error('[senior-teacher/drawing-tasks/submission GET]', e);
    return NextResponse.json(
      { success: false, error: 'Failed to load submission details' },
      { status: 500 },
    );
  }
}
