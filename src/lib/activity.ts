import { prisma } from "@/lib/prisma";

export type ActivityItem =
  | {
      type: "expense";
      id: string;
      date: Date;
      description: string;
      amountCents: number;
      currency: string;
      category: string;
      paidById: string;
      paidByName: string;
      groupId: string | null;
      groupName: string | null;
      myShareCents: number;
    }
  | {
      type: "payment";
      id: string;
      date: Date;
      amountCents: number;
      currency: string;
      fromUserId: string;
      fromUserName: string;
      toUserId: string;
      toUserName: string;
      groupId: string | null;
      groupName: string | null;
    };

export async function getPairActivity(
  userId: string,
  otherId: string
): Promise<ActivityItem[]> {
  const expenses = await prisma.expense.findMany({
    where: {
      AND: [
        { shares: { some: { userId } } },
        { shares: { some: { userId: otherId } } },
      ],
    },
    orderBy: { date: "desc" },
    include: {
      paidBy: true,
      group: true,
      shares: { where: { userId } },
    },
  });

  const payments = await prisma.payment.findMany({
    where: {
      OR: [
        { fromUserId: userId, toUserId: otherId },
        { fromUserId: otherId, toUserId: userId },
      ],
    },
    orderBy: { date: "desc" },
    include: { fromUser: true, toUser: true, group: true },
  });

  const items: ActivityItem[] = [
    ...expenses.map((e) => ({
      type: "expense" as const,
      id: e.id,
      date: e.date,
      description: e.description,
      amountCents: e.amountCents,
      currency: e.currency,
      category: e.category,
      paidById: e.paidById,
      paidByName: e.paidBy.name,
      groupId: e.groupId,
      groupName: e.group?.name ?? null,
      myShareCents: e.shares[0]?.shareCents ?? 0,
    })),
    ...payments.map((p) => ({
      type: "payment" as const,
      id: p.id,
      date: p.date,
      amountCents: p.amountCents,
      currency: p.currency,
      fromUserId: p.fromUserId,
      fromUserName: p.fromUser.name,
      toUserId: p.toUserId,
      toUserName: p.toUser.name,
      groupId: p.groupId,
      groupName: p.group?.name ?? null,
    })),
  ];

  items.sort((a, b) => b.date.getTime() - a.date.getTime());
  return items;
}

export async function getGroupActivity(
  groupId: string,
  currentUserId: string
): Promise<ActivityItem[]> {
  const expenses = await prisma.expense.findMany({
    where: { groupId },
    orderBy: { date: "desc" },
    include: {
      paidBy: true,
      group: true,
      shares: { where: { userId: currentUserId } },
    },
  });

  const payments = await prisma.payment.findMany({
    where: { groupId },
    orderBy: { date: "desc" },
    include: { fromUser: true, toUser: true, group: true },
  });

  const items: ActivityItem[] = [
    ...expenses.map((e) => ({
      type: "expense" as const,
      id: e.id,
      date: e.date,
      description: e.description,
      amountCents: e.amountCents,
      currency: e.currency,
      category: e.category,
      paidById: e.paidById,
      paidByName: e.paidBy.name,
      groupId: e.groupId,
      groupName: e.group?.name ?? null,
      myShareCents: e.shares[0]?.shareCents ?? 0,
    })),
    ...payments.map((p) => ({
      type: "payment" as const,
      id: p.id,
      date: p.date,
      amountCents: p.amountCents,
      currency: p.currency,
      fromUserId: p.fromUserId,
      fromUserName: p.fromUser.name,
      toUserId: p.toUserId,
      toUserName: p.toUser.name,
      groupId: p.groupId,
      groupName: p.group?.name ?? null,
    })),
  ];

  items.sort((a, b) => b.date.getTime() - a.date.getTime());
  return items;
}

export async function getRecentActivity(
  userId: string,
  limit = 15
): Promise<ActivityItem[]> {
  const expenses = await prisma.expense.findMany({
    where: {
      OR: [{ paidById: userId }, { shares: { some: { userId } } }],
    },
    orderBy: { date: "desc" },
    take: limit,
    include: {
      paidBy: true,
      group: true,
      shares: { where: { userId } },
    },
  });

  const payments = await prisma.payment.findMany({
    where: { OR: [{ fromUserId: userId }, { toUserId: userId }] },
    orderBy: { date: "desc" },
    take: limit,
    include: { fromUser: true, toUser: true, group: true },
  });

  const items: ActivityItem[] = [
    ...expenses.map((e) => ({
      type: "expense" as const,
      id: e.id,
      date: e.date,
      description: e.description,
      amountCents: e.amountCents,
      currency: e.currency,
      category: e.category,
      paidById: e.paidById,
      paidByName: e.paidBy.name,
      groupId: e.groupId,
      groupName: e.group?.name ?? null,
      myShareCents: e.shares[0]?.shareCents ?? 0,
    })),
    ...payments.map((p) => ({
      type: "payment" as const,
      id: p.id,
      date: p.date,
      amountCents: p.amountCents,
      currency: p.currency,
      fromUserId: p.fromUserId,
      fromUserName: p.fromUser.name,
      toUserId: p.toUserId,
      toUserName: p.toUser.name,
      groupId: p.groupId,
      groupName: p.group?.name ?? null,
    })),
  ];

  items.sort((a, b) => b.date.getTime() - a.date.getTime());
  return items.slice(0, limit);
}
