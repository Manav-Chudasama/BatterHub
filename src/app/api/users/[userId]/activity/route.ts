import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import TradeRequest from "@/models/TradeRequest";
import Review from "@/models/Review";
import mongoose from "mongoose";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Type definitions
interface UserProfile {
  _id: mongoose.Types.ObjectId;
  name: string;
  profilePicture?: string;
}

interface ListingItem {
  title: string;
}

/**
 * OPTIONS /api/users/[userId]/activity
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

// Function to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }
}

/**
 * GET /api/users/[userId]/activity
 * Get recent activity for a user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const auth = getAuth(request);

    // Ensure that the authenticated user is requesting their own activity
    if (auth.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    await connectToDatabase();

    // Find the user
    const user = await User.findOne({ userId }).select("_id");

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Get user ID as string for comparison
    const userIdString = String(user._id);

    // Get recent trade requests
    const recentTradeRequests = await TradeRequest.find({
      $or: [{ fromUser: user._id }, { toUser: user._id }],
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate({
        path: "fromUser",
        select: "name profilePicture",
      })
      .populate({
        path: "toUser",
        select: "name profilePicture",
      })
      .populate({
        path: "fromListing",
        select: "title",
      })
      .populate({
        path: "toListing",
        select: "title",
      })
      .lean();

    // Get recent reviews
    const recentReviews = await Review.find({
      $or: [{ reviewerId: user._id }, { reviewedUserId: user._id }],
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({
        path: "reviewer",
        select: "name profilePicture",
      })
      .populate({
        path: "reviewedUser",
        select: "name profilePicture",
      })
      .lean();

    // Combine and format the activity items
    const activities = [];

    // Process trade requests
    for (const tradeRequest of recentTradeRequests) {
      // Skip invalid entries
      if (!tradeRequest || !tradeRequest._id) continue;

      // Type safety check
      const toUser = tradeRequest.toUser as unknown as UserProfile;
      const fromUser = tradeRequest.fromUser as unknown as UserProfile;
      const toListing = tradeRequest.toListing as unknown as ListingItem;
      const fromListing = tradeRequest.fromListing as unknown as ListingItem;

      if (
        !toUser?._id ||
        !toUser?.name ||
        !fromUser?._id ||
        !fromUser?.name ||
        !toListing?.title
      ) {
        continue;
      }

      const isIncoming = String(toUser._id) === userIdString;
      const otherUser = isIncoming ? fromUser : toUser;
      const targetListing = isIncoming ? toListing : fromListing;

      if (!targetListing?.title) continue;

      let type = "";
      let action = "";
      let status = "";

      if (tradeRequest.status === "pending") {
        type = "trade_request";
        action = isIncoming
          ? "requested to trade for your"
          : "your request for";
        status = "pending";
      } else if (tradeRequest.status === "accepted") {
        type = "trade_request";
        action = isIncoming ? "accepted your trade for" : "trade accepted for";
        status = "accepted";
      } else if (tradeRequest.status === "completed") {
        type = "trade_completed";
        action = "completed trade for";
        status = "completed";
      } else if (tradeRequest.status === "rejected") {
        type = "trade_request";
        action = isIncoming ? "declined your trade for" : "trade declined for";
        status = "rejected";
      }

      if (type) {
        activities.push({
          id: String(tradeRequest._id),
          type,
          user: {
            name: otherUser.name,
            profilePicture: otherUser.profilePicture,
          },
          action,
          item: targetListing.title,
          itemId: String(tradeRequest._id),
          time: formatRelativeTime(new Date(tradeRequest.createdAt as Date)),
          status,
        });
      }
    }

    // Process reviews
    for (const review of recentReviews) {
      // Skip invalid entries
      if (!review || !review._id || !review.tradeRequestId) continue;

      // Type safety check
      const reviewer = review.reviewer as unknown as UserProfile;
      const reviewedUser = review.reviewedUser as unknown as UserProfile;

      if (!reviewer?.name || !reviewedUser?.name) {
        continue;
      }

      const isReceived = String(review.reviewedUserId) === userIdString;

      activities.push({
        id: String(review._id),
        type: "new_review",
        user: {
          name: reviewer.name,
          profilePicture: reviewer.profilePicture,
        },
        action: isReceived ? "left a review for" : "you reviewed",
        item: isReceived ? "your services" : reviewedUser.name,
        itemId: String(review.tradeRequestId),
        time: formatRelativeTime(new Date(review.createdAt as Date)),
        status: "completed",
      });
    }

    // Sort by most recent first and limit to 10
    activities.sort((a, b) => {
      // Extract numeric value from time strings for comparison
      const getTimeValue = (time: string) => {
        if (time === "just now") return 0;
        const value = parseInt(time.split(" ")[0]);
        if (time.includes("minute")) return value;
        if (time.includes("hour")) return value * 60;
        if (time.includes("day")) return value * 60 * 24;
        return 9999; // Default high value
      };

      return getTimeValue(a.time) - getTimeValue(b.time);
    });

    return NextResponse.json(
      {
        activities: activities.slice(0, 10),
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    const { userId } = await params;
    console.error(`Error fetching user activity for user ${userId}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch user activity" },
      { status: 500, headers: corsHeaders }
    );
  }
}
