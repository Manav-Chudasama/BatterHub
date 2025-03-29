"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaStar } from "react-icons/fa";

interface ReviewFormProps {
  tradeRequestId: string;
  reviewedUserId: string;
  reviewedUserName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  existingReview?: {
    _id: string;
    rating: number;
    comment: string;
  };
}

export default function ReviewForm({
  tradeRequestId,
  reviewedUserId,
  reviewedUserName,
  onSuccess,
  onCancel,
  existingReview,
}: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!existingReview;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    if (comment.trim() === "") {
      setError("Please provide a comment");
      return;
    }

    setIsSubmitting(true);

    try {
      const reviewData = {
        tradeRequestId,
        reviewedUserId,
        rating,
        comment,
      };

      const url = isEditing
        ? `/api/reviews/${existingReview._id}`
        : "/api/reviews";

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      // Refresh data
      router.refresh();

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-6 mb-6">
      <h3 className="text-lg font-medium mb-4">
        {isEditing
          ? "Edit Your Review"
          : `Rate Your Experience with ${reviewedUserName}`}
      </h3>

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <p className="text-sm text-black/60 dark:text-white/60 mb-2">
            Rating
          </p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="text-2xl focus:outline-none transition-colors duration-200"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                <FaStar
                  className={
                    (hoverRating || rating) >= star
                      ? "text-yellow-400"
                      : "text-gray-300 dark:text-gray-600"
                  }
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-black/60 dark:text-white/60">
              {rating > 0 ? `${rating} star${rating !== 1 ? "s" : ""}` : ""}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <label
            htmlFor="comment"
            className="block text-sm text-black/60 dark:text-white/60 mb-2"
          >
            Your Review
          </label>
          <textarea
            id="comment"
            className="w-full px-3 py-2 bg-transparent border border-black/[.08] dark:border-white/[.08] rounded-lg focus:outline-none focus:border-emerald-500 transition-colors"
            rows={4}
            placeholder="Share your experience with this trade..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
          ></textarea>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-solid border-black/[.08] dark:border-white/[.08] transition-colors flex items-center justify-center hover:bg-black/[.02] dark:hover:bg-white/[.02] text-sm h-10 px-4 font-medium"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="rounded-lg border border-solid border-transparent transition-colors flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-sm h-10 px-4 font-medium disabled:bg-emerald-600/50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Submitting...
              </>
            ) : isEditing ? (
              "Update Review"
            ) : (
              "Submit Review"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
