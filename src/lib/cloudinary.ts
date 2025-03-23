import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Uploads a file to Cloudinary
 * @param file File to upload
 * @param folder Optional folder path
 * @returns Cloudinary upload response
 */
export const uploadToCloudinary = async (
  file: string | File | Blob,
  options?: {
    folder?: string;
    publicId?: string;
    tags?: string[];
    transformation?: any[];
  }
) => {
  const {
    folder = "batterhub/listings",
    publicId,
    tags,
    transformation,
  } = options || {};

  try {
    if (typeof file === "string" && file.startsWith("data:")) {
      // Upload base64 data URL directly
      const result = await cloudinary.uploader.upload(file, {
        folder,
        public_id: publicId,
        tags,
        transformation,
      });
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
