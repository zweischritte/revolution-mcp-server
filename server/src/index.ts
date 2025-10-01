import http from "node:http";
import { randomUUID } from "node:crypto";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { createServerInstance, getBootstrap } from "./bootstrap.js";
import { logger } from "./logger.js";

async function main(): Promise<void> {
  const { config, state } = await getBootstrap();

  const stdioServer: McpServer = await createServerInstance(state, config);
  const stdioTransport = new StdioServerTransport();
  await stdioServer.connect(stdioTransport);
  logger.info("Stdio MCP transport ready");

  if (config.enableHttp) {
    const httpServerInstance = await createServerInstance(state, config);
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

    const ensureAcceptHeaders = (req: http.IncomingMessage) => {
      const accept = req.headers.accept ?? "";
      const needsJson = !accept.includes("application/json");
      const needsSse = !accept.includes("text/event-stream");
      if (needsJson || needsSse) {
        const values = new Set(
          [accept, "application/json", "text/event-stream"].filter(Boolean)
        );
        req.headers.accept = Array.from(values).join(", ");
      }
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

        if (req.method === "POST" || req.method === "DELETE") {
          ensureAcceptHeaders(req);
          await streamableTransport.handleRequest(req, res);
          return;
        }

        if (req.method === "GET") {
          ensureAcceptHeaders(req);
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
