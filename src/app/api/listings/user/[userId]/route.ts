import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Listing from "@/models/Listing";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * OPTIONS /api/listings/user/[userId]
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
 * GET /api/listings/user/[userId]
 * Get listings for a specific user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    await connectToDatabase();

    // Build query
    const query: Record<string, unknown> = { userId };

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // Find all listings for the user
    const listings = await Listing.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json(
      {
        listings,
        count: listings.length,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error fetching user listings:", error);
    return NextResponse.json(
      { error: "Failed to fetch user listings" },
      { status: 500, headers: corsHeaders }
    );
  }
}
