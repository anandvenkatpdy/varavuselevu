import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeGroupMemberBalances } from "@/lib/balances";
import BalanceText from "@/components/BalanceText";
import CreateGroupForm from "./CreateGroupForm";

export default async function GroupsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const friendships = await prisma.friendship.findMany({
    where: { OR: [{ userAId: user.id }, { userBId: user.id }] },
    include: { userA: true, userB: true },
  });
  const friends = friendships.map((f) =>
    f.userAId === user.id ? f.userB : f.userA
  );

  const memberships = await prisma.groupMember.findMany({
    where: { userId: user.id },
    include: { group: { include: { members: true } } },
    orderBy: { joinedAt: "desc" },
  });

  const groupBalances = await Promise.all(
    memberships.map(async (m) => {
      const balances = await computeGroupMemberBalances(m.groupId);
      return { group: m.group, myBalance: balances.get(user.id) ?? 0 };
    })
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Groups</h1>

      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-zinc-900">Create a group</h2>
        <CreateGroupForm friends={friends} />
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        {groupBalances.length === 0 ? (
          <p className="text-sm text-zinc-500">You&apos;re not in any groups yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {groupBalances.map(({ group, myBalance }) => (
              <li key={group.id} className="flex items-center justify-between py-3">
                <div>
                  <Link
                    href={`/groups/${group.id}`}
                    className="font-medium text-zinc-900 hover:text-emerald-700"
                  >
                    {group.name}
                  </Link>
                  <p className="text-xs text-zinc-500">
                    {group.members.length} member
                    {group.members.length === 1 ? "" : "s"} · {group.currency}
                  </p>
                </div>
                <BalanceText amountCents={myBalance} currency={group.currency} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
