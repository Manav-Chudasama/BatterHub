import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Define interface for user preferences and updates
interface UserPreferences {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  theme?: "light" | "dark" | "system";
  [key: string]: boolean | string | number | object | undefined;
}

// Type for MongoDB update operations on preferences fields
type PreferenceUpdateData = {
  [key: string]: boolean | string | number | object;
};

/**
 * OPTIONS /api/users/[userId]/preferences
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
 * GET /api/users/[userId]/preferences
 * Get a user's preferences
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    await connectToDatabase();

    const user = await User.findOne({ userId }).select("preferences");

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Return preferences or default empty object
    return NextResponse.json(user.preferences || {}, { headers: corsHeaders });
  } catch (error) {
    const { userId } = await params;
    console.error(`Error fetching preferences for user ${userId}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * PUT /api/users/[userId]/preferences
 * Update a user's preferences
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const preferences = (await request.json()) as UserPreferences;

    // Validate the request body
    if (!preferences || typeof preferences !== "object") {
      return NextResponse.json(
        { error: "Preferences must be a valid object" },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectToDatabase();

    // Validation for specific preference types
    if (
      preferences.emailNotifications !== undefined &&
      typeof preferences.emailNotifications !== "boolean"
    ) {
      return NextResponse.json(
        { error: "emailNotifications must be a boolean" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (
      preferences.pushNotifications !== undefined &&
      typeof preferences.pushNotifications !== "boolean"
    ) {
      return NextResponse.json(
        { error: "pushNotifications must be a boolean" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (
      preferences.theme !== undefined &&
      !["light", "dark", "system"].includes(preferences.theme)
    ) {
      return NextResponse.json(
        { error: "theme must be one of: light, dark, system" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Update specific fields only, not replacing the entire preferences object
    const updateData: PreferenceUpdateData = {};

    for (const [key, value] of Object.entries(preferences)) {
      updateData[`preferences.${key}`] = value as
        | boolean
        | string
        | number
        | object;
    }

    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true }
    ).select("preferences");

    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(updatedUser.preferences, { headers: corsHeaders });
  } catch (error) {
    const { userId } = await params;
    console.error(`Error updating preferences for user ${userId}:`, error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500, headers: corsHeaders }
    );
  }
}
