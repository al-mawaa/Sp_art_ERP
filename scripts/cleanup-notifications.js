const mongoose = require('mongoose');

async function cleanupNotifications() {
  try {
    // Read MONGODB_URI from .env file manually
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '..', '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const mongoUri = envContent.match(/MONGODB_URI=(.+)/)?.[1]?.trim();
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in .env file');
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const notifications = db.collection('notifications');

    // Delete notifications that don't have recipientRole set (old notifications)
    const oldResult = await notifications.deleteMany({
      recipientRole: { $exists: false }
    });
    console.log('Deleted', oldResult.deletedCount, 'old notifications without recipientRole');

    // Delete admin notifications that incorrectly have recipientId set
    const adminResult = await notifications.deleteMany({
      recipientRole: 'admin',
      recipientId: { $exists: true, $ne: null }
    });
    console.log('Deleted', adminResult.deletedCount, 'admin notifications with recipientId');

    // Delete student notifications that don't have recipientId set
    const studentResult = await notifications.deleteMany({
      recipientRole: 'student',
      recipientId: { $exists: false }
    });
    console.log('Deleted', studentResult.deletedCount, 'student notifications without recipientId');

    console.log('Cleanup completed successfully');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
  }
}

cleanupNotifications();
