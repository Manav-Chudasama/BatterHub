import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * OPTIONS /api/listings/upload
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 204,
      headers: {
        ...corsHeaders,
        "Access-Control-Max-Age": "86400", // 24 hours
      },
    }
  );
}

/**
 * Helper function to convert a File to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return `data:${file.type};base64,${btoa(binary)}`;
}

/**
 * POST /api/listings/upload
 * Server-side image upload to Cloudinary
 * Accepts multipart/form-data with images
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);

    // Check authentication
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Get form data with files
    const formData = await request.formData();
    const files = formData.getAll("images") as File[];

    // Validate files
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files uploaded" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (files.length > 5) {
      return NextResponse.json(
        { error: "Maximum 5 files allowed" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Process each file
    const uploadPromises = files.map(async (file) => {
      try {
        // Convert file to base64 data URL
        const base64Data = await fileToBase64(file);

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(base64Data, {
          folder: `batterhub/listings/${userId}`,
          resource_type: "auto",
          tags: [userId],
        });

        return result.secure_url;
      } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
      }
    });

    // Wait for all uploads to complete
    const imageUrls = await Promise.all(uploadPromises);

    return NextResponse.json(
      {
        message: "Files uploaded successfully",
        urls: imageUrls,
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error uploading files:", error);
    return NextResponse.json(
      { error: "Failed to upload files" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Set larger body size limit for file uploads
export const config = {
  api: {
    bodyParser: false,
    responseLimit: "10mb",
  },
};
