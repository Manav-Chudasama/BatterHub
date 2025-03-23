"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import {

  RiCheckboxCircleLine,
  RiMoreLine,
  RiSearchLine,
  RiAddCircleLine,
  RiAlertLine,
  
  RiEyeCloseLine,
  RiEyeLine,
  RiDeleteBinLine,
  RiEditLine,
} from "react-icons/ri";

// Define listing interface
interface Listing {
  _id: string;
  title: string;
  description: string;
  category: string;
  images: string[];
  status: "active" | "inactive" | "traded" | "deleted";
  tradeRequests: string[]; // Array of trade request IDs
  createdAt: string;
  updatedAt: string;
  tradePreferences: string;
  views: number;
  availability: string[];
  user: {
    name: string;
    profilePicture?: string;
  };
}

interface ListingStats {
  active: number;
  inactive: number;
  traded: number;
  total: number;
}

export default function MyListingsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<ListingStats>({
    active: 0,
    inactive: 0,
    traded: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch user's listings
  useEffect(() => {
    if (isLoaded && user) {
      fetchListings();
    }
  }, [isLoaded, user, statusFilter]);

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      // Add status filter if not "all"
      const statusParam =
        statusFilter !== "all" ? `&status=${statusFilter}` : "";
      const response = await fetch(`/api/listings/my?${statusParam}`);

      if (!response.ok) {
        throw new Error("Failed to fetch listings");
      }

      const data = await response.json();
      setListings(data.listings);
      setStats(data.stats);
    } catch (err) {
      console.error("Error fetching listings:", err);
      setError("Failed to load your listings. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter listings based on search query
  const filteredListings = listings.filter((listing) => {
    return (
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleEditListing = (listingId: string) => {
    router.push(`/dashboard/listings/edit/${listingId}`);
  };

  const handleMarkCompleted = async (listingId: string) => {
    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "traded" }),
      });

      if (!response.ok) {
        throw new Error("Failed to update listing status");
      }

      // Refetch listings after status update
      fetchListings();
    } catch (err) {
      console.error("Error updating listing status:", err);
      setError("Failed to update listing status. Please try again.");
    }
  };

  const handleToggleActive = async (
    listingId: string,
    currentStatus: string
  ) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";

    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update listing status to ${newStatus}`);
      }

      // Refetch listings after status update
      fetchListings();
    } catch (err) {
      console.error("Error updating listing status:", err);
      setError(
        `Failed to update listing status to ${newStatus}. Please try again.`
      );
    }
  };

  // Handle navigation to listing details
  const handleViewListing = (listingId: string) => {
    router.push(`/dashboard/listings/${listingId}`);
  };

  const handleDeleteListing = (listing: Listing) => {
    setSelectedListing(listing);
    setShowDeleteModal(true);
  };

  const confirmDeleteListing = async () => {
    if (!selectedListing) return;

    try {
      const response = await fetch(`/api/listings/${selectedListing._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete listing");
      }

      // Refetch listings after deletion
      fetchListings();
      setShowDeleteModal(false);
    } catch (err) {
      console.error("Error deleting listing:", err);
      setError("Failed to delete listing. Please try again.");
    }
  };

  // Redirect if not authenticated
  if (isLoaded && !user) {
    router.push("/");
    return null;
  }

  // Show loading state
  if (!isLoaded || isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
          <div className="h-24 bg-black/[.02] dark:bg-white/[.02] rounded-lg" />
          <div className="h-12 bg-black/[.02] dark:bg-white/[.02] rounded-lg" />
          <div className="grid grid-cols-1 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 bg-black/[.02] dark:bg-white/[.02] rounded-lg"
              />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-6">
          <div>
            <h1 className="text-2xl font-bold">My Listings</h1>
            <p className="text-black/60 dark:text-white/60">
              Manage your active listings and trade requests
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard/listings/new")}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors flex items-center space-x-2"
          >
            <RiAddCircleLine className="w-5 h-5" />
            <span>Create Listing</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-4">
            <p className="text-black/60 dark:text-white/60 text-sm mb-1">
              Total
            </p>
            <p className="text-xl font-semibold">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-4">
            <p className="text-emerald-600 dark:text-emerald-500 text-sm mb-1">
              Active
            </p>
            <p className="text-xl font-semibold">{stats.active}</p>
          </div>
          <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-4">
            <p className="text-yellow-600 dark:text-yellow-500 text-sm mb-1">
              Inactive
            </p>
            <p className="text-xl font-semibold">{stats.inactive}</p>
          </div>
          <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-4">
            <p className="text-blue-600 dark:text-blue-500 text-sm mb-1">
              Traded
            </p>
            <p className="text-xl font-semibold">{stats.traded}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-4">
          <div className="relative">
            <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/60 dark:text-white/60" />
            <input
              type="text"
              placeholder="Search your listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="traded">Traded</option>
          </select>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center">
            <RiAlertLine className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {/* Listings */}
        <div className="space-y-4">
          {filteredListings.length === 0 ? (
            <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-6 text-center">
              <p className="text-black/60 dark:text-white/60">
                {searchQuery
                  ? "No listings found matching your search."
                  : "You don't have any listings yet."}
              </p>
              <button
                onClick={() => router.push("/dashboard/listings/new")}
                className="mt-4 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
              >
                Create Your First Listing
              </button>
            </div>
          ) : (
            filteredListings.map((listing) => (
              <motion.div
                key={listing._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] overflow-hidden hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-colors"
              >
                <div
                  className="flex flex-col md:flex-row cursor-pointer"
                  onClick={() => handleViewListing(listing._id)}
                >
                  {/* Image */}
                  <div className="md:w-48 lg:w-64">
                    <div className="aspect-[4/3] relative">
                      <img
                        src={
                          listing.images?.[0] ||
                          "https://placehold.co/400x300?text=No+Image"
                        }
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <span
                          className={`px-2 py-1 rounded-lg text-xs font-medium
                          ${
                            listing.status === "active"
                              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500"
                              : listing.status === "traded"
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-500"
                              : listing.status === "inactive"
                              ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-500"
                              : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500"
                          }`}
                        >
                          {listing.status.charAt(0).toUpperCase() +
                            listing.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold mb-2 group-hover:text-emerald-600 flex items-center">
                          {listing.title}
                        </h3>
                        <p className="text-sm text-black/60 dark:text-white/60 mb-4">
                          {listing.description.length > 150
                            ? listing.description.substring(0, 150) + "..."
                            : listing.description}
                        </p>
                      </div>
                      <div
                        className="relative"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering parent onClick
                        }}
                      >
                        <button
                          onClick={() =>
                            setShowActionsMenu(
                              showActionsMenu === listing._id
                                ? null
                                : listing._id
                            )
                          }
                          className="p-2 rounded-lg hover:bg-black/[.02] dark:hover:bg-white/[.02] text-black/60 dark:text-white/60"
                        >
                          <RiMoreLine className="w-5 h-5" />
                        </button>
                        {showActionsMenu === listing._id && (
                          <div className="absolute right-0 mt-2 w-48 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black shadow-lg py-2 z-10">
                            {listing.status !== "traded" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleMarkCompleted(listing._id)
                                  }
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-black/[.02] dark:hover:bg-white/[.02] text-black/60 dark:text-white/60 flex items-center"
                                >
                                  <RiCheckboxCircleLine className="w-4 h-4 mr-2" />
                                  Mark as Traded
                                </button>
                                <button
                                  onClick={() =>
                                    handleToggleActive(
                                      listing._id,
                                      listing.status
                                    )
                                  }
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-black/[.02] dark:hover:bg-white/[.02] text-black/60 dark:text-white/60 flex items-center"
                                >
                                  {listing.status === "active" ? (
                                    <>
                                      <RiEyeCloseLine className="w-4 h-4 mr-2" />
                                      Make Inactive
                                    </>
                                  ) : (
                                    <>
                                      <RiEyeLine className="w-4 h-4 mr-2" />
                                      Make Active
                                    </>
                                  )}
                                </button>
                                <button
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-black/[.02] dark:hover:bg-white/[.02] text-black/60 dark:text-white/60 flex items-center"
                                  onClick={() =>
                                    handleEditListing(listing._id)
                                  }
                                >
                                  <RiEditLine className="w-4 h-4 mr-2" />
                                  Edit Listing
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDeleteListing(listing)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-black/[.02] dark:hover:bg-white/[.02] text-red-600 dark:text-red-500 flex items-center"
                            >
                              <RiDeleteBinLine className="w-4 h-4 mr-2" />
                              Delete Listing
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      <div className="p-3 rounded-lg bg-black/[.02] dark:bg-white/[.02]">
                        <p className="text-xs text-black/40 dark:text-white/40">
                          Category
                        </p>
                        <p className="text-sm font-medium">
                          {listing.category}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-black/[.02] dark:bg-white/[.02]">
                        <p className="text-xs text-black/40 dark:text-white/40">
                          Views
                        </p>
                        <p className="text-sm font-medium">
                          {listing.views || 0}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-black/[.02] dark:bg-white/[.02]">
                        <p className="text-xs text-black/40 dark:text-white/40">
                          Trade Requests
                        </p>
                        <p className="text-sm font-medium">
                          {listing.tradeRequests?.length || 0}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-black/[.02] dark:bg-white/[.02]">
                        <p className="text-xs text-black/40 dark:text-white/40">
                          Created
                        </p>
                        <p className="text-sm font-medium">
                          {new Date(listing.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Looking For */}
                    <div>
                      <p className="text-xs text-black/40 dark:text-white/40 mb-2">
                        Looking to trade for:
                      </p>
                      <p className="text-sm text-black/80 dark:text-white/80">
                        {listing.tradePreferences}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedListing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-black rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Delete Listing</h3>
            <p className="mb-2 text-black/60 dark:text-white/60">
              Are you sure you want to permanently delete this listing?
            </p>
            <p className="mb-6 font-semibold">{selectedListing.title}</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-lg border border-black/[.08] dark:border-white/[.08] text-black/60 dark:text-white/60"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteListing}
                className="px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
