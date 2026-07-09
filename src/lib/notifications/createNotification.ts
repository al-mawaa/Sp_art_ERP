import mongoose from "mongoose";
import NotificationModel from "@/lib/models/Notification";

export interface CreateNotificationParams {
  title: string;
  message: string;
  type: 
    // Admin notifications
    | "student_admission" | "teacher_registration" | "course_approval" | "batch_creation" | "payment_verification" | "offline_payment" | "query_submitted" | "leave_request" | "referral_request" | "credential_request" | "birthday_reminder" | "fee_due" | "inventory_low" | "general"
    // Student notifications
    | "batch_assigned" | "batch_changed" | "class_schedule_updated" | "new_class_added" | "class_cancelled" | "teacher_changed" | "study_material_uploaded" | "query_approved" | "query_rejected" | "query_replied" | "new_course_launched" | "enrollment_approved" | "enrollment_rejected" | "course_updated" | "fee_due_reminder" | "fee_overdue" | "payment_received" | "payment_rejected" | "invoice_generated" | "certificate_issued" | "certificate_ready" | "attendance_marked" | "low_attendance_warning" | "exam_scheduled" | "marks_published" | "result_released" | "profile_approved" | "referral_reward_credited" | "gift_reward_earned" | "academy_announcement" | "holiday_notice" | "event_registration_confirmed";
  priority?: "low" | "medium" | "high" | "urgent";
  redirectUrl?: string;
  referenceId?: string;
  referenceModel?: string;
  recipientRole?: string;
  recipientId?: mongoose.Types.ObjectId;
  createdBy?: string;
}

/**
 * Create a notification automatically
 * This function can be called from any API route when a system event occurs
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);

    const notification = await NotificationModel.create({
      ...params,
      priority: params.priority || "medium",
      isRead: false,
    });

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    // Don't throw error - notification creation shouldn't break the main flow
    return null;
  }
}

/**
 * Pre-configured notification creators for common events
 */
export const notificationCreators = {
  // ========== ADMIN NOTIFICATIONS ==========
  studentAdmission: (studentName: string, admissionId: string) =>
    createNotification({
      title: "New Student Admission",
      message: `${studentName} has submitted a new admission request.`,
      type: "student_admission",
      priority: "high",
      redirectUrl: "/admin/student-admission",
      referenceId: admissionId,
      referenceModel: "StudentAdmission",
      recipientRole: "admin",
    }),

  teacherRegistration: (teacherName: string, teacherId: string) =>
    createNotification({
      title: "Teacher Registration Request",
      message: `${teacherName} has submitted a registration request.`,
      type: "teacher_registration",
      priority: "high",
      redirectUrl: "/admin/teachers",
      referenceId: teacherId,
      referenceModel: "Teacher",
      recipientRole: "admin",
    }),

  courseApproval: (courseName: string, courseId: string) =>
    createNotification({
      title: "Course Approval Required",
      message: `New course "${courseName}" requires approval.`,
      type: "course_approval",
      priority: "medium",
      redirectUrl: "/admin/courses",
      referenceId: courseId,
      referenceModel: "Course",
      recipientRole: "admin",
    }),

  batchCreation: (batchName: string, batchId: string) =>
    createNotification({
      title: "New Batch Created",
      message: `Batch "${batchName}" has been created and requires setup.`,
      type: "batch_creation",
      priority: "medium",
      redirectUrl: "/admin/batches",
      referenceId: batchId,
      referenceModel: "Batch",
      recipientRole: "admin",
    }),

  paymentVerification: (studentName: string, amount: number, paymentId: string) =>
    createNotification({
      title: "Payment Verification Required",
      message: `${studentName} has made a payment of ₹${amount} that needs verification.`,
      type: "payment_verification",
      priority: "high",
      redirectUrl: "/admin/payments",
      referenceId: paymentId,
      referenceModel: "Payment",
      recipientRole: "admin",
    }),

  offlinePayment: (studentName: string, amount: number, paymentId: string) =>
    createNotification({
      title: "Offline Payment Uploaded",
      message: `${studentName} has uploaded an offline payment receipt of ₹${amount}.`,
      type: "offline_payment",
      priority: "high",
      redirectUrl: "/admin/offline-payments",
      referenceId: paymentId,
      referenceModel: "OfflinePayment",
      recipientRole: "admin",
    }),

  querySubmitted: (personName: string, category: string, queryId: string) =>
    createNotification({
      title: "New Query Submitted",
      message: `${personName} has submitted a ${category} query.`,
      type: "query_submitted",
      priority: "medium",
      redirectUrl: "/admin/queries",
      referenceId: queryId,
      referenceModel: "Query",
      recipientRole: "admin",
    }),

  leaveRequest: (staffName: string, leaveType: string, leaveId: string) =>
    createNotification({
      title: "Leave Request Submitted",
      message: `${staffName} has requested ${leaveType} leave.`,
      type: "leave_request",
      priority: "medium",
      redirectUrl: "/admin/leaves",
      referenceId: leaveId,
      referenceModel: "Leave",
      recipientRole: "admin",
    }),

  referralRequest: (referrerName: string, referredName: string, referralId: string) =>
    createNotification({
      title: "New Referral Request",
      message: `${referrerName} has referred ${referredName}.`,
      type: "referral_request",
      priority: "medium",
      redirectUrl: "/admin/referrals",
      referenceId: referralId,
      referenceModel: "Referral",
      recipientRole: "admin",
    }),

  credentialRequest: (studentName: string, credentialType: string, requestId: string) =>
    createNotification({
      title: "Credential Request",
      message: `${studentName} has requested ${credentialType}.`,
      type: "credential_request",
      priority: "medium",
      redirectUrl: "/admin/credentials",
      referenceId: requestId,
      referenceModel: "StudentCredentials",
      recipientRole: "admin",
    }),

  birthdayReminder: (studentName: string, age: number) =>
    createNotification({
      title: "Birthday Today! 🎂",
      message: `${studentName} is turning ${age} today!`,
      type: "birthday_reminder",
      priority: "low",
      recipientRole: "admin",
    }),

  feeDue: (studentName: string, amount: number, studentId: string) =>
    createNotification({
      title: "Fee Due Reminder",
      message: `${studentName} has pending fees of ₹${amount}.`,
      type: "fee_due",
      priority: "high",
      redirectUrl: `/admin/enrolled/${studentId}`,
      referenceId: studentId,
      referenceModel: "Student",
      recipientRole: "admin",
    }),

  inventoryLow: (itemName: string, currentStock: number) =>
    createNotification({
      title: "Inventory Low",
      message: `${itemName} is running low (${currentStock} units remaining).`,
      type: "inventory_low",
      priority: "medium",
      redirectUrl: "/admin/inventory",
      recipientRole: "admin",
    }),

  // ========== STUDENT NOTIFICATIONS ==========
  batchAssigned: (studentId: mongoose.Types.ObjectId, batchName: string) =>
    createNotification({
      title: "Batch Assigned",
      message: `You have been assigned to "${batchName}".`,
      type: "batch_assigned",
      priority: "high",
      redirectUrl: "/student/my-classes",
      recipientRole: "student",
      recipientId: studentId,
    }),

  batchChanged: (studentId: mongoose.Types.ObjectId, batchName: string) =>
    createNotification({
      title: "Batch Changed",
      message: `Your batch has been changed to "${batchName}".`,
      type: "batch_changed",
      priority: "high",
      redirectUrl: "/student/my-classes",
      recipientRole: "student",
      recipientId: studentId,
    }),

  classScheduleUpdated: (studentId: mongoose.Types.ObjectId, className: string) =>
    createNotification({
      title: "Class Schedule Updated",
      message: `The schedule for ${className} has been updated.`,
      type: "class_schedule_updated",
      priority: "medium",
      redirectUrl: "/student/my-classes",
      recipientRole: "student",
      recipientId: studentId,
    }),

  newClassAdded: (studentId: mongoose.Types.ObjectId, className: string) =>
    createNotification({
      title: "New Class Added",
      message: `A new class "${className}" has been added to your schedule.`,
      type: "new_class_added",
      priority: "medium",
      redirectUrl: "/student/my-classes",
      recipientRole: "student",
      recipientId: studentId,
    }),

  classCancelled: (studentId: mongoose.Types.ObjectId, className: string) =>
    createNotification({
      title: "Class Cancelled",
      message: `Your ${className} class has been cancelled.`,
      type: "class_cancelled",
      priority: "high",
      redirectUrl: "/student/my-classes",
      recipientRole: "student",
      recipientId: studentId,
    }),

  teacherChanged: (studentId: mongoose.Types.ObjectId, teacherName: string) =>
    createNotification({
      title: "Teacher Changed",
      message: `Your teacher has been changed to ${teacherName}.`,
      type: "teacher_changed",
      priority: "medium",
      redirectUrl: "/student/my-classes",
      recipientRole: "student",
      recipientId: studentId,
    }),

  studyMaterialUploaded: (studentId: mongoose.Types.ObjectId, materialTitle: string) =>
    createNotification({
      title: "Study Material Uploaded",
      message: `New study material "${materialTitle}" is now available.`,
      type: "study_material_uploaded",
      priority: "medium",
      redirectUrl: "/student/my-classes",
      recipientRole: "student",
      recipientId: studentId,
    }),

  queryApproved: (studentId: mongoose.Types.ObjectId, queryType: string) =>
    createNotification({
      title: "Query Approved",
      message: `Your ${queryType} query has been approved.`,
      type: "query_approved",
      priority: "high",
      redirectUrl: "/student/queries",
      recipientRole: "student",
      recipientId: studentId,
    }),

  queryRejected: (studentId: mongoose.Types.ObjectId, queryType: string) =>
    createNotification({
      title: "Query Rejected",
      message: `Your ${queryType} query has been rejected.`,
      type: "query_rejected",
      priority: "high",
      redirectUrl: "/student/queries",
      recipientRole: "student",
      recipientId: studentId,
    }),

  queryReplied: (studentId: mongoose.Types.ObjectId) =>
    createNotification({
      title: "Query Reply",
      message: `Your query has received a reply from the admin.`,
      type: "query_replied",
      priority: "high",
      redirectUrl: "/student/queries",
      recipientRole: "student",
      recipientId: studentId,
    }),

  newCourseLaunched: (studentId: mongoose.Types.ObjectId, courseName: string) =>
    createNotification({
      title: "New Course Launched",
      message: `Check out our new course "${courseName}"!`,
      type: "new_course_launched",
      priority: "medium",
      redirectUrl: "/student/courses",
      recipientRole: "student",
      recipientId: studentId,
    }),

  enrollmentApproved: (studentId: mongoose.Types.ObjectId, courseName: string) =>
    createNotification({
      title: "Enrollment Approved",
      message: `Your enrollment for "${courseName}" has been approved.`,
      type: "enrollment_approved",
      priority: "high",
      redirectUrl: "/student/courses",
      recipientRole: "student",
      recipientId: studentId,
    }),

  enrollmentRejected: (studentId: mongoose.Types.ObjectId, courseName: string) =>
    createNotification({
      title: "Enrollment Rejected",
      message: `Your enrollment for "${courseName}" has been rejected.`,
      type: "enrollment_rejected",
      priority: "high",
      redirectUrl: "/student/courses",
      recipientRole: "student",
      recipientId: studentId,
    }),

  courseUpdated: (studentId: mongoose.Types.ObjectId, courseName: string) =>
    createNotification({
      title: "Course Updated",
      message: `The course "${courseName}" has been updated.`,
      type: "course_updated",
      priority: "medium",
      redirectUrl: "/student/courses",
      recipientRole: "student",
      recipientId: studentId,
    }),

  feeDueReminder: (studentId: mongoose.Types.ObjectId, amount: number, dueDate: string) =>
    createNotification({
      title: "Fee Due Reminder",
      message: `Your fee payment of ₹${amount} is due on ${dueDate}.`,
      type: "fee_due_reminder",
      priority: "high",
      redirectUrl: "/student/fees",
      recipientRole: "student",
      recipientId: studentId,
    }),

  feeOverdue: (studentId: mongoose.Types.ObjectId, amount: number) =>
    createNotification({
      title: "Fee Overdue",
      message: `Your fee payment of ₹${amount} is overdue. Please pay immediately.`,
      type: "fee_overdue",
      priority: "urgent",
      redirectUrl: "/student/fees",
      recipientRole: "student",
      recipientId: studentId,
    }),

  paymentReceived: (studentId: mongoose.Types.ObjectId, amount: number) =>
    createNotification({
      title: "Payment Received",
      message: `Your payment of ₹${amount} has been received successfully.`,
      type: "payment_received",
      priority: "high",
      redirectUrl: "/student/fees",
      recipientRole: "student",
      recipientId: studentId,
    }),

  paymentRejected: (studentId: mongoose.Types.ObjectId, amount: number) =>
    createNotification({
      title: "Payment Rejected",
      message: `Your payment of ₹${amount} has been rejected.`,
      type: "payment_rejected",
      priority: "high",
      redirectUrl: "/student/fees",
      recipientRole: "student",
      recipientId: studentId,
    }),

  invoiceGenerated: (studentId: mongoose.Types.ObjectId, invoiceNumber: string) =>
    createNotification({
      title: "Invoice Generated",
      message: `Invoice ${invoiceNumber} has been generated for your payment.`,
      type: "invoice_generated",
      priority: "medium",
      redirectUrl: "/student/fees",
      recipientRole: "student",
      recipientId: studentId,
    }),

  certificateIssued: (studentId: mongoose.Types.ObjectId, certificateName: string) =>
    createNotification({
      title: "Certificate Issued",
      message: `Your certificate "${certificateName}" has been issued.`,
      type: "certificate_issued",
      priority: "high",
      redirectUrl: "/student/certificates",
      recipientRole: "student",
      recipientId: studentId,
    }),

  certificateReady: (studentId: mongoose.Types.ObjectId, certificateName: string) =>
    createNotification({
      title: "Certificate Ready for Download",
      message: `Your certificate "${certificateName}" is ready for download.`,
      type: "certificate_ready",
      priority: "high",
      redirectUrl: "/student/certificates",
      recipientRole: "student",
      recipientId: studentId,
    }),

  attendanceMarked: (studentId: mongoose.Types.ObjectId, date: string) =>
    createNotification({
      title: "Attendance Marked",
      message: `Your attendance for ${date} has been marked.`,
      type: "attendance_marked",
      priority: "low",
      redirectUrl: "/student/attendance",
      recipientRole: "student",
      recipientId: studentId,
    }),

  lowAttendanceWarning: (studentId: mongoose.Types.ObjectId, percentage: number) =>
    createNotification({
      title: "Low Attendance Warning",
      message: `Your attendance is ${percentage}%. Please improve your attendance.`,
      type: "low_attendance_warning",
      priority: "high",
      redirectUrl: "/student/attendance",
      recipientRole: "student",
      recipientId: studentId,
    }),

  examScheduled: (studentId: mongoose.Types.ObjectId, examName: string, examDate: string) =>
    createNotification({
      title: "Exam Scheduled",
      message: `Exam "${examName}" is scheduled for ${examDate}.`,
      type: "exam_scheduled",
      priority: "high",
      redirectUrl: "/student/my-scores",
      recipientRole: "student",
      recipientId: studentId,
    }),

  marksPublished: (studentId: mongoose.Types.ObjectId, examName: string) =>
    createNotification({
      title: "Marks Published",
      message: `Marks for "${examName}" have been published.`,
      type: "marks_published",
      priority: "high",
      redirectUrl: "/student/my-scores",
      recipientRole: "student",
      recipientId: studentId,
    }),

  resultReleased: (studentId: mongoose.Types.ObjectId, resultName: string) =>
    createNotification({
      title: "Result Released",
      message: `Your result for "${resultName}" has been released.`,
      type: "result_released",
      priority: "high",
      redirectUrl: "/student/my-scores",
      recipientRole: "student",
      recipientId: studentId,
    }),

  profileApproved: (studentId: mongoose.Types.ObjectId) =>
    createNotification({
      title: "Profile Approved",
      message: `Your profile has been approved by the admin.`,
      type: "profile_approved",
      priority: "high",
      redirectUrl: "/student/profile",
      recipientRole: "student",
      recipientId: studentId,
    }),

  referralRewardCredited: (studentId: mongoose.Types.ObjectId, amount: number) =>
    createNotification({
      title: "Referral Reward Credited",
      message: `You have earned ₹${amount} from a referral reward.`,
      type: "referral_reward_credited",
      priority: "medium",
      redirectUrl: "/student/dashboard",
      recipientRole: "student",
      recipientId: studentId,
    }),

  giftRewardEarned: (studentId: mongoose.Types.ObjectId, giftName: string) =>
    createNotification({
      title: "Gift Reward Earned",
      message: `Congratulations! You have earned a ${giftName}.`,
      type: "gift_reward_earned",
      priority: "medium",
      redirectUrl: "/student/dashboard",
      recipientRole: "student",
      recipientId: studentId,
    }),

  academyAnnouncement: (studentId: mongoose.Types.ObjectId, announcement: string) =>
    createNotification({
      title: "Academy Announcement",
      message: announcement,
      type: "academy_announcement",
      priority: "medium",
      redirectUrl: "/student/dashboard",
      recipientRole: "student",
      recipientId: studentId,
    }),

  holidayNotice: (studentId: mongoose.Types.ObjectId, holidayName: string, date: string) =>
    createNotification({
      title: "Holiday Notice",
      message: `${holidayName} on ${date}. No classes scheduled.`,
      type: "holiday_notice",
      priority: "medium",
      redirectUrl: "/student/dashboard",
      recipientRole: "student",
      recipientId: studentId,
    }),

  eventRegistrationConfirmed: (studentId: mongoose.Types.ObjectId, eventName: string) =>
    createNotification({
      title: "Event Registration Confirmed",
      message: `You have been registered for "${eventName}".`,
      type: "event_registration_confirmed",
      priority: "medium",
      redirectUrl: "/student/dashboard",
      recipientRole: "student",
      recipientId: studentId,
    }),
};
