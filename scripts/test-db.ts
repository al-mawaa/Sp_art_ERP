import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("Connected to MongoDB");

  const StudentFeedback = (await import("./src/lib/models/StudentFeedback")).default;
  const Teacher = (await import("./src/lib/models/Teacher")).default;
  const SeniorTeacher = (await import("./src/lib/models/SeniorTeacher")).default;

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
