export interface EmbeddingProvider {
  name: string;
  getEmbedding(text: string, inputType?: "search_query" | "search_document"): Promise<number[]>;
  getEmbeddingsBatch(texts: string[], inputType?: "search_query" | "search_document"): Promise<number[][]>;
}
