import { NextRequest, NextResponse } from "next/server";
import { Webhook, WebhookRequiredHeaders } from "svix";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

// Define interfaces for Clerk webhook data
interface EmailAddress {
  id: string;
  email_address: string;
}

interface UserData {
  id: string;
  email_addresses: EmailAddress[];
  primary_email_address_id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  image_url?: string;
}

interface WebhookEvent {
  data: UserData;
  object: string;
  type: string;
}

// Configure CORS headers for the response
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, svix-id, svix-timestamp, svix-signature",
};

/**
 * OPTIONS /api/webhooks/clerk
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
 * GET /api/webhooks/clerk
 * Simple endpoint to check if the webhook route is working
 */
export async function GET() {
  return NextResponse.json(
    { message: "Clerk webhook endpoint is available" },
    { headers: corsHeaders }
  );
}

/**
 * POST /api/webhooks/clerk
 * Webhook handler for Clerk user events
 */
export async function POST(request: NextRequest) {
  console.log("Received Clerk webhook");

  try {
    // Get the webhook signature from the headers
    const headerPayload = request.headers;
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // If there's no signature, return an error
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return NextResponse.json(
        { error: "Missing svix headers" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get the webhook secret from the environment variables
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("Missing CLERK_WEBHOOK_SECRET env variable");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500, headers: corsHeaders }
      );
    }

    // Get the body
    const payload = await request.json();
    const body = JSON.stringify(payload);

    // Create a new Svix instance with the secret
    const wh = new Webhook(webhookSecret);

    // Create headers object for verification
    const svixHeaders = {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    } as WebhookRequiredHeaders;

    // Verify the webhook
    let evt: WebhookEvent;
    try {
      evt = wh.verify(body, svixHeaders) as WebhookEvent;
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return NextResponse.json(
        { error: "Error verifying webhook" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Handle the different event types
    const eventType = evt.type;
    const eventData = evt.data;

    try {
      switch (eventType) {
        case "user.created":
          await handleUserCreated(eventData);
          break;
        case "user.updated":
          await handleUserUpdated(eventData);
          break;
        case "user.deleted":
          await handleUserDeleted(eventData);
          break;
        default:
          console.log(`Unhandled event type: ${eventType}`);
      }

      return NextResponse.json({ success: true }, { headers: corsHeaders });
    } catch (error) {
      console.error(`Error handling ${eventType}:`, error);
      return NextResponse.json(
        { error: `Failed to process ${eventType}` },
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (err) {
    console.error("General webhook error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * Handle user.created event
 */
async function handleUserCreated(data: UserData) {
  const {
    id: userId,
    email_addresses,
    username,
    first_name,
    last_name,
    image_url,
  } = data;

  const primaryEmail = email_addresses.find(
    (email) => email.id === data.primary_email_address_id
  )?.email_address;

  if (!primaryEmail) {
    throw new Error("User has no primary email address");
  }

  // Check if user already exists (idempotency)
  const existingUser = await User.findOne({ userId });
  if (existingUser) {
    console.log(`User ${userId} already exists, skipping creation`);
    return;
  }

  // Create new user in MongoDB
  const newUser = new User({
    userId,
    name:
      username || `${first_name || ""} ${last_name || ""}`.trim() || "New User",
    email: primaryEmail,
    profilePicture: image_url,
    lastActive: new Date(),
  });

  await newUser.save();
  console.log(`Created new user in MongoDB with ID: ${userId}`);
}

/**
 * Handle user.updated event
 */
async function handleUserUpdated(data: UserData) {
  const {
    id: userId,
    email_addresses,
    username,
    first_name,
    last_name,
    image_url,
  } = data;

  const primaryEmail = email_addresses.find(
    (email) => email.id === data.primary_email_address_id
  )?.email_address;

  if (!primaryEmail) {
    throw new Error("User has no primary email address");
  }

  // Only update if user exists
  const updateResult = await User.findOneAndUpdate(
    { userId },
    {
      $set: {
        name:
          username ||
          `${first_name || ""} ${last_name || ""}`.trim() ||
          "New User",
        email: primaryEmail,
        profilePicture: image_url,
        lastActive: new Date(),
      },
    },
    { new: true }
  );

  if (!updateResult) {
    // If user doesn't exist, create them
    await handleUserCreated(data);
    return;
  }

  console.log(`Updated user in MongoDB with ID: ${userId}`);
}

/**
 * Handle user.deleted event
 */
async function handleUserDeleted(data: UserData) {
  const { id: userId } = data;

  // Delete the user from MongoDB
  const deleteResult = await User.findOneAndDelete({ userId });

  if (!deleteResult) {
    console.log(`User ${userId} not found, no deletion needed`);
    return;
  }

  console.log(`Deleted user from MongoDB with ID: ${userId}`);
}
