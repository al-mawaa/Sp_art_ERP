const mongoose = require('mongoose');
const dbConnect = require('../src/lib/mongodb').default || require('../src/lib/mongodb');
const StudentEvaluation = require('../src/lib/models/StudentEvaluation').default || require('../src/lib/models/StudentEvaluation');
const Student = require('../src/lib/models/Student').default || require('../src/lib/models/Student');
(async () => {
  try {
    await dbConnect();
    console.log('connected');
    const count = await StudentEvaluation.countDocuments();
    console.log('student_evaluations count:', count);
    const sample = await StudentEvaluation.find().limit(10).lean();
    console.log('sample evals:');
    sample.forEach((e, idx) => {
      console.log(idx + 1, 'id=', String(e._id), 'studentId=', String(e.studentId), 'submissionId=', String(e.submissionId), 'evaluatedAt=', e.evaluatedAt);
    });
    const studentIds = [...new Set(sample.map(e => String(e.studentId)))];
    const students = await Student.find({ _id: { $in: studentIds.map(id => mongoose.Types.ObjectId(id)) } }).lean();
    console.log('matched students count:', students.length);
    students.forEach((s, idx) => {
      console.log(idx + 1, 'student _id=', String(s._id), 'email=', s.email, 'badgeId=', s.badgeId, 'fullName=', s.fullName);
    });
    const missing = studentIds.filter(id => !students.some(s => String(s._id) === id));
    console.log('missing studentIds count:', missing.length, missing.length ? missing.slice(0, 10) : []);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();