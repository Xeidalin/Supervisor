import { v } from "convex/values";
import { internalMutation, mutation } from "../_generated/server";

/**
 * Internal mutation: stores an already-encrypted API key.
 * Only callable from addApiKey action (never from frontend).
 * The frontend never sees encryptedKey.
 */
export const storeEncryptedKey = internalMutation({
  args: {
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
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("apiKeys", {
      userId: args.userId,
      providerId: args.providerId,
      prefix: args.prefix,
      last4: args.last4,
      maskedKey: args.maskedKey,
      encryptedKey: args.encryptedKey,
      keyVersion: args.keyVersion,
      keyType: args.keyType,
      environment: args.environment,
      isActive: true,
      createdBy: args.createdBy,
      createdAt: Date.now(),
    });
  },
});

/**
 * Get masked API keys for a provider.
 * Auth is verified server-side. NEVER returns encryptedKey.
 */
export const getApiKeys = mutation({
  args: {
    providerId: v.id("providers"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");
    const userId = identity.subject;

    const keys = await ctx.db
      .query("apiKeys")
      .withIndex("by_user_provider", (q) =>
        q.eq("userId", userId).eq("providerId", args.providerId),
      )
      .collect();

    // Strip sensitive fields before returning to frontend
    return keys.map(({ encryptedKey, ...rest }) => rest);
  },
});
