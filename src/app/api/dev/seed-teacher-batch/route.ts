import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { requireTeacherFromRequest } from '@/lib/auth/require-teacher';
import Batch from '@/lib/models/Batch';
import Student from '@/lib/models/Student';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') return NextResponse.json({ success: false, error: 'Not allowed' }, { status: 403 });
  try {
    const auth = await requireTeacherFromRequest(req);
    if (!auth.ok) return auth.response;
    const body = await req.json().catch(() => ({}));
    const batchName = (body.batchName || `Dev Batch ${Date.now()}`).toString();
    const studentName = (body.studentName || `Dev Student ${Date.now()}`).toString();

    await dbConnect();

    // create student
    const student = await Student.create({ fullName: studentName, badgeId: `dev-${Date.now()}`, className: 'Dev' });

    // create batch with embedded student and teacher assigned
    const batchDoc = new Batch({
      batchName,
      courseName: 'Dev Course',
      batchDay: 'Mon',
      batchTime: '10:00',
      branch: 'Dev',
      batchCapacity: 20,
      students: [
        {
          _id: new mongoose.Types.ObjectId(),
          studentId: student._id,
          studentName: student.fullName,
          studentEmail: student.email || '',
          phone: student.phone || '',
          course: 'Dev Course',
        },
      ],
      teacherIds: [new mongoose.Types.ObjectId(auth.teacher.id)],
    });
    await batchDoc.save();

    return NextResponse.json({ success: true, data: { batchId: String(batchDoc._id), studentId: String(student._id) } });
  } catch (e) {
    console.error('[dev/seed-teacher-batch POST]', e);
    return NextResponse.json({ success: false, error: 'Failed to seed' }, { status: 500 });
  }
}
