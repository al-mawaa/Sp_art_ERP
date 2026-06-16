import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { requireTeacherFromRequest } from '@/lib/auth/require-teacher';
import { requireSeniorTeacherFromRequest } from '@/lib/auth/require-senior-teacher';
import { getTodaysBirthdays } from '@/lib/helpers/birthdays';

export const runtime = 'nodejs';

/**
 * GET /api/dashboard/todays-birthdays
 *
 * Fetches all students with birthdays today
 * Only accessible by Teachers and Senior Teachers
 *
 * Response:
 * {
 *   "success": true,
 *   "count": 2,
 *   "birthdays": [
 *     {
 *       "id": "...",
 *       "name": "Aarav Sharma",
 *       "dob": "2017-07-15T00:00:00.000Z",
 *       "age": 8,
 *       "batch": "Watercolor Basics",
 *       "photo": "..."
 *     }
 *   ]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Check if user is teacher or senior teacher
    const teacherCheck = await requireTeacherFromRequest(request);
    const seniorTeacherCheck = await requireSeniorTeacherFromRequest(request);

    if (!teacherCheck.ok && !seniorTeacherCheck.ok) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. Only teachers and senior teachers can view birthday reminders.',
        },
        { status: 401 }
      );
    }

    // Fetch today's birthdays
    const birthdays = await getTodaysBirthdays();

    return NextResponse.json({
      success: true,
      count: birthdays.length,
      birthdays,
    });
  } catch (error) {
    console.error('Error fetching today\'s birthdays:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch birthday reminders',
      },
      { status: 500 }
    );
  }
}
