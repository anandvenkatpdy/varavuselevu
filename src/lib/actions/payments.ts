"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { toCents } from "@/lib/money";
import type { ActionState } from "./types";

export async function recordPayment(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireCurrentUser();

  const fromUserId = String(formData.get("fromUserId") ?? "");
  const toUserId = String(formData.get("toUserId") ?? "");
  const amount = parseFloat(String(formData.get("amount") ?? ""));
  const currency = String(formData.get("currency") ?? "INR");
  const note = String(formData.get("note") ?? "").trim() || null;
  const groupId = (String(formData.get("groupId") ?? "") || null) as
    | string
    | null;
  const returnTo = String(formData.get("returnTo") ?? "/dashboard");

  if (!fromUserId || !toUserId || fromUserId === toUserId) {
    return { error: "Choose two different people." };
  }
  if (!amount || amount <= 0) {
    return { error: "Amount must be greater than 0." };
  }

  await prisma.payment.create({
    data: {
      fromUserId,
      toUserId,
      amountCents: toCents(amount),
      currency,
      note,
      groupId,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/friends");
  revalidatePath("/groups");
  if (groupId) revalidatePath(`/groups/${groupId}`);
  revalidatePath(returnTo);
  redirect(returnTo);
}
