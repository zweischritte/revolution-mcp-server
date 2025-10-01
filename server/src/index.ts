import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import http from "node:http";
import { randomUUID } from "node:crypto";

import { loadCatalog } from "./catalog/index.js";
import { createCatalogIndex } from "./catalog/search.js";
import { createVectorIndex } from "./retrieval/vectorIndex.js";
import { loadConfig } from "./config.js";
import { logger } from "./logger.js";
import { FlowNexusAdapter } from "./memory/flowNexusAdapter.js";
import type { ServerState } from "./state.js";
import { registerTools } from "./tools/index.js";

async function createServerInstance(state: ServerState, name: string, version: string) {
  const server = new McpServer({
    name,
    version,
    description: "Revolution knowledge base MCP server"
  });

  await registerTools(server, state);
  return server;
}

async function main(): Promise<void> {
  const config = loadConfig();

  logger.info(`Bootstrapping ${config.name} v${config.version}`);

  const catalogResult = await loadCatalog(config.knowledgeBasePath);
  if (catalogResult.warnings.length > 0) {
    catalogResult.warnings.forEach((warning) => logger.warn(warning));
  }

  const flowNexusConfig = {
    namespace: config.memoryNamespace,
    knowledgeBasePath: config.knowledgeBasePath,
    ...(config.memoryGuideRelativePath ? { memoryGuideRelativePath: config.memoryGuideRelativePath } : {}),
    ...(config.flowNexusBaseUrl ? { baseUrl: config.flowNexusBaseUrl } : {}),
    ...(config.flowNexusApiKey ? { apiKey: config.flowNexusApiKey } : {})
  } as const;

  const flowNexus = new FlowNexusAdapter(flowNexusConfig);
  const memoryKeys = await flowNexus.loadAll();

  const catalogIndex = createCatalogIndex(catalogResult.items);
  const vectorIndex = createVectorIndex();
  await vectorIndex.upsert(catalogResult.items);

  const state: ServerState = {
    catalog: catalogResult.items,
    catalogIndex,
    vectorIndex,
    flowNexus,
    memoryKeys
  };

  const stdioServer = await createServerInstance(state, config.name, config.version);
  const stdioTransport = new StdioServerTransport();
  await stdioServer.connect(stdioTransport);

  if (config.enableHttp) {
    const httpServerInstance = await createServerInstance(state, config.name, config.version);
    const streamableTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      enableJsonResponse: true
    });

    await httpServerInstance.connect(streamableTransport);

    const host = config.httpHost ?? "0.0.0.0";
    const port = config.httpPort ?? 3000;

    streamableTransport.onerror = (error) => {
      logger.error(`HTTP transport error: ${(error as Error).message}`);
    };

    const nodeServer = http.createServer(async (req, res) => {
      try {
        if (!req.url) {
          res.writeHead(400).end(JSON.stringify({ error: "Invalid request" }));
          return;
        }

        if (req.url === "/") {
          res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ status: "ok", endpoint: "/mcp" }));
          return;
        }

        if (!req.url.startsWith("/mcp")) {
          res.writeHead(404, { "Content-Type": "application/json" }).end(JSON.stringify({ error: "Not Found" }));
          return;
        }

        if (req.method === "POST" || req.method === "GET" || req.method === "DELETE") {
          await streamableTransport.handleRequest(req, res);
          return;
        }

        res.writeHead(405).end(JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Method not allowed"
          },
          id: null
        }));
      } catch (error) {
        logger.error(`HTTP request handling failed: ${(error as Error).message}`);
        if (!res.headersSent) {
          res.writeHead(500).end(JSON.stringify({ error: "Internal Server Error" }));
        } else {
          res.end();
        }
      }
    });

    nodeServer.on("error", (error) => {
      logger.error(`HTTP server error: ${(error as Error).message}`);
    });

    nodeServer.listen(port, host, () => {
      logger.info(`HTTP MCP endpoint listening on http://${host}:${port}/mcp`);
    });
  }
}

main().catch((error) => {
  logger.error(`Failed to start Revolution MCP server: ${(error as Error).message}`);
  logger.debug(error);
  process.exitCode = 1;
});
