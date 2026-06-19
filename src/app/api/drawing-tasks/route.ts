import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { requireTeacherFromRequest } from '@/lib/auth/require-teacher';
import DrawingTask from '@/lib/models/DrawingTask';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireTeacherFromRequest(request);
    if (!auth.ok) return auth.response;
    await dbConnect();
    const teacherOid = new mongoose.Types.ObjectId(auth.teacher.id);
    const rows = await DrawingTask.find({ createdBy: teacherOid })
      .sort({ taskDate: -1 })
      .populate('batchId', 'courseName')
      .lean();

    const tasks = rows.map(r => {
      const batch = typeof r.batchId === 'object' && r.batchId !== null ? (r.batchId as { courseName?: string }) : null;
      return {
        id: String(r._id),
        taskName: r.taskName,
        taskDate: r.taskDate,
        createdAt: r.createdAt,
        batchName: r.batchName || '',
        courseName: batch?.courseName || '',
      };
    });
    return NextResponse.json({ success: true, data: { tasks } });
  } catch (e) {
    console.error('[drawing-tasks GET]', e);
    return NextResponse.json({ success: false, error: 'Failed to load tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireTeacherFromRequest(request);
    if (!auth.ok) return auth.response;
    const body = await request.json();
    const { taskName, taskDate, batchId, batchName } = body || {};
    if (!taskName || !taskDate || !batchId || !batchName) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(batchId)) {
      return NextResponse.json({ success: false, error: 'Invalid batch id' }, { status: 400 });
    }
    await dbConnect();
    const doc = await DrawingTask.create({
      taskName: String(taskName),
      taskDate: new Date(taskDate),
      batchId: new mongoose.Types.ObjectId(batchId),
      batchName: String(batchName),
      createdBy: new mongoose.Types.ObjectId(auth.teacher.id),
    });
    return NextResponse.json({ success: true, data: { id: String(doc._id) } });
  } catch (e) {
    console.error('[drawing-tasks POST]', e);
    return NextResponse.json({ success: false, error: 'Failed to create task' }, { status: 500 });
  }
}
