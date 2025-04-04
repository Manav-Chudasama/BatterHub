import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/mongodb";
import CommunityGoal from "@/models/CommunityGoal";
import User from "@/models/User";
import mongoose from "mongoose";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * OPTIONS /api/community-goals/[goalId]/tasks
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
 * GET /api/community-goals/[goalId]/tasks
 * Get all tasks for a specific community goal
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { goalId: string } }
) {
  try {
    const { goalId } = params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(goalId)) {
      return NextResponse.json(
        { error: "Invalid goal ID format" },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectToDatabase();

    // Find the goal and return its tasks
    const goal = await CommunityGoal.findById(goalId).select("tasks").lean();

    if (!goal) {
      return NextResponse.json(
        { error: "Community goal not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { tasks: goal.tasks || [] },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error(`Error fetching tasks for goal ${params.goalId}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * POST /api/community-goals/[goalId]/tasks
 * Add a new task to a community goal
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { goalId: string } }
) {
  try {
    const { goalId } = params;
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

    // Validate required fields
    if (!body.taskName || !body.taskType) {
      return NextResponse.json(
        { error: "Task name and type are required" },
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
        { error: "You don't have permission to add tasks to this goal" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Create new task object with defaults for missing fields
    const newTask = {
      taskName: body.taskName,
      taskType: body.taskType,
      description: body.description || "",
      quantityNeeded: body.quantityNeeded || 1,
      quantityFulfilled: 0,
      contributionPercentage: body.contributionPercentage || 5,
    };

    // Add task to the goal
    goal.tasks.push(newTask);
    await goal.save();

    return NextResponse.json(
      {
        message: "Task added successfully",
        task: goal.tasks[goal.tasks.length - 1],
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error(`Error adding task to goal ${params.goalId}:`, error);
    return NextResponse.json(
      { error: "Failed to add task" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * PUT /api/community-goals/[goalId]/tasks
 * Update a task in a community goal
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { goalId: string } }
) {
  try {
    const { goalId } = params;
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

    // Validate task ID
    if (!body.taskId || !mongoose.Types.ObjectId.isValid(body.taskId)) {
      return NextResponse.json(
        { error: "Valid task ID is required" },
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
        { error: "You don't have permission to update tasks in this goal" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Find the task to update
    const taskIndex = goal.tasks.findIndex(
      (t) => t._id.toString() === body.taskId
    );

    if (taskIndex === -1) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Update allowed fields
    if (body.taskName) goal.tasks[taskIndex].taskName = body.taskName;
    if (body.taskType) goal.tasks[taskIndex].taskType = body.taskType;
    if (body.description !== undefined)
      goal.tasks[taskIndex].description = body.description;
    if (body.quantityNeeded)
      goal.tasks[taskIndex].quantityNeeded = body.quantityNeeded;
    if (body.contributionPercentage)
      goal.tasks[taskIndex].contributionPercentage =
        body.contributionPercentage;

    await goal.save();

    return NextResponse.json(
      {
        message: "Task updated successfully",
        task: goal.tasks[taskIndex],
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error(`Error updating task in goal ${params.goalId}:`, error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * DELETE /api/community-goals/[goalId]/tasks
 * Remove a task from a community goal
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { goalId: string } }
) {
  try {
    const { goalId } = params;
    const { userId } = getAuth(request);
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");

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

    // Validate task ID
    if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
      return NextResponse.json(
        { error: "Valid task ID is required" },
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
        { error: "You don't have permission to delete tasks from this goal" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Remove the task
    const taskIndex = goal.tasks.findIndex((t) => t._id.toString() === taskId);

    if (taskIndex === -1) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    goal.tasks.splice(taskIndex, 1);
    await goal.save();

    return NextResponse.json(
      { message: "Task deleted successfully" },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error(`Error deleting task from goal ${params.goalId}:`, error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500, headers: corsHeaders }
    );
  }
}
