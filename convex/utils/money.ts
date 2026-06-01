/**
 * Convert a decimal string like "110.00" to minor units string "11000".
 * Pure string math — no floating point operations.
 */
export function toMinorUnits(decimalStr: string, decimals: number): string {
  if (!decimalStr || decimalStr === "0") return "0";

  const [whole, frac = ""] = decimalStr.split(".");
  const paddedFrac = frac.padEnd(decimals, "0").substring(0, decimals);
  const result = whole + paddedFrac;
  return result.replace(/^0+(\d)/, "$1") || "0";
}

/** Map currency code to its decimal places */
const CURRENCY_DECIMALS: Record<string, number> = {
  USD: 2,
  EUR: 2,
  CNY: 2,
  VCU: 2,
  DIEM: 2,
  JPY: 0,
  KRW: 0,
};

export function getDecimals(currency: string): number {
  return CURRENCY_DECIMALS[currency.toUpperCase()] ?? 2;
}
