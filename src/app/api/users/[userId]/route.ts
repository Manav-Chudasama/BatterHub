import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * OPTIONS /api/users/[userId]
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
 * GET /api/users/[userId]
 * Get a specific user by their Clerk userId
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    await connectToDatabase();

    const user = await User.findOne({ userId }).select("-password");

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(user, { headers: corsHeaders });
  } catch (error) {
    console.error(`Error fetching user ${params.userId}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * PUT /api/users/[userId]
 * Update a specific user's profile information
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const body = await request.json();

    await connectToDatabase();

    // Security: Don't allow updating sensitive fields through this endpoint
    delete body.userId; // Can't change the ID
    delete body.email; // Email changes should be handled by Clerk
    delete body.password; // Password changes should have a dedicated endpoint with proper hashing

    // Update user data
    const user = await User.findOneAndUpdate(
      { userId },
      { $set: body },
      { new: true }
    ).select("-password");

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(user, { headers: corsHeaders });
  } catch (error) {
    console.error(`Error updating user ${params.userId}:`, error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * DELETE /api/users/[userId]
 * Delete a specific user (primarily handled through Clerk webhook)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    await connectToDatabase();

    const user = await User.findOneAndDelete({ userId });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error(`Error deleting user ${params.userId}:`, error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500, headers: corsHeaders }
    );
  }
}
