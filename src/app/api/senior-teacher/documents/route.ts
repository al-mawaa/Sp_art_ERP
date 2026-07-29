import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SeniorTeacher from "@/lib/models/SeniorTeacher";
import { requireSeniorTeacherFromRequest } from "@/lib/auth/require-senior-teacher";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSeniorTeacherFromRequest(request);
    if (!auth.ok) return auth.response;

    await dbConnect();
    const seniorTeacher = await SeniorTeacher.findById(auth.seniorTeacher.id).lean();
    if (!seniorTeacher) {
      return NextResponse.json({ success: false, error: "Senior Teacher not found" }, { status: 404 });
    }

    const documents = seniorTeacher.teacherDocuments || {};
    
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
    console.error("Error fetching senior teacher documents:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}
