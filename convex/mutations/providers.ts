import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const addProvider = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");

    return await ctx.db.insert("providers", {
      userId: identity.subject,
      providerType: args.providerType,
      name: args.name,
      externalAccountLabel: args.externalAccountLabel,
      environment: args.environment,
      syncMode: args.syncMode,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateProvider = mutation({
  args: {
    providerId: v.id("providers"),
    name: v.optional(v.string()),
    externalAccountLabel: v.optional(v.string()),
    environment: v.optional(
      v.union(
        v.literal("Produccion"),
        v.literal("Desarrollo"),
        v.literal("Pruebas"),
      ),
    ),
    syncMode: v.optional(v.union(v.literal("auto"), v.literal("manual"))),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");

    const provider = await ctx.db.get(args.providerId);
    if (!provider || provider.userId !== identity.subject) {
      throw new Error("No autorizado");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.externalAccountLabel !== undefined)
      updates.externalAccountLabel = args.externalAccountLabel;
    if (args.environment !== undefined) updates.environment = args.environment;
    if (args.syncMode !== undefined) updates.syncMode = args.syncMode;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    return await ctx.db.patch(args.providerId, updates);
  },
});

export const deleteProvider = mutation({
  args: { providerId: v.id("providers") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");

    const provider = await ctx.db.get(args.providerId);
    if (!provider || provider.userId !== identity.subject) {
      throw new Error("No autorizado");
    }

    await ctx.db.delete(args.providerId);
    return { success: true };
  },
});
