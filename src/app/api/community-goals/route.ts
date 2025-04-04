import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/mongodb";
import CommunityGoal from "@/models/CommunityGoal";
import User from "@/models/User";

// Define types for tasks
interface TaskInput {
  taskName: string;
  taskType: "Skill" | "Item" | "Time";
  description?: string;
  quantityNeeded?: number;
  contributionPercentage?: number;
}

interface Task {
  taskName: string;
  taskType: "Skill" | "Item" | "Time";
  description: string;
  quantityNeeded: number;
  quantityFulfilled: number;
  contributionPercentage: number;
}

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * OPTIONS /api/community-goals
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
 * GET /api/community-goals
 * Get all community goals with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const goalType = searchParams.get("goalType");
    const category = searchParams.get("category");
    const sort = searchParams.get("sort") || "latest";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    await connectToDatabase();

    // Build query
    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (goalType) {
      query.goalType = goalType;
    }

    if (category) {
      query.category = category;
    }

    // Sort options
    let sortOption = {};
    switch (sort) {
      case "latest":
        sortOption = { createdAt: -1 };
        break;
      case "progress":
        sortOption = { totalProgress: -1 };
        break;
      case "alphabetical":
        sortOption = { title: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // Execute query with pagination
    const goals = await CommunityGoal.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name profilePicture")
      .lean();

    // Count total goals for pagination info
    const totalGoals = await CommunityGoal.countDocuments(query);

    return NextResponse.json(
      {
        goals,
        pagination: {
          total: totalGoals,
          pages: Math.ceil(totalGoals / limit),
          page,
          limit,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error fetching community goals:", error);
    return NextResponse.json(
      { error: "Failed to fetch community goals" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * POST /api/community-goals
 * Create a new community goal
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

    const body = await request.json();

    // Validate required fields
    const requiredFields = ["title", "description", "goalType"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400, headers: corsHeaders }
        );
      }
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

    // Process tasks if provided
    let tasks: Task[] = [];
    if (body.tasks && Array.isArray(body.tasks) && body.tasks.length > 0) {
      // Validate each task
      for (const task of body.tasks as TaskInput[]) {
        if (!task.taskName || !task.taskType) {
          return NextResponse.json(
            { error: "All tasks must have a name and type" },
            { status: 400, headers: corsHeaders }
          );
        }

        // Ensure task has all required fields with defaults if not provided
        tasks.push({
          taskName: task.taskName,
          taskType: task.taskType,
          description: task.description || "",
          quantityNeeded: task.quantityNeeded || 1,
          quantityFulfilled: 0,
          contributionPercentage: task.contributionPercentage || 5,
        });
      }
    } else {
      // If no tasks provided, create default tasks based on goalType
      if (body.goalType === "Skill") {
        tasks = [
          {
            taskName: "Offer your skills",
            taskType: "Skill",
            description: "Contribute your expertise to help achieve this goal",
            quantityNeeded: 5,
            quantityFulfilled: 0,
            contributionPercentage: 20,
          },
          {
            taskName: "Volunteer your time",
            taskType: "Time",
            description: "Dedicate hours to help with this initiative",
            quantityNeeded: 20, // Hours
            quantityFulfilled: 0,
            contributionPercentage: 20,
          },
        ];
      } else if (body.goalType === "Item") {
        tasks = [
          {
            taskName: "Donate items",
            taskType: "Item",
            description: "Contribute physical items to the goal",
            quantityNeeded: 10,
            quantityFulfilled: 0,
            contributionPercentage: 30,
          },
          {
            taskName: "Help with organization",
            taskType: "Time",
            description: "Help organize and manage the donated items",
            quantityNeeded: 15, // Hours
            quantityFulfilled: 0,
            contributionPercentage: 20,
          },
        ];
      }
    }

    // Create community goal
    const goalData = {
      ...body,
      tasks,
      createdBy: user._id,
      // Use user's location if available and not provided in request
      location: body.location || user.location,
    };

    const goal = new CommunityGoal(goalData);
    await goal.save();

    return NextResponse.json(
      {
        message: "Community goal created successfully",
        goal,
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error creating community goal:", error);
    return NextResponse.json(
      { error: "Failed to create community goal" },
      { status: 500, headers: corsHeaders }
    );
  }
}
