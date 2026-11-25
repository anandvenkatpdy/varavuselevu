"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { computeShares, type SplitType } from "@/lib/split";
import { toCents } from "@/lib/money";
import type { ActionState } from "./types";

export async function createExpense(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const me = await requireCurrentUser();

  const description = String(formData.get("description") ?? "").trim();
  const amount = parseFloat(String(formData.get("amount") ?? ""));
  const category = String(formData.get("category") ?? "GENERAL");
  const splitType = String(formData.get("splitType") ?? "EQUAL") as SplitType;
  const paidById = String(formData.get("paidById") ?? me.id);
  const groupId = (String(formData.get("groupId") ?? "") || null) as
    | string
    | null;
  const dateValue = String(formData.get("date") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "/dashboard");
  const participantIds = formData.getAll("participantIds").map(String);

  if (!description) return { error: "Description is required." };
  if (!amount || amount <= 0) return { error: "Amount must be greater than 0." };
  if (participantIds.length === 0)
    return { error: "Select at least one person to split with." };

  const totalCents = toCents(amount);

  const inputs = participantIds.map((userId) => ({
    userId,
    value:
      splitType === "EQUAL"
        ? undefined
        : parseFloat(String(formData.get(`value_${userId}`) ?? "0")) || 0,
  }));

  let shares;
  try {
    shares = computeShares(splitType, totalCents, inputs);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Invalid split." };
  }

  await prisma.expense.create({
    data: {
      description,
      amountCents: totalCents,
      category: category as never,
      splitType: splitType as never,
      date: dateValue ? new Date(dateValue) : new Date(),
      paidById,
      createdById: me.id,
      groupId,
      shares: {
        create: shares.map((s) => ({
          userId: s.userId,
          shareCents: s.shareCents,
          rawInput: s.rawInput,
        })),
      },
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/friends");
  revalidatePath("/groups");
  if (groupId) revalidatePath(`/groups/${groupId}`);
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function deleteExpense(formData: FormData) {
  await requireCurrentUser();
  const id = String(formData.get("id") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "/dashboard");
  if (!id) return;

  const expense = await prisma.expense.findUnique({ where: { id } });
  await prisma.expense.delete({ where: { id } });

  revalidatePath("/dashboard");
  revalidatePath("/friends");
  revalidatePath("/groups");
  if (expense?.groupId) revalidatePath(`/groups/${expense.groupId}`);
  revalidatePath(returnTo);
  redirect(returnTo);
}
