import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/mongodb";
import Listing from "@/models/Listing";
import mongoose from "mongoose";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * OPTIONS /api/listings/[listingId]/status
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
 * PATCH /api/listings/[listingId]/status
 * Update a listing's status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: any }
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
    const { status } = body;

    // Validate status
    if (
      !status ||
      !["active", "inactive", "traded", "deleted"].includes(status)
    ) {
      return NextResponse.json(
        { error: "Invalid status value" },
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
        { error: "You don't have permission to update this listing" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Update the listing status
    const updatedListing = await Listing.findByIdAndUpdate(
      listingId,
      { status },
      { new: true }
    );

    return NextResponse.json(
      {
        message: "Listing status updated successfully",
        listing: updatedListing,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error(`Error updating listing status:`, error);
    return NextResponse.json(
      { error: "Failed to update listing status" },
      { status: 500, headers: corsHeaders }
    );
  }
}
