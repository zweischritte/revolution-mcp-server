import { promises as fs } from "node:fs";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import type { ServerState } from "../state.js";

const getDocumentInputShape = {
  relativePath: z.string().min(1, "relativePath is required")
};

const getDocumentOutputShape = {
  relativePath: z.string(),
  content: z.string()
};

export function registerDocumentTools(server: McpServer, state: ServerState): void {
  server.registerTool(
    "revolution__get_document",
    {
      title: "Get document content",
      description: "Retrieve the full text of a knowledge base document by relative path.",
      inputSchema: getDocumentInputShape,
      outputSchema: getDocumentOutputShape
    },
    async ({ relativePath }) => {
      const normalized = path.normalize(relativePath);
      const absolutePath = path.resolve(state.knowledgeBasePath, normalized);

      if (!absolutePath.startsWith(state.knowledgeBasePath)) {
        return {
          content: [
            {
              type: "text",
              text: `Access to path outside knowledge base is not allowed: ${relativePath}`
            }
          ],
          isError: true
        };
      }

      const buffer = await fs.readFile(absolutePath, "utf8");
      const payload = {
        relativePath: normalized.replace(/\\/g, "/"),
        content: buffer
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(payload, null, 2)
          }
        ],
        structuredContent: payload
      };
    }
  );
}
