import {
  sendNewQueryAdminEmails,
  sendQueryStatusEmail,
} from "@/lib/email/queryEmailShared";

export async function sendNewSeniorTeacherQueryEmails(fields: {
  seniorTeacherName: string;
  seniorTeacherEmail: string;
  category: string;
  remarks: string;
}): Promise<string[]> {
  return sendNewQueryAdminEmails({
    roleLabel: "Senior Teacher",
    subjectPrefix: "New Senior Teacher Query Request",
    fields: {
      personName: fields.seniorTeacherName,
      personEmail: fields.seniorTeacherEmail,
      category: fields.category,
      remarks: fields.remarks,
    },
  });
}

export async function sendSeniorTeacherQueryStatusEmail(
  to: string,
  fields: {
    seniorTeacherName: string;
    seniorTeacherEmail: string;
    category: string;
    remarks: string;
    status: string;
    adminRemark?: string;
  },
  approved: boolean,
): Promise<void> {
  await sendQueryStatusEmail(to, {
    personName: fields.seniorTeacherName,
    title: approved ? "Approved" : "Rejected",
    approved,
    fields: {
      personName: fields.seniorTeacherName,
      personEmail: fields.seniorTeacherEmail,
      category: fields.category,
      remarks: fields.remarks,
      status: fields.status,
      adminRemark: fields.adminRemark,
    },
  });
}
