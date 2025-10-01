# Revolution MCP Knowledge Server

This repository contains the Revolution knowledge corpus and the accompanying Model Context Protocol (MCP) server implementation.

## Structure
- `docs/`, `analysis/`, `organizing-guides/`, `additional-sources/`, `memory/`: knowledge base consumed by the MCP server.
- `server/`: TypeScript MCP server exposing the knowledge base via stdio and Streamable HTTP.

## Local Usage
```bash
cd server
npm install
npm run build
REVOLUTION_HTTP_ENABLE=true npm start   # HTTP on http://0.0.0.0:3000/mcp
```

## Sample Tool Call
```bash
cd server
npm run call-tool -- revolution__query_theory '{"query":"alienation","limit":2}'
```

See `server/README.md` for detailed documentation.
