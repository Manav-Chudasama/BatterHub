import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/mongodb";
import Review from "@/models/Review";
import User from "@/models/User";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * OPTIONS /api/reviews/[reviewId]
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 204,
      headers: {
        ...corsHeaders,
        "Access-Control-Max-Age": "86400", // 24 hours
      },
    }
  );
}

/**
 * GET /api/reviews/[reviewId]
 * Get a specific review by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params;

    await connectToDatabase();

    const review = await Review.findById(reviewId)
      .populate("reviewer", "name profilePicture")
      .populate("reviewedUser", "name profilePicture");

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(review, { headers: corsHeaders });
  } catch (error) {
    console.error("Error fetching review:", error);
    return NextResponse.json(
      { error: "Failed to fetch review" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * PUT /api/reviews/[reviewId]
 * Update a specific review
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { userId } = getAuth(request);
    const { reviewId } = await params;

    // Check authentication
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    const clerkUserId = userId;
    const body = await request.json();

    await connectToDatabase();

    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if the user is the author of the review
    if (review.reviewerId !== clerkUserId) {
      return NextResponse.json(
        { error: "You can only update your own reviews" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Check if required fields are provided
    if (body.rating !== undefined && (body.rating < 1 || body.rating > 5)) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Update the review
    const updatedFields: { rating?: number; comment?: string } = {};

    if (body.rating !== undefined) {
      updatedFields.rating = body.rating;
    }

    if (body.comment !== undefined) {
      updatedFields.comment = body.comment;
    }

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { $set: updatedFields },
      { new: true }
    )
      .populate("reviewer", "name profilePicture")
      .populate("reviewedUser", "name profilePicture");

    // Update the user's reputation score if rating was changed
    if (body.rating !== undefined) {
      const reviewedUser = await User.findOne({
        userId: review.reviewedUserId,
      });
      if (reviewedUser) {
        const userReviews = await Review.find({
          reviewedUserId: review.reviewedUserId,
        });
        const totalRating = userReviews.reduce(
          (sum, review) => sum + review.rating,
          0
        );
        const averageRating = totalRating / userReviews.length;

        reviewedUser.reputationScore = parseFloat(averageRating.toFixed(1));
        await reviewedUser.save();
      }
    }

    return NextResponse.json(
      {
        message: "Review updated successfully",
        review: updatedReview,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * DELETE /api/reviews/[reviewId]
 * Delete a specific review
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { userId } = getAuth(request);
    const { reviewId } = await params;

    // Check authentication
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    const clerkUserId = userId;

    await connectToDatabase();

    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if the user is the author of the review
    if (review.reviewerId !== clerkUserId) {
      return NextResponse.json(
        { error: "You can only delete your own reviews" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Delete the review
    await Review.findByIdAndDelete(reviewId);

    // Update the user's reputation score
    const reviewedUser = await User.findOne({ userId: review.reviewedUserId });
    if (reviewedUser) {
      const userReviews = await Review.find({
        reviewedUserId: review.reviewedUserId,
      });

      if (userReviews.length > 0) {
        const totalRating = userReviews.reduce(
          (sum, review) => sum + review.rating,
          0
        );
        const averageRating = totalRating / userReviews.length;
        reviewedUser.reputationScore = parseFloat(averageRating.toFixed(1));
      } else {
        // If no reviews, reset reputation score
        reviewedUser.reputationScore = 0;
      }

      await reviewedUser.save();
    }

    return NextResponse.json(
      { message: "Review deleted successfully" },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500, headers: corsHeaders }
    );
  }
}
