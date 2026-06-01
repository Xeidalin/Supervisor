/**
 * Convert a decimal string like "110.00" to minor units string "11000".
 * Pure string math — no floating point operations.
 */
export function toMinorUnits(decimalStr: string, decimals: number): string {
  if (!decimalStr || decimalStr === "0") return "0";

  const negative = decimalStr.startsWith("-");
  const absStr = negative ? decimalStr.slice(1) : decimalStr;
  const [whole, frac = ""] = absStr.split(".");

  // Round: look at the digit just beyond the cutoff
  let fractional = frac.padEnd(decimals + 1, "0").substring(0, decimals + 1);
  const roundingDigit = fractional[decimals];
  fractional = fractional.substring(0, decimals);

  if ((roundingDigit ?? "0") >= "5") {
    // Increment: add 1 as a bigint to fractional, carrying into whole if needed
    const combined = BigInt(whole + fractional) + BigInt(1);
    const combinedStr = combined.toString().padStart(whole.length + decimals, "0");
    const newWhole = combinedStr.length > decimals
      ? combinedStr.slice(0, combinedStr.length - decimals)
      : "0";
    const newFrac = combinedStr.slice(combinedStr.length - decimals);
    const result = negative ? `-${newWhole}${newFrac}` : `${newWhole}${newFrac}`;
    return result.replace(/^-?0+(\d)/, negative ? "-$1" : "$1") || "0";
  }

  const result = negative ? `-${whole}${fractional}` : `${whole}${fractional}`;
  return result.replace(/^-?0+(\d)/, negative ? "-$1" : "$1") || "0";
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
