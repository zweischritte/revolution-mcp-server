import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { getBootstrap, createServerInstance } from "../dist/bootstrap.js";

let transport;
let serverReadyPromise;

async function ensureServer() {
  if (!serverReadyPromise) {
    serverReadyPromise = (async () => {
      const { config, state } = await getBootstrap();
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true
      });
      const server = await createServerInstance(state, config);
      await server.connect(transport);
    })();
  }

  await serverReadyPromise;
  return transport;
}

export default async function handler(req, res) {
  try {
    const accept = req.headers.accept ?? "";
    const needsJson = !accept.includes("application/json");
    const needsSse = !accept.includes("text/event-stream");
    if (needsJson || needsSse) {
      const values = new Set(
        [accept, "application/json", "text/event-stream"].filter(Boolean)
      );
      req.headers.accept = Array.from(values).join(", ");
    }

    const streamableTransport = await ensureServer();
    await streamableTransport.handleRequest(req, res);
  } catch (error) {
    console.error("HTTP handler error", error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Internal Server Error" }));
    } else {
      res.end();
    }
  }
}
