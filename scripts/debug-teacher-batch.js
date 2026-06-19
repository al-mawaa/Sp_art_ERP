const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
(async () => {
  const root = path.resolve(__dirname, '..');
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('.env not found');
    process.exit(1);
  }
  const env = fs.readFileSync(envPath, 'utf8').split(/\r?\n/).filter(Boolean).reduce((acc, line) => {
    const idx = line.indexOf('=');
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      acc[key] = val;
    }
    return acc;
  }, {});
  const uri = env.MONGODB_URI;
  if (!uri) {
    console.error('No MONGODB_URI');
    process.exit(1);
  }
  try {
    await mongoose.connect(uri, { maxPoolSize: 5, serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 });
    const db = mongoose.connection.db;
    const teachers = await db.collection('teachers').find({}).project({ _id: 1, fullName: 1, email: 1, assignedBatches: 1 }).limit(10).toArray();
    console.log('teachers:');
    console.dir(teachers, { depth: 4 });
    const batches = await db.collection('batches').find({}).project({ _id: 1, batchName: 1, teacherIds: 1, students: 1 }).limit(10).toArray();
    console.log('batches:');
    console.dir(batches, { depth: 4 });
    const credentials = await db.collection('credentials').find({ role: 'teacher' }).project({ _id: 1, email: 1, accountStatus: 1 }).limit(10).toArray();
    console.log('teacher credentials:');
    console.dir(credentials, { depth: 4 });
  } catch (e) {
    console.error('DB error', e);
  } finally {
    await mongoose.disconnect();
  }
})();
