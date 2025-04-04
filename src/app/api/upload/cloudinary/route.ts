import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { getAuth } from "@clerk/nextjs/server";

// Configure the request body size limit (we need to increase it for videos)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "100mb", // Increased limit for video uploads
    },
    responseLimit: "50mb",
  },
};

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

    // Log file info for debugging
    console.log(
      `Processing upload: ${file.name} (${file.type}, size: ${(
        file.size /
        1024 /
        1024
      ).toFixed(2)}MB)`
    );

    if (fileType.startsWith("video/")) {
      resourceType = "video";

      // Extract video format for better error handling
      const videoFormat = fileType.split("/")[1] || "unknown";
      console.log(
        `Video upload detected: ${fileType} (format: ${videoFormat})`
      );

      // Check if this is a well-supported format
      const recommendedFormats = ["mp4", "mov", "webm"];
      const isRecommendedFormat = recommendedFormats.some((format) =>
        videoFormat.toLowerCase().includes(format)
      );

      if (!isRecommendedFormat) {
        console.warn(
          `Video format ${videoFormat} may have compatibility issues with Cloudinary`
        );
      }

      // Check if the file is too large (Cloudinary free tier limits)
      const maxVideoSizeMB = 200; // Increased from 100MB to 200MB
      if (file.size > maxVideoSizeMB * 1024 * 1024) {
        return NextResponse.json(
          {
            error: `Video file size exceeds limit of ${maxVideoSizeMB}MB`,
          },
          { status: 413 }
        );
      }
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

    // Use a streaming approach for large files to optimize memory usage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log(`File converted to buffer, size: ${buffer.length} bytes`);

    // For large videos, use a more efficient approach
    let dataUrl;
    if (resourceType === "video" && buffer.length > 50 * 1024 * 1024) {
      // Over 50MB
      // Use a more efficient approach for large videos
      console.log("Using optimized upload approach for large video");
      // Only include necessary MIME type info to reduce memory usage
      dataUrl = `data:${file.type};base64,`;

      // Process the buffer in chunks if it's very large to avoid memory issues
      const chunkSize = 5 * 1024 * 1024; // 5MB chunks
      const totalChunks = Math.ceil(buffer.length / chunkSize);

      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, buffer.length);
        const chunk = buffer.slice(start, end);
        dataUrl += chunk.toString("base64");

        // Allow GC to clean up between chunks
        if (i < totalChunks - 1) {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }
    } else {
      // Regular approach for smaller files
      dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
    }

    console.log(`Data URL created, length: ${dataUrl.length}`);

    // Set custom upload options based on file type
    const uploadOptions: Record<string, any> = {
      folder: "batterhub/messages",
      resource_type: resourceType,
      format: format,
    };

    // For videos, add special handling
    if (resourceType === "video") {
      uploadOptions.chunk_size = 20000000; // 20MB chunks for better upload handling
      uploadOptions.timeout = 300000; // 5 minutes timeout
    }

    console.log(`Starting Cloudinary upload as ${resourceType}`);

    // Upload to Cloudinary with a timeout promise race
    const uploadPromise = uploadToCloudinary(dataUrl, uploadOptions);

    // For videos we need a longer timeout
    const timeoutPromise = new Promise((_, reject) => {
      const timeoutMs = resourceType === "video" ? 600000 : 60000; // 10 minutes for video, 1 minute for others
      setTimeout(() => reject(new Error("Upload timeout")), timeoutMs);
    });

    const result = (await Promise.race([uploadPromise, timeoutPromise])) as any;
    console.log(`Upload completed successfully for ${file.name}`);

    // For raw files (like PDFs), ensure the URL has the correct extension
    let secureUrl = result.secure_url;
    if (
      resourceType === "raw" &&
      fileType === "application/pdf" &&
      !secureUrl.endsWith(".pdf")
    ) {
      secureUrl = `${secureUrl}.pdf`;
    }

    console.log(`Upload successful: ${file.name} as ${resourceType}`);

    return NextResponse.json({
      url: secureUrl,
      public_id: result.public_id,
      resource_type: result.resource_type,
    });
  } catch (error: any) {
    console.error("Upload error:", error.message || error);

    // Handle specific Cloudinary errors with more helpful messages
    let errorMessage = "Failed to upload file";
    let statusCode = 500;

    if (error.message) {
      // Check for specific Cloudinary error patterns
      if (error.message.includes("streaming profile not supported")) {
        errorMessage =
          "Video format not supported for streaming. Try converting to MP4 format.";
        statusCode = 400;
      } else if (error.message.includes("Resource not found")) {
        errorMessage = "Upload service unavailable. Please try again later.";
        statusCode = 503;
      } else if (error.message.includes("Upload timeout")) {
        errorMessage =
          "Upload timed out. Try a smaller file or check your connection.";
        statusCode = 408;
      } else if (error.message.includes("File size too large")) {
        errorMessage = "File exceeds maximum size limit.";
        statusCode = 413;
      } else if (error.message.includes("Invalid image")) {
        errorMessage = "Invalid media file format.";
        statusCode = 400;
      } else if (error.message.includes("Eager notification url is invalid")) {
        errorMessage =
          "Video upload configuration error. Please try again with different settings.";
        console.error(
          "Cloudinary eager notification URL error - removing eager settings might help"
        );
        statusCode = 400;
      } else {
        // Include the original error for debugging
        errorMessage = `Upload failed: ${error.message}`;
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error.message || "Unknown error",
        code: error.http_code || statusCode,
      },
      { status: statusCode }
    );
  }
}
