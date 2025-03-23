import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * OPTIONS /api/users/[userId]/notifications
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
 * GET /api/users/[userId]/notifications
 * Get a user's notifications with optional pagination and filtering
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { searchParams } = new URL(request.url);

    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Filter parameters
    const read = searchParams.get("read");
    const type = searchParams.get("type");

    await connectToDatabase();

    // Find the user
    const user = await User.findOne({ userId });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Build the filter
    const filter: Record<string, any> = {};
    if (read !== null) {
      filter.read = read === "true";
    }
    if (type) {
      filter.type = type;
    }

    // Get notifications array from user
    let notifications = user.notifications || [];

    // Apply filters if any
    if (Object.keys(filter).length > 0) {
      notifications = notifications.filter((notification: any) => {
        let match = true;
        if ("read" in filter)
          match = match && notification.read === filter.read;
        if ("type" in filter)
          match = match && notification.type === filter.type;
        return match;
      });
    }

    // Count total
    const total = notifications.length;

    // Apply pagination
    notifications = notifications.slice(skip, skip + limit);

    return NextResponse.json(
      {
        notifications,
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
    console.error(
      `Error fetching notifications for user ${params.userId}:`,
      error
    );
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * POST /api/users/[userId]/notifications
 * Add a new notification for a user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const body = await request.json();
    const { message, type, linkUrl, itemId } = body;

    // Validate the request body
    if (!message || !type) {
      return NextResponse.json(
        { error: "Message and type are required fields" },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectToDatabase();

    // Create notification object
    const notification = {
      _id: new mongoose.Types.ObjectId(),
      message,
      type,
      read: false,
      createdAt: new Date(),
      linkUrl: linkUrl || null,
      itemId: itemId || null,
    };

    // Add notification to user
    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { $push: { notifications: { $each: [notification], $position: 0 } } },
      { new: true }
    ).select("notifications");

    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(notification, {
      status: 201,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error(
      `Error adding notification for user ${params.userId}:`,
      error
    );
    return NextResponse.json(
      { error: "Failed to add notification" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * PUT /api/users/[userId]/notifications/mark-read
 * Mark notifications as read
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const url = new URL(request.url);
    const path = url.pathname;

    // Check if this is the mark-read endpoint
    if (path.endsWith("/mark-read")) {
      const body = await request.json();
      const { notificationIds, all } = body;

      await connectToDatabase();

      let updatedUser;

      // Mark all as read
      if (all === true) {
        updatedUser = await User.findOneAndUpdate(
          { userId },
          { $set: { "notifications.$[].read": true } },
          { new: true }
        ).select("notifications");
      }
      // Mark specific notifications as read
      else if (Array.isArray(notificationIds) && notificationIds.length > 0) {
        // Convert string IDs to ObjectIds if needed
        const objectIds = notificationIds.map((id) =>
          typeof id === "string" ? new mongoose.Types.ObjectId(id) : id
        );

        updatedUser = await User.findOneAndUpdate(
          { userId },
          { $set: { "notifications.$[elem].read": true } },
          {
            arrayFilters: [{ "elem._id": { $in: objectIds } }],
            new: true,
          }
        ).select("notifications");
      } else {
        return NextResponse.json(
          {
            error: "Either notificationIds array or all=true must be provided",
          },
          { status: 400, headers: corsHeaders }
        );
      }

      if (!updatedUser) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404, headers: corsHeaders }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "Notifications marked as read",
        },
        { headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { error: "Invalid endpoint" },
      { status: 400, headers: corsHeaders }
    );
  } catch (error) {
    console.error(
      `Error updating notifications for user ${params.userId}:`,
      error
    );
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * DELETE /api/users/[userId]/notifications/[notificationId]
 * Delete a specific notification
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string; notificationId?: string } }
) {
  try {
    const { userId } = params;
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const notificationId = pathParts[pathParts.length - 1];

    // Validate the notification ID
    if (!notificationId || notificationId === "notifications") {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectToDatabase();

    // Remove the notification
    const updatedUser = await User.findOneAndUpdate(
      { userId },
      {
        $pull: {
          notifications: { _id: new mongoose.Types.ObjectId(notificationId) },
        },
      },
      { new: true }
    ).select("notifications");

    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Notification deleted",
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error(
      `Error deleting notification for user ${params.userId}:`,
      error
    );
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500, headers: corsHeaders }
    );
  }
}
