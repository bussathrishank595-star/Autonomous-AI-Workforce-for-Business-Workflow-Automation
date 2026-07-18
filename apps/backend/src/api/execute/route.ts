import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MissionPlannerAgent } from "@/agents/mission-planner";
import { DocumentIngestionAgent } from "@/agents/ingestion-agent";
import { CandidateFilterAgent } from "@/agents/filter-agent";
import { RankingAgent } from "@/agents/ranking-agent";
import { EmailAgent } from "@/agents/email-agent";
import { CalendarAgent } from "@/agents/calendar-agent";
import { ReportAgent } from "@/agents/report-agent";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt } = await request.json();
    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const userId = (session.user as any).id;

    // Create the workflow run tracking
    const workflow = await prisma.workflow.create({
      data: {
        prompt,
        userId,
        status: "PLANNING",
        logs: JSON.stringify(["Created new RAG pipeline workflow recruitment request."]),
      },
    });

    const runWorkflow = async () => {
      const logs: string[] = ["Starting RAG pipeline execution..."];
      
      const updateWorkflowLogs = async (newLogs: string[]) => {
        logs.push(...newLogs);
        await prisma.workflow.update({
          where: { id: workflow.id },
          data: { logs: JSON.stringify(logs) },
        });
      };

      try {
        // Step 1: Planning
        const planner = new MissionPlannerAgent();
        const planResult = await planner.execute({ userId, workflowId: workflow.id, prompt });
        await updateWorkflowLogs(planResult.logs);
        if (!planResult.success) throw new Error("Planner failed");

        // Fetch planned subtasks
        const tasks = await prisma.task.findMany({
          where: { workflowId: workflow.id },
        });

        // Run each step sequentially through the RAG pipeline
        for (const task of tasks) {
          await prisma.task.update({
            where: { id: task.id },
            data: { status: "RUNNING" },
          });

          let result;
          if (task.agentName === "Document Ingestion Agent") {
            result = await new DocumentIngestionAgent().execute({ userId, workflowId: workflow.id, prompt });
          } else if (task.agentName === "Candidate Filter Agent") {
            result = await new CandidateFilterAgent().execute({ userId, workflowId: workflow.id, prompt });
          } else if (task.agentName === "Ranking Agent") {
            result = await new RankingAgent().execute({ userId, workflowId: workflow.id, prompt });
          } else if (task.agentName === "Email Execution Agent") {
            result = await new EmailAgent().execute({ userId, workflowId: workflow.id, prompt });
          } else if (task.agentName === "Calendar Execution Agent") {
            result = await new CalendarAgent().execute({ userId, workflowId: workflow.id, prompt });
          } else if (task.agentName === "Report Generator Agent") {
            result = await new ReportAgent().execute({ userId, workflowId: workflow.id, prompt });
          } else {
            result = { success: true, logs: [`Unknown agent: ${task.agentName}`] };
          }

          await updateWorkflowLogs(result.logs);

          if (!result.success) {
            await prisma.task.update({
              where: { id: task.id },
              data: { status: "FAILED" },
            });
            throw new Error(`Agent ${task.agentName} execution failed: ${result.error}`);
          }

          await prisma.task.update({
            where: { id: task.id },
            data: { status: "COMPLETED" },
          });
        }

        // Finalize state
        const emailsPending = await prisma.emailHistory.count({
          where: { userId, status: "PENDING_APPROVAL" },
        });
        const meetingsPending = await prisma.meetingHistory.count({
          where: { userId, status: "PENDING_APPROVAL" },
        });

        if (emailsPending > 0 || meetingsPending > 0) {
          await prisma.workflow.update({
            where: { id: workflow.id },
            data: { status: "AWAITING_APPROVAL" },
          });
        }

      } catch (e: any) {
        // Log critical failure stack to stderr and DB
        console.error("Async execution error: ", e);
        await updateWorkflowLogs([`CRITICAL RAG WORKFLOW FAILURE: ${e.message}`]);
        await prisma.workflow.update({
          where: { id: workflow.id },
          data: { status: "FAILED" },
        });
      }
    };

    // Trigger execution synchronously or asynchronously.
    // On Vercel Serverless Functions, background threads are terminated once the request responds.
    // We use waitUntil to keep the background execution alive while returning the missionId immediately.
    if (process.env.VERCEL) {
      waitUntil(runWorkflow());
    } else {
      runWorkflow();
    }

    return NextResponse.json({ success: true, missionId: workflow.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
