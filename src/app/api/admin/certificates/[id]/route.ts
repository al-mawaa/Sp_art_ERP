import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CertificateModel from '@/lib/models/Certificate';
import { approveCertificate, generatePendingCertificate } from '@/lib/services/certificateService';

export async function PATCH(req: NextRequest, { params }: any) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    if (body.action === 'approve') {
      const result = await approveCertificate(id);
      return NextResponse.json({ success: true, data: result });
    }

    if (body.action === 'reject') {
      const certificate = await CertificateModel.findByIdAndUpdate(
        id,
        { status: 'rejected' },
        { new: true }
      );
      if (!certificate) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
      return NextResponse.json({ success: true, data: certificate });
    }
    
    if (body.action === 'regenerate') {
      // Find old one to get student/course
      const oldCert = await CertificateModel.findById(id);
      if (!oldCert) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
      
      // Delete old
      await CertificateModel.findByIdAndDelete(id);
      
      // Generate new pending
      const newCert = await generatePendingCertificate(oldCert.studentId.toString(), oldCert.courseId.toString());
      
      return NextResponse.json({ success: true, data: newCert });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating certificate:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
