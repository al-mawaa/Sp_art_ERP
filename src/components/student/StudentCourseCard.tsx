"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Calendar, CheckCircle2, Clock, MapPin, User, Users } from "lucide-react";
import { CourseStatusBadge } from "@/components/student/CourseStatusBadge";
import { PaymentStatusBadge } from "@/components/student/PaymentStatusBadge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { StudentCourseCard as CourseType } from "@/lib/student/studentCourses";

const PLACEHOLDER_GRADIENT =
  "bg-gradient-to-br from-primary/20 via-primary/10 to-amber-100";

export function StudentCourseCardItem({
  course,
  onEnroll,
  variant = "catalog",
}: {
  course: CourseType;
  onEnroll: (course: CourseType) => void;
  variant?: "catalog" | "enrolled";
}) {
  const showEnroll = course.enrollmentStatus === "not_enrolled";
  const showPayment =
    course.enrollmentStatus === "payment_pending" ||
    course.displayStatus === "Payment Pending";
  const enrolled = course.enrollmentStatus === "enrolled";
  const detailHref = `/student/my-courses/${course.batchId}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="card-soft overflow-hidden flex flex-col h-full transition-shadow hover:shadow-lg group"
    >
      <div className={cnThumb(course.thumbnailUrl)}>
        {course.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.thumbnailUrl}
            alt={course.courseName}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen className="h-12 w-12 text-primary/40" />
          </div>
        )}
        <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-1.5 justify-between">
          <CourseStatusBadge status={course.displayStatus} />
          {variant === "enrolled" && course.paymentStatus && (
            <PaymentStatusBadge status={course.paymentStatus} />
          )}
        </div>
        {enrolled && variant === "catalog" && (
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 text-white px-2.5 py-1 text-xs font-semibold shadow-sm">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Enrolled
            </span>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1 gap-3">
        <div>
          <h3 className="font-display font-bold text-lg leading-tight">{course.courseName}</h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{course.description}</p>
        </div>

        <div className="grid grid-cols-1 gap-1.5 text-xs text-muted-foreground">
          <Row icon={User} label={course.teacherName} />
          <Row icon={BookOpen} label={course.batchName} />
          <Row icon={Clock} label={course.batchTiming || `${course.batchDays}`} />
          <Row icon={MapPin} label={course.branch || "Studio"} />
          <Row
            icon={Users}
            label={`${course.availableSeats} seats · ₹${course.courseFees.toLocaleString("en-IN")}`}
          />
          <Row icon={Calendar} label={`${course.durationMonths} months duration`} />
          {variant === "enrolled" && course.enrollmentDate && (
            <Row icon={Calendar} label={`Enrolled ${course.enrollmentDate}`} />
          )}
        </div>

        {(enrolled || variant === "enrolled") && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span>Progress</span>
              <span>{course.progressPercent}%</span>
            </div>
            <Progress value={course.progressPercent} className="h-2" />
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-auto pt-2">
          {variant === "enrolled" ? (
            <>
              <Button variant="outline" size="sm" className="rounded-xl flex-1" asChild>
                <Link href={detailHref}>View Course</Link>
              </Button>
              <Button
                size="sm"
                className="rounded-xl flex-1 gradient-primary text-white border-0"
                asChild
              >
                <Link href={detailHref}>Continue Learning</Link>
              </Button>
              {showPayment && (
                <Button
                  size="sm"
                  className="rounded-xl w-full"
                  variant="secondary"
                  onClick={() => onEnroll(course)}
                >
                  Complete Payment
                </Button>
              )}
            </>
          ) : (
            <>
              {showEnroll && (
                <Button
                  size="sm"
                  className="rounded-xl w-full gradient-primary text-white border-0"
                  onClick={() => onEnroll(course)}
                  disabled={course.availableSeats <= 0}
                >
                  {course.availableSeats <= 0 ? "Batch full" : "Enroll Now"}
                </Button>
              )}
              {showPayment && !enrolled && (
                <Button
                  size="sm"
                  className="rounded-xl w-full"
                  variant="secondary"
                  onClick={() => onEnroll(course)}
                >
                  Complete Payment
                </Button>
              )}
              {enrolled && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl w-full"
                  disabled
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Enrolled
                </Button>
              )}
              {enrolled && (
                <Button size="sm" className="rounded-xl w-full" asChild>
                  <Link href={detailHref}>Open in My Courses</Link>
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function cnThumb(url: string) {
  return `relative h-44 w-full overflow-hidden rounded-t-2xl ${url ? "" : PLACEHOLDER_GRADIENT}`;
}

function Row({ icon: Icon, label }: { icon: typeof User; label: string }) {
  return (
    <span className="flex items-center gap-2 truncate">
      <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
      <span className="truncate">{label}</span>
    </span>
  );
}
