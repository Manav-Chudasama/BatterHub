"use client";

import { useState } from "react";
import Image from "next/image";
import { FaStar, FaEdit, FaTrash } from "react-icons/fa";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import ReviewForm from "./ReviewForm";

interface ReviewUser {
  _id: string;
  name: string;
  profilePicture?: string;
}

interface Review {
  _id: string;
  tradeRequestId: string;
  reviewerId: string;
  reviewer: ReviewUser;
  reviewedUserId: string;
  reviewedUser: ReviewUser;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

interface ReviewsListProps {
  reviews: Review[];
  showReviewedUser?: boolean;
  onReviewDeleted?: () => void;
}

export default function ReviewsList({
  reviews,
  showReviewedUser = false,
  onReviewDeleted,
}: ReviewsListProps) {
  const { userId } = useAuth();
  const router = useRouter();
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-black/60 dark:text-white/60">
        <p>No reviews yet.</p>
      </div>
    );
  }

  const handleEditSuccess = () => {
    setEditingReviewId(null);
    router.refresh();
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      setIsDeleting(true);
      setError("");

      try {
        const response = await fetch(`/api/reviews/${reviewId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to delete review");
        }

        router.refresh();
        if (onReviewDeleted) {
          onReviewDeleted();
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.";
        setError(errorMessage);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {reviews.map((review) => {
        const isCurrentUserReview = review.reviewerId === userId;
        const displayUser = showReviewedUser
          ? review.reviewedUser
          : review.reviewer;

        if (editingReviewId === review._id) {
          return (
            <ReviewForm
              key={review._id}
              tradeRequestId={review.tradeRequestId}
              reviewedUserId={review.reviewedUserId}
              reviewedUserName={review.reviewedUser.name}
              existingReview={{
                _id: review._id,
                rating: review.rating,
                comment: review.comment,
              }}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditingReviewId(null)}
            />
          );
        }

        return (
          <div
            key={review._id}
            className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-6"
          >
            <div className="flex justify-between">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative h-10 w-10 rounded-full overflow-hidden bg-emerald-100 dark:bg-emerald-900/20">
                  {displayUser.profilePicture ? (
                    <Image
                      src={displayUser.profilePicture}
                      alt={displayUser.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-medium">
                      {displayUser.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-medium">{displayUser.name}</h4>
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar
                          key={star}
                          className={
                            star <= review.rating
                              ? "text-yellow-400"
                              : "text-gray-300 dark:text-gray-600"
                          }
                          size={14}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-black/60 dark:text-white/60 ml-1">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {isCurrentUserReview && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingReviewId(review._id)}
                    className="p-1.5 text-black/60 dark:text-white/60 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-full"
                  >
                    <FaEdit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteReview(review._id)}
                    className="p-1.5 text-black/60 dark:text-white/60 hover:text-red-600 dark:hover:text-red-400 rounded-full"
                    disabled={isDeleting}
                  >
                    <FaTrash size={16} />
                  </button>
                </div>
              )}
            </div>

            <p className="text-black/80 dark:text-white/80 text-sm">
              {review.comment}
            </p>
          </div>
        );
      })}
    </div>
  );
}
