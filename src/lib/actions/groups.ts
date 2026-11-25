"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import type { ActionState } from "./types";

export async function createGroup(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const me = await requireCurrentUser();
  const name = String(formData.get("name") ?? "").trim();
  const currency = String(formData.get("currency") ?? "INR").trim() || "INR";
  const memberIds = formData.getAll("memberIds").map(String);

  if (!name) return { error: "Group name is required." };

  const uniqueMemberIds = Array.from(new Set([me.id, ...memberIds]));

  const group = await prisma.group.create({
    data: {
      name,
      currency,
      members: {
        create: uniqueMemberIds.map((userId) => ({ userId })),
      },
    },
  });

  revalidatePath("/groups");
  redirect(`/groups/${group.id}`);
}

export async function addGroupMember(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireCurrentUser();
  const groupId = String(formData.get("groupId") ?? "");
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim();

  if (!groupId || !email) return { error: "Email is required." };

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { name: name || email.split("@")[0], email, passwordHash: "SHADOW" },
    });
  }

  await prisma.groupMember.upsert({
    where: { groupId_userId: { groupId, userId: user.id } },
    update: {},
    create: { groupId, userId: user.id },
  });

  revalidatePath(`/groups/${groupId}`);
  return { error: null };
}
