import type { HydratedDocument } from "mongoose";
import bcrypt from "bcryptjs";
import Credential, { type CredentialDocument } from "@/lib/models/Credentials";
import Student, { type StudentDocument } from "@/lib/models/Student";
import { verifyCredentialPassword } from "@/lib/auth/verifyCredentialPassword";

export type StudentHydrated = HydratedDocument<StudentDocument>;

export type StudentProfileDto = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  age: number | null;
  gender: string;
  studentId: string;
  profileImage: string;
  dob: string;
  bloodGroup: string;
  school: string;
  college: string;
  occupation: string;
  fatherName: string;
  fatherMobile: string;
  fatherOccupation: string;
  motherName: string;
  motherMobile: string;
  motherOccupation: string;
  address: string;
  howYouKnowUs: string;
  batchName: string;
  batchTiming: string;
  courseName: string;
  teacherName: string;
  role: string;
  classes: {
    id: string;
    batchName: string;
    batchTiming: string;
    courseName: string;
    teacherName: string;
  }[];
};

function formatDob(value?: Date | string | null): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function toProfileDto(doc: StudentDocument): StudentProfileDto {
  return {
    id: doc._id.toString(),
    fullName: doc.fullName,
    email: doc.email ?? "",
    phone: doc.phone ?? "",
    age: doc.age ?? null,
    gender: doc.gender ?? "",
    studentId: doc.badgeId,
    profileImage: doc.photo ?? "",
    dob: formatDob(doc.dob),
    bloodGroup: doc.bloodGroup ?? "",
    school: doc.school ?? "",
    college: doc.college ?? "",
    occupation: doc.occupation ?? "",
    fatherName: doc.fatherName ?? "",
    fatherMobile: doc.fatherMobile ?? "",
    fatherOccupation: doc.fatherOccupation ?? "",
    motherName: doc.motherName ?? "",
    motherMobile: doc.motherMobile ?? "",
    motherOccupation: doc.motherOccupation ?? "",
    address: doc.address ?? "",
    howYouKnowUs: doc.howYouKnowUs ?? doc.howYouComeToKnow ?? "",
    batchName: doc.className ?? "",
    batchTiming: "",
    courseName: doc.className ?? "",
    teacherName: "",
    role: "student",
    classes: [],
  };
}

/** Read from existing `students` collection only — never inserts. */
export async function findStudentByEmail(
  email: string,
  options?: { withPassword?: boolean },
): Promise<StudentHydrated | null> {
  const normalized = email.toLowerCase().trim();
  if (!normalized) return null;

  let query = Student.findOne({
    email: { $regex: new RegExp(`^${escapeRegex(normalized)}$`, "i") },
  });
  if (options?.withPassword) {
    query = query.select("+passwordHash");
  }
  return query;
}

/** Read from existing `students` collection only — never inserts. */
export async function findStudentById(
  id: string,
  options?: { withPassword?: boolean },
): Promise<StudentHydrated | null> {
  let query = Student.findById(id);
  if (options?.withPassword) {
    query = query.select("+passwordHash");
  }
  return query;
}

/** Save portal password on an existing student row (admin credential setup). */
export async function syncStudentPortalPassword(
  student: StudentHydrated,
  passwordHash: string,
) {
  if (!student.passwordHash) {
    student.passwordHash = passwordHash;
    await student.save();
  }
  return student;
}

/**
 * Login using only documents already in `students`.
 * Does not create students, credentials, or any other collection rows.
 */
export async function authenticateStudentLogin(
  email: string,
  password: string,
): Promise<StudentHydrated | null> {
  const normalized = email.toLowerCase().trim();
  const student = await findStudentByEmail(normalized, { withPassword: true });

  if (!student) {
    return null;
  }

  if (student.passwordHash) {
    try {
      if (await bcrypt.compare(password, student.passwordHash)) return student;
    } catch {
      /* fall through to credentials */
    }
  }

  const credential = await Credential.findOne({
    email: { $regex: new RegExp(`^${escapeRegex(normalized)}$`, "i") },
    role: "student",
  });
  if (!credential || credential.accountStatus !== "Active") {
    return null;
  }

  const valid = await verifyCredentialPassword(credential as CredentialDocument, password);
  if (!valid) return null;

  student.passwordHash = credential.passwordHash;
  await student.save();
  return student;
}

export type StudentProfileUpdate = {
  fullName?: string;
  phone?: string;
  age?: number | null;
  gender?: string;
  profileImage?: string;
  dob?: string | null;
  bloodGroup?: string;
  school?: string;
  college?: string;
  occupation?: string;
  fatherName?: string;
  fatherMobile?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherMobile?: string;
  motherOccupation?: string;
  address?: string;
  howYouKnowUs?: string;
};

/** Update existing `students` document only — never inserts. */
export async function updateStudentProfile(
  studentId: string,
  sessionEmail: string,
  data: StudentProfileUpdate,
): Promise<StudentHydrated | null> {
  let student = await findStudentById(studentId);
  if (!student && sessionEmail) {
    student = await findStudentByEmail(sessionEmail);
  }
  if (!student) return null;

  if (data.fullName !== undefined) student.fullName = data.fullName;
  if (data.phone !== undefined) student.phone = data.phone;
  if (data.age !== undefined) student.age = data.age ?? undefined;
  if (data.gender !== undefined) student.gender = data.gender;
  if (data.profileImage !== undefined) {
    student.photo = data.profileImage || undefined;
  }
  if (data.dob !== undefined) {
    student.dob = data.dob ? new Date(data.dob) : undefined;
  }
  if (data.bloodGroup !== undefined) student.bloodGroup = data.bloodGroup || undefined;
  if (data.school !== undefined) student.school = data.school || undefined;
  if (data.college !== undefined) student.college = data.college || undefined;
  if (data.occupation !== undefined) student.occupation = data.occupation || undefined;
  if (data.fatherName !== undefined) student.fatherName = data.fatherName || undefined;
  if (data.fatherMobile !== undefined) student.fatherMobile = data.fatherMobile || undefined;
  if (data.fatherOccupation !== undefined) {
    student.fatherOccupation = data.fatherOccupation || undefined;
  }
  if (data.motherName !== undefined) student.motherName = data.motherName || undefined;
  if (data.motherMobile !== undefined) student.motherMobile = data.motherMobile || undefined;
  if (data.motherOccupation !== undefined) {
    student.motherOccupation = data.motherOccupation || undefined;
  }
  if (data.address !== undefined) student.address = data.address || undefined;
  if (data.howYouKnowUs !== undefined) {
    student.howYouKnowUs = data.howYouKnowUs || undefined;
    student.howYouComeToKnow = data.howYouKnowUs || undefined;
  }

  await student.save();
  return student;
}
