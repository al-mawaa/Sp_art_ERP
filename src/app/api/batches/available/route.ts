import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Batch from '@/lib/models/Batch';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');

    // Fetch all active batches
    const batches = await Batch.find({ batchStatus: 'Active' }).sort({ courseName: 1, batchName: 1 });

    // Calculate vacancy for each batch
    const availableBatches = batches.map(batch => {
      const occupiedSeats = batch.students.length;
      const vacancy = batch.batchCapacity - occupiedSeats;
      
      return {
        id: batch._id.toString(),
        courseName: batch.courseName,
        batchName: batch.batchName,
        batchTiming: batch.batchTiming,
        batchCapacity: batch.batchCapacity,
        occupiedSeats,
        vacancy,
        isFull: vacancy <= 0,
      };
    });

    // If studentId is provided (edit mode), find the student's current batch
    let currentBatchId: string | null = null;
    if (studentId) {
      const Student = (await import('@/lib/models/Student')).default;
      const student = await Student.findById(studentId);
      if (student && student.batchId) {
        currentBatchId = student.batchId.toString();
      }
    }

    // Filter batches: show only available batches, but include current batch even if full
    const filteredBatches = availableBatches.filter(batch => {
      if (currentBatchId && batch.id === currentBatchId) {
        return true; // Always show current batch
      }
      return batch.vacancy > 0; // Only show batches with vacancy
    });

    return NextResponse.json({
      batches: filteredBatches,
      currentBatchId,
    });
  } catch (error) {
    console.error('Error fetching available batches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available batches' },
      { status: 500 }
    );
  }
}
