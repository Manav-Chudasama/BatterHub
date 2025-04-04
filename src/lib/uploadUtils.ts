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
  let timeoutDuration = 60000; // Default 60 seconds timeout

  if (file.type.startsWith("video/")) {
    resourceType = "video";
    // Extend timeout for video files based on size
    // Allow roughly 1MB per second upload speed as a conservative estimate
    const fileSizeMB = file.size / 1024 / 1024;
    timeoutDuration = Math.max(600000, fileSizeMB * 5000); // At least 10 minutes, or longer based on file size
    console.log(
      `Processing video file: ${file.name} (${
        file.type
      }), size: ${fileSizeMB.toFixed(2)}MB, timeout: ${timeoutDuration / 1000}s`
    );

    // Video optimization pre-check
    if (fileSizeMB > 100) {
      console.log(
        "Very large video detected, consider compressing it first for faster uploads"
      );
      // Show a warning to the user that this might take a while
      if (onProgress) {
        onProgress(1); // Start at 1% to show activity
      }
    }

    // Log the video format to help with debugging
    const videoFormat = file.type.split("/")[1] || "unknown";
    console.log(`Video format detected: ${videoFormat}`);

    // Check if the video format is well-supported by Cloudinary
    const wellSupportedFormats = ["mp4", "mov", "avi", "webm"];
    const isWellSupported = wellSupportedFormats.some((format) =>
      videoFormat.toLowerCase().includes(format)
    );

    if (!isWellSupported) {
      console.warn(
        `Video format ${videoFormat} may not be well-supported. Converting to MP4 is recommended.`
      );
      if (onProgress) {
        // Show initial progress but slower to indicate potential issues
        onProgress(2);
      }
    }

    // For very large videos, use specialized upload strategy
    if (file.size > 50 * 1024 * 1024) {
      return uploadLargeVideo(file, onProgress);
    }
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
    const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

    // Set up the fetch options with the signal
    const fetchOptions: RequestInit = {
      method: "POST",
      body: formData,
      signal: controller.signal,
    };

    // Improved progress handling for large uploads
    if (onProgress) {
      // Set initial progress
      onProgress(5);

      let isUploading = true;

      // For video files, we need a slower, more realistic progress simulation
      const simulateProgress = () => {
        let progress = 5;

        // Different increment speeds based on file size
        const fileSizeMB = file.size / 1024 / 1024;
        let increment = 0;

        if (file.type.startsWith("video/")) {
          // For videos, base increment on file size
          if (fileSizeMB > 100) {
            increment = 0.1; // Very slow for huge videos
          } else if (fileSizeMB > 50) {
            increment = 0.2; // Slow for large videos
          } else if (fileSizeMB > 20) {
            increment = 0.4; // Medium for medium videos
          } else {
            increment = 0.8; // Faster for small videos
          }
        } else {
          // For non-videos, use faster increments
          increment = 2;
        }

        // Calculate estimated time based on file size
        const uploadTimeEstimate = Math.max(30, fileSizeMB * 1.5); // Seconds
        const incrementInterval = Math.max(
          300,
          (uploadTimeEstimate * 1000) / 85
        ); // Divide by number of steps (85%, from 5% to 90%)

        console.log(
          `Upload time estimate: ${uploadTimeEstimate.toFixed(
            0
          )}s, update interval: ${(incrementInterval / 1000).toFixed(1)}s`
        );

        const interval = setInterval(() => {
          if (!isUploading) {
            clearInterval(interval);
            return;
          }

          progress += increment;

          // Cap progress at 90% until we get actual confirmation
          if (progress >= 90) {
            progress = 90;
            clearInterval(interval);
          }

          onProgress(Math.round(progress));
        }, incrementInterval / 90); // Distribute updates evenly

        return () => {
          isUploading = false;
          clearInterval(interval);
        };
      };

      const clearProgressSimulation = simulateProgress();

      // Handle completion or failure
      const completeProgress = (success = true) => {
        clearProgressSimulation();

        // On success, animate from current progress to 100%
        if (success) {
          // Simulate the final processing steps
          const processingInterval = setInterval(() => {
            // Get current progress
            const currentProgress = onProgress.toString().match(/\d+/);
            const current = currentProgress ? parseInt(currentProgress[0]) : 90;

            if (current >= 100) {
              clearInterval(processingInterval);
              return;
            }

            onProgress(Math.min(100, current + 2));
          }, 200);

          // Ensure we reach 100% after a fixed time
          setTimeout(() => {
            clearInterval(processingInterval);
            onProgress(100);
          }, 2000);
        } else {
          onProgress(0);
        }
      };

      try {
        // Attempt the upload
        const response = await fetch(`/api/upload/cloudinary`, fetchOptions);

        // Clear the timeout since the request has completed
        clearTimeout(timeoutId);

        // Handle response
        if (!response.ok) {
          completeProgress(false);
          const errorData = await response.json();

          // Show a user-friendly error message based on the error type
          let errorMessage = `Upload failed: ${response.status} ${response.statusText}`;

          if (errorData.error) {
            errorMessage = errorData.error;

            // Adjust the error message for specific file types
            if (
              file.type.startsWith("video/") &&
              (errorMessage.includes("format") ||
                errorMessage.includes("streaming"))
            ) {
              errorMessage = `This video format is not supported. Please convert to MP4 and try again.`;
            }

            // Log details for debugging
            console.error("Upload error details:", errorData);
          }

          throw new Error(errorMessage);
        }

        const data = await response.json();
        completeProgress(true);
        console.log("Upload success:", data);

        return {
          url: data.url,
          publicId: data.public_id,
          resourceType: data.resource_type,
        };
      } catch (error) {
        completeProgress(false);
        throw error;
      }
    } else {
      // No progress callback, just upload normally
      const response = await fetch(`/api/upload/cloudinary`, fetchOptions);
      clearTimeout(timeoutId);

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
    }
  } catch (error) {
    console.error("File upload error:", error);
    throw error;
  }
};

/**
 * Special handling for large video files to improve reliability
 */
const uploadLargeVideo = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ url: string; publicId: string; resourceType: string }> => {
  if (onProgress) {
    onProgress(2);
  }

  // Check if video format is MP4 - highest chance of success with Cloudinary
  const videoFormat = file.type.split("/")[1]?.toLowerCase() || "";
  const isMP4 = videoFormat === "mp4";

  if (!isMP4) {
    console.warn(
      "Non-MP4 video detected. For best results, convert to MP4 format before uploading."
    );
  }

  console.log(
    `Using optimized upload strategy for large video: ${file.name} (${(
      file.size /
      1024 /
      1024
    ).toFixed(2)}MB)`
  );

  try {
    // Using FormData for file uploads
    const formData = new FormData();
    formData.append("file", file);

    // Calculate a realistic timeout based on file size
    const timeoutSeconds = Math.max(600, file.size / 1024 / 100); // ~10KB/s minimum upload speed
    console.log(
      `Setting timeout to ${timeoutSeconds.toFixed(
        0
      )} seconds for large video upload`
    );

    // Create an AbortController to handle timeouts and cancellations
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      timeoutSeconds * 1000
    );

    // Progress simulation function
    let progressTracker = {
      currentProgress: 2,
      interval: null as NodeJS.Timeout | null,
      isComplete: false,
    };

    if (onProgress) {
      const updateInterval = Math.max(1000, (file.size / 1024 / 1024) * 50); // Slower updates for larger files

      progressTracker.interval = setInterval(() => {
        if (progressTracker.isComplete) return;

        // Very slow progression for large files
        const increment = file.size > 100 * 1024 * 1024 ? 0.2 : 0.5;
        progressTracker.currentProgress += increment;

        // Cap at 95%
        if (progressTracker.currentProgress >= 95) {
          progressTracker.currentProgress = 95;
          if (progressTracker.interval) {
            clearInterval(progressTracker.interval);
            progressTracker.interval = null;
          }
        }

        onProgress(Math.round(progressTracker.currentProgress));
      }, updateInterval);
    }

    // Complete function to clean up and set final progress
    const completeProgress = (success: boolean) => {
      progressTracker.isComplete = true;

      if (progressTracker.interval) {
        clearInterval(progressTracker.interval);
        progressTracker.interval = null;
      }

      if (onProgress) {
        if (success) {
          // Animate to 100%
          const finalInterval = setInterval(() => {
            progressTracker.currentProgress += 1;
            if (progressTracker.currentProgress >= 100) {
              progressTracker.currentProgress = 100;
              clearInterval(finalInterval);
            }
            onProgress(Math.round(progressTracker.currentProgress));
          }, 100);

          // Ensure we reach 100% after a short delay
          setTimeout(() => {
            clearInterval(finalInterval);
            onProgress(100);
          }, 1000);
        } else {
          onProgress(0);
        }
      }
    };

    // Attempt the upload
    const response = await fetch(`/api/upload/cloudinary`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    // Clear the timeout
    clearTimeout(timeoutId);

    // Handle response
    if (!response.ok) {
      completeProgress(false);
      const errorData = await response.json();
      throw new Error(
        `Upload failed: ${response.status} ${response.statusText} - ${
          errorData.error || "Unknown error"
        }`
      );
    }

    const data = await response.json();
    completeProgress(true);
    console.log("Large video upload success:", data);

    return {
      url: data.url,
      publicId: data.public_id,
      resourceType: data.resource_type,
    };
  } catch (error) {
    console.error("Large video upload error:", error);
    if (onProgress) {
      onProgress(0); // Reset progress on error
    }
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
