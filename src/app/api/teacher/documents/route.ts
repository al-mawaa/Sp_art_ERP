import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Teacher from "@/lib/models/Teacher";
import { requireTeacherFromRequest } from "@/lib/auth/require-teacher";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireTeacherFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();
    const teacher = await Teacher.findById(auth.teacher.id).lean();
    if (!teacher) {
      return NextResponse.json({ success: false, error: "Teacher not found" }, { status: 404 });
    }

    const documents = teacher.teacherDocuments || {};
    
    // Convert documents to array format
    const documentsArray = [];
    
    const documentTypes = [
      { key: 'aadhaarCard', label: 'Aadhaar Card' },
      { key: 'panCard', label: 'PAN Card' },
      { key: 'offerLetter', label: 'Offer Letter' },
      { key: 'incrementLetter', label: 'Increment Letter' },
    ];

    for (const docType of documentTypes) {
      const doc = documents[docType.key as keyof typeof documents];
      if (doc && doc.fileUrl) {
        documentsArray.push({
          id: docType.key,
          name: doc.fileName || docType.label,
          type: docType.label,
          fileUrl: doc.fileUrl,
          fileType: doc.fileType || 'application/pdf',
          uploadedAt: doc.uploadedAt || new Date(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      documents: documentsArray.sort((a, b) => 
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      ),
    });
  } catch (error) {
    console.error("Error fetching teacher documents:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}
