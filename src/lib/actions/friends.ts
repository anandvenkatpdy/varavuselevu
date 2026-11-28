"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import type { ActionState } from "./types";

function pairKey(a: string, b: string) {
  return a < b ? { userAId: a, userBId: b } : { userAId: b, userBId: a };
}

export async function addFriend(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const me = await requireCurrentUser();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email) return { error: "Email is required." };
  if (email === me.email) return { error: "You can't add yourself." };

  let friend = await prisma.user.findUnique({ where: { email } });
  if (!friend) {
    friend = await prisma.user.create({
      data: {
        name: name || email.split("@")[0],
        email,
        passwordHash: "SHADOW",
      },
    });
  }

  const key = pairKey(me.id, friend.id);
  await prisma.friendship.upsert({
    where: { userAId_userBId: key },
    update: {},
    create: key,
  });

  revalidatePath("/friends");
  revalidatePath("/dashboard");
  return { error: null, success: true };
}
