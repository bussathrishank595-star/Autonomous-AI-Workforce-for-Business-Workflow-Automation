import { BaseAgent, AgentInput, AgentOutput } from "../../agents";
import { prisma } from "@/lib/prisma";
import { getEmbeddingProvider } from "@/services/embeddings/factory";
import { storeChunkEmbeddings } from "@/services/vector/db";
import crypto from "crypto";

export class DocumentIngestionAgent implements BaseAgent {
  name = "Document Ingestion Agent";

  // Simple semantic chunking helper splitting on paragraph offsets or punctuation structures
  private chunkTextSemantically(text: string, maxChunkLength: number = 800): string[] {
    const cleanText = text.replace(/\s+/g, " ").trim();
    const sentences = cleanText.match(/[^.!?]+[.!?]+(\s|$)/g) || [cleanText];
    
    const chunks: string[] = [];
    let currentChunk = "";

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxChunkLength) {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  async execute(input: AgentInput): Promise<AgentOutput> {
    const logs: string[] = ["Starting Document Ingestion Agent..."];
    try {
      // Find all resumes that need indexing status
      const resumes = await prisma.resume.findMany({
        where: { userId: input.userId, status: "PENDING" },
      });

      if (resumes.length === 0) {
        logs.push("No pending resumes found to index. Skipping.");
        return { success: true, logs, outputData: { indexedCount: 0 } };
      }

      const embeddingProvider = getEmbeddingProvider();

      for (const res of resumes) {
        logs.push(`Processing ingestion pipeline for file: ${res.filename}`);

        // Extract metadata details
        const filename = res.filename;
        const uploadTime = res.createdAt.toISOString();

        // Perform text cleaning and splitting chunks
        const chunksText = this.chunkTextSemantically(res.parsedText);
        logs.push(`Split resume text into ${chunksText.length} semantic chunks.`);

        const chunksData = chunksText.map((chunkText, idx) => ({
          chunkText,
          metadata: {
            filename,
            uploadTime,
            chunkIndex: idx,
            candidateName: res.name || "Unknown Candidate",
            email: res.email || "",
            skills: res.skills || "[]",
          },
        }));

        // Batch generate embeddings
        logs.push("Requesting embeddings batch from Voyage AI provider...");
        const embeddings = await embeddingProvider.getEmbeddingsBatch(chunksText);

        // Save chunks and vector embeddings using pgvector raw client
        logs.push("Storing chunk records inside pgvector index...");
        await storeChunkEmbeddings(res.id, chunksData, embeddings);

        // Update resume metadata indexing status
        await prisma.resume.update({
          where: { id: res.id },
          data: { status: "INDEXED" },
        });

        logs.push(`Successfully indexed and mapped embeddings for candidate: ${res.name || "Unknown"}`);
      }

      return { success: true, logs, outputData: { indexedCount: resumes.length } };
    } catch (e: any) {
      logs.push(`Document Ingestion failed: ${e.message}`);
      return { success: false, logs, outputData: null, error: e.message };
    }
  }
}
