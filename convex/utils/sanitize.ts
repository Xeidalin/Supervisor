/**
 * Recursively sanitize a provider's raw response before storing.
 * Strips known sensitive field patterns: tokens, keys, secrets, headers, etc.
 * Redacts values to "[REDACTED]" while preserving object structure.
 */

const SENSITIVE_PATTERNS: RegExp[] = [
  /token/i,
  /secret/i,
  /password/i,
  /api[_-]?key/i,
  /auth/i,
  /authorization/i,
  /bearer/i,
  /credential/i,
  /signature/i,
  /private[_-]?key/i,
  /access[_-]?token/i,
  /refresh[_-]?token/i,
  /session[_-]?token/i,
  /x-api-key/i,
];

const MAX_DEPTH = 20;
const MAX_JSON_SIZE = 65536; // 64 KiB

/**
 * Recursively walk an object and redact sensitive field values.
 * Returns a JSON string (truncated to 64 KiB if necessary).
 */
export function sanitizeResponse(data: unknown): string {
  const sanitized = sanitizeValue(data, 0);
  const json = JSON.stringify(sanitized);
  if (json.length <= MAX_JSON_SIZE) return json;

  // Truncate at a clean boundary then close open brackets
  let truncated = json.substring(0, MAX_JSON_SIZE);
  const openBraces = (truncated.match(/{/g) || []).length;
  const closeBraces = (truncated.match(/}/g) || []).length;
  const openBrackets = (truncated.match(/\[/g) || []).length;
  const closeBrackets = (truncated.match(/\]/g) || []).length;

  truncated += "}".repeat(Math.max(0, openBraces - closeBraces));
  truncated += "]".repeat(Math.max(0, openBrackets - closeBrackets));
  // Remove last incomplete string if any (trailing quote without matching)
  const lastQuote = truncated.lastIndexOf('"');
  if (
    lastQuote > 0 &&
    (truncated.match(/"/g) || []).length % 2 !== 0
  ) {
    truncated = truncated.substring(0, lastQuote) + '"[TRUNCATED]"';
  }

  return truncated;
}

function sanitizeValue(value: unknown, depth: number): unknown {
  if (depth > MAX_DEPTH) return "[MAX_DEPTH]";

  if (Array.isArray(value)) {
    return value.map((v) => sanitizeValue(v, depth + 1));
  }

  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      // Check if this key matches a sensitive pattern
      const isSensitive = SENSITIVE_PATTERNS.some((p) => p.test(key));

      if (isSensitive) {
        result[key] = "[REDACTED]";
      } else if (typeof val === "string" && looksLikeApiKey(val)) {
        // Redact even if the key isn't recognized as sensitive
        result[key] = "[REDACTED]";
      } else {
        result[key] = sanitizeValue(val, depth + 1);
      }
    }
    return result;
  }

  return value;
}

function looksLikeApiKey(value: string): boolean {
  // Skip short strings and pure numbers
  if (value.length < 20) return false;
  if (/^\d+(\.\d+)?$/.test(value)) return false;

  // Check for common API key / token patterns
  if (/^sk-(ant-)?(admin-)?[A-Za-z0-9_-]{20,}$/.test(value)) return true;
  if (/^[A-Za-z0-9_-]{40,}$/.test(value) && hasHighEntropy(value)) return true;

  return false;
}

function hasHighEntropy(value: string): boolean {
  // Crude entropy check: mix of upper, lower, digits, and symbols
  const hasUpper = /[A-Z]/.test(value);
  const hasLower = /[a-z]/.test(value);
  const hasDigit = /[0-9]/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);
  const entropySources = [hasUpper, hasLower, hasDigit, hasSymbol].filter(Boolean).length;
  return entropySources >= 3;
}
