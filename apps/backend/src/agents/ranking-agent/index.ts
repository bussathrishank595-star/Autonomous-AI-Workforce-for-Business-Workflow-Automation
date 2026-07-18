import { BaseAgent, AgentInput, AgentOutput } from "../../agents";
import { prisma } from "@/lib/prisma";
import { askGemini } from "@/services/gemini";

export class RankingAgent implements BaseAgent {
  name = "Ranking Agent";

  async execute(input: AgentInput): Promise<AgentOutput> {
    const logs: string[] = ["Starting Ranking Agent..."];
    try {
      const candidates = await prisma.candidate.findMany({
        where: { workflowId: input.workflowId as string },
      });

      if (candidates.length === 0) {
        logs.push("No candidates to rank. Skipping.");
        return { success: true, logs, outputData: { rankedCount: 0 } };
      }

      logs.push(`Ranking ${candidates.length} candidates...`);

      for (const cand of candidates) {
        logs.push(`Evaluating match score for: ${cand.name}`);

        const systemPrompt = `You are a professional HR candidate ranking and grading system.
You rank candidates based on experience, skill match, education relevance, and project relevance.
Generate a match score from 0-100.
Also output status: Shortlist the candidate if score is >= 70 ("SHORTLISTED"), otherwise mark "REJECTED".
Your response MUST be a single valid JSON object. Do not output anything else.
Schema:
{
  "score": 85,
  "status": "SHORTLISTED",
  "reasoning": "Reason for this score and shortlist/rejection status"
}`;

        const prompt = `Recruitment Request: "${input.prompt}"
Candidate Name: ${cand.name}
Candidate Reasoning: ${cand.reasoning}`;

        const rawScore = await askGemini(prompt, systemPrompt);
        const parsed = JSON.parse(rawScore);

        await prisma.candidate.update({
          where: { id: cand.id },
          data: {
            matchScore: parsed.score || 0,
            status: parsed.status || "CONSIDERED",
            reasoning: parsed.reasoning || cand.reasoning,
          },
        });

        logs.push(`Ranked ${cand.name} with score: ${parsed.score} -> Status: ${parsed.status}`);
      }

      logs.push("Ranking phase completed successfully.");
      return { success: true, logs, outputData: { rankedCount: candidates.length } };
    } catch (e: any) {
      logs.push(`Ranking Agent failed: ${e.message}`);
      return { success: false, logs, outputData: null, error: e.message };
    }
  }
}
