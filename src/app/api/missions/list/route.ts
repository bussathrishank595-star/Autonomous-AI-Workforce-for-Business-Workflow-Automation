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

    // Fetch all workflows for task logs UI list
    const workflows = await prisma.workflow.findMany({
      where: { userId },
      include: {
        tasks: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Rename keys to match old Mission models inside dashboard components
    const missions = workflows.map((w: any) => ({
      id: w.id,
      prompt: w.prompt,
      status: w.status,
      logs: w.logs,
      planJson: w.planJson,
      reportPdf: w.reportPdf,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
      tasks: w.tasks.map((t: any) => ({
        id: t.id,
        agentName: t.agentName,
        status: t.status,
        output: t.output,
        updatedAt: t.updatedAt
      }))
    }));

    return NextResponse.json({ missions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
