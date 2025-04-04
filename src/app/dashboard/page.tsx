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
  RiArrowRightLine,
  RiTeamLine,
} from "react-icons/ri";
import { DashboardStats, Listing, Activity, CommunityGoal } from "@/types";

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
  {
    icon: RiTeamLine,
    label: "Community Goals",
    description: "Collaborate with others",
    href: "/dashboard/community-goals",
    color: "orange",
  },
];

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const firstName = user?.firstName || "there";

  const [stats, setStats] = useState<DashboardStats>({
    activeTradeRequests: 0,
    completedTrades: 0,
    reputationScore: 0,
  });
  const [recommendedListings, setRecommendedListings] = useState<Listing[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [recommendedLoading, setRecommendedLoading] = useState(true);
  const [reviews, setReviews] = useState<{ rating: number }[]>([]);
  const [activeGoals, setActiveGoals] = useState<CommunityGoal[]>([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(true);
  const [goalsError, setGoalsError] = useState("");

  // Fetch dashboard stats
  useEffect(() => {
    if (isLoaded && user) {
      fetchDashboardStats();
      fetchUserReviews();
      fetchRecommendedListings();
      fetchRecentActivity();
      fetchActiveGoals();
    }
  }, [isLoaded, user]);

  const fetchUserReviews = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/reviews?reviewedUserId=${user.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch user reviews");
      }
      const data = await response.json();
      setReviews(data.reviews || []);

      // Calculate average rating
      if (data.reviews && data.reviews.length > 0) {
        const totalRating = data.reviews.reduce(
          (sum: number, review: { rating: number }) => sum + review.rating,
          0
        );
        const averageRating = totalRating / data.reviews.length;
        // Update reputation score with the average rating (scaled to 100)
        setStats((prevStats) => ({
          ...prevStats,
          reputationScore: Math.round(averageRating * 20), // 5 stars = 100%
        }));
      }
    } catch (error) {
      console.error("Error fetching user reviews:", error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/users/${user?.id}/stats`);

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }

      const data = await response.json();
      console.log(data);
      setStats({
        activeTradeRequests: data.activeTradeRequests || 0,
        completedTrades: data.completedTrades || 0,
        reputationScore: data.reputationScore || 0,
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

  const fetchActiveGoals = async () => {
    setIsLoadingGoals(true);
    try {
      const response = await fetch(
        "/api/community-goals?status=Active&limit=3"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch active goals");
      }

      const data = await response.json();
      setActiveGoals(data.goals || []);
    } catch (err) {
      console.error("Error fetching active goals:", err);
      setGoalsError("Failed to load active goals");
    } finally {
      setIsLoadingGoals(false);
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
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="p-3 lg:p-4 rounded-lg bg-black/[.02] dark:bg-white/[.02] animate-pulse"
                  >
                    <div className="h-7 w-16 bg-black/[.05] dark:bg-white/[.05] rounded mb-1"></div>
                    <div className="h-4 w-20 bg-black/[.05] dark:bg-white/[.05] rounded"></div>
                  </div>
                ))}
                <div className="p-3 lg:p-4 rounded-lg bg-black/[.02] dark:bg-white/[.02] animate-pulse">
                  <div className="flex mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="w-5 h-5 mr-1 bg-black/[.05] dark:bg-white/[.05] rounded-full"
                      ></div>
                    ))}
                  </div>
                  <div className="h-4 w-20 bg-black/[.05] dark:bg-white/[.05] rounded"></div>
                </div>
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
                  <div className="flex items-center mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${
                          i <
                          Math.min(5, Math.round(stats.reputationScore / 20))
                            ? "text-yellow-400"
                            : "text-gray-300 dark:text-gray-600"
                        }`}
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 22 20"
                      >
                        <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z" />
                      </svg>
                    ))}
                    {reviews.length > 0 && (
                      <span className="ml-2 text-xs text-black/60 dark:text-white/60">
                        ({reviews.length})
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-black/60 dark:text-white/60">
                    Reputation
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
                      100% Match
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
            <div className="animate-pulse">
              <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded mb-4"></div>
              <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded mb-4"></div>
            </div>
          ) : recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <ActivityItem key={index} activity={activity} />
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No recent activity
              </p>
            </div>
          )}
        </motion.div>

        {/* Community Goals */}
        <div className="col-span-1 row-span-1 space-y-6">
          {/* Goals Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Community Goals</h2>
            <Link
              href="/dashboard/community-goals"
              className="text-sm text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center"
            >
              View All
              <RiArrowRightLine className="ml-1" />
            </Link>
          </div>

          {/* Goals List */}
          {isLoadingGoals ? (
            <div className="text-center py-8 text-black/60 dark:text-white/60">
              Loading community goals...
            </div>
          ) : activeGoals.length > 0 ? (
            <div className="space-y-4">
              {activeGoals.map((goal: CommunityGoal) => (
                <Link
                  href={`/dashboard/community-goals/${goal._id}`}
                  key={goal._id}
                  className="block bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-4 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-black/90 dark:text-white/90">
                      {goal.title}
                    </h3>
                    <span className="px-2 py-1 text-xs rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                      {goal.goalType}
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-black/60 dark:text-white/60">
                        Progress
                      </span>
                      <span className="font-medium">{goal.totalProgress}%</span>
                    </div>
                    <div className="h-1.5 bg-black/[.04] dark:bg-white/[.04] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${goal.totalProgress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-xs text-black/60 dark:text-white/60 flex items-center">
                    <RiTeamLine className="w-3.5 h-3.5 mr-1" />
                    <span>
                      {goal.contributions.length} contributor
                      {goal.contributions.length !== 1 && "s"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-6 text-center">
              <RiTeamLine className="w-10 h-10 mx-auto mb-2 text-black/20 dark:text-white/20" />
              <p className="mb-4 text-black/60 dark:text-white/60">
                No active goals found
              </p>
              <Link
                href="/dashboard/community-goals/create"
                className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                Create a Goal
              </Link>
            </div>
          )}

          {goalsError && (
            <div className="bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 p-4 rounded-lg text-center">
              {goalsError}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

const ActivityItem = ({ activity }: { activity: Activity }) => {
  return (
    <div className="flex items-start bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-4">
      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mr-3 flex-shrink-0">
        {activity.user?.profilePicture ? (
          <img
            src={activity.user.profilePicture}
            alt={activity.user.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 font-semibold">
            {activity.user?.name ? activity.user.name.charAt(0) : "?"}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p>
          <span className="font-medium">{activity.user?.name}</span>{" "}
          {activity.message ||
            (activity.type === "trade"
              ? "sent a trade request for"
              : "viewed your listing")}
          {activity.item && (
            <>
              {" "}
              <Link
                href={`/dashboard/listings/${activity.itemId}`}
                className="text-emerald-600 dark:text-emerald-500 hover:underline"
              >
                {activity.item}
              </Link>
            </>
          )}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {activity.date
            ? `${new Date(activity.date).toLocaleDateString()} at ${new Date(
                activity.date
              ).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : formatRelativeTime(activity.createdAt || "")}
        </p>
      </div>
      {activity.status && (
        <span
          className={`ml-2 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
            activity.status === "accepted"
              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              : activity.status === "completed"
              ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
              : activity.status === "declined"
              ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
              : "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
          }`}
        >
          {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
        </span>
      )}
    </div>
  );
};

const formatRelativeTime = (dateString: string): string => {
  if (!dateString) return "Unknown time";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 7) {
    return date.toLocaleDateString();
  } else if (diffDay > 0) {
    return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
  } else if (diffHour > 0) {
    return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
  } else if (diffMin > 0) {
    return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
  } else {
    return "Just now";
  }
};
