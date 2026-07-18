import { BaseAgent, AgentInput, AgentOutput } from "../../agents";
import { prisma } from "@/lib/prisma";
import { askGemini } from "@/services/gemini";
import { KnowledgeAgent } from "../knowledge-agent";

export class CandidateFilterAgent implements BaseAgent {
  name = "Candidate Filter Agent";

  async execute(input: AgentInput): Promise<AgentOutput> {
    const logs: string[] = ["Starting Candidate Filter Agent..."];
    try {
      const promptText = input.prompt;
      
      // Request RAG query results from Knowledge Agent
      logs.push("Querying Knowledge Agent for semantically relevant candidate context...");
      const knowledgeAgent = new KnowledgeAgent();
      const knowledgeRes = await knowledgeAgent.execute({
        userId: input.userId,
        workflowId: input.workflowId,
        query: `Candidates matching requirements: ${promptText}`,
        topK: 8
      });

      await prisma.workflow.update({
        where: { id: input.workflowId as string },
        data: {
          logs: JSON.stringify(await prisma.workflow.findUnique({ where: { id: input.workflowId as string } }).then(w => JSON.parse(w?.logs || "[]").concat(knowledgeRes.logs)))
        }
      });

      if (!knowledgeRes.success || !knowledgeRes.outputData?.contextChunks) {
        throw new Error(`Knowledge Agent failed: ${knowledgeRes.error}`);
      }

      const contextChunks = knowledgeRes.outputData.contextChunks;
      logs.push(`Retrieved ${contextChunks.length} candidate resume fragments. Analyzing matches...`);

      const systemPrompt = `You are a recruiter semantic filter.
Look at the retrieved candidate fragments context and the recruitment request.
Decide which candidates match the requirements semantically.
Your response MUST be a single valid JSON object. Do not include markdown codeblocks or extra text.
Schema:
{
  "matches": [
    {
      "name": "Candidate's name",
      "email": "Candidate's email",
      "reasoning": "Explain why this candidate fits the role based on context"
    }
  ]
}`;

      const rawMatches = await askGemini(
        `Request: "${promptText}"\n\nContext Fragments:\n${JSON.stringify(contextChunks, null, 2)}`,
        systemPrompt
      );

      const parsed = JSON.parse(rawMatches);
      logs.push(`Semantic filtering completed. Found ${parsed?.matches?.length || 0} matching candidates.`);

      // Store matching candidates under this workflow run
      await prisma.candidate.deleteMany({
        where: { workflowId: input.workflowId as string },
      });

      if (parsed.matches && Array.isArray(parsed.matches)) {
        for (const item of parsed.matches) {
          // Link candidate back to matching resume name if possible
          const matchedResume = await prisma.resume.findFirst({
            where: { name: { contains: item.name, mode: "insensitive" } }
          });

          await prisma.candidate.create({
            data: {
              workflowId: input.workflowId as string,
              name: item.name,
              email: item.email || matchedResume?.email || "",
              phone: matchedResume?.phone || "",
              matchScore: 0, // Ranking agent will update this
              status: "CONSIDERED",
              reasoning: item.reasoning,
              resumeId: matchedResume?.id || null,
            },
          });
        }
      }

      return { success: true, logs, outputData: parsed };
    } catch (e: any) {
      logs.push(`Filter Agent failed: ${e.message}`);
      return { success: false, logs, outputData: null, error: e.message };
    }
  }
}
