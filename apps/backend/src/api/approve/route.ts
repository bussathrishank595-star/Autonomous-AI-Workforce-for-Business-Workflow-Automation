import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EmailAgent } from "@/agents/email-agent";
import { CalendarAgent } from "@/agents/calendar-agent";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { missionId, actionIds } = await request.json();
    if (!missionId || !actionIds || !Array.isArray(actionIds)) {
      return NextResponse.json({ error: "Missing missionId or actionIds" }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const dbUser = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!dbUser?.googleToken) {
      return NextResponse.json({ error: "Google OAuth not connected. Please connect from Settings." }, { status: 400 });
    }

    const executionResults = [];

    // Retrieve and execute emails and calendar invites using new history logs
    const emails = await prisma.emailHistory.findMany({
      where: { id: { in: actionIds }, userId },
    });

    const meetings = await prisma.meetingHistory.findMany({
      where: { id: { in: actionIds }, userId },
    });

    for (const act of emails) {
      const res = await EmailAgent.sendRealEmail(act.id, dbUser.googleToken);
      executionResults.push({ id: act.id, type: "EMAIL", ...res });
    }

    for (const act of meetings) {
      const res = await CalendarAgent.createMeeting(act.id, dbUser.googleToken);
      executionResults.push({ id: act.id, type: "MEETING", ...res });
    }

    // Refresh overall status of workflow run
    const remainingPendingEmails = await prisma.emailHistory.count({
      where: { userId, status: "PENDING_APPROVAL" },
    });
    const remainingPendingMeetings = await prisma.meetingHistory.count({
      where: { userId, status: "PENDING_APPROVAL" },
    });

    if (remainingPendingEmails === 0 && remainingPendingMeetings === 0) {
      await prisma.workflow.update({
        where: { id: missionId },
        data: { status: "COMPLETED" },
      });
    }

    return NextResponse.json({ success: true, results: executionResults });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
