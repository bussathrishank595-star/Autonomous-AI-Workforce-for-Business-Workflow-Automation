import { NextResponse } from "next/server";
import { getOAuthClient } from "@/services/google";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const userId = searchParams.get("state");

    if (!code || !userId) {
      return NextResponse.json({ error: "Missing authorization code or state" }, { status: 400 });
    }

    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    // Save tokens as JSON in GoogleToken field
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleToken: JSON.stringify(tokens),
      },
    });

    // Redirect to dashboard settings after successful authentication
    return NextResponse.redirect("http://localhost:3000/settings?success=google-connected");
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
