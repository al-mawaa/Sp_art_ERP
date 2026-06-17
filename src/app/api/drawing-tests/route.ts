import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { requireTeacherFromRequest } from '@/lib/auth/require-teacher';
import { teacherCanAccessBatch } from '@/lib/auth/require-batch-access';
import DrawingTest from '@/lib/models/DrawingTest';
import Teacher from '@/lib/models/Teacher';

export const runtime = 'nodejs';

type BatchLeaner = {
  batchName?: string;
  name?: string;
  courseName?: string;
  startMonth?: string;
  endMonth?: string;
  students?: Array<{
    _id?: mongoose.Types.ObjectId | string;
    studentId?: mongoose.Types.ObjectId | string;
    studentName?: string;
    name?: string;
  }>;
};

type StudentLeaner = {
  fullName?: string;
  name?: string;
};

export async function POST(request: NextRequest) {
  try {
    const auth = await requireTeacherFromRequest(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { batchId, studentId, testTitle, teacherDrawingImage, studentDrawingImage, timeTaken } = body || {};

    if (!batchId || !studentId || !testTitle || !teacherDrawingImage || !studentDrawingImage) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(batchId) || !mongoose.Types.ObjectId.isValid(studentId)) {
      return NextResponse.json({ success: false, error: 'Invalid ids' }, { status: 400 });
    }

    await dbConnect();
    const allowed = await teacherCanAccessBatch(auth.teacher.id, batchId);
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const teacher = await Teacher.findById(auth.teacher.id).lean();
    const teacherName = teacher?.fullName || 'Teacher';

    const batch = await import('@/lib/models/Batch').then(m => m.default.findById(batchId).lean<BatchLeaner>());
    if (!batch) {
      return NextResponse.json({ success: false, error: 'Batch not found' }, { status: 404 });
    }
    const batchName = batch.batchName || batch.name || `Batch ${batchId}`;
    const courseName = batch.courseName || batch.name || batch.batchName || `Course ${batchId}`;
    const batchMonth = batch.startMonth || batch.endMonth || '';

    const studentDoc = await import('@/lib/models/Student').then(m => m.default.findById(studentId).lean<StudentLeaner>()).catch(() => null);
    let studentName = studentDoc?.fullName || studentDoc?.name || '';
    if (!studentName && Array.isArray(batch.students)) {
      const embedded = batch.students.find(
        (s) => String(s.studentId) === String(studentId) || String(s._id) === String(studentId),
      );
      studentName = embedded?.studentName || embedded?.name || '';
    }
    if (!studentName) {
      return NextResponse.json({ success: false, error: 'Student not found in batch or student records' }, { status: 404 });
    }

    const doc = await DrawingTest.create({
      teacherId: new mongoose.Types.ObjectId(auth.teacher.id),
      teacherName,
      batchId: new mongoose.Types.ObjectId(batchId),
      batchName,
      courseName,
      batchMonth,
      studentId: new mongoose.Types.ObjectId(studentId),
      studentName,
      testTitle,
      timeTaken: Number(timeTaken) || 0,
      teacherDrawingImage,
      studentDrawingImage,
      submittedAt: new Date(),
    });

    return NextResponse.json({ success: true, data: { id: String(doc._id) } });
  } catch (e) {
    console.error('[drawing-tests POST] error', e instanceof Error ? e.message : e, e);
    const errorMessage = e instanceof Error ? e.message : 'Failed to create drawing test';
    return NextResponse.json({ success: false, error: process.env.NODE_ENV !== 'production' ? errorMessage : 'Failed to create drawing test' }, { status: 500 });
  }
}
