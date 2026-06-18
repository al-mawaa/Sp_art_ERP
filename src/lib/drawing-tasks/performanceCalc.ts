import mongoose from 'mongoose';
import StudentEvaluation from '@/lib/models/StudentEvaluation';
import TeacherPerformance from '@/lib/models/TeacherPerformance';

/**
 * Calculate student performance percentage from marks
 */
export function calculateStudentPerformance(marks: {
  drawing: number;
  coloring: number;
  speed: number;
  neatness: number;
  creativity: number;
  accuracy: number;
}): { obtained: number; percentage: number } {
  const obtained = marks.drawing + marks.coloring + marks.speed + marks.neatness + marks.creativity + marks.accuracy;
  const maximum = 30;
  const percentage = (obtained / maximum) * 100;
  return { obtained, percentage };
}

/**
 * Calculate and update teacher performance metrics
 */
export async function recalculateTeacherPerformance(teacherId: string): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(teacherId)) return;

  const teacherOid = new mongoose.Types.ObjectId(teacherId);

  try {
    // Get all evaluations for this teacher
    const evaluations = await StudentEvaluation.find({
      teacherId: teacherOid,
    })
      .select('performancePercentage evaluatedAt')
      .lean();

    if (evaluations.length === 0) {
      // No evaluations yet
      await TeacherPerformance.findOneAndUpdate(
        { teacherId: teacherOid },
        {
          totalStudentsEvaluated: 0,
          averagePerformance: 0,
          incentiveEligible: false,
          incentivePercentage: 0,
          lastUpdatedAt: new Date(),
        },
        { upsert: true, new: true },
      );
      return;
    }

    // Calculate average performance
    const totalPercentage = evaluations.reduce((sum, ev) => sum + ev.performancePercentage, 0);
    const averagePerformance = totalPercentage / evaluations.length;

    // Determine incentive eligibility
    const incentiveEligible = averagePerformance >= 80;
    const incentivePercentage = incentiveEligible ? averagePerformance - 80 : 0;

    // Find latest evaluation date
    const latestEvaluation = evaluations.reduce((latest, current) =>
      current.evaluatedAt > latest.evaluatedAt ? current : latest,
    );

    // Update teacher performance
    await TeacherPerformance.findOneAndUpdate(
      { teacherId: teacherOid },
      {
        totalStudentsEvaluated: evaluations.length,
        averagePerformance: Math.round(averagePerformance * 100) / 100,
        incentiveEligible,
        incentivePercentage: Math.round(incentivePercentage * 100) / 100,
        lastEvaluatedAt: latestEvaluation.evaluatedAt,
        lastUpdatedAt: new Date(),
      },
      { upsert: true, new: true },
    );
  } catch (error) {
    console.error('Failed to recalculate teacher performance:', error);
    throw error;
  }
}

/**
 * Get teacher performance metrics
 */
export async function getTeacherPerformance(teacherId: string) {
  if (!mongoose.Types.ObjectId.isValid(teacherId)) {
    return null;
  }

  const teacherOid = new mongoose.Types.ObjectId(teacherId);
  return await TeacherPerformance.findOne({ teacherId: teacherOid }).lean();
}
