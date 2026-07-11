import dbConnect from '@/lib/mongodb';
import CertificateModel, { CertificateDocument } from '@/lib/models/Certificate';
import CourseEnrollmentModel from '@/lib/models/CourseEnrollment';
import NotificationModel from '@/lib/models/Notification';
import NotificationRecipientModel from '@/lib/models/NotificationRecipient';
import mongoose from 'mongoose';
import { configureCloudinary, cloudinary } from '@/lib/cloudinary';
import { sendCertificateEmail } from '@/lib/sendEmail';
import PDFDocument from 'pdfkit';

/** Evaluates all conditions to see if the student is eligible for a certificate */
export async function checkEligibility(studentId: string, courseId: string) {
  await dbConnect();
  
  const enrollment = await CourseEnrollmentModel.findOne({
    studentId,
    courseId,
    remainingAmount: 0,
  }).populate('studentId courseId');

  return !!enrollment;
}

/** Automatically generates a pending certificate if eligible */
export async function generatePendingCertificate(studentId: string, courseId: string) {
  await dbConnect();
  
  const enrollment = await CourseEnrollmentModel.findOne({
    studentId,
    courseId,
  });

  if (!enrollment) throw new Error('Enrollment not found');

  const isEligible = await checkEligibility(studentId, courseId);
  if (!isEligible) {
    throw new Error('Student is not eligible for a certificate yet');
  }

  const existing = await CertificateModel.findOne({ enrollmentId: enrollment._id });
  if (existing) {
    return existing;
  }

  // Generate unique certificate number
  const year = new Date().getFullYear();
  const count = await CertificateModel.countDocuments();
  const serialNumber = String(count + 1).padStart(6, '0');
  const certificateNumber = `SPA-${year}-${serialNumber}`;

  const certificate = new CertificateModel({
    studentId,
    courseId,
    enrollmentId: enrollment._id,
    certificateNumber,
    status: 'pending_approval',
  });

  await certificate.save();
  return certificate;
}

/** Approves a certificate, generates PDF, uploads to Cloudinary, sends email and notification */
export async function approveCertificate(certificateId: string) {
  await dbConnect();

  const certificate = await CertificateModel.findById(certificateId)
    .populate('studentId')
    .populate('courseId');

  if (!certificate) throw new Error('Certificate not found');
  if (certificate.status === 'approved') throw new Error('Certificate is already approved');

  const student = certificate.studentId as any;
  const course = certificate.courseId as any;

  // Generate QR Code URL (using a free QR code API for simplicity)
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const verifyUrl = `${appBaseUrl}/verify/${certificate.certificateNumber}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}`;
  certificate.qrCodeUrl = qrCodeUrl;

  // Fetch QR Code Buffer to embed in PDF
  let qrBuffer: Buffer | null = null;
  try {
    const qrRes = await fetch(qrCodeUrl);
    qrBuffer = Buffer.from(await qrRes.arrayBuffer());
  } catch (e) {
    console.error("Failed to fetch QR code for PDF embedding", e);
  }

  // Generate and Upload PDF using Cloudinary
  configureCloudinary();
  const pdfUrl = await new Promise<string>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'image', format: 'pdf', folder: 'certificates' },
      (error, result) => {
        if (error) return reject(error);
        if (result) resolve(result.secure_url);
      }
    );

    doc.pipe(stream);

    // --- Premium PDF Design ---
    
    // 1. Soft Background
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f8fafc');

    // 2. Double Borders
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).lineWidth(4).stroke('#0f172a');
    doc.rect(26, 26, doc.page.width - 52, doc.page.height - 52).lineWidth(1).stroke('#94a3b8');

    // 3. Header
    doc.moveDown(2);
    doc.fontSize(48).fillColor('#0f172a').text('SP Art Hub', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(20).fillColor('#64748b').text('CERTIFICATE OF COMPLETION', { align: 'center', characterSpacing: 4 });
    
    // 4. Body Content
    doc.moveDown(2.5);
    doc.fontSize(14).fillColor('#334155').text('This proudly certifies that', { align: 'center' });
    
    doc.moveDown(1);
    doc.fontSize(36).fillColor('#059669').text(student.fullName || 'Student', { align: 'center' });
    
    doc.moveDown(1);
    doc.fontSize(14).fillColor('#334155').text('has successfully completed the comprehensive training in', { align: 'center' });
    
    doc.moveDown(0.5);
    doc.fontSize(24).fillColor('#0f172a').text(course.courseTitle || 'Course', { align: 'center' });
    
    const duration = course.durationMonths ? `${course.durationMonths} Months` : 'Course Duration';
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#64748b').text(`Duration: ${duration}`, { align: 'center' });
    
    // 5. Footer Layout
    const bottomY = doc.page.height - 130;
    
    // Left Footer: Dates & ID
    doc.fontSize(12).fillColor('#334155').text(`Date of Issue: ${new Date().toLocaleDateString()}`, 60, bottomY);
    doc.text(`Certificate No: ${certificate.certificateNumber}`, 60, bottomY + 20);
    
    // Right Footer: Signature Line
    doc.lineWidth(1).moveTo(doc.page.width - 200, bottomY + 15).lineTo(doc.page.width - 60, bottomY + 15).stroke('#334155');
    doc.text('Director Signature', doc.page.width - 200, bottomY + 25, { width: 140, align: 'center' });

    // Center Footer: Embed QR Code
    if (qrBuffer) {
        doc.image(qrBuffer, (doc.page.width / 2) - 35, bottomY - 10, { width: 70 });
        doc.fontSize(8).fillColor('#94a3b8').text('Scan to Verify', (doc.page.width / 2) - 35, bottomY + 65, { width: 70, align: 'center' });
    }

    // Finish doc
    doc.end();
  });

  certificate.pdfUrl = pdfUrl;
  certificate.status = 'approved';
  certificate.issueDate = new Date();
  await certificate.save();

  // Send Email
  if (student.email) {
    try {
      await sendCertificateEmail({
        to: student.email,
        studentName: student.fullName || 'Student',
        courseName: course.courseTitle || 'Course',
        certificateNumber: certificate.certificateNumber,
        downloadUrl: pdfUrl,
      });
    } catch (e) {
      console.error('Failed to send certificate email', e);
    }
  }

  // Create In-App Notification
  try {
    const notif = await NotificationModel.create({
      title: 'Congratulations!',
      message: `Your Course Completion Certificate for ${course.courseTitle || 'Course'} has been generated successfully.`,
      type: 'certificate_generated',
      priority: 'Medium',
      deliveryChannels: ['In-app'],
      status: 'Sent',
    });

    await NotificationRecipientModel.create({
      notificationId: notif._id,
      userId: student._id, // Assume student has a Credentials _id or uses student._id directly
      role: 'student',
    });
  } catch (e) {
    console.error('Failed to create in-app notification', e);
  }

  return certificate;
}
