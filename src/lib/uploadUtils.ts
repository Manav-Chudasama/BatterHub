/**
 * Utility functions for file uploads to Cloudinary
 */

/**
 * Uploads a file to Cloudinary via the upload endpoint
 * @param file File to upload
 * @param folder Folder path in Cloudinary
 * @returns Object containing the Cloudinary URL and details
 */
export async function uploadFileToCloudinary(
  file: File,
  userId: string
): Promise<string> {
  try {
    // Create form data
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "batterhub_unsigned"); // Create an unsigned upload preset in your Cloudinary dashboard
    formData.append("folder", `batterhub/listings/${userId}`);
    formData.append("tags", userId);

    // Make API request to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("Failed to upload image to Cloudinary");
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw new Error("Failed to upload image");
  }
}

/**
 * Uploads multiple files to Cloudinary and returns their URLs
 * @param files Array of files to upload
 * @param userId User ID for folder organization
 * @returns Array of secure Cloudinary URLs
 */
export async function uploadFiles(
  files: File[],
  userId: string
): Promise<string[]> {
  if (!files || files.length === 0) return [];

  try {
    const uploadPromises = files.map((file) =>
      uploadFileToCloudinary(file, userId)
    );
    return Promise.all(uploadPromises);
  } catch (error) {
    console.error("Error uploading files:", error);
    throw new Error("Failed to upload files");
  }
}

/**
 * Get the public ID from a Cloudinary URL
 * @param url Cloudinary URL
 * @returns Cloudinary public ID
 */
export function getPublicIdFromUrl(url: string): string {
  try {
    // Format: https://res.cloudinary.com/cloud-name/image/upload/v1234567890/folder/public-id.jpg
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split("/");

    // Find the upload part in the URL
    const uploadIndex = pathSegments.findIndex(
      (segment) => segment === "upload"
    );
    if (uploadIndex === -1) return "";

    // Everything after 'upload' and the version segment (v1234567890)
    // Exclude the file extension
    const publicIdWithPath = pathSegments.slice(uploadIndex + 2).join("/");
    return publicIdWithPath.substring(0, publicIdWithPath.lastIndexOf("."));
  } catch {
    // If there's any error parsing the URL, return empty string
    return "";
  }
}

/**
 * Determines if a URL is a Cloudinary URL
 * @param url URL to check
 * @returns boolean indicating if it's a Cloudinary URL
 */
export function isCloudinaryUrl(url: string): boolean {
  return url.includes("cloudinary.com");
}

/**
 * Utility functions for handling file uploads on the client side
 */

/**
 * Convert a File object to a Base64 data URL
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Utility functions for file handling
 */

/**
 * Convert a File to a data URL
 * @param file The file to convert
 * @returns A Promise that resolves to the data URL
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert file to data URL"));
      }
    };
    reader.onerror = () => {
      reject(new Error("FileReader error"));
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Upload a file to Cloudinary via our API
 * @param file The file to upload
 * @param onProgress Optional callback for upload progress
 * @returns Promise that resolves to the upload result
 */
export const uploadFile = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ url: string; publicId: string; resourceType: string }> => {
  // Determine the appropriate resource type
  let resourceType: "image" | "video" | "raw" | "auto";

  if (file.type.startsWith("video/")) {
    resourceType = "video";
    console.log(`Processing video file: ${file.name} (${file.type})`);
  } else if (
    file.type === "application/pdf" ||
    file.type.includes("document") ||
    file.type === "text/plain"
  ) {
    resourceType = "raw"; // Use 'raw' for PDFs and documents to ensure they're handled correctly
    console.log(`Processing document file: ${file.name} (${file.type})`);
  } else {
    resourceType = "image"; // Default to 'image' for image files
    console.log(`Processing image file: ${file.name} (${file.type})`);
  }

  // Using FormData for file uploads
  const formData = new FormData();
  formData.append("file", file);

  try {
    // Create an AbortController to handle timeouts and cancellations
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    // Set up the fetch options with the signal
    const fetchOptions: RequestInit = {
      method: "POST",
      body: formData,
      signal: controller.signal,
    };

    // Set up a mock progress handler if onProgress is provided
    if (onProgress) {
      // Set initial progress
      onProgress(10);

      // Simulate progress since fetch doesn't provide upload progress
      const simulateProgress = () => {
        let progress = 10;
        const interval = setInterval(() => {
          progress += 5;
          if (progress >= 90) {
            clearInterval(interval);
          } else {
            onProgress(progress);
          }
        }, 300);

        return () => clearInterval(interval);
      };

      const clearProgressSimulation = simulateProgress();

      // Clean up the progress simulation when done
      setTimeout(() => {
        clearProgressSimulation();
        onProgress(100);
      }, 5000);
    }

    // Attempt the upload
    const response = await fetch(`/api/upload/cloudinary`, fetchOptions);

    // Clear the timeout since the request has completed
    clearTimeout(timeoutId);

    // Handle response
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Upload failed: ${response.status} ${response.statusText} - ${
          errorData.error || "Unknown error"
        }`
      );
    }

    const data = await response.json();
    console.log("Upload success:", data);

    return {
      url: data.url,
      publicId: data.public_id,
      resourceType: data.resource_type,
    };
  } catch (error) {
    console.error("File upload error:", error);
    throw error;
  }
};

/**
 * Get file name from a URL
 * @param url File URL
 * @returns Filename string
 */
export const getFileNameFromUrl = (url: string): string => {
  try {
    // Extract the file name from the URL
    const urlParts = url.split("/");
    let fileName = urlParts[urlParts.length - 1];

    // Remove any query parameters
    if (fileName.includes("?")) {
      fileName = fileName.split("?")[0];
    }

    // Try to decode the URL to handle special characters
    try {
      fileName = decodeURIComponent(fileName);
    } catch (e) {
      // If decoding fails, just use the raw filename
      console.warn("Failed to decode filename", e);
    }

    return fileName;
  } catch (e) {
    console.error("Error extracting filename from URL:", e);
    return "file"; // Fallback filename
  }
};

/**
 * Get file extension from a URL or filename
 * @param url URL or filename
 * @returns File extension (without the dot)
 */
export const getFileExtension = (url: string): string => {
  try {
    const fileName = getFileNameFromUrl(url);
    const parts = fileName.split(".");
    if (parts.length > 1) {
      return parts[parts.length - 1].toLowerCase();
    }
    return "";
  } catch (e) {
    console.error("Error extracting file extension:", e);
    return "";
  }
};

/**
 * Check if a URL points to an image file
 * @param url File URL
 * @returns Boolean indicating if it's an image
 */
export const isImageFile = (url: string): boolean => {
  const extension = getFileExtension(url);
  return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension);
};

/**
 * Check if a URL points to a PDF file
 * @param url File URL
 * @returns Boolean indicating if it's a PDF
 */
export const isPdfFile = (url: string): boolean => {
  const extension = getFileExtension(url);
  return extension === "pdf";
};

/**
 * Check if a URL points to a video file
 * @param url File URL
 * @returns Boolean indicating if it's a video
 */
export const isVideoFile = (url: string): boolean => {
  const extension = getFileExtension(url);
  return ["mp4", "webm", "ogg", "mov"].includes(extension);
};

/**
 * Get a human-readable file size
 * @param bytes Size in bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
