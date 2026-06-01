import { ProviderDefinition } from "./types";

/**
 * Convert a decimal string like "110.00" to minor units string "11000"
 * for currencies with 2 decimals.
 */
function toMinorUnits(decimalStr: string, decimals: number): string {
  const num = parseFloat(decimalStr);
  if (isNaN(num)) return "0";
  // Use string math to avoid floating point issues
  const [whole, frac = ""] = decimalStr.split(".");
  const paddedFrac = frac.padEnd(decimals, "0").substring(0, decimals);
  const result = whole + paddedFrac;
  // Remove leading zeros but keep at least one digit
  return result.replace(/^0+(\d)/, "$1") || "0";
}

export const deepseekProvider: ProviderDefinition = {
  id: "deepseek",
  name: "DeepSeek",
  logoPath: "/logos/deepseek.svg",
  capabilities: {
    supportsAutoSync: true,
    requiredKeyType: "standard",
    returnsBalance: true,
    returnsCost: false,
    returnsUsage: false,
    manualEntryAvailable: true,
  },
  async fetchUsage(apiKey: string) {
    const response = await fetch("https://api.deepseek.com/user/balance", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      throw new Error(
        `DeepSeek API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as {
      is_available: boolean;
      balance_infos: Array<{
        currency: string;
        total_balance: string;
        granted_balance: string;
        topped_up_balance: string;
      }>;
    };

    // Use first balance info entry
    const balanceInfo = data.balance_infos?.[0];
    const currency = balanceInfo?.currency ?? "USD";
    const decimals = currency === "CNY" ? 2 : 2;
    const totalBalance = balanceInfo?.total_balance ?? "0";

    return {
      balanceMinor: toMinorUnits(totalBalance, decimals),
      costThisMonthMinor: null,
      dailySpendMinor: null,
      currency,
      decimals,
      rawData: data,
    };
  },
  async validateApiKey(apiKey: string) {
    try {
      const response = await fetch("https://api.deepseek.com/user/balance", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};
