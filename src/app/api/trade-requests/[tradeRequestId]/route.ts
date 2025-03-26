import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import TradeRequest from "@/models/TradeRequest";
import Listing from "@/models/Listing";
import Message from "@/models/Message";

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
    const { tradeRequestId } = params;
    const { userId } = await auth();

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
    const { tradeRequestId } = params;
    const { userId } = await auth();

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
    console.log(message);
    // Add message if provided
    if (message) {
      try {
        tradeRequest.messages.push({
          from: userId,
          content: message,
          timestamp: new Date(),
        });
      } catch (messageError) {
        console.error("Error adding message to trade request:", messageError);
        // Continue processing even if adding message fails
      }
    }

    // Update status
    tradeRequest.status = status;

    // If status is 'accepted', create or update the chat between users
    if (status === "accepted") {
      try {
        // Check if chat already exists
        let chat = await Message.findOne({
          $or: [
            { offeredTrade: tradeRequestId },
            { requestedTrade: tradeRequestId },
          ],
          participants: {
            $all: [tradeRequest.fromUserId, tradeRequest.toUserId],
          },
        });
        console.log(userId);

        // If no chat exists, create one
        if (!chat) {
          const welcomeMessage =
            "Trade request accepted! You can now chat with each other about the details of your trade.";

          chat = new Message({
            participants: [tradeRequest.fromUserId, tradeRequest.toUserId],
            offeredTrade: tradeRequest._id,
            requestedTrade: tradeRequest._id,
            messages: [
              {
                sender: userId,
                text: welcomeMessage,
                createdAt: new Date(),
                isRead: false,
              },
            ],
          });

          await chat.save();
          console.log(
            `Created new chat (${chat._id}) for trade request ${tradeRequestId}`
          );
        }
      } catch (chatError) {
        console.error("Error creating chat:", chatError);
        // Continue processing even if chat creation fails
      }
    }

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
    }

    try {
      await tradeRequest.save();

      return NextResponse.json(
        { message: "Trade request updated successfully", tradeRequest },
        { headers: corsHeaders }
      );
    } catch (saveError) {
      console.error("Error saving trade request:", saveError);

      // Try to save without messages if there was an error
      if (message) {
        // Remove the last message that was added
        tradeRequest.messages.pop();
        await tradeRequest.save();
        return NextResponse.json(
          {
            message: "Trade request status updated, but could not save message",
            tradeRequest,
          },
          { headers: corsHeaders }
        );
      }

      return NextResponse.json(
        { error: "Failed to update trade request" },
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error("Error updating trade request:", error);
    return NextResponse.json(
      { error: "Failed to update trade request" },
      { status: 500, headers: corsHeaders }
    );
  }
}
