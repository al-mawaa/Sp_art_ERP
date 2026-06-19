let dotenvLoaded = false;
try {
  require('dotenv').config();
  dotenvLoaded = true;
} catch (e) {
  // dotenv not installed; we'll fall back to manual .env parsing
}
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

async function run() {
  let uri = process.env.MONGODB_URI;
  if (!uri) {
    // Try reading .env manually
    try {
      const envPath = path.join(__dirname, '..', '.env');
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/^MONGODB_URI=(.+)$/m);
      if (match) uri = match[1].trim();
    } catch (err) {
      // ignore
    }
  }
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(2);
  }

  const id = process.argv[2];
  if (!id) {
    console.error('Usage: node scripts/check-drawing-task.js <taskId>');
    process.exit(2);
  }

  try {
    await mongoose.connect(uri);
    const oid = new mongoose.Types.ObjectId(id);
    const doc = await mongoose.connection.collection('drawing_tasks').findOne({ _id: oid });
    if (!doc) {
      console.log('NOT FOUND');
    } else {
      console.log('FOUND');
      console.log(JSON.stringify(doc, null, 2));
    }
  } catch (e) {
    console.error('ERROR', e);
  } finally {
    await mongoose.disconnect();
  }
}

run();
