import path from "node:path";
import { existsSync } from "node:fs";
import dotenv from "dotenv";

dotenv.config();

export interface ServerConfig {
  /** Human-readable server name exposed via MCP handshake */
  name: string;
  /** Semantic version string reported to clients */
  version: string;
  /** Absolute path to the knowledge base root directory */
  knowledgeBasePath: string;
  /** Flow Nexus namespace containing memory keys */
  memoryNamespace: string;
  /** Optional Flow Nexus API base URL when remote access is required */
  flowNexusBaseUrl?: string;
  /** Optional Flow Nexus access token */
  flowNexusApiKey?: string;
  /** Override relative path to memory guide markdown, if not default */
  memoryGuideRelativePath?: string;
  /** Enable HTTP transport for MCP */
  enableHttp?: boolean;
  /** HTTP port */
  httpPort?: number;
  /** HTTP hostname */
  httpHost?: string;
}

const DEFAULT_NAME = "revolution-mcp-server";
const DEFAULT_VERSION = process.env.npm_package_version ?? "0.1.0";
const DEFAULT_NAMESPACE = "revolution";

/**
 * Load configuration from environment variables with reasonable defaults.
 */
export function loadConfig(): ServerConfig {
  const defaultKnowledgeBase = path.resolve(process.cwd(), "knowledge-base");
  const baseDir = process.env.REVOLUTION_KB_PATH ?? defaultKnowledgeBase;
  const flowNexusBaseUrl = process.env.FLOW_NEXUS_BASE_URL;
  const flowNexusApiKey = process.env.FLOW_NEXUS_API_KEY;
  const memoryGuideRelativePath = process.env.REVOLUTION_MEMORY_GUIDE_PATH;
  const enableHttp = process.env.REVOLUTION_HTTP_ENABLE?.toLowerCase() === "true";
  const httpPort = process.env.REVOLUTION_HTTP_PORT ? Number(process.env.REVOLUTION_HTTP_PORT) : undefined;
  const httpHost = process.env.REVOLUTION_HTTP_HOST;

  const resolvedBase = path.resolve(baseDir);
  if (!existsSync(resolvedBase)) {
    throw new Error(`Knowledge base path not found: ${resolvedBase}`);
  }

  return {
    name: process.env.REVOLUTION_MCP_NAME ?? DEFAULT_NAME,
    version: process.env.REVOLUTION_MCP_VERSION ?? DEFAULT_VERSION,
    knowledgeBasePath: resolvedBase,
    memoryNamespace: process.env.REVOLUTION_MEMORY_NAMESPACE ?? DEFAULT_NAMESPACE,
    ...(flowNexusBaseUrl ? { flowNexusBaseUrl } : {}),
    ...(flowNexusApiKey ? { flowNexusApiKey } : {}),
    ...(memoryGuideRelativePath ? { memoryGuideRelativePath } : {}),
    ...(enableHttp ? { enableHttp } : {}),
    ...(httpPort ? { httpPort } : {}),
    ...(httpHost ? { httpHost } : {})
  };
}
