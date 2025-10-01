import type { CatalogItem } from "../catalog/index.js";

export interface VectorIndexConfig {
  embeddingModel?: string;
}

export interface VectorSearchResult {
  item: CatalogItem;
  score: number;
  snippet: string;
}

export interface VectorIndex {
  upsert(items: CatalogItem[]): Promise<void>;
  search(query: string, limit?: number): Promise<VectorSearchResult[]>;
}

export class NoopVectorIndex implements VectorIndex {
  constructor(private readonly config: VectorIndexConfig = {}) {}

  async upsert(): Promise<void> {
    return;
  }

  async search(): Promise<VectorSearchResult[]> {
    return [];
  }
}

export function createVectorIndex(config: VectorIndexConfig = {}): VectorIndex {
  return new NoopVectorIndex(config);
}
