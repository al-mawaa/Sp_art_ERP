import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/lib/models/Student';
import StudentCredentials from '@/lib/models/StudentCredentials';
import Credentials from '@/lib/models/Credentials';
import Batch from '@/lib/models/Batch';

export const runtime = 'nodejs';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await dbConnect();

    const body = await request.json();
    const {
      fullName,
      email,
      badgeId,
      phone,
      photo,
      dob,
      age,
      bloodGroup,
      gender,
      school,
      college,
      occupation,
      fatherName,
      fatherMobile,
      fatherOccupation,
      motherName,
      motherMobile,
      motherOccupation,
      address,
      howYouKnowUs,
      howYouComeToKnow,
      batchId,
      feeStatus = 'Pending',
      branch,
      courseName,
      vanFacility,
    } = body;

    if (!fullName || !badgeId) {
      return NextResponse.json(
        { error: 'Full name and badge ID are required' },
        { status: 400 }
      );
    }

    const student = await Student.findById(id);
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (badgeId !== student.badgeId) {
      const existing = await Student.findOne({ badgeId });
      if (existing) {
        return NextResponse.json({ error: 'Badge ID already exists' }, { status: 409 });
      }
    }

    // Store the old name to check if it changed
    const oldName = student.fullName;
    const nameChanged = oldName !== fullName;
    
    // Handle batch assignment changes
    const oldBatchId = student.batchId?.toString();
    const newBatchId = batchId;
    
    // If batch is being changed
    if (oldBatchId !== newBatchId) {
      // Remove student from old batch if exists
      if (oldBatchId) {
        const oldBatch = await Batch.findById(oldBatchId);
        if (oldBatch) {
          oldBatch.students = oldBatch.students.filter(
            s => s.studentId?.toString() !== id
          );
          await oldBatch.save();
        }
      }
      
      // Add student to new batch if provided
      if (newBatchId) {
        const newBatch = await Batch.findById(newBatchId);
        if (!newBatch) {
          return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
        }
        
        // Check if batch has capacity (unless it's the same batch, which we already handled)
        if (newBatch.students.length >= newBatch.batchCapacity) {
          return NextResponse.json({ error: 'This batch is already full' }, { status: 400 });
        }
        
        // Check if student is already in the new batch
        const alreadyInBatch = newBatch.students.some(
          s => s.studentId?.toString() === id || 
               s.studentEmail?.toLowerCase() === email?.toLowerCase()
        );
        if (alreadyInBatch) {
          return NextResponse.json({ error: 'Student is already assigned to this batch' }, { status: 400 });
        }
        
        // Add student to new batch
        newBatch.students.push({
          _id: student._id,
          studentId: student._id,
          studentName: fullName,
          studentEmail: email || '',
          phone: phone || '',
          course: newBatch.courseName,
          batchDay: newBatch.batchDay,
          batchTime: newBatch.batchTime,
          startMonth: newBatch.startMonth,
          endMonth: newBatch.endMonth,
        });
        await newBatch.save();
      }
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      {
        fullName,
        email,
        badgeId,
        phone,
        photo,
        dob,
        age,
        bloodGroup,
        gender,
        school,
        college,
        occupation,
        fatherName,
        fatherMobile,
        fatherOccupation,
        motherName,
        motherMobile,
        motherOccupation,
        address,
        howYouKnowUs,
        howYouComeToKnow,
        batchId,
        feeStatus,
        branch,
        courseName,
        vanFacility,
      },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Synchronize name change to Credentials collections
    if (nameChanged && email) {
      try {
        // Update StudentCredentials by email reference
        await StudentCredentials.findOneAndUpdate(
          { email: email.toLowerCase() },
          { name: fullName },
          { new: true }
        );

        // Update Credentials (generic credentials) by email and role='student'
        await Credentials.findOneAndUpdate(
          { email: email.toLowerCase(), role: 'student' },
          { name: fullName },
          { new: true }
        );
      } catch (syncError) {
        // Log sync error but don't fail the main student update
        console.error('Warning: Failed to sync name to credentials:', syncError);
      }
    }

    return NextResponse.json({
      message: 'Student updated successfully',
      student: {
        id: updatedStudent._id.toString(),
        name: updatedStudent.fullName,
        email: updatedStudent.email,
        badgeId: updatedStudent.badgeId,
        class: updatedStudent.className,
        feeStatus: updatedStudent.feeStatus,
        phone: updatedStudent.phone,
        photo: updatedStudent.photo,
        parentName: updatedStudent.parentName,
        dob: updatedStudent.dob,
        age: updatedStudent.age,
        bloodGroup: updatedStudent.bloodGroup,
        gender: updatedStudent.gender,
        school: updatedStudent.school,
        college: updatedStudent.college,
        occupation: updatedStudent.occupation,
        fatherName: updatedStudent.fatherName,
        fatherMobile: updatedStudent.fatherMobile,
        fatherOccupation: updatedStudent.fatherOccupation,
        motherName: updatedStudent.motherName,
        motherMobile: updatedStudent.motherMobile,
        motherOccupation: updatedStudent.motherOccupation,
        address: updatedStudent.address,
        howYouComeToKnow: updatedStudent.howYouComeToKnow,
        howYouKnowUs: updatedStudent.howYouKnowUs,
        batchId: updatedStudent.batchId?.toString(),
        branch: updatedStudent.branch,
        courseName: updatedStudent.courseName,
        vanFacility: updatedStudent.vanFacility,
        createdAt: updatedStudent.createdAt,
      },
    });
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
