import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_email", ["email"]),

  providers: defineTable({
    userId: v.string(),
    providerType: v.union(
      v.literal("deepseek"),
      v.literal("venice"),
      v.literal("openai"),
      v.literal("anthropic"),
      v.literal("gemini"),
      v.literal("custom"),
    ),
    name: v.string(),
    externalAccountLabel: v.optional(v.string()),
    environment: v.union(
      v.literal("Produccion"),
      v.literal("Desarrollo"),
      v.literal("Pruebas"),
    ),
    syncMode: v.union(v.literal("auto"), v.literal("manual")),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_type", ["userId", "providerType"])
    .index("by_user_active", ["userId", "isActive"]),

  apiKeys: defineTable({
    userId: v.string(),
    providerId: v.id("providers"),
    prefix: v.string(),
    last4: v.string(),
    maskedKey: v.string(),
    encryptedKey: v.string(),
    keyVersion: v.number(),
    keyType: v.union(
      v.literal("standard"),
      v.literal("admin"),
      v.literal("org_admin"),
      v.literal("bearer"),
    ),
    environment: v.string(),
    isActive: v.boolean(),
    createdBy: v.string(),
    revokedAt: v.optional(v.number()),
    lastValidatedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_provider", ["providerId"])
    .index("by_user_provider", ["userId", "providerId"]),

  models: defineTable({
    userId: v.string(),
    providerId: v.id("providers"),
    name: v.string(),
    avgCost: v.optional(v.float64()),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_provider", ["providerId"]),

  usageMetrics: defineTable({
    userId: v.string(),
    providerId: v.id("providers"),
    balanceMinor: v.optional(v.string()),
    costThisMonthMinor: v.optional(v.string()),
    dailySpendMinor: v.optional(v.string()),
    currency: v.string(),
    decimals: v.number(),
    source: v.union(
      v.literal("auto_sync"),
      v.literal("manual_entry"),
      v.literal("imported"),
    ),
    sourceReliability: v.union(
      v.literal("high"),
      v.literal("medium"),
      v.literal("low"),
    ),
    syncedAt: v.number(),
    rawResponse: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_provider", ["providerId"])
    .index("by_user_synced", ["userId", "syncedAt"]),

  metricSnapshots: defineTable({
    userId: v.string(),
    providerId: v.id("providers"),
    balanceMinor: v.optional(v.string()),
    dailySpendMinor: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_user_provider_time", ["userId", "providerId", "timestamp"])
    .index("by_time", ["timestamp"]),

  syncRuns: defineTable({
    userId: v.string(),
    providerId: v.id("providers"),
    startedAt: v.number(),
    finishedAt: v.optional(v.number()),
    status: v.union(
      v.literal("running"),
      v.literal("success"),
      v.literal("failed"),
      v.literal("timeout"),
    ),
    errorMessage: v.optional(v.string()),
    balanceSnapshotMinor: v.optional(v.string()),
    dailySpendSnapshotMinor: v.optional(v.string()),
  })
    .index("by_user_provider", ["userId", "providerId", "startedAt"]),
});
