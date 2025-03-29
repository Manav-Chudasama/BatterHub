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
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * OPTIONS /api/trade-requests
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
 * GET /api/trade-requests
 * Get trade requests for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    const { searchParams } = new URL(request.url);

    // Check authentication
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    await connectToDatabase();

    // Parse query parameters
    const status = searchParams.get("status");
    const type = searchParams.get("type"); // 'sent' or 'received'

    // Build query
    const query: Record<string, unknown> = {};

    if (type === "sent") {
      query.fromUserId = userId;
    } else if (type === "received") {
      query.toUserId = userId;
    } else {
      // If no type specified, get both sent and received
      query.$or = [{ fromUserId: userId }, { toUserId: userId }];
    }

    if (status) {
      query.status = status;
    }

    // Find trade requests
    const tradeRequests = await TradeRequest.find(query)
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
      })
      .sort({ updatedAt: -1 });

    // Calculate stats
    const stats = {
      sent: await TradeRequest.countDocuments({ fromUserId: userId }),
      received: await TradeRequest.countDocuments({ toUserId: userId }),
      pending: await TradeRequest.countDocuments({
        $or: [{ fromUserId: userId }, { toUserId: userId }],
        status: "pending",
      }),
      accepted: await TradeRequest.countDocuments({
        $or: [{ fromUserId: userId }, { toUserId: userId }],
        status: "accepted",
      }),
      rejected: await TradeRequest.countDocuments({
        $or: [{ fromUserId: userId }, { toUserId: userId }],
        status: "rejected",
      }),
      completed: await TradeRequest.countDocuments({
        $or: [{ fromUserId: userId }, { toUserId: userId }],
        status: "completed",
      }),
      countered: await TradeRequest.countDocuments({
        $or: [{ fromUserId: userId }, { toUserId: userId }],
        status: "countered",
      }),
    };

    return NextResponse.json(
      { tradeRequests, stats },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error fetching trade requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch trade requests" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * POST /api/trade-requests
 * Create a new trade request
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

    const body = await request.json();
    const { listingId, message, offeringListingId } = body;

    if (!listingId) {
      return NextResponse.json(
        { error: "Listing ID is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectToDatabase();

    // Get the target listing
    const listing = await Listing.findById(listingId);

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Prevent users from sending trade requests to their own listings
    if (listing.userId === userId) {
      return NextResponse.json(
        { error: "You cannot send a trade request to your own listing" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate offeringListingId if provided
    let offeringListing = null;
    if (offeringListingId) {
      if (!mongoose.Types.ObjectId.isValid(offeringListingId)) {
        return NextResponse.json(
          { error: "Invalid offering listing ID format" },
          { status: 400, headers: corsHeaders }
        );
      }

      offeringListing = await Listing.findById(offeringListingId);

      if (!offeringListing) {
        return NextResponse.json(
          { error: "Offering listing not found" },
          { status: 404, headers: corsHeaders }
        );
      }

      // Verify that the offering listing belongs to the current user
      if (offeringListing.userId !== userId) {
        return NextResponse.json(
          { error: "You can only offer your own listings for trade" },
          { status: 403, headers: corsHeaders }
        );
      }

      // Verify that the offering listing is active
      if (offeringListing.status !== "active") {
        return NextResponse.json(
          { error: "You can only offer active listings for trade" },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // Create a new trade request
    const tradeRequest = new TradeRequest({
      fromUserId: userId,
      toUserId: listing.userId,
      fromListing: offeringListingId, // Set this to the offering listing ID if provided
      toListing: listingId,
      status: "pending",
      messages: [
        {
          from: userId,
          content: message || "I'm interested in trading for this item.",
          timestamp: new Date(),
        },
      ],
    });

    await tradeRequest.save();

    // Update listing with new trade request
    await Listing.findByIdAndUpdate(listingId, {
      $push: { tradeRequests: tradeRequest._id },
    });

    // If an offering listing is provided, also add the trade request to it
    if (offeringListingId) {
      await Listing.findByIdAndUpdate(offeringListingId, {
        $push: { tradeRequests: tradeRequest._id },
      });
    }

    // Update the user's trade history
    await User.findOneAndUpdate(
      { userId: userId },
      { $addToSet: { tradeHistory: tradeRequest._id } }
    );

    return NextResponse.json(
      {
        message: "Trade request sent successfully",
        tradeRequest,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error creating trade request:", error);
    return NextResponse.json(
      { error: "Failed to create trade request" },
      { status: 500, headers: corsHeaders }
    );
  }
}
