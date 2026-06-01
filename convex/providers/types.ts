export interface UsageResult {
  balanceMinor: string | null;
  costThisMonthMinor: string | null;
  dailySpendMinor: string | null;
  currency: string;
  decimals: number;
  rawData: unknown;
}

export interface ProviderCapabilities {
  supportsAutoSync: boolean;
  requiredKeyType: "standard" | "admin" | "org_admin" | "bearer";
  returnsBalance: boolean;
  returnsCost: boolean;
  returnsUsage: boolean;
  manualEntryAvailable: boolean;
}

export interface ProviderDefinition {
  id: string;
  name: string;
  logoPath: string;
  capabilities: ProviderCapabilities;
  fetchUsage(apiKey: string): Promise<UsageResult>;
  validateApiKey(apiKey: string): Promise<boolean>;
}
