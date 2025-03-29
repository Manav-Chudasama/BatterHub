"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import {
  RiSearchLine,
  RiTimeLine,
  RiMessage3Line,
  RiCheckLine,
  RiCloseLine,
  RiExchangeLine,
  RiStarLine,
  RiEditLine,
  RiThumbUpLine,
  RiImageLine,
} from "react-icons/ri";
import ReviewModal from "@/components/reviews/ReviewModal";

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
  reviewed?: boolean;
  otherReviewed?: boolean;
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
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTradeId, setReviewTradeId] = useState<string>("");
  const [reviewedUserId, setReviewedUserId] = useState<string>("");
  const [reviewedUserName, setReviewedUserName] = useState<string>("");
  const [existingReview, setExistingReview] = useState<
    | {
        _id: string;
        rating: number;
        comment: string;
      }
    | undefined
  >();

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

      // Map server response to expected format and fetch review status
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
            user: User;
          } | null;
          toListing: {
            _id: string;
            title: string;
            description: string;
            images: string[];
            user: User;
          };
          messages: {
            from: string;
            content: string;
            timestamp: string;
          }[];
        }): TradeRequest => {
          // Determine type based on current user
          const type = request.fromUserId === user?.id ? "sent" : "received";

          return {
            ...request,
            type,
            reviewed: false, // Will be updated later
            otherReviewed: false, // Will be updated later
          };
        }
      );

      // Update stats
      const newStats = {
        sent: mappedRequests.filter((req: TradeRequest) => req.type === "sent")
          .length,
        received: mappedRequests.filter(
          (req: TradeRequest) => req.type === "received"
        ).length,
        pending: mappedRequests.filter(
          (req: TradeRequest) => req.status === "pending"
        ).length,
        accepted: mappedRequests.filter(
          (req: TradeRequest) => req.status === "accepted"
        ).length,
        rejected: mappedRequests.filter(
          (req: TradeRequest) => req.status === "rejected"
        ).length,
        completed: mappedRequests.filter(
          (req: TradeRequest) => req.status === "completed"
        ).length,
        countered: mappedRequests.filter(
          (req: TradeRequest) => req.status === "countered"
        ).length,
      };

      setTradeRequests(mappedRequests);
      setStats(newStats);

      // Check for completed trades and fetch reviews
      const completedTradeIds = mappedRequests
        .filter((req: TradeRequest) => req.status === "completed")
        .map((req: TradeRequest) => req._id);

      if (completedTradeIds.length > 0) {
        checkReviewStatus(completedTradeIds, mappedRequests);
      }
    } catch (error) {
      console.error("Error fetching trade requests:", error);
      setError("Failed to load trade requests");
    } finally {
      setIsLoading(false);
    }
  };

  // Add function to check review status
  const checkReviewStatus = async (
    tradeIds: string[],
    requests: TradeRequest[]
  ) => {
    if (!user?.id) return;

    try {
      // For each trade ID, check if the current user has already reviewed it
      const reviewPromises = tradeIds.map((tradeId) =>
        fetch(`/api/reviews?tradeRequestId=${tradeId}&reviewerId=${user.id}`)
          .then((res) => res.json())
          .then((data) => ({ tradeId, reviews: data.reviews }))
      );

      const results = await Promise.all(reviewPromises);

      // Update the trades with review information
      const updatedRequests = [...requests];

      results.forEach(({ tradeId, reviews }) => {
        const tradeIndex = updatedRequests.findIndex(
          (req) => req._id === tradeId
        );
        if (tradeIndex !== -1) {
          // If this user has reviewed, set reviewed to true
          updatedRequests[tradeIndex].reviewed = reviews.length > 0;
        }
      });

      // Also fetch reviews from other parties
      const otherPartyReviewPromises = tradeIds.map((tradeId) => {
        const trade = requests.find((req) => req._id === tradeId);
        if (!trade) return Promise.resolve({ tradeId, reviews: [] });

        const otherUserId =
          trade.type === "sent" ? trade.toUserId : trade.fromUserId;
        return fetch(
          `/api/reviews?tradeRequestId=${tradeId}&reviewerId=${otherUserId}`
        )
          .then((res) => res.json())
          .then((data) => ({ tradeId, reviews: data.reviews }));
      });

      const otherResults = await Promise.all(otherPartyReviewPromises);

      otherResults.forEach(({ tradeId, reviews }) => {
        const tradeIndex = updatedRequests.findIndex(
          (req) => req._id === tradeId
        );
        if (tradeIndex !== -1) {
          updatedRequests[tradeIndex].otherReviewed = reviews.length > 0;
        }
      });

      setTradeRequests(updatedRequests);
    } catch (error) {
      console.error("Error checking review status:", error);
    }
  };

  // Add function to handle opening the review modal
  const handleReviewClick = async (request: TradeRequest) => {
    if (!user?.id) return;

    // Determine which user to review (the other party)
    const reviewedUserId =
      request.type === "sent" ? request.toUserId : request.fromUserId;
    const otherUserName =
      request.type === "sent"
        ? request.toListing.user.name
        : request.fromListing?.user.name || "User";

    setReviewTradeId(request._id);
    setReviewedUserId(reviewedUserId);
    setReviewedUserName(otherUserName);

    // Check if there's an existing review
    try {
      const response = await fetch(
        `/api/reviews?tradeRequestId=${request._id}&reviewerId=${user.id}`
      );
      const data = await response.json();

      if (data.reviews && data.reviews.length > 0) {
        const review = data.reviews[0];
        setExistingReview({
          _id: review._id,
          rating: review.rating,
          comment: review.comment,
        });
      } else {
        setExistingReview(undefined);
      }

      setShowReviewModal(true);
    } catch (error) {
      console.error("Error checking for existing review:", error);
    }
  };

  // Filter trade requests based on search query
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

      const chatResponse = await fetch(
        `/api/trade-requests/${requestId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
            message: message || undefined,
          }),
        }
      );

      if (!response.ok || !chatResponse.ok) {
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-8"
      >
        <div className="mb-4 flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Trade Requests</h1>
            <p className="text-black/60 dark:text-white/60">
              Manage your incoming and outgoing trade requests
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black/40 dark:text-white/40" />
              <input
                type="text"
                placeholder="Search by title or user"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-black/[.08] dark:border-white/[.08] rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-transparent w-52"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as "all" | "sent" | "received")
              }
              className="px-4 py-2 border border-black/[.08] dark:border-white/[.08] rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-transparent"
            >
              <option value="all">All Requests</option>
              <option value="sent">Sent</option>
              <option value="received">Received</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as TradeStatus | "all")
              }
              className="px-4 py-2 border border-black/[.08] dark:border-white/[.08] rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
              <option value="countered">Countered</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white dark:bg-black p-4 rounded-lg border border-black/[.08] dark:border-white/[.08]">
            <div className="text-xl font-semibold">
              {stats.sent + stats.received}
            </div>
            <div className="text-black/60 dark:text-white/60">Total</div>
          </div>
          <div className="bg-white dark:bg-black p-4 rounded-lg border border-black/[.08] dark:border-white/[.08]">
            <div className="text-xl font-semibold">{stats.pending}</div>
            <div className="text-black/60 dark:text-white/60 flex items-center">
              <RiTimeLine className="mr-1" />
              Pending
            </div>
          </div>
          <div className="bg-white dark:bg-black p-4 rounded-lg border border-black/[.08] dark:border-white/[.08]">
            <div className="text-xl font-semibold">{stats.accepted}</div>
            <div className="text-black/60 dark:text-white/60 flex items-center">
              <RiCheckLine className="mr-1" />
              Accepted
            </div>
          </div>
          <div className="bg-white dark:bg-black p-4 rounded-lg border border-black/[.08] dark:border-white/[.08]">
            <div className="text-xl font-semibold">{stats.completed}</div>
            <div className="text-black/60 dark:text-white/60 flex items-center">
              <RiThumbUpLine className="mr-1" />
              Completed
            </div>
          </div>
          <div className="bg-white dark:bg-black p-4 rounded-lg border border-black/[.08] dark:border-white/[.08]">
            <div className="text-xl font-semibold">{stats.rejected}</div>
            <div className="text-black/60 dark:text-white/60 flex items-center">
              <RiCloseLine className="mr-1" />
              Rejected
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-4">
            {error}
          </div>
        ) : tradeRequests.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08]">
            <div className="text-6xl text-black/20 dark:text-white/20 mb-4">
              <RiExchangeLine className="inline-block" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              No trade requests found
            </h3>
            <p className="text-black/60 dark:text-white/60 max-w-md mx-auto mb-6">
              {statusFilter !== "all" || typeFilter !== "all"
                ? "Try changing your filters to see more requests."
                : "Start browsing listings and send a trade request to begin trading with other users."}
            </p>
            <Link
              href="/dashboard/listings"
              className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
            >
              Browse Listings
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {tradeRequests
              .filter((req) => {
                // Filter based on search query
                if (!searchQuery) return true;
                const searchLower = searchQuery.toLowerCase();

                const toListing = req.toListing?.title.toLowerCase() || "";
                const fromListing = req.fromListing?.title.toLowerCase() || "";
                const toUser = req.toListing?.user.name.toLowerCase() || "";
                const fromUser = req.fromListing?.user.name.toLowerCase() || "";

                return (
                  toListing.includes(searchLower) ||
                  fromListing.includes(searchLower) ||
                  toUser.includes(searchLower) ||
                  fromUser.includes(searchLower)
                );
              })
              .map((request) => {
                // Determine other user name based on trade direction
                const otherUserName =
                  request.type === "sent"
                    ? request.toListing.user.name
                    : request.fromListing?.user.name || "Unknown";

                return (
                  <div
                    key={request._id}
                    className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] overflow-hidden"
                  >
                    <div className="p-4 flex flex-col sm:flex-row justify-between gap-4">
                      {/* Trade request header and info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-2 py-0.5 text-xs rounded ${
                              request.type === "sent"
                                ? "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                : "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                            }`}
                          >
                            {request.type === "sent" ? "Sent" : "Received"}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-xs rounded ${
                              request.status === "pending"
                                ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400"
                                : request.status === "accepted"
                                ? "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                                : request.status === "rejected"
                                ? "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                                : request.status === "completed"
                                ? "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                                : "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                            }`}
                          >
                            {request.status.charAt(0).toUpperCase() +
                              request.status.slice(1)}
                          </span>
                          {request.status === "completed" && (
                            <>
                              {request.reviewed ? (
                                <span className="px-2 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                  Reviewed
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-xs rounded bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                                  Not Reviewed
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        <h3 className="text-lg font-semibold mb-1">
                          Trade with {otherUserName}
                        </h3>

                        <p className="text-black/60 dark:text-white/60 text-sm mb-2">
                          {new Date(request.createdAt).toLocaleDateString(
                            undefined,
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </p>

                        <div className="grid sm:grid-cols-2 gap-4 mb-4">
                          <div className="bg-black/[.02] dark:bg-white/[.02] p-3 rounded-lg">
                            <div className="font-medium mb-1">
                              You{" "}
                              {request.type === "sent" ? "offer" : "receive"}
                            </div>
                            <div>
                              {request.type === "sent"
                                ? request.fromListing?.title || "Cash offer"
                                : request.toListing.title}
                            </div>
                            {/* Listing image for your offer/receive */}
                            <div className="mt-2 relative w-full rounded-md bg-black/[.02] dark:bg-white/[.02] flex items-center justify-center">
                              {request.type === "sent" &&
                              request.fromListing &&
                              request.fromListing.images &&
                              request.fromListing.images.length > 0 ? (
                                <div className="relative w-full pt-[75%]">
                                  <Image
                                    src={request.fromListing.images[0]}
                                    alt={request.fromListing.title}
                                    fill
                                    sizes="(max-width: 640px) 100vw, 50vw"
                                    className="object-contain absolute inset-0"
                                  />
                                </div>
                              ) : request.type === "received" &&
                                request.toListing.images &&
                                request.toListing.images.length > 0 ? (
                                <div className="relative w-full pt-[75%]">
                                  <Image
                                    src={request.toListing.images[0]}
                                    alt={request.toListing.title}
                                    fill
                                    sizes="(max-width: 640px) 100vw, 50vw"
                                    className="object-contain absolute inset-0"
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center justify-center py-10">
                                  <RiImageLine className="h-10 w-10 text-black/30 dark:text-white/30" />
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="bg-black/[.02] dark:bg-white/[.02] p-3 rounded-lg">
                            <div className="font-medium mb-1">
                              You{" "}
                              {request.type === "sent" ? "receive" : "offer"}
                            </div>
                            <div>
                              {request.type === "sent"
                                ? request.toListing.title
                                : request.fromListing?.title || "Cash offer"}
                            </div>
                            {/* Listing image for what you receive/offer */}
                            <div className="mt-2 relative w-full rounded-md bg-black/[.02] dark:bg-white/[.02] flex items-center justify-center">
                              {request.type === "sent" &&
                              request.toListing.images &&
                              request.toListing.images.length > 0 ? (
                                <div className="relative w-full pt-[75%]">
                                  <Image
                                    src={request.toListing.images[0]}
                                    alt={request.toListing.title}
                                    fill
                                    sizes="(max-width: 640px) 100vw, 50vw"
                                    className="object-contain absolute inset-0"
                                  />
                                </div>
                              ) : request.type === "received" &&
                                request.fromListing &&
                                request.fromListing.images &&
                                request.fromListing.images.length > 0 ? (
                                <div className="relative w-full pt-[75%]">
                                  <Image
                                    src={request.fromListing.images[0]}
                                    alt={request.fromListing.title}
                                    fill
                                    sizes="(max-width: 640px) 100vw, 50vw"
                                    className="object-contain absolute inset-0"
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center justify-center py-10">
                                  <RiImageLine className="h-10 w-10 text-black/30 dark:text-white/30" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {request.messages.length > 0 && (
                          <div className="mb-4">
                            <div className="font-medium mb-2">
                              Latest Message
                            </div>
                            <div className="bg-black/[.02] dark:bg-white/[.02] p-3 rounded-lg text-sm">
                              <div className="font-medium mb-1">
                                {request.messages[request.messages.length - 1]
                                  .from === user?.id
                                  ? "You"
                                  : otherUserName}
                              </div>
                              <p>
                                {
                                  request.messages[request.messages.length - 1]
                                    .content
                                }
                              </p>
                              <div className="text-black/40 dark:text-white/40 text-xs mt-1">
                                {new Date(
                                  request.messages[
                                    request.messages.length - 1
                                  ].timestamp
                                ).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Display review button for completed trades */}
                        {request.status === "completed" && (
                          <div className="mt-4">
                            {!request.reviewed ? (
                              <button
                                onClick={() => handleReviewClick(request)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg text-sm"
                              >
                                <RiStarLine />
                                Leave a Review
                              </button>
                            ) : (
                              <button
                                onClick={() => handleReviewClick(request)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm"
                              >
                                <RiEditLine />
                                Edit Your Review
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="sm:w-48 flex flex-row sm:flex-col gap-2 justify-end">
                        {/* Status-dependent action buttons */}
                        {request.status === "pending" &&
                          request.type === "received" && (
                            <>
                              <button
                                onClick={() =>
                                  handleStatusChange(request._id, "accepted")
                                }
                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm justify-center"
                              >
                                <RiCheckLine />
                                Accept
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRequest(request._id);
                                  setShowCounterModal(true);
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-lg text-sm justify-center"
                              >
                                <RiExchangeLine />
                                Counter
                              </button>
                              <button
                                onClick={() =>
                                  handleStatusChange(request._id, "rejected")
                                }
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm justify-center"
                              >
                                <RiCloseLine />
                                Decline
                              </button>
                            </>
                          )}

                        {request.status === "accepted" && (
                          <button
                            onClick={() =>
                              handleStatusChange(request._id, "completed")
                            }
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm justify-center"
                          >
                            <RiCheckLine />
                            Mark Completed
                          </button>
                        )}

                        <Link
                          href={`/dashboard/messages?trade=${request._id}`}
                          className="flex items-center gap-1 px-3 py-1.5 bg-black/[.05] hover:bg-black/[.08] dark:bg-white/[.05] dark:hover:bg-white/[.08] rounded-lg text-sm justify-center"
                        >
                          <RiMessage3Line />
                          Messages
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <CounterOfferModal
        isOpen={showCounterModal}
        onClose={() => setShowCounterModal(false)}
        onSubmit={submitCounterOffer}
      />

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        tradeRequestId={reviewTradeId}
        reviewedUserId={reviewedUserId}
        reviewedUserName={reviewedUserName}
        existingReview={existingReview}
      />
    </DashboardLayout>
  );
}
