import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/mongodb";
import CommunityGoal from "@/models/CommunityGoal";
import User from "@/models/User";
import mongoose from "mongoose";

// Define types
interface Comment {
  user: mongoose.Types.ObjectId;
  userId: string;
  comment: string;
  createdAt: Date;
}

interface Contribution {
  _id?: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  userId?: string;
  comments?: Comment[];
  contributionType?: string;
  verificationStatus?: string;
  percentage?: number;
  createdAt?: Date;
  details?: Record<string, unknown>;
}

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * OPTIONS /api/community-goals/[goalId]/contributions/[contributionId]/comments
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
 * GET /api/community-goals/[goalId]/contributions/[contributionId]/comments
 * Get all comments for a specific contribution
 */
export async function GET(
  request: NextRequest,
  { params }: { params: any }
) {
  try {
    const { goalId, contributionId } = params;

    // Validate MongoDB ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(goalId) ||
      !mongoose.Types.ObjectId.isValid(contributionId)
    ) {
      return NextResponse.json(
        { error: "Invalid ID format" },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectToDatabase();

    // Find the goal and contribution
    const goal = await CommunityGoal.findById(goalId)
      .select("contributions")
      .populate({
        path: "contributions.comments.user",
        select: "name profilePicture",
      });

    if (!goal) {
      return NextResponse.json(
        { error: "Community goal not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Find the contribution
    const contribution = goal.contributions.find(
      (c: Contribution) => c._id && c._id.toString() === contributionId
    );

    if (!contribution) {
      return NextResponse.json(
        { error: "Contribution not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { comments: contribution.comments || [] },
      { headers: corsHeaders }
    );
  } catch (error) {
    const { goalId, contributionId } = params;
    console.error(
      `Error fetching comments for contribution ${contributionId} in goal ${goalId}:`,
      error
    );
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * POST /api/community-goals/[goalId]/contributions/[contributionId]/comments
 * Add a new comment to a contribution
 */
export async function POST(
  request: NextRequest,
  { params }: { params: any }
) {
  try {
    const { goalId, contributionId } = params;
    const { userId } = getAuth(request);

    // Check authentication
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Validate MongoDB ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(goalId) ||
      !mongoose.Types.ObjectId.isValid(contributionId)
    ) {
      return NextResponse.json(
        { error: "Invalid ID format" },
        { status: 400, headers: corsHeaders }
      );
    }

    const body = await request.json();

    // Validate comment text
    if (!body.comment || !body.comment.trim()) {
      return NextResponse.json(
        { error: "Comment text is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectToDatabase();

    // Find user in database
    const user = await User.findOne({ userId });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Find the goal
    const goal = await CommunityGoal.findById(goalId);

    if (!goal) {
      return NextResponse.json(
        { error: "Community goal not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Find the contribution
    const contributionIndex = goal.contributions.findIndex(
      (c: Contribution) => c._id && c._id.toString() === contributionId
    );

    if (contributionIndex === -1) {
      return NextResponse.json(
        { error: "Contribution not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Initialize comments array if it doesn't exist
    if (!goal.contributions[contributionIndex].comments) {
      goal.contributions[contributionIndex].comments = [];
    }

    // Add the new comment
    const newComment = {
      user: user._id,
      userId: userId,
      comment: body.comment.trim(),
      createdAt: new Date(),
    };

    goal.contributions[contributionIndex].comments.push(newComment);
    await goal.save();

    // Fetch the updated goal with fully populated data
    const updatedGoal = await CommunityGoal.findById(goalId);

    // Populate all the relevant user data
    await updatedGoal.populate([
      {
        path: "contributions.comments.user",
        select: "name profilePicture userId",
      },
      {
        path: "contributions.user",
        select: "name profilePicture",
      },
    ]);

    const updatedContribution = updatedGoal.contributions.find(
      (c: Contribution) => c._id && c._id.toString() === contributionId
    );

    return NextResponse.json(
      {
        message: "Comment added successfully",
        comments: updatedContribution?.comments || [],
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    const { goalId, contributionId } = params;
    console.error(
      `Error adding comment to contribution ${contributionId} in goal ${goalId}:`,
      error
    );
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500, headers: corsHeaders }
    );
  }
}
