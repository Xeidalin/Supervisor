import { query } from "../_generated/server";

export const getModels = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");
    return await ctx.db
      .query("models")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});
