import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { getProvider } from "../providers/registry";
import { decrypt } from "../utils/encryption";

const RATE_LIMITS: Record<string, number> = {
  deepseek: 60_000, // 1 req / 60s
  venice: 120_000, // 1 req / 120s (beta)
  openai: 60_000,
  anthropic: 60_000,
};

/**
 * Internal action: sync all auto-sync providers for all users.
 * NEVER callable from frontend. Runs via cron hourly.
 */
export const syncAllProviders = internalAction({
  args: {},
  handler: async (ctx) => {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      console.error("syncAllProviders: missing ENCRYPTION_KEY");
      return;
    }

    // 1. Get all users who have at least one provider
    const allProviders = await ctx.runQuery(
      internal.queries.getAllAutoSyncProviders,
      {},
    );

    // Group by userId
    const byUser = new Map<string, typeof allProviders>();
    for (const p of allProviders) {
      const list = byUser.get(p.userId) || [];
      list.push(p);
      byUser.set(p.userId, list);
    }

    // 2. For each user, sync each provider
    for (const [userId, providers] of byUser) {
      for (const provider of providers) {
        const startedAt = Date.now();

        // Get API key
        const apiKeyDoc = await ctx.runQuery(
          internal.queries.getActiveApiKey,
          { providerId: provider._id },
        );
        if (!apiKeyDoc) {
          await ctx.runMutation(internal.mutations.metrics.storeSyncRun, {
            userId,
            providerId: provider._id,
            startedAt,
            finishedAt: Date.now(),
            status: "failed",
            errorMessage: "No active API key",
          });
          continue;
        }

        // Decrypt
        const { plaintext } = await ctx.runAction(
          internal.actions.encryption.decryptApiKey,
          { encryptedKey: apiKeyDoc.encryptedKey },
        );

        // Fetch usage
        const providerDef = getProvider(provider.providerType);
        if (!providerDef) continue;

        try {
          const result = await providerDef.fetchUsage(plaintext);

          // Estimate daily spend for providers that only return balance
          if (result.balanceMinor && !result.dailySpendMinor) {
            const prevSnapshot = await ctx.runQuery(
              internal.queries.getLatestSnapshot,
              { providerId: provider._id },
            );
            if (prevSnapshot?.balanceMinor) {
              const prevBalance = BigInt(prevSnapshot.balanceMinor);
              const currBalance = BigInt(result.balanceMinor);
              if (currBalance < prevBalance) {
                const spent = prevBalance - currBalance;
                const days = Math.max(
                  1,
                  (startedAt - prevSnapshot.timestamp) / (24 * 3600_000),
                );
                const dailyEstimate = spent / BigInt(Math.round(days));
                result.dailySpendMinor = dailyEstimate.toString();
              }
            }
          }

          // Sanitize rawResponse (strip sensitive fields)
          const rawStr = JSON.stringify(result.rawData);
          const sanitized = rawStr.length > 65536
            ? rawStr.substring(0, 65536)
            : rawStr;

          await ctx.runMutation(internal.mutations.metrics.storeMetrics, {
            userId,
            providerId: provider._id,
            balanceMinor: result.balanceMinor,
            costThisMonthMinor: result.costThisMonthMinor,
            dailySpendMinor: result.dailySpendMinor,
            currency: result.currency,
            decimals: result.decimals,
            source: "auto_sync",
            sourceReliability: "high",
            rawResponse: sanitized,
          });

          await ctx.runMutation(internal.mutations.metrics.storeSyncRun, {
            userId,
            providerId: provider._id,
            startedAt,
            finishedAt: Date.now(),
            status: "success",
            balanceSnapshotMinor: result.balanceMinor,
            dailySpendSnapshotMinor: result.dailySpendMinor,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          await ctx.runMutation(internal.mutations.metrics.storeSyncRun, {
            userId,
            providerId: provider._id,
            startedAt,
            finishedAt: Date.now(),
            status: "failed",
            errorMessage: msg.substring(0, 500),
          });
        } finally {
          // Rate limit per provider
          const delay = RATE_LIMITS[provider.providerType] ?? 60_000;
          await new Promise((r) => setTimeout(r, delay / 1000));
        }
      }
    }
  },
});
