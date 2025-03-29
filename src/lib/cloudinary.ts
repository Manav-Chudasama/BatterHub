import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Type for Cloudinary transformation options
type CloudinaryTransformation = {
  width?: number;
  height?: number;
  crop?: string;
  gravity?: string;
  quality?: string | number;
  fetch_format?: string;
  [key: string]: string | number | boolean | undefined;
};

/**
 * Uploads a file to Cloudinary
 * @param file File to upload
 * @param options Upload options
 * @returns Cloudinary upload response
 */
export const uploadToCloudinary = async (
  file: string | File | Blob,
  options?: {
    folder?: string;
    publicId?: string;
    tags?: string[];
    transformation?: CloudinaryTransformation[];
    resource_type?: "image" | "video" | "raw" | "auto";
    format?: string;
  }
) => {
  const {
    folder = "batterhub/listings",
    publicId,
    tags,
    transformation,
    resource_type = "auto",
    format,
  } = options || {};

  try {
    if (typeof file === "string" && file.startsWith("data:")) {
      // Log the upload attempt with resource type for debugging
      console.log(`Attempting to upload to Cloudinary as ${resource_type}`);

      // Upload base64 data URL directly
      const uploadOptions: Record<
        string,
        | string
        | string[]
        | CloudinaryTransformation[]
        | boolean
        | number
        | undefined
      > = {
        folder,
        public_id: publicId,
        tags,
        transformation,
        resource_type,
      };

      // Add format if provided
      if (format) {
        uploadOptions.format = format;
      }

      // For videos, we need to ensure proper handling
      if (resource_type === "video") {
        // Ensure video_codec is set to auto
        uploadOptions.video_codec = "auto";
      }

      // For PDFs and documents uploaded as 'raw', we need to handle them differently
      const result = await cloudinary.uploader.upload(file, uploadOptions);
      console.log(`Upload successful, resource_type: ${result.resource_type}`);
      return result;
    } else {
      // For File or Blob objects, create a FormData and use the API
      throw new Error(
        "For client-side File/Blob uploads, use the client functions"
      );
    }
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

export default cloudinary;
