import type { CatalogItem } from "./catalog/index.js";
import type { CatalogItemIndex } from "./catalog/search.js";
import type { FlowNexusAdapter, MemoryKeyMap } from "./memory/flowNexusAdapter.js";
import type { VectorIndex } from "./retrieval/vectorIndex.js";

export interface ServerState {
  catalog: CatalogItem[];
  catalogIndex: CatalogItemIndex;
  vectorIndex: VectorIndex;
  flowNexus: FlowNexusAdapter;
  memoryKeys: MemoryKeyMap;
}
