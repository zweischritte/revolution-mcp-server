import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ServerState } from "../state.js";
import { registerMemoryTools } from "./memoryTools.js";
import { registerTheoryTools } from "./theoryTools.js";

/**
 * Register core MCP tools. Additional tools will be added incrementally as
 * retrieval, catalog, and synthesis capabilities come online.
 */
export async function registerTools(server: McpServer, state: ServerState): Promise<void> {
  registerMemoryTools(server, state);
  registerTheoryTools(server, state);
  server.registerTool(
    "revolution__ping",
    {
      title: "Ping",
      description: "Basic health check tool used during development."
    },
    async () => ({
      content: [{ type: "text", text: "revolution-mcp-server pong" }]
    })
  );
}
