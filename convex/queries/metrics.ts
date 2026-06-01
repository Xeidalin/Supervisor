import { v } from "convex/values";
import { query, internalQuery } from "../_generated/server";

export const getMetrics = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");
    return await ctx.db
      .query("usageMetrics")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});

export const getLatestMetrics = internalQuery({
  args: { providerId: v.id("providers") },
  handler: async (ctx, args) => {
    const metrics = await ctx.db
      .query("usageMetrics")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .order("desc")
      .first();
    return metrics;
  },
});
