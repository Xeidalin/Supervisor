"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";

/**
 * Patterns that must NEVER appear in exported JSON.
 * Run this check before any export to prevent secret leakage.
 */
const FORBIDDEN_PATTERNS: RegExp[] = [
  /sk-/i,                         // API keys (OpenAI, DeepSeek, Anthropic, etc.)
  /Bearer\s+[A-Za-z0-9_-]{4,}/,  // Bearer tokens
  /api_key/i,                     // api_key field in JSON
  /encryptedKey/i,                // encryptedKey field
  /rawResponse/i,                 // rawResponse field
];

/**
 * Internal action: validate that an export JSON payload does not contain
 * any secrets. Returns { valid: false, matches: [...] } on failure.
 * NEVER callable from frontend.
 */
export const validateExportPayload = internalAction({
  args: {
    jsonStr: v.string(),
  },
  handler: async (_ctx, args) => {
    const matches: string[] = [];

    for (const pattern of FORBIDDEN_PATTERNS) {
      const m = args.jsonStr.match(pattern);
      if (m) {
        matches.push(`Forbidden pattern "${pattern}" matched: "${m[0]}"`);
      }
    }

    // Also check that apiKeys table data is not in the export
    if (
      args.jsonStr.includes('"apiKeys"') ||
      args.jsonStr.includes('"apiKeysTable"')
    ) {
      matches.push("Export contains apiKeys table data");
    }

    return { valid: matches.length === 0, matches };
  },
});
