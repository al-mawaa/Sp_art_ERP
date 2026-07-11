import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CertificateModel from '@/lib/models/Certificate';

export async function GET(req: NextRequest, { params }: any) {
  try {
    await dbConnect();
    const { certificateNumber } = await params;

    const certificate = await CertificateModel.findOne({ certificateNumber })
      .populate('studentId', 'name')
      .populate('courseId', 'title durationMonths');

    if (!certificate) {
      return NextResponse.json({ success: false, error: 'Certificate not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        certificateNumber: certificate.certificateNumber,
        status: certificate.status,
        issueDate: certificate.issueDate,
        studentName: (certificate.studentId as any)?.name,
        courseName: (certificate.courseId as any)?.title,
        pdfUrl: certificate.pdfUrl,
      }
    });
  } catch (error: any) {
    console.error('Error verifying certificate:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
