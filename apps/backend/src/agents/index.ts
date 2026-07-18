export interface AgentInput {
  userId: string;
  missionId?: string;
  workflowId?: string;
  [key: string]: any;
}

export interface AgentOutput {
  success: boolean;
  logs: string[];
  outputData: any;
  error?: string;
}

export interface BaseAgent {
  name: string;
  execute(input: AgentInput): Promise<AgentOutput>;
}
