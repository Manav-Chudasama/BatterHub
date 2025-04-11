import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import Listing from "@/models/Listing";
import mongoose from "mongoose";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * OPTIONS /api/listings/[listingId]/save
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
 * POST /api/listings/[listingId]/save
 * Save a listing to a user's savedListings
 */
export async function POST(
  req: NextRequest,
  { params }: { params: any }
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    const { listingId } = params;
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return NextResponse.json(
        { error: "Invalid listing ID" },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectToDatabase();

    // Check if the listing exists
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Find the user in our database
    const user = await User.findOne({ userId });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Add the listing to the user's savedListings
    await User.findOneAndUpdate(
      { userId },
      { $addToSet: { savedListings: listingId } },
      { new: true }
    );

    // Add the user to the listing's savedBy
    await Listing.findByIdAndUpdate(listingId, {
      $addToSet: { savedBy: user._id },
    });

    return NextResponse.json(
      { message: "Listing saved successfully" },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error saving listing:", error);
    return NextResponse.json(
      { error: "Failed to save listing" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * DELETE /api/listings/[listingId]/save
 * Remove a listing from a user's savedListings
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: any }
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    const { listingId } = params;
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return NextResponse.json(
        { error: "Invalid listing ID" },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectToDatabase();

    // Find the user
    const user = await User.findOne({ userId });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Remove the listing from the user's savedListings
    await User.findOneAndUpdate(
      { userId },
      { $pull: { savedListings: listingId } }
    );

    // Remove the user from the listing's savedBy
    await Listing.findByIdAndUpdate(listingId, {
      $pull: { savedBy: user._id },
    });

    return NextResponse.json(
      { message: "Listing removed from saved listings" },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error removing saved listing:", error);
    return NextResponse.json(
      { error: "Failed to remove listing from saved listings" },
      { status: 500, headers: corsHeaders }
    );
  }
}
