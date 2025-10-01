import { readFile } from "node:fs/promises";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import type { CatalogItem } from "../catalog/index.js";
import type { VectorIndex } from "../retrieval/vectorIndex.js";
import type { ServerState } from "../state.js";

const MAX_LIMIT = 10;

interface Citation {
  source: string;
  title?: string;
  snippet: string;
  confidence: number;
}

interface DocumentSearchResult {
  relativePath: string;
  title?: string;
  category: string;
  snippet: string;
  citations: Citation[];
}

const searchDocumentsInputShape = {
  query: z.string().min(2, "query must have at least two characters"),
  limit: z.number().int().positive().max(MAX_LIMIT).optional()
};

const searchDocumentsOutputShape = {
  results: z.array(
    z.object({
      relativePath: z.string(),
      title: z.string().optional(),
      category: z.string(),
      snippet: z.string(),
      citations: z.array(
        z.object({
          source: z.string(),
          title: z.string().optional(),
          snippet: z.string(),
          confidence: z.number().min(0).max(1)
        })
      )
    })
  )
};

const queryTheoryInputShape = {
  query: z.string().min(4, "query must have at least four characters"),
  limit: z.number().int().positive().max(MAX_LIMIT).optional()
};

const queryTheoryOutputShape = {
  answer: z.string(),
  citations: z.array(
    z.object({
      source: z.string(),
      title: z.string().optional(),
      snippet: z.string(),
      confidence: z.number().min(0).max(1)
    })
  )
};

export function registerTheoryTools(server: McpServer, state: ServerState): void {
  server.registerTool(
    "revolution__search_documents",
    {
      title: "Search documents",
      description: "Search markdown documents for a given query and return contextual snippets.",
      inputSchema: searchDocumentsInputShape,
      outputSchema: searchDocumentsOutputShape
    },
    async ({ query, limit }) => {
      const results = await searchDocuments(state.catalog, state.vectorIndex, query, limit);

      const payload = {
        results: results.map((result) => ({
          relativePath: result.relativePath,
          title: result.title,
          category: result.category,
          snippet: result.snippet,
          citations: result.citations
        }))
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

  server.registerTool(
    "revolution__query_theory",
    {
      title: "Query theory",
      description: "Synthesize an answer from relevant revolutionary documents with citations.",
      inputSchema: queryTheoryInputShape,
      outputSchema: queryTheoryOutputShape
    },
    async ({ query, limit }) => {
      const results = await searchDocuments(state.catalog, state.vectorIndex, query, limit);

      if (results.length === 0) {
        return {
          content: [
            { type: "text", text: `No sources found for query: ${query}` }
          ],
          isError: true
        };
      }

      const answer = buildAnswer(query, results);
      const citations = results.flatMap((result) => result.citations);

      const payload = { answer, citations };
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

async function searchDocuments(
  catalog: CatalogItem[],
  vectorIndex: VectorIndex,
  query: string,
  limit?: number
): Promise<DocumentSearchResult[]> {
  const lowerQuery = query.toLowerCase();
  const maxResults = limit ?? 5;

  const documents = catalog.filter((item) => item.type === "document");
  const matches: DocumentSearchResult[] = [];
  const seen = new Set<string>();

  for (const item of documents) {
    const content = await readFile(item.absolutePath, "utf8");
    if (!content.toLowerCase().includes(lowerQuery)) {
      continue;
    }

    const snippet = extractSnippet(content, lowerQuery);
    const confidence = Math.min(0.4 + snippet.length / 500, 0.95);

    const citation: Citation = {
      source: item.relativePath,
      snippet,
      confidence
    };
    if (item.title) {
      citation.title = item.title;
    }

    const entry: DocumentSearchResult = {
      relativePath: item.relativePath,
      category: item.category,
      snippet,
      citations: [citation]
    };
    if (item.title) {
      entry.title = item.title;
      citation.title = item.title;
    }
    matches.push(entry);
    seen.add(entry.relativePath);

    if (matches.length >= maxResults) {
      break;
    }
  }

  if (matches.length < maxResults) {
    const vectorResults = await vectorIndex.search(query, maxResults * 2);
    for (const result of vectorResults) {
      const relativePath = result.item.relativePath;
      if (seen.has(relativePath)) {
        continue;
      }
      const fallbackContent = await readFile(result.item.absolutePath, "utf8");
      const snippet = result.snippet || extractSnippet(fallbackContent, lowerQuery);
      const confidence = Math.min(Math.max(result.score, 0), 1);
      const citation: Citation = {
        source: relativePath,
        snippet,
        confidence
      };
      if (result.item.title) {
        citation.title = result.item.title;
      }
      const entry: DocumentSearchResult = {
        relativePath,
        category: result.item.category,
        snippet,
        citations: [citation]
      };
      if (result.item.title) {
        entry.title = result.item.title;
      }
      matches.push(entry);
      seen.add(relativePath);
      if (matches.length >= maxResults) {
        break;
      }
    }
  }

  return matches;
}

function extractSnippet(content: string, lowerQuery: string): string {
  const normalized = content.replace(/\s+/g, " ");
  const normalizedLower = normalized.toLowerCase();
  const index = normalizedLower.indexOf(lowerQuery);
  if (index === -1) {
    return normalized.slice(0, 200).trim();
  }

  const snippetRadius = 160;
  const start = Math.max(0, index - snippetRadius);
  const end = Math.min(normalized.length, index + lowerQuery.length + snippetRadius);
  return normalized.slice(start, end).trim();
}

function buildAnswer(query: string, results: DocumentSearchResult[]): string {
  const lines = results.map((result, idx) => {
    const title = result.title ?? result.relativePath;
    const cite = result.citations[0];
    const source = cite ? cite.source : result.relativePath;
    return `${idx + 1}. ${title} (${source}): ${result.snippet}`;
  });

  return `Query: ${query}\n` + lines.join("\n\n");
}
