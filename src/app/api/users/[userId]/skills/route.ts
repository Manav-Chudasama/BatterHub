import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Define interfaces for MongoDB operations
interface SkillsUpdateData {
  skills?: string[];
  interests?: string[];
  $addToSet?: {
    skills?: string | { $each: string[] };
    interests?: string | { $each: string[] };
  };
  $pull?: {
    skills?: string;
    interests?: string;
  };
}

/**
 * OPTIONS /api/users/[userId]/skills
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
 * GET /api/users/[userId]/skills
 * Get a user's skills and interests
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    await connectToDatabase();

    const user = await User.findOne({ userId }).select("skills interests");

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        skills: user.skills || [],
        interests: user.interests || [],
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error(`Error fetching skills for user ${params.userId}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch skills and interests" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * PUT /api/users/[userId]/skills
 * Update a user's skills and interests
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const body = await request.json();
    const { skills, interests } = body;

    // Validate the request body
    if (skills === undefined && interests === undefined) {
      return NextResponse.json(
        { error: "At least one of skills or interests must be provided" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Create update object
    const updateData: SkillsUpdateData = {};
    if (Array.isArray(skills)) {
      updateData.skills = skills;
    }
    if (Array.isArray(interests)) {
      updateData.interests = interests;
    }

    await connectToDatabase();

    // Update the user
    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true }
    ).select("skills interests");

    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        skills: updatedUser.skills,
        interests: updatedUser.interests,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error(`Error updating skills for user ${params.userId}:`, error);
    return NextResponse.json(
      { error: "Failed to update skills and interests" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * POST /api/users/[userId]/skills
 * Add skills or interests to a user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const body = await request.json();
    const { skill, interest, skills, interests } = body;

    // Validate the request body
    if (!skill && !interest && !skills && !interests) {
      return NextResponse.json(
        { error: "At least one skill or interest must be provided" },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectToDatabase();

    // Create update object
    const updateData: SkillsUpdateData = {};

    // Handle single additions
    if (skill) {
      updateData.$addToSet = { ...updateData.$addToSet, skills: skill };
    }
    if (interest) {
      updateData.$addToSet = { ...updateData.$addToSet, interests: interest };
    }

    // Handle multiple additions
    if (Array.isArray(skills) && skills.length > 0) {
      updateData.$addToSet = {
        ...updateData.$addToSet,
        skills: { $each: skills },
      };
    }
    if (Array.isArray(interests) && interests.length > 0) {
      updateData.$addToSet = {
        ...updateData.$addToSet,
        interests: { $each: interests },
      };
    }

    // Update the user
    const updatedUser = await User.findOneAndUpdate({ userId }, updateData, {
      new: true,
    }).select("skills interests");

    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        skills: updatedUser.skills,
        interests: updatedUser.interests,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error(`Error adding skills for user ${params.userId}:`, error);
    return NextResponse.json(
      { error: "Failed to add skills or interests" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * DELETE /api/users/[userId]/skills
 * Remove specific skills or interests from a user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { searchParams } = new URL(request.url);
    const skill = searchParams.get("skill");
    const interest = searchParams.get("interest");

    // Validate the request
    if (!skill && !interest) {
      return NextResponse.json(
        { error: "Either skill or interest query parameter must be provided" },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectToDatabase();

    // Create update object
    const updateData: SkillsUpdateData = {};

    if (skill) {
      updateData.$pull = { ...updateData.$pull, skills: skill };
    }
    if (interest) {
      updateData.$pull = { ...updateData.$pull, interests: interest };
    }

    // Update the user
    const updatedUser = await User.findOneAndUpdate({ userId }, updateData, {
      new: true,
    }).select("skills interests");

    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        skills: updatedUser.skills,
        interests: updatedUser.interests,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error(
      `Error removing skill/interest for user ${params.userId}:`,
      error
    );
    return NextResponse.json(
      { error: "Failed to remove skill or interest" },
      { status: 500, headers: corsHeaders }
    );
  }
}
