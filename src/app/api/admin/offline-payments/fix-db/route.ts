import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import OfflinePayment from '@/lib/models/OfflinePayment';
import CourseEnrollment from '@/lib/models/CourseEnrollment';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await dbConnect();
    
    const latestPayments = await OfflinePayment.find({}).sort({ createdAt: -1 }).limit(5);
    const latestEnrollments = await CourseEnrollment.find({}).sort({ createdAt: -1 }).limit(5);

    return NextResponse.json({ 
      success: true, 
      latestPayments: latestPayments.map(p => ({
        ref: p.offlinePaymentReference,
        amount: p.amount,
        type: p.paymentType,
        studentId: p.studentId,
        courseId: p.courseId
      })),
      latestEnrollments: latestEnrollments.map(e => ({
        id: e._id,
        paymentType: e.paymentType,
        amount: e.baseAmount
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
