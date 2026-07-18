import { EmbeddingProvider } from "./index";

export class CohereEmbeddingProvider implements EmbeddingProvider {
  name = "Cohere";
  private apiKey: string;
  private maxRetries = 3;

  constructor() {
    this.apiKey = process.env.COHERE_API_KEY || "";
    if (!this.apiKey) {
      console.warn("COHERE_API_KEY is missing. Embeddings will fail.");
    }
  }

  async getEmbedding(text: string, inputType: "search_query" | "search_document" = "search_query"): Promise<number[]> {
    const batchResult = await this.getEmbeddingsBatch([text], inputType);
    return batchResult[0];
  }

  async getEmbeddingsBatch(texts: string[], inputType: "search_query" | "search_document" = "search_document"): Promise<number[][]> {
    if (texts.length === 0) return [];
    
    const url = "https://api.cohere.ai/v1/embed";
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            texts: texts,
            model: "embed-english-v3.0", // Cohere v3 outputs 1024 dimensional embeddings matching vector(1024)
            input_type: inputType
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          if (response.status === 429 && attempt < this.maxRetries) {
            // Rate limit hit, exponential backoff
            const delay = Math.pow(2, attempt) * 1000;
            console.warn(`[Cohere] Rate limit hit. Retrying in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          throw new Error(`Cohere API error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        const embeddings = data?.embeddings;
        
        if (!embeddings || embeddings.length === 0) {
          throw new Error(`Invalid response schema from Cohere API: ${JSON.stringify(data)}`);
        }

        return embeddings;
      } catch (error) {
        if (attempt === this.maxRetries) {
          throw error;
        }
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`[Cohere] Network error. Retrying in ${delay}ms...`, error);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    
    throw new Error("Failed to fetch embeddings from Cohere after multiple retries");
  }
}
