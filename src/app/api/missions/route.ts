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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing workflowId" }, { status: 400 });
    }

    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: {
        tasks: true,
      },
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    const userId = (session.user as any).id;

    // Get pending approval actions from RAG EmailHistory and MeetingHistory
    const emails = await prisma.emailHistory.findMany({
      where: { userId, status: "PENDING_APPROVAL" },
    });

    const meetings = await prisma.meetingHistory.findMany({
      where: { userId, status: "PENDING_APPROVAL" },
    });

    const actions = [
      ...emails.map(e => ({ id: e.id, type: "EMAIL", candidateName: e.candidateName, candidateEmail: e.candidateEmail, subject: e.subject, body: e.body })),
      ...meetings.map(m => ({ id: m.id, type: "MEETING", candidateName: m.candidateName, candidateEmail: m.candidateEmail, subject: m.subject, body: m.body, date: m.date }))
    ];

    return NextResponse.json({ mission: workflow, actions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
