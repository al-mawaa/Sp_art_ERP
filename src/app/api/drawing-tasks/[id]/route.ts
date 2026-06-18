import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { requireTeacherFromRequest } from '@/lib/auth/require-teacher';
import DrawingTask from '@/lib/models/DrawingTask';
import mongoose from 'mongoose';

export const runtime = 'nodejs';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireTeacherFromRequest(request);
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid task id' }, { status: 400 });
    }
    await dbConnect();
    const task = await DrawingTask.findById(id).lean();
    if (!task) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    if (String(task.createdBy) !== auth.teacher.id) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const responseTask = {
      id: String(task._id),
      taskName: String(task.taskName || ''),
      taskDate: task.taskDate instanceof Date ? task.taskDate.toISOString() : String(task.taskDate || ''),
      batchId: String(task.batchId || ''),
      batchName: String(task.batchName || ''),
      createdBy: String(task.createdBy),
      createdAt: task.createdAt instanceof Date ? task.createdAt.toISOString() : String(task.createdAt || ''),
    };

    return NextResponse.json({ success: true, data: { task: responseTask } });
  } catch (e) {
    console.error('[drawing-tasks/[id] GET]', e);
    return NextResponse.json({ success: false, error: 'Failed to load task' }, { status: 500 });
  }
}
