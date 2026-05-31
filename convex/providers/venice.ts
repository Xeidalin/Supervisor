import { ProviderDefinition } from "./types";

function toMinorUnits(decimalStr: string, decimals: number): string {
  const num = parseFloat(decimalStr);
  if (isNaN(num)) return "0";
  const [whole, frac = ""] = decimalStr.split(".");
  const paddedFrac = frac.padEnd(decimals, "0").substring(0, decimals);
  const result = whole + paddedFrac;
  return result.replace(/^0+(\d)/, "$1") || "0";
}

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
    // Fetch current month usage (first page)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const endDate = now.toISOString().split("T")[0];

    const url = `https://api.venice.ai/api/v1/billing/usage?startDate=${startOfMonth}&endDate=${endDate}&limit=200&sortOrder=desc`;

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

    // Aggregate all entries for the month
    let totalAmount = 0;
    const currency = data.data?.[0]?.currency ?? "USD";
    const decimals = 2;

    for (const entry of data.data ?? []) {
      totalAmount += entry.amount ?? 0;
    }

    // If there are more pages, we'd fetch them. For MVP, just page 1.
    const costThisMonth = totalAmount.toFixed(decimals);

    return {
      balanceMinor: null,
      costThisMonthMinor: toMinorUnits(costThisMonth, decimals),
      dailySpendMinor: null,
      currency,
      decimals,
      rawData: data,
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
