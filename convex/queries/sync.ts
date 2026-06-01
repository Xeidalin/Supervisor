import { v } from "convex/values";
import { internalQuery } from "../_generated/server";

export const getAllAutoSyncProviders = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("providers")
      .filter((q) => q.eq(q.field("syncMode"), "auto"))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const getActiveApiKey = internalQuery({
  args: { providerId: v.id("providers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("apiKeys")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
  },
});

export const getLatestSnapshot = internalQuery({
  args: { userId: v.string(), providerId: v.id("providers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("metricSnapshots")
      .withIndex("by_user_provider_time", (q) =>
        q.eq("userId", args.userId).eq("providerId", args.providerId),
      )
      .order("desc")
      .first();
  },
});
