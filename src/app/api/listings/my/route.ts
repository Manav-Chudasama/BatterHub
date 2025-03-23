import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/mongodb";
import Listing from "@/models/Listing";
import "@/models/User"; // Import to ensure model is registered

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * OPTIONS /api/listings/my
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
 * GET /api/listings/my
 * Get all listings for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);

    // Check authentication
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Filters
    const status = searchParams.get("status");

    await connectToDatabase();

    // Build query
    const filter: Record<string, string> = { userId: userId };

    if (status) {
      filter.status = status;
    }

    // Count total for pagination
    const total = await Listing.countDocuments(filter);

    // Get listings
    const listings = await Listing.find(filter)
      .populate("user", "name profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get stats about listings
    const stats = {
      active: await Listing.countDocuments({
        userId: userId,
        status: "active",
      }),
      inactive: await Listing.countDocuments({
        userId: userId,
        status: "inactive",
      }),
      traded: await Listing.countDocuments({
        userId: userId,
        status: "traded",
      }),
      total: await Listing.countDocuments({ userId: userId }),
    };

    return NextResponse.json(
      {
        listings,
        stats,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error fetching my listings:", error);
    return NextResponse.json(
      { error: "Failed to fetch listings" },
      { status: 500, headers: corsHeaders }
    );
  }
}
