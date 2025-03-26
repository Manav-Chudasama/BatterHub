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

// GET messages for a user
export async function GET(req: NextRequest) {
  try {
    const auth = getAuth(req);
    const userId = auth.userId;
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Get query parameters
    const url = new URL(req.url);
    const chatId = url.searchParams.get("chatId");
    const messageTradeId = url.searchParams.get("messageTradeId");

    await connectToDatabase();

    let query = {};

    // Determine which chats to fetch based on query parameters
    if (chatId) {
      // Get a specific chat
      query = { _id: chatId, participants: userId };
    } else if (messageTradeId) {
      // Get chat associated with a trade request
      query = {
        $or: [
          { offeredTrade: messageTradeId },
          { requestedTrade: messageTradeId },
        ],
        participants: userId,
      };
    } else {
      // Get all chats for the user
      query = { participants: userId };
    }

    console.log("Query:", JSON.stringify(query));

    // Find the chats
    const chats = await Message.find(query)
      .populate({
        path: "offeredTrade",
        model: "TradeRequest",
        select: "status fromListing toListing fromUserId toUserId",
      })
      .populate({
        path: "requestedTrade",
        model: "TradeRequest",
        select: "status fromListing toListing fromUserId toUserId",
      })
      .sort({ updatedAt: -1 });

    console.log(`Found ${chats.length} chats`);

    // Manually get user data from Clerk for each participant
    const processedChats = await Promise.all(
      chats.map(async (chat) => {
        const chatObj = chat.toObject();

        // Add user data for participants (with better names than just IDs)
        chatObj.participants = chatObj.participants.map(
          (participantId: string) => {
            // For the current user, use their actual data
            if (participantId === userId) {
              return {
                _id: participantId,
                name: "You",
                profilePicture: "/placeholder-avatar.png",
              };
            }

            // For other users, use a friendly name format
            return {
              _id: participantId,
              name: "Trading Partner",
              profilePicture: "/placeholder-avatar.png",
            };
          }
        );

        // Add sender names for message senders
        if (chatObj.messages && chatObj.messages.length > 0) {
          chatObj.messages = chatObj.messages.map(
            (msg: {
              sender: string;
              text: string;
              file?: string;
              createdAt: Date;
              isRead: boolean;
            }) => ({
              ...msg,
              sender: msg.sender,
            })
          );
        }

        return chatObj;
      })
    );

    return NextResponse.json(
      { chats: processedChats },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST a new message
export async function POST(req: NextRequest) {
  try {
    const auth = getAuth(req);
    const userId = auth.userId;
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const { chatId, messageTradeId, text, file } = body;

    if (!chatId && !messageTradeId) {
      return NextResponse.json(
        { error: "Either chatId or messageTradeId is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectToDatabase();

    let chat;

    // If chatId is provided, update existing chat
    if (chatId) {
      chat = await Message.findOne({ _id: chatId, participants: userId });

      if (!chat) {
        return NextResponse.json(
          { error: "Chat not found or you are not a participant" },
          { status: 404, headers: corsHeaders }
        );
      }

      // Add new message to the chat
      chat.messages.push({
        sender: userId,
        text: text || "",
        file: file || "",
        createdAt: new Date(),
        isRead: false,
      });

      // Update timestamp
      chat.updatedAt = new Date();

      await chat.save();
    }
    // If messageTradeId is provided, find or create chat for this trade request
    else if (messageTradeId) {
      // Find the trade request and make sure the user is involved
      const tradeRequest = await TradeRequest.findById(messageTradeId);

      if (!tradeRequest) {
        return NextResponse.json(
          { error: "Trade request not found" },
          { status: 404, headers: corsHeaders }
        );
      }

      // Check if user is part of this trade request
      if (
        tradeRequest.fromUserId !== userId &&
        tradeRequest.toUserId !== userId
      ) {
        return NextResponse.json(
          { error: "You are not involved in this trade request" },
          { status: 403, headers: corsHeaders }
        );
      }

      // Find existing chat or create new one
      chat = await Message.findOne({
        $or: [
          { offeredTrade: messageTradeId },
          { requestedTrade: messageTradeId },
        ],
        participants: {
          $all: [tradeRequest.fromUserId, tradeRequest.toUserId],
        },
      });

      if (!chat) {
        // Create new chat
        chat = new Message({
          participants: [tradeRequest.fromUserId, tradeRequest.toUserId],
          offeredTrade: tradeRequest._id,
          requestedTrade: tradeRequest._id,
          messages: [
            {
              sender: userId,
              text: text || "",
              file: file || "",
              createdAt: new Date(),
              isRead: false,
            },
          ],
        });
      } else {
        // Add new message to existing chat
        chat.messages.push({
          sender: userId,
          text: text || "",
          file: file || "",
          createdAt: new Date(),
          isRead: false,
        });

        // Update timestamp
        chat.updatedAt = new Date();
      }

      await chat.save();
    }

    return NextResponse.json(
      { success: true, message: "Message sent", chat },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500, headers: corsHeaders }
    );
  }
}
