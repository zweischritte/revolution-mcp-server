import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import type { MemoryKeyDetail } from "../memory/flowNexusAdapter.js";
import type { ServerState } from "../state.js";

const memoryKeySummarySchema = z.object({
  name: z.string(),
  createdAt: z.string().optional(),
  summary: z.string().optional(),
  citations: z.array(
    z.object({
      source: z.string(),
      confidence: z.number().min(0).max(1)
    })
  )
});

const listMemoryKeysOutputShape = {
  keys: z.array(memoryKeySummarySchema)
};

const getMemoryKeyInputShape = {
  name: z.string().min(1, "name is required")
};

const memoryKeyDetailSchema = z.object({
  name: z.string(),
  createdAt: z.string().optional(),
  summary: z.string().optional(),
  highlights: z.array(z.string()),
  citations: z.array(
    z.object({
      source: z.string(),
      confidence: z.number().min(0).max(1)
    })
  )
});

const getMemoryKeyOutputShape = {
  key: memoryKeyDetailSchema
};

export function registerMemoryTools(server: McpServer, state: ServerState): void {
  server.registerTool(
    "revolution__list_memory_keys",
    {
      title: "List memory keys",
      description: "Retrieve all Flow Nexus memory keys and summaries.",
      outputSchema: listMemoryKeysOutputShape
    },
    async () => {
      const keys = Array.from(state.memoryKeys.values()).map((key) => ({
        name: key.name,
        createdAt: key.createdAt,
        summary: key.summary,
        citations: buildCitations(key.name)
      }));

      const payload = { keys };
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

  server.registerTool(
    "revolution__get_memory_key",
    {
      title: "Get memory key",
      description: "Retrieve detailed information about a specific Flow Nexus memory key.",
      inputSchema: getMemoryKeyInputShape,
      outputSchema: getMemoryKeyOutputShape
    },
    async ({ name }) => {
      const key = state.memoryKeys.get(name);
      if (!key) {
        return {
          content: [
            { type: "text", text: `Memory key not found: ${name}` }
          ],
          isError: true
        };
      }

      const payload = serializeMemoryKey(key);
      const result = { key: payload };
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ],
        structuredContent: result
      };
    }
  );
}

function serializeMemoryKey(key: MemoryKeyDetail) {
  return {
    name: key.name,
    createdAt: key.createdAt,
    summary: key.summary,
    highlights: key.highlights,
    citations: buildCitations(key.name)
  };
}

function buildCitations(keyName: string) {
  return [
    { source: 'docs/MEMORY-STRUCTURE-GUIDE.md', confidence: 0.75 },
    { source: `memory:${keyName}`, confidence: 0.6 }
  ];
}
