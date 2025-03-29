import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/mongodb";
import Review from "@/models/Review";
import User from "@/models/User";
import TradeRequest from "@/models/TradeRequest";
import { Types } from "mongoose";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * OPTIONS /api/reviews
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
 * GET /api/reviews
 * Get reviews with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Filters
    const tradeRequestId = searchParams.get("tradeRequestId");
    const reviewerId = searchParams.get("reviewerId");
    const reviewedUserId = searchParams.get("reviewedUserId");
    const rating = searchParams.get("rating");

    await connectToDatabase();

    // Build query
    const filter: {
      tradeRequestId?: Types.ObjectId;
      reviewerId?: string;
      reviewedUserId?: string;
      rating?: number;
    } = {};

    if (tradeRequestId) {
      filter.tradeRequestId = new Types.ObjectId(tradeRequestId);
    }

    if (reviewerId) {
      filter.reviewerId = reviewerId;
    }

    if (reviewedUserId) {
      filter.reviewedUserId = reviewedUserId;
    }

    if (rating) {
      filter.rating = parseInt(rating);
    }

    // Count total for pagination
    const total = await Review.countDocuments(filter);

    // Get reviews
    const reviews = await Review.find(filter)
      .populate("reviewer", "name profilePicture")
      .populate("reviewedUser", "name profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json(
      {
        reviews,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * POST /api/reviews
 * Create a new review
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);

    // Check authentication
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    const clerkUserId = userId;
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      "tradeRequestId",
      "reviewedUserId",
      "rating",
      "comment",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // Validate rating is between 1 and 5
    if (body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectToDatabase();

    // Find the trade request
    const tradeRequest = await TradeRequest.findById(body.tradeRequestId);
    if (!tradeRequest) {
      return NextResponse.json(
        { error: "Trade request not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Verify that the trade is completed
    if (tradeRequest.status !== "completed") {
      return NextResponse.json(
        { error: "Cannot review a trade that is not completed" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify that the user is part of the trade
    if (
      tradeRequest.fromUserId !== clerkUserId &&
      tradeRequest.toUserId !== clerkUserId
    ) {
      return NextResponse.json(
        { error: "You can only review trades you were part of" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Verify the user is reviewing the other party in the trade
    if (
      body.reviewedUserId !== tradeRequest.fromUserId &&
      body.reviewedUserId !== tradeRequest.toUserId
    ) {
      return NextResponse.json(
        { error: "You can only review users who were part of the trade" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if reviewer already submitted a review for this trade
    const existingReview = await Review.findOne({
      tradeRequestId: body.tradeRequestId,
      reviewerId: clerkUserId,
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already submitted a review for this trade" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Find both users in our database
    const reviewer = await User.findOne({ userId: clerkUserId });
    const reviewedUser = await User.findOne({ userId: body.reviewedUserId });

    if (!reviewer || !reviewedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Create review object
    const reviewData = {
      tradeRequestId: body.tradeRequestId,
      reviewerId: clerkUserId,
      reviewer: reviewer._id,
      reviewedUserId: body.reviewedUserId,
      reviewedUser: reviewedUser._id,
      rating: body.rating,
      comment: body.comment,
    };

    // Create and save the review
    const review = new Review(reviewData);
    await review.save();

    // Update the user's reputation score (simple average of all ratings)
    const userReviews = await Review.find({
      reviewedUserId: body.reviewedUserId,
    });
    const totalRating = userReviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );
    const averageRating = totalRating / userReviews.length;

    reviewedUser.reputationScore = parseFloat(averageRating.toFixed(1));
    await reviewedUser.save();

    return NextResponse.json(
      {
        message: "Review created successfully",
        review,
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500, headers: corsHeaders }
    );
  }
}
