export interface EmbeddingProvider {
  name: string;
  getEmbedding(text: string): Promise<number[]>;
  getEmbeddingsBatch(texts: string[]): Promise<number[][]>;
}
