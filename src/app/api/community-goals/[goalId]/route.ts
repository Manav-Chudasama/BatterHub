import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/mongodb";
import CommunityGoal from "@/models/CommunityGoal";
import mongoose from "mongoose";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Define update types
interface GoalUpdate {
  title?: string;
  description?: string;
  status?: string;
  imageUrl?: string;
  category?: string;
  targetAmount?: number;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  updatedAt: Date;
  [key: string]: any; // Add index signature
}

/**
 * OPTIONS /api/community-goals/[goalId]
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
 * GET /api/community-goals/[goalId]
 * Get a specific community goal by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  try {
    const { goalId } = await params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(goalId)) {
      return NextResponse.json(
        { error: "Invalid goal ID format" },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectToDatabase();

    // Find the goal and populate creator data
    const goal = await CommunityGoal.findById(goalId)
      .populate({
        path: "createdBy",
        select: "name profilePicture location userId",
      })
      .populate({
        path: "contributions.user",
        select: "name profilePicture",
      })
      .populate({
        path: "contributions.comments.user",
        select: "name profilePicture userId",
      })
      .lean();

    if (!goal) {
      return NextResponse.json(
        { error: "Community goal not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json({ goal }, { headers: corsHeaders });
  } catch (error) {
    const { goalId } = await params;
    console.error(`Error fetching community goal ${goalId}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch community goal" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * PUT /api/community-goals/[goalId]
 * Update a specific community goal
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  try {
    const { goalId } = await params;
    const { userId } = getAuth(request);

    // Check authentication
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(goalId)) {
      return NextResponse.json(
        { error: "Invalid goal ID format" },
        { status: 400, headers: corsHeaders }
      );
    }

    const body = (await request.json()) as Partial<GoalUpdate>;

    await connectToDatabase();

    // Find the goal
    const goal = await CommunityGoal.findById(goalId).populate(
      "createdBy",
      "userId"
    );

    if (!goal) {
      return NextResponse.json(
        { error: "Community goal not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if the authenticated user is the creator of the goal
    if (goal.createdBy.userId !== userId) {
      return NextResponse.json(
        { error: "You don't have permission to update this goal" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Update allowed fields
    const allowedUpdates = [
      "title",
      "description",
      "status",
      "imageUrl",
      "category",
      "targetAmount",
      "location",
    ];

    const updates: GoalUpdate = {
      updatedAt: new Date(),
    };

    for (const field of allowedUpdates) {
      if (field in body) {
        updates[field as keyof GoalUpdate] = body[field];
      }
    }

    // Update the goal
    const updatedGoal = await CommunityGoal.findByIdAndUpdate(
      goalId,
      { $set: updates },
      { new: true }
    )
      .populate("createdBy", "name profilePicture")
      .populate({
        path: "contributions.user",
        select: "name profilePicture",
      });

    return NextResponse.json(updatedGoal, { headers: corsHeaders });
  } catch (error) {
    const { goalId } = await params;
    console.error(`Error updating community goal ${goalId}:`, error);
    return NextResponse.json(
      { error: "Failed to update community goal" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * DELETE /api/community-goals/[goalId]
 * Delete a specific community goal
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  try {
    const { goalId } = await params;
    const { userId } = getAuth(request);

    // Check authentication
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(goalId)) {
      return NextResponse.json(
        { error: "Invalid goal ID format" },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectToDatabase();

    // Find the goal
    const goal = await CommunityGoal.findById(goalId).populate(
      "createdBy",
      "userId"
    );

    if (!goal) {
      return NextResponse.json(
        { error: "Community goal not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if the authenticated user is the creator of the goal
    if (goal.createdBy.userId !== userId) {
      return NextResponse.json(
        { error: "You don't have permission to delete this goal" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Delete the goal
    await CommunityGoal.findByIdAndDelete(goalId);

    return NextResponse.json(
      { message: "Community goal deleted successfully" },
      { headers: corsHeaders }
    );
  } catch (error) {
    const { goalId } = await params;
    console.error(`Error deleting community goal ${goalId}:`, error);
    return NextResponse.json(
      { error: "Failed to delete community goal" },
      { status: 500, headers: corsHeaders }
    );
  }
}
