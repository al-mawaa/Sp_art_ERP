import { jsPDF } from "jspdf";

export type PaymentReceiptInput = {
  studentName: string;
  courseName: string;
  batchName: string;
  amountPaid: number;
  paymentId: string;
  receiptNumber: string;
  paymentDate: string;
  installmentLabel?: string;
};

export function downloadPaymentReceiptPdf(input: PaymentReceiptInput) {
  const doc = new jsPDF();
  const margin = 16;
  let y = margin;

  doc.setFontSize(18);
  doc.setTextColor(7, 38, 84);
  doc.text("SP Art Hub", margin, y);
  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Payment Receipt", margin, y);
  y += 14;

  doc.setDrawColor(230, 230, 230);
  doc.line(margin, y, 195, y);
  y += 10;

  const rows: [string, string][] = [
    ["Receipt No.", input.receiptNumber],
    ["Payment ID", input.paymentId],
    ["Date", input.paymentDate],
    ["Student", input.studentName],
    ["Course", input.courseName],
    ["Batch", input.batchName],
    ["Amount Paid", `₹${input.amountPaid.toLocaleString("en-IN")}`],
  ];
  if (input.installmentLabel) {
    rows.push(["Installment", input.installmentLabel]);
  }

  doc.setFontSize(11);
  rows.forEach(([label, value]) => {
    doc.setTextColor(120, 120, 120);
    doc.text(label, margin, y);
    doc.setTextColor(30, 30, 30);
    doc.text(value, margin + 52, y);
    y += 8;
  });

  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(130, 130, 130);
  doc.text("Thank you for your payment. This is a computer-generated receipt.", margin, y);

  doc.save(`receipt-${input.receiptNumber}.pdf`);
}
