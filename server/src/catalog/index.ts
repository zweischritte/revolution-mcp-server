import { access, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import { logger } from "../logger.js";

export type CatalogItemType = "document" | "pdf";

export interface CatalogItem {
  id: string;
  type: CatalogItemType;
  relativePath: string;
  absolutePath: string;
  category: string;
  tags: string[];
  title?: string;
  mimeType: string;
  sizeBytes?: number;
}

export interface CatalogLoadResult {
  items: CatalogItem[];
  warnings: string[];
}

const SUPPORTED_DIRECTORIES = [
  { name: "docs", category: "docs" },
  { name: "analysis", category: "analysis" },
  { name: "organizing-guides", category: "organizing" },
  { name: "additional-sources", category: "sources" }
] as const;

const MARKDOWN_EXTENSIONS = new Set([".md", ".markdown"]);
const PDF_EXTENSIONS = new Set([".pdf"]);

interface FileDescriptor {
  filePath: string;
  relativePath: string;
  category: string;
}

/**
 * Load catalog metadata for markdown and PDF resources across the core knowledge base directories.
 */
export async function loadCatalog(knowledgeBasePath: string): Promise<CatalogLoadResult> {
  const resolvedBase = path.resolve(knowledgeBasePath);
  try {
    await access(resolvedBase);
  } catch (error) {
    const message = `Knowledge base path is not accessible: ${resolvedBase}`;
    logger.warn(message);
    logger.debug(`Catalog access error: ${(error as Error).message}`);
    return { items: [], warnings: [message] };
  }

  const items: CatalogItem[] = [];
  const warnings: string[] = [];

  for (const { name: directory, category } of SUPPORTED_DIRECTORIES) {
    const absoluteDirectory = path.join(resolvedBase, directory);
    const exists = await pathExists(absoluteDirectory);
    if (!exists) {
      warnings.push(`Knowledge directory missing: ${directory}`);
      continue;
    }

    const files = await collectFiles(absoluteDirectory, resolvedBase, category);
    for (const file of files) {
      const catalogItem = await createCatalogItem(file);
      if (catalogItem) {
        items.push(catalogItem);
      } else {
        warnings.push(`Unsupported file type skipped: ${file.relativePath}`);
      }
    }
  }

  logger.info(`Catalog loaded ${items.length} items`);

  return { items, warnings };
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function collectFiles(directory: string, basePath: string, category: string): Promise<FileDescriptor[]> {
  const entries = await readdir(directory, { withFileTypes: true });

  const results: FileDescriptor[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      const childDescriptors = await collectFiles(entryPath, basePath, category);
      results.push(...childDescriptors);
      continue;
    }

    const relativePath = path.relative(basePath, entryPath);
    results.push({ filePath: entryPath, relativePath, category });
  }

  return results;
}

async function createCatalogItem(descriptor: FileDescriptor): Promise<CatalogItem | undefined> {
  const { filePath, relativePath, category } = descriptor;
  const normalizedRelativePath = relativePath.split(path.sep).join("/");
  const extension = path.extname(filePath).toLowerCase();

  const stats = await stat(filePath);

  if (MARKDOWN_EXTENSIONS.has(extension)) {
    const content = await readFile(filePath, "utf8");
    const title = extractTitle(content);
    const item: CatalogItem = {
      id: normalizedRelativePath,
      type: "document",
      relativePath: normalizedRelativePath,
      absolutePath: filePath,
      category,
      tags: buildTags(normalizedRelativePath, category),
      mimeType: "text/markdown",
      sizeBytes: stats.size
    };
    if (title) {
      item.title = title;
    }
    return item;
  }

  if (PDF_EXTENSIONS.has(extension)) {
    return {
      id: normalizedRelativePath,
      type: "pdf",
      relativePath: normalizedRelativePath,
      absolutePath: filePath,
      category,
      tags: buildTags(normalizedRelativePath, category),
      mimeType: "application/pdf",
      sizeBytes: stats.size
    };
  }

  return undefined;
}

function extractTitle(content: string): string | undefined {
  const lines = content.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith("#")) {
      return line.replace(/^#+\s*/, "").trim() || undefined;
    }
  }
  return undefined;
}

function buildTags(relativePath: string, category: string): string[] {
  const segments = relativePath.split("/");
  segments.pop(); // remove filename
  const tagSet = new Set<string>([category]);
  segments.forEach((segment) => {
    if (segment) {
      tagSet.add(segment);
    }
  });
  return Array.from(tagSet);
}
