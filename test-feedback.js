const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  // copy models roughly
  const StudentFeedback = require('./src/lib/models/StudentFeedback').default;
  const Teacher = require('./src/lib/models/Teacher').default;
  const SeniorTeacher = require('./src/lib/models/SeniorTeacher').default;

  try {
    const allFeedbacks = await StudentFeedback.find({}).lean();
    console.log("Found", allFeedbacks.length, "feedbacks");

    const teacherIds = [...new Set(allFeedbacks.map(f => f.teacherId?.toString()).filter(Boolean))];
    console.log("teacherIds", teacherIds);
    
    const [teachers, seniorTeachers] = await Promise.all([
      Teacher.find({ _id: { $in: teacherIds } }, "fullName").lean(),
      SeniorTeacher.find({ _id: { $in: teacherIds } }, "fullName").lean()
    ]);
    console.log("teachers", teachers.length, "senior", seniorTeachers.length);

  } catch (err) {
    console.error("ERROR:", err);
  } finally {
    mongoose.disconnect();
  }
}
run();
