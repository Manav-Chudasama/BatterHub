import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/mongodb";
import Chat from "@/models/Message";

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
  { params }: { params: { chatId: string } }
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    await connectToDatabase();

    const { chatId } = await params;

    // Find the chat
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

    // Mark all unread messages from other participants as read
    await Chat.updateOne(
      { _id: chatId, "messages.sender": { $ne: userId } },
      { $set: { "messages.$[elem].read": true } },
      { arrayFilters: [{ "elem.read": false }], multi: true }
    );

    return NextResponse.json(
      { success: true, message: "Messages marked as read" },
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
