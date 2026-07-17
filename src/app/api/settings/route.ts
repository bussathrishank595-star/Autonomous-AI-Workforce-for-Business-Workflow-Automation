import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { googleToken: true },
    });

    const isConnected = !!dbUser?.googleToken;
    return NextResponse.json({ isConnected });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
