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

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireTeacherFromRequest(request);
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const { taskName, taskDate, batchId, batchName } = body || {};
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid task id' }, { status: 400 });
    }
    if (!taskName || !taskDate || !batchId || !batchName) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(batchId)) {
      return NextResponse.json({ success: false, error: 'Invalid batch id' }, { status: 400 });
    }
    await dbConnect();
    const task = await DrawingTask.findById(id);
    if (!task) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    if (String(task.createdBy) !== auth.teacher.id) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    task.taskName = String(taskName);
    task.taskDate = new Date(taskDate);
    task.batchId = new mongoose.Types.ObjectId(batchId);
    task.batchName = String(batchName);
    await task.save();

    return NextResponse.json({ success: true, data: { id: String(task._id) } });
  } catch (e) {
    console.error('[drawing-tasks/[id] PUT]', e);
    return NextResponse.json({ success: false, error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireTeacherFromRequest(request);
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid task id' }, { status: 400 });
    }
    await dbConnect();
    const task = await DrawingTask.findById(id);
    if (!task) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    if (String(task.createdBy) !== auth.teacher.id) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    await DrawingTask.deleteOne({ _id: task._id });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[drawing-tasks/[id] DELETE]', e);
    return NextResponse.json({ success: false, error: 'Failed to delete task' }, { status: 500 });
  }
}
