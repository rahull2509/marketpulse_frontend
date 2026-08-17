/**
 * Query Builder IntelliSense Foundation (Phase 1A matching engine)
 * 
 * PURPOSE:
 * This module is a foundational library providing a highly performant, pure matching engine 
 * for live column suggestions. It is 100% decoupled from the UI, DOM, and React.
 * 
 * PUBLIC API:
 * matchColumns(token: string | null | undefined, metadata: ColumnMetadata[] | null | undefined, limit: number = 10): ColumnMetadata[]
 * 
 * MATCHING PRIORITY RULES:
 * 1. Exact Prefix: The normalized column ID or display name starts exactly with the token (e.g. Vol -> Volume).
 * 2. Starts With: Any individual word within the string starts with the token (e.g. Vol -> Previous Volume).
 * 3. Contains: The normalized string contains the token anywhere (e.g. tradevalue -> Calculated_Trade_Value).
 * 
 * NORMALIZATION RULES:
 * - Fully case-insensitive.
 * - Strips out spaces and underscores.
 * - Safely preserves special characters (%, -, /, &, #).
 * 
 * COMPLEXITY:
 * - Time: O(M) amortized, easily supports 1000+ columns within <16ms thanks to WeakMap normalization caching.
 * - Space: O(M) for the WeakMap cache.
 * 
 * ENGINEERING CONSTRAINTS (FROZEN):
 * This file is considered a STABLE LIBRARY. 
 * Future phases must NOT modify this algorithm, its priorities, its null safety, or its cache behavior 
 * unless a critical production regression is identified.
 */

import type { ColumnMetadata } from "@/types/metadata";

/**
 * Cache to ensure we normalize each ColumnMetadata object only once.
 * This avoids repeatedly calling toLowerCase() and replace() during filtering.
 */
const normalizationCache = new WeakMap<ColumnMetadata, {
  normCol: string;
  normDisplay: string;
  colWords: string[];
  displayWords: string[];
}>();

function getCachedNormalized(col: ColumnMetadata) {
  let cached = normalizationCache.get(col);
  if (!cached) {
    const rawCol = col.column || "";
    const rawDisplay = col.display_name || "";
    
    // Fully normalized strings (lowercase, preserving special characters like %, /, -, &, #)
    // Only strip spaces and underscores
    const normCol = rawCol.toLowerCase().replace(/[_\s]+/g, "");
    const normDisplay = rawDisplay.toLowerCase().replace(/[_\s]+/g, "");
    
    // Words array for Priority 2 matching (word prefix)
    const colWords = rawCol.toLowerCase().split(/[_\s]+/).filter(Boolean);
    const displayWords = rawDisplay.toLowerCase().split(/[_\s]+/).filter(Boolean);
    
    cached = { normCol, normDisplay, colWords, displayWords };
    normalizationCache.set(col, cached);
  }
  return cached;
}

function normalizeToken(token: string | null | undefined): string {
  if (!token) return "";
  return token.toLowerCase().replace(/[_\s]+/g, "");
}

/**
 * Matches and ranks columns based on the input token.
 * 
 * Rules:
 * - Case insensitive
 * - Ignore spaces and underscores
 * - No duplicate results
 * - Safe against null/undefined inputs
 * - Preserves original metadata order for ties
 * 
 * Priorities:
 * 1. Exact Prefix (normalized string starts with normalized token)
 * 2. Starts With (any individual word starts with the token)
 * 3. Contains (normalized string includes the token)
 * 
 * @param token The current search string
 * @param metadata Array of available column metadata
 * @param limit Maximum results (default 10)
 */
export function matchColumns(
  token: string | null | undefined,
  metadata: ColumnMetadata[] | null | undefined,
  limit: number = 10
): ColumnMetadata[] {
  if (!token || !metadata || !Array.isArray(metadata)) {
    return [];
  }

  const normToken = normalizeToken(token);
  if (normToken.length === 0) {
    return [];
  }

  const results: Array<{ col: ColumnMetadata, priority: number, originalIndex: number }> = [];

  for (let i = 0; i < metadata.length; i++) {
    const col = metadata[i];
    if (!col) continue;

    const { normCol, normDisplay, colWords, displayWords } = getCachedNormalized(col);

    // Priority 1: Exact Prefix
    if (normCol.startsWith(normToken) || normDisplay.startsWith(normToken)) {
      results.push({ col, priority: 1, originalIndex: i });
      continue; // Skip further checks to prevent duplicates
    }

    // Priority 2: Starts With (Any word starts with the token)
    let isPriority2 = false;
    for (const word of colWords) {
      if (word.startsWith(normToken)) {
        isPriority2 = true;
        break;
      }
    }
    if (!isPriority2) {
      for (const word of displayWords) {
        if (word.startsWith(normToken)) {
          isPriority2 = true;
          break;
        }
      }
    }

    if (isPriority2) {
      results.push({ col, priority: 2, originalIndex: i });
      continue;
    }

    // Priority 3: Contains
    if (normCol.includes(normToken) || normDisplay.includes(normToken)) {
      results.push({ col, priority: 3, originalIndex: i });
      continue;
    }
  }

  // Rank based on priority, resolving ties with original array index
  results.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return a.originalIndex - b.originalIndex;
  });

  // Extract up to `limit` columns
  return results.slice(0, limit).map(r => r.col);
}
