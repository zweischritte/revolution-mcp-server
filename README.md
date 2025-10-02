# Revolution MCP Knowledge Server

This repository contains the Revolution knowledge corpus and the accompanying Model Context Protocol (MCP) server implementation.

## Structure
- `server/knowledge-base/`: knowledge corpus (docs, analysis, organizing-guides, additional-sources, memory).
- `server/`: TypeScript MCP server exposing the corpus via stdio and Streamable HTTP.

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
