import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/mongodb";
import CommunityGoal from "@/models/CommunityGoal";
import User from "@/models/User";
import mongoose from "mongoose";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * OPTIONS /api/community-goals/[goalId]/contribute
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
 * POST /api/community-goals/[goalId]/contribute
 * Add a contribution to a community goal
 */
export async function POST(
  request: NextRequest,
  context: { params: { goalId: string } }
) {
  try {
    const { goalId } = context.params;
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

    const body = await request.json();

    // Validate contribution data
    if (!body.contributionType) {
      return NextResponse.json(
        { error: "Contribution type is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate required fields based on contribution type
    if (body.contributionType === "Skill" && !body.details?.skillType) {
      return NextResponse.json(
        { error: "Skill type is required for skill contributions" },
        { status: 400, headers: corsHeaders }
      );
    } else if (body.contributionType === "Item" && !body.details?.itemName) {
      return NextResponse.json(
        { error: "Item name is required for item donations" },
        { status: 400, headers: corsHeaders }
      );
    } else if (
      body.contributionType === "Time" &&
      !body.details?.hoursCommitted
    ) {
      return NextResponse.json(
        { error: "Hours committed is required for time contributions" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate task ID if provided
    if (body.taskId && !mongoose.Types.ObjectId.isValid(body.taskId)) {
      return NextResponse.json(
        { error: "Invalid task ID format" },
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

    // Define interfaces for type safety
    interface Task {
      _id: mongoose.Types.ObjectId;
      contributionPercentage: number;
      quantityNeeded: number;
      quantityFulfilled: number;
      contributions?: string[];
    }

    interface Contribution {
      _id?: mongoose.Types.ObjectId;
      userId: string;
      taskId?: string;
      percentage: number;
    }

    // Check if goal is active
    if (goal.status !== "Active") {
      return NextResponse.json(
        { error: "Cannot contribute to a non-active goal" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Calculate percentage based on contribution weight and type
    let contributionPercentage = 5; // Default percentage
    let selectedTask: Task | null = null;

    // If contributing to a specific task, use that task's contribution percentage
    if (body.taskId) {
      const task = goal.tasks.find(
        (task: Task) => task._id.toString() === body.taskId
      );
      if (task) {
        selectedTask = task;
        contributionPercentage = task.contributionPercentage;

        // Update the task's fulfilled quantity
        if (body.contributionType === "Item") {
          const quantity = body.details?.quantity || 1;
          task.quantityFulfilled = Math.min(
            task.quantityNeeded,
            task.quantityFulfilled + quantity
          );
        } else if (body.contributionType === "Time") {
          const hoursCommitted = body.details?.hoursCommitted || 1;
          // Assuming 1 hour = 1 quantity for time-based tasks
          task.quantityFulfilled = Math.min(
            task.quantityNeeded,
            task.quantityFulfilled + hoursCommitted
          );
        } else {
          // For skills, increment by 1
          task.quantityFulfilled = Math.min(
            task.quantityNeeded,
            task.quantityFulfilled + 1
          );
        }

        // Initialize contributions array if it doesn't exist yet
        if (!task.contributions) {
          task.contributions = [];
        }

        // We'll add the contribution ID after we create the contribution
      }
    } else {
      // If not tied to a specific task, scale percentage based on contribution type
      if (body.contributionType === "Item") {
        contributionPercentage = Math.min(
          (body.details?.quantity || 1) * 2,
          20
        );
      } else if (body.contributionType === "Time") {
        contributionPercentage = Math.min(
          (body.details?.hoursCommitted || 1) * 3,
          25
        );
      } else if (body.contributionType === "Skill") {
        contributionPercentage = 15; // Skills are valued higher
      }
    }

    // Cap at 25% for a single contribution
    contributionPercentage = Math.min(contributionPercentage, 25);

    // Process proof of contribution files if provided
    const proofOfContribution = [];
    if (body.proofOfContribution && Array.isArray(body.proofOfContribution)) {
      for (const proof of body.proofOfContribution) {
        if (proof.fileType && proof.fileUrl) {
          proofOfContribution.push({
            fileType: proof.fileType,
            fileUrl: proof.fileUrl,
            uploadedAt: new Date(),
          });
        }
      }
    }

    // Prepare the contribution data
    const contributionData = {
      user: user._id,
      userId: userId,
      contributionType: body.contributionType,
      taskId: body.taskId || null,
      details: body.details || {},
      proofOfContribution: proofOfContribution,
      verificationStatus: "Pending",
      percentage: contributionPercentage,
      createdAt: new Date(),
    };

    // Check if user has already contributed to this specific task
    let existingContributionIndex = -1;
    if (body.taskId) {
      existingContributionIndex = goal.contributions.findIndex(
        (c: Contribution) => c.userId === userId && c.taskId === body.taskId
      );
    } else {
      // If no task ID, just check for any contribution by this user
      existingContributionIndex = goal.contributions.findIndex(
        (c: Contribution) => c.userId === userId
      );
    }

    let contributionId: string | null = null;

    if (existingContributionIndex >= 0) {
      // Update existing contribution
      goal.contributions[existingContributionIndex] = {
        ...goal.contributions[existingContributionIndex],
        ...contributionData,
      };
      contributionId =
        goal.contributions[existingContributionIndex]._id.toString();
    } else {
      // Add new contribution
      goal.contributions.push(contributionData);
      // Get the ID of the newly added contribution
      contributionId =
        goal.contributions[goal.contributions.length - 1]._id.toString();
    }

    // If we're working with a task, add the contribution ID to the task's contributions array
    if (selectedTask && contributionId) {
      // Make sure we don't duplicate entries
      if (!selectedTask.contributions) {
        selectedTask.contributions = [];
      }

      if (!selectedTask.contributions.includes(contributionId)) {
        selectedTask.contributions.push(contributionId);
        console.log(
          `Added contribution ${contributionId} to task's contributions array`
        );
      }
    }

    // Recalculate total progress
    // This could be enhanced to use the task completion percentages
    const totalProgress = Math.min(
      goal.contributions.reduce(
        (total: number, c: Contribution) => total + c.percentage,
        0
      ),
      100
    );
    goal.totalProgress = totalProgress;

    // Check if goal has been completed
    if (totalProgress >= 100 && goal.status !== "Completed") {
      goal.status = "Completed";
    }

    await goal.save();

    // Populate user data for response
    const populatedGoal = await CommunityGoal.findById(goalId)
      .populate("createdBy", "name profilePicture userId")
      .populate({
        path: "contributions.user",
        select: "name profilePicture",
      })
      .populate({
        path: "contributions.comments.user",
        select: "name profilePicture userId",
      });

    return NextResponse.json(
      {
        message: "Contribution added successfully",
        goal: populatedGoal,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    const { goalId } = context.params;
    console.error(`Error contributing to goal ${goalId}:`, error);
    return NextResponse.json(
      { error: "Failed to add contribution" },
      { status: 500, headers: corsHeaders }
    );
  }
}
