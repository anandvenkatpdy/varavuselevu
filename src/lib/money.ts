export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function formatMoney(cents: number, currency = "INR"): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents) / 100;
  try {
    return (
      sign +
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        currencyDisplay: "narrowSymbol",
      }).format(abs)
    );
  } catch {
    return `${sign}${currency} ${abs.toFixed(2)}`;
  }
}
