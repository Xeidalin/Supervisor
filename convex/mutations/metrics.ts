import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

export const storeMetrics = internalMutation({
  args: {
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
    rawResponse: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Insert new metrics
    await ctx.db.insert("usageMetrics", {
      userId: args.userId,
      providerId: args.providerId,
      balanceMinor: args.balanceMinor,
      costThisMonthMinor: args.costThisMonthMinor,
      dailySpendMinor: args.dailySpendMinor,
      currency: args.currency,
      decimals: args.decimals,
      source: args.source,
      sourceReliability: args.sourceReliability,
      syncedAt: now,
      rawResponse: args.rawResponse,
    });

    // Insert snapshot
    await ctx.db.insert("metricSnapshots", {
      userId: args.userId,
      providerId: args.providerId,
      balanceMinor: args.balanceMinor,
      dailySpendMinor: args.dailySpendMinor,
      timestamp: now,
    });
  },
});

export const storeSyncRun = internalMutation({
  args: {
    userId: v.string(),
    providerId: v.id("providers"),
    startedAt: v.number(),
    finishedAt: v.number(),
    status: v.union(
      v.literal("success"),
      v.literal("failed"),
      v.literal("timeout"),
    ),
    errorMessage: v.optional(v.string()),
    balanceSnapshotMinor: v.optional(v.string()),
    dailySpendSnapshotMinor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("syncRuns", {
      userId: args.userId,
      providerId: args.providerId,
      startedAt: args.startedAt,
      finishedAt: args.finishedAt,
      status: args.status,
      errorMessage: args.errorMessage,
      balanceSnapshotMinor: args.balanceSnapshotMinor,
      dailySpendSnapshotMinor: args.dailySpendSnapshotMinor,
    });
  },
});
