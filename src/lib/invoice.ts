import PDFDocument from 'pdfkit';

export interface EnrollmentInvoiceData {
  invoiceId: string;
  academyName: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  courseCode: string;
  courseDurationMonths: number;
  baseAmount?: number;
  amountPaid: number;
  discountPercentage: number;
  discountAmount: number;
  paymentMethod: string;
  transactionId: string;
  orderId: string;
  purchaseDate: string;
  taxAmount: number;
  installmentCharge?: number;
  paymentType?: 'full' | 'installment';
  termNo?: number;
  supportEmail: string;
  supportPhone: string;
  gstNumber?: string;
}

function formatCurrency(value: number) {
  const rounded = Math.round(value * 100) / 100;
  const parts = rounded.toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const decimalPart = parts[1];
  return `Rs. ${integerPart}.${decimalPart}`;
}

function formatPurchaseDate(isoDate: string): string {
  const date = new Date(isoDate);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes.toString().padStart(2, '0');
  return `${day} ${month} ${year} | ${formattedHours}:${formattedMinutes} ${ampm}`;
}

function clampLength(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 3)}...` : value;
}

export async function generateEnrollmentInvoicePdf(data: EnrollmentInvoiceData): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk) => chunks.push(chunk));
  const endPromise = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  doc.fillColor('#0f172a');

  // Header
  doc.rect(40, 40, 515, 130).fill('#eff6ff');
  doc.fill('#1d4ed8').font('Helvetica-Bold').fontSize(20).text(data.academyName, 56, 56);
  doc.fill('#0f172a').font('Helvetica').fontSize(11).text('Professional Art Education | Student Finance Invoice', 56, 82);
  doc.fontSize(11).fillColor('#475569').text(`Invoice ID: ${data.invoiceId}`, 56, 102);
  doc.text(`Purchase Date: ${formatPurchaseDate(data.purchaseDate)}`, 56, 118);

  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(11).text('Billing To:', 330, 56);
  doc.font('Helvetica-Bold').fontSize(13).text(data.studentName, 330, 74);
  doc.font('Helvetica').fontSize(11).fillColor('#475569').text(data.studentEmail, 330, 92);
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a').text('Support:', 330, 112);
  doc.font('Helvetica').fontSize(10).fillColor('#475569').text(data.supportPhone || '', 330, 126);
  doc.font('Helvetica').text('+91 8286460462', 330, 140);

  doc.moveDown(2);
  doc.moveTo(40, 180).lineTo(555, 180).stroke('#cbd5e1');

  doc.font('Helvetica-Bold').fontSize(14).fillColor('#0f172a').text('Invoice Summary', 40, 192);
  doc.font('Helvetica').fontSize(11).fillColor('#475569');
  const summaryTop = 214;
  const summaryGap = 20;

  const summaryItems = [
    ['Course Name', data.courseTitle],
    ['Course Code', data.courseCode],
    ['Duration', `${data.courseDurationMonths} month${data.courseDurationMonths !== 1 ? 's' : ''}`],
    ...(data.baseAmount != null ? [['Base Amount', formatCurrency(data.baseAmount)] as [string, string]] : []),
    ['GST (18%)', formatCurrency(data.taxAmount)],
    ...(data.installmentCharge
      ? [['Installment Charges', formatCurrency(data.installmentCharge)] as [string, string]]
      : []),
    ...(data.paymentType === 'installment' && data.termNo
      ? [['Installment Term', `Term ${data.termNo}`] as [string, string]]
      : []),
    ['Amount Paid', formatCurrency(data.amountPaid)],
    ['Discount', `${data.discountPercentage}% (${formatCurrency(data.discountAmount)})`],
    ['Payment Method', data.paymentMethod],
    ['Payment ID', data.transactionId],
    ['Invoice Number', data.invoiceId],
    ['Order ID', data.orderId],
  ];

  summaryItems.forEach(([label, value], index) => {
    const y = summaryTop + index * summaryGap;
    doc.font('Helvetica').fontSize(11).fillColor('#64748b').text(label, 40, y);
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a').text(value, 180, y, { width: 360, align: 'right' });
  });

  const totalY = summaryTop + summaryItems.length * summaryGap + 20;
  doc.rect(40, totalY - 8, 515, 38).fill('#e0f2fe');
  doc.fillColor('#0369a1').font('Helvetica-Bold').fontSize(12).text('Total Paid', 46, totalY + 4);
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#0369a1').text(formatCurrency(data.amountPaid), 460, totalY + 4, { align: 'right' });

  doc.moveTo(40, totalY + 56).lineTo(555, totalY + 56).stroke('#cbd5e1');

  doc.font('Helvetica-Bold').fontSize(12).fillColor('#0f172a').text('Need Help?', 40, totalY + 74);
  doc.font('Helvetica').fontSize(11).fillColor('#475569').text(`If you have any questions regarding your invoice,`, 40, totalY + 92, { width: 360 });
  doc.text(`course enrollment, or payment, please contact us.`, 40, totalY + 108, { width: 360 });
  
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a').text(`Phone:`, 40, totalY + 128);
  doc.font('Helvetica').fontSize(11).fillColor('#475569').text('+91 9819703242', 85, totalY + 128);
  doc.text('+91 8286460462', 85, totalY + 142);
  
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a').text(`Email:`, 40, totalY + 156);
  doc.font('Helvetica').fontSize(11).fillColor('#475569').text(data.supportEmail, 85, totalY + 156);

  if (data.gstNumber) {
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a').text('GST Number:', 330, totalY + 86);
    doc.font('Helvetica').fontSize(10).fillColor('#475569').text(data.gstNumber, 410, totalY + 86);
  }

  doc.end();
  return endPromise;
}
