import { BaseAgent, AgentInput, AgentOutput } from "../../agents";
import { prisma } from "@/lib/prisma";
import { askGemini } from "@/services/gemini";
import { getAuthenticatedClient, getGmailClient } from "@/services/google";

export class EmailAgent implements BaseAgent {
  name = "Email Execution Agent";

  async execute(input: AgentInput): Promise<AgentOutput> {
    const logs: string[] = ["Starting Email Execution Agent..."];
    try {
      const candidates = await prisma.candidate.findMany({
        where: {
          workflowId: input.workflowId as string,
          status: "SHORTLISTED",
        },
      });

      if (candidates.length === 0) {
        logs.push("No shortlisted candidates found to invite. Skipping.");
        return { success: true, logs, outputData: { actionCount: 0 } };
      }

      logs.push(`Generating custom interview invitation templates for ${candidates.length} candidates...`);
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      for (const cand of candidates) {
        const email = (cand.email || "").trim();
        
        if (!email) {
          throw new Error("Candidate email not found.");
        }
        
        if (!emailRegex.test(email)) {
          throw new Error(`Invalid candidate email format: ${email}`);
        }

        logs.push(`Generating draft invitation for ${cand.name} (${email})`);

        const systemPrompt = `You are a recruitment outreach assistant writing invitations.
Create a personalized email invitation for an interview.
Your output MUST be a single valid JSON object. Do not output anything else.
Schema:
{
  "subject": "Email Subject Line",
  "body": "Hi Candidate, \\n\\nWe were impressed by your background...\\n\\nBest regards,\\nRecruiting Team"
}`;

        const prompt = `Recruitment Goal: "${input.prompt}"
Candidate Name: ${cand.name}
Candidate Reasoning: ${cand.reasoning}`;

        const rawEmail = await askGemini(prompt, systemPrompt);
        const parsed = JSON.parse(rawEmail);

        // Store as PENDING_APPROVAL inside EmailHistory
        await prisma.emailHistory.create({
          data: {
            userId: input.userId,
            candidateName: cand.name,
            candidateEmail: email,
            subject: parsed.subject,
            body: parsed.body,
            status: "PENDING_APPROVAL",
          },
        });

        logs.push(`Created pending email approval Action for ${cand.name}`);
      }

      return { success: true, logs, outputData: { status: "AWAITING_APPROVAL" } };
    } catch (e: any) {
      logs.push(`Email Execution Agent failed: ${e.message}`);
      return { success: false, logs, outputData: null, error: e.message };
    }
  }

  static async sendRealEmail(actionId: string, googleTokenJson: string): Promise<{ success: boolean; error?: string }> {
    try {
      const action = await prisma.emailHistory.findUnique({ where: { id: actionId } });
      if (!action) throw new Error("Action not found.");

      const recipientEmail = (action.candidateEmail || "").trim();
      if (!recipientEmail) {
        throw new Error("Candidate email not found.");
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(recipientEmail)) {
        throw new Error(`Invalid candidate email format: ${recipientEmail}`);
      }

      console.log(`[Gmail API Outreach] Dispatching interview invite email to candidate: ${recipientEmail}`);

      const auth = getAuthenticatedClient(googleTokenJson);
      const gmail = getGmailClient(auth);

      const utf8Subject = `=?utf-8?B?${Buffer.from(action.subject || "").toString("base64")}?=`;
      const messageParts = [
        `To: ${recipientEmail}`,
        "Content-Type: text/plain; charset=utf-8",
        "MIME-Version: 1.0",
        `Subject: ${utf8Subject}`,
        "",
        action.body || "",
      ];
      const message = messageParts.join("\n");

      const encodedMessage = Buffer.from(message)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      await gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw: encodedMessage,
        },
      });

      await prisma.emailHistory.update({
        where: { id: actionId },
        data: { status: "SENT" },
      });

      return { success: true };
    } catch (e: any) {
      await prisma.emailHistory.update({
        where: { id: actionId },
        data: { status: "FAILED" },
      });
      return { success: false, error: e.message };
    }
  }
}
