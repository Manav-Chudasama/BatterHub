"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import {
  RiSearchLine,
  RiTimeLine,
  RiMessage3Line,
  RiCheckLine,
  RiCloseLine,
  RiExchangeLine,
  RiAlertLine,
} from "react-icons/ri";

interface User {
  name: string;
  avatar?: string;
  verified?: boolean;
  profilePicture?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
}

interface TradeItem {
  _id: string;
  title: string;
  description: string;
  images: string[];
  user: User;
}

interface TradeRequest {
  _id: string;
  type: "sent" | "received";
  status: TradeStatus;
  createdAt: string;
  updatedAt: string;
  fromUserId: string;
  toUserId: string;
  fromListing: TradeItem | null;
  toListing: TradeItem;
  messages: {
    from: string;
    content: string;
    timestamp: string;
  }[];
}

interface TradeStats {
  sent: number;
  received: number;
  pending: number;
  accepted: number;
  rejected: number;
  completed: number;
  countered: number;
}

type TradeStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "completed"
  | "countered";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(message);
    setMessage("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-black rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-bold mb-4">Counter Offer</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="message"
              className="block mb-2 text-sm font-medium text-black/70 dark:text-white/70"
            >
              Counter Offer Message
            </label>
            <textarea
              id="message"
              rows={4}
              placeholder="Describe your counter offer..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-black/[.08] dark:border-white/[.08] text-black/60 dark:text-white/60"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Send Counter Offer
            </button>
          </div>
        </form>
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
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [tradeRequests, setTradeRequests] = useState<TradeRequest[]>([]);
  const [stats, setStats] = useState<TradeStats>({
    sent: 0,
    received: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    completed: 0,
    countered: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isLoaded && user) {
      fetchTradeRequests();
    }
  }, [isLoaded, user, statusFilter, typeFilter]);

  const fetchTradeRequests = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (typeFilter !== "all") {
        params.append("type", typeFilter);
      }

      const response = await fetch(`/api/trade-requests?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch trade requests");
      }

      const data = await response.json();

      // Map server response to expected format
      const mappedRequests = data.tradeRequests.map(
        (request: {
          _id: string;
          fromUserId: string;
          toUserId: string;
          status: TradeStatus;
          createdAt: string;
          updatedAt: string;
          fromListing: {
            _id: string;
            title: string;
            description: string;
            images: string[];
            user: {
              name: string;
              profilePicture?: string;
              location?: {
                city?: string;
                state?: string;
                country?: string;
              };
            };
          } | null;
          toListing: {
            _id: string;
            title: string;
            description: string;
            images: string[];
            user: {
              name: string;
              profilePicture?: string;
              location?: {
                city?: string;
                state?: string;
                country?: string;
              };
            };
          };
          messages: {
            from: string;
            content: string;
            timestamp: string;
          }[];
        }) => {
          // Determine if this is a sent or received request
          const type = request.fromUserId === user?.id ? "sent" : "received";

          return {
            _id: request._id,
            type,
            status: request.status,
            createdAt: request.createdAt,
            updatedAt: request.updatedAt,
            fromUserId: request.fromUserId,
            toUserId: request.toUserId,
            fromListing: request.fromListing,
            toListing: request.toListing,
            messages: request.messages,
          };
        }
      );

      setTradeRequests(mappedRequests);
      setStats(data.stats);
    } catch (err) {
      console.error("Error fetching trade requests:", err);
      setError("Failed to load trade requests. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter trade requests based on search query
  const filteredRequests = tradeRequests.filter((request: TradeRequest) => {
    const matchesSearch =
      (request.fromListing?.title
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ??
        false) ||
      (request.toListing?.title
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ??
        false);

    return matchesSearch;
  });

  const handleStatusChange = async (
    requestId: string,
    newStatus: TradeStatus,
    message?: string
  ) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/trade-requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          message: message || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update trade request status");
      }

      // Refresh the trade requests after status update
      await fetchTradeRequests();
    } catch (err) {
      console.error("Error updating trade request status:", err);
      setError("Failed to update trade request status. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCounterOffer = (requestId: string) => {
    setSelectedRequest(requestId);
    setShowCounterModal(true);
  };

  const submitCounterOffer = (message: string) => {
    if (!selectedRequest) return;

    // Status is always "countered" for counter offers
    const newStatus = "countered";

    handleStatusChange(selectedRequest, newStatus, message);
    setShowCounterModal(false);
  };

  // Redirect if not authenticated
  if (isLoaded && !user) {
    router.push("/");
    return null;
  }

  // Show loading state
  if (!isLoaded || (isLoading && tradeRequests.length === 0)) {
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

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-4">
            <p className="text-black/60 dark:text-white/60 text-sm mb-1">
              Pending
            </p>
            <p className="text-xl font-semibold">{stats.pending}</p>
          </div>
          <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-4">
            <p className="text-emerald-600 dark:text-emerald-500 text-sm mb-1">
              Accepted
            </p>
            <p className="text-xl font-semibold">{stats.accepted}</p>
          </div>
          <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-4">
            <p className="text-blue-600 dark:text-blue-500 text-sm mb-1">
              Completed
            </p>
            <p className="text-xl font-semibold">{stats.completed}</p>
          </div>
          <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-4">
            <p className="text-red-600 dark:text-red-500 text-sm mb-1">
              Rejected
            </p>
            <p className="text-xl font-semibold">{stats.rejected}</p>
          </div>
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

        {/* Error message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center">
            <RiAlertLine className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {/* No requests */}
        {filteredRequests.length === 0 && !isLoading && (
          <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-6 text-center">
            <p className="text-black/60 dark:text-white/60">
              {searchQuery
                ? "No trade requests found matching your search."
                : "You don't have any trade requests yet."}
            </p>
          </div>
        )}

        {/* Trade requests */}
        <div className="space-y-6">
          {filteredRequests.map((request: TradeRequest) => (
            <motion.div
              key={request._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-black/[.08] dark:border-white/[.08]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-black/[.02] dark:bg-white/[.02] flex items-center justify-center">
                      {request.type === "received" ? (
                        <img
                          src={
                            request.fromListing?.user?.profilePicture ||
                            "/placeholder-avatar.png"
                          }
                          alt={request.fromListing?.user?.name || "User"}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <img
                          src={
                            request.toListing?.user?.profilePicture ||
                            "/placeholder-avatar.png"
                          }
                          alt={request.toListing?.user?.name || "User"}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {request.type === "received"
                            ? request.fromListing?.user?.name || "Unknown User"
                            : request.toListing?.user?.name || "Unknown User"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-black/60 dark:text-white/60">
                        <RiTimeLine className="w-4 h-4" />
                        <span>
                          {new Date(request.updatedAt).toLocaleDateString()} at{" "}
                          {new Date(request.updatedAt).toLocaleTimeString()}
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
                      href={`/dashboard/messages/${request._id}`}
                      className="p-2 rounded-lg hover:bg-black/[.02] dark:hover:bg-white/[.02] text-black/60 dark:text-white/60 relative"
                    >
                      <RiMessage3Line className="w-5 h-5" />
                      {request.messages.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white text-xs font-medium rounded-full flex items-center justify-center">
                          {request.messages.length}
                        </span>
                      )}
                    </Link>
                  </div>
                </div>
              </div>

              {/* Trade Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                {/* Offering */}
                <div>
                  <div className="text-sm font-medium mb-2">
                    {request.type === "sent"
                      ? "You're Offering"
                      : "They're Offering"}
                  </div>
                  <div className="rounded-lg border border-black/[.08] dark:border-white/[.08] overflow-hidden">
                    {request.fromListing ? (
                      <>
                        <div className="aspect-video relative">
                          <img
                            src={
                              request.fromListing.images?.[0] ||
                              "/placeholder-image.png"
                            }
                            alt={request.fromListing.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-medium mb-2">
                            {request.fromListing.title}
                          </h3>
                          <p className="text-sm text-black/60 dark:text-white/60">
                            {request.fromListing.description.length > 100
                              ? `${request.fromListing.description.substring(
                                  0,
                                  100
                                )}...`
                              : request.fromListing.description}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="p-4 text-center text-black/40 dark:text-white/40">
                        {request.type === "received"
                          ? "No specific item offered"
                          : "You didn't select a specific item to offer"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Requesting */}
                <div>
                  <div className="text-sm font-medium mb-2">
                    {request.type === "sent"
                      ? "You're Requesting"
                      : "They're Requesting"}
                  </div>
                  <div className="rounded-lg border border-black/[.08] dark:border-white/[.08] overflow-hidden">
                    <div className="aspect-video relative">
                      <img
                        src={
                          request.toListing.images?.[0] ||
                          "/placeholder-image.png"
                        }
                        alt={request.toListing.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium mb-2">
                        {request.toListing.title}
                      </h3>
                      <p className="text-sm text-black/60 dark:text-white/60">
                        {request.toListing.description.length > 100
                          ? `${request.toListing.description.substring(
                              0,
                              100
                            )}...`
                          : request.toListing.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {request.status === "pending" && request.type === "received" && (
                <div className="p-6 border-t border-black/[.08] dark:border-white/[.08] flex items-center space-x-4">
                  <button
                    onClick={() => handleStatusChange(request._id, "accepted")}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors flex items-center"
                  >
                    <RiCheckLine className="w-5 h-5 mr-2" />
                    Accept Trade
                  </button>
                  <button
                    onClick={() => handleCounterOffer(request._id)}
                    className="px-4 py-2 rounded-lg border border-black/[.08] dark:border-white/[.08] hover:bg-black/[.02] dark:hover:bg-white/[.02] text-black/60 dark:text-white/60 text-sm font-medium transition-colors flex items-center"
                  >
                    <RiExchangeLine className="w-5 h-5 mr-2" />
                    Counter Offer
                  </button>
                  <button
                    onClick={() => handleStatusChange(request._id, "rejected")}
                    className="px-4 py-2 rounded-lg border border-black/[.08] dark:border-white/[.08] hover:bg-black/[.02] dark:hover:bg-white/[.02] text-red-600 text-sm font-medium transition-colors flex items-center"
                  >
                    <RiCloseLine className="w-5 h-5 mr-2" />
                    Reject
                  </button>
                </div>
              )}

              {request.status === "accepted" && (
                <div className="p-6 border-t border-black/[.08] dark:border-white/[.08]">
                  <button
                    onClick={() => handleStatusChange(request._id, "completed")}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors flex items-center"
                  >
                    <RiCheckLine className="w-5 h-5 mr-2" />
                    Mark as Completed
                  </button>
                </div>
              )}

              {/* Counter offer actions - only for the original sender when they received a counter */}
              {request.status === "countered" && request.type === "sent" && (
                <div className="p-6 border-t border-black/[.08] dark:border-white/[.08]">
                  {/* Show the counter message */}
                  {request.messages.length > 0 && (
                    <div className="mb-4 p-4 bg-black/[.02] dark:bg-white/[.02] rounded-lg">
                      <div className="font-medium mb-1">
                        Counter offer message:
                      </div>
                      <p className="text-black/70 dark:text-white/70">
                        {request.messages[request.messages.length - 1].content}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4">
                    {/* Check if the last message is from the current user - if so, only show counter button */}
                    {request.messages.length > 0 &&
                    request.messages[request.messages.length - 1].from ===
                      user?.id ? (
                      /* If the last message is from the current user, they're in the process of countering */
                      <button
                        onClick={() => handleCounterOffer(request._id)}
                        className="px-4 py-2 rounded-lg border border-black/[.08] dark:border-white/[.08] hover:bg-black/[.02] dark:hover:bg-white/[.02] text-black/60 dark:text-white/60 text-sm font-medium transition-colors flex items-center"
                      >
                        <RiExchangeLine className="w-5 h-5 mr-2" />
                        Counter Again
                      </button>
                    ) : (
                      /* Otherwise, show accept/reject/counter options */
                      <>
                        <button
                          onClick={() =>
                            handleStatusChange(request._id, "accepted")
                          }
                          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors flex items-center"
                        >
                          <RiCheckLine className="w-5 h-5 mr-2" />
                          Accept Counter
                        </button>
                        <button
                          onClick={() => handleCounterOffer(request._id)}
                          className="px-4 py-2 rounded-lg border border-black/[.08] dark:border-white/[.08] hover:bg-black/[.02] dark:hover:bg-white/[.02] text-black/60 dark:text-white/60 text-sm font-medium transition-colors flex items-center"
                        >
                          <RiExchangeLine className="w-5 h-5 mr-2" />
                          Counter Again
                        </button>
                        <button
                          onClick={() =>
                            handleStatusChange(request._id, "rejected")
                          }
                          className="px-4 py-2 rounded-lg border border-black/[.08] dark:border-white/[.08] hover:bg-black/[.02] dark:hover:bg-white/[.02] text-red-600 text-sm font-medium transition-colors flex items-center"
                        >
                          <RiCloseLine className="w-5 h-5 mr-2" />
                          Reject Counter
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Counter offer actions - for the receiver when they've gotten a counter back */}
              {request.status === "countered" &&
                request.type === "received" && (
                  <div className="p-6 border-t border-black/[.08] dark:border-white/[.08]">
                    {/* Show the counter message */}
                    {request.messages.length > 0 && (
                      <div className="mb-4 p-4 bg-black/[.02] dark:bg-white/[.02] rounded-lg">
                        <div className="font-medium mb-1">
                          Counter offer message:
                        </div>
                        <p className="text-black/70 dark:text-white/70">
                          {
                            request.messages[request.messages.length - 1]
                              .content
                          }
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4">
                      {/* Check if the last message is from the current user - if so, only show counter button */}
                      {request.messages.length > 0 &&
                      request.messages[request.messages.length - 1].from ===
                        user?.id ? (
                        /* If the last message is from the current user, they're in the process of countering */
                        <button
                          onClick={() => handleCounterOffer(request._id)}
                          className="px-4 py-2 rounded-lg border border-black/[.08] dark:border-white/[.08] hover:bg-black/[.02] dark:hover:bg-white/[.02] text-black/60 dark:text-white/60 text-sm font-medium transition-colors flex items-center"
                        >
                          <RiExchangeLine className="w-5 h-5 mr-2" />
                          Counter Again
                        </button>
                      ) : (
                        /* Otherwise, show accept/reject/counter options */
                        <>
                          <button
                            onClick={() =>
                              handleStatusChange(request._id, "accepted")
                            }
                            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors flex items-center"
                          >
                            <RiCheckLine className="w-5 h-5 mr-2" />
                            Accept Counter
                          </button>
                          <button
                            onClick={() => handleCounterOffer(request._id)}
                            className="px-4 py-2 rounded-lg border border-black/[.08] dark:border-white/[.08] hover:bg-black/[.02] dark:hover:bg-white/[.02] text-black/60 dark:text-white/60 text-sm font-medium transition-colors flex items-center"
                          >
                            <RiExchangeLine className="w-5 h-5 mr-2" />
                            Counter Again
                          </button>
                          <button
                            onClick={() =>
                              handleStatusChange(request._id, "rejected")
                            }
                            className="px-4 py-2 rounded-lg border border-black/[.08] dark:border-white/[.08] hover:bg-black/[.02] dark:hover:bg-white/[.02] text-red-600 text-sm font-medium transition-colors flex items-center"
                          >
                            <RiCloseLine className="w-5 h-5 mr-2" />
                            Reject Counter
                          </button>
                        </>
                      )}
                    </div>
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
