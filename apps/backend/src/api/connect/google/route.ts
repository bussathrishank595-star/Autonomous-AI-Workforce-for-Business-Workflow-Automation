import { NextResponse } from "next/server";
import { getOAuthClient } from "@/services/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const oauth2Client = getOAuthClient();
    
    // Scopes needed for Gmail sending and Calendar event creation
    const scopes = [
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/calendar.events"
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
      state: (session.user as any).id,
    });

    return NextResponse.redirect(url);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
