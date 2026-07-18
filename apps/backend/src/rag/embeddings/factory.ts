import { CohereEmbeddingProvider } from "./cohere";
import { EmbeddingProvider } from "./index";

let activeProvider: EmbeddingProvider = new CohereEmbeddingProvider();

export function getEmbeddingProvider(): EmbeddingProvider {
  return activeProvider;
}

export function setEmbeddingProvider(provider: EmbeddingProvider) {
  activeProvider = provider;
}
