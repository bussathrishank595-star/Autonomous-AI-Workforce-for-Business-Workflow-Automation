import { EmbeddingProvider } from "./index";

export class VoyageEmbeddingProvider implements EmbeddingProvider {
  name = "Voyage AI";
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.VOYAGE_API_KEY || "pa-ShmpGH7RMYXqSzvEU7TO7aAkKCVYIyFiLlAh4uHHNrE";
  }

  async getEmbedding(text: string): Promise<number[]> {
    const batchResult = await this.getEmbeddingsBatch([text]);
    return batchResult[0];
  }

  async getEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    
    const url = "https://api.voyageai.com/v1/embeddings";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        input: texts,
        model: "voyage-3" // Voyage 3 outputs 1024 dimensional embeddings matching vector(1024)
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Voyage API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const embeddings = data?.data?.map((item: any) => item.embedding);
    if (!embeddings || embeddings.length === 0) {
      throw new Error(`Invalid response schema from Voyage API: ${JSON.stringify(data)}`);
    }

    return embeddings;
  }
}
