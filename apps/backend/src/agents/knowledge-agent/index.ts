import { BaseAgent, AgentInput, AgentOutput } from "../../agents";
import { getEmbeddingProvider } from "@/services/embeddings/factory";
import { querySimilaritySearch } from "@/services/vector/db";

export class KnowledgeAgent implements BaseAgent {
  name = "Knowledge Agent";

  async execute(input: AgentInput): Promise<AgentOutput> {
    const logs: string[] = ["Starting Knowledge Agent..."];
    try {
      const query = input.query;
      if (!query) {
        throw new Error("No query provided for similarity retrieval.");
      }

      logs.push(`Generating query embedding using Cohere API: "${query}"`);
      const embeddingProvider = getEmbeddingProvider();
      const queryEmbedding = await embeddingProvider.getEmbedding(query, "search_query");

      const topK = input.topK || 8;
      logs.push(`Executing similarity search against pgvector index (topK = ${topK})...`);
      const results = await querySimilaritySearch(queryEmbedding, topK);

      logs.push(`Successfully retrieved ${results.length} relevant candidate resume chunks.`);

      return { success: true, logs, outputData: { contextChunks: results } };
    } catch (e: any) {
      logs.push(`Knowledge Agent retrieval failed: ${e.message}`);
      return { success: false, logs, outputData: null, error: e.message };
    }
  }
}
