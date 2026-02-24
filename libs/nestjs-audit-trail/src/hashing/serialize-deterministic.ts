/**
 * Recursively builds a canonical representation: object keys sorted alphabetically,
 * Dates as ISO strings. Used so the same logical value always produces the same string.
 */
function canonicalize(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      sorted[key] = canonicalize(obj[key]);
    }
    return sorted;
  }
  return value;
}

/**
 * Deterministic JSON string for hashing: keys sorted recursively, stable representation.
 */
export function toDeterministicJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}
