import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import TradeRequest from "@/models/TradeRequest";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * OPTIONS /api/users/[userId]/stats
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
 * GET /api/users/[userId]/stats
 * Get user dashboard statistics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const auth = getAuth(request);

    // Ensure that the authenticated user is requesting their own stats
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

    // Get all trade requests for this user
    const tradeRequests = await TradeRequest.find({
      $or: [{ fromUser: user._id }, { toUser: user._id }],
    });

    // Calculate stats
    const activeTradeRequests = tradeRequests.filter(
      (req) => req.status === "pending" || req.status === "accepted"
    ).length;

    const completedTrades = tradeRequests.filter(
      (req) => req.status === "completed"
    ).length;

    // Calculate success rate (completed trades / all trades with a final status)
    const finalizedTrades = tradeRequests.filter((req) =>
      ["completed", "rejected", "canceled"].includes(req.status)
    ).length;

    const successRate =
      finalizedTrades > 0
        ? Math.round((completedTrades / finalizedTrades) * 100)
        : 100; // Default to 100% if no trades yet

    return NextResponse.json(
      {
        activeTradeRequests,
        completedTrades,
        successRate,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch user stats" },
      { status: 500, headers: corsHeaders }
    );
  }
}
