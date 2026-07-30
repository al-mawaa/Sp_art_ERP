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
  const gothicPath = path.join(fontsDir, 'UnifrakturMaguntia-Regular.ttf');

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

  if (!fs.existsSync(gothicPath)) {
    try {
      const res = await fetch('https://raw.githubusercontent.com/google/fonts/main/ofl/unifrakturmaguntia/UnifrakturMaguntia-Regular.ttf');
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(gothicPath, buffer);
      }
    } catch (e) {
      console.error('Failed to download Gothic font', e);
    }
  }

  return {
    regExists: fs.existsSync(regPath) ? regPath : null,
    boldExists: fs.existsSync(boldPath) ? boldPath : null,
    gothicExists: fs.existsSync(gothicPath) ? gothicPath : null
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

/** Helper to draw text along an arch/curve matching the certificate styling */
function drawArchedText(
  doc: any,
  text: string,
  cx: number,
  cy: number,
  r: number,
  fontName: string,
  fontSize: number,
  fillColor: string,
  letterSpacingMultiplier = 1.08
) {
  doc.save();
  doc.font(fontName).fontSize(fontSize).fillColor(fillColor);

  const len = text.length;
  const charWidths: number[] = [];
  let totalWidth = 0;
  
  for (let i = 0; i < len; i++) {
    const charW = doc.widthOfString(text[i]);
    charWidths.push(charW);
    totalWidth += charW;
  }

  // Apply letter spacing multiplier
  totalWidth *= letterSpacingMultiplier;

  // Arc span in radians
  const span = totalWidth / r;
  const startAngle = -Math.PI / 2 - span / 2;

  let currentAngle = startAngle;
  for (let i = 0; i < len; i++) {
    const char = text[i];
    const charW = charWidths[i] * letterSpacingMultiplier;
    
    // Middle angle of the character segment
    const charAngleSpan = charW / r;
    const midAngle = currentAngle + charAngleSpan / 2;

    const x = cx + r * Math.cos(midAngle);
    const y = cy + r * Math.sin(midAngle);

    doc.save();
    doc.translate(x, y);
    // Rotate coordinate system so text is perpendicular to radial vector (normal)
    doc.rotate((midAngle + Math.PI / 2) * (180 / Math.PI));
    
    // Draw the character centered at the rotated origin
    doc.text(char, -charWidths[i] / 2, -fontSize / 2, { lineBreak: false });
    doc.restore();

    currentAngle += charAngleSpan;
  }

  doc.restore();
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
      layout: 'portrait',
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

    if (fontPaths.gothicExists) {
      doc.registerFont('Gothic', fontPaths.gothicExists);
    } else {
      doc.registerFont('Gothic', 'Times-BoldItalic');
    }

    const w = doc.page.width;
    const h = doc.page.height;

    // --- Premium PDF Design ---

    // 1. Solid Outer Red Background Fill
    doc.rect(0, 0, w, h).fill('#881337');

    // 2. Interlocking White Rings Pattern on Outer Margins
    doc.save();
    doc.strokeColor('#ffffff').lineWidth(0.85).opacity(0.85);
    // Top border rings
    for (let x = 10; x < w - 10; x += 11) {
      doc.circle(x, 17.5, 7.5).stroke();
    }
    // Bottom border rings
    for (let x = 10; x < w - 10; x += 11) {
      doc.circle(x, h - 17.5, 7.5).stroke();
    }
    // Left border rings
    for (let y = 10; y < h - 10; y += 11) {
      doc.circle(17.5, y, 7.5).stroke();
    }
    // Right border rings
    for (let y = 10; y < h - 10; y += 11) {
      doc.circle(w - 17.5, y, 7.5).stroke();
    }
    doc.restore();

    // 3. Cream Inner Background Container
    doc.rect(35, 35, w - 70, h - 70).fill('#F8F3E3');

    // 4. Staggered Watermark Pattern "SP ART HUB"
    doc.save();
    doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#B59353').opacity(0.04);
    const watermarkText = "SP ART HUB     ";
    const singleLine = watermarkText.repeat(16);
    for (let y = 45; y < h - 45; y += 13) {
      const xOffset = (Math.floor(y / 13) % 2 === 0) ? 50 : 35;
      doc.text(singleLine, xOffset, y, { lineBreak: false });
    }
    doc.restore();

    // 5. Central Mandala Ornament Watermark
    doc.save();
    doc.strokeColor('#B59353').lineWidth(0.5).opacity(0.045);
    const cx = w / 2;
    const cy = h / 2 + 10;
    doc.circle(cx, cy, 60).stroke();
    doc.circle(cx, cy, 80).stroke();
    doc.circle(cx, cy, 100).stroke();
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
      const px = cx + 80 * Math.cos(angle);
      const py = cy + 80 * Math.sin(angle);
      doc.circle(px, py, 40).stroke();
    }
    doc.restore();

    // 6. Gold Inner Double Border Layout
    doc.rect(42, 42, w - 84, h - 84).lineWidth(2.8).stroke('#D4AF37');
    doc.rect(47, 47, w - 94, h - 94).lineWidth(0.8).stroke('#881337');
    doc.rect(49.5, 49.5, w - 99, h - 99).lineWidth(0.5).stroke('#D4AF37');

    // 7. Foundation Header
    doc.fontSize(18).font('Times-Bold').fillColor('#881337').text('SHRI DATTAGURU EDUCATION FOUNDATION', 50, 70, { align: 'center', width: w - 100 });
    doc.fontSize(8.5).font('Times-BoldItalic').fillColor('#334155').text('Reg: MAHA/19391/5 F34929 (Maharashtra Government Approved)', 50, 92, { align: 'center', width: w - 100 });

    // 8. Embed Logo Main
    const logoPath = path.join(process.cwd(), 'public', 'logoMain.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, (w / 2) - 40, 110, { width: 80 });
    }

    // 9. Arched Institute Titles
    // Center at w/2, cy = 475, radius = 270/254
    drawArchedText(
      doc,
      "PROFESSIONAL DRAWING & PAINTING INSTITUTE",
      w / 2,
      475,
      270,
      'Times-Bold',
      12.5,
      '#0f172a'
    );
    drawArchedText(
      doc,
      "FOR KIDS AND ADULTS",
      w / 2,
      475,
      254,
      'Times-Bold',
      10.5,
      '#0f172a'
    );

    // 10. ISO Sub-header
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#b91c1c').text('AN ISO 9001:2015', 50, 246, { align: 'center', width: w - 100 });

    // 11. Gothic Certificate Text
    doc.fontSize(46).font('Gothic').fillColor('#881337').text('Certificate', 50, 260, { align: 'center', width: w - 100 });

    // 12. Certify Introductory Text
    doc.fontSize(11).font('Times-Italic').fillColor('#334155').text('This is to certify that', 50, 320, { align: 'center', width: w - 100 });
    doc.fontSize(10).font('Devanagari').fillColor('#334155').text('यह प्रमाणित किया जाता है की', 50, 336, { align: 'center', width: w - 100 });

    // 13. Student Name
    doc.fontSize(24).font('Devanagari-Bold').fillColor('#0f172a').text(certificate.customStudentName, 50, 368, { align: 'center', width: w - 100 });

    // 14. Completion Text Details
    doc.fontSize(11).font('Times-Italic').fillColor('#334155').text('This student has successfully completed the certificate course in', 50, 432, { align: 'center', width: w - 100 });
    doc.fontSize(10).font('Devanagari').fillColor('#334155').text('इस छात्र ने सफलतापूर्वक सर्टिफिकेट कोर्स पूरा कर लिया है', 50, 448, { align: 'center', width: w - 100 });

    // 15. Course Title
    doc.fontSize(20).font('Devanagari-Bold').fillColor('#881337').text(certificate.customCourseTitle, 50, 472, { align: 'center', width: w - 100 });

    // 16. Conducted at, Dates & Grade
    doc.fontSize(11).font('Times-Italic').fillColor('#334155').text('Conducted at', 50, 512, { align: 'center', width: w - 100 });
    doc.fontSize(13).font('Times-Bold').fillColor('#881337').text(certificate.conductedAt, 50, 528, { align: 'center', width: w - 100 });

    const dateRange = (certificate.fromDate && certificate.toDate) 
      ? `From ${certificate.fromDate} to ${certificate.toDate}` 
      : '';
    const gradeText = certificate.grade ? ` with Grade "${certificate.grade}"` : '';
    if (dateRange || gradeText) {
      doc.fontSize(10.5).font('Times-BoldItalic').fillColor('#334155').text(`${dateRange}${gradeText}`, 50, 548, { align: 'center', width: w - 100 });
    }

    // 17. Witness Text
    doc.fontSize(9).font('Times-Italic').fillColor('#475569').text('In witness whereof is best the signature & seal of the Director, Shri Dattaguru Education Foundation', 50, 590, { align: 'center', width: w - 100 });
    doc.fontSize(9).font('Devanagari').fillColor('#475569').text('गवाह में जिसका सबसे अच्छा हस्ताक्षर एवं निदेशक शैक्षणिक बोर्ड की व्यावसायिक मुहर है श्री दत्तगुरु शिक्षा फाउंडेशन मुहर है', 50, 604, { align: 'center', width: w - 100 });

    // 18. Bottom layout: Signatures, ISO Badge, QR Code, Seal
    const bottomY = h - 145;

    // Chairman signature line
    doc.lineWidth(1).moveTo(65, bottomY + 20).lineTo(185, bottomY + 20).stroke('#334155');
    doc.fontSize(9).font('Times-Bold').fillColor('#0f172a').text('CHAIRMAN\nOF EXAMINATION', 65, bottomY + 25, { width: 120, align: 'center' });

    // Stylized ISO Badge
    const isoX = 205;
    const isoY = bottomY + 20;
    doc.save();
    doc.fillColor('#0b3c5d');
    doc.circle(isoX, isoY, 18).fill();
    doc.fillColor('#ffffff');
    doc.circle(isoX, isoY, 16).fill();
    doc.fillColor('#0b3c5d');
    doc.circle(isoX, isoY, 14).fill();
    doc.fontSize(6).font('Helvetica-Bold').fillColor('#ffffff').text('ISO', isoX - 10, isoY - 7, { width: 20, align: 'center' });
    doc.fontSize(4.5).text('9001:2015', isoX - 15, isoY + 1, { width: 30, align: 'center' });
    doc.restore();

    // QR Code
    if (qrBuffer) {
      doc.image(qrBuffer, 235, bottomY - 5, { width: 55 });
      doc.fontSize(6.5).font('Times-Bold').fillColor('#64748b').text('Scan to Verify', 235, bottomY + 54, { width: 55, align: 'center' });
    }

    // Director signature line
    doc.lineWidth(1).moveTo(310, bottomY + 20).lineTo(430, bottomY + 20).stroke('#334155');
    doc.fontSize(9).font('Times-Bold').fillColor('#0f172a').text('DIRECTOR OF\nSP ART HUB', 310, bottomY + 25, { width: 120, align: 'center' });

    // Draw Wax Seal on the right
    const sealX = 495;
    const sealY = bottomY + 15;

    // Wax Ribbons
    doc.save();
    doc.fillColor('#881337');
    doc.polygon([sealX - 10, sealY + 10], [sealX - 25, sealY + 45], [sealX - 5, sealY + 40], [sealX, sealY + 10]).fill();
    doc.fillColor('#991b1b');
    doc.polygon([sealX + 10, sealY + 10], [sealX + 25, sealY + 45], [sealX + 5, sealY + 40], [sealX, sealY + 10]).fill();
    doc.restore();

    // Outer Wax Base
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

    doc.fontSize(7).font('Times-Bold').fillColor('#881337').text('OFFICIAL SEAL', sealX - 65, bottomY + 50, { width: 130, align: 'center' });

    // Finish doc
    doc.end();
  });
}
