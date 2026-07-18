import { EmailAgent } from "./index";

jest.mock("../../agents", () => ({}));
jest.mock("@/lib/prisma", () => {
  return {
    prisma: {
      candidate: {
        findMany: jest.fn(),
      },
      emailHistory: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    },
  };
});
jest.mock("@/services/gemini", () => ({
  askGemini: jest.fn(),
}));
jest.mock("@/services/google", () => ({
  getAuthenticatedClient: jest.fn(),
  getGmailClient: jest.fn(),
}));

describe("EmailAgent", () => {
  let agent: EmailAgent;

  beforeEach(() => {
    agent = new EmailAgent();
    jest.clearAllMocks();
  });

  it("should skip candidates with missing emails and never use placeholder@example.com", async () => {
    const prisma = require("@/lib/prisma").prisma;
    prisma.candidate.findMany.mockResolvedValue([
      { name: "No Email User", email: "", reasoning: "Good", resume: null },
      { name: "Valid User", email: "valid@test.com", reasoning: "Good", resume: null }
    ]);

    const gemini = require("@/services/gemini");
    gemini.askGemini.mockResolvedValue(JSON.stringify({ subject: "Test", body: "Test" }));

    const res = await agent.execute({ workflowId: "123", userId: "user1", prompt: "Test prompt" } as any);

    expect(res.success).toBe(true);
    // Should have skipped "No Email User" and never used a placeholder email.
    // The logs should confirm skipping.
    const skipLog = res.logs?.some((l: string) => l.includes("Candidate email not found for No Email User. Skipping."));
    expect(skipLog).toBe(true);
    
    expect(prisma.emailHistory.create).toHaveBeenCalledTimes(1);
    expect(prisma.emailHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          candidateEmail: "valid@test.com"
        })
      })
    );

    // Verify it was NOT called with the placeholder
    expect(prisma.emailHistory.create).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          candidateEmail: "placeholder@example.com"
        })
      })
    );
  });

  it("should throw exactly 'Candidate email not found.' in sendRealEmail if email is invalid", async () => {
    const prisma = require("@/lib/prisma").prisma;
    prisma.emailHistory.findUnique.mockResolvedValue({
      id: "action-1",
      candidateEmail: "invalid-email",
      subject: "Test",
      body: "Test body"
    });

    await expect(EmailAgent.sendRealEmail("action-1", "{}")).rejects.toThrow("Candidate email not found.");
  });

  it("should throw exactly 'Candidate email not found.' in sendRealEmail if email is empty", async () => {
    const prisma = require("@/lib/prisma").prisma;
    prisma.emailHistory.findUnique.mockResolvedValue({
      id: "action-1",
      candidateEmail: "",
      subject: "Test",
      body: "Test body"
    });

    await expect(EmailAgent.sendRealEmail("action-1", "{}")).rejects.toThrow("Candidate email not found.");
  });
});
