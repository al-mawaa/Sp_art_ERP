const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, 'utf8');
  text.split(/\r?\n/).forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1];
      let value = match[2];
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

(async () => {
  try {
    loadEnvFile(path.join(process.cwd(), '.env'));
    const uri = process.env.MONGODB_URI_DIRECT || process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('No MongoDB URI found in .env');
    }
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 20000,
      maxPoolSize: 10,
    });
    const db = mongoose.connection.db;
    const evalCollection = db.collection('student_evaluations');
    const evalCount = await evalCollection.countDocuments();
    console.log('student_evaluations count:', evalCount);
    const samples = await evalCollection.find({}).limit(20).toArray();
    for (let i = 0; i < samples.length; i += 1) {
      const e = samples[i];
      console.log(i + 1, {
        _id: String(e._id),
        studentId: e.studentId && typeof e.studentId === 'object' ? String(e.studentId) : e.studentId,
        studentIdType: typeof e.studentId,
        submissionId: e.submissionId && typeof e.submissionId === 'object' ? String(e.submissionId) : e.submissionId,
        evaluatedAt: e.evaluatedAt,
      });
    }
    const studentIds = [...new Set(samples.map(e => e.studentId && typeof e.studentId === 'object' ? String(e.studentId) : e.studentId).filter(Boolean))];
    console.log('unique studentIds in sample:', studentIds.length, studentIds.slice(0, 20));
    const objectIds = studentIds.filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => new mongoose.Types.ObjectId(id));
    if (objectIds.length > 0) {
      const studentDocs = await db.collection('students').find({ _id: { $in: objectIds } }).project({ email: 1, badgeId: 1, fullName: 1 }).toArray();
      console.log('matched student docs:', studentDocs.length);
      console.log(studentDocs.map(s => ({ _id: String(s._id), email: s.email, badgeId: s.badgeId, fullName: s.fullName })));
    } else {
      console.log('No valid ObjectId studentIds found in sample.');
    }
    const studentSamples = await db.collection('students').find({}).project({ email: 1, badgeId: 1, fullName: 1 }).limit(20).toArray();
    console.log('sample students:', studentSamples.map(s => ({ _id: String(s._id), email: s.email, badgeId: s.badgeId, fullName: s.fullName })));
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err);
    process.exit(1);
  }
})();