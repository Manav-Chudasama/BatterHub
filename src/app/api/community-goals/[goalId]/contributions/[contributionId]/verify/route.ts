import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/mongodb";
import CommunityGoal from "@/models/CommunityGoal";
import User from "@/models/User";
import mongoose from "mongoose";

// Define interfaces for goal components
interface Task {
  _id: mongoose.Types.ObjectId | string;
  quantityFulfilled: number;
  contributions?: (mongoose.Types.ObjectId | string | TaskContribution)[];
}

interface Comment {
  user: mongoose.Types.ObjectId | string;
  userId: string;
  comment: string;
  createdAt: Date;
}

interface Contribution {
  _id: mongoose.Types.ObjectId | string;
  taskId?: string;
  percentage?: number;
  contributionType?: "Skill" | "Item" | "Time";
  details?: {
    quantity?: number;
    hoursCommitted?: number;
  };
  verificationStatus?: string;
  verifiedBy?: mongoose.Types.ObjectId | string;
  verificationDate?: Date;
  verificationNotes?: string;
  comments?: Comment[];
}

// Type for task contribution - could be an ObjectId, string, or object with _id
type TaskContribution = {
  _id?: mongoose.Types.ObjectId | string;
  toString(): string;
};

// Union type for all possible contribution reference types
type ContributionRef = mongoose.Types.ObjectId | string | TaskContribution;

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * OPTIONS /api/community-goals/[goalId]/contributions/[contributionId]/verify
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
 * POST /api/community-goals/[goalId]/contributions/[contributionId]/verify
 * Verify (approve or reject) a contribution
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { goalId: string; contributionId: string } }
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

    // Validate verification status
    if (
      !body.verificationStatus ||
      !["Approved", "Rejected"].includes(body.verificationStatus)
    ) {
      return NextResponse.json(
        {
          error: "Valid verification status (Approved or Rejected) is required",
        },
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
        { error: "Only the goal creator can verify contributions" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Find the contribution
    const contributionIndex = goal.contributions.findIndex(
      (c: Contribution) => c._id.toString() === contributionId
    );

    if (contributionIndex === -1) {
      return NextResponse.json(
        { error: "Contribution not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    if (body.verificationStatus === "Approved") {
      // Update verification details for approved contribution
      goal.contributions[contributionIndex].verificationStatus = "Approved";
      goal.contributions[contributionIndex].verifiedBy = user._id;
      goal.contributions[contributionIndex].verificationDate = new Date();

      if (body.verificationNotes) {
        goal.contributions[contributionIndex].verificationNotes =
          body.verificationNotes;
      }
    } else if (body.verificationStatus === "Rejected") {
      // Capture contribution details before removing it
      const rejectedContribution = goal.contributions[
        contributionIndex
      ] as Contribution;
      const contributionPercentage = rejectedContribution.percentage || 0;

      // Remove contribution's percentage from the total progress
      goal.totalProgress = Math.max(
        0,
        goal.totalProgress - contributionPercentage
      );

      // If contribution was for a specific task, adjust that task's fulfilled quantity
      const taskId = rejectedContribution.taskId;
      if (taskId) {
        const taskIndex = goal.tasks.findIndex(
          (t: Task) => t._id.toString() === taskId
        );
        if (taskIndex !== -1) {
          console.log(`Removing rejected contribution from task ${taskId}`);

          // Adjust quantity based on contribution type
          if (
            rejectedContribution.contributionType === "Item" &&
            rejectedContribution.details?.quantity
          ) {
            goal.tasks[taskIndex].quantityFulfilled = Math.max(
              0,
              goal.tasks[taskIndex].quantityFulfilled -
                rejectedContribution.details.quantity
            );
            console.log(
              `Reduced Item quantity by ${rejectedContribution.details.quantity}. New value: ${goal.tasks[taskIndex].quantityFulfilled}`
            );
          } else if (
            rejectedContribution.contributionType === "Time" &&
            rejectedContribution.details?.hoursCommitted
          ) {
            goal.tasks[taskIndex].quantityFulfilled = Math.max(
              0,
              goal.tasks[taskIndex].quantityFulfilled -
                rejectedContribution.details.hoursCommitted
            );
            console.log(
              `Reduced Time hours by ${rejectedContribution.details.hoursCommitted}. New value: ${goal.tasks[taskIndex].quantityFulfilled}`
            );
          } else {
            // For skills, decrement by 1
            goal.tasks[taskIndex].quantityFulfilled = Math.max(
              0,
              goal.tasks[taskIndex].quantityFulfilled - 1
            );
            console.log(
              `Reduced Skill contribution by 1. New value: ${goal.tasks[taskIndex].quantityFulfilled}`
            );
          }

          // If the task has a contributions array itself, remove this contribution from there too
          if (goal.tasks[taskIndex].contributions) {
            goal.tasks[taskIndex].contributions = goal.tasks[
              taskIndex
            ].contributions.filter((c: ContributionRef) => {
              const cStr = c.toString();
              // Check if it's a string or ObjectId
              if (
                typeof c === "string" ||
                c instanceof mongoose.Types.ObjectId
              ) {
                return cStr !== contributionId;
              }
              // Otherwise it's an object with possibly an _id field
              return (
                cStr !== contributionId &&
                (!c._id || c._id.toString() !== contributionId)
              );
            });
            console.log(`Removed contribution from task's contributions array`);
          }
        }
      }

      // Remove the rejected contribution from the goal's contributions array
      goal.contributions = goal.contributions.filter(
        (c: Contribution) => c._id.toString() !== contributionId
      );
      console.log(
        `Removed contribution ${contributionId} from goal's contributions array`
      );
    }

    // Add a comment if provided
    if (body.comment && body.verificationStatus === "Approved") {
      if (!goal.contributions[contributionIndex].comments) {
        goal.contributions[contributionIndex].comments = [];
      }

      goal.contributions[contributionIndex].comments.push({
        user: user._id,
        userId: userId,
        comment: body.comment,
        createdAt: new Date(),
      });
    }

    await goal.save();

    // Return the updated goal with populated data
    const updatedGoal = await CommunityGoal.findById(goalId)
      .populate({
        path: "createdBy",
        select: "name profilePicture userId",
      })
      .populate({
        path: "contributions.user",
        select: "name profilePicture",
      })
      .populate({
        path: "contributions.verifiedBy",
        select: "name profilePicture",
      })
      .populate({
        path: "contributions.comments.user",
        select: "name profilePicture userId",
      });

    return NextResponse.json(
      {
        message: `Contribution ${body.verificationStatus.toLowerCase()} successfully`,
        goal: updatedGoal,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    const { goalId, contributionId } = params;
    console.error(
      `Error verifying contribution ${contributionId} for goal ${goalId}:`,
      error
    );
    return NextResponse.json(
      { error: "Failed to verify contribution" },
      { status: 500, headers: corsHeaders }
    );
  }
}
