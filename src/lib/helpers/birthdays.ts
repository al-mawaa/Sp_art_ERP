import mongoose from 'mongoose';
import Student from '@/lib/models/Student';

/**
 * Birthday data returned from the API and used in components
 */
export interface BirthdayData {
  id: string;
  name: string;
  dob: string; // ISO date string
  age: number;
  batch: string;
  photo?: string;
  email?: string;
}

/**
 * Calculates age from date of birth
 */
export function calculateAge(dob: Date | string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return Math.max(0, age);
}

/**
 * Checks if a date matches today (only comparing day and month)
 */
export function isToday(date: Date | string | null | undefined): boolean {
  if (!date) return false;

  const birthDate = new Date(date);
  const today = new Date();

  return (
    birthDate.getDate() === today.getDate() &&
    birthDate.getMonth() === today.getMonth()
  );
}

/**
 * Fetches all students with birthdays today
 * Includes students from both `students` and `studentcredentials` collections
 */
export async function getTodaysBirthdays(): Promise<BirthdayData[]> {
  try {
    const students = await Student.find()
      .select('fullName email dob className photo')
      .lean()
      .exec();

    const birthdays = students
      .filter((student) => isToday(student.dob))
      .map((student) => ({
        id: student._id?.toString() || '',
        name: student.fullName,
        dob: student.dob instanceof Date ? student.dob.toISOString() : String(student.dob),
        age: calculateAge(student.dob),
        batch: student.className || 'Not Assigned',
        photo: student.photo || undefined,
        email: student.email || undefined,
      }));

    return birthdays;
  } catch (error) {
    console.error('Error fetching today\'s birthdays:', error);
    throw error;
  }
}

/**
 * Get birthday summary count and names for quick display
 */
export async function getBirthdaySummary(): Promise<{
  count: number;
  names: string[];
}> {
  const birthdays = await getTodaysBirthdays();
  return {
    count: birthdays.length,
    names: birthdays.map((b) => b.name),
  };
}
