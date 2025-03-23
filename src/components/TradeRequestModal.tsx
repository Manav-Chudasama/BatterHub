import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  RiCloseLine,
  RiExchangeLine,
  RiSendPlaneFill,
  RiLoader4Line,
  RiErrorWarningLine,
} from "react-icons/ri";
import { useUser } from "@clerk/nextjs";

interface Listing {
  _id: string;
  title: string;
  images: string[];
  description: string;
  status: string;
}

interface TradeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
}

const TradeRequestModal: React.FC<TradeRequestModalProps> = ({
  isOpen,
  onClose,
  listingId,
  listingTitle,
}) => {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<string>("");
  const [loadingListings, setLoadingListings] = useState(false);
  const [error, setError] = useState("");
  const { user } = useUser();

  useEffect(() => {
    // Reset form when modal is opened
    if (isOpen) {
      setMessage("");
      setSelectedListing("");
      setError("");
      fetchUserListings();
    }
  }, [isOpen]);

  const fetchUserListings = async () => {
    if (!user) return;

    setLoadingListings(true);
    try {
      const response = await fetch(
        `/api/listings/user/${user.id}?status=active`
      );
      if (!response.ok) throw new Error("Failed to fetch your listings");

      const data = await response.json();

      // Filter out the current listing if it's in the results
      const filteredListings = data.listings.filter(
        (listing: Listing) => listing._id !== listingId
      );

      setUserListings(filteredListings);

      // If no listings are available, show an error
      if (filteredListings.length === 0) {
        setError(
          "You need at least one active listing to make a trade request."
        );
      }
    } catch (error) {
      console.error("Error fetching user listings:", error);
      setError("Could not load your listings. Please try again later.");
    } finally {
      setLoadingListings(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate required fields
    if (!selectedListing) {
      setError("Please select a listing to offer for trade");
      return;
    }

    if (loading) return;

    setLoading(true);
    try {
      const response = await fetch("/api/trade-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listingId,
          message: message || "I'd like to trade for this item.",
          offeringListingId: selectedListing,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send trade request");
      }

      alert("Trade request sent successfully!");
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to send trade request");
      }
      console.error("Error sending trade request:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-black rounded-lg p-6 max-w-md w-full"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold flex items-center">
            <RiExchangeLine className="w-5 h-5 text-emerald-600 mr-2" />
            Send Trade Request
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/[.05] dark:hover:bg-white/[.05] text-black/70 dark:text-white/70"
          >
            <RiCloseLine className="w-5 h-5" />
          </button>
        </div>

        <p className="mb-4 text-black/60 dark:text-white/60">
          You&apos;re requesting to trade for:{" "}
          <span className="font-semibold text-black dark:text-white">
            {listingTitle}
          </span>
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg flex items-start">
            <RiErrorWarningLine className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="offering"
              className="block mb-2 text-sm font-medium text-black/70 dark:text-white/70 flex items-center"
            >
              What are you offering in return?
              <span className="ml-1 text-red-500">*</span>
            </label>
            {loadingListings ? (
              <div className="w-full p-3 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black text-black/40 dark:text-white/40 flex items-center justify-center">
                <RiLoader4Line className="w-5 h-5 mr-2 animate-spin" />
                Loading your listings...
              </div>
            ) : userListings.length > 0 ? (
              <div className="mb-2 relative">
                <select
                  id="offering"
                  value={selectedListing}
                  onChange={(e) => setSelectedListing(e.target.value)}
                  className={`w-full p-3 rounded-lg border ${
                    error && !selectedListing
                      ? "border-red-500 dark:border-red-500"
                      : "border-black/[.08] dark:border-white/[.08]"
                  } bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none`}
                  required
                >
                  <option value="">Select a listing</option>
                  {userListings.map((listing) => (
                    <option key={listing._id} value={listing._id}>
                      {listing.title}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-sm text-black/60 dark:text-white/60 mb-2">
                You don&apos;t have any active listings to offer.
              </p>
            )}
            <p className="text-xs text-black/40 dark:text-white/40 mb-4">
              You must select one of your listings to offer in exchange for this
              item.
            </p>
          </div>

          <div className="mb-4">
            <label
              htmlFor="message"
              className="block mb-2 text-sm font-medium text-black/70 dark:text-white/70"
            >
              Message to Listing Owner (Optional)
            </label>
            <textarea
              id="message"
              rows={4}
              placeholder="Introduce yourself and let the owner know why you're interested in this item..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-black/[.08] dark:border-white/[.08] text-black/60 dark:text-white/60 hover:bg-black/[.02] dark:hover:bg-white/[.02]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || userListings.length === 0}
              className="px-4 py-2 rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 flex items-center disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <RiLoader4Line className="w-5 h-5 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RiSendPlaneFill className="w-5 h-5 mr-2" />
                  Send Request
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default TradeRequestModal;
