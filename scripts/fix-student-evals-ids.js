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
    if (!uri) throw new Error('No MongoDB URI found in .env');

    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 20000,
      maxPoolSize: 10,
    });

    const db = mongoose.connection.db;
    const evalColl = db.collection('student_evaluations');
    const testColl = db.collection('drawing_tests');
    const studentColl = db.collection('students');

    const evals = await evalColl.find({}).toArray();
    console.log('Found evaluations:', evals.length);

    let updated = 0;
    let skipped = 0;

    for (const e of evals) {
      const rawSid = e.studentId && typeof e.studentId === 'object' ? String(e.studentId) : e.studentId;
      const sidValid = rawSid && mongoose.Types.ObjectId.isValid(rawSid);
      let studentExists = false;
      if (sidValid) {
        const doc = await studentColl.findOne({ _id: new mongoose.Types.ObjectId(rawSid) });
        studentExists = !!doc;
      }

      if (studentExists) {
        // good
        continue;
      }

      // student missing — try to recover from submission
      const subIdRaw = e.submissionId && typeof e.submissionId === 'object' ? String(e.submissionId) : e.submissionId;
      if (!subIdRaw || !mongoose.Types.ObjectId.isValid(subIdRaw)) {
        console.log(`Skipping eval ${String(e._id)}: no valid submissionId`);
        skipped++;
        continue;
      }

      const sub = await testColl.findOne({ _id: new mongoose.Types.ObjectId(subIdRaw) });
      if (!sub || !sub.studentId) {
        console.log(`Skipping eval ${String(e._id)}: submission not found or missing studentId`);
        skipped++;
        continue;
      }

      const subStudentId = typeof sub.studentId === 'object' ? String(sub.studentId) : sub.studentId;
      if (!mongoose.Types.ObjectId.isValid(subStudentId)) {
        console.log(`Skipping eval ${String(e._id)}: submission.studentId invalid (${subStudentId})`);
        skipped++;
        continue;
      }

      const studentDoc = await studentColl.findOne({ _id: new mongoose.Types.ObjectId(subStudentId) });
      if (!studentDoc) {
        console.log(`Skipping eval ${String(e._id)}: student referenced by submission not found (${subStudentId})`);
        skipped++;
        continue;
      }

      // perform update
      const res = await evalColl.updateOne(
        { _id: e._id },
        { $set: { studentId: new mongoose.Types.ObjectId(subStudentId) } }
      );
      if (res.modifiedCount === 1) {
        console.log(`Updated eval ${String(e._id)} -> studentId ${subStudentId}`);
        updated++;
      } else {
        console.log(`No-op updating eval ${String(e._id)} (matched=${res.matchedCount})`);
        skipped++;
      }
    }

    console.log(`Done. updated=${updated} skipped=${skipped}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err);
    process.exit(1);
  }
})();
