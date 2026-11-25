import { prisma } from "@/lib/prisma";

/**
 * Pairwise net balance for a user against every other user they've ever
 * shared an expense or payment with. Positive value = that other user owes
 * the given user; negative = the given user owes them.
 */
export async function computeUserNetMap(
  userId: string
): Promise<Map<string, number>> {
  const net = new Map<string, number>();
  const bump = (other: string, delta: number) => {
    if (other === userId) return;
    net.set(other, (net.get(other) ?? 0) + delta);
  };

  const paidExpenses = await prisma.expense.findMany({
    where: { paidById: userId },
    select: { shares: { select: { userId: true, shareCents: true } } },
  });
  for (const expense of paidExpenses) {
    for (const share of expense.shares) {
      bump(share.userId, share.shareCents);
    }
  }

  const owedExpenses = await prisma.expense.findMany({
    where: { shares: { some: { userId } }, NOT: { paidById: userId } },
    select: {
      paidById: true,
      shares: { where: { userId }, select: { shareCents: true } },
    },
  });
  for (const expense of owedExpenses) {
    const myShare = expense.shares[0];
    if (myShare) bump(expense.paidById, -myShare.shareCents);
  }

  const paymentsOut = await prisma.payment.findMany({
    where: { fromUserId: userId },
    select: { toUserId: true, amountCents: true },
  });
  for (const payment of paymentsOut) {
    bump(payment.toUserId, payment.amountCents);
  }

  const paymentsIn = await prisma.payment.findMany({
    where: { toUserId: userId },
    select: { fromUserId: true, amountCents: true },
  });
  for (const payment of paymentsIn) {
    bump(payment.fromUserId, -payment.amountCents);
  }

  return net;
}

export async function getPairwiseBalance(
  userId: string,
  otherUserId: string
): Promise<number> {
  const map = await computeUserNetMap(userId);
  return map.get(otherUserId) ?? 0;
}

/** Each member's overall net position within a single group (positive = owed money). */
export async function computeGroupMemberBalances(
  groupId: string
): Promise<Map<string, number>> {
  const net = new Map<string, number>();
  const bump = (userId: string, delta: number) => {
    net.set(userId, (net.get(userId) ?? 0) + delta);
  };

  const expenses = await prisma.expense.findMany({
    where: { groupId },
    select: {
      paidById: true,
      amountCents: true,
      shares: { select: { userId: true, shareCents: true } },
    },
  });
  for (const expense of expenses) {
    bump(expense.paidById, expense.amountCents);
    for (const share of expense.shares) {
      bump(share.userId, -share.shareCents);
    }
  }

  const payments = await prisma.payment.findMany({
    where: { groupId },
    select: { fromUserId: true, toUserId: true, amountCents: true },
  });
  for (const payment of payments) {
    bump(payment.fromUserId, -payment.amountCents);
    bump(payment.toUserId, payment.amountCents);
  }

  return net;
}

export type SimplifiedTransaction = {
  fromUserId: string;
  toUserId: string;
  amountCents: number;
};

/**
 * Greedily matches the biggest debtor with the biggest creditor until every
 * balance is settled, minimizing the number of payments needed.
 */
export function simplifyDebts(
  balances: Map<string, number>
): SimplifiedTransaction[] {
  const creditors: { userId: string; amount: number }[] = [];
  const debtors: { userId: string; amount: number }[] = [];

  for (const [userId, amount] of balances) {
    if (amount > 0) creditors.push({ userId, amount });
    else if (amount < 0) debtors.push({ userId, amount: -amount });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions: SimplifiedTransaction[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 0) {
      transactions.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amountCents: amount,
      });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount === 0) i++;
    if (creditor.amount === 0) j++;
  }

  return transactions;
}
