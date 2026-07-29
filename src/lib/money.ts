const currencyDecimals: Record<string, number> = {
  BHD: 3,
  JOD: 3,
  KWD: 3,
  OMR: 3,
  CLP: 0,
  JPY: 0,
  KRW: 0
};

export function currencyExponent(currency: string) {
  return currencyDecimals[currency.toUpperCase()] ?? 2;
}

export function toMinorUnits(amount: string, currency: string) {
  const normalized = amount.replaceAll(",", "").trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error("Enter a valid positive amount.");
  }
  const exponent = currencyExponent(currency);
  const [whole, fraction = ""] = normalized.split(".");
  if (fraction.length > exponent) {
    throw new Error(`${currency} supports ${exponent} decimal places.`);
  }
  const padded = fraction.padEnd(exponent, "0");
  return BigInt(whole) * 10n ** BigInt(exponent) + BigInt(padded || "0");
}

export function formatMoney(amountMinor: number | bigint, currency: string) {
  const exponent = currencyExponent(currency);
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: exponent,
    maximumFractionDigits: exponent
  }).format(Number(amountMinor) / 10 ** exponent);
}

export function calculateDeposit(totalMinor: bigint, depositBasisPoints: number) {
  if (
    !Number.isInteger(depositBasisPoints) ||
    depositBasisPoints < 100 ||
    depositBasisPoints > 10_000
  ) {
    throw new Error("Deposit must be between 1% and 100%.");
  }
  return (totalMinor * BigInt(depositBasisPoints) + 5_000n) / 10_000n;
}
