import { v } from "convex/values";
import { query, internalQuery } from "../_generated/server";

export const getProviderById = internalQuery({
  args: { providerId: v.id("providers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.providerId);
  },
});

export const getProviders = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");
    return await ctx.db
      .query("providers")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});

export const getFilteredProviders = query({
  args: {
    providerType: v.optional(v.string()),
    environment: v.optional(v.string()),
    search: v.optional(v.string()),
    riskOnly: v.optional(v.boolean()),
    threshold: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");

    let providers = await ctx.db
      .query("providers")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    if (args.providerType) {
      providers = providers.filter(
        (p) => p.providerType === args.providerType,
      );
    }
    if (args.environment) {
      providers = providers.filter(
        (p) => p.environment === args.environment,
      );
    }
    if (args.search) {
      const q = args.search.toLowerCase();
      providers = providers.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.providerType.toLowerCase().includes(q),
      );
    }

    return providers;
  },
});
