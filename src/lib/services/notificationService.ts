import mongoose from "mongoose";
import NotificationModel, { NotificationDocument } from "../models/Notification";
import NotificationRecipientModel from "../models/NotificationRecipient";
import StudentModel from "../models/Student";
import TeacherModel from "../models/Teacher";
import SeniorTeacherModel from "../models/SeniorTeacher";
import CourseEnrollmentModel from "../models/CourseEnrollment";
import nodemailer from "nodemailer";

// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export const sendNotification = async (notificationData: any) => {
  try {
    // 1. Create Notification Record
    const notification = new NotificationModel({
      ...notificationData,
      status: 'Sending',
    });
    await notification.save();

    // 2. Resolve Target Audience
    const userIdsToRoles = new Map<string, { role: string; email: string; _id: mongoose.Types.ObjectId }>();

    // Helper to add users
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const addUsers = (users: any[], roleStr: string) => {
      for (const u of users) {
        if (!userIdsToRoles.has(u._id.toString())) {
          userIdsToRoles.set(u._id.toString(), {
            _id: u._id,
            role: u.role || roleStr,
            email: u.email,
          });
        }
      }
    };

    // a. Specific Users
    if (notification.targetUsers && notification.targetUsers.length > 0) {
      // In this basic fix, we'll try to find them across all 3 models
      const students = await StudentModel.find({ _id: { $in: notification.targetUsers } }).lean();
      addUsers(students, 'Student');
      const teachers = await TeacherModel.find({ _id: { $in: notification.targetUsers } }).lean();
      addUsers(teachers, 'Teacher');
      const srTeachers = await SeniorTeacherModel.find({ _id: { $in: notification.targetUsers } }).lean();
      addUsers(srTeachers, 'Senior_Teacher');
    }

    // b. By Roles
    if (notification.targetRoles && notification.targetRoles.length > 0) {
      const roles = notification.targetRoles.map((r: string) => r.toLowerCase().replace('_', ' '));
      
      if (roles.includes('student')) {
        const students = await StudentModel.find({}).lean();
        addUsers(students, 'Student');
      }
      if (roles.includes('teacher')) {
        const teachers = await TeacherModel.find({ status: 'Active' }).lean();
        addUsers(teachers, 'Teacher');
      }
      if (roles.includes('senior teacher')) {
        const srTeachers = await SeniorTeacherModel.find({ status: 'Active' }).lean();
        addUsers(srTeachers, 'Senior_Teacher');
      }
      if (roles.includes('admin') || roles.includes('hr')) {
         // Admins/HR usually use CredentialModel if we want to target them, but skipping for now or adding if needed.
      }
    }

    // c. By Batches/Courses (Students only)
    if (
      (notification.targetBatches && notification.targetBatches.length > 0) ||
      (notification.targetCourses && notification.targetCourses.length > 0)
    ) {
      const query: Record<string, unknown> = {};
      if (notification.targetBatches && notification.targetBatches.length > 0) {
        query.batchId = { $in: notification.targetBatches };
      }
      if (notification.targetCourses && notification.targetCourses.length > 0) {
        query.courseId = { $in: notification.targetCourses };
      }
      
      const enrollments = await CourseEnrollmentModel.find(query).select('studentId').lean();
      const studentIds = enrollments.map(e => e.studentId.toString());
      
      if (studentIds.length > 0) {
        const matchedStudents = await StudentModel.find({ _id: { $in: studentIds } }).lean();
        addUsers(matchedStudents, 'Student');
      }
    }

    // 3. Create NotificationRecipient records
    const recipientDocs = Array.from(userIdsToRoles.values()).map(user => ({
      notificationId: notification._id,
      userId: user._id,
      role: user.role,
      delivered: true,
      deliveredAt: new Date(),
    }));

    if (recipientDocs.length > 0) {
      await NotificationRecipientModel.insertMany(recipientDocs);
    }

    // 4. Send Emails if Channel is selected
    if (notification.deliveryChannels?.includes('Email')) {
      const emailList = Array.from(userIdsToRoles.values())
        .map(u => u.email)
        .filter(email => email);

      if (emailList.length > 0) {
        // Send in batches or one-by-one depending on email provider limits
        // For simple implementation, sending bulk bcc
        try {
          await transporter.sendMail({
            from: process.env.EMAIL_USER || 'noreply@sparthub.com',
            bcc: emailList,
            subject: notification.subject || notification.title,
            html: notification.message, // Assuming message is rich text HTML
          });
        } catch (emailErr) {
          console.error("Nodemailer failed to send email. Check credentials.", emailErr);
          // Proceed anyway to not block in-app notification creation
        }
      }
    }

    notification.status = 'Sent';
    await notification.save();

    // After commit, we could potentially emit a global Server-Sent Event (SSE) for Real-time update.
    // However, Node doesn't naturally support broadasting SSE from a simple route handler without global memory 
    // or Redis pub/sub. Since it's a monolithic nextjs app, we will rely on client-side periodic polling or 
    // a basic SSE manager if set up later.

    return notification;

  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
};
