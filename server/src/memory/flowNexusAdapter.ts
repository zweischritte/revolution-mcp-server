import { readFile } from "node:fs/promises";
import path from "node:path";

import { logger } from "../logger.js";

export interface FlowNexusConfig {
  namespace: string;
  knowledgeBasePath: string;
  memoryGuideRelativePath?: string;
  baseUrl?: string;
  apiKey?: string;
}

export interface MemoryKeySummary {
  name: string;
  createdAt?: string;
  summary?: string;
}

export interface MemoryKeyDetail extends MemoryKeySummary {
  highlights: string[];
}

export type MemoryKeyMap = Map<string, MemoryKeyDetail>;

interface ParsedMemoryGuide {
  keys: Map<string, MemoryKeyDetail>;
  warnings: string[];
}

export class FlowNexusAdapter {
  private memoryCache?: ParsedMemoryGuide;

  constructor(private readonly config: FlowNexusConfig) {}

  async loadAll(): Promise<MemoryKeyMap> {
    const { keys } = await this.ensureMemoryGuide();
    return keys;
  }

  async listMemoryKeys(): Promise<MemoryKeySummary[]> {
    const { keys } = await this.ensureMemoryGuide();
    return Array.from(keys.values()).map(({ highlights, ...summary }) => summary);
  }

  async getMemoryKey(name: string): Promise<MemoryKeyDetail | undefined> {
    const { keys } = await this.ensureMemoryGuide();
    return keys.get(name);
  }

  private async ensureMemoryGuide(): Promise<ParsedMemoryGuide> {
    if (this.memoryCache) {
      return this.memoryCache;
    }

    const guidePath = this.resolveGuidePath();
    try {
      const raw = await readFile(guidePath, "utf8");
      const parsed = parseMemoryGuide(raw);
      this.memoryCache = parsed;
      if (parsed.warnings.length > 0) {
        parsed.warnings.forEach((warning) => logger.warn(warning));
      }
      logger.info(`Loaded ${parsed.keys.size} memory keys from guide: ${guidePath}`);
      return parsed;
    } catch (error) {
      const message = `Unable to load memory guide at ${guidePath}: ${(error as Error).message}`;
      logger.warn(message);
      this.memoryCache = { keys: new Map(), warnings: [message] };
      return this.memoryCache;
    }
  }

  private resolveGuidePath(): string {
    const relative = this.config.memoryGuideRelativePath ?? path.join("docs", "MEMORY-STRUCTURE-GUIDE.md");
    return path.isAbsolute(relative)
      ? relative
      : path.join(this.config.knowledgeBasePath, relative);
  }
}

const MEMORY_SECTION_REGEX = /^#+\s*\d+\.\s*`([^`]+)`/;

function parseMemoryGuide(content: string): ParsedMemoryGuide {
  const lines = content.split(/\r?\n/);
  const keys = new Map<string, MemoryKeyDetail>();
  const warnings: string[] = [];

  let currentKey: MemoryKeyDetail | undefined;
  let collectingHighlights = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (collectingHighlights) {
        collectingHighlights = false;
      }
      continue;
    }

    const sectionMatch = line.match(MEMORY_SECTION_REGEX);
    if (sectionMatch) {
      const name = sectionMatch[1];
      if (!name) {
        warnings.push("Encountered memory section without parsable key name");
        collectingHighlights = false;
        currentKey = undefined;
        continue;
      }
      currentKey = {
        name,
        highlights: []
      };
      keys.set(name, currentKey);
      collectingHighlights = false;
      continue;
    }

    if (!currentKey) {
      continue;
    }

    if (line.startsWith("**Created**")) {
      currentKey.createdAt = line.replace("**Created**:", "").replace(/\s+$/, "").trim();
      continue;
    }

    if (line.startsWith("**Content**")) {
      currentKey.summary = line.replace("**Content**:", "").trim();
      collectingHighlights = true;
      continue;
    }

    if (line.startsWith("**")) {
      collectingHighlights = false;
      continue;
    }

    if (collectingHighlights && line.startsWith("-")) {
      currentKey.highlights.push(line.replace(/^[-•]\s*/, "").trim());
      continue;
    }
  }

  if (keys.size === 0) {
    warnings.push("No memory keys parsed from guide content");
  }

  return { keys, warnings };
}
