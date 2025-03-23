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
  } catch (error) {
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
