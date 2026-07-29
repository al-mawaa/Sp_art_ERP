import dbConnect from '@/lib/mongodb';
import CertificateModel, { CertificateDocument } from '@/lib/models/Certificate';
import CourseEnrollmentModel from '@/lib/models/CourseEnrollment';
import NotificationModel from '@/lib/models/Notification';
import NotificationRecipientModel from '@/lib/models/NotificationRecipient';
import mongoose from 'mongoose';
import { configureCloudinary, cloudinary } from '@/lib/cloudinary';
import { sendCertificateEmail } from '@/lib/sendEmail';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

/** Helper to download Hind Devanagari fonts if they do not exist locally */
async function ensureFonts() {
  const fontsDir = path.join(process.cwd(), 'public', 'fonts');
  if (!fs.existsSync(fontsDir)) {
    fs.mkdirSync(fontsDir, { recursive: true });
  }

  const regPath = path.join(fontsDir, 'Hind-Regular.ttf');
  const boldPath = path.join(fontsDir, 'Hind-Bold.ttf');

  if (!fs.existsSync(regPath)) {
    try {
      const res = await fetch('https://raw.githubusercontent.com/google/fonts/main/ofl/hind/Hind-Regular.ttf');
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(regPath, buffer);
      }
    } catch (e) {
      console.error('Failed to download Hind-Regular font', e);
    }
  }

  if (!fs.existsSync(boldPath)) {
    try {
      const res = await fetch('https://raw.githubusercontent.com/google/fonts/main/ofl/hind/Hind-Bold.ttf');
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(boldPath, buffer);
      }
    } catch (e) {
      console.error('Failed to download Hind-Bold font', e);
    }
  }

  return {
    regExists: fs.existsSync(regPath) ? regPath : null,
    boldExists: fs.existsSync(boldPath) ? boldPath : null
  };
}

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
  let serial = await CertificateModel.countDocuments() + 1;
  let certificateNumber = `SPA-${year}-${String(serial).padStart(6, '0')}`;
  while (await CertificateModel.findOne({ certificateNumber })) {
    serial++;
    certificateNumber = `SPA-${year}-${String(serial).padStart(6, '0')}`;
  }

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
export async function approveCertificate(
  certificateId: string,
  customData?: {
    customStudentName?: string;
    customCourseTitle?: string;
    fromDate?: string;
    toDate?: string;
    grade?: string;
    conductedAt?: string;
    issueDate?: string | Date;
  }
) {
  await dbConnect();

  const certificate = await CertificateModel.findById(certificateId)
    .populate('studentId')
    .populate('courseId');

  if (!certificate) throw new Error('Certificate not found');
  if (certificate.status === 'approved') throw new Error('Certificate is already approved');

  const student = certificate.studentId as any;
  const course = certificate.courseId as any;

  // Set custom fields if provided, otherwise default
  certificate.customStudentName = customData?.customStudentName || student.fullName || 'Student';
  certificate.customCourseTitle = customData?.customCourseTitle || course.courseTitle || 'Course';
  certificate.fromDate = customData?.fromDate || '';
  certificate.toDate = customData?.toDate || '';
  certificate.grade = customData?.grade || 'B';
  certificate.conductedAt = customData?.conductedAt || 'SP ART HUB';
  if (customData?.issueDate) {
    certificate.issueDate = new Date(customData.issueDate);
  } else {
    certificate.issueDate = new Date();
  }

  // Ensure Devanagari fonts are downloaded and cached
  const fontPaths = await ensureFonts();

  // Generate QR Code URL
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const verifyUrl = `${appBaseUrl}/verify/${certificate.certificateNumber}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}`;
  certificate.qrCodeUrl = qrCodeUrl;

  const pdfUrl = `${appBaseUrl}/api/view-pdf?id=${certificate._id}`;

  certificate.pdfUrl = pdfUrl;
  certificate.status = 'approved';
  await certificate.save();

  // Send Email
  if (student.email) {
    try {
      await sendCertificateEmail({
        to: student.email,
        studentName: certificate.customStudentName,
        courseName: certificate.customCourseTitle,
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
      message: `Your Course Completion Certificate for ${certificate.customCourseTitle} has been generated successfully.`,
      type: 'certificate_generated',
      priority: 'Medium',
      deliveryChannels: ['In-app'],
      status: 'Sent',
    });

    await NotificationRecipientModel.create({
      notificationId: notif._id,
      userId: student._id,
      role: 'student',
    });
  } catch (e) {
    console.error('Failed to create in-app notification', e);
  }

  return certificate;
}

/** Generates the certificate PDF on the fly and returns it as a Buffer */
export async function generateCertificatePDFBuffer(certificate: any): Promise<Buffer> {
  const fontPaths = await ensureFonts();

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const verifyUrl = `${appBaseUrl}/verify/${certificate.certificateNumber}`;

  let qrBuffer: Buffer | null = null;
  try {
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 150 });
    qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
  } catch (e) {
    console.error("Failed to generate QR code locally", e);
  }

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margins: { top: 30, bottom: 30, left: 30, right: 30 }
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err) => reject(err));

    // Register font if downloaded
    if (fontPaths.regExists) {
      doc.registerFont('Devanagari', fontPaths.regExists);
    } else {
      doc.registerFont('Devanagari', 'Helvetica');
    }

    if (fontPaths.boldExists) {
      doc.registerFont('Devanagari-Bold', fontPaths.boldExists);
    } else {
      doc.registerFont('Devanagari-Bold', 'Helvetica-Bold');
    }

    const w = doc.page.width;
    const h = doc.page.height;

    // --- Premium PDF Design ---

    // 1. Red Border Background
    doc.rect(15, 15, w - 30, h - 30).fill('#881337');

    // 2. Patterned repeating white circles inside red border
    doc.save();
    doc.fillColor('#ffffff').opacity(0.15);
    // Top and Bottom pattern
    for (let x = 25; x < w - 25; x += 14) {
      doc.circle(x, 25, 4).fill();
      doc.circle(x, h - 25, 4).fill();
    }
    // Left and Right pattern
    for (let y = 25; y < h - 25; y += 14) {
      doc.circle(25, y, 4).fill();
      doc.circle(w - 25, y, 4).fill();
    }
    doc.restore();

    // 3. Inner Cream Background Container
    doc.rect(35, 35, w - 70, h - 70).fill('#FCFBF4');

    // 4. Inner Gold Border
    doc.rect(42, 42, w - 84, h - 84).lineWidth(2).stroke('#D4AF37');

    // 5. Inner Thin Red Line
    doc.rect(46, 46, w - 92, h - 92).lineWidth(0.5).stroke('#881337');

    // 6. Foundation Header
    doc.fontSize(22).font('Times-Bold').fillColor('#881337').text('SHRI DATTAGURU EDUCATION FOUNDATION', 50, 60, { align: 'center', width: w - 100 });
    doc.fontSize(9).font('Times-BoldItalic').fillColor('#334155').text('Reg: MAHA/19391/5 F34929 (Maharashtra Government Approved)', 50, 85, { align: 'center', width: w - 100 });

    // 7. Embed Logo Main
    const logoPath = path.join(process.cwd(), 'public', 'logoMain.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, (w / 2) - 35, 100, { width: 70 });
    }

    // 8. Institute Text
    doc.fontSize(12).font('Times-Bold').fillColor('#0f172a').text('PROFESSIONAL DRAWING & PAINTING INSTITUTE FOR KIDS AND ADULTS', 50, 175, { align: 'center', width: w - 100 });
    doc.fontSize(10).font('Times-Bold').fillColor('#b91c1c').text('AN ISO 9001:2015', 50, 192, { align: 'center', width: w - 100 });

    // 9. Big "Certificate" text
    doc.fontSize(38).font('Times-BoldItalic').fillColor('#881337').text('Certificate', 50, 205, { align: 'center', width: w - 100 });

    // 10. "This is to certify that"
    doc.fontSize(10).font('Times-Italic').fillColor('#334155').text('This is to certify that', 50, 252, { align: 'center', width: w - 100 });
    doc.fontSize(10).font('Devanagari').fillColor('#334155').text('यह प्रमाणित किया जाता है की', 50, 265, { align: 'center', width: w - 100 });

    // 11. Student Name
    doc.fontSize(22).font('Devanagari-Bold').fillColor('#0f172a').text(certificate.customStudentName, 50, 280, { align: 'center', width: w - 100 });

    // 12. Completion details
    doc.fontSize(10).font('Times-Italic').fillColor('#334155').text('This student has successfully completed the certificate course in', 50, 315, { align: 'center', width: w - 100 });
    doc.fontSize(10).font('Devanagari').fillColor('#334155').text('इस छात्र ने सफलतापूर्वक सर्टिफिकेट कोर्स पूरा कर लिया है', 50, 328, { align: 'center', width: w - 100 });

    // 13. Course Title
    doc.fontSize(18).font('Devanagari-Bold').fillColor('#881337').text(certificate.customCourseTitle, 50, 342, { align: 'center', width: w - 100 });

    // 14. Conducted at, Dates & Grade
    doc.fontSize(10).font('Times-Italic').fillColor('#334155').text('Conducted at', 50, 368, { align: 'center', width: w - 100 });
    doc.fontSize(12).font('Times-Bold').fillColor('#881337').text(certificate.conductedAt, 50, 380, { align: 'center', width: w - 100 });

    const dateRange = (certificate.fromDate && certificate.toDate) 
      ? `From ${certificate.fromDate} to ${certificate.toDate}` 
      : '';
    const gradeText = certificate.grade ? ` with Grade "${certificate.grade}"` : '';
    if (dateRange || gradeText) {
      doc.fontSize(10).font('Times-BoldItalic').fillColor('#334155').text(`${dateRange}${gradeText}`, 50, 396, { align: 'center', width: w - 100 });
    }

    // 15. Witness Text
    doc.fontSize(9).font('Times-Italic').fillColor('#475569').text('In witness whereof is best the signature & seal of the Director, Shri Dattaguru Education Foundation', 50, 420, { align: 'center', width: w - 100 });
    doc.fontSize(9).font('Devanagari').fillColor('#475569').text('गवाह में जिसका सबसे अच्छा हस्ताक्षर एवं निदेशक शैक्षणिक बोर्ड की व्यावसायिक मुहर है श्री दत्तगुरु शिक्षा फाउंडेशन मुहर है', 50, 432, { align: 'center', width: w - 100 });

    // 16. Bottom layout: Signatures, Seal, QR Code
    const bottomY = h - 110;

    // Chairman signature line
    doc.lineWidth(1).moveTo(70, bottomY + 20).lineTo(200, bottomY + 20).stroke('#334155');
    doc.fontSize(9).font('Times-Bold').fillColor('#0f172a').text('CHAIRMAN\nOF EXAMINATION', 70, bottomY + 25, { width: 130, align: 'center' });

    // Director signature line
    doc.lineWidth(1).moveTo(355, bottomY + 20).lineTo(485, bottomY + 20).stroke('#334155');
    doc.fontSize(9).font('Times-Bold').fillColor('#0f172a').text('DIRECTOR OF\nSP ART HUB', 355, bottomY + 25, { width: 130, align: 'center' });

    // QR Code
    if (qrBuffer) {
      doc.image(qrBuffer, 245, bottomY - 5, { width: 60 });
      doc.fontSize(7).font('Times-Bold').fillColor('#64748b').text('Scan to Verify', 245, bottomY + 58, { width: 60, align: 'center' });
    }

    // Draw Wax Seal on the right
    const sealX = w - 140;
    const sealY = bottomY + 5;

    // Wax Ribbons
    doc.save();
    doc.fillColor('#881337');
    doc.polygon([sealX - 10, sealY + 10], [sealX - 25, sealY + 45], [sealX - 5, sealY + 40], [sealX, sealY + 10]).fill();
    doc.fillColor('#991b1b');
    doc.polygon([sealX + 10, sealY + 10], [sealX + 25, sealY + 45], [sealX + 5, sealY + 40], [sealX, sealY + 10]).fill();
    doc.restore();

    // Outer Wax Base (concentric circles for wobbly look)
    doc.save();
    doc.fillColor('#881337');
    doc.circle(sealX, sealY, 26).fill();
    doc.fillColor('#991b1b');
    doc.circle(sealX - 1, sealY + 1, 24).fill();
    // Inner Seal Core
    doc.fillColor('#b91c1c');
    doc.circle(sealX, sealY, 18).fill();
    // Golden Ring
    doc.lineWidth(1.5).strokeColor('#D4AF37').circle(sealX, sealY, 15).stroke();
    doc.restore();

    doc.fontSize(7).font('Times-Bold').fillColor('#881337').text('OFFICIAL SEAL', w - 205, bottomY + 55, { width: 130, align: 'center' });

    // Finish doc
    doc.end();
  });
}
