import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { loadCatalog } from "./catalog/index.js";
import { createCatalogIndex } from "./catalog/search.js";
import { loadConfig, type ServerConfig } from "./config.js";
import { logger } from "./logger.js";
import { FlowNexusAdapter } from "./memory/flowNexusAdapter.js";
import { createVectorIndex } from "./retrieval/vectorIndex.js";
import type { ServerState } from "./state.js";
import { registerTools } from "./tools/index.js";

interface BootstrapResult {
  config: ServerConfig;
  state: ServerState;
  warnings: string[];
}

let bootstrapPromise: Promise<BootstrapResult> | null = null;

async function buildBootstrap(): Promise<BootstrapResult> {
  const config = loadConfig();
  logger.info(`Loading knowledge base from ${config.knowledgeBasePath}`);

  const catalogResult = await loadCatalog(config.knowledgeBasePath);
  if (catalogResult.warnings.length > 0) {
    catalogResult.warnings.forEach((warning) => logger.warn(warning));
  }

  const flowNexus = new FlowNexusAdapter({
    namespace: config.memoryNamespace,
    knowledgeBasePath: config.knowledgeBasePath,
    ...(config.memoryGuideRelativePath ? { memoryGuideRelativePath: config.memoryGuideRelativePath } : {}),
    ...(config.flowNexusBaseUrl ? { baseUrl: config.flowNexusBaseUrl } : {}),
    ...(config.flowNexusApiKey ? { apiKey: config.flowNexusApiKey } : {})
  });

  const memoryKeys = await flowNexus.loadAll();
  logger.info(`Loaded ${memoryKeys.size} memory keys from Flow Nexus guide.`);

  const catalogIndex = createCatalogIndex(catalogResult.items);
  const vectorIndex = createVectorIndex();
  await vectorIndex.upsert(catalogResult.items);
  logger.info(`Catalog indexed with ${catalogResult.items.length} items.`);

  const state: ServerState = {
    catalog: catalogResult.items,
    catalogIndex,
    vectorIndex,
    flowNexus,
    memoryKeys,
    knowledgeBasePath: config.knowledgeBasePath
  };

  return { config, state, warnings: catalogResult.warnings };
}

export async function getBootstrap(): Promise<BootstrapResult> {
  if (!bootstrapPromise) {
    bootstrapPromise = buildBootstrap();
  }
  return bootstrapPromise;
}

export async function createServerInstance(state: ServerState, config: ServerConfig): Promise<McpServer> {
  const server = new McpServer({
    name: config.name,
    version: config.version,
    description: "Revolution knowledge base MCP server"
  });

  await registerTools(server, state);
  return server;
}
