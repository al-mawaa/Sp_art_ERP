import { NextRequest, NextResponse } from "next/server";
import dbConnect from '@/lib/mongodb';
import CertificateModel from '@/lib/models/Certificate';
import Student from '@/lib/models/Student';
import Course from '@/lib/models/Course';
import { generateCertificatePDFBuffer } from '@/lib/services/certificateService';

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  let id = request.nextUrl.searchParams.get("id");
  let url = request.nextUrl.searchParams.get("url");
  const download = request.nextUrl.searchParams.get("download");

  // Self-healing: if the URL is nested view-pdf, extract the ID directly
  if (url && (url.includes("/api/view-pdf?id=") || url.includes("/api/view-pdf&id="))) {
    try {
      const parsedUrl = new URL(url);
      const nestedId = parsedUrl.searchParams.get("id");
      if (nestedId) {
        id = nestedId;
        url = null;
      }
    } catch (e) {
      // Fallback in case URL parsing fails
      const match = url.match(/[?&]id=([^&]+)/);
      if (match) {
        id = match[1];
        url = null;
      }
    }
  }
  
  if (id) {
    try {
      await dbConnect();
      const certificate = await CertificateModel.findById(id)
        .populate('studentId')
        .populate('courseId');

      if (!certificate) {
        return new NextResponse("Certificate not found", { status: 404 });
      }

      // Generate the PDF Buffer asynchronously in memory
      const buffer = await generateCertificatePDFBuffer(certificate);

      const isDownload = download === "true";
      const disposition = isDownload ? "attachment" : "inline";

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `${disposition}; filename="Certificate-${certificate.certificateNumber}.pdf"`,
        },
      });
    } catch (error) {
      console.error("[view-pdf dynamic generator]", error);
      return new NextResponse("Failed to generate PDF", { status: 500 });
    }
  }

  if (!url) {
    return new NextResponse("Missing URL or ID parameter", { status: 400 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return new NextResponse("Failed to fetch document", { status: res.status });
    }

    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="document.pdf"',
      },
    });
  } catch (error) {
    console.error("[view-pdf proxy]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
