import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { requireSeniorTeacherFromRequest } from '@/lib/auth/require-senior-teacher';
import DrawingTest from '@/lib/models/DrawingTest';
import StudentEvaluation from '@/lib/models/StudentEvaluation';
import TeacherPerformance from '@/lib/models/TeacherPerformance';
import Batch from '@/lib/models/Batch';
import Teacher from '@/lib/models/Teacher';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSeniorTeacherFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();

    // Ensure Teacher model is registered
    if (!mongoose.models.Teacher) {
      await import('@/lib/models/Teacher');
    }

    // Get the logged-in senior teacher's ID
    const seniorTeacherId = new mongoose.Types.ObjectId(auth.seniorTeacher.id);

    // Fetch all batches assigned to this senior teacher
    const assignedBatches = await Batch.find({
      seniorTeacherIds: seniorTeacherId,
    })
      .select('_id')
      .lean();

    console.log('[senior-teacher/drawing-tasks] Senior teacher ID:', seniorTeacherId.toString());
    console.log('[senior-teacher/drawing-tasks] Assigned batches:', assignedBatches.length);

    const assignedBatchIds = assignedBatches.map((b) => b._id);

    // Use drawing_tests collection as source of truth - filter by assigned batches
    const drawingTests = await DrawingTest.find({
      batchId: { $in: assignedBatchIds },
    })
      .select('taskId teacherId teacherName batchId batchName courseName studentId studentName testTitle status submittedAt')
      .lean();

    console.log('[senior-teacher/drawing-tasks] Found drawing tests:', drawingTests.length);

    // Group drawing tests by taskId to show each task once
    const testsByTaskId = new Map<string, typeof drawingTests>();
    drawingTests.forEach(test => {
      const taskId = test.taskId ? test.taskId.toString() : 'no-task';
      if (!testsByTaskId.has(taskId)) {
        testsByTaskId.set(taskId, []);
      }
      testsByTaskId.get(taskId)!.push(test);
    });

    // Get evaluations for all these drawing tests
    const testIds = drawingTests.map(t => t._id);
    const evaluations = await StudentEvaluation.find({
      submissionId: { $in: testIds },
    })
      .select('submissionId performancePercentage')
      .lean();

    const evaluationMap = new Map(evaluations.map(e => [e.submissionId.toString(), e.performancePercentage]));

    // Build task list from grouped drawing tests
    const tasks = Array.from(testsByTaskId.entries()).map(([taskId, tests]) => {
      const firstTest = tests[0];
      const totalStudents = tests.length;
      const evaluatedStudents = tests.filter(t => {
        const testId = t._id.toString();
        return evaluationMap.has(testId);
      }).length;
      const pendingStudents = totalStudents - evaluatedStudents;

      // Determine task status based on student statuses
      const hasEvaluated = evaluatedStudents > 0;
      const allEvaluated = evaluatedStudents === totalStudents;
      const taskStatus = !hasEvaluated ? 'Pending' : allEvaluated ? 'Completed' : 'In Review';

      return {
        id: taskId,
        taskName: firstTest.testTitle || 'Untitled Task',
        taskDate: firstTest.submittedAt || new Date(),
        teacherName: firstTest.teacherName || 'Unknown',
        batch: {
          id: firstTest.batchId ? firstTest.batchId.toString() : '',
          name: firstTest.batchName || '',
          course: firstTest.courseName || '',
        },
        totalStudents,
        evaluatedStudents,
        pendingStudents,
        status: taskStatus,
      };
    });

    // Sort tasks by date (newest first)
    tasks.sort((a, b) => new Date(b.taskDate).getTime() - new Date(a.taskDate).getTime());

    // Calculate overall stats from filtered drawing tests
    const totalTasks = tasks.length;
    const totalEvaluations = evaluations.length;
    const avgPerformance = evaluations.length > 0
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
        tasks,
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
