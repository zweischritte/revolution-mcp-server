export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.status(200).end(JSON.stringify({
    status: "ok",
    message: "MCP endpoint available at /mcp",
    mcpEndpoint: "/mcp"
  }));
}
