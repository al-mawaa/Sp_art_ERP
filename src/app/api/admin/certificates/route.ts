import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CertificateModel from '@/lib/models/Certificate';
import Student from '@/lib/models/Student';
import Course from '@/lib/models/Course';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    const query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    // Populate references to filter by student name or course
    const certificates = await CertificateModel.find(query)
      .populate({
        path: 'studentId',
        match: search ? { fullName: { $regex: search, $options: 'i' } } : undefined
      })
      .populate({
        path: 'courseId',
        match: search ? { courseTitle: { $regex: search, $options: 'i' } } : undefined
      })
      .sort({ createdAt: -1 });

    // Filter out populated nulls if searching
    const filtered = search
      ? certificates.filter(c => c.studentId != null || c.courseId != null)
      : certificates;

    return NextResponse.json({ success: true, data: filtered });
  } catch (error: any) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { action, ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: 'No certificate IDs provided' }, { status: 400 });
    }

    if (action === 'bulk_approve') {
      // For bulk, we could iterate and call approveCertificate(id) from the service
      // Let's import dynamically to avoid circular dependencies if any
      const { approveCertificate } = await import('@/lib/services/certificateService');
      
      const results = [];
      const errors = [];
      for (const id of ids) {
        try {
          const res = await approveCertificate(id);
          results.push(res);
        } catch (e: any) {
          errors.push({ id, error: e.message });
        }
      }

      return NextResponse.json({ success: true, data: results, errors });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error processing bulk certificates:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
