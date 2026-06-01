import { v } from "convex/values";
import { action, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { encrypt, maskKey, decrypt } from "../utils/encryption";

/**
 * Public action: receives an API key from the frontend,
 * verifies auth and ownership, encrypts it, and stores it.
 * This is the ONLY function the frontend calls with a plaintext key.
 */
export const addApiKey = action({
  args: {
    plaintext: v.string(),
    providerId: v.id("providers"),
    keyType: v.union(
      v.literal("standard"),
      v.literal("admin"),
      v.literal("org_admin"),
      v.literal("bearer"),
    ),
    environment: v.string(),
  },
  handler: async (ctx, args) => {
    // 0. VERIFY AUTH (server-side, never trust frontend)
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("No autenticado");
    }
    const userId = identity.subject;

    // 1. VERIFY OWNERSHIP
    const provider = await ctx.runQuery(
      internal.queries.getProviderById,
      { providerId: args.providerId },
    );
    if (!provider || provider.userId !== userId) {
      throw new Error("No autorizado: el proveedor no pertenece a este usuario");
    }

    // 2. Validate key format (basic checks per provider type)
    if (!args.plaintext || args.plaintext.length < 4) {
      throw new Error("API key inválida: demasiado corta");
    }

    // 3. Read encryption key from env
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error(
        "Configuración del servidor incompleta: falta ENCRYPTION_KEY",
      );
    }

    // 4. Encrypt
    const encryptedKey = encrypt(args.plaintext, encryptionKey);

    // 5. Build masked key
    const { prefix, last4, maskedKey } = maskKey(args.plaintext);

    // 6. Store via internal mutation
    await ctx.runMutation(internal.mutations.apiKeys.storeEncryptedKey, {
      userId,
      providerId: args.providerId,
      prefix,
      last4,
      maskedKey,
      encryptedKey,
      keyVersion: 1,
      keyType: args.keyType,
      environment: args.environment,
      createdBy: userId,
    });

    // 7. Hygiene: overwrite plaintext
    args.plaintext = "";

    // 8. Return only masked data
    return { success: true, maskedKey };
  },
});

/**
 * Internal action: decrypt an API key for sync purposes.
 * NEVER callable from frontend.
 */
export const decryptApiKey = internalAction({
  args: {
    encryptedKey: v.string(),
  },
  handler: async (_ctx, args) => {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error("Falta ENCRYPTION_KEY");
    }
    const plaintext = decrypt(args.encryptedKey, encryptionKey);
    return { plaintext };
  },
});
