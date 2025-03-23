import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/mongodb";
import Listing from "@/models/Listing";
import mongoose from "mongoose";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * OPTIONS /api/listings/[listingId]
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
 * GET /api/listings/[listingId]
 * Get a specific listing by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { listingId: string } }
) {
  try {
    const { listingId } = params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return NextResponse.json(
        { error: "Invalid listing ID format" },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectToDatabase();

    // Find the listing and populate user data
    const listing = await Listing.findById(listingId)
      .populate("user", "name profilePicture location")
      .lean();

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Increment view count
    await Listing.findByIdAndUpdate(listingId, { $inc: { views: 1 } });

    return NextResponse.json({ listing }, { headers: corsHeaders });
  } catch (error) {
    const { listingId } = params;
    console.error(`Error fetching listing ${listingId}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch listing" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * PUT /api/listings/[listingId]
 * Update a specific listing
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { listingId: string } }
) {
  try {
    const { listingId } = params;
    const { userId } = getAuth(request);

    // Check authentication
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return NextResponse.json(
        { error: "Invalid listing ID format" },
        { status: 400, headers: corsHeaders }
      );
    }

    const body = await request.json();

    await connectToDatabase();

    // Find the listing
    const listing = await Listing.findById(listingId);

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if the authenticated user is the owner of the listing
    if (listing.userId !== userId) {
      return NextResponse.json(
        { error: "You don't have permission to update this listing" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Update only allowed fields
    const allowedUpdates = [
      "title",
      "description",
      "category",
      "tradePreferences",
      "images",
      "availability",
      "status",
      "location",
    ];

    const updates: Record<string, string> = {};

    for (const field of allowedUpdates) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    // Update the listing
    const updatedListing = await Listing.findByIdAndUpdate(
      listingId,
      { $set: updates },
      { new: true }
    ).populate("user", "name profilePicture");

    return NextResponse.json(updatedListing, { headers: corsHeaders });
  } catch (error) {
    const { listingId } = params;
    console.error(`Error updating listing ${listingId}:`, error);
    return NextResponse.json(
      { error: "Failed to update listing" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * DELETE /api/listings/[listingId]
 * Delete a specific listing permanently
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { listingId: string } }
) {
  try {
    const { listingId } = params;
    const { userId } = getAuth(request);

    // Check authentication
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return NextResponse.json(
        { error: "Invalid listing ID format" },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectToDatabase();

    // Find the listing
    const listing = await Listing.findById(listingId);

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if the authenticated user is the owner of the listing
    if (listing.userId !== userId) {
      return NextResponse.json(
        { error: "You don't have permission to delete this listing" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Permanently delete the listing
    await Listing.findByIdAndDelete(listingId);

    return NextResponse.json(
      {
        message: "Listing permanently deleted",
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    const { listingId } = params;
    console.error(`Error deleting listing ${listingId}:`, error);
    return NextResponse.json(
      { error: "Failed to delete listing" },
      { status: 500, headers: corsHeaders }
    );
  }
}
