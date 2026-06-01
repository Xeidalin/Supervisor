import { ProviderDefinition } from "./types";
import { toMinorUnits, getDecimals } from "../utils/money";

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

    if (!data.is_available) {
      throw new Error("DeepSeek API is currently unavailable");
    }

    const balanceInfo = data.balance_infos?.[0];
    if (!balanceInfo) {
      throw new Error("DeepSeek returned empty balance_infos");
    }

    const currency = balanceInfo.currency;
    const decimals = getDecimals(currency);

    return {
      balanceMinor: toMinorUnits(balanceInfo.total_balance, decimals),
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
