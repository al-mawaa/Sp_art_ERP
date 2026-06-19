import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { requireTeacherFromRequest } from '@/lib/auth/require-teacher';
import Batch from '@/lib/models/Batch';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') return NextResponse.json({ success: false, error: 'Not allowed' }, { status: 403 });
  try {
    const auth = await requireTeacherFromRequest(req);
    if (!auth.ok) return auth.response;
    await dbConnect();
    const teacherOid = new mongoose.Types.ObjectId(auth.teacher.id);
    const rows = await Batch.find({ teacherIds: teacherOid }).lean();
    const batches = rows.map(r => ({ id: String(r._id), name: r.batchName, studentsCount: Array.isArray(r.students) ? r.students.length : 0 }));
    return NextResponse.json({ success: true, data: { teacherId: auth.teacher.id, batches } });
  } catch (e) {
    console.error('[dev/teacher-debug GET]', e);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
