import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { apiSuccess, apiError } from '@/lib/api-response';
import { requireStudentFromRequest } from '@/lib/auth/require-student';
import DrawingTest from '@/lib/models/DrawingTest';
import StudentEvaluation from '@/lib/models/StudentEvaluation';
import Student from '@/lib/models/Student';

export const runtime = 'nodejs';

function normalizeString(value?: string): string {
  return (value || '').toString().trim().toLowerCase();
}

function buildRegex(value: string) {
  return new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
}

function buildStudentMatchingFilters(student: { id: string; email?: string; badgeId?: string; fullName?: string }) {
  const filters: any[] = [];
  if (mongoose.Types.ObjectId.isValid(student.id)) {
    filters.push({ studentId: new mongoose.Types.ObjectId(student.id) });
    filters.push({ studentId: student.id });
  }

  if (student.email) {
    filters.push({ email: buildRegex(student.email) });
  }

  if (student.badgeId) {
    filters.push({ badgeId: buildRegex(student.badgeId) });
  }

  if (student.fullName) {
    filters.push({ studentName: buildRegex(student.fullName) });
  }

  return filters.length > 0 ? { $or: filters } : null;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireStudentFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();

    const student = await Student.findById(auth.student.id).lean();
    if (!student) {
      console.warn('[student/evaluations GET] authenticated student record not found', { studentId: auth.student.id });
      return apiError('Student profile not found', 404);
    }

    const studentSubject = {
      id: auth.student.id,
      email: normalizeString(student.email),
      badgeId: normalizeString(student.badgeId),
      fullName: normalizeString(student.fullName),
    };

    const studentEvaluationFilter = buildStudentMatchingFilters(studentSubject) ?? { studentId: auth.student.id };

    console.log('[student/evaluations GET] student lookup', {
      studentId: auth.student.id,
      email: student.email,
      badgeId: student.badgeId,
      fullName: student.fullName,
    });

    const submissionIdFilter = { studentId: new mongoose.Types.ObjectId(auth.student.id) };
    const tests = await DrawingTest.find(submissionIdFilter).sort({ createdAt: -1 }).lean();

    if (tests && tests.length > 0) {
      const submissionIds = tests.map(test => test._id);
      const evaluations = submissionIds.length
        ? await StudentEvaluation.find({ submissionId: { $in: submissionIds } }).lean()
        : [];

      const evaluationMap = new Map(evaluations.map(e => [String(e.submissionId), e]));
      const payload = tests.map(test => {
        const evaluation = evaluationMap.get(String(test._id));
        return {
          id: evaluation ? String(evaluation._id) : String(test._id),
          submissionId: String(test._id),
          testTitle: test.testTitle,
          teacherName: test.teacherName,
          batchName: test.batchName,
          courseName: test.courseName,
          timeTaken: test.timeTaken,
          teacherDrawingImage: test.teacherDrawingImage,
          studentDrawingImage: test.studentDrawingImage,
          status: test.status,
          submittedAt: test.submittedAt?.toISOString?.() ?? null,
          evaluatedAt: evaluation?.evaluatedAt?.toISOString?.() ?? null,
          evaluation: evaluation
            ? {
                id: String(evaluation._id),
                drawingMarks: evaluation.drawingMarks,
                coloringMarks: evaluation.coloringMarks,
                speedMarks: evaluation.speedMarks,
                neatnessMarks: evaluation.neatnessMarks,
                creativityMarks: evaluation.creativityMarks,
                accuracyMarks: evaluation.accuracyMarks,
                obtainedMarks: evaluation.obtainedMarks,
                maxMarks: evaluation.maxMarks,
                performancePercentage: evaluation.performancePercentage,
                remarks: evaluation.remarks,
                evaluatedAt: evaluation.evaluatedAt?.toISOString?.() ?? '',
              }
            : null,
        };
      });
      return apiSuccess({ evaluations: payload });
    }

    const evalsByStudent = await StudentEvaluation.find(studentEvaluationFilter).sort({ evaluatedAt: -1 }).lean();
    if (evalsByStudent.length > 0) {
      const submissionIds = evalsByStudent.map(e => e.submissionId).filter(Boolean);
      const subs = submissionIds.length ? await DrawingTest.find({ _id: { $in: submissionIds } }).lean() : [];
      const subMap = new Map(subs.map(s => [String(s._id), s]));
      const payload = evalsByStudent.map(e => {
        const sub = subMap.get(String(e.submissionId));
        return {
          id: String(e._id),
          submissionId: String(e.submissionId),
          testTitle: sub?.testTitle ?? 'Drawing test',
          teacherName: sub?.teacherName ?? '',
          batchName: sub?.batchName ?? '',
          courseName: sub?.courseName ?? '',
          timeTaken: sub?.timeTaken ?? 0,
          teacherDrawingImage: sub?.teacherDrawingImage ?? '',
          studentDrawingImage: sub?.studentDrawingImage ?? '',
          status: sub?.status ?? 'Reviewed',
          submittedAt: sub?.submittedAt?.toISOString?.() ?? null,
          evaluatedAt: e.evaluatedAt?.toISOString?.() ?? null,
          evaluation: {
            id: String(e._id),
            drawingMarks: e.drawingMarks,
            coloringMarks: e.coloringMarks,
            speedMarks: e.speedMarks,
            neatnessMarks: e.neatnessMarks,
            creativityMarks: e.creativityMarks,
            accuracyMarks: e.accuracyMarks,
            obtainedMarks: e.obtainedMarks,
            maxMarks: e.maxMarks,
            performancePercentage: e.performancePercentage,
            remarks: e.remarks,
            evaluatedAt: e.evaluatedAt?.toISOString?.() ?? '',
          },
        };
      });
      console.log('[student/evaluations GET] matched by evaluation studentId/email/badge/name', { count: payload.length });
      return apiSuccess({ evaluations: payload });
    }

    const allEvals = await StudentEvaluation.find({}).sort({ evaluatedAt: -1 }).lean();
    const allSubmissionIds = allEvals.map(e => e.submissionId).filter(Boolean);
    const allSubs = allSubmissionIds.length ? await DrawingTest.find({ _id: { $in: allSubmissionIds } }).lean() : [];
    const subById = new Map(allSubs.map(s => [String(s._id), s]));

    const matching = allEvals
      .map(e => ({ evaluation: e, submission: subById.get(String(e.submissionId)) }))
      .filter(item => {
        const sub = item.submission;
        if (!sub) return false;
        if (String(sub.studentId) === auth.student.id) return true;
        if (studentSubject.email && normalizeString((sub as any).studentEmail) === studentSubject.email) return true;
        if (studentSubject.badgeId && normalizeString((sub as any).studentBadgeId) === studentSubject.badgeId) return true;
        if (studentSubject.fullName && normalizeString(sub.studentName) === studentSubject.fullName) return true;
        return false;
      });

    const fallbackPayload = matching.map(({ evaluation: e, submission: sub }) => ({
      id: String(e._id),
      submissionId: String(e.submissionId),
      testTitle: sub?.testTitle ?? 'Drawing test',
      teacherName: sub?.teacherName ?? '',
      batchName: sub?.batchName ?? '',
      courseName: sub?.courseName ?? '',
      timeTaken: sub?.timeTaken ?? 0,
      teacherDrawingImage: sub?.teacherDrawingImage ?? '',
      studentDrawingImage: sub?.studentDrawingImage ?? '',
      status: sub?.status ?? 'Reviewed',
      submittedAt: sub?.submittedAt?.toISOString?.() ?? null,
      evaluatedAt: e.evaluatedAt?.toISOString?.() ?? null,
      evaluation: {
        id: String(e._id),
        drawingMarks: e.drawingMarks,
        coloringMarks: e.coloringMarks,
        speedMarks: e.speedMarks,
        neatnessMarks: e.neatnessMarks,
        creativityMarks: e.creativityMarks,
        accuracyMarks: e.accuracyMarks,
        obtainedMarks: e.obtainedMarks,
        maxMarks: e.maxMarks,
        performancePercentage: e.performancePercentage,
        remarks: e.remarks,
        evaluatedAt: e.evaluatedAt?.toISOString?.() ?? '',
      },
    }));

    console.log('[student/evaluations GET] fallback matched results', { count: fallbackPayload.length });
    return apiSuccess({ evaluations: fallbackPayload });
  } catch (error) {
    console.error('[student/evaluations GET]', error);
    return apiError('Unable to load student evaluations', 500);
  }
}
