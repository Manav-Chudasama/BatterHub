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
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
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
    const user = await User.findOne({ userId }).select("_id reputationScore");

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Get all trade requests for this user
    const tradeRequests = await TradeRequest.find({
      $or: [{ fromUser: user.userId }, { toUser: user.userId }],
    });
    console.log("tradeRequests: ", tradeRequests);

    // Calculate stats
    const activeTradeRequests = tradeRequests.filter(
      (req) => req.status === "pending" || req.status === "accepted"
    ).length;

    const completedTrades = tradeRequests.filter(
      (req) => req.status === "completed"
    ).length;

    console.log("activeTradeRequests: ", activeTradeRequests);
    console.log("completedTrades: ", completedTrades);

    return NextResponse.json(
      {
        activeTradeRequests,
        completedTrades,
        reputationScore: user.reputationScore || 0,
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
