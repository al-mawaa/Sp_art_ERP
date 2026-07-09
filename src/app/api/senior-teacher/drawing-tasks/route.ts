import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { requireSeniorTeacherFromRequest } from '@/lib/auth/require-senior-teacher';
import DrawingTask from '@/lib/models/DrawingTask';
import DrawingTest from '@/lib/models/DrawingTest';
import StudentEvaluation from '@/lib/models/StudentEvaluation';
import TeacherPerformance from '@/lib/models/TeacherPerformance';
import Batch from '@/lib/models/Batch';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSeniorTeacherFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();

    // Get the logged-in senior teacher's ID
    const seniorTeacherId = new mongoose.Types.ObjectId(auth.seniorTeacher.id);

    // Fetch all batches assigned to this senior teacher
    const assignedBatches = await Batch.find({
      seniorTeacherIds: seniorTeacherId,
    })
      .select('_id')
      .lean();

    const assignedBatchIds = assignedBatches.map((b) => b._id);

    // Get only drawing tasks from assigned batches
    const tasks = await DrawingTask.find({
      batchId: { $in: assignedBatchIds },
    })
      .sort({ taskDate: -1 })
      .populate('batchId', 'batchName courseName')
      .populate('createdBy', 'fullName')
      .lean();

    const taskIds = tasks.map(t => t._id);

    // Get all submissions for these tasks
    const submissions = await DrawingTest.find({
      taskId: { $in: taskIds },
    })
      .select('taskId studentId status')
      .lean();

    // Get all evaluations for these tasks
    const evaluations = await StudentEvaluation.find({
      taskId: { $in: taskIds },
    })
      .select('taskId studentId')
      .lean();

    const submissionsByTask = new Map<string, (typeof submissions)[number][]>();
    const evaluatedByTask = new Map<string, Set<string>>();

    submissions.forEach(sub => {
      const taskId = sub.taskId.toString();
      if (!submissionsByTask.has(taskId)) submissionsByTask.set(taskId, []);
      submissionsByTask.get(taskId)!.push(sub);
    });

    evaluations.forEach(ev => {
      const taskId = ev.taskId.toString();
      if (!evaluatedByTask.has(taskId)) evaluatedByTask.set(taskId, new Set());
      evaluatedByTask.get(taskId)!.add(ev.studentId.toString());
    });

    const enrichedTasks = (tasks as unknown as Array<Record<string, unknown>>).map(task => {
      const taskId = task._id?.toString() ?? '';
      const subs = submissionsByTask.get(taskId) || [];
      const evaluated = evaluatedByTask.get(taskId) || new Set();
      const createdByObj = task.createdBy && typeof task.createdBy === 'object' ? (task.createdBy as unknown as Record<string, unknown>) : null;
      const batchObj = task.batchId && typeof task.batchId === 'object' ? (task.batchId as unknown as Record<string, unknown>) : null;

      return {
        id: taskId,
        taskName: task.taskName ?? '',
        taskDate: task.taskDate,
        teacherName: (createdByObj?.fullName as string) ?? 'Unknown',
        batch: {
          id: batchObj?._id?.toString?.() ?? '',
          name: (batchObj?.batchName as string) ?? '',
          course: (batchObj?.courseName as string) ?? '',
        },
        totalStudents: subs.length,
        evaluatedStudents: evaluated.size,
        pendingStudents: subs.length - evaluated.size,
        status: evaluated.size === 0 ? 'Pending' : evaluated.size < subs.length ? 'In Review' : 'Completed',
      };
    });

    // Get overall stats (only from assigned batches)
    const totalTasks = tasks.length;
    const totalEvaluations = evaluations.length;

    // Calculate average performance only from assigned batches
    const avgPerformance =
      evaluations.length > 0
        ? evaluations.reduce((sum, e) => sum + e.performancePercentage, 0) / evaluations.length
        : 0;

    const seniorOid = new mongoose.Types.ObjectId(auth.seniorTeacher.id);
    const performance = await TeacherPerformance.findOne({ teacherId: seniorOid }).lean();

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalTasks,
          studentsEvaluated: totalEvaluations,
          averagePerformance: Math.round(avgPerformance * 100) / 100,
          incentiveEligible: performance?.incentiveEligible ?? false,
          incentivePercentage: performance?.incentivePercentage ?? 0,
        },
        tasks: enrichedTasks,
      },
    });
  } catch (e) {
    console.error('[senior-teacher/drawing-tasks GET]', e);
    return NextResponse.json(
      { success: false, error: 'Failed to load drawing tasks' },
      { status: 500 },
    );
  }
}
