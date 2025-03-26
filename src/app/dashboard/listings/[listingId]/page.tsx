"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import React from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import TradeRequestModal from "@/components/TradeRequestModal";
import { motion } from "framer-motion";
import {
  RiEditLine,
  RiMapPinLine,
  RiCalendarLine,
  RiUser3Line,
  RiShieldCheckLine,
  RiErrorWarningLine,
  RiLoader4Line,
  RiArrowLeftLine,
  RiEyeCloseLine,
  RiEyeLine,
  RiCheckboxCircleLine,
  RiDeleteBinLine,
  RiExchangeLine,
} from "react-icons/ri";

interface Listing {
  _id: string;
  title: string;
  description: string;
  category: string;
  images: string[];
  status: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  tradePreferences: string;
  views: number;
  tradeRequests: string[];
  availability: string[];
  user: {
    name: string;
    location?: {
      city?: string;
      state?: string;
      country?: string;
    };
  };
}

export default function ListingDetailPage({
  params,
}: {
  params: { listingId: string };
}) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<string | null>(null);
  const isOwner = user && listing?.userId === user.id;

  const { listingId } = params;
  useEffect(() => {
    const fetchListing = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/listings/${listingId}`);

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "Listing not found"
              : "Failed to fetch listing"
          );
        }

        const data = await response.json();
        setListing(data.listing);
      } catch (err) {
        console.error("Error fetching listing:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load listing. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (listingId) {
      fetchListing();
    }
  }, [listingId]);

  // Handle showing status modal
  const handleShowStatusModal = (status: string) => {
    setNewStatus(status);
    setShowStatusModal(true);
  };

  // Handle status change confirmation
  const confirmStatusChange = async () => {
    if (!listing || !newStatus) return;

    try {
      const response = await fetch(`/api/listings/${listing._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update listing status");
      }

      // Update the listing in state
      setListing((prev) => (prev ? { ...prev, status: newStatus } : null));
      setShowStatusModal(false);
      setNewStatus(null);
    } catch (err) {
      console.error("Error updating listing status:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update listing status. Please try again."
      );
      setShowStatusModal(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!listing) return;

    try {
      // Call API to delete the listing
      const response = await fetch(`/api/listings/${listing._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete listing");
      }

      router.push("/dashboard/listings/my");
    } catch (err) {
      console.error("Error deleting listing:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete listing. Please try again."
      );
      setShowDeleteModal(false);
    }
  };

  // Formatted date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status action text
  const getStatusActionText = (status: string) => {
    switch (status) {
      case "active":
        return "Mark as Active";
      case "inactive":
        return "Make Inactive";
      case "traded":
        return "Mark as Traded";
      default:
        return "Change Status";
    }
  };

  // Get status confirmation text
  const getStatusConfirmText = () => {
    if (!newStatus) return "";

    switch (newStatus) {
      case "active":
        return "This will make your listing visible in the browse listings section.";
      case "inactive":
        return "This will hide your listing from the browse listings section, but you can make it active again later.";
      case "traded":
        return "This will mark your item as traded and remove it from the browse listings section. This can't be undone.";
      default:
        return "";
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto p-4">
          <div className="h-96 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <RiLoader4Line className="w-12 h-12 animate-spin text-emerald-600" />
              <p className="mt-4 text-black/60 dark:text-white/60">
                Loading listing...
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto p-4">
          <div className="h-96 flex items-center justify-center">
            <div className="flex flex-col items-center text-center">
              <RiErrorWarningLine className="w-12 h-12 text-red-500" />
              <h2 className="mt-4 text-xl font-bold">
                Oops! Something went wrong
              </h2>
              <p className="mt-2 text-black/60 dark:text-white/60">{error}</p>
              <button
                onClick={() => router.back()}
                className="mt-6 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // If listing doesn't exist
  if (!listing) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto p-4">
          <div className="h-96 flex items-center justify-center">
            <div className="flex flex-col items-center text-center">
              <RiErrorWarningLine className="w-12 h-12 text-red-500" />
              <h2 className="mt-4 text-xl font-bold">Listing Not Found</h2>
              <p className="mt-2 text-black/60 dark:text-white/60">
                This listing may have been removed or doesn&apos;t exist.
              </p>
              <button
                onClick={() => router.push("/dashboard/listings/my")}
                className="mt-6 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                View My Listings
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto p-4">
        <button
          onClick={() => router.back()}
          className="flex items-center text-black/60 dark:text-white/60 hover:text-emerald-600 dark:hover:text-emerald-500 mb-6"
        >
          <RiArrowLeftLine className="w-5 h-5 mr-1" />
          Back to Listings
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Image Gallery */}
          <div className="lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-black border border-black/[.08] dark:border-white/[.08] rounded-lg overflow-hidden"
            >
              <div className="aspect-[4/3] relative">
                {listing.images && listing.images.length > 0 ? (
                  <img
                    src={listing.images[selectedImageIndex]}
                    alt={`${listing.title} - Image ${selectedImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black/[.02] dark:bg-white/[.02]">
                    <p className="text-black/40 dark:text-white/40">
                      No images available
                    </p>
                  </div>
                )}

                {listing.status === "traded" && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="bg-white dark:bg-black px-4 py-2 rounded-lg text-center transform -rotate-12">
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-500">
                        TRADED
                      </p>
                    </div>
                  </div>
                )}

                {listing.status === "inactive" && (
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 rounded-lg text-xs font-medium bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-500">
                      Inactive
                    </span>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {listing.images && listing.images.length > 1 && (
                <div className="grid grid-cols-5 gap-2 p-2">
                  {listing.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 ${
                        selectedImageIndex === index
                          ? "border-emerald-500"
                          : "border-transparent"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Actions for owner */}
            {isOwner && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    router.push(`/dashboard/listings/edit/${listing._id}`)
                  }
                  className="py-2 rounded-lg bg-black/[.02] dark:bg-white/[.02] hover:bg-black/[.05] dark:hover:bg-white/[.05] text-black/70 dark:text-white/70 flex items-center justify-center"
                >
                  <RiEditLine className="w-5 h-5 mr-2" />
                  Edit Listing
                </motion.button>

                {listing.status === "active" && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleShowStatusModal("inactive")}
                    className="py-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-500 flex items-center justify-center"
                  >
                    <RiEyeCloseLine className="w-5 h-5 mr-2" />
                    Make Inactive
                  </motion.button>
                )}

                {listing.status === "inactive" && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleShowStatusModal("active")}
                    className="py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500 flex items-center justify-center"
                  >
                    <RiEyeLine className="w-5 h-5 mr-2" />
                    Make Active
                  </motion.button>
                )}

                {listing.status !== "traded" && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleShowStatusModal("traded")}
                      className="py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-500 flex items-center justify-center"
                    >
                      <RiCheckboxCircleLine className="w-5 h-5 mr-2" />
                      Mark as Traded
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowDeleteModal(true)}
                      className="py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500 flex items-center justify-center"
                    >
                      <RiDeleteBinLine className="w-5 h-5 mr-2" />
                      Delete Listing
                    </motion.button>
                  </>
                )}
              </div>
            )}

            {/* Actions for non-owner */}
            {!isOwner &&
              isLoaded &&
              user &&
              listing &&
              listing.status === "active" && (
                <div className="mt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowTradeModal(true)}
                    className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center"
                  >
                    <RiExchangeLine className="w-5 h-5 mr-2" />
                    Request Trade
                  </motion.button>
                </div>
              )}
          </div>

          {/* Listing Details */}
          <div className="lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-black border border-black/[.08] dark:border-white/[.08] rounded-lg p-6"
            >
              <div className="mb-4">
                <span className="inline-block px-3 py-1 text-xs rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500 mb-3">
                  {listing.category}
                </span>
                <h1 className="text-2xl font-bold">{listing.title}</h1>
              </div>

              <div className="mb-6">
                <div className="flex items-center text-black/60 dark:text-white/60 text-sm mb-1">
                  <RiUser3Line className="w-4 h-4 mr-1" />
                  Posted by {listing.user.name}
                </div>

                {listing.user.location?.city && (
                  <div className="flex items-center text-black/60 dark:text-white/60 text-sm mb-1">
                    <RiMapPinLine className="w-4 h-4 mr-1" />
                    {[
                      listing.user.location.city,
                      listing.user.location.state,
                      listing.user.location.country,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                )}

                <div className="flex items-center text-black/60 dark:text-white/60 text-sm">
                  <RiCalendarLine className="w-4 h-4 mr-1" />
                  Posted on {formatDate(listing.createdAt)}
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Description</h2>
                <p className="text-black/70 dark:text-white/70 whitespace-pre-line">
                  {listing.description}
                </p>
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">
                  Looking to Trade For
                </h2>
                <div className="bg-black/[.02] dark:bg-white/[.02] p-4 rounded-lg">
                  <p className="text-black/70 dark:text-white/70">
                    {listing.tradePreferences}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Availability</h2>
                <div className="flex flex-wrap gap-2">
                  {listing.availability.map((time) => (
                    <span
                      key={time}
                      className="px-3 py-1 rounded-lg bg-black/[.02] dark:bg-white/[.02] text-black/70 dark:text-white/70 text-sm"
                    >
                      {time}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded-lg bg-black/[.02] dark:bg-white/[.02]">
                  <p className="text-xs text-black/40 dark:text-white/40">
                    Views
                  </p>
                  <p className="text-sm font-medium">{listing.views || 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-black/[.02] dark:bg-white/[.02]">
                  <p className="text-xs text-black/40 dark:text-white/40">
                    Trade Requests
                  </p>
                  <p className="text-sm font-medium">
                    {listing.tradeRequests?.length || 0}
                  </p>
                </div>
              </div>

              {listing.status === "traded" && (
                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 p-4 rounded-lg flex items-center justify-center">
                  <RiShieldCheckLine className="w-5 h-5 mr-2" />
                  This listing has been traded
                </div>
              )}

              {listing.status === "inactive" && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 p-4 rounded-lg flex items-center justify-center">
                  <RiErrorWarningLine className="w-5 h-5 mr-2" />
                  This listing is currently inactive
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Status Change Confirmation Modal */}
      {showStatusModal && newStatus && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-black rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">
              {getStatusActionText(newStatus)}
            </h3>
            <p className="mb-6 text-black/60 dark:text-white/60">
              {getStatusConfirmText()}
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setNewStatus(null);
                }}
                className="px-4 py-2 rounded-lg border border-black/[.08] dark:border-white/[.08] text-black/60 dark:text-white/60"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                className={`px-4 py-2 rounded-lg text-white ${
                  newStatus === "inactive"
                    ? "bg-yellow-600 hover:bg-yellow-700"
                    : newStatus === "traded"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-black rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Delete Listing</h3>
            <p className="mb-6 text-black/60 dark:text-white/60">
              Are you sure you want to permanently delete this listing? This
              action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-lg border border-black/[.08] dark:border-white/[.08] text-black/60 dark:text-white/60"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trade Request Modal */}
      {showTradeModal && listing && (
        <TradeRequestModal
          isOpen={showTradeModal}
          onClose={() => setShowTradeModal(false)}
          listingId={listing._id}
          listingTitle={listing.title}
        />
      )}
    </DashboardLayout>
  );
}
