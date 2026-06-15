import {
  sendNewQueryAdminEmails,
  sendQueryStatusEmail,
} from "@/lib/email/queryEmailShared";

export async function sendNewStudentQueryEmails(fields: {
  studentName: string;
  studentEmail: string;
  category: string;
  remarks: string;
}): Promise<string[]> {
  return sendNewQueryAdminEmails({
    roleLabel: "Student",
    subjectPrefix: "New Student Query Request",
    fields: {
      personName: fields.studentName,
      personEmail: fields.studentEmail,
      category: fields.category,
      remarks: fields.remarks,
    },
  });
}

export async function sendStudentQueryStatusEmail(
  to: string,
  fields: {
    studentName: string;
    studentEmail: string;
    category: string;
    remarks: string;
    status: string;
    adminRemark?: string;
  },
  approved: boolean,
): Promise<void> {
  await sendQueryStatusEmail(to, {
    personName: fields.studentName,
    title: approved ? "Approved" : "Rejected",
    approved,
    fields: {
      personName: fields.studentName,
      personEmail: fields.studentEmail,
      category: fields.category,
      remarks: fields.remarks,
      status: fields.status,
      adminRemark: fields.adminRemark,
    },
  });
}
