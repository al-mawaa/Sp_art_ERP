import {
  sendNewQueryAdminEmails,
  sendQueryStatusEmail,
} from "@/lib/email/queryEmailShared";

export async function sendNewTeacherQueryEmails(fields: {
  teacherName: string;
  teacherEmail: string;
  category: string;
  remarks: string;
}): Promise<string[]> {
  return sendNewQueryAdminEmails({
    roleLabel: "Teacher",
    subjectPrefix: "New Teacher Query Request",
    fields: {
      personName: fields.teacherName,
      personEmail: fields.teacherEmail,
      category: fields.category,
      remarks: fields.remarks,
    },
  });
}

export async function sendTeacherQueryStatusEmail(
  to: string,
  fields: {
    teacherName: string;
    teacherEmail: string;
    category: string;
    remarks: string;
    status: string;
    adminRemark?: string;
  },
  approved: boolean,
): Promise<void> {
  await sendQueryStatusEmail(to, {
    personName: fields.teacherName,
    title: approved ? "Approved" : "Rejected",
    approved,
    fields: {
      personName: fields.teacherName,
      personEmail: fields.teacherEmail,
      category: fields.category,
      remarks: fields.remarks,
      status: fields.status,
      adminRemark: fields.adminRemark,
    },
  });
}
