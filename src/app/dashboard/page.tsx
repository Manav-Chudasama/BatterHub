"use client";

import { useUser } from "@clerk/nextjs";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { RiAddCircleLine, RiSearchLine, RiMessage3Line } from "react-icons/ri";

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

const recommendedTrades = [
  {
    title: "Python Programming Help",
    user: "Alex Chen",
    userImage: "https://i.pravatar.cc/150?img=11",
    looking: "Guitar Lessons",
    distance: "0.5 miles",
    match: "95%",
  },
  {
    title: "Spanish Language Exchange",
    user: "Maria Garcia",
    userImage: "https://i.pravatar.cc/150?img=12",
    looking: "Math Tutoring",
    distance: "1.2 miles",
    match: "90%",
  },
  {
    title: "Photography Sessions",
    user: "James Wilson",
    userImage: "https://i.pravatar.cc/150?img=13",
    looking: "Web Design",
    distance: "0.8 miles",
    match: "85%",
  },
];

const recentActivity = [
  {
    type: "trade_request",
    user: "Sarah Miller",
    userImage: "https://i.pravatar.cc/150?img=14",
    action: "requested to trade",
    item: "Digital Art Skills",
    time: "2 hours ago",
    status: "pending",
  },
  {
    type: "trade_completed",
    user: "David Park",
    userImage: "https://i.pravatar.cc/150?img=15",
    action: "completed trade for",
    item: "Physics Tutoring",
    time: "1 day ago",
    status: "completed",
  },
  {
    type: "new_message",
    user: "Emma Thompson",
    userImage: "https://i.pravatar.cc/150?img=16",
    action: "sent you a message about",
    item: "Guitar Lessons",
    time: "3 hours ago",
    status: "unread",
  },
];

export default function Dashboard() {
  const { user } = useUser();
  const firstName = user?.firstName || "there";

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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:gap-4">
              <div className="p-3 lg:p-4 rounded-lg bg-black/[.02] dark:bg-white/[.02]">
                <div className="text-xl lg:text-2xl font-bold mb-1">12</div>
                <div className="text-sm text-black/60 dark:text-white/60">
                  Active Trades
                </div>
              </div>
              <div className="p-3 lg:p-4 rounded-lg bg-black/[.02] dark:bg-white/[.02]">
                <div className="text-xl lg:text-2xl font-bold mb-1">28</div>
                <div className="text-sm text-black/60 dark:text-white/60">
                  Completed
                </div>
              </div>
              <div className="p-3 lg:p-4 rounded-lg bg-black/[.02] dark:bg-white/[.02]">
                <div className="text-xl lg:text-2xl font-bold mb-1">95%</div>
                <div className="text-sm text-black/60 dark:text-white/60">
                  Success Rate
                </div>
              </div>
            </div>
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

        {/* Recommended Trades */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6"
        >
          {recommendedTrades.map((trade, index) => (
            <div
              key={index}
              className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-4 lg:p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <img
                    src={trade.userImage}
                    alt={trade.user}
                    className="w-8 h-8 lg:w-10 lg:h-10 rounded-full"
                  />
                  <div>
                    <h4 className="font-medium">{trade.user}</h4>
                    <p className="text-xs text-black/60 dark:text-white/60">
                      {trade.distance}
                    </p>
                  </div>
                </div>
                <span className="text-emerald-600 dark:text-emerald-500 text-sm font-medium">
                  {trade.match} Match
                </span>
              </div>
              <h3 className="font-semibold mb-2">{trade.title}</h3>
              <p className="text-sm text-black/60 dark:text-white/60 mb-4">
                Looking for: {trade.looking}
              </p>
              <button className="w-full px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors">
                View Trade
              </button>
            </div>
          ))}
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-4 lg:p-6"
        >
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 lg:space-x-4 p-3 lg:p-4 rounded-lg hover:bg-black/[.02] dark:hover:bg-white/[.02] transition-colors"
              >
                <img
                  src={activity.userImage}
                  alt={activity.user}
                  className="w-8 h-8 lg:w-10 lg:h-10 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user}</span>{" "}
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
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
