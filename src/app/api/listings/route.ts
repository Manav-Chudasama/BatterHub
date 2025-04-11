import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/mongodb";
import Listing from "@/models/Listing";
import User from "@/models/User";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Define filter query type
interface ListingFilter {
  status: string;
  category?: string;
  userId?: string;
  $text?: { $search: string };
  "location.city"?: { $regex: string; $options: string };
  location?: {
    $near: {
      $geometry: {
        type: string;
        coordinates: number[];
      };
      $maxDistance: number;
    };
  };
}

/**
 * OPTIONS /api/listings
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
 * GET /api/listings
 * Get all listings with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Filters
    const category = searchParams.get("category");
    const query = searchParams.get("query");
    const userId = searchParams.get("userId");
    const status = searchParams.get("status") || "active";
    const location = searchParams.get("location");
    const proximity = searchParams.get("proximity"); // in kilometers
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    await connectToDatabase();

    // Build query
    const filter: ListingFilter = { status };

    if (category) {
      filter.category = category;
    }

    if (userId) {
      filter.userId = userId;
    }

    // Text search
    if (query) {
      filter.$text = { $search: query };
    }

    // Location-based search
    if (location) {
      filter["location.city"] = { $regex: location, $options: "i" };
    }

    // Proximity search with coordinates
    if (lat && lng && proximity) {
      const radius = parseInt(proximity);
      filter.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: radius * 1000, // Convert to meters
        },
      };
    }

    // Count total for pagination
    const total = await Listing.countDocuments(filter);

    // Get listings
    const listings = await Listing.find(filter)
      .populate("user", "name profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json(
      {
        listings,
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
    console.error("Error fetching listings:", error);
    return NextResponse.json(
      { error: "Failed to fetch listings" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * POST /api/listings
 * Create a new listing
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);

    // Check authentication
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    const clerkUserId = userId;
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      "title",
      "description",
      "category",
      "tradePreferences",
      "availability",
    ];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // Validate availability is an array
    if (!Array.isArray(body.availability) || body.availability.length === 0) {
      return NextResponse.json(
        { error: "availability must be a non-empty array" },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectToDatabase();

    // Find the user in our database
    const user = await User.findOne({ userId: clerkUserId });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Create listing object
    const listingData = {
      ...body,
      userId: clerkUserId,
      user: user._id,
      status: "active",
    };

    // If user has location, use it for the listing if not provided
    if (!body.location && user.location) {
      listingData.location = {
        type: "Point",
        coordinates: user.location.coordinates,
        city: user.location.city,
        state: user.location.state,
        country: user.location.country,
      };
    }

    // Create and save the listing
    const listing = new Listing(listingData);
    await listing.save();

    return NextResponse.json(
      {
        message: "Listing created successfully",
        listing,
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error creating listing:", error);
    return NextResponse.json(
      { error: "Failed to create listing" },
      { status: 500, headers: corsHeaders }
    );
  }
}
