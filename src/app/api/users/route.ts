import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * OPTIONS /api/users
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
 * GET /api/users
 * Get all users with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location");
    const skill = searchParams.get("skill");
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    // Connect to the database
    await connectToDatabase();

    // Build query based on parameters
    const query: Record<string, any> = {};
    if (location) query.location = { $regex: location, $options: "i" };
    if (skill) query.skills = { $in: [skill] };

    // Get total count for pagination
    const total = await User.countDocuments(query);

    // Get users with pagination
    const users = await User.find(query)
      .select("-password") // Exclude password
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return NextResponse.json(
      {
        users,
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
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * POST /api/users
 * Create a new user
 * Note: This is primarily for testing as users are typically created through Clerk webhooks
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: body.email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Create new user
    const user = new User(body);
    await user.save();

    // Don't return the password
    const userResponse = user.toObject();
    delete userResponse.password;

    return NextResponse.json(userResponse, {
      status: 201,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500, headers: corsHeaders }
    );
  }
}
