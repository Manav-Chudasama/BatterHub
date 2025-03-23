"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import FilterDrawer from "@/components/dashboard/FilterDrawer";
import { motion } from "framer-motion";
import {
  RiSearchLine,
  RiFilter3Line,
  RiGridFill,
  RiListUnordered,
  RiMapPinLine,
  RiTimeLine,
  RiAddCircleLine,
  RiBookmarkLine,
  RiBookmarkFill,
  RiAlertLine,
} from "react-icons/ri";

interface Filters {
  availability: string[];
  skillLevel: string;
  distance: number;
  rating: number;
  categories: string[];
  selectedCategories: string[];
  status?: string;
}

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

// Categories array
const categories = [
  "All Categories",
  "Academic Help",
  "Creative Skills",
  "Technology",
  "Language Learning",
  "Music & Arts",
  "Sports & Fitness",
  "Professional Skills",
];

export default function ListingsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isGridView, setIsGridView] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [savedListings, setSavedListings] = useState<string[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<Filters>({
    availability: [],
    skillLevel: "",
    distance: 10,
    rating: 4,
    categories: categories,
    selectedCategories: [],
    status: "active",
  });

  // Active filter count
  const activeFilterCount =
    filters.availability.length +
    (filters.skillLevel ? 1 : 0) +
    (filters.selectedCategories.length > 0 ? 1 : 0) +
    (filters.rating > 1 ? 1 : 0) +
    (filters.distance !== 50 ? 1 : 0);

  // Fetch all listings
  useEffect(() => {
    if (isLoaded && user) {
      fetchListings();
    }
  }, [isLoaded, user, filters.status]);

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      // Add status filter if it exists
      const statusParam = filters.status ? `status=${filters.status}` : "";
      const response = await fetch(`/api/listings?${statusParam}`);

      if (!response.ok) {
        throw new Error("Failed to fetch listings");
      }

      const data = await response.json();
      setListings(data.listings);
    } catch (err) {
      console.error("Error fetching listings:", err);
      setError("Failed to load listings. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSaved = async (listingId: string) => {
    setSavedListings((prev) =>
      prev.includes(listingId)
        ? prev.filter((id) => id !== listingId)
        : [...prev, listingId]
    );

    // Here you would typically update a saved listings API
    // For now, we're just updating the local state
  };

  // Handle viewing listing details
  const handleViewListing = (listingId: string) => {
    router.push(`/dashboard/listings/${listingId}`);
  };

  // Filter listings based on search query
  const filteredListings = listings.filter((listing) => {
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
        <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
          <div className="h-24 bg-black/[.02] dark:bg-white/[.02] rounded-lg" />
          <div className="h-12 bg-black/[.02] dark:bg-white/[.02] rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-64 bg-black/[.02] dark:bg-white/[.02] rounded-lg"
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
            <h1 className="text-2xl font-bold">Browse Listings</h1>
            <p className="text-black/60 dark:text-white/60">
              Discover skills and services available for trade
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard/listings/new")}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <RiAddCircleLine className="w-5 h-5" />
              <span>Create Listing</span>
            </button>
            <button
              onClick={() => router.push("/dashboard/listings/saved")}
              className="px-4 py-2 rounded-lg border border-black/[.08] dark:border-white/[.08] hover:bg-black/[.02] dark:hover:bg-white/[.02] text-black/60 dark:text-white/60 text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <RiBookmarkLine className="w-5 h-5" />
              <span>Saved</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-4">
          <div className="relative">
            <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/60 dark:text-white/60" />
            <input
              type="text"
              placeholder="Search for skills, services, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="pl-4 pr-10 py-3 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none"
              >
                <option value="active">Active Only</option>
                <option value="">All Listings</option>
                <option value="inactive">Inactive</option>
                <option value="traded">Traded</option>
              </select>
            </div>
            <div className="flex items-center rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black">
              <button
                onClick={() => setIsGridView(true)}
                className={`p-3 rounded-l-lg transition-colors ${
                  isGridView
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500"
                    : "text-black/60 dark:text-white/60 hover:bg-black/[.02] dark:hover:bg-white/[.02]"
                }`}
              >
                <RiGridFill className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsGridView(false)}
                className={`p-3 rounded-r-lg transition-colors ${
                  !isGridView
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500"
                    : "text-black/60 dark:text-white/60 hover:bg-black/[.02] dark:hover:bg-white/[.02]"
                }`}
              >
                <RiListUnordered className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={() => setIsFilterOpen(true)}
              className="relative p-3 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black text-black/60 dark:text-white/60 hover:bg-black/[.02] dark:hover:bg-white/[.02] transition-colors"
            >
              <RiFilter3Line className="w-5 h-5" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center">
            <RiAlertLine className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {/* No results */}
        {filteredListings.length === 0 && !isLoading && (
          <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-6 text-center">
            <p className="text-black/60 dark:text-white/60">
              {searchQuery
                ? "No listings found matching your search."
                : "No listings available at the moment."}
            </p>
            <button
              onClick={() => router.push("/dashboard/listings/new")}
              className="mt-4 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
            >
              Create a Listing
            </button>
          </div>
        )}

        {/* Grid View */}
        {isGridView ? (
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSaved(listing._id);
                    }}
                    className="absolute top-2 left-2 p-2 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-500"
                  >
                    {savedListings.includes(listing._id) ? (
                      <RiBookmarkFill className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <RiBookmarkLine className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-500 transition-colors">
                        {listing.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-black/60 dark:text-white/60">
                        {listing.user.location?.city && (
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
                        {listing.user.profilePicture ? (
                          <img
                            src={listing.user.profilePicture}
                            alt={listing.user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 font-semibold">
                            {listing.user.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-medium">
                        {listing.user.name}
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
        ) : (
          // List View
          <div className="space-y-4">
            {filteredListings.map((listing) => (
              <motion.div
                key={listing._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] overflow-hidden hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-colors cursor-pointer"
                onClick={() => handleViewListing(listing._id)}
              >
                <div className="flex flex-col md:flex-row">
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
                              : "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-500"
                          }`}
                        >
                          {listing.status.charAt(0).toUpperCase() +
                            listing.status.slice(1)}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSaved(listing._id);
                        }}
                        className="absolute top-2 left-2 p-2 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-500"
                      >
                        {savedListings.includes(listing._id) ? (
                          <RiBookmarkFill className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <RiBookmarkLine className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="p-6 flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-500 transition-colors">
                          {listing.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-black/60 dark:text-white/60">
                          {listing.user.location?.city && (
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
                      {listing.description.length > 200
                        ? listing.description.substring(0, 200) + "..."
                        : listing.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mr-2">
                          {listing.user.profilePicture ? (
                            <img
                              src={listing.user.profilePicture}
                              alt={listing.user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 font-semibold">
                              {listing.user.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-medium">
                          {listing.user.name}
                        </span>
                      </div>
                      <div className="text-xs px-2 py-1 rounded-full bg-black/[.02] dark:bg-white/[.02]">
                        {listing.category}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Filter Drawer */}
        <FilterDrawer
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          filters={filters}
          setFilters={setFilters}
        />
      </div>
    </DashboardLayout>
  );
}
