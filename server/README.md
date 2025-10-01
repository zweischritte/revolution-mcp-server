# Revolution MCP Server Prototype

Model Context Protocol (MCP) server exposing the "revolution" knowledge base—documents, Flow Nexus memory keys, and derived synthesis tools—for use by other LLM agents.

---

## Capabilities Overview
The server currently provides the following MCP tools:

| Tool | Purpose | Key Fields Returned |
|------|---------|---------------------|
| `revolution__ping` | Health check. | Text reply (`pong`). |
| `revolution__list_memory_keys` | Lists all Flow Nexus memory keys with summaries. | `keys[]` (name, createdAt, summary, `citations[]`). |
| `revolution__get_memory_key` | Detailed metadata for one memory key. | `key` (highlights, `citations[]`). |
| `revolution__search_documents` | Keyword search across markdown corpus. | `results[]` (relativePath, category, snippet, `citations[]`). |
| `revolution__query_theory` | Synthesizes an answer using relevant docs with citations. | `answer`, `citations[]` (source, title, snippet, confidence). |

The ingestion pipeline indexes `docs/`, `analysis/`, `organizing-guides/`, and `additional-sources/`, and parses 19 neural memory keys from `docs/MEMORY-STRUCTURE-GUIDE.md`. A vector-index stub is wired in for future semantic retrieval.

---

## Quick Start (for LLM agents/clients)
1. **Install dependencies**
   ```bash
   cd server
   npm install
   npm run build
   ```

2. **Call a tool via helper script (stdio)**
   ```bash
   npm run call-tool -- revolution__query_theory '{"query":"alienation","limit":2}'
   ```
   Spawns the stdio MCP server, invokes the tool, and prints the JSON response. Replace the tool name/params as needed.

3. **Serve over HTTP (Streamable MCP)**
   ```bash
   REVOLUTION_HTTP_ENABLE=true npm start
   ```
   The server listens on `http://0.0.0.0:3000/mcp` by default (Vercel rewrite `/mcp` → `/api/mcp`). Override host/port with env vars below. MCP clients supporting Streamable HTTP can POST JSON-RPC requests and optionally open an SSE stream via `GET /mcp`.

   Example initialization request with `curl`:
   ```bash
   curl -X POST http://localhost:3000/mcp \
     -H 'Content-Type: application/json' \
     -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{}}}'
   ```

4. **Integrate with your own MCP client**
   - **Stdio:** run `node dist/index.js` and connect via stdio transport.
   - **HTTP:** point your Streamable HTTP client at `http://<host>:<port>/mcp`.
   - Use standard MCP `listTools` / `callTool` flows to interact with the knowledge base.

---

## Environment Configuration
Environment variables (optional):

| Variable | Description | Default |
|----------|-------------|---------|
| `REVOLUTION_KB_PATH` | Knowledge base root. | Parent directory |
| `REVOLUTION_MEMORY_NAMESPACE` | Flow Nexus namespace. | `revolution` |
| `REVOLUTION_MEMORY_GUIDE_PATH` | Path to memory guide Markdown. | `docs/MEMORY-STRUCTURE-GUIDE.md` |
| `REVOLUTION_MCP_NAME` | Server name advertised to clients. | `revolution-mcp-server` |
| `REVOLUTION_MCP_VERSION` | Server version. | `package.json` version |
| `REVOLUTION_LOG_LEVEL` | Logger level. | `info` |
| `REVOLUTION_HTTP_ENABLE` | `true` to enable HTTP transport. | `false` |
| `REVOLUTION_HTTP_PORT` | HTTP port when enabled. | `3000` |
| `REVOLUTION_HTTP_HOST` | HTTP host bind address. | `0.0.0.0` |

`.env` files are loaded automatically via `dotenv`.

---

## Project Scripts
| Command | Description |
|---------|-------------|
| `npm run build` | Type check and emit `dist/`. |
| `npm start` | Start MCP server (stdio). |
| `npm test` | Run smoke tests via `tsx`. |
| `npm run call-tool -- <tool> '<json>'` | Spawn server and call a tool; prints JSON response. |
| `npm run dev` | (Optional) Live-reload development server with `ts-node`. |

---

## Smoke Test Coverage
`tests/smoke.test.ts` verifies:
- Configuration/bootstrap
- Catalog + vector-index initialization
- Flow Nexus memory parsing
- Tool registration and JSON outputs (ping, memory list/get, document search, theory query)

Run with `npm test`.

---

## Folder Structure
```
server/
├── dist/                 # build output (after npm run build)
├── scripts/              # helper scripts (call-tool)
├── src/
│   ├── catalog/          # ingestion + search index
│   ├── memory/           # Flow Nexus adapter
│   ├── retrieval/        # vector index stub
│   ├── tools/            # MCP tool registrations
│   └── index.ts          # MCP server entry point
├── tests/                # smoke test
└── README.md
```

---

## Roadmap Highlights
- Replace the vector stub with real embeddings + hybrid retrieval.
- Expand theory tooling to include comparisons, historical context, and campaign planning.
- Add prompts/resources and eventually integrate with live Flow Nexus APIs.

For questions or integration troubleshooting, inspect the implementation log at `docs/REVOLUTION-MCP-IMPLEMENTATION-NOTES.md`.
