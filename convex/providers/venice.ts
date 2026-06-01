import { ProviderDefinition } from "./types";
import { toMinorUnits, getDecimals } from "../utils/money";

const EXTRA_PRECISION = 4; // extra decimal places for accurate summation

export const veniceProvider: ProviderDefinition = {
  id: "venice",
  name: "Venice AI",
  logoPath: "/logos/venice.svg",
  capabilities: {
    supportsAutoSync: true,
    requiredKeyType: "bearer",
    returnsBalance: false,
    returnsCost: true,
    returnsUsage: true,
    manualEntryAvailable: true,
  },
  async fetchUsage(apiKey: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const endDate = now.toISOString().split("T")[0];
    const baseUrl = "https://api.venice.ai/api/v1/billing/usage";

    // Fetch all pages
    const allEntries: Array<{
      amount: number;
      currency: string;
      units: number;
      pricePerUnitUsd: number;
      timestamp: string;
    }> = [];

    let page = 1;
    let totalPages = 1;
    const limit = 200;

    while (page <= totalPages) {
      const url = `${baseUrl}?startDate=${startOfMonth}&endDate=${endDate}&limit=${limit}&page=${page}&sortOrder=desc`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Venice API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as {
        data: Array<{
          amount: number;
          currency: string;
          units: number;
          pricePerUnitUsd: number;
          timestamp: string;
        }>;
        pagination: { total: number; page: number; totalPages: number };
      };

      if (data.data) {
        allEntries.push(...data.data);
      }

      totalPages = data.pagination?.totalPages ?? 1;
      page++;
    }

    if (allEntries.length === 0) {
      const currency = "USD";
      const decimals = getDecimals(currency);
      return {
        balanceMinor: null,
        costThisMonthMinor: "0",
        dailySpendMinor: null,
        currency,
        decimals,
        rawData: { entries: [] },
      };
    }

    const currency = allEntries[0].currency ?? "USD";
    const decimals = getDecimals(currency);

    // Accumulate in minor units with extra precision to avoid float errors.
    // Each entry's amount is converted to an integer at (decimals + extra) precision,
    // summed as BigInt, then rounded back to the standard decimal places.
    const precision = decimals + EXTRA_PRECISION;
    let totalMinor = BigInt(0);

    for (const entry of allEntries) {
      const amountStr = entry.amount?.toString() ?? "0";
      const minorWithExtra = toMinorUnits(amountStr, precision);
      totalMinor += BigInt(minorWithExtra);
    }

    // Round back from extended precision to target decimals
    const divisor = BigInt(10) ** BigInt(EXTRA_PRECISION);
    const remainder = totalMinor % divisor;
    const rounded = totalMinor / divisor + (remainder * BigInt(2) >= divisor ? BigInt(1) : BigInt(0));

    return {
      balanceMinor: null,
      costThisMonthMinor: rounded.toString(),
      dailySpendMinor: null,
      currency,
      decimals,
      rawData: { entries: allEntries },
    };
  },
  async validateApiKey(apiKey: string) {
    try {
      const response = await fetch(
        "https://api.venice.ai/api/v1/billing/usage?limit=1",
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: "application/json",
          },
        },
      );
      return response.ok;
    } catch {
      return false;
    }
  },
};
