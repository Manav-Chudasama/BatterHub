import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";

// We still need these imports to ensure the models are registered
import "@/models/Listing";
import "@/models/TradeRequest";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * OPTIONS /api/users/[userId]
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
 * GET /api/users/[userId]
 * Get a specific user by their Clerk userId
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  try {
    await connectToDatabase();

    // Ensure all models are loaded
    try {
      // Load all required models first to prevent errors
      await Promise.all([
        mongoose.model("User"),
        mongoose.model("Listing"),
        mongoose.model("TradeRequest"),
      ]).catch(() => {
        // If any model isn't registered yet, the models will be imported
        // from their respective files automatically through the imports
        console.log("Models being registered...");
      });
    } catch (err) {
      console.log("Error pre-loading models:", err);
    }

    // Now perform the query with population
    const user = await User.findOne({ userId })
      .select("-password")
      .populate({
        path: "savedListings",
        select: "_id title images category createdAt",
        model: "Listing",
      })
      .populate({
        path: "tradeHistory",
        select:
          "_id fromUserId toUserId status type fromListing toListing createdAt",
        model: "TradeRequest",
        populate: [
          {
            path: "fromListing",
            select: "_id title images",
            model: "Listing",
          },
          {
            path: "toListing",
            select: "_id title images",
            model: "Listing",
          },
        ],
      });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(user, { headers: corsHeaders });
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * PUT /api/users/[userId]
 * Update a specific user's profile information
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  try {
    const body = await request.json();

    await connectToDatabase();

    // Security: Don't allow updating sensitive fields through this endpoint
    delete body.userId; // Can't change the ID
    delete body.email; // Email changes should be handled by Clerk
    delete body.password; // Password changes should have a dedicated endpoint with proper hashing

    // Update user data
    const user = await User.findOneAndUpdate(
      { userId },
      { $set: body },
      { new: true }
    ).select("-password");

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(user, { headers: corsHeaders });
  } catch (error) {
    console.error(`Error updating user ${userId}:`, error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * DELETE /api/users/[userId]
 * Delete a specific user (primarily handled through Clerk webhook)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  try {
    await connectToDatabase();

    const user = await User.findOneAndDelete({ userId });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500, headers: corsHeaders }
    );
  }
}
