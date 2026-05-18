const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const env = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8').split(/\r?\n/).reduce((acc, line) => {
  const m = line.match(/^\s*([A-Za-z0-9_]+)=(.*)$/);
  if (m) acc[m[1]] = m[2];
  return acc;
}, {});
const uri = env.MONGODB_URI;
if (!uri) {
  console.error('No MONGODB_URI');
  process.exit(1);
}
(async () => {
  try {
    await mongoose.connect(uri);
    const schema = new mongoose.Schema({ name: String, role: String }, { strict: false, collection: 'credentials' });
    const Model = mongoose.models.Temp || mongoose.model('Temp', schema);
    const counts = await Promise.all(['student', 'teacher', 'senior_teacher'].map(async role => ({ role, count: await Model.countDocuments({ role }) })));
    console.log(JSON.stringify(counts, null, 2));
    const sample = await Model.find({ role: 'student' }).limit(5).lean();
    console.log('sample', JSON.stringify(sample, null, 2));
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
