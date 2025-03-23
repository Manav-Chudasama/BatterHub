import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * OPTIONS /api/users/[userId]/saved-listings
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
 * GET /api/users/[userId]/saved-listings
 * Get all saved listings for a user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    await connectToDatabase();

    // Find the user and populate their saved listings
    const user = await User.findOne({ userId })
      .select("savedListings")
      .populate("savedListings");

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        savedListings: user.savedListings,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error(
      `Error fetching saved listings for user ${params.userId}:`,
      error
    );
    return NextResponse.json(
      { error: "Failed to fetch saved listings" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * POST /api/users/[userId]/saved-listings
 * Add a new listing to the user's saved listings
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { listingId } = await request.json();

    if (!listingId) {
      return NextResponse.json(
        { error: "Listing ID is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectToDatabase();

    try {
      // Convert string ID to ObjectId
      const listingObjectId = new mongoose.Types.ObjectId(listingId);

      // Use $addToSet to prevent duplicates
      const user = await User.findOneAndUpdate(
        { userId },
        { $addToSet: { savedListings: listingObjectId } },
        { new: true }
      ).select("savedListings");

      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404, headers: corsHeaders }
        );
      }

      return NextResponse.json(
        {
          message: "Listing saved successfully",
          savedListings: user.savedListings,
        },
        { headers: corsHeaders }
      );
    } catch (err) {
      // Handle invalid ObjectId format
      return NextResponse.json(
        { error: "Invalid listing ID format" },
        { status: 400, headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error(`Error saving listing for user ${params.userId}:`, error);
    return NextResponse.json(
      { error: "Failed to save listing" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * DELETE /api/users/[userId]/saved-listings
 * Remove a listing from the user's saved listings
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get("listingId");

    if (!listingId) {
      return NextResponse.json(
        { error: "Listing ID is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectToDatabase();

    try {
      // Convert string ID to ObjectId
      const listingObjectId = new mongoose.Types.ObjectId(listingId);

      // Remove the listing from saved listings
      const user = await User.findOneAndUpdate(
        { userId },
        { $pull: { savedListings: listingObjectId } },
        { new: true }
      ).select("savedListings");

      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404, headers: corsHeaders }
        );
      }

      return NextResponse.json(
        {
          message: "Listing removed from saved listings",
          savedListings: user.savedListings,
        },
        { headers: corsHeaders }
      );
    } catch (err) {
      // Handle invalid ObjectId format
      return NextResponse.json(
        { error: "Invalid listing ID format" },
        { status: 400, headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error(
      `Error removing saved listing for user ${params.userId}:`,
      error
    );
    return NextResponse.json(
      { error: "Failed to remove saved listing" },
      { status: 500, headers: corsHeaders }
    );
  }
}
