export function normalizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return undefined;
  }

  if (Array.isArray(obj)) {
    // Normalize array items, filter out undefined
    const normalizedList = obj
      .map((item) => normalizeObject(item))
      .filter((item) => item !== undefined);
      
    // Sort array elements by their string representation
    return normalizedList.sort((a, b) => {
      const strA = JSON.stringify(a);
      const strB = JSON.stringify(b);
      if (strA < strB) return -1;
      if (strA > strB) return 1;
      return 0;
    });
  }

  if (typeof obj === "object") {
    // Sort keys alphabetically
    const keys = Object.keys(obj).sort();
    const result: Record<string, any> = {};
    for (const key of keys) {
      const val = normalizeObject(obj[key]);
      // Skip undefined, null, or empty string if you want to be extremely robust against defaults.
      // We will skip null and undefined to match canonical Pydantic model exclusion.
      if (val !== undefined && val !== null) {
        result[key] = val;
      }
    }
    return result;
  }

  return obj;
}

export function generateCanonicalHash(obj: any): string {
  if (!obj) return "";
  const normalized = normalizeObject(obj);
  return JSON.stringify(normalized);
}
