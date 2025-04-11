"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import {
  RiImageAddLine,
  RiDeleteBin6Line,
  RiArrowLeftLine,
  RiCheckLine,
  RiErrorWarningLine,
} from "react-icons/ri";
import Image from "next/image";

// Define constants locally to avoid issues with model imports in client components
const LISTING_CATEGORIES = [
  "Academic Help",
  "Creative Skills",
  "Technology",
  "Language Learning",
  "Music & Arts",
  "Sports & Fitness",
  "Professional Skills",
  "Other",
] as const;

const AVAILABILITY_OPTIONS = [
  "Weekday Mornings",
  "Weekday Afternoons",
  "Weekday Evenings",
  "Weekend Mornings",
  "Weekend Afternoons",
  "Weekend Evenings",
  "Flexible",
] as const;

export default function CreateListing() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>(
    []
  );
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    tradePreferences: "",
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // If user is not authenticated, redirect to sign-in
  if (isLoaded && !user) {
    router.push("/sign-in");
    return null;
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      setFormError("You can only upload up to 5 images");
      return;
    }

    setImages([...images, ...files]);
    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls([...previewUrls, ...newPreviewUrls]);
    setFormError("");
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    const newPreviewUrls = [...previewUrls];
    newImages.splice(index, 1);
    URL.revokeObjectURL(previewUrls[index]);
    newPreviewUrls.splice(index, 1);
    setImages(newImages);
    setPreviewUrls(newPreviewUrls);
  };

  const toggleAvailability = (option: string) => {
    setSelectedAvailability((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option]
    );
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Upload images to Cloudinary via our API endpoint
  const uploadImages = async (): Promise<string[]> => {
    if (images.length === 0) return [];

    try {
      const formData = new FormData();
      images.forEach((image) => {
        formData.append("images", image);
      });

      const response = await fetch("/api/listings/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload images");
      }

      const data = await response.json();
      return data.urls;
    } catch (error) {
      console.error("Error uploading images:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");
    setFormSuccess("");

    // Validate form
    if (
      !formData.title ||
      !formData.description ||
      !formData.category ||
      !formData.tradePreferences
    ) {
      setFormError("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    if (selectedAvailability.length === 0) {
      setFormError("Please select at least one availability option");
      setIsSubmitting(false);
      return;
    }

    try {
      // Upload images to Cloudinary
      const imageUrls = await uploadImages();

      // Create listing in database
      const response = await fetch("/api/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          availability: selectedAvailability,
          images: imageUrls,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create listing");
      }

      // Response data used for success message
      await response.json();
      setFormSuccess("Listing created successfully!");

      // Redirect to the listing page after a short delay
      setTimeout(() => {
        router.push(`/dashboard/listings/my`);
      }, 1500);
    } catch (error: unknown) {
      console.error("Error creating listing:", error);
      let errorMessage = "An error occurred while creating the listing";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center text-black/60 dark:text-white/60 hover:text-emerald-600 dark:hover:text-emerald-500 mb-2"
            >
              <RiArrowLeftLine className="w-5 h-5 mr-1" />
              Back to Listings
            </button>
            <h1 className="text-2xl font-bold">Create New Listing</h1>
            <p className="text-black/60 dark:text-white/60">
              Share your skills and what you&apos;re looking to trade for
            </p>
          </div>
        </div>

        {formError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg flex items-center"
          >
            <RiErrorWarningLine className="w-5 h-5 mr-2" />
            {formError}
          </motion.div>
        )}

        {formSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg flex items-center"
          >
            <RiCheckLine className="w-5 h-5 mr-2" />
            {formSuccess}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-6"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="e.g., Python Programming Tutoring"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium mb-2"
              >
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Describe your skill or service in detail..."
              />
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium mb-2"
              >
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">Select a category</option>
                {LISTING_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Trade Preferences */}
            <div>
              <label
                htmlFor="tradePreferences"
                className="block text-sm font-medium mb-2"
              >
                What are you looking to trade for?{" "}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                id="tradePreferences"
                name="tradePreferences"
                value={formData.tradePreferences}
                onChange={handleInputChange}
                required
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="List the skills or services you're interested in receiving in exchange..."
              />
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Availability <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AVAILABILITY_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleAvailability(option)}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                      selectedAvailability.includes(option)
                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500"
                        : "bg-black/[.02] dark:bg-white/[.02] text-black/60 dark:text-white/60 hover:bg-black/[.05] dark:hover:bg-white/[.05]"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Images (up to 5)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-4">
                {previewUrls.map((url, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden border border-black/[.08] dark:border-white/[.08]"
                  >
                    <Image
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                      width={400}
                      height={400}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/50 hover:bg-black/70 text-white"
                    >
                      <RiDeleteBin6Line className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="aspect-square rounded-lg border-2 border-dashed border-black/[.08] dark:border-white/[.08] hover:border-emerald-500/50 dark:hover:border-emerald-500/50 cursor-pointer flex items-center justify-center">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <RiImageAddLine className="w-8 h-8 text-black/40 dark:text-white/40" />
                  </label>
                )}
              </div>
              <p className="text-xs text-black/40 dark:text-white/40">
                Supported formats: JPG, PNG, GIF (max 5MB each)
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 rounded-lg border border-black/[.08] dark:border-white/[.08] hover:bg-black/[.02] dark:hover:bg-white/[.02] text-black/60 dark:text-white/60 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creating..." : "Create Listing"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
