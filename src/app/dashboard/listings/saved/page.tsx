"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import SaveButton from "@/components/SaveButton";
import { motion } from "framer-motion";
import {
  RiSearchLine,
  RiMapPinLine,
  RiTimeLine,
  RiArrowLeftLine,
  RiBookmarkLine,
  RiEmotionSadLine,
  RiLoader4Line,
} from "react-icons/ri";

interface Listing {
  _id: string;
  title: string;
  description: string;
  category: string;
  images: string[];
  status: "active" | "inactive" | "traded" | "deleted";
  userId: string;
  createdAt: string;
  updatedAt: string;
  tradePreferences: string;
  views: number;
  tradeRequests: string[];
  availability: string[];
  user: {
    name: string;
    profilePicture?: string;
    location?: {
      city?: string;
      state?: string;
      country?: string;
    };
  };
}

export default function SavedListingsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [savedListings, setSavedListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch saved listings
  useEffect(() => {
    if (isLoaded && user) {
      fetchSavedListings();
    }
  }, [isLoaded, user]);

  const fetchSavedListings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${user?.id}/saved-listings`);

      if (!response.ok) {
        throw new Error("Failed to fetch saved listings");
      }

      const data = await response.json();
      setSavedListings(data.savedListings || []);
    } catch (err) {
      console.error("Error fetching saved listings:", err);
      setError("Failed to load saved listings. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle viewing listing details
  const handleViewListing = (listingId: string) => {
    router.push(`/dashboard/listings/${listingId}`);
  };

  // Filter listings based on search query
  const filteredListings = savedListings.filter((listing) => {
    console.log("listing", listing);
    if (searchQuery === "") return true;
    return (
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Redirect if not authenticated
  if (isLoaded && !user) {
    router.push("/");
    return null;
  }

  // Show loading state
  if (!isLoaded || isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto p-4">
          <div className="h-96 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <RiLoader4Line className="w-12 h-12 animate-spin text-emerald-600" />
              <p className="mt-4 text-black/60 dark:text-white/60">
                Loading saved listings...
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 p-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-6">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center text-black/60 dark:text-white/60 hover:text-emerald-600 dark:hover:text-emerald-500 mb-2"
            >
              <RiArrowLeftLine className="w-5 h-5 mr-1" />
              Back
            </button>
            <h1 className="text-2xl font-bold">Saved Listings</h1>
            <p className="text-black/60 dark:text-white/60">
              Manage your saved skills and services for future reference
            </p>
          </div>
          <div className="relative w-full md:w-64">
            <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/60 dark:text-white/60" />
            <input
              type="text"
              placeholder="Search saved items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {/* No saved listings */}
        {savedListings.length === 0 && (
          <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-8 text-center">
            <div className="max-w-md mx-auto">
              <RiBookmarkLine className="w-16 h-16 mx-auto text-black/20 dark:text-white/20 mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                No saved listings yet
              </h3>
              <p className="text-black/60 dark:text-white/60 mb-6">
                When you find listings you&apos;d like to save for later, click
                the bookmark icon to add them here.
              </p>
              <button
                onClick={() => router.push("/dashboard/listings")}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                Browse Listings
              </button>
            </div>
          </div>
        )}

        {/* No search results */}
        {savedListings.length > 0 && filteredListings.length === 0 && (
          <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-8 text-center">
            <div className="max-w-md mx-auto">
              <RiEmotionSadLine className="w-16 h-16 mx-auto text-black/20 dark:text-white/20 mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                No matching listings
              </h3>
              <p className="text-black/60 dark:text-white/60 mb-6">
                We couldn&apos;t find any saved listings matching &quot;
                {searchQuery}&quot;.
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                Clear Search
              </button>
            </div>
          </div>
        )}

        {/* Saved listings grid */}
        {filteredListings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <motion.div
                key={listing._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] overflow-hidden hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-colors cursor-pointer"
                onClick={() => handleViewListing(listing._id)}
              >
                <div className="relative aspect-[4/3]">
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
                          : "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-500"
                      }`}
                    >
                      {listing.status.charAt(0).toUpperCase() +
                        listing.status.slice(1)}
                    </span>
                  </div>
                  <span className="absolute top-2 left-2">
                    <SaveButton
                      listingId={listing._id}
                      initialSaved={true}
                      onSaveChange={(saved) => {
                        if (!saved) {
                          // If unsaved, remove from local state immediately for better UX
                          setSavedListings((prev) =>
                            prev.filter((item) => item._id !== listing._id)
                          );
                        }
                      }}
                      showText={false}
                      size="sm"
                      className="p-2 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-sm"
                    />
                  </span>
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-500 transition-colors">
                        {listing.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-black/60 dark:text-white/60">
                        {listing.user?.location?.city && (
                          <div className="flex items-center">
                            <RiMapPinLine className="w-4 h-4 mr-1" />
                            {listing.user.location.city}
                          </div>
                        )}
                        {listing.availability &&
                          listing.availability.length > 0 && (
                            <div className="flex items-center">
                              <RiTimeLine className="w-4 h-4 mr-1" />
                              {listing.availability[0]}
                              {listing.availability.length > 1 && "..."}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-black/60 dark:text-white/60 mb-4">
                    {listing.description.length > 120
                      ? listing.description.substring(0, 120) + "..."
                      : listing.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mr-2">
                        {listing.user?.profilePicture ? (
                          <img
                            src={listing.user.profilePicture}
                            alt={listing.user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 font-semibold">
                            {listing.user?.name
                              ? listing.user.name.charAt(0)
                              : "?"}
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-medium">
                        {listing.user?.name || "Unknown User"}
                      </span>
                    </div>
                    <div className="text-xs px-2 py-1 rounded-full bg-black/[.02] dark:bg-white/[.02]">
                      {listing.category}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
