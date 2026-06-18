import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { requireSeniorTeacherFromRequest } from '@/lib/auth/require-senior-teacher';
import Teacher from '@/lib/models/Teacher';
import DrawingTask from '@/lib/models/DrawingTask';
import DrawingTest from '@/lib/models/DrawingTest';
import StudentEvaluation from '@/lib/models/StudentEvaluation';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireSeniorTeacherFromRequest(request);
    if (!auth.ok) return auth.response;

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid task id' }, { status: 400 });
    }

    await dbConnect();

    const taskId = new mongoose.Types.ObjectId(id);

    // Get task details
    const task = await DrawingTask.findById(taskId)
      .populate('batchId', 'batchName courseName')
      .populate('createdBy', 'fullName email')
      .lean();

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    // Get all submissions for this task
    let submissions = await DrawingTest.find({ taskId })
      .populate('studentId', 'fullName badgeId email')
      .populate('teacherId', 'fullName email')
      .select('studentId studentName teacherId teacherName status submittedAt')
      .lean();

    // Some records may store taskId as a string in older documents.
    if (!submissions.length) {
      submissions = await DrawingTest.find({ taskId: id })
        .populate('studentId', 'fullName badgeId email')
        .populate('teacherId', 'fullName email')
        .select('studentId studentName teacherId teacherName status submittedAt')
        .lean();
    }

    // Get evaluations for these submissions
    const submissionIds = submissions.map(s => s._id);
    const evaluations = await StudentEvaluation.find({
      submissionId: { $in: submissionIds },
    })
      .select('submissionId performancePercentage evaluatedAt')
      .lean();

    const evaluationMap = new Map(evaluations.map(e => [e.submissionId.toString(), e]));

    const students = submissions.map(sub => {
      const evaluation = evaluationMap.get((sub._id as unknown as { toString(): string })?.toString?.() ?? '');
      const studentObj = sub.studentId && typeof sub.studentId === 'object' ? (sub.studentId as unknown as Record<string, unknown>) : null;
      const teacherObj = sub.teacherId && typeof sub.teacherId === 'object' ? (sub.teacherId as unknown as Record<string, unknown>) : null;

      return {
        submissionId: (sub._id as unknown as { toString(): string })?.toString?.() ?? '',
        studentId: studentObj?._id?.toString?.() ?? (sub.studentId ? String(sub.studentId) : ''),
        studentName: (studentObj?.fullName as string) ?? (sub.studentName as string) ?? 'Student',
        badgeId: (studentObj?.badgeId as string) ?? null,
        teacherName: (teacherObj?.fullName as string) ?? (sub.teacherName as string) ?? 'Teacher',
        submissionDate: sub.submittedAt,
        status: evaluation ? 'Evaluated' : 'Pending',
        performancePercentage: evaluation?.performancePercentage ?? null,
        evaluatedAt: evaluation?.evaluatedAt ?? null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        task: {
          id: task._id?.toString() ?? '',
          taskName: task.taskName ?? '',
          taskDate: task.taskDate,
          batch: {
            id: (task.batchId as unknown as Record<string, unknown>)?._id?.toString() ?? '',
            name: (task.batchId as unknown as Record<string, unknown>)?.batchName ?? '',
            course: (task.batchId as unknown as Record<string, unknown>)?.courseName ?? '',
          },
          teacher: {
            id: (task.createdBy as unknown as Record<string, unknown>)?._id?.toString() ?? '',
            name: (task.createdBy as unknown as Record<string, unknown>)?.fullName ?? '',
            email: (task.createdBy as unknown as Record<string, unknown>)?.email ?? '',
          },
        },
        students,
        summary: {
          totalStudents: students.length,
          evaluatedStudents: students.filter(s => s.status === 'Evaluated').length,
          pendingStudents: students.filter(s => s.status === 'Pending').length,
        },
      },
    });
  } catch (e) {
    console.error('[senior-teacher/drawing-tasks/[id] GET]', e);
    return NextResponse.json(
      { success: false, error: 'Failed to load task details' },
      { status: 500 },
    );
  }
}
