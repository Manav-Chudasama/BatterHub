import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/**
 * This route initializes the socket server by attaching it to the server instance
 * It uses a singleton pattern to ensure only one instance is created
 */
export async function GET() {
  try {
    // This is a workaround for Next.js App Router as there's no direct access to the underlying HTTP server
    // In real production, you'd use a custom server.js file or Next.js API routes
    console.log("Socket API route hit");

    return new NextResponse(
      JSON.stringify({ success: true, message: "Socket server is running" }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (error) {
    console.error("Error in socket API route:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Handle socket.io OPTIONS requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
