import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { getAuth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Get the file type and determine the resource type
    const fileType = file.type;
    let resourceType: "image" | "video" | "raw" | "auto" = "auto";

    if (fileType.startsWith("video/")) {
      resourceType = "video";
      console.log("Video upload detected:", fileType);
    } else if (
      fileType === "application/pdf" ||
      fileType.includes("document") ||
      fileType === "text/plain"
    ) {
      resourceType = "raw";
      console.log("Document upload detected:", fileType);
    } else if (fileType.startsWith("image/")) {
      resourceType = "image";
      console.log("Image upload detected:", fileType);
    }

    // Set format for PDF files
    let format: string | undefined;
    if (fileType === "application/pdf") {
      format = "pdf";
    }

    // Convert file to Data URL
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Upload to Cloudinary
    const result = await uploadToCloudinary(dataUrl, {
      folder: "batterhub/messages",
      resource_type: resourceType,
      format: format,
    });

    // For raw files (like PDFs), ensure the URL has the correct extension
    let secureUrl = result.secure_url;
    if (
      resourceType === "raw" &&
      fileType === "application/pdf" &&
      !secureUrl.endsWith(".pdf")
    ) {
      secureUrl = `${secureUrl}.pdf`;
    }

    return NextResponse.json({
      url: secureUrl,
      public_id: result.public_id,
      resource_type: result.resource_type,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
