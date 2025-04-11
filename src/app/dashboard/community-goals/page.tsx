"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import {
  RiSearchLine,
  RiFilterLine,
  RiAddLine,
  RiRefreshLine,
  RiTeamLine,
  RiTimeLine,
  RiLoader4Line,
  RiEmotionSadLine,
  RiArrowRightSLine,
  RiArrowLeftSLine,
} from "react-icons/ri";
import Image from "next/image";

interface CommunityGoal {
  _id: string;
  title: string;
  description: string;
  goalType: "Skill" | "Item";
  targetAmount: number;
  imageUrl?: string;
  category?: string;
  status: "Active" | "Completed" | "Cancelled";
  contributions: {
    user: {
      _id: string;
      name: string;
      profilePicture?: string;
    };
    userId: string;
    contribution: string;
    percentage: number;
    createdAt: string;
  }[];
  totalProgress: number;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  createdBy: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  total: number;
  pages: number;
  page: number;
  limit: number;
}

export default function CommunityGoalsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [goals, setGoals] = useState<CommunityGoal[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    pages: 0,
    page: 1,
    limit: 9,
  });

  // Filter states
  const [filters, setFilters] = useState({
    status: "Active", // Default to active goals
    goalType: "",
    category: "",
    sort: "latest",
  });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Fetch community goals
  useEffect(() => {
    if (isLoaded && user) {
      fetchCommunityGoals();
    }
  }, [isLoaded, user, filters, pagination.page]);

  const fetchCommunityGoals = async () => {
    setIsLoading(true);
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();

      // Add filters
      if (filters.status) queryParams.set("status", filters.status);
      if (filters.goalType) queryParams.set("goalType", filters.goalType);
      if (filters.category) queryParams.set("category", filters.category);
      if (filters.sort) queryParams.set("sort", filters.sort);

      // Add pagination
      queryParams.set("page", pagination.page.toString());
      queryParams.set("limit", pagination.limit.toString());

      // Make API request
      const response = await fetch(
        `/api/community-goals?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch community goals");
      }

      const data = await response.json();
      setGoals(data.goals || []);
      setPagination(
        data.pagination || {
          total: 0,
          pages: 0,
          page: 1,
          limit: 9,
        }
      );
    } catch (err) {
      console.error("Error fetching community goals:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle viewing goal details
  const handleViewGoal = (goalId: string) => {
    router.push(`/dashboard/community-goals/${goalId}`);
  };

  // Handle creating a new goal
  const handleCreateGoal = () => {
    router.push("/dashboard/community-goals/create");
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    // Reset to first page when changing filters
    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  // Filter goals based on search query
  const filteredGoals = goals.filter((goal) => {
    if (searchQuery === "") return true;
    return (
      goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      goal.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (goal.category &&
        goal.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  // Redirect if not authenticated
  if (isLoaded && !user) {
    router.push("/");
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 p-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <RiTeamLine className="w-7 h-7 text-emerald-600 mr-2" />
              Community Goals
            </h1>
            <p className="text-black/60 dark:text-white/60">
              Collaborate with others to achieve community goals
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateGoal}
              className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              <RiAddLine />
              <span>Create Goal</span>
            </button>
            <button
              onClick={fetchCommunityGoals}
              className="p-2 text-black/60 dark:text-white/60 hover:text-emerald-600 dark:hover:text-emerald-500 rounded-lg border border-black/[.08] dark:border-white/[.08]"
              title="Refresh"
            >
              <RiRefreshLine className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/60 dark:text-white/60" />
            <input
              type="text"
              placeholder="Search goals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black text-black/80 dark:text-white/80 hover:bg-black/[.02] dark:hover:bg-white/[.02]"
          >
            <RiFilterLine className="w-5 h-5" />
            <span>Filters</span>
          </button>
        </div>

        {/* Filters panel */}
        {isFiltersOpen && (
          <div className="p-4 bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08]">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Status filter */}
              <div>
                <label className="block mb-2 text-sm font-medium">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full p-2 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black"
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Goal Type filter */}
              <div>
                <label className="block mb-2 text-sm font-medium">Type</label>
                <select
                  value={filters.goalType}
                  onChange={(e) =>
                    handleFilterChange("goalType", e.target.value)
                  }
                  className="w-full p-2 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black"
                >
                  <option value="">All Types</option>
                  <option value="Skill">Skill</option>
                  <option value="Item">Item</option>
                </select>
              </div>

              {/* Category filter */}
              <div>
                <label className="block mb-2 text-sm font-medium">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) =>
                    handleFilterChange("category", e.target.value)
                  }
                  className="w-full p-2 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black"
                >
                  <option value="">All Categories</option>
                  <option value="Education">Education</option>
                  <option value="Environment">Environment</option>
                  <option value="Health">Health</option>
                  <option value="Technology">Technology</option>
                  <option value="Community">Community</option>
                  <option value="Arts">Arts</option>
                  <option value="Sports">Sports</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Sort filter */}
              <div>
                <label className="block mb-2 text-sm font-medium">
                  Sort By
                </label>
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange("sort", e.target.value)}
                  className="w-full p-2 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black"
                >
                  <option value="latest">Latest</option>
                  <option value="progress">Progress</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center">
              <RiLoader4Line className="w-12 h-12 animate-spin text-emerald-600" />
              <p className="mt-4 text-black/60 dark:text-white/60">
                Loading community goals...
              </p>
            </div>
          </div>
        )}

        {/* No goals */}
        {!isLoading && goals.length === 0 && (
          <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-8 text-center">
            <div className="max-w-md mx-auto">
              <RiTeamLine className="w-16 h-16 mx-auto text-black/20 dark:text-white/20 mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                No community goals found
              </h3>
              <p className="text-black/60 dark:text-white/60 mb-6">
                {filters.status || filters.goalType || filters.category
                  ? "Try changing your filters to see more goals."
                  : "Be the first to create a community goal!"}
              </p>
              <button
                onClick={handleCreateGoal}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                Create a Goal
              </button>
            </div>
          </div>
        )}

        {/* No search results */}
        {!isLoading && goals.length > 0 && filteredGoals.length === 0 && (
          <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-8 text-center">
            <div className="max-w-md mx-auto">
              <RiEmotionSadLine className="w-16 h-16 mx-auto text-black/20 dark:text-white/20 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No matching goals</h3>
              <p className="text-black/60 dark:text-white/60 mb-6">
                We couldn&apos;t find any community goals matching &quot;
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

        {/* Goals grid */}
        {!isLoading && filteredGoals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGoals.map((goal) => (
              <motion.div
                key={goal._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] overflow-hidden hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-colors cursor-pointer"
                onClick={() => handleViewGoal(goal._id)}
              >
                {/* Goal image or placeholder */}
                <div className="relative aspect-video">
                  <Image
                    src={
                      goal.imageUrl ||
                      `https://placehold.co/600x400/90EAC3/333333?text=${encodeURIComponent(
                        goal.goalType
                      )}`
                    }
                    alt={goal.title}
                    className="w-full h-full object-cover"
                    width={600}
                    height={400}
                    
                  />
                  <div className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-b from-black/20 to-black/60">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-emerald-300 transition-colors line-clamp-2">
                        {goal.title}
                      </h3>
                      <div className="flex items-center text-white/80">
                        <span
                          className={`px-2 py-1 rounded-lg text-xs font-medium mr-2
                          ${
                            goal.status === "Active"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : goal.status === "Completed"
                              ? "bg-blue-500/20 text-blue-300"
                              : "bg-yellow-500/20 text-yellow-300"
                          }`}
                        >
                          {goal.status}
                        </span>
                        {goal.goalType && (
                          <span className="text-xs px-2 py-1 rounded-full bg-white/20">
                            {goal.goalType}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-black/60 dark:text-white/60">
                        Progress
                      </span>
                      <span className="font-medium">{goal.totalProgress}%</span>
                    </div>
                    <div className="h-2 bg-black/[.04] dark:bg-white/[.04] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${goal.totalProgress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-black/60 dark:text-white/60 mb-4 line-clamp-2">
                    {goal.description}
                  </p>

                  {/* Footer info */}
                  <div className="flex justify-between items-center">
                    {/* Creator info */}
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mr-2">
                        {goal.createdBy?.profilePicture ? (
                          <Image
                            src={goal.createdBy.profilePicture}
                            alt={goal.createdBy.name}
                            className="w-full h-full object-cover"
                            width={32}
                            height={32}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 font-semibold">
                            {goal.createdBy?.name
                              ? goal.createdBy.name.charAt(0)
                              : "?"}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">
                          {goal.createdBy?.name || "Unknown User"}
                        </span>
                        <span className="text-xs text-black/40 dark:text-white/40 flex items-center">
                          <RiTimeLine className="w-3 h-3 mr-1" />
                          {new Date(goal.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Contributors count */}
                    <div className="text-xs flex items-center text-black/60 dark:text-white/60">
                      <RiTeamLine className="w-4 h-4 mr-1" />
                      {goal.contributions.length} contributor
                      {goal.contributions.length !== 1 && "s"}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && pagination.pages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center space-x-2">
              <button
                onClick={() =>
                  handlePageChange(Math.max(1, pagination.page - 1))
                }
                disabled={pagination.page === 1}
                className="p-2 rounded-lg border border-black/[.08] dark:border-white/[.08] text-black/60 dark:text-white/60 hover:text-emerald-600 dark:hover:text-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RiArrowLeftSLine className="w-5 h-5" />
              </button>

              <div className="text-sm font-medium">
                Page {pagination.page} of {pagination.pages}
              </div>

              <button
                onClick={() =>
                  handlePageChange(
                    Math.min(pagination.pages, pagination.page + 1)
                  )
                }
                disabled={pagination.page === pagination.pages}
                className="p-2 rounded-lg border border-black/[.08] dark:border-white/[.08] text-black/60 dark:text-white/60 hover:text-emerald-600 dark:hover:text-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RiArrowRightSLine className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
