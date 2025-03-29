import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import TradeRequest from "@/models/TradeRequest";
import Review from "@/models/Review";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

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
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
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
      const isIncoming =
        tradeRequest.toUser._id.toString() === user._id.toString();
      const otherUser = isIncoming
        ? tradeRequest.fromUser
        : tradeRequest.toUser;
      const targetListing = isIncoming
        ? tradeRequest.toListing
        : tradeRequest.fromListing;

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
          id: tradeRequest._id.toString(),
          type,
          user: {
            name: otherUser.name,
            profilePicture: otherUser.profilePicture,
          },
          action,
          item: targetListing.title,
          itemId: tradeRequest._id.toString(),
          time: formatRelativeTime(new Date(tradeRequest.createdAt)),
          status,
        });
      }
    }

    // Process reviews
    for (const review of recentReviews) {
      const isReceived =
        review.reviewedUserId.toString() === user._id.toString();

      activities.push({
        id: review._id.toString(),
        type: "new_review",
        user: {
          name: review.reviewer.name,
          profilePicture: review.reviewer.profilePicture,
        },
        action: isReceived ? "left a review for" : "you reviewed",
        item: isReceived ? "your services" : review.reviewedUser.name,
        itemId: review.tradeRequestId.toString(),
        time: formatRelativeTime(new Date(review.createdAt)),
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
    console.error("Error fetching user activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch user activity" },
      { status: 500, headers: corsHeaders }
    );
  }
}
