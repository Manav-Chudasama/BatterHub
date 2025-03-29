import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import TradeRequest from "@/models/TradeRequest";
import Listing from "@/models/Listing";
import User from "@/models/User";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * OPTIONS /api/trade-requests/[tradeRequestId]
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
 * GET /api/trade-requests/[tradeRequestId]
 * Get details of a specific trade request
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tradeRequestId: string } }
) {
  try {
    const { tradeRequestId } = await params;
    const { userId } = getAuth(request);

    // Check authentication
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(tradeRequestId)) {
      return NextResponse.json(
        { error: "Invalid trade request ID format" },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectToDatabase();

    // Find the trade request
    const tradeRequest = await TradeRequest.findById(tradeRequestId)
      .populate({
        path: "fromListing",
        populate: {
          path: "user",
          select: "name profilePicture location",
        },
      })
      .populate({
        path: "toListing",
        populate: {
          path: "user",
          select: "name profilePicture location",
        },
      });

    if (!tradeRequest) {
      return NextResponse.json(
        { error: "Trade request not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if the authenticated user is involved in the trade request
    if (
      tradeRequest.fromUserId !== userId &&
      tradeRequest.toUserId !== userId
    ) {
      return NextResponse.json(
        { error: "You don't have permission to view this trade request" },
        { status: 403, headers: corsHeaders }
      );
    }

    return NextResponse.json(tradeRequest, { headers: corsHeaders });
  } catch (error) {
    console.error("Error fetching trade request:", error);
    return NextResponse.json(
      { error: "Failed to fetch trade request" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * PUT /api/trade-requests/[tradeRequestId]
 * Update a trade request status
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { tradeRequestId: string } }
) {
  try {
    const { tradeRequestId } = await params;
    const { userId } = getAuth(request);

    // Check authentication
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(tradeRequestId)) {
      return NextResponse.json(
        { error: "Invalid trade request ID format" },
        { status: 400, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const { status, message } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate status
    const validStatuses = [
      "pending",
      "accepted",
      "rejected",
      "completed",
      "countered",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectToDatabase();

    // Find the trade request
    const tradeRequest = await TradeRequest.findById(tradeRequestId);

    if (!tradeRequest) {
      return NextResponse.json(
        { error: "Trade request not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if the authenticated user is involved in the trade request
    if (
      tradeRequest.fromUserId !== userId &&
      tradeRequest.toUserId !== userId
    ) {
      return NextResponse.json(
        { error: "You don't have permission to update this trade request" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Add message if provided
    if (message) {
      tradeRequest.messages.push({
        from: userId,
        content: message,
        timestamp: new Date(),
      });
    }

    // Update status
    tradeRequest.status = status;

    // If status is 'completed', update both listings to 'traded'
    if (status === "completed") {
      if (tradeRequest.fromListing) {
        await Listing.findByIdAndUpdate(tradeRequest.fromListing, {
          status: "traded",
        });
      }
      if (tradeRequest.toListing) {
        await Listing.findByIdAndUpdate(tradeRequest.toListing, {
          status: "traded",
        });
      }

      // Add trade to both users' trade history
      await User.findOneAndUpdate(
        { userId: tradeRequest.fromUserId },
        { $addToSet: { tradeHistory: tradeRequest._id } }
      );

      await User.findOneAndUpdate(
        { userId: tradeRequest.toUserId },
        { $addToSet: { tradeHistory: tradeRequest._id } }
      );
    }

    await tradeRequest.save();

    return NextResponse.json(
      { message: "Trade request updated successfully", tradeRequest },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error updating trade request:", error);
    return NextResponse.json(
      { error: "Failed to update trade request" },
      { status: 500, headers: corsHeaders }
    );
  }
}
