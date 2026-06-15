import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Credential from '@/lib/models/Credentials';
import Student from '@/lib/models/Student';
import Teacher from '@/lib/models/Teacher';
import SeniorTeacher from '@/lib/models/SeniorTeacher';
import { requireAdminFromRequest } from '@/lib/auth/require-admin';
import { updateCredentialById } from '@/lib/admin/updateCredentialById';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const adminCheck = await requireAdminFromRequest(request);
  if (!adminCheck.ok) return adminCheck.response;

  const { id } = await context.params;
  try {
    await dbConnect();
    const credential = await Credential.findById(id);
    if (!credential) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
    }

    return NextResponse.json({
      credentials: {
        id: credential._id.toString(),
        name: credential.name,
        username: credential.username,
        email: credential.email,
        mobileNumber: credential.mobileNumber,
        role: credential.role,
        accountStatus: credential.accountStatus,
        createdAt: credential.createdAt,
        updatedAt: credential.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching credential:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  const adminCheck = await requireAdminFromRequest(request);
  if (!adminCheck.ok) return adminCheck.response;

  const { id } = await context.params;
  const body = await request.json();
  return updateCredentialById(id, body);
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  const adminCheck = await requireAdminFromRequest(request);
  if (!adminCheck.ok) return adminCheck.response;

  const { id } = await context.params;
  try {
    await dbConnect();
    const credential = await Credential.findByIdAndDelete(id);
    if (!credential) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
    }

    const email = credential.email;
    const role = credential.role;

    if (role === 'student') {
      await Student.deleteMany({ email });
    } else if (role === 'teacher') {
      await Teacher.deleteMany({ email });
    } else if (role === 'senior_teacher') {
      await SeniorTeacher.deleteMany({ email });
    }

    return NextResponse.json({ message: 'Credential deleted successfully' });
  } catch (error) {
    console.error('Error deleting credential:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
