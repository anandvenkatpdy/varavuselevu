export type SplitType = "EQUAL" | "EXACT" | "PERCENT" | "SHARES";

export type SplitInput = {
  userId: string;
  value?: number; // exact cents, percent, or share count depending on type
};

export type ComputedShare = {
  userId: string;
  shareCents: number;
  rawInput: number | null;
};

/** Distributes any leftover cents (from rounding) one at a time, in order. */
function distributeRemainder(
  base: number[],
  totalCents: number
): number[] {
  const sum = base.reduce((a, b) => a + b, 0);
  let remainder = totalCents - sum;
  const result = [...base];
  let idx = 0;
  const step = remainder > 0 ? 1 : -1;
  while (remainder !== 0 && result.length > 0) {
    result[idx % result.length] += step;
    remainder -= step;
    idx++;
  }
  return result;
}

export function computeShares(
  type: SplitType,
  totalCents: number,
  participants: SplitInput[]
): ComputedShare[] {
  const n = participants.length;
  if (n === 0) return [];

  if (type === "EQUAL") {
    const base = Math.floor(totalCents / n);
    const amounts = distributeRemainder(
      new Array(n).fill(base),
      totalCents
    );
    return participants.map((p, i) => ({
      userId: p.userId,
      shareCents: amounts[i],
      rawInput: null,
    }));
  }

  if (type === "EXACT") {
    const amounts = participants.map((p) => Math.round((p.value ?? 0) * 100));
    const sum = amounts.reduce((a, b) => a + b, 0);
    if (sum !== totalCents) {
      throw new Error(
        `Exact amounts must add up to the total (got ${(sum / 100).toFixed(
          2
        )}, expected ${(totalCents / 100).toFixed(2)})`
      );
    }
    return participants.map((p, i) => ({
      userId: p.userId,
      shareCents: amounts[i],
      rawInput: p.value ?? 0,
    }));
  }

  if (type === "PERCENT") {
    const percents = participants.map((p) => p.value ?? 0);
    const sumPercent = percents.reduce((a, b) => a + b, 0);
    if (Math.abs(sumPercent - 100) > 0.01) {
      throw new Error(
        `Percentages must add up to 100 (got ${sumPercent.toFixed(2)})`
      );
    }
    const base = percents.map((pct) => Math.floor((totalCents * pct) / 100));
    const amounts = distributeRemainder(base, totalCents);
    return participants.map((p, i) => ({
      userId: p.userId,
      shareCents: amounts[i],
      rawInput: percents[i],
    }));
  }

  if (type === "SHARES") {
    const shares = participants.map((p) => p.value ?? 0);
    const totalShares = shares.reduce((a, b) => a + b, 0);
    if (totalShares <= 0) {
      throw new Error("Total shares must be greater than zero");
    }
    const base = shares.map((s) =>
      Math.floor((totalCents * s) / totalShares)
    );
    const amounts = distributeRemainder(base, totalCents);
    return participants.map((p, i) => ({
      userId: p.userId,
      shareCents: amounts[i],
      rawInput: shares[i],
    }));
  }

  throw new Error(`Unknown split type: ${type}`);
}
