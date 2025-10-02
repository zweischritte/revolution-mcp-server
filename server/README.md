# Revolution MCP Server Prototype

Model Context Protocol (MCP) server exposing the "revolution" knowledge base—documents, Flow Nexus memory keys, and derived synthesis tools—for use by other LLM agents.

---

## Capabilities Overview

The server provides **43 MCP tools** organized in 12 categories:

### Core Tools (5 tools)
| Tool | Purpose |
|------|---------|
| `revolution__ping` | Health check |
| `revolution__list_memory_keys` | Lists Flow Nexus memory keys |
| `revolution__get_memory_key` | Detailed memory key metadata |
| `revolution__search_documents` | Keyword search across corpus |
| `revolution__query_theory` | Synthesizes theory answers with citations |

### Claude Flow Integration (38 additional tools)

**Database Tools (3):** Query swarms, agents, and tasks from SQLite
**Hive Mind Coordination (3):** Consensus decisions, session state, agent communication
**Neural Networks (3):** Access 4 trained models (74.4%-94.8% accuracy)
**Session Management (3):** List, restore, export sessions
**Metrics & Analytics (3):** Performance metrics, system health, history
**Configuration (3):** Hive config, coordination state, memory updates
**Enhanced Memory (2):** Direct Memory database access
**Hooks Integration (4):** Pre-task, post-task, post-edit, session-end
**DAA Agents (2):** Create and adapt autonomous agents
**DAA Workflows (2):** Create and execute autonomous workflows
**DAA Knowledge (2):** Share knowledge, check learning status

**See `docs/CLAUDE-FLOW-TOOLS.md` for complete tool documentation.**

The ingestion pipeline indexes `docs/`, `analysis/`, `organizing-guides/`, and `additional-sources/`, parses 19 neural memory keys, and connects to Claude Flow SQLite databases (.hive-mind/hive.db, .hive-mind/memory.db) if available.

---

## Quick Start (for LLM agents/clients)
> Tip: on Vercel, set project root to `server/` and enable HTTP via `REVOLUTION_HTTP_ENABLE=true`.
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
   The server listens on `http://0.0.0.0:3000/mcp` by default. Override host/port with env vars below. MCP clients supporting Streamable HTTP can POST JSON-RPC requests and optionally open an SSE stream via `GET /mcp`.

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
| `REVOLUTION_KB_PATH` | Knowledge base root. | `./knowledge-base` |
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
├── knowledge-base/       # docs/, analysis/, organizing-guides/, additional-sources/, memory/
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

## What's New - Claude Flow Integration ✨

**Version 0.2.0 adds full Claude Flow/Hive Mind integration:**

✅ **SQLite Database Access**: Direct queries to Hive and Memory databases
✅ **Neural Network Models**: Access 4 trained models (94.8% max accuracy)
✅ **DAA Support**: Decentralized Autonomous Agents with cognitive patterns
✅ **Hooks Integration**: Execute Claude Flow hooks via MCP
✅ **Session Management**: Export/restore for Claude instance replication
✅ **Performance Metrics**: 2.8-4.4x speed, 84.8% SWE-Bench solve rate

**External LLMs can now access:**
- Revolutionary theory + Claude Flow coordination
- Swarm/agent/task data from SQLite
- Neural patterns with 94.8% accuracy
- Real-time system metrics
- Autonomous agent capabilities

## Roadmap
- ✅ Claude Flow SQLite integration (DONE)
- ✅ Neural network access (DONE)
- ✅ DAA and hooks support (DONE)
- 🚧 Real-time WebSocket streaming
- 🚧 Vector embeddings + hybrid retrieval
- 🚧 Live Flow Nexus API integration

For questions or troubleshooting, see:
- `docs/CLAUDE-FLOW-TOOLS.md` - Complete tool reference
- `docs/CLAUDE-FLOW-INTEGRATION-SPEC.md` - Architecture specification
