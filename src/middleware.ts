import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";
import { createRouteMatcher } from "@clerk/nextjs/server";

// This function handles CORS preflight requests
function corsMiddleware(request: NextRequest) {
  // Check if it's an API route
  const isApiRoute = request.nextUrl.pathname.startsWith("/api");

  // Only apply CORS to API routes
  if (isApiRoute) {
    // Handle OPTIONS method for CORS preflight requests
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization, X-Requested-With, svix-id, svix-timestamp, svix-signature",
          "Access-Control-Max-Age": "86400", // 24 hours
        },
      });
    }

    // For regular API requests, add CORS headers to the response
    const response = NextResponse.next();
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, svix-id, svix-timestamp, svix-signature"
    );

    return response;
  }

  // For non-API routes, continue without CORS headers
  return NextResponse.next();
}

// Define public routes
const isPublicRoute = createRouteMatcher([
  "/",
  "/api/webhooks/clerk", // Make webhook route public
  "/api/test", // Make test route public
  "/features",
  "/pricing",
  "/how-it-works",
  "/sign-in",
  "/sign-up",
]);

// Combine with Clerk auth middleware
export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Run CORS middleware first
  const corsResponse = corsMiddleware(req);
  if (corsResponse.status !== 200) {
    return corsResponse;
  }

  // Then handle authentication for non-public routes
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
