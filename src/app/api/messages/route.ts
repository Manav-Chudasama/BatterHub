import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/mongodb";
import Chat from "@/models/Message";
import User from "@/models/User";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Define interfaces for message structure
interface Message {
  sender: string;
  text?: string;
  file?: string;
  read: boolean;
  createdAt: Date;
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: NextRequest) {
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

    // Get the chatId from query params
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");

    if (chatId) {
      // Get a specific chat
      const chat = await Chat.findById(chatId);

      if (!chat) {
        return NextResponse.json(
          { error: "Chat not found" },
          { status: 404, headers: corsHeaders }
        );
      }

      // Check if the user is a participant
      if (!chat.participants.includes(userId)) {
        return NextResponse.json(
          { error: "Unauthorized: User is not a participant in this chat" },
          { status: 403, headers: corsHeaders }
        );
      }

      // Mark all unread messages as read if they were sent by the other participant
      const unreadMessages = chat.messages.filter(
        (msg: Message) => !msg.read && msg.sender !== userId
      );

      if (unreadMessages.length > 0) {
        // Update the read status of those messages
        await Chat.updateOne(
          { _id: chatId, "messages.sender": { $ne: userId } },
          { $set: { "messages.$[elem].read": true } },
          { arrayFilters: [{ "elem.read": false }], multi: true }
        );
      }

      // Get the updated chat
      const updatedChat = await Chat.findById(chatId);

      // Get user info for participants
      const otherParticipantId = updatedChat.participants.find(
        (id: string) => id !== userId
      );
      const otherParticipant = await User.findOne(
        { userId: otherParticipantId },
        { userId: 1, name: 1, profilePicture: 1 }
      );
      console.log("otherParticipant", otherParticipant);

      return NextResponse.json(
        {
          ...updatedChat.toObject(),
          otherParticipant,
        },
        { headers: corsHeaders }
      );
    } else {
      // Get all chats for the user
      const chats = await Chat.find({
        participants: userId,
      })
        .sort({ updatedAt: -1 })
        .lean();

      // Get user info for participants
      const userIds = [
        ...new Set(
          chats.flatMap((chat) =>
            chat.participants.filter((id: string) => id !== userId)
          )
        ),
      ];

      const users = await User.find(
        { userId: { $in: userIds } },
        "userId name profilePicture"
      ).lean();

      // Create a map of userId to user info
      const userMap = new Map(users.map((user) => [user.userId, user]));

      // Add participant info to each chat
      const chatsWithUserInfo = chats.map((chat) => {
        const otherParticipantId = chat.participants.find(
          (id: string) => id !== userId
        );
        return {
          ...chat,
          otherParticipant: userMap.get(otherParticipantId) || null,
          unreadCount: chat.messages.filter(
            (msg: Message) => !msg.read && msg.sender !== userId
          ).length,
        };
      });

      return NextResponse.json(chatsWithUserInfo, { headers: corsHeaders });
    }
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    await connectToDatabase();
    const body = await req.json();

    // Create a new chat or add a message to an existing one
    if (body.chatId) {
      // Add a new message to an existing chat
      const { chatId, text, file } = body;

      const chat = await Chat.findById(chatId);
      if (!chat) {
        return NextResponse.json(
          { error: "Chat not found" },
          { status: 404, headers: corsHeaders }
        );
      }

      // Ensure the user is a participant
      if (!chat.participants.includes(userId)) {
        return NextResponse.json(
          { error: "Unauthorized: User is not a participant in this chat" },
          { status: 403, headers: corsHeaders }
        );
      }

      // Create the new message
      const newMessage = {
        sender: userId,
        text,
        file,
        read: false,
        createdAt: new Date(),
      };

      // Add the message to the chat
      chat.messages.push(newMessage);
      chat.lastMessage = newMessage;
      await chat.save();

      return NextResponse.json(chat, { headers: corsHeaders });
    } else {
      // Create a new chat
      const { otherParticipantId, text, file, tradeRequestId } = body;

      if (!otherParticipantId) {
        return NextResponse.json(
          { error: "Other participant is required" },
          { status: 400, headers: corsHeaders }
        );
      }

      // Check if a chat between these participants already exists
      const existingChat = await Chat.findOne({
        participants: { $all: [userId, otherParticipantId] },
      });

      if (existingChat) {
        // If a chat exists, add the message to it
        const newMessage = {
          sender: userId,
          text,
          file,
          read: false,
          createdAt: new Date(),
        };

        existingChat.messages.push(newMessage);
        existingChat.lastMessage = newMessage;
        if (tradeRequestId && !existingChat.tradeRequestId) {
          existingChat.tradeRequestId = tradeRequestId;
        }
        await existingChat.save();

        return NextResponse.json(existingChat, { headers: corsHeaders });
      } else {
        // Create a new chat
        const newMessage = {
          sender: userId,
          text,
          file,
          read: false,
          createdAt: new Date(),
        };

        const newChat = new Chat({
          participants: [userId, otherParticipantId],
          messages: [newMessage],
          lastMessage: newMessage,
          tradeRequestId,
        });

        await newChat.save();
        return NextResponse.json(newChat, { headers: corsHeaders });
      }
    }
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500, headers: corsHeaders }
    );
  }
}
