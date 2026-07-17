import { prisma } from "@/lib/prisma";

export async function storeChunkEmbeddings(
  resumeId: string,
  chunks: { chunkText: string; metadata: any }[],
  embeddings: number[][]
) {
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = embeddings[i];

    const jsonMetadata = JSON.stringify(chunk.metadata);

    // Prisma doesn't natively support vector(1024) types in standard inserts, so we execute a raw query
    const chunkId = crypto.randomUUID();
    const vectorString = `[${embedding.join(",")}]`;

    await prisma.$executeRawUnsafe(
      `INSERT INTO "DocumentChunk" ("id", "resumeId", "chunkText", "metadata", "embedding") VALUES ($1, $2, $3, $4, $5::vector)`,
      chunkId,
      resumeId,
      chunk.chunkText,
      jsonMetadata,
      vectorString
    );
  }
}

export async function querySimilaritySearch(
  queryEmbedding: number[],
  topK: number = 5
): Promise<{ chunkText: string; metadata: any; similarity: number }[]> {
  const vectorString = `[${queryEmbedding.join(",")}]`;

  // Similarity query using cosine distance (<=> operator in pgvector)
  const results: any[] = await prisma.$queryRawUnsafe(
    `SELECT "chunkText", "metadata", (1 - ("embedding" <=> $1::vector)) as similarity FROM "DocumentChunk" ORDER BY "embedding" <=> $1::vector LIMIT $2`,
    vectorString,
    topK
  );

  return results.map(r => ({
    chunkText: r.chunkText,
    metadata: JSON.parse(r.metadata),
    similarity: Number(r.similarity),
  }));
}
