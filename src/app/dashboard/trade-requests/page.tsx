"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import {
  RiCheckLine,
  RiCloseLine,
  RiExchangeLine,
  RiMessage3Line,
  RiTimeLine,
  RiSearchLine,
} from "react-icons/ri";
import Link from "next/link";
import Image from "next/image";

interface User {
  name: string;
  avatar: string;
  verified: boolean;
}

interface TradeItem {
  title: string;
  description: string;
  image: string;
}

interface TradeRequest {
  id: number;
  type: "sent" | "received";
  status: TradeStatus;
  createdAt: string;
  lastUpdated: string;
  from?: User;
  to?: User;
  offering: TradeItem;
  requesting: TradeItem;
  messages: number;
}

type TradeStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "completed"
  | "countered";

// Mock data for trade requests
const tradeRequests: TradeRequest[] = [
  {
    id: 1,
    type: "received",
    status: "pending",
    createdAt: "2024-03-20T10:30:00Z",
    lastUpdated: "2024-03-20T10:30:00Z",
    from: {
      name: "Alex Chen",
      avatar: "https://i.pravatar.cc/150?img=11",
      verified: true,
    },
    offering: {
      title: "Python Programming Help",
      description:
        "2 hours of Python tutoring, covering any topics you need help with.",
      image:
        "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop&q=60",
    },
    requesting: {
      title: "Web Development Mentoring",
      description:
        "Your web development mentoring services focusing on React and Node.js",
      image:
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60",
    },
    messages: 3,
  },
  {
    id: 2,
    type: "sent",
    status: "accepted",
    createdAt: "2024-03-19T15:45:00Z",
    lastUpdated: "2024-03-19T18:20:00Z",
    to: {
      name: "Maria Garcia",
      avatar: "https://i.pravatar.cc/150?img=12",
      verified: true,
    },
    offering: {
      title: "Digital Marketing Strategy",
      description:
        "Social media marketing strategy consultation and implementation plan.",
      image:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60",
    },
    requesting: {
      title: "UI/UX Design Workshop",
      description:
        "2-hour workshop on modern UI/UX design principles and practices.",
      image:
        "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=800&auto=format&fit=crop&q=60",
    },
    messages: 5,
  },
];

interface CounterOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (message: string) => void;
}

function CounterOfferModal({
  isOpen,
  onClose,
  onSubmit,
}: CounterOfferModalProps) {
  const [message, setMessage] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-black rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Counter Offer</h3>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your counter offer..."
          className="w-full px-4 py-2 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20 mb-4"
          rows={4}
        />
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-black/[.08] dark:border-white/[.08] hover:bg-black/[.02] dark:hover:bg-white/[.02] text-black/60 dark:text-white/60 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSubmit(message);
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium"
          >
            Send Counter Offer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TradeRequestsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TradeStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "sent" | "received">(
    "all"
  );
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<number | null>(null);

  // Filter trade requests based on search query, status, and type
  const filteredRequests = tradeRequests.filter((request: TradeRequest) => {
    const matchesSearch =
      request.offering.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      request.requesting.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || request.status === statusFilter;
    const matchesType = typeFilter === "all" || request.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleStatusChange = (requestId: number, newStatus: TradeStatus) => {
    // Implement status change logic here
    console.log(`Changing status of request ${requestId} to ${newStatus}`);
  };

  const handleCounterOffer = (requestId: number) => {
    setSelectedRequest(requestId);
    setShowCounterModal(true);
  };

  const submitCounterOffer = (message: string) => {
    // Implement counter offer logic here
    console.log(
      `Submitting counter offer for request ${selectedRequest}:`,
      message
    );
    handleStatusChange(selectedRequest!, "countered");
  };

  // Redirect if not authenticated
  if (isLoaded && !user) {
    router.push("/");
    return null;
  }

  // Show loading state
  if (!isLoaded) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
          <div className="h-24 bg-black/[.02] dark:bg-white/[.02] rounded-lg" />
          <div className="h-12 bg-black/[.02] dark:bg-white/[.02] rounded-lg" />
          <div className="space-y-4">
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
        <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-6">
          <h1 className="text-2xl font-bold">Trade Requests</h1>
          <p className="text-black/60 dark:text-white/60">
            Manage your incoming and outgoing trade requests
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,auto] gap-4">
          <div className="relative">
            <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/60 dark:text-white/60" />
            <input
              type="text"
              placeholder="Search trade requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as TradeStatus | "all")
            }
            className="px-4 py-3 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
            <option value="countered">Countered</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value as "all" | "sent" | "received")
            }
            className="px-4 py-3 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">All Requests</option>
            <option value="received">Received</option>
            <option value="sent">Sent</option>
          </select>
        </div>

        {/* Trade Requests List */}
        <div className="space-y-4">
          {filteredRequests.map((request: TradeRequest) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-6"
            >
              {/* Request Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <Image
                    src={
                      request.type === "received" && request.from
                        ? request.from.avatar
                        : request.to?.avatar || ""
                    }
                    alt={
                      request.type === "received" && request.from
                        ? request.from.name
                        : request.to?.name || ""
                    }
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">
                        {request.type === "received" && request.from
                          ? request.from.name
                          : request.to?.name || "Unknown User"}
                      </span>
                      {((request.type === "received" &&
                        request.from?.verified) ||
                        (request.type === "sent" && request.to?.verified)) && (
                        <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-black/60 dark:text-white/60">
                      <RiTimeLine className="w-4 h-4" />
                      <span>
                        {new Date(request.lastUpdated).toLocaleDateString()} at{" "}
                        {new Date(request.lastUpdated).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      request.status === "pending"
                        ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-500"
                        : request.status === "accepted"
                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500"
                        : request.status === "rejected"
                        ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500"
                        : request.status === "completed"
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-500"
                        : "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-500"
                    }`}
                  >
                    {request.status.charAt(0).toUpperCase() +
                      request.status.slice(1)}
                  </span>
                  <Link
                    href={`/dashboard/messages/${request.id}`}
                    className="p-2 rounded-lg hover:bg-black/[.02] dark:hover:bg-white/[.02] text-black/60 dark:text-white/60 relative"
                  >
                    <RiMessage3Line className="w-5 h-5" />
                    {request.messages > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white text-xs font-medium rounded-full flex items-center justify-center">
                        {request.messages}
                      </span>
                    )}
                  </Link>
                </div>
              </div>

              {/* Trade Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Offering */}
                <div>
                  <div className="text-sm font-medium mb-2">Offering</div>
                  <div className="rounded-lg border border-black/[.08] dark:border-white/[.08] overflow-hidden">
                    <Image
                      src={request.offering.image}
                      alt={request.offering.title}
                      width={800}
                      height={400}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-medium mb-2">
                        {request.offering.title}
                      </h3>
                      <p className="text-sm text-black/60 dark:text-white/60">
                        {request.offering.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Requesting */}
                <div>
                  <div className="text-sm font-medium mb-2">Requesting</div>
                  <div className="rounded-lg border border-black/[.08] dark:border-white/[.08] overflow-hidden">
                    <Image
                      src={request.requesting.image}
                      alt={request.requesting.title}
                      width={800}
                      height={400}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-medium mb-2">
                        {request.requesting.title}
                      </h3>
                      <p className="text-sm text-black/60 dark:text-white/60">
                        {request.requesting.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {request.status === "pending" && request.type === "received" && (
                <div className="mt-6 flex items-center space-x-4">
                  <button
                    onClick={() => handleStatusChange(request.id, "accepted")}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors flex items-center"
                  >
                    <RiCheckLine className="w-5 h-5 mr-2" />
                    Accept Trade
                  </button>
                  <button
                    onClick={() => handleCounterOffer(request.id)}
                    className="px-4 py-2 rounded-lg border border-black/[.08] dark:border-white/[.08] hover:bg-black/[.02] dark:hover:bg-white/[.02] text-black/60 dark:text-white/60 text-sm font-medium transition-colors flex items-center"
                  >
                    <RiExchangeLine className="w-5 h-5 mr-2" />
                    Counter Offer
                  </button>
                  <button
                    onClick={() => handleStatusChange(request.id, "rejected")}
                    className="px-4 py-2 rounded-lg border border-black/[.08] dark:border-white/[.08] hover:bg-black/[.02] dark:hover:bg-white/[.02] text-red-600 text-sm font-medium transition-colors flex items-center"
                  >
                    <RiCloseLine className="w-5 h-5 mr-2" />
                    Reject
                  </button>
                </div>
              )}

              {request.status === "accepted" && (
                <div className="mt-6">
                  <button
                    onClick={() => handleStatusChange(request.id, "completed")}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors flex items-center"
                  >
                    <RiCheckLine className="w-5 h-5 mr-2" />
                    Mark as Completed
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Counter Offer Modal */}
        <CounterOfferModal
          isOpen={showCounterModal}
          onClose={() => setShowCounterModal(false)}
          onSubmit={submitCounterOffer}
        />
      </div>
    </DashboardLayout>
  );
}
