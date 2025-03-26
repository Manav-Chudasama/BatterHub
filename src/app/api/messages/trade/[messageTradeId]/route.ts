import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/mongodb";
import Message from "@/models/Message";
import TradeRequest from "@/models/TradeRequest";

// Set CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Mark messages as read
export async function PUT(
  req: NextRequest,
  { params }: { params: { tradeRequestId: string } }
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    const tradeRequestId = params.tradeRequestId;

    await connectToDatabase();

    // Verify that the user is part of this trade request
    const tradeRequest = await TradeRequest.findById(tradeRequestId);
    if (!tradeRequest) {
      return NextResponse.json(
        { error: "Trade request not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Ensure user is part of this trade request
    if (
      tradeRequest.fromUserId !== userId &&
      tradeRequest.toUserId !== userId
    ) {
      return NextResponse.json(
        { error: "You are not authorized to access this trade request" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Mark messages as read (only messages sent by the other user)
    const updateResult = await Message.updateMany(
      {
        tradeRequestId,
        sender: { $ne: userId }, // Not sent by the current user
        isRead: false,
      },
      { isRead: true }
    );

    return NextResponse.json(
      { updated: updateResult.modifiedCount },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json(
      { error: "Failed to mark messages as read" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * GET /api/messages/trade/[messageTradeId]
 * Get messages for a trade request
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { messageTradeId: string } }
) {
  try {
    const auth = getAuth(req);
    const userId = auth.userId;
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    const { messageTradeId } = params;

    await connectToDatabase();

    // Find the trade request and make sure the user is involved
    const tradeRequest = await TradeRequest.findOne({
      _id: messageTradeId,
      $or: [{ fromUserId: userId }, { toUserId: userId }],
    });

    if (!tradeRequest) {
      return NextResponse.json(
        { error: "Trade request not found or you are not involved" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Find the chat associated with this trade request
    const chat = await Message.findOne({
      $or: [
        { offeredTrade: messageTradeId },
        { requestedTrade: messageTradeId },
      ],
      participants: userId,
    }).populate("messages.sender", "name profilePicture");

    if (!chat) {
      return NextResponse.json(
        { error: "Chat not found for this trade request" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(chat, { headers: corsHeaders });
  } catch (error) {
    console.error("Error fetching trade messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500, headers: corsHeaders }
    );
  }
}
