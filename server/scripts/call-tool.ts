import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

type Json = Record<string, unknown>;

async function main(): Promise<void> {
  const [, , toolName, paramsArg] = process.argv;

  if (!toolName) {
    console.error("Usage: npm run call-tool -- <tool-name> [json-params]");
    process.exit(1);
  }

  let params: Json | undefined;
  if (paramsArg) {
    try {
      params = JSON.parse(paramsArg) as Json;
    } catch (error) {
      console.error("Invalid JSON params:", error);
      process.exit(1);
    }
  }

  const transport = new StdioClientTransport({
    command: "node",
    args: ["dist/index.js"],
  });

  const client = new Client({
    name: "revolution-cli",
    version: "0.1.0",
  });

  await client.connect(transport);

  const result = await client.callTool({
    name: toolName,
    arguments: params ?? {},
  });

  console.log(JSON.stringify(result, null, 2));

  await client.close();
}

main().catch((error) => {
  console.error("call-tool failed", error);
  process.exit(1);
});
