"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import {
  RiAddCircleLine,
  RiSearchLine,
  RiMessage3Line,
  RiLoader4Line,
  RiArrowRightLine,
} from "react-icons/ri";

const quickActions = [
  {
    icon: RiAddCircleLine,
    label: "Create Listing",
    description: "Add a new skill or resource",
    href: "/dashboard/listings/new",
    color: "emerald",
  },
  {
    icon: RiSearchLine,
    label: "Browse Items",
    description: "Find what you need",
    href: "/dashboard/listings",
    color: "blue",
  },
  {
    icon: RiMessage3Line,
    label: "Messages",
    description: "Check your conversations",
    href: "/dashboard/messages",
    color: "purple",
  },
];

interface DashboardStats {
  activeTradeRequests: number;
  completedTrades: number;
  successRate: number;
}

interface TradeRequest {
  _id: string;
  status: string;
  fromUser: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  fromListing: {
    _id: string;
    title: string;
  };
  toUser: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  toListing: {
    _id: string;
    title: string;
  };
  createdAt: string;
}

interface Listing {
  _id: string;
  title: string;
  description: string;
  category: string;
  images: string[];
  userId: string;
  user: {
    name: string;
    profilePicture?: string;
    location?: {
      city?: string;
      state?: string;
      country?: string;
    };
  };
  tradePreferences: string;
}

interface Activity {
  id: string;
  type: "trade_request" | "trade_completed" | "new_message" | "new_review";
  user: {
    name: string;
    profilePicture?: string;
  };
  action: string;
  item: string;
  itemId?: string;
  time: string;
  status: string;
}

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const firstName = user?.firstName || "there";

  const [stats, setStats] = useState<DashboardStats>({
    activeTradeRequests: 0,
    completedTrades: 0,
    successRate: 0,
  });
  const [recommendedListings, setRecommendedListings] = useState<Listing[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [recommendedLoading, setRecommendedLoading] = useState(true);

  // Fetch dashboard stats
  useEffect(() => {
    if (isLoaded && user) {
      fetchDashboardStats();
      fetchRecommendedListings();
      fetchRecentActivity();
    }
  }, [isLoaded, user]);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/users/${user?.id}/stats`);

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }

      const data = await response.json();
      setStats({
        activeTradeRequests: data.activeTradeRequests || 0,
        completedTrades: data.completedTrades || 0,
        successRate: data.successRate || 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecommendedListings = async () => {
    try {
      setRecommendedLoading(true);
      const response = await fetch("/api/listings/recommended");

      if (!response.ok) {
        throw new Error("Failed to fetch recommended listings");
      }

      const data = await response.json();
      setRecommendedListings(data.listings || []);
    } catch (error) {
      console.error("Error fetching recommended listings:", error);
    } finally {
      setRecommendedLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      setActivityLoading(true);
      const response = await fetch(`/api/users/${user?.id}/activity`);

      if (!response.ok) {
        throw new Error("Failed to fetch recent activity");
      }

      const data = await response.json();
      setRecentActivity(data.activities || []);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
    } finally {
      setActivityLoading(false);
    }
  };

  // Calculate percentage match (placeholder logic - you'd implement proper matching algorithm)
  const calculateMatch = (listing: Listing) => {
    // This would be replaced with actual matching logic
    const match = Math.floor(Math.random() * 16) + 80; // Random number between 80-95
    return `${match}%`;
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    }
  };

  // Redirect if not authenticated
  if (isLoaded && !user) {
    router.push("/");
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
        {/* Greeting & Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2 bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-4 lg:p-6"
          >
            <h2 className="text-xl lg:text-2xl font-bold mb-2">
              Welcome back, {firstName}! 👋
            </h2>
            <p className="text-black/60 dark:text-white/60 mb-4 lg:mb-6">
              Here&apos;s what&apos;s happening with your trades today.
            </p>
            {isLoading ? (
              <div className="grid grid-cols-3 gap-3 lg:gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-3 lg:p-4 rounded-lg bg-black/[.02] dark:bg-white/[.02] animate-pulse"
                  >
                    <div className="h-7 w-16 bg-black/[.05] dark:bg-white/[.05] rounded mb-1"></div>
                    <div className="h-4 w-20 bg-black/[.05] dark:bg-white/[.05] rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:gap-4">
                <div className="p-3 lg:p-4 rounded-lg bg-black/[.02] dark:bg-white/[.02]">
                  <div className="text-xl lg:text-2xl font-bold mb-1">
                    {stats.activeTradeRequests}
                  </div>
                  <div className="text-sm text-black/60 dark:text-white/60">
                    Active Trades
                  </div>
                </div>
                <div className="p-3 lg:p-4 rounded-lg bg-black/[.02] dark:bg-white/[.02]">
                  <div className="text-xl lg:text-2xl font-bold mb-1">
                    {stats.completedTrades}
                  </div>
                  <div className="text-sm text-black/60 dark:text-white/60">
                    Completed
                  </div>
                </div>
                <div className="p-3 lg:p-4 rounded-lg bg-black/[.02] dark:bg-white/[.02]">
                  <div className="text-xl lg:text-2xl font-bold mb-1">
                    {stats.successRate}%
                  </div>
                  <div className="text-sm text-black/60 dark:text-white/60">
                    Success Rate
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-4 lg:p-6"
          >
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {quickActions.map((action) => (
                <a
                  key={action.label}
                  href={action.href}
                  className="flex items-start p-3 rounded-lg hover:bg-black/[.02] dark:hover:bg-white/[.02] transition-colors"
                >
                  <action.icon className="w-5 h-5 text-emerald-600 dark:text-emerald-500 flex-shrink-0" />
                  <div className="ml-3">
                    <div className="text-sm font-medium">{action.label}</div>
                    <div className="text-xs text-black/60 dark:text-white/60">
                      {action.description}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recommended Listings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Recommended For You</h3>
            <Link
              href="/dashboard/listings"
              className="text-sm text-emerald-600 dark:text-emerald-500 flex items-center hover:underline"
            >
              View all <RiArrowRightLine className="ml-1" />
            </Link>
          </div>

          {recommendedLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-4 lg:p-6 animate-pulse"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-black/[.05] dark:bg-white/[.05]"></div>
                      <div>
                        <div className="h-4 w-24 bg-black/[.05] dark:bg-white/[.05] rounded mb-1"></div>
                        <div className="h-3 w-16 bg-black/[.05] dark:bg-white/[.05] rounded"></div>
                      </div>
                    </div>
                    <div className="h-4 w-12 bg-black/[.05] dark:bg-white/[.05] rounded"></div>
                  </div>
                  <div className="h-5 w-3/4 bg-black/[.05] dark:bg-white/[.05] rounded mb-2"></div>
                  <div className="h-4 w-full bg-black/[.05] dark:bg-white/[.05] rounded mb-4"></div>
                  <div className="h-8 w-full bg-black/[.05] dark:bg-white/[.05] rounded"></div>
                </div>
              ))}
            </div>
          ) : recommendedListings.length === 0 ? (
            <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-8 text-center">
              <p className="text-black/60 dark:text-white/60 mb-4">
                No recommendations available yet. Add more skills to your
                profile to get personalized matches.
              </p>
              <button
                onClick={() => router.push("/dashboard/profile")}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
              >
                Update Profile
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {recommendedListings.slice(0, 3).map((listing) => (
                <div
                  key={listing._id}
                  className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-4 lg:p-6 cursor-pointer hover:border-emerald-500/50"
                  onClick={() =>
                    router.push(`/dashboard/listings/${listing._id}`)
                  }
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        {listing.user?.profilePicture ? (
                          <img
                            src={listing.user.profilePicture}
                            alt={listing.user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 font-semibold">
                            {listing.user?.name?.charAt(0) || "?"}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">{listing.user?.name}</h4>
                        <p className="text-xs text-black/60 dark:text-white/60">
                          {listing.user?.location?.city &&
                          listing.user?.location?.state
                            ? `${listing.user.location.city}, ${listing.user.location.state}`
                            : "Location not specified"}
                        </p>
                      </div>
                    </div>
                    <span className="text-emerald-600 dark:text-emerald-500 text-sm font-medium">
                      {calculateMatch(listing)} Match
                    </span>
                  </div>
                  <h3 className="font-semibold mb-2">{listing.title}</h3>
                  <p className="text-sm text-black/60 dark:text-white/60 mb-4">
                    Looking for: {listing.tradePreferences}
                  </p>
                  <button
                    className="w-full px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/listings/${listing._id}`);
                    }}
                  >
                    View Listing
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-4 lg:p-6"
        >
          <h3 className="font-semibold mb-4">Recent Activity</h3>

          {activityLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center space-x-3 lg:space-x-4 p-3 lg:p-4 rounded-lg bg-black/[.02] dark:bg-white/[.02] animate-pulse"
                >
                  <div className="w-10 h-10 rounded-full bg-black/[.05] dark:bg-white/[.05]"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-4 w-3/4 bg-black/[.05] dark:bg-white/[.05] rounded mb-2"></div>
                    <div className="h-3 w-1/4 bg-black/[.05] dark:bg-white/[.05] rounded"></div>
                  </div>
                  <div className="h-5 w-16 bg-black/[.05] dark:bg-white/[.05] rounded"></div>
                </div>
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-black/60 dark:text-white/60">
                No recent activity to display. Start trading or messaging to see
                activity here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center space-x-3 lg:space-x-4 p-3 lg:p-4 rounded-lg hover:bg-black/[.02] dark:hover:bg-white/[.02] transition-colors cursor-pointer"
                  onClick={() => {
                    if (
                      activity.type === "trade_request" ||
                      activity.type === "trade_completed"
                    ) {
                      router.push(
                        `/dashboard/trade-requests?id=${activity.itemId}`
                      );
                    } else if (activity.type === "new_message") {
                      router.push("/dashboard/messages");
                    } else if (activity.type === "new_review") {
                      router.push(`/dashboard/profile?tab=reviews`);
                    }
                  }}
                >
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    {activity.user?.profilePicture ? (
                      <img
                        src={activity.user.profilePicture}
                        alt={activity.user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 font-semibold">
                        {activity.user?.name?.charAt(0) || "?"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user.name}</span>{" "}
                      {activity.action}{" "}
                      <span className="font-medium">{activity.item}</span>
                    </p>
                    <p className="text-xs text-black/60 dark:text-white/60">
                      {activity.time}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {activity.status === "pending" && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    )}
                    {activity.status === "completed" && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Completed
                      </span>
                    )}
                    {activity.status === "unread" && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Unread
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
