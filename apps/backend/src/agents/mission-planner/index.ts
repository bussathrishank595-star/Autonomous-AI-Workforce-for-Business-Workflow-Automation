import { BaseAgent, AgentInput, AgentOutput } from "../../agents";
import { askGemini } from "@/services/gemini";
import { prisma } from "@/lib/prisma";

export class MissionPlannerAgent implements BaseAgent {
  name = "Mission Planner";

  async execute(input: AgentInput): Promise<AgentOutput> {
    const logs: string[] = ["Initializing Mission Planner Agent..."];
    try {
      const promptText = input.prompt;
      if (!promptText) {
        throw new Error("No user prompt provided to Planner Agent.");
      }

      logs.push(`Analyzing user objective: "${promptText}"`);

      const systemPrompt = `You are a high-level HR recruitment planning agent (AgentOS Brain).
Given the user's recruitment request, create a structured workflow plan.
You must select the specialized workforce agents that should be invoked, in order.
You MUST output exactly all of the following 6 agents in order, unless the request explicitly states to skip one of the phases:
1. "Document Ingestion Agent" (Indexes candidate resumes)
2. "Candidate Filter Agent" (Filters candidates semantically using Knowledge Retrieval)
3. "Ranking Agent" (Calculates match scores for filtered candidates)
4. "Email Execution Agent" (Prepares outreach templates for shortlisted candidates)
5. "Calendar Execution Agent" (Schedules interview slots for shortlisted candidates)
6. "Report Generator Agent" (Compiles the complete workflow run output summary report)

Your output must be a single valid JSON object containing exactly this schema. Do not output anything else.
Schema:
{
  "reasoning": "Explain the strategy for finding, filtering, ranking, and inviting/reporting on these candidates using the RAG pipeline",
  "steps": [
    {
      "agentName": "Name of the agent",
      "description": "Short explanation of what this agent will do in this context"
    }
  ]
}`;

      const rawPlan = await askGemini(promptText, systemPrompt);
      const parsedPlan = JSON.parse(rawPlan);

      logs.push("Generated execution plan structure.");

      // Save tasks into database
      await prisma.workflow.update({
        where: { id: input.workflowId as string },
        data: {
          planJson: rawPlan,
          status: "RUNNING",
        },
      });

      // Clear existing tasks if any
      await prisma.task.deleteMany({
        where: { workflowId: input.workflowId as string },
      });

      // Create new subtasks
      for (const step of parsedPlan.steps) {
        await prisma.task.create({
          data: {
            workflowId: input.workflowId as string,
            agentName: step.agentName,
            status: "PENDING",
            output: step.description,
          },
        });
      }

      logs.push(`Successfully created ${parsedPlan.steps.length} sequential execution tasks.`);
      return { success: true, logs, outputData: parsedPlan };
    } catch (e: any) {
      logs.push(`Planner failed: ${e.message}`);
      return { success: false, logs, outputData: null, error: e.message };
    }
  }
}
