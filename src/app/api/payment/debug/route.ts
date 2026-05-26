import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import CourseEnrollment from '@/lib/models/CourseEnrollment';
import { requireStudentFromRequest } from '@/lib/auth/require-student';

export const runtime = 'nodejs';

/**
 * Debug endpoint to manually test payment verification
 * Call this with the same payload as /api/payment/verify
 */
export async function POST(request: NextRequest) {
  const debugLog: string[] = [];
  
  try {
    debugLog.push('=== DEBUG PAYMENT VERIFICATION ===');
    debugLog.push(`Timestamp: ${new Date().toISOString()}`);
    
    // Step 1: Check environment
    debugLog.push('\n--- ENVIRONMENT CHECK ---');
    debugLog.push(`RAZORPAY_KEY_SECRET exists: ${!!process.env.RAZORPAY_KEY_SECRET}`);
    debugLog.push(`RAZORPAY_KEY_SECRET length: ${(process.env.RAZORPAY_KEY_SECRET || '').length}`);
    
    // Step 2: Check auth
    debugLog.push('\n--- AUTHENTICATION ---');
    const auth = await requireStudentFromRequest(request);
    debugLog.push(`Auth OK: ${auth.ok}`);
    if (auth.ok) {
      debugLog.push(`Student ID: ${auth.student.id}`);
    } else {
      debugLog.push('Authentication failed, skipping remaining checks');
      return NextResponse.json({ debugLog, status: 'auth_failed' }, { status: 401 });
    }
    
    // Step 3: Parse request body
    debugLog.push('\n--- REQUEST BODY ---');
    const body = (await request.json()) as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      amount?: number | string;
      courseId?: string;
    };
    debugLog.push(`Body received: ${JSON.stringify(body)}`);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, courseId } = body;
    
    // Step 4: Validate fields
    debugLog.push('\n--- FIELD VALIDATION ---');
    debugLog.push(`razorpay_order_id: ${razorpay_order_id || 'MISSING'}`);
    debugLog.push(`razorpay_payment_id: ${razorpay_payment_id || 'MISSING'}`);
    debugLog.push(`razorpay_signature: ${razorpay_signature?.substring(0, 20)}...`);
    debugLog.push(`amount: ${amount}`);
    debugLog.push(`courseId: ${courseId}`);
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !courseId) {
      debugLog.push('FAILED: Missing required fields');
      return NextResponse.json({ debugLog, status: 'missing_fields' }, { status: 400 });
    }
    
    // Step 5: Signature verification
    debugLog.push('\n--- SIGNATURE VERIFICATION ---');
    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    const message = `${razorpay_order_id}|${razorpay_payment_id}`;
    debugLog.push(`Secret length: ${secret.length}`);
    debugLog.push(`Message: ${message}`);
    
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(message)
      .digest('hex');
    
    debugLog.push(`Provided signature: ${razorpay_signature}`);
    debugLog.push(`Generated signature: ${generated_signature}`);
    debugLog.push(`Signatures match: ${generated_signature === razorpay_signature}`);
    
    if (generated_signature !== razorpay_signature) {
      debugLog.push('FAILED: Signature mismatch');
      return NextResponse.json({ debugLog, status: 'signature_mismatch' }, { status: 400 });
    }
    
    // Step 6: Database connection
    debugLog.push('\n--- DATABASE CONNECTION ---');
    try {
      await dbConnect();
      debugLog.push('Database connection: SUCCESS');
    } catch (dbError) {
      debugLog.push(`Database connection: FAILED - ${dbError instanceof Error ? dbError.message : String(dbError)}`);
      return NextResponse.json({ debugLog, status: 'db_connection_failed' }, { status: 500 });
    }
    
    // Step 7: Validate courseId
    debugLog.push('\n--- COURSEID VALIDATION ---');
    const isValidObjectId = mongoose.Types.ObjectId.isValid(courseId);
    debugLog.push(`Is valid ObjectId: ${isValidObjectId}`);
    
    if (!isValidObjectId) {
      debugLog.push('FAILED: Invalid courseId format');
      return NextResponse.json({ debugLog, status: 'invalid_courseid' }, { status: 400 });
    }
    
    // Step 8: Check for duplicates
    debugLog.push('\n--- DUPLICATE CHECK ---');
    try {
      const existing = await CourseEnrollment.findOne({ orderId: razorpay_order_id });
      debugLog.push(`Existing enrollment found: ${!!existing}`);
      if (existing) {
        debugLog.push(`Existing enrollment ID: ${existing._id}`);
      }
    } catch (dupError) {
      debugLog.push(`Duplicate check error: ${dupError instanceof Error ? dupError.message : String(dupError)}`);
    }
    
    // Step 9: Create enrollment
    debugLog.push('\n--- ENROLLMENT CREATION ---');
    try {
      const studentId = new mongoose.Types.ObjectId(auth.student.id);
      const courseIdObj = new mongoose.Types.ObjectId(courseId);
      
      debugLog.push(`Student ID (ObjectId): ${studentId}`);
      debugLog.push(`Course ID (ObjectId): ${courseIdObj}`);

      type DebugEnrollmentPayload = {
        studentId: mongoose.Types.ObjectId;
        courseId: mongoose.Types.ObjectId;
        enrollmentDate: Date;
        status: 'active';
        completionPercentage: number;
        paymentId: string;
        orderId: string;
        amount: number;
        paymentStatus: 'paid';
      };
      
      const payload: DebugEnrollmentPayload = {
        studentId,
        courseId: courseIdObj,
        enrollmentDate: new Date(),
        status: 'active',
        completionPercentage: 0,
        paymentId: razorpay_payment_id as string,
        orderId: razorpay_order_id as string,
        amount: Number(amount || 0),
        paymentStatus: 'paid',
      };
      
      debugLog.push(`Payload: ${JSON.stringify(payload, null, 2)}`);
      
      const enrollment = await CourseEnrollment.create(payload);
      debugLog.push('Enrollment created: SUCCESS');
      debugLog.push(`Enrollment ID: ${enrollment._id}`);
      debugLog.push(`Enrollment status: ${enrollment.status}`);
      debugLog.push(`Payment status: ${enrollment.paymentStatus}`);
      
      // Step 10: Verify enrollment in database
      debugLog.push('\n--- VERIFICATION ---');
      const found = await CourseEnrollment.findById(enrollment._id);
      debugLog.push(`Enrollment found in DB: ${!!found}`);
      if (found) {
        debugLog.push(`Found ID: ${found._id}`);
        debugLog.push(`Found studentId: ${found.studentId}`);
        debugLog.push(`Found courseId: ${found.courseId}`);
      }
      
    } catch (createError) {
      debugLog.push('Enrollment creation: FAILED');
      debugLog.push(`Error type: ${createError instanceof Error ? createError.constructor.name : typeof createError}`);
      debugLog.push(`Error message: ${createError instanceof Error ? createError.message : String(createError)}`);
      debugLog.push(`Error: ${JSON.stringify(createError)}`);
      return NextResponse.json({ debugLog, status: 'creation_failed' }, { status: 500 });
    }
    
    debugLog.push('\n=== ALL CHECKS PASSED ===');
    return NextResponse.json({ debugLog, status: 'success' }, { status: 200 });
    
  } catch (error) {
    debugLog.push('\n=== UNEXPECTED ERROR ===');
    debugLog.push(`Error type: ${error instanceof Error ? error.constructor.name : typeof error}`);
    debugLog.push(`Error message: ${error instanceof Error ? error.message : String(error)}`);
    debugLog.push(`Full error: ${JSON.stringify(error)}`);
    
    return NextResponse.json({ debugLog, status: 'error' }, { status: 500 });
  }
}
