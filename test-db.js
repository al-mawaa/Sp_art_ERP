const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
    try {
      const OfflinePaymentModel = mongoose.model('OfflinePayment') || require('./src/lib/models/OfflinePayment').default;
      const StudentModel = mongoose.model('Student') || require('./src/lib/models/Student').default;
      const CourseModel = mongoose.model('Course') || require('./src/lib/models/Course').default;
      const CourseEnrollmentModel = mongoose.model('CourseEnrollment') || require('./src/lib/models/CourseEnrollment').default;
      const EnrollmentInstallmentModel = mongoose.model('EnrollmentInstallment') || require('./src/lib/models/EnrollmentInstallment').default;

      console.log("Models loaded. Running countDocuments...");
      
      const filter = {};
      const pendingCount = await OfflinePaymentModel.countDocuments({ ...filter, paymentStatus: 'pending' });
      console.log("pendingCount:", pendingCount);
      
      const payments = await OfflinePaymentModel.find(filter)
        .populate({ path: 'studentId', model: StudentModel })
        .populate({ path: 'courseId', model: CourseModel })
        .sort({ createdAt: -1 })
        .skip(0)
        .limit(20)
        .lean();
        
      console.log("payments length:", payments.length);
      
      if (payments.length > 0) {
        console.log("First payment studentId type:", typeof payments[0].studentId);
      }
      
    } catch (e) {
      console.error("TEST ERROR:", e);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error("DB error", err);
    process.exit(1);
  });
