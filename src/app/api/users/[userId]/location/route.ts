import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * OPTIONS /api/users/[userId]/location
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
 * GET /api/users/[userId]/location
 * Get a user's location data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    await connectToDatabase();

    const user = await User.findOne({ userId }).select("location");

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Return location data or default empty object
    return NextResponse.json(user.location || {}, { headers: corsHeaders });
  } catch (error) {
    console.error(`Error fetching location for user ${params.userId}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch location data" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * PUT /api/users/[userId]/location
 * Update a user's location data
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const locationData = await request.json();

    // Validate the request body
    if (!locationData || typeof locationData !== "object") {
      return NextResponse.json(
        { error: "Location data must be a valid object" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate required fields
    if ("coordinates" in locationData) {
      const { coordinates } = locationData;
      if (
        !Array.isArray(coordinates) ||
        coordinates.length !== 2 ||
        typeof coordinates[0] !== "number" ||
        typeof coordinates[1] !== "number"
      ) {
        return NextResponse.json(
          {
            error:
              "Coordinates must be an array of two numbers [longitude, latitude]",
          },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // Optional validation for city, state, country
    if ("city" in locationData && typeof locationData.city !== "string") {
      return NextResponse.json(
        { error: "City must be a string" },
        { status: 400, headers: corsHeaders }
      );
    }

    if ("state" in locationData && typeof locationData.state !== "string") {
      return NextResponse.json(
        { error: "State must be a string" },
        { status: 400, headers: corsHeaders }
      );
    }

    if ("country" in locationData && typeof locationData.country !== "string") {
      return NextResponse.json(
        { error: "Country must be a string" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (
      "postalCode" in locationData &&
      typeof locationData.postalCode !== "string"
    ) {
      return NextResponse.json(
        { error: "Postal code must be a string" },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectToDatabase();

    // Create GeoJSON point if coordinates are provided
    let locationUpdate: Record<string, any> = {};

    if ("coordinates" in locationData) {
      // Ensure coordinates are in GeoJSON format [longitude, latitude]
      locationUpdate = {
        "location.coordinates": locationData.coordinates,
        "location.type": "Point",
      };
      delete locationData.coordinates;
    }

    // Add other location fields
    for (const [key, value] of Object.entries(locationData)) {
      if (key !== "coordinates" && key !== "type") {
        locationUpdate[`location.${key}`] = value;
      }
    }

    // Update the user's location
    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { $set: locationUpdate },
      { new: true }
    ).select("location");

    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(updatedUser.location, { headers: corsHeaders });
  } catch (error) {
    console.error(`Error updating location for user ${params.userId}:`, error);
    return NextResponse.json(
      { error: "Failed to update location data" },
      { status: 500, headers: corsHeaders }
    );
  }
}
