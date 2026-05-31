import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const addModel = mutation({
  args: {
    providerId: v.id("providers"),
    name: v.string(),
    avgCost: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");

    const provider = await ctx.db.get(args.providerId);
    if (!provider || provider.userId !== identity.subject) {
      throw new Error("No autorizado");
    }

    return await ctx.db.insert("models", {
      userId: identity.subject,
      providerId: args.providerId,
      name: args.name,
      avgCost: args.avgCost,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const deleteModel = mutation({
  args: { modelId: v.id("models") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");

    const model = await ctx.db.get(args.modelId);
    if (!model || model.userId !== identity.subject) {
      throw new Error("No autorizado");
    }

    await ctx.db.delete(args.modelId);
    return { success: true };
  },
});
