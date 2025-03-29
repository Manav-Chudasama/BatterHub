import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/mongodb";
import TradeRequest from "@/models/TradeRequest";
import Listing from "@/models/Listing";
import Chat from "@/models/Message";
import User from "@/models/User";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { tradeRequestId: string } }
) {
  try {
    // Get the authenticated user
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    await connectToDatabase();

    const { tradeRequestId } = params;
    if (!tradeRequestId) {
      return NextResponse.json(
        { error: "Trade request ID is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Find the trade request
    const tradeRequest = await TradeRequest.findById(tradeRequestId);
    if (!tradeRequest) {
      return NextResponse.json(
        { error: "Trade request not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if the user is the recipient of the trade request
    const isRecipient = tradeRequest.toUserId === userId;
    const isSender = tradeRequest.fromUserId === userId;
    if (!isRecipient && !isSender) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Parse the request body
    const body = await req.json();
    const { status, message } = body;

    // Update the trade request status
    tradeRequest.status = status;

    // If there's a message, add it to the messages array
    if (message) {
      tradeRequest.messages.push({
        sender: userId,
        content: message,
        timestamp: new Date(),
      });
    }

    // If the status is "accepted", create a chat between the users if it doesn't exist
    if (status === "accepted") {
      // Check if a chat already exists between these users
      const existingChat = await Chat.findOne({
        participants: {
          $all: [tradeRequest.fromUserId, tradeRequest.toUserId],
        },
      });

      if (!existingChat) {
        // Create a new chat
        const welcomeMessage = {
          sender: userId,
          text: "Trade request accepted! You can now chat with each other.",
          read: false,
          createdAt: new Date(),
        };

        const newChat = new Chat({
          participants: [tradeRequest.fromUserId, tradeRequest.toUserId],
          messages: [welcomeMessage],
          lastMessage: welcomeMessage,
          tradeRequestId: tradeRequestId,
        });

        await newChat.save();
      } else if (!existingChat.tradeRequestId) {
        // Update the existing chat with the trade request ID
        existingChat.tradeRequestId = tradeRequestId;
        await existingChat.save();
      }

      // If the trade is completed, update the listings
      if (status === "completed") {
        // Update the "from" listing to mark it as traded
        await Listing.findByIdAndUpdate(tradeRequest.fromListing._id, {
          status: "traded",
          tradedTo: tradeRequest.toUserId,
          tradedToListing: tradeRequest.toListing._id,
        });

        // Update the "to" listing to mark it as traded
        await Listing.findByIdAndUpdate(tradeRequest.toListing._id, {
          status: "traded",
          tradedTo: tradeRequest.fromUserId,
          tradedToListing: tradeRequest.fromListing._id,
        });

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
    }

    // Save the updated trade request
    await tradeRequest.save();

    return NextResponse.json(tradeRequest, { headers: corsHeaders });
  } catch (error) {
    console.error("Error updating trade request status:", error);
    return NextResponse.json(
      { error: "Failed to update trade request status" },
      { status: 500, headers: corsHeaders }
    );
  }
}
