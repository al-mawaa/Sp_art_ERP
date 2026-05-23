import { jsPDF } from "jspdf";

export type StaffAttendancePdfRow = {
  staffName: string;
  batchName: string;
  attendanceStatus: string;
  attendanceDate: string;
  remarks: string;
};

export function exportStaffAttendancePdf(
  title: string,
  rows: StaffAttendancePdfRow[],
  filename: string,
) {
  const doc = new jsPDF({ orientation: "landscape" });
  const margin = 14;
  let y = margin;

  doc.setFontSize(16);
  doc.text(title, margin, y);
  y += 10;
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
  y += 8;

  const headers = ["Name", "Batch", "Status", "Date", "Remarks"];
  const colWidths = [45, 45, 28, 28, 120];
  let x = margin;

  doc.setFont("helvetica", "bold");
  headers.forEach((h, i) => {
    doc.text(h, x, y);
    x += colWidths[i];
  });
  y += 6;
  doc.setFont("helvetica", "normal");

  rows.forEach(row => {
    if (y > 190) {
      doc.addPage();
      y = margin;
    }
    x = margin;
    const cells = [
      row.staffName,
      row.batchName,
      row.attendanceStatus,
      row.attendanceDate,
      row.remarks || "—",
    ];
    cells.forEach((cell, i) => {
      const text = doc.splitTextToSize(String(cell), colWidths[i] - 2);
      doc.text(text, x, y);
      x += colWidths[i];
    });
    y += 8;
  });

  doc.save(filename);
}
