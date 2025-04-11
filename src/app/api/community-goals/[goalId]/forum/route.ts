import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import CommunityGoal from "@/models/CommunityGoal";
import mongoose from "mongoose";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Types for message handling
interface MessageUser {
  _id: string;
  name?: string;
  profilePicture?: string;
  userId?: string;
}

// Define type for lean document with messages
type LeanGoalDocument = {
  _id: mongoose.Types.ObjectId;
  messages?: Array<{
    _id?: mongoose.Types.ObjectId;
    userId: string;
    username?: string;
    message: string;
    createdAt: Date;
  }>;
  [key: string]: unknown;
};

/**
 * OPTIONS /api/community-goals/[goalId]/forum
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
 * GET /api/community-goals/[goalId]/forum
 * Get forum messages for a community goal
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  try {
    // Properly await params in Next.js 14
    const { goalId } = await params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(goalId)) {
      return NextResponse.json(
        { error: "Invalid goal ID format" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Optional pagination
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const page = parseInt(url.searchParams.get("page") || "1");

    await connectToDatabase();

    // Find the goal and get its messages
    const goal = (await CommunityGoal.findById(
      goalId
    ).lean()) as LeanGoalDocument;
    if (!goal) {
      return NextResponse.json(
        { error: "Community goal not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Extract messages and handle undefined case
    const messagesArray = goal.messages || [];

    // Sort messages by createdAt in ascending order (oldest first)
    const sortedMessages = [...messagesArray].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedMessages = sortedMessages.slice(startIndex, endIndex);

    // Get user IDs for populating user data
    const userIds = paginatedMessages.map((message) => message.userId);
    const uniqueUserIds = [...new Set(userIds)];

    // Get user data for messages
    const users = await User.find(
      { userId: { $in: uniqueUserIds } },
      "userId name profilePicture"
    ).lean();

    // Create a map for quick lookup
    const userMap: Record<string, MessageUser> = {};
    users.forEach((user) => {
      if (user.userId) {
        userMap[user.userId] = {
          _id: user._id.toString(),
          name: user.name,
          profilePicture: user.profilePicture,
          userId: user.userId,
        };
      }
    });

    // Attach user data to messages
    const populatedMessages = paginatedMessages.map((message) => ({
      _id: message._id
        ? message._id.toString()
        : new mongoose.Types.ObjectId().toString(),
      goalId,
      userId: message.userId,
      message: message.message,
      createdAt: message.createdAt,
      user: userMap[message.userId] || {
        name: message.username || "Unknown User",
      },
    }));

    return NextResponse.json(
      {
        messages: populatedMessages,
        pagination: {
          total: messagesArray.length,
          pages: Math.ceil(messagesArray.length / limit),
          currentPage: page,
          limit,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error(`Error fetching forum messages:`, error);
    return NextResponse.json(
      { error: "Failed to fetch forum messages" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * POST /api/community-goals/[goalId]/forum
 * Add a message to a community goal forum
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  try {
    // Properly await params in Next.js 14
    const { goalId } = await params;
    const { userId } = getAuth(request);

    console.log("goalId", goalId);
    console.log("userId", userId);

    // Check authentication
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(goalId)) {
      return NextResponse.json(
        { error: "Invalid goal ID format" },
        { status: 400, headers: corsHeaders }
      );
    }

    const body = await request.json();
    console.log("Request body:", body);

    // Validate message data
    if (!body.message || !body.message.trim()) {
      return NextResponse.json(
        { error: "Message text is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectToDatabase();

    // Find user in database
    const user = await User.findOne({ userId }).lean();
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // First verify the goal exists in a separate query
    const goalExists = await CommunityGoal.findById(goalId);
    if (!goalExists) {
      return NextResponse.json(
        { error: "Community goal not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Generate a unique ID for the message
    const messageId = new mongoose.Types.ObjectId();

    // Create the message object
    const newMessage = {
      _id: messageId,
      userId,
      username: user.name || "Anonymous",
      message: body.message.trim(),
      createdAt: new Date(),
    };

    console.log("New message to be added:", newMessage);

    try {
      // Use Model.updateOne to avoid TypeScript errors
      const update = { $push: { messages: newMessage } };
      await CommunityGoal.updateOne({ _id: goalId }, update);

      // Create a response with the necessary user info
      const messageResponse = {
        _id: messageId.toString(),
        goalId,
        userId,
        message: newMessage.message,
        createdAt: newMessage.createdAt,
        user: {
          _id: user._id.toString(),
          name: user.name || "Anonymous",
          profilePicture: user.profilePicture,
        },
      };

      return NextResponse.json(
        {
          message: "Forum message added successfully",
          forumMessage: messageResponse,
        },
        { headers: corsHeaders }
      );
    } catch (updateError) {
      console.error("Error updating document:", updateError);
      return NextResponse.json(
        { error: "Failed to save message to database" },
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error(`Error adding forum message:`, error);
    return NextResponse.json(
      { error: "Failed to add forum message" },
      { status: 500, headers: corsHeaders }
    );
  }
}
