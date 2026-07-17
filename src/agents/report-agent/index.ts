import { BaseAgent, AgentInput, AgentOutput } from "../../agents";
import { prisma } from "@/lib/prisma";

export class ReportAgent implements BaseAgent {
  name = "Report Generator Agent";

  async execute(input: AgentInput): Promise<AgentOutput> {
    const logs: string[] = ["Starting Report Generator Agent..."];
    try {
      const workflow = await prisma.workflow.findUnique({
        where: { id: input.workflowId as string },
        include: {
          candidates: true,
        },
      });

      if (!workflow) {
        throw new Error("Workflow not found.");
      }

      logs.push("Gathering matching data and statistics...");

      const totalCandidates = workflow.candidates.length;
      const shortlisted = workflow.candidates.filter((c: any) => c.status === "SHORTLISTED");
      const rejected = workflow.candidates.filter((c: any) => c.status === "REJECTED");

      logs.push(`Generating report structure: ${shortlisted.length} shortlisted, ${rejected.length} rejected.`);

      const htmlReport = `
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #111; line-height: 1.5; }
              h1 { border-bottom: 1px solid #eaeaea; padding-bottom: 10px; font-size: 24px; font-weight: 600; }
              h2 { font-size: 18px; margin-top: 30px; font-weight: 500; }
              .stat-box { display: flex; gap: 20px; margin-bottom: 20px; }
              .stat-item { border: 1px solid #eaeaea; padding: 15px; border-radius: 6px; flex: 1; text-align: center; }
              .stat-val { font-size: 22px; font-weight: bold; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { text-align: left; padding: 10px; border-bottom: 1px solid #eaeaea; font-size: 14px; }
              th { background: #f9f9f9; font-weight: 600; }
              .status-shortlisted { color: #10b981; font-weight: 600; }
              .status-rejected { color: #ef4444; font-weight: 600; }
            </style>
          </head>
          <body>
            <h1>AgentOS Recruitment Report</h1>
            <p><strong>Goal:</strong> ${workflow.prompt}</p>
            <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
            
            <div class="stat-box">
              <div class="stat-item">
                <div class="stat-val">${totalCandidates}</div>
                <div>Total Evaluated</div>
              </div>
              <div class="stat-item">
                <div class="stat-val status-shortlisted">${shortlisted.length}</div>
                <div>Shortlisted</div>
              </div>
              <div class="stat-item">
                <div class="stat-val status-rejected">${rejected.length}</div>
                <div>Rejected</div>
              </div>
            </div>

            <h2>Candidate Breakdown</h2>
            <table>
              <thead>
                <tr>
                  <th>Candidate Name</th>
                  <th>Match Score</th>
                  <th>Status</th>
                  <th>Details & Reasoning</th>
                </tr>
              </thead>
              <tbody>
                ${workflow.candidates.map((c: any) => `
                  <tr>
                    <td><strong>${c.name}</strong><br/><span style="color:#666;font-size:12px;">${c.email}</span></td>
                    <td>${c.matchScore}%</td>
                    <td class="status-${c.status.toLowerCase()}">${c.status}</td>
                    <td>${c.reasoning || ""}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const reportBase64 = Buffer.from(htmlReport).toString("base64");

      await prisma.workflow.update({
        where: { id: input.workflowId as string },
        data: {
          reportPdf: reportBase64,
          status: "COMPLETED",
        },
      });

      logs.push("Report generated successfully as formatted HTML payload.");
      return { success: true, logs, outputData: { reportBase64 } };
    } catch (e: any) {
      logs.push(`Report Generator failed: ${e.message}`);
      return { success: false, logs, outputData: null, error: e.message };
    }
  }
}
