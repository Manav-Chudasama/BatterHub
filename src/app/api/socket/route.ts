import { NextResponse } from "next/server";
import { initSocket } from "@/lib/socket";

export async function GET(req: Request) {
  try {
    // Initialize socket server
    initSocket(global.server);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error initializing socket:", error);
    return NextResponse.json(
      { error: "Failed to initialize socket" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
