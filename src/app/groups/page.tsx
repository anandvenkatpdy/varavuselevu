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
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-zinc-900">Groups</h1>

      <div className="rounded-2xl bg-white border border-zinc-100 p-4">
        <h2 className="text-sm font-semibold text-zinc-700 mb-3">Create a group</h2>
        <CreateGroupForm friends={friends} />
      </div>

      {groupBalances.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-8">No groups yet. Create one above.</p>
      ) : (
        <div className="rounded-2xl bg-white border border-zinc-100 divide-y divide-zinc-100">
          {groupBalances.map(({ group, myBalance }) => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                  {group.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900">{group.name}</p>
                  <p className="text-xs text-zinc-400">
                    {group.members.length} member{group.members.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <BalanceText amountCents={myBalance} currency={group.currency} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
