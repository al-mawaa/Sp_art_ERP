import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { requireTeacherFromRequest } from '@/lib/auth/require-teacher';
import DrawingTest from '@/lib/models/DrawingTest';

export const runtime = 'nodejs';

export async function PUT(request: NextRequest, context: any) {
  try {
    const auth = await requireTeacherFromRequest(request);
    if (!auth.ok) return auth.response;

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid drawing test id' }, { status: 400 });
    }

    const body = await request.json();
    const { testTitle, timeTaken, teacherDrawingImage, studentDrawingImage } = body || {};
    if (!testTitle || !teacherDrawingImage || !studentDrawingImage) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();
    const drawingTest = await DrawingTest.findById(id);
    if (!drawingTest) {
      return NextResponse.json({ success: false, error: 'Drawing test not found' }, { status: 404 });
    }
    if (String(drawingTest.teacherId) !== auth.teacher.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    drawingTest.testTitle = String(testTitle);
    drawingTest.timeTaken = Number(timeTaken) || drawingTest.timeTaken;
    drawingTest.teacherDrawingImage = String(teacherDrawingImage);
    drawingTest.studentDrawingImage = String(studentDrawingImage);
    await drawingTest.save();

    return NextResponse.json({ success: true, data: { id: String(drawingTest._id) } });
  } catch (e) {
    console.error('[drawing-tests/[id] PUT]', e);
    return NextResponse.json({ success: false, error: 'Failed to update drawing test' }, { status: 500 });
  }
}
