import { VoyageEmbeddingProvider } from "./voyage";
import { EmbeddingProvider } from "./index";

let activeProvider: EmbeddingProvider = new VoyageEmbeddingProvider();

export function getEmbeddingProvider(): EmbeddingProvider {
  return activeProvider;
}

export function setEmbeddingProvider(provider: EmbeddingProvider) {
  activeProvider = provider;
}
