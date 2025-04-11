import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import Listing from "@/models/Listing";
import mongoose from "mongoose";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Interface for saved listing entry
interface SavedListing {
  _id: mongoose.Types.ObjectId;
}

// Interface for listing with MongoDB ID
interface ListingWithId {
  _id: mongoose.Types.ObjectId | string;
  [key: string]: unknown;
}

/**
 * OPTIONS /api/listings/recommended
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
 * GET /api/listings/recommended
 * Get recommended listings based on user interests and saved listings
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);

    // Return empty array if user is not authenticated
    if (!userId) {
      return NextResponse.json(
        { listings: [] },
        { status: 200, headers: corsHeaders }
      );
    }

    await connectToDatabase();

    // Find the user with their interests and saved listings
    const user = await User.findOne({ userId })
      .select("interests savedListings")
      .populate("savedListings", "_id");

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Extract user interests
    const userInterests = user.interests || [];

    // Get IDs of listings the user has already saved
    const savedListingIds = (user.savedListings || []).map(
      (listing: SavedListing) => listing._id
    );

    // Base query: active listings not owned by the user and not already saved
    const baseQuery = {
      status: "active",
      userId: { $ne: userId },
      _id: { $nin: savedListingIds },
    };

    // If user has interests, prioritize matching listings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let recommendations: any[] = [];

    if (userInterests.length > 0) {
      // Get listings matching user interests first
      const interestMatch = await Listing.find({
        ...baseQuery,
        $or: [
          // Match category to interests
          { category: { $in: userInterests } },
          // Full text search in title and description
          { $text: { $search: userInterests.join(" ") } },
        ],
      })
        .populate("user", "name profilePicture location")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean();

      recommendations = interestMatch;
    }

    // If we don't have enough recommendations from interests, get more recent listings
    if (recommendations.length < 6) {
      const neededListings = 6 - recommendations.length;
      const existingIds = recommendations.map((rec) => rec._id);

      const additionalListings = await Listing.find({
        ...baseQuery,
        _id: { $nin: [...savedListingIds, ...existingIds] },
      })
        .populate("user", "name profilePicture location")
        .sort({ createdAt: -1 })
        .limit(neededListings)
        .lean();

      recommendations = [...recommendations, ...additionalListings];
    }

    // By this point, we know the shape of our data is compatible with ListingWithId
    const typedRecommendations: ListingWithId[] = recommendations;

    return NextResponse.json(
      { listings: typedRecommendations },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error fetching recommended listings:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommended listings" },
      { status: 500, headers: corsHeaders }
    );
  }
}
