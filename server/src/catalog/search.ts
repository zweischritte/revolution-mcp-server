import type { CatalogItem } from "./index.js";

export interface CatalogSearchOptions {
  category?: string;
  tags?: string[];
  type?: CatalogItem["type"];
  limit?: number;
}

export function createCatalogIndex(items: CatalogItem[]): CatalogItemIndex {
  return new CatalogItemIndex(items);
}

export class CatalogItemIndex {
  private readonly tagMap = new Map<string, Set<CatalogItem>>();
  private readonly categoryMap = new Map<string, Set<CatalogItem>>();
  private readonly typeMap = new Map<CatalogItem["type"], Set<CatalogItem>>();

  constructor(private readonly items: CatalogItem[]) {
    for (const item of items) {
      if (!this.typeMap.has(item.type)) {
        this.typeMap.set(item.type, new Set());
      }
      this.typeMap.get(item.type)!.add(item);

      const categorySet = this.categoryMap.get(item.category) ?? new Set<CatalogItem>();
      categorySet.add(item);
      this.categoryMap.set(item.category, categorySet);

      for (const tag of item.tags) {
        if (!this.tagMap.has(tag)) {
          this.tagMap.set(tag, new Set());
        }
        this.tagMap.get(tag)!.add(item);
      }
    }
  }

  search(options: CatalogSearchOptions = {}): CatalogItem[] {
    const { category, tags, type, limit } = options;
    let results: Set<CatalogItem> | undefined;

    if (category && this.categoryMap.has(category)) {
      results = new Set(this.categoryMap.get(category));
    }

    if (type) {
      const typeSet = this.typeMap.get(type) ?? new Set();
      results = results ? intersectSets(results, typeSet) : new Set(typeSet);
    }

    if (tags && tags.length > 0) {
      const tagSets = tags.map((tag) => this.tagMap.get(tag) ?? new Set<CatalogItem>());
      if (tagSets.length > 0) {
        const combined = tagSets.reduce((acc, tagSet) => intersectSets(acc, tagSet), new Set(tagSets[0]));
        results = results ? intersectSets(results, combined) : combined;
      }
    }

    const finalResults = results ? Array.from(results) : Array.from(this.items);

    if (limit && limit > 0) {
      return finalResults.slice(0, limit);
    }

    return finalResults;
  }
}

function intersectSets<T>(a: Set<T>, b: Set<T>): Set<T> {
  const intersection = new Set<T>();
  for (const item of a) {
    if (b.has(item)) {
      intersection.add(item);
    }
  }
  return intersection;
}
