import Link from 'next/link';
import dbConnect from '@/lib/mongodb';
import Course from '@/lib/models/Course';
import { notFound } from 'next/navigation';
import React from 'react';

export const runtime = 'nodejs';

type Props = { params: Promise<{ id: string }> };

export default async function CourseDetailPage({ params }: Props) {
  const { id } = await params;
  await dbConnect();
  const course = await Course.findById(id).lean();
  if (!course) return notFound();

  const totalClasses = (course as unknown as { totalClasses?: number }).totalClasses ?? 24;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-4">
        <Link href="/student/courses" className="inline-flex items-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary/80 hover:bg-primary/5">
          ← Back to Courses
        </Link>
      </div>
      <div className="rounded-lg bg-card shadow-sm overflow-hidden">
        {course.image ? (
          <img src={course.image} alt={course.courseTitle} className="w-full max-h-72 object-cover" />
        ) : (
          <div className="h-44 w-full bg-muted/20" />
        )}
        <div className="p-6">
          <h1 className="text-2xl font-bold">{course.courseTitle}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{course.notes}</p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-muted/10 p-4">
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="font-semibold">{course.duration} {course.duration === 1 ? 'month' : 'months'}</p>
            </div>

            <div className="rounded-lg bg-muted/10 p-4">
              <p className="text-xs text-muted-foreground">Total Classes</p>
              <p className="font-semibold">{totalClasses}</p>
            </div>

            <div className="rounded-lg bg-muted/10 p-4">
              <p className="text-xs text-muted-foreground">Fees</p>
              <p className="font-semibold">₹{course.totalFees}</p>
            </div>

            <div className="rounded-lg bg-muted/10 p-4">
              <p className="text-xs text-muted-foreground">Instructor</p>
              <p className="font-semibold">{course.instructor ?? 'TBA'}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <div>
              <h3 className="text-sm font-semibold">Batch Details</h3>
              <p className="text-sm text-muted-foreground">{course.notes ?? 'No batch details available'}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="font-semibold">{course.status}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="font-semibold">{new Date(course.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
