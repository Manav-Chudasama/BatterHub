import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/mongodb";
import Message from "@/models/Message";

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
  { params }: { params: Promise<{ chatId: string }> }
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

    const { chatId } = await params;

    await connectToDatabase();

    // Find the chat and verify user is a participant
    const chat = await Message.findOne({
      _id: chatId,
      participants: userId,
    });

    if (!chat) {
      return NextResponse.json(
        { error: "Chat not found or you are not a participant" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Mark unread messages as read (only ones sent by other users)
    let updatedCount = 0;
    chat.messages.forEach((message: { sender: string; isRead: boolean }) => {
      if (message.sender !== userId && !message.isRead) {
        message.isRead = true;
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      await chat.save();
    }

    return NextResponse.json(
      { success: true, markedAsRead: updatedCount },
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
