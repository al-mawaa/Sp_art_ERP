import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

const envPath = path.join(process.cwd(), '.env');
const envText = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
envText.split(/\r?\n/).forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1]] = match[2];
  }
});

const dbConnectModule = await import('../src/lib/mongodb');
const dbConnect = (dbConnectModule.default ?? dbConnectModule) as () => Promise<typeof mongoose>;
const StudentEvaluationModule = await import('../src/lib/models/StudentEvaluation');
const StudentEvaluation = (StudentEvaluationModule.default ?? StudentEvaluationModule) as typeof mongoose.Model;
const StudentModule = await import('../src/lib/models/Student');
const Student = (StudentModule.default ?? StudentModule) as typeof mongoose.Model;

try {
  await dbConnect();
  console.log('connected');
  const count = await StudentEvaluation.countDocuments();
  console.log('student_evaluations count:', count);
  const sample = await StudentEvaluation.find().limit(10).lean();
  console.log('sample evals:');
  sample.forEach((e, idx) => {
    console.log(idx + 1, 'id=', String(e._id), 'studentId=', String(e.studentId), 'studentIdType=', typeof e.studentId, 'submissionId=', String(e.submissionId), 'evaluatedAt=', e.evaluatedAt);
  });
  const studentIds = [...new Set(sample.map((e) => String(e.studentId)))] as string[];
  const objectIds = studentIds.filter((id) => mongoose.Types.ObjectId.isValid(id)).map((id) => new mongoose.Types.ObjectId(id));
  const students = objectIds.length ? await Student.find({ _id: { $in: objectIds } }).lean() : [];
  console.log('matched students count:', students.length);
  students.forEach((s, idx) => {
    console.log(idx + 1, 'student _id=', String(s._id), 'email=', s.email, 'badgeId=', s.badgeId, 'fullName=', s.fullName);
  });
  const missing = studentIds.filter((id) => !students.some((s) => String(s._id) === id));
  console.log('missing studentIds count:', missing.length, missing);
  process.exit(0);
} catch (error) {
  console.error(error);
  process.exit(1);
}
