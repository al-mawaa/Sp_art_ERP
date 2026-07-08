import { NextRequest, NextResponse } from 'next/server';
import { configureCloudinary, cloudinary } from '@/lib/cloudinary';

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}

export async function POST(request: NextRequest) {
  try {
    configureCloudinary();
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'general';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to base64 data URI
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileBase64 = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${fileBase64}`;

    // Upload to Cloudinary using data URI
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: folder,
      resource_type: file.type === 'application/pdf' ? 'raw' : 'auto',
    });

    return NextResponse.json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error: unknown) {
    console.error('Upload error:', error);
    let errorMessage = 'Upload failed';

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error && typeof error === 'object') {
      errorMessage = 'message' in error && typeof error.message === 'string' ? error.message : JSON.stringify(error);
    } else {
      errorMessage = String(error);
    }

    return NextResponse.json({
      error: errorMessage,
      details: errorMessage
    }, { status: 500 });
  }
}