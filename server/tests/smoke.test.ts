import assert from "node:assert/strict";
import path from "node:path";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { loadCatalog } from "../src/catalog/index.js";
import { createCatalogIndex } from "../src/catalog/search.js";
import { createVectorIndex } from "../src/retrieval/vectorIndex.js";
import { loadConfig } from "../src/config.js";
import { FlowNexusAdapter } from "../src/memory/flowNexusAdapter.js";
import { registerTools } from "../src/tools/index.js";
import type { ServerState } from "../src/state.js";

process.on('uncaughtException', (err) => {
  console.error('uncaught exception', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('unhandled rejection', reason);
  process.exit(1);
});

(async () => {
  try {
  const config = loadConfig();
  assert.equal(config.name, process.env.REVOLUTION_MCP_NAME ?? "revolution-mcp-server");
  assert.equal(config.memoryNamespace, process.env.REVOLUTION_MEMORY_NAMESPACE ?? "revolution");
  const expectedKnowledgeBase = process.env.REVOLUTION_KB_PATH
    ? path.resolve(process.env.REVOLUTION_KB_PATH)
    : path.resolve(process.cwd(), "knowledge-base");
  assert.equal(path.resolve(config.knowledgeBasePath), expectedKnowledgeBase);

  const catalog = await loadCatalog(config.knowledgeBasePath);
  assert.ok(catalog.items.length > 0, "Catalog should contain knowledge base entries");
  const documentCount = catalog.items.filter((item) => item.type === "document").length;
  assert.ok(documentCount > 0, "Catalog should include document items");

  const flowNexus = new FlowNexusAdapter({
    namespace: config.memoryNamespace,
    knowledgeBasePath: config.knowledgeBasePath
  });
  const keys = await flowNexus.listMemoryKeys();
  assert.ok(keys.length >= 19, "Memory guide should expose the expected keys");
  const metaFramework = keys.find((key) => key.name === "meta-framework");
  assert.ok(metaFramework, "meta-framework key should be parsed");

  const server = new McpServer({ name: "test", version: "0.0.0" });
  const vectorIndex = createVectorIndex();
  await vectorIndex.upsert(catalog.items);

  const state: ServerState = {
    catalog: catalog.items,
    catalogIndex: createCatalogIndex(catalog.items),
    vectorIndex,
    flowNexus,
    memoryKeys: await flowNexus.loadAll()
  };
  await registerTools(server, state);
  const registeredTools = (server as unknown as { _registeredTools: Record<string, unknown> })._registeredTools;
  assert.ok(registeredTools);
  assert.ok(registeredTools["revolution__ping"], "Ping tool should be registered");
  assert.ok(registeredTools["revolution__list_memory_keys"], "List memory keys tool should be registered");
  assert.ok(registeredTools["revolution__get_memory_key"], "Get memory key tool should be registered");

  const pingTool = registeredTools["revolution__ping"] as { callback: () => Promise<{ content: Array<{ type: string; text: string }> }> };
  const result = await pingTool.callback();
  assert.equal(result.content[0]?.text, "revolution-mcp-server pong");

  const listTool = registeredTools["revolution__list_memory_keys"] as { callback: () => Promise<{ structuredContent?: { keys: Array<{ name: string; citations: Array<{ source: string; confidence: number }> }> } }> };
  const listResult = await listTool.callback();
  assert.ok(listResult.structuredContent?.keys.length >= 19, "List tool should return 19+ keys");
  assert.ok((listResult.structuredContent?.keys[0]?.citations.length ?? 0) > 0, "List tool should include citations");

  const getTool = registeredTools["revolution__get_memory_key"] as { callback: (args: { name: string }) => Promise<{ structuredContent?: { key: { name: string; citations: Array<{ source: string; confidence: number }> } } }> };
  const getResult = await getTool.callback({ name: "meta-framework" });
  assert.equal(getResult.structuredContent?.key.name, "meta-framework");
  assert.ok((getResult.structuredContent?.key.citations.length ?? 0) > 0, "Get tool should include citations");
  const searchTool = registeredTools["revolution__search_documents"] as { callback: (args: { query: string; limit?: number }) => Promise<{ structuredContent?: { results: Array<{ relativePath: string; citations: Array<{ source: string; confidence: number }> }> } }> };
  const searchResult = await searchTool.callback({ query: "alienation", limit: 3 });
  assert.ok((searchResult.structuredContent?.results.length ?? 0) > 0, "Search tool should return matches");
  assert.ok((searchResult.structuredContent?.results[0]?.citations.length ?? 0) > 0, "Search tool should include citations");
  const queryTool = registeredTools["revolution__query_theory"] as { callback: (args: { query: string; limit?: number }) => Promise<{ structuredContent?: { answer: string; citations: Array<{ source: string; confidence: number }> } }> };
  const queryResult = await queryTool.callback({ query: "alienation", limit: 3 });
  assert.ok((queryResult.structuredContent?.citations.length ?? 0) > 0, "Query tool should provide citations");
  assert.ok(queryResult.structuredContent?.answer.toLowerCase().includes('alienation'), "Answer should reference the query");

  // eslint-disable-next-line no-console -- test output
  console.log("Smoke test passed");
  } catch (error) {
    console.error("Smoke test failed", error);
    process.exitCode = 1;
  }
})().catch((error) => {
  console.error("Unhandled test error", error);
  process.exit(1);
});
